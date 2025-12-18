import os
import io
import re
import json
from datetime import datetime
import tempfile
import cv2
from dateutil import parser
import numpy as np
import pandas as pd
import PyPDF2
from PIL import Image
import docx2txt  # ou utilizar o docx2txt para extração
import filetype  # pip install filetype
from celery import shared_task
from channels.layers import get_channel_layer
from api.ias.ias import chat_gpt

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from google.cloud import vision  # Biblioteca do Google Cloud Vision
from google.oauth2 import service_account
from asgiref.sync import sync_to_async, async_to_sync

from boomerangue.apps.validacao_documentos.models import validacao_documentos
from boomerangue.apps.wpp_templates.models import ia_geracao
from .seriealizers import validacao_documentosSerializer
from boomerangue.apps.ger_empresas.models import ger_empresas


class DocumentValidator:
    @staticmethod
    def extract_text_from_pdf(pdf_file):
        try:
            pdf_file.seek(0)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            text = ""
            for page in pdf_reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text
            print("Texto extraído do PDF:", text)
            return text
        except Exception as e:
            print(f"Erro ao extrair texto do PDF: {str(e)}")
            return ""

    @staticmethod
    def extract_text_from_image(image_file):
        try:
            image_file.seek(0)
            image = Image.open(image_file)
            # Neste exemplo, optamos por utilizar apenas o Google Cloud Vision para extração
            BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            credentials_path = os.path.join(BASE_DIR, 'gedarchivio-70a6574f5e92.json')
            credentials = service_account.Credentials.from_service_account_file(credentials_path)
            client = vision.ImageAnnotatorClient(credentials=credentials)

            with io.BytesIO() as output:
                image.save(output, format="JPEG")
                image_bytes = output.getvalue()
            google_image = vision.Image(content=image_bytes)
            response_google = client.text_detection(image=google_image)
            text = response_google.full_text_annotation.text
            return text.strip()
        except Exception as e:
            print(f"Erro ao extrair texto da imagem: {str(e)}")
            return ""

    @staticmethod
    def extract_text_from_docx(docx_file):
        try:
            temp_path = 'temp_docx_file.docx'
            with open(temp_path, 'wb') as f:
                docx_file.seek(0)
                f.write(docx_file.read())
            text = docx2txt.process(temp_path)
            os.remove(temp_path)
            print("Texto extraído do DOCX:", text)
            return text.strip()
        except Exception as e:
            print(f"Erro ao extrair texto do DOCX: {str(e)}")
            return ""


    @staticmethod
    def extract_text(doc_file):
        """Determina o tipo do arquivo e extrai o texto correspondente."""
        print("docFile", doc_file)
        
        # Salva o ponteiro atual do arquivo
        current_position = doc_file.tell()
        
        # Lê os primeiros bytes do arquivo para identificar seu tipo
        file_content = doc_file.read(2048)
        kind = filetype.guess(file_content)
        
        # Retorna o ponteiro para a posição original
        doc_file.seek(current_position)
        
        if kind is None:
            print("Tipo de arquivo não identificado")
            return DocumentValidator.extract_text_from_image(doc_file)
            
        file_type = kind.mime
        print(f"Tipo de arquivo detectado: {file_type}")
        
        if file_type == 'application/pdf':
            return DocumentValidator.extract_text_from_pdf(doc_file)
        elif file_type in ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']:
            return DocumentValidator.extract_text_from_docx(doc_file)
        elif file_type.startswith('image/'):
            return DocumentValidator.extract_text_from_image(doc_file)
        else:
            print(f"Tipo de arquivo não identificado explicitamente ({file_type}). Tentando como imagem.")
            return DocumentValidator.extract_text_from_image(doc_file)

    @staticmethod
    def extract_info_from_text(text):
        # Padrões de regex para extração de informações
        patterns = {
            'cpf': r'\d{3}[\.]?\d{3}[\.]?\d{3}[-]?\d{2}',
            'nome': r'(?i)(?:nome(?:\s+completo)?)[\s:]+([\w\s]+)',
            'data_nascimento': r'(?i)(?:data\s+de\s+nascimento|nascimento|nasc)[\s:]+(\d{2}[-/]\d{2}[-/]\d{4})',
            'rg': r'(?i)(?:rg|registro[\s]*geral|identidade)[\s:]+([\d\.]+(?:-?[A-Za-z0-9]+)?)',
        }
        extracted_info = {}
        print("\nIniciando extração de informações do texto...")
        for key, pattern in patterns.items():
            match = re.search(pattern, text, re.MULTILINE | re.IGNORECASE)
            if match:
                value = match.group(1).strip() if match.lastindex else match.group(0).strip()
                value = re.sub(r'\s+', ' ', value)
                extracted_info[key] = value
                print(f"Campo '{key}' encontrado: '{value}'")
            else:
                print(f"Campo '{key}' não encontrado no texto")
        # Capturar a filiação (nomes dos pais)
        filiacao_match = re.search(r'(?i)filia[çc]ão\s*\n([^\n]+)\n([^\n]+)', text, re.MULTILINE | re.IGNORECASE)
        if filiacao_match:
            extracted_info['nome_pai'] = filiacao_match.group(1).strip()
            extracted_info['nome_mae'] = filiacao_match.group(2).strip()
            print(f"Nome do pai: {extracted_info['nome_pai']}")
            print(f"Nome da mãe: {extracted_info['nome_mae']}")
        else:
            print("Campos 'nome_pai' e 'nome_mae' não encontrados na filiação")
        return extracted_info
    
    @staticmethod
    def tratar_texto(texto):
        """Remove pontos, traços e transforma o texto em minúsculas para padronização."""
        return re.sub(r'[^\w]', '', str(texto).lower())

    @staticmethod
    def tratar_data(data):
        """
        Converte uma data em formato padronizado (DD/MM/YYYY).
        Aceita múltiplos formatos de entrada e remove timestamp.
        
        Args:
            data (str/datetime/Timestamp): Data em formato desconhecido.

        Returns:
            str: Data padronizada no formato 'DD/MM/YYYY' ou o texto original caso não seja uma data válida.
        """
        if pd.isna(data):
            return ''
            
        try:
            # Handle Timestamp objects specifically
            if isinstance(data, pd.Timestamp):
                return data.strftime('%d/%m/%Y')
                
            # Convert string or other datetime objects
            if isinstance(data, str):
                parsed_date = parser.parse(data)
            else:
                parsed_date = pd.to_datetime(data)
            
            return parsed_date.strftime('%d/%m/%Y')
        except (ValueError, TypeError):
            return str(data)

    @staticmethod
    def comparar_dados(dados_excel, texto_ocr):
        """
        Compara os dados de um Excel com o texto extraído do OCR.
        
        Args:
            dados_excel (dict): Dados de uma linha do Excel.
            texto_ocr (str): Texto extraído do OCR.

        Returns:
            dict: Resultados da comparação, campo a campo.
        """
        resultados = {}
        
        # Mantenha uma cópia do texto original antes de qualquer tratamento
        texto_ocr_original = texto_ocr
        texto_ocr_tratado = DocumentValidator.tratar_texto(texto_ocr)

        for campo, valor_excel in dados_excel.items():
            if pd.isna(valor_excel):
                continue
                
            # Trata campos de data especialmente
            if "data" in campo.lower():
                # Formata a data do Excel para DD/MM/YYYY
                data_excel = DocumentValidator.tratar_data(valor_excel)
                
                # Primeiro, tenta encontrar a data exata no texto original
                if data_excel in texto_ocr_original:
                    resultados[campo] = f"OK: Data '{data_excel}' encontrada no OCR."
                    continue
                
                # Se não encontrou, tenta converter para datetime e tentar outros formatos
                try:
                    data_dt = parser.parse(data_excel)
                    formatos_possiveis = [
                        data_dt.strftime('%d/%m/%Y'),
                        data_dt.strftime('%d-%m-%Y'),
                        data_dt.strftime('%Y-%m-%d'),
                        data_dt.strftime('%d.%m.%Y'),
                        data_dt.strftime('%d %m %Y'),
                    ]
                    
                    data_encontrada = False
                    for formato in formatos_possiveis:
                        if formato in texto_ocr_original:
                            data_encontrada = True
                            break
                    
                    if data_encontrada:
                        resultados[campo] = f"OK: Data '{data_excel}' encontrada no OCR."
                    else:
                        # Para debug
                        print(f"Data do Excel (formatada): {data_excel}")
                        print(f"Texto OCR: {texto_ocr_original}")
                        print(f"Formatos testados: {formatos_possiveis}")
                        resultados[campo] = f"Erro: Data '{data_excel}' não encontrada no OCR."
                except Exception as e:
                    print(f"Erro ao processar data: {str(e)}")
                    resultados[campo] = f"Erro: Formato de data inválido '{valor_excel}'"
            else:
                # Para outros campos, mantém a lógica original
                valor_excel_tratado = DocumentValidator.tratar_texto(str(valor_excel))
                
                if valor_excel_tratado in texto_ocr_tratado:
                    resultados[campo] = f"OK: '{valor_excel}' encontrado no OCR."
                else:
                    resultados[campo] = f"Erro: '{valor_excel}' não encontrado no OCR."

        return resultados



class validacao_documentosViewSet(viewsets.ModelViewSet):
    queryset = validacao_documentos.objects.all()
    serializer_class = validacao_documentosSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['POST'])
    def validate_documents(self, request):
        try:
            # Processa o arquivo Excel
            excel_file = request.FILES.get('excel_file')
            empresa = request.user.empresa
            if not excel_file:
                return Response({'error': 'Excel file is required'}, status=status.HTTP_400_BAD_REQUEST)
            try:
                df = pd.read_excel(excel_file)
                excel_records = df.to_dict(orient='records')
                print("\nDados do Excel:", excel_records)
            except Exception as e:
                return Response({'error': f'Erro ao ler o arquivo Excel: {str(e)}'},
                                status=status.HTTP_400_BAD_REQUEST)

            # Obtém os arquivos de documento (buscando em 'document_files' ou chaves numeradas)
            doc_files = request.FILES.getlist('document_files')
            if not doc_files:
                doc_files = []
                index = 0
                while True:
                    file_obj = request.FILES.get(f'document_file_{index}')
                    if not file_obj:
                        break
                    doc_files.append(file_obj)
                    index += 1

            if not doc_files:
                return Response({'error': 'No document files provided.'}, status=status.HTTP_400_BAD_REQUEST)

            # Salva os arquivos temporariamente e cria uma lista de caminhos
            temp_file_paths = []
            for file_obj in doc_files:
                temp_file = tempfile.NamedTemporaryFile(delete=False)
                for chunk in file_obj.chunks():
                    temp_file.write(chunk)
                temp_file.close()
                temp_file_paths.append(temp_file.name)

            # Passa os caminhos para a task
            self.task_validation.delay(excel_records, temp_file_paths, empresa.id)
            return Response({'success': 'Validação em andamento.'}, status=status.HTTP_202_ACCEPTED)
        except Exception as e:
            print(f"Erro na validação: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
    @shared_task
    def task_validation(excel_records, temp_file_paths, empresa):
        try:
            # Recupera a instância da empresa se necessário

            validations = []
            validator = DocumentValidator()

            # Reabre os arquivos a partir dos caminhos salvos
            doc_files = []
            for file_path in temp_file_paths:
                with open(file_path, 'rb') as f:
                    # Cria um objeto semelhante a InMemoryUploadedFile se necessário, ou use o próprio objeto file.
                    # Aqui estamos usando o conteúdo do arquivo para criar um BytesIO, por exemplo:
                    from io import BytesIO
                    file_bytes = BytesIO(f.read())
                    file_bytes.name = file_path  # para manter o nome, se necessário
                    doc_files.append(file_bytes)
                # Opcionalmente, após o processamento, você pode remover o arquivo temporário
                os.remove(file_path)

            # (Resto do código de processamento, similar ao que já tinha)
            if len(doc_files) == len(excel_records):
                for idx, doc_file in enumerate(doc_files):
                    excel_row = excel_records[idx]
                    validation_result = validacao_documentosViewSet.process_document(doc_file, excel_row, validator, empresa)
                    validations.append(validation_result)
            else:
                for doc_file in doc_files:
                    text = validator.extract_text(doc_file)
                    extracted_info = validator.extract_info_from_text(text)
                    cpf_doc = extracted_info.get('cpf', '').replace('.', '').replace('-', '').strip()
                    matching_row = None
                    for row in excel_records:
                        cpf_excel = str(row.get('CPF', '')).replace('.', '').replace('-', '').strip()
                        if cpf_excel and cpf_doc and cpf_excel == cpf_doc:
                            matching_row = row
                            break
                    if not matching_row:
                        matching_row = {}
                    validation_result = validacao_documentosViewSet.process_document(doc_file, matching_row, validator, empresa)
                    validations.append(validation_result)

            response_data = {
                'validations': validations
            }
            # Aqui, você pode retornar o resultado para logs ou persistir no banco, mas lembre-se que tasks do Celery
            # não retornam Response do Django.
            channel_layer = get_channel_layer()

            async_to_sync(channel_layer.group_send)(f"chat_{empresa}", {
                'type': 'return_validation',
                'response': response_data
            })
            return response_data

        except Exception as e:
            print(f"Erro na validação: {str(e)}")
            return {'error': str(e)}

    def process_document(doc_file, excel_row, validator, empresa):
        """
        Processa um documento: extrai o texto, extrai informações, compara com os dados do Excel usando a IA,
        e cria o registro de validação.
        """
        print(f"\nProcessando documento: {doc_file}")
        text = validator.extract_text(doc_file)
        print("TEXTO EXTRAIDO", text)
        extracted_info = validator.extract_info_from_text(text)
        print("Extracted_info", extracted_info)
        # Realiza a comparação utilizando a IA
        # discrepancies = validator.comparation_in_ia(empresa, text, excel_row)
        teste = validator.comparar_dados(excel_row, text)
        print("teste", teste)

        # Filtrar apenas os resultados com erro
        filtered_discrepancies = {campo: resultado for campo, resultado in teste.items() if "Erro" in resultado}
        print("Discrepâncias filtradas:", filtered_discrepancies)

        # Define se o documento é válido (sem discrepâncias) ou não
        documento_valido = 'S' if not filtered_discrepancies else 'N'
        try:
            validation_record = validacao_documentos.objects.create(
                nome=excel_row.get('Nome') if excel_row else extracted_info.get('nome', ''),
                data_nascimento=excel_row.get('Data Nascimento') if excel_row else extracted_info.get('data_nascimento', ''),
                cpf=excel_row.get('CPF') if excel_row else extracted_info.get('cpf', ''),
                nome_mae=excel_row.get('Mãe') if excel_row else extracted_info.get('nome_mae', ''),
                nome_pai=excel_row.get('Pai') if excel_row else extracted_info.get('nome_pai', ''),
                documento_valido=documento_valido,
                statusregistro_id=200
            )
        except Exception as e:
            print(f"Erro ao criar registro de validação: {str(e)}")
            validation_record = None

        return {
            'discrepancies': filtered_discrepancies
        }

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.exclusao_dt = datetime.now()
        instance.statusregistro_id = 9000
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

