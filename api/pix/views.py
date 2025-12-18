import requests
import qrcode
import json
import os
import time
from django.db.models import Q
from datetime import datetime, timedelta, timezone
from dateutil.parser import isoparse
from django.http import JsonResponse
from django.db import transaction
from django.views.decorators.csrf import csrf_exempt
from boomerangue.apps.pix_transactions.models import LogSolicitacaoPagamento, SolicitacaoPagamento
from boomerangue.apps.pix_database.models import PixEvent, PixRequest
from boomerangue.apps.ger_entidades.models import ger_entidade, ger_empresas
from boomerangue.apps.campaign.models import bmm_campanha, bmm_boomerangue
import re
from decimal import Decimal


BBPIX_URL = "https://pix.plugue.co"


def login_bbpix():
    endpoint = f'{BBPIX_URL}/user/login'
    body = {   
            "username": "geralPlugue",
            "password": "Plugue@123"
    }
    for attempt in range(3):  # Tentar 3 vezes
        r = requests.post(endpoint, json=body)
        if r.status_code == 200:
            data = r.json()
            return data['access_token']
        else:
            time.sleep(2)  # Esperar 2 segundos antes de tentar novamente
            print("falhou")
            
class ErroCriarPix(Exception):
    def __init__(self, message) -> None:
        super().__init__(message)

def criar_pix(boomerangue, valor, retry=0):
    try:
        endpoint = f'{BBPIX_URL}/bb/pix/'
        gateway = boomerangue.campanha.gateway_pagamento
        debtor_cpf = boomerangue.entidade.CNPJNumerico
        debtor_name = boomerangue.entidade.Entidade
        pix_key = boomerangue.campanha.gateway_pagamento.pix_key
        wasabi_crt_url = boomerangue.campanha.gateway_pagamento.certificados_url
        wasabi_crt_pass_url = boomerangue.campanha.gateway_pagamento.certificados_senhas_url
        client_id = boomerangue.campanha.gateway_pagamento.client_id
        client_secret = boomerangue.campanha.gateway_pagamento.client_secret
        dev_key = boomerangue.campanha.gateway_pagamento.dev_key
        expiration = boomerangue.campanha.gateway_pagamento.expiration_time
        body = {

            'debtor_cpf': debtor_cpf,
            "debtor_name": debtor_name,
            "value": valor,
            "pix_key": pix_key,
            "callback_url": "https://localhost/",
            "wasabi_crt_url": wasabi_crt_url,
            "wasabi_crt_pass_url": wasabi_crt_pass_url,
            'client_id': client_id,
            "client_secret": client_secret,
            "dev_key": dev_key,
            "expiration": expiration
        }
        access_token = login_bbpix()
        
        print("BODY CRIAR PIX", body)

        r = requests.post(endpoint, json=body, headers={"Authorization": f"Bearer {access_token}"})

        data = r.json()
        print(data)

        # Verifica se o status é diferente de 200 e trata o erro
        if data['payment_charge'].get('error'):
            error_message = ''
            if data['payment_charge'].get('userHelp'):
                error_message = data['payment_charge'].get('userHelp', 'Erro desconhecido')
            elif data['payment_charge'].get('error'):
                error_message = data['payment_charge'].get('message', 'Erro desconhecido')
            LogSolicitacaoPagamento.objects.create(
                boomerangue=boomerangue,
                mensagem=error_message,
                acao='Criação da cobrança PIX',
            )
            PixEvent.objects.using('pix_db').create(
                request=pix_req,
                event_type='Falha Ao criar pix',
                event_description=f'Falha ao criar pix! Usuário: {boomerangue.entidade.Entidade}',
            )
                
            return False
        else:
            try:
                expire_at_seconds = data['payment_charge']['calendario']['expiracao']
                data_vencimento = datetime.now() + timedelta(seconds=expire_at_seconds)
                valor_pix = data['payment_charge']['valor']['original'] or '0.00' 
                charge = SolicitacaoPagamento.objects.create(
                    boomerangue=boomerangue,
                    tipo_pagamento='PIX',
                    valor=valor_pix,
                    conta=gateway,
                    recorrencia='UNICO',
                    empresa=boomerangue.empresa,
                    expire_at=data['payment_charge']['calendario']['expiracao'],
                    id_txid=data['payment_charge']['txid'],
                    copia_e_cola=data['payment_charge']['pixCopiaECola'],
                    data_vencimento=data_vencimento
                )
                
                print("CHARGE", charge)
                pix_req = PixRequest.objects.using('pix_db').create(
                        amount = valor_pix,
                        txid = data['payment_charge']['txid'],
                        status = 'PENDING',
                        data_expiracao = data_vencimento,
                        cpf = boomerangue.entidade.CNPJNumerico,
                        nome_pagador = boomerangue.entidade.Entidade,
                        empresa = int(boomerangue.empresa.id),
                        boomerangue = int(boomerangue.id),
                        # campanha = int(boomerangue.campanha.id)
                    )
                
                
                PixEvent.objects.using('pix_db').create(
                    request=pix_req.id,
                    event_type='Pix Criado',
                    event_description=f'Pix criado! Valor {valor_pix}, Usuário: {boomerangue.entidade.Entidade}',

                )
                
                if charge.pk:
                    LogSolicitacaoPagamento.objects.create(
                        solicitacao_pagamento=charge,
                        boomerangue=boomerangue,
                        mensagem="Pix Criado com sucesso",
                        acao='Criação da cobrança PIX',
                    )

                else:
                    LogSolicitacaoPagamento.objects.create(
                        boomerangue=boomerangue,
                        mensagem="Falha ao criar solicitação de pagamento",
                        acao='Criação da cobrança PIX',
                    )

                return data
            except Exception as e:
                print("ERRO", e)
                LogSolicitacaoPagamento.objects.create(
                        boomerangue=boomerangue,
                        mensagem=F"Falha ao criar solicitação de pagamento. Erro:{str(e)}",
                        acao='Criação da cobrança PIX',
                    )
                PixEvent.objects.using('pix_db').create(
                        event_type='Falha Ao criar pix',
                        event_description=f'Falha ao criar pix! Usuário: {boomerangue.entidade.Entidade}, Erro:{str(e)}',
                    )
    except Exception as e:
        LogSolicitacaoPagamento.objects.create(
            boomerangue=boomerangue,
            mensagem=F"Falha ao criar solicitação de pagamento. Erro:{str(e)}",
            acao='Criação da cobrança PIX',
        )
        PixEvent.objects.using('pix_db').create(
                event_type='Falha Ao criar pix',
                event_description=f'Falha ao criar pix! Usuário: {boomerangue.entidade.Entidade}, Erro:{str(e)}',
            )
        print('erro criar_pix:', e)
        if retry < 5:
            return criar_pix(boomerangue, valor, retry=retry+1)
        else: 
            raise

@csrf_exempt
def gera_qrcode_pix(request, retry=0):
    if request.method != "POST":
        return JsonResponse({"error": "wrong method"}, status=405)

    body: dict = json.loads(request.body)
    print("BODY", body)
    contact_id = body.get("contact_id")
    print("contact_id", contact_id)
    valor_r = body.get("valor")

    valor = parse_valor(valor_r)
    empresa_id = body.get("empresa_id", "8")
    telefone = body.get("number")
    print("EMPRESA_ID =", empresa_id)
    try:
        pix_data = execute(contact_id, empresa_id, valor, telefone)
        return pix_data
    except Exception as e:
        print("ERRO", str(e))
        return JsonResponse({"error": str(e)}, status=500)

def execute(contact_id, empresa_id, valor, telefone):
    lead = get_lead(telefone, contact_id, empresa_id)
    print("ENCONTROU LEAD -", lead.Entidade)
    campanha_id = lead.ultima_campanha_enviada
    campanha = bmm_campanha.objects.get(id=campanha_id)
    boomerangue = bmm_boomerangue.objects.filter(campanha=campanha, entidade=lead).order_by('id').first()
    data = criar_pix(boomerangue, valor)
    print("CRIOU PIX", data)
    txid = data['payment_charge']['txid']
    if data:
        pix_copia_e_cola = data['payment_charge']['pixCopiaECola']

        # Passo 1: Gerar o QR Code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(pix_copia_e_cola)
        qr.make(fit=True)
        img = qr.make_image(fill_color='black', back_color='white')

        # Passo 2: Salvar o QR Code em uma pasta
        pasta_qrcode = 'media/qr_codes'
        if not os.path.exists(pasta_qrcode):
            os.makedirs(pasta_qrcode)

        nome_arquivo = f'qrcode_pix_{txid}.png'
        caminho_arquivo = os.path.join(pasta_qrcode, nome_arquivo)
        img.save(caminho_arquivo)

        print(f'QR Code salvo em: {caminho_arquivo}')

        return JsonResponse({"caminho_arquivo": nome_arquivo, "pix_copia_e_cola": pix_copia_e_cola, 'txid': txid})
    else:
        return JsonResponse({"error": "failed to create pix"}, status=500)

def fix_number(number:str):
    tam = len(number)
    print("NUMBER ENTROU", tam)
    if tam == 10:
        return f"{number[0:2]}9{number[2:]}"
    elif tam == 11:
        return f"{number[0:2]}{number[3:]}"

def parse_number(number: str):
    tam = len(number)
    
    if tam in [10,11]:
        return number
    elif number[0:2] == '55':
        return number[2:]
    elif number[0] == "+":
        return number[3:]



def parse_valor(valor_r: str) -> str:
    # Remover todos os espaços e caracteres não numéricos, exceto vírgulas e pontos
    valor = re.sub(r'[^\d.,]', '', valor_r)
    
    # Verificar se o valor contém tanto ponto quanto vírgula
    if '.' in valor and ',' in valor:
        # Se o último separador for uma vírgula, trocar vírgula por ponto
        if valor.rfind('.') < valor.rfind(','):
            valor = valor.replace('.', '').replace(',', '.')
        else:
            valor = valor.replace(',', '')

    # Se houver apenas vírgula, trocar vírgula por ponto
    elif ',' in valor:
        valor = valor.replace(',', '.')

    # Se houver mais de um ponto e nenhuma vírgula, remover todos os pontos, exceto o último
    elif valor.count('.') > 1:
        valor = valor.replace('.', '', valor.count('.') - 1)
    
    # Converter para Decimal
    try:
        valor_decimal = Decimal(valor)
    except Exception as e:
        raise ValueError(f"Não foi possível converter o valor: {valor}. Erro: {str(e)}")
    
    # Formatar com duas casas decimais
    return f"{valor_decimal:.2f}"


def txid_verification(request) -> dict:
    if request.method != "POST":
        return JsonResponse({"error": "wrong method"}, status=405)

    body: dict = json.loads(request.body)
    print("BODY", body)
    txid = body.get("txid")
    if not txid:
        return JsonResponse({"error": "txid can't be none"}, status=404) 

    try:
        pag = SolicitacaoPagamento.objects.get(txid=txid)
    except:
        return JsonResponse({"error": "txid not found"}, status=404)
    
    return JsonResponse({"status": pag.status}, status=200)

@csrf_exempt
def cpf_verification(request, retry=0):
    if request.method != "POST":
        return JsonResponse({"error": "wrong method"}, status=405)

    body: dict = json.loads(request.body)
    print("BODY", body)
    contact_id = body.get("contact_id")
    print("Contact_id", contact_id)
    telefone = body.get("number")
    empresa_id = body.get("empresa_id", "")
    print("EMPRESA_ID =", empresa_id)
    if not contact_id:
        return JsonResponse({"error": "incomplete request"}, status=400)
    try:
        
        lead = execute_cnpj_verification(telefone,contact_id, empresa_id)
        print("LEAD", lead)
        cnpj = lead.CNPJNumerico
        print("cnpj", cnpj)
        validate = validar_cpf_cnpj(cnpj)
        print(validate)
        
        
        if not validate:
            
            lead.cnpj_valido = 0
            lead.save()
            
            return JsonResponse({
                "telefone": f'{lead.Telefone1}',
                "cpf": None,
                "nome": None,
                "cep": None,
                "uf": None,
                "complemento": None,
                "bairro": None,
                "cidade": None,
                "cpf_valido": 'N'
            }, status=200)
        
        lead.cnpj_valido = 1
        lead.save()
        
        return JsonResponse({
            "telefone": f"{lead.Telefone1}",
            "cpf": f"{lead.CNPJNumerico}",
            "nome": f"{lead.Entidade}",
            "cep": f"{lead.CEP}",
            "uf": f"{lead.uf}",
            "complemento": f"{lead.Complemento}",
            "bairro": f"{lead.Bairro}",
            "cidade": f"{lead.cidade}",
            "cpf_valido": 'S'
        }, status=200)
                
    except Exception as e:
        print("ERRO", str(e))
        return JsonResponse({"error": str(e)}, status=500)
    
@csrf_exempt
def cpf_create(request, retry=0):
    if request.method != "POST":
        return JsonResponse({"error": "wrong method"}, status=405)

    body = json.loads(request.body)
    cnpj = body.get("cnpj", None)
    cnpj_validated = validar_cpf_cnpj(cnpj)
    contact_id = body.get("contact_id")
    empresa_id = body.get("empresa_id")
    telefone = body.get("number")

    if not contact_id:
        return JsonResponse({"error": "incomplete request"}, status=400)

    try:
        lead = execute_cnpj_create(cnpj, contact_id, empresa_id, cnpj_validated, telefone)
        if not lead:
            return JsonResponse({"data": "not updated cnpj"}, status=500)
        
        # Check if lead is None
        if not lead:
            return JsonResponse({"error": "Lead not found"}, status=404)
        
        response_create = {
            "telefone": f"{lead.Telefone1}",
            "cpf": f"{lead.CNPJNumerico}",
            "nome": f"{lead.Entidade}",
            "cep": f"{lead.CEP}",
            "complemento": f"{lead.Complemento}",
            "bairro": f"{lead.Bairro}",
            "cidade": f"{lead.cidade}",
            "cpf_valido": int(lead.cnpj_valido)
        }
        
        print("RESPONSE", response_create)
        
        return JsonResponse(response_create, status=200)

    except Exception as e:
        print("ERRO", str(e))
        return JsonResponse({"error": str(e)}, status=500)

def get_lead(telefone, contact_id, empresa_id):
    
    telefone_sufixo = telefone[-8:]

    if ger_entidade.objects.filter(lead_key_spl=contact_id, empresa_id=empresa_id).exists():
        lead = ger_entidade.objects.filter(lead_key_spl=contact_id, empresa_id=empresa_id).order_by('-id').first()
    
    elif ger_entidade.objects.filter(empresa_id=empresa_id, Telefone1__endswith=telefone_sufixo).exists():
        lead = ger_entidade.objects.filter(empresa_id=empresa_id, Telefone1__endswith=telefone_sufixo).order_by('-id').first()

    print("ENCONTROU LEAD -", lead.Entidade)

    return lead


def execute_cnpj_verification(telefone, contact_id, empresa_id):
    lead = get_lead(telefone, contact_id, empresa_id)  
    return lead


def execute_cnpj_create(cnpj, contact_id, empresa_id, cnpj_validated, telefone):
    lead = get_lead(telefone,contact_id, empresa_id)
    
    if not lead:
        raise ValueError(f"Lead não encontrado para o id {contact_id} e empresa {empresa_id}")

    cpf = re.sub(r'\D', '', cnpj)
    lead.CNPJNumerico = cpf if cnpj_validated else ""
    lead.cnpj_valido = 1 if cnpj_validated else 0
    lead.save()
    return lead



def validar_cpf_cnpj(numero):
    """Valida CPF ou CNPJ."""

    # Remove caracteres não numéricos
    numero = re.sub(r'\D', '', numero)

    # Verifica se o número tem o tamanho correto para CPF ou CNPJ
    if len(numero) == 11:
        return validar_cpf(numero)
    elif len(numero) == 14:
        return validar_cnpj(numero)
    else:
        return False
    
def validar_cnpj(cnpj):
    """Valida CNPJ."""

    # Verifica se todos os dígitos são iguais (CNPJ inválido)
    if cnpj == cnpj[0] * 14:
        return False

    # Calcula o primeiro dígito verificador
    soma = sum(int(cnpj[i]) * (5 - i % 8) for i in range(12))
    resto = soma % 11
    dv1 = 0 if resto < 2 else 11 - resto

    # Calcula o segundo dígito verificador
    soma = sum(int(cnpj[i]) * (6 - i % 8) for i in range(13))
    resto = soma % 11
    dv2 = 0 if resto < 2 else 11 - resto

    return cnpj[-2:] == f"{dv1}{dv2}"


def validar_cpf(cpf):
    """Valida CPF."""

    # Verifica se todos os dígitos são iguais (CPF inválido)
    if cpf == cpf[0] * 11:
        return False

    # Calcula o primeiro dígito verificador
    soma = sum(int(cpf[i]) * (10 - i) for i in range(9))
    resto = (soma * 10) % 11
    dv1 = 0 if resto == 10 else resto

    # Calcula o segundo dígito verificador
    soma = sum(int(cpf[i]) * (11 - i) for i in range(10))
    resto = (soma * 10) % 11
    dv2 = 0 if resto == 10 else resto

    return cpf[-2:] == f"{dv1}{dv2}"



def buscar_status_pix(txid, empresa_id, telefone, contact_id):
    try:
        empresa = ger_empresas.objects.get(id=empresa_id)
        lead = get_lead(telefone, contact_id, empresa_id)
        campanha_id = lead.ultima_campanha_enviada
        campanha = bmm_campanha.objects.get(id=campanha_id)
        url = f"{BBPIX_URL}/bb/pix/status"
        access_token = login_bbpix()
        
        headers = {
            "Authorization": f"Bearer {access_token}",
        }

        body = {
            "txid": txid,
            "client_id": campanha.gateway_pagamento.client_id,
            "client_secret": campanha.gateway_pagamento.client_secret,
            "wasabi_crt_url": campanha.gateway_pagamento.certificados_url,
            "wasabi_crt_pass_url": campanha.gateway_pagamento.certificados_senhas_url,
            "dev_key": campanha.gateway_pagamento.dev_key
        }

        print("BODY", body)
        response = requests.get(url, headers=headers, json=body)

        print("EDSG", response.json())

        if response.status_code == 200:
            response_data = response.json()
            payment_data = response_data.get("payment_data", {})
            payment_status = "CONCLUIDA"  # Status assume 'CONCLUIDA' pois não está presente no JSON de exemplo
            
            criacao_str = payment_data.get("horario")
            valor = payment_data.get('valor')
            criacao = isoparse(criacao_str)
            expiracao = criacao + timedelta(seconds=0)
            agora = datetime.now(timezone.utc)

            if payment_status == "ATIVA":
                return {
                    'pagamento_feito': 'N',
                    'cod_status': 'S' if agora > expiracao else 'N',
                    'status': 'fora do prazo' if agora > expiracao else 'dentro do prazo'
                }
            elif payment_status == "CONCLUIDA":
                if SolicitacaoPagamento.objects.filter(txid=txid).exists():
                    pix = SolicitacaoPagamento.objects.get(txid=txid)
                    pix.status = 'APROVADO'
                    pix.save()
                return {
                    'pagamento_feito': 'S',
                    'cod_status': 'N',
                    'status': 'dentro do prazo',
                    'data_tx_pix': criacao_str if criacao_str else '',
                    'valor_pix': valor
                }
            else:
                return {
                    'pagamento_feito': 'N',
                    'erro': payment_status
                }
        else:
            return {
                'pagamento_feito': 'N',
                'erro': f"Erro ao consultar o status do pagamento PIX: {response.status_code}",
                'detalhes': response.json()
            }
    except ger_empresas.DoesNotExist:
        return {
            'erro': 'Empresa não encontrada'
        }
    except ger_entidade.DoesNotExist:
        return {
            'erro': 'Entidade não encontrada'
        }
    except bmm_campanha.DoesNotExist:
        return {
            'erro': 'Campanha não encontrada'
        }
    except Exception as e:
        return {
            'erro': f"Erro inesperado: {str(e)}"
        }

# Função da view que usa a função buscar_status_pix
@csrf_exempt
def busca_pix(request):
    try:
        body = json.loads(request.body)
        txid = body.get('txid')
        empresa_id = body.get('empresa_id')
        contact_id = body.get("contact_id")
        telefone = body.get('number')

        result = buscar_status_pix(txid, empresa_id, telefone, contact_id)
        return JsonResponse(result, status=200 if 'erro' not in result else 400)
    except Exception as e:
        return JsonResponse({
            'erro': f"Erro inesperado: {str(e)}"
        }, status=500)





@csrf_exempt
def verifica_cpf_cnpj(request):
    if request.method != "POST":
        return JsonResponse({"error": "wrong method"}, status=405)
    body = json.loads(request.body)
    cnpj = body.get("cnpj", None)
    empresa = body.get("empresa_id", None)
    if cnpj is None:
        return JsonResponse({"error": "cnpj/cpf is required"}, status=400)

    if empresa is None:
        return JsonResponse({"error": "empresa_id is required"}, status=400)
    


    if validate_document(cnpj):
        numero = re.sub(r'\D', '', cnpj)
    return JsonResponse({"cnpj": cnpj, "valid": True}, status=200)

def validate_document(doc_number: str) -> bool:
    """
    Validates Brazilian CPF (11 digits) or CNPJ (14 digits)
    
    Args:
        doc_number: String containing only numbers
    Returns:
        bool: True if valid, False otherwise
    """
    # Remove non-numeric characters
    doc = ''.join(filter(str.isdigit, doc_number))
    
    # Check if empty or invalid length
    if not doc or len(doc) not in (11, 14):
        return False
        
    # Check if all digits are the same
    if len(set(doc)) == 1:
        return False
    
    if len(doc) == 11:  # CPF
        weights = [10, 9, 8, 7, 6, 5, 4, 3, 2]
        
        # First digit
        sum = 0
        for i in range(9):
            sum += int(doc[i]) * weights[i]
        digit = (sum * 10 % 11) % 10
        if digit != int(doc[9]):
            return False
            
        # Second digit
        weights = [11] + weights
        sum = 0
        for i in range(10):
            sum += int(doc[i]) * weights[i]
        digit = (sum * 10 % 11) % 10
        return digit == int(doc[10])
        
    else:  # CNPJ
        weights = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        
        # First digit
        sum = 0
        for i in range(12):
            sum += int(doc[i]) * weights[i]
        digit = sum % 11
        digit = 0 if digit < 2 else 11 - digit
        if digit != int(doc[12]):
            return False
            
        # Second digit
        weights = [6] + weights
        sum = 0
        for i in range(13):
            sum += int(doc[i]) * weights[i]
        digit = sum % 11
        digit = 0 if digit < 2 else 11 - digit
        return digit == int(doc[13])