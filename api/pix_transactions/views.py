
from django.db.models import Q, Sum
from datetime import datetime, timedelta, timezone
from boomerangue.apps.pix_transactions.models import  SolicitacaoPagamento
from rest_framework import viewsets
from rest_framework import permissions
from rest_framework import status
from django.utils import timezone
from django.http import HttpResponse
from rest_framework.response import Response
from .seriealizers import SolicitacaoPagamentoSerializer
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from boomerangue.apps.campaign.models import bmm_campanha, bmm_boomerangue
from boomerangue.apps.msg_messages.models import MsgMessage
from api.msg_messages.views import MsgMessageViewSet
from django.core.files.base import ContentFile
from decimal import Decimal
from django.utils.timezone import make_aware
import boto3
import urllib.parse
from botocore.client import Config
import pandas as pd
from botocore.exceptions import ClientError
from boomerangue.settings import AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
import requests

class CustomPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = 'page_size'
    max_page_size = 100

class SolicitacaoPagamentoViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows ger_grade to be viewed, edited or created.
    """

    queryset = SolicitacaoPagamento.objects.all()
    serializer_class = SolicitacaoPagamentoSerializer
    permission_classes = [permissions.IsAuthenticated]

    # Return data for edit in transportadora-list
    def retrieve(self, request, pk=None):
        print("entrou retrieve")
        try:
            condicao = SolicitacaoPagamento.objects.get(pk=pk)
        except SolicitacaoPagamento.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)


        serializer = self.get_serializer(condicao)
        data = serializer.data
        data['contact_id'] = condicao.boomerangue.entidade.lead_key_spl
        return Response(data)

    
    # Edit data
    # Edit data
    def partial_update(self, request, pk=None):
        try:
            condicao = SolicitacaoPagamento.objects.get(id=pk)
        except SolicitacaoPagamento.DoesNotExist:
            return Response({"error": "Item not found."}, status=status.HTTP_404_NOT_FOUND)

        data = request.data.copy()


        # Validate message_id and update status
        try:

            if 'import_comprovante' in data:
                file = data['import_comprovante']
                data['import_comprovante'] = ContentFile(file.read(), name=f"{condicao.empresa.id}/{condicao.boomerangue.entidade.id}/{file.name}")
                data['import_comprovante_url'] = f"comprovantes_pagamentos/comprovante/{condicao.empresa.id}/{condicao.boomerangue.entidade.id}/{file.name}"
            

            serializer = self.get_serializer(condicao, data=data, partial=True)
            if serializer.is_valid():
                old_valor = condicao.valor

                solicitacao_pagamento = serializer.save()

                # Update MsgMessage status
                
                if 'valor' in data:
                    new_valor = Decimal(str(data['valor']))
                    condicao.boomerangue.valor_atual = condicao.boomerangue.valor_atual - old_valor + new_valor

                condicao.boomerangue.data_aceite_bm = datetime.now()
                condicao.boomerangue.save()

                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except MsgMessage.DoesNotExist:
            return Response({"error": "message_id not found."}, status=status.HTTP_404_NOT_FOUND)
    
    # delete itens
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()

        # Defina deleted_at com a data/hora atual
        instance.exclusao_dt = timezone.now()
        
        # Defina status como 9000
        instance.statusregistro_id = 9000

        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
     # Create data and update message_id
    # Create data and update message status
    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        empresa = request.user.empresa
        message_id = data.get('message_id')
        txid = data.get('txid')
        instace = MsgMessageViewSet()
        print("DADOS RETORNADOS", data)
        # Check if message_id exists
        if not message_id:
            return Response({"error": "message_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Validate message_id and update status
        try:
            msg_message = MsgMessage.objects.get(pk=message_id)
            data['empresa'] = empresa.id
            data['boomerangue'] = msg_message.boomerangue.id
            data['conta'] = msg_message.boomerangue.campanha.gateway_pagamento.pk

            if 'import_comprovante' in data:
                file = data['import_comprovante']
                data['import_comprovante'] = ContentFile(file.read(), name=f"{empresa.id}/{msg_message.entidade.id}/{file.name}")
                data['import_comprovante_url'] = f"comprovantes_pagamentos/comprovante/{empresa.id}/{msg_message.entidade.id}/{file.name}"

            # if msg_message.doc_validado == 'O':
            #     return Response({"error": "Mensagem já validada."}, status=status.HTTP_409_CONFLICT)

            # Check if there is already a record with the same txid
            if txid:
                try:
                    existing_record = SolicitacaoPagamento.objects.get(txid=txid, empresa=empresa)
                    serializer = self.get_serializer(existing_record, data=data, partial=True)
                    print("Atualizado")
                    if serializer.is_valid():
                        solicitacao_pagamento = serializer.save()

                        # Update MsgMessage status and boomerangue data
                        if data['status'] == 'APROVADO':
                            msg_message.doc_validado = "O"

                        msg_message.boomerangue.bm_aceito = 'S'
                        msg_message.boomerangue.bm_status = 'D'
                        msg_message.boomerangue.valor_atual += Decimal(str(data['valor']))
                        msg_message.boomerangue.data_aceite_bm = datetime.now()
                        msg_message.boomerangue.save()
                        msg_message.save()

                        try: 
                            instace.chama_mensagens(request.user.nome, f"Seu comprovante no valor de R$ {data['valor']} foi validado com sucesso!", msg_message.boomerangue.campanha.pk, msg_message.boomerangue.entidade.pk, empresa.template_resposta)
                        except Exception as e:
                            print("Erro ao enviar mensagem", e)
                        return Response(serializer.data, status=status.HTTP_200_OK)
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                except SolicitacaoPagamento.DoesNotExist:
                    pass  # Continue to create a new record if no existing record is found

            serializer = self.get_serializer(data=data)
            if serializer.is_valid():
                print("NOVO")
                solicitacao_pagamento = serializer.save()

                # Update MsgMessage status
                if data['status'] == 'APROVADO':
                    msg_message.doc_validado = "O"

                msg_message.boomerangue.bm_aceito = 'S'
                msg_message.boomerangue.bm_status = 'D'
                msg_message.boomerangue.valor_atual += Decimal(str(data['valor']))
                msg_message.boomerangue.data_aceite_bm = datetime.now()
                msg_message.boomerangue.save()
                msg_message.save()

                try: 
                    instace.chama_mensagens(request.user.nome, f"Seu comprovante no valor de R$ {data['valor']} foi validado com sucesso!", msg_message.boomerangue.campanha.pk, msg_message.boomerangue.entidade.pk, empresa.template_resposta)
                except Exception as e:
                    print("Erro ao enviar mensagem", e)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except MsgMessage.DoesNotExist:
            return Response({"error": "message_id not found."}, status=status.HTTP_404_NOT_FOUND)

    
    @action(detail=False, methods=['post'])
    def filtragem_historico(self, request, *args, **kwargs):
        # Acessando os dados enviados na requisição
        data = request.data

        # Extraindo os valores dos dados
        periodo_inicial = data.get('periodo_inicial')
        periodo_final = data.get('periodo_final')
        status = data.get('status')
        telefone_status = data.get('telefone_status')
        entidade_id = data.get('id_entidade')
        boomerangue_id = data.get('boomerangue_id')
        pix_gerados = data.get("pix_gerados")

        print("ENTIDADE", entidade_id)
        # Convertendo as datas para o formato correto
        if periodo_inicial:
            periodo_inicial = datetime.strptime(periodo_inicial, '%d/%m/%Y').strftime('%Y-%m-%d')

        if periodo_final:
            periodo_final = datetime.strptime(periodo_final, '%d/%m/%Y').strftime('%Y-%m-%d')

        lead = data.get('lead')
        campanha = data.get('campanha')
        valores = data.get('valores', [])
        valores = [float(v.replace('.', '').replace(',', '.')) for v in valores]

        # Filtrando o queryset com base nos valores recebidos
        if pix_gerados:
            queryset = SolicitacaoPagamento.objects.filter(
                empresa=request.user.empresa
            ).order_by('-created_at')
        else:
            queryset = SolicitacaoPagamento.objects.filter(
                Q(status = 'APROVADO') | Q(status = 'PAGO'),
                empresa=request.user.empresa
            ).order_by('-data_tx')

        if boomerangue_id:
            queryset = queryset.filter(boomerangue=boomerangue_id)

        if lead:
            queryset = queryset.filter(boomerangue__entidade__Entidade__icontains=lead)

        if entidade_id:

            queryset = queryset.filter(boomerangue__entidade=entidade_id)

        if valores:
            queryset = queryset.filter(valor__gte=valores[0], valor__lte=valores[1])

        if campanha:
            queryset = queryset.filter(boomerangue__campanha=campanha)

        if periodo_inicial and periodo_final:
            queryset = queryset.filter(
                data_tx__date__gte=periodo_inicial,
                data_tx__date__lte=periodo_final
            )

        if telefone_status:
            if telefone_status == 'nao_validado':
                queryset = queryset.filter(
                    Q(boomerangue__entidade__status_validacao=telefone_status) |
                    Q(boomerangue__entidade__status_validacao__isnull=True)
                )
            else:
                queryset = queryset.filter(boomerangue__entidade__status_validacao=telefone_status)

        if status:
            queryset = queryset.filter(status=status)

        total = queryset.aggregate(total=Sum('valor'))
        # Paginação
        paginator = CustomPagination()
        paginated_queryset = paginator.paginate_queryset(queryset, request)

        # Serializando os dados
        serializer = self.get_serializer(paginated_queryset, many=True)
        data = serializer.data
        for item in data:
            boomerangue = bmm_boomerangue.objects.get(pk=item.get('boomerangue'))
            item['entidade'] = boomerangue.entidade.pk
            item['boomerangue_status'] = boomerangue.bm_status
            item['campanhaNome'] = boomerangue.campanha.Campanha
            item['entidade_nome'] = boomerangue.entidade.Entidade
            item['entidade_cnpj'] = boomerangue.entidade.CNPJNumerico
            item['telefone_valido'] = boomerangue.entidade.status_validacao
            item['lead_contact_id'] = boomerangue.entidade.lead_key_spl
            item['total_somado'] = total
             # Inicializar a variável data_vencimento como None
            # Verificar se 'data_vencimento' é uma string e convertê-la
            data_vencimento = item.get('data_vencimento')

            if data_vencimento:
                try:
                    # Converter para datetime, levando em conta o fuso horário UTC
                    data_vencimento = datetime.fromisoformat(data_vencimento.replace('Z', '+00:00'))
                except ValueError:
                    data_vencimento = None

            # Verificar se a data de vencimento foi definida e se expirou
            if data_vencimento:
                # Tornar o datetime ciente de fuso horário
                now = make_aware(datetime.now())
                item['expirou'] = 'S' if data_vencimento < now and item['status'] != 'APROVADO' else 'N'
            else:
                item['expirou'] = 'N'

        return paginator.get_paginated_response(data)
    

    @action(detail=False, methods=['post'])
    def gerar_excel_historico(self, request, *args, **kwargs):
        # Acessando os dados enviados na requisição
        data = request.data

        # Extraindo os valores dos dados
        periodo_inicial = data.get('periodo_inicial')
        periodo_final = data.get('periodo_final')
        status = data.get('status')
        telefone_status = data.get('telefone_status')
        entidade_id = data.get('id_entidade')
        boomerangue_id = data.get('boomerangue_id')
        pix_gerados = data.get("pix_gerados")
        # Convertendo as datas para o formato correto
        if periodo_inicial:
            periodo_inicial = datetime.strptime(periodo_inicial, '%d/%m/%Y').strftime('%Y-%m-%d')

        if periodo_final:
            periodo_final = datetime.strptime(periodo_final, '%d/%m/%Y').strftime('%Y-%m-%d')

        lead = data.get('lead')
        campanha = data.get('campanha')
        valores = data.get('valores', [])
        valores = [float(v.replace('.', '').replace(',', '.')) for v in valores]

        # Filtrando o queryset com base nos valores recebidos
        # Filtrando o queryset com base nos valores recebidos
        if pix_gerados:
            queryset = SolicitacaoPagamento.objects.filter(
                empresa=request.user.empresa
            ).order_by('-data_tx')
        else:
            queryset = SolicitacaoPagamento.objects.filter(
                Q(status = 'APROVADO') | Q(status = 'PAGO'),
                empresa=request.user.empresa
            ).order_by('-data_tx')

        if lead:
            queryset = queryset.filter(boomerangue__entidade__Entidade__icontains=lead)

        if boomerangue_id:
            queryset = queryset.filter(boomerangue=boomerangue_id)

        if entidade_id:
            queryset = queryset.filter(boomerangue__entidade=entidade_id)

        if valores:
            queryset = queryset.filter(valor__gte=valores[0], valor__lte=valores[1])

        if campanha:
            queryset = queryset.filter(boomerangue__campanha=campanha)

        if periodo_inicial and periodo_final:
            queryset = queryset.filter(
                data_tx__date__gte=periodo_inicial,
                data_tx__date__lte=periodo_final
            )

        if telefone_status:
            if telefone_status == 'nao_validado':
                queryset = queryset.filter(
                    Q(boomerangue__entidade__status_validacao=telefone_status) |
                    Q(boomerangue__entidade__status_validacao__isnull=True)
                )
            else:
                queryset = queryset.filter(boomerangue__entidade__status_validacao=telefone_status)

        if status:
            queryset = queryset.filter(status=status)

        # Serializando os dados
        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data
        for item in data:
            boomerangue = bmm_boomerangue.objects.get(pk=item.get('boomerangue'))
            item['entidade'] = boomerangue.entidade.pk
            item['boomerangue_status'] = boomerangue.bm_status
            item['campanhaNome'] = boomerangue.campanha.Campanha
            item['entidade_nome'] = boomerangue.entidade.Entidade
            item['entidade_cnpj'] = boomerangue.entidade.CNPJNumerico
            item['telefone_valido'] = boomerangue.entidade.status_validacao
            item['lead_contact_id'] = boomerangue.entidade.lead_key_spl

        # Convertendo os dados para DataFrame do pandas
        df = pd.DataFrame(data)

        # Selecionando apenas as colunas desejadas
        campos_desejados = ['entidade_nome', 'entidade_cnpj', 'campanhaNome', 'valor', 'data_tx', 'boomerangue_status', 'telefone_valido', 'data_vencimento', 'status']
        df = df[campos_desejados]

        # Convertendo para Excel
        response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = 'attachment; filename=historico_dados.xlsx'
        df.to_excel(response, index=False, engine='openpyxl')

        return response



    @action(detail=False, methods=['post', 'get'])
    def ultimas_compras(self, request, *args, **kwargs):
        if request.data.get('id'):
            print("stst", request.data.get('id'))
            boomerangues = bmm_boomerangue.objects.filter(campanha = request.data.get('id'), empresa = request.user.empresa)
            pagamentos = SolicitacaoPagamento.objects.filter(Q(status = 'APROVADO') | Q(status = 'PAGO'),empresa = request.user.empresa, boomerangue__in=boomerangues).order_by('-data_tx')[:10]
        else:
            pagamentos = SolicitacaoPagamento.objects.filter(Q(status = 'APROVADO') | Q(status = 'PAGO'),empresa = request.user.empresa).order_by('-data_tx')[:10]
        serializer = self.get_serializer(pagamentos, many=True).data
        for data in serializer:
            bmm = bmm_boomerangue.objects.get(pk=data.get('boomerangue'))
            data['campanhaNome'] = bmm.campanha.Campanha
            data['entidadeNome'] = bmm.entidade.Entidade

        return Response(serializer)
    
    @action(detail=False, methods=['post'])
    def pagamentos_entidade(self, request, *args, **kwargs):
        entidade_id = request.data.get('entidade_id')
        if not entidade_id:
            return Response({"error": "entidade_id is required."}, status=status.HTTP_400_BAD_REQUEST)


        boomerangues = bmm_boomerangue.objects.filter(entidade=entidade_id)
        pagamentos = SolicitacaoPagamento.objects.filter(
            boomerangue__in=boomerangues, 
            status__in=['APROVADO', 'PAGO']
        ).order_by('-data_tx')

        # Paginação
        paginator = CustomPagination()
        paginated_pagamentos = paginator.paginate_queryset(pagamentos, request)

        # Serialização
        serializer = self.get_serializer(paginated_pagamentos, many=True)
        data = serializer.data
        for item in data:
            boomerangue = bmm_boomerangue.objects.get(pk=item.get('boomerangue'))
            item['entidade'] = boomerangue.entidade.pk
            item['boomerangue_status'] = boomerangue.bm_status
            item['campanhaNome'] = boomerangue.campanha.Campanha
            item['entidade_nome'] = boomerangue.entidade.Entidade
            item['entidade_cnpj'] = boomerangue.entidade.CNPJNumerico
            item['telefone_valido'] = boomerangue.entidade.status_validacao

        return paginator.get_paginated_response(data)
    

    @action(detail=False, methods=['post'])
    def exclui_arquivos_wasabi(self, request, *args, **kwargs):
        id = request.data.get('data')
        pagamento = SolicitacaoPagamento.objects.get(id=id)
        comprovante = pagamento.import_comprovante
        comprovante_url = pagamento.import_comprovante_url
        try:
            session = boto3.Session(
                aws_access_key_id=AWS_ACCESS_KEY_ID,
                aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            )

            # Crie um cliente do Wasabi
            s3_client = session.client('s3', endpoint_url='https://s3.us-west-1.wasabisys.com', config=Config(signature_version='s3v4'))

            # Apague os arquivos no Wasabi
            s3_client.delete_object(Bucket='boomerangue', Key=str(comprovante))
            s3_client.delete_object(Bucket='boomerangue', Key=str(comprovante_url))
            pagamento.import_comprovante_url = ''
            pagamento.import_comprovante = ''
            pagamento.save()
            return Response({'success': 'excluido'}, status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            print(e)
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        


    
    