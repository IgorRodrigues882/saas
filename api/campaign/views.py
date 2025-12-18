from rest_framework import viewsets
from rest_framework import permissions
from rest_framework import filters
from django.db.models.functions import Now, Coalesce, Cast, Substr, Round
from django.db.models import Count, Sum, Case, When, Value, IntegerField, FloatField, F, DateField, Func, CharField
from django.shortcuts import get_object_or_404
from datetime import timedelta, datetime, time, date
from django.utils import timezone
from django.utils.timezone import now
from rest_framework.decorators import action
from rest_framework import status
from collections import defaultdict
from rest_framework.response import Response
from django.http import JsonResponse, HttpResponse
from django.db.models import Q, Subquery, OuterRef
from dateutil.relativedelta import relativedelta
from django.contrib.auth import authenticate
import datetime
import time
import random
from rest_framework.decorators import api_view
import json
from decimal import Decimal
from django.db.models.functions import TruncDate
import re
from django.db import transaction
from django.core.files.base import ContentFile
from django.core.files import File
import shutil
from django.core.exceptions import ValidationError
import os
import qrcode
import pandas as pd
from django.views.decorators.csrf import csrf_exempt
from rest_framework.permissions import AllowAny
import chardet
import jwt
from django.core.cache import cache
from asgiref.sync import sync_to_async, async_to_sync
import asyncio
import aiohttp
import requests
from django.apps import apps
from celery import shared_task, current_task
from django.conf import settings
from boomerangue.apps.campaign.models import bmm_campanha, bmm_template, bmm_boomerangue, bmm_boomerangueitens, bmm_boomerangueimportado, bmm_templateimportado, bmm_template_itens, bmm_boomeranguelog, bmm_boomerangueevento, ger_opcoes_padrao, agendamento
from boomerangue.apps.ger_produtos.models import ger_produtos
from boomerangue.apps.ger_entidades.models import ger_entidade
from boomerangue.apps.ger_empresas.models import ger_condicoespagamento
from boomerangue.apps.bmm_template_msgs.models import bmm_template_msgs
from boomerangue.apps.bmm_campanhas_msgs.models import bmm_campanhas_msgs
from boomerangue.apps.wpp_templatescomponents.models import wpp_templatescomponents, termos_sendpulse_troca, fluxo_sendpulse
from boomerangue.apps.wpp_templates.models import callToAction, wpp_fields, wpp_templates
from boomerangue.apps.empresas_log.models import ger_empresas_log
from boomerangue.apps.pix_transactions.models import LogSolicitacaoPagamento, SolicitacaoPagamento
from boomerangue.apps.atributos.models import Atributo, BoomerangueAtributo, BoomerangueAgendamento, GrupoAgendamentos
from boomerangue.apps.bot.models import Bot
from api.pix_transactions.seriealizers import SolicitacaoPagamentoSerializer
from login.models import Usuario
from .seriealizers import CampaignSerializer, Bmm_templateSerializer, Bmm_BoomerangueSerializer, bmm_boomerangueitensSerializer, bmm_importadoSerializer, bmm_importadoTemplateSerializer, bmm_template_itensSerializer, bmm_boomeranguelogSerializer, bmm_boomerangueEventoSerializer, opcao_padraoSeriealizer, VendasPorDiaSerializer, TopVendedorSerializer, AgendamentoTemplateSerializer
from channels.layers import get_channel_layer
from boomerangue.consumers import MessageConsumer
from rest_framework.pagination import PageNumberPagination
from .utils import format_date_for_django, format_time_for_django
import pandas as pd
import pytz
import random
import string


class CampaignViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows Campaigns to be viewed, edited or created.
    """
    queryset = bmm_campanha.objects.all()
    serializer_class = CampaignSerializer
    permission_classes = [permissions.IsAuthenticated]

    def retorna_queryCampanha(id_empresa):
        queryset = bmm_campanha.objects.filter(empresa=id_empresa, statusregistro_id=200).order_by('-id')
        return queryset

    def retorna_query_personalizada(id):
        queryset = bmm_campanha.objects.get(id=id)
        return queryset

    def retorna_boomerangues(id):
        queryset = bmm_boomerangue.objects.filter(campanha=id, statusregistro_id=200)[:25]
        return queryset
    
    def get_queryset(self):
        return bmm_campanha.objects.filter(empresa=self.request.user.empresa, statusregistro_id=200).order_by('-id')
    
    def create(self, request, *args, **kwargs):
        try:
            response = super().create(request, *args, **kwargs)
            campanha = bmm_campanha.objects.get(id=response.data['id'])
            template = request.data['template']
            if bmm_template_msgs.objects.filter(template=template, statusregistro_id=200).exists():
                msgs_template = bmm_template_msgs.objects.filter(template=template, statusregistro_id=200)
                for msg in msgs_template:
                    bmm_campanhas_msgs.objects.create(
                        campanha = campanha,
                        wpptemplate = msg.wpptemplate,
                        usotemplate = msg.usotemplate                
                    )
            return Response(response.data)
        except Exception as e:
            print(e)
            return Response({"error": str(e)}, status=404)
    # Return data for edit in transportadora-list
    def retrieve(self, request, pk=None):
        try:
            condicao = bmm_campanha.objects.get(pk=pk)
        except bmm_campanha.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)

        serializer = self.get_serializer(condicao)
        return Response(serializer.data)
    
    def partial_update(self, request, pk=None):
        try:
            condicao = bmm_campanha.objects.get(pk=pk)
        except bmm_campanha.DoesNotExist:
            return Response({"error": "Item not found."}, status=status.HTTP_404_NOT_FOUND)

        campanha = bmm_campanha.objects.get(id=condicao.pk)
        template = request.data.get('template')
        if template:
            if bmm_template_msgs.objects.filter(template=template, statusregistro_id=200).exists():
                msgs_template = bmm_template_msgs.objects.filter(template=template, statusregistro_id=200)
                for msg in msgs_template:
                    campanha_msg, created = bmm_campanhas_msgs.objects.get_or_create(
                        campanha=campanha,
                        wpptemplate=msg.wpptemplate,
                        usotemplate=msg.usotemplate
                    )

       # Atualizar o status da campanha ativa
        status_campanha = request.data.get('status_campanha', '')
        print("STATIUS", status_campanha)
        data = request.data.copy()  # Cria uma cópia mutável de request.data
        if status_campanha:
            data['CampanhaAtiva'] = 'S' if status_campanha == 'EA' else 'N'
        serializer = self.get_serializer(condicao, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    
    # delete itens
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()

        # Defina deleted_at com a data/hora atual
        instance.exclusao_dt = datetime.datetime.now()
        
        # Defina status como 9000
        instance.statusregistro_id = 9000

        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=False, methods=['post'])
    def cadastro_campanhas_integrador(self, request):
        try:
            nome_campanha = request.data.get('nome')
            empresa_id = request.data.get('empresa')
            hora_fim = request.data.get("hora_fim")
            data_fim = request.data.get("data_fim")
            print("hora final",hora_fim)
            if not nome_campanha or not empresa_id:
                return Response({"detail": "Nome da campanha e ID da empresa são obrigatórios."}, status=status.HTTP_400_BAD_REQUEST)

            # Busca template da campanha
            template = bmm_template.objects.filter(nome_template='Agendamentos', empresa=empresa_id, statusregistro_id=200).first()
            if not template:
                return Response({"detail": "Template não encontrado."}, status=status.HTTP_404_NOT_FOUND)

            # Busca templates de optin e envio
            template_optin = None
            template_envio = None
            try:
                if request.user.empresa.template_optin_clinica:
                    template_optin = wpp_templates.objects.get(id=request.user.empresa.template_optin_clinica)
                if request.user.empresa.template_envio_clinica:
                    template_envio = wpp_templates.objects.get(id=request.user.empresa.template_envio_clinica)
            except wpp_templates.DoesNotExist:
                return Response({"detail": "Template de optin/envio não encontrado."}, status=status.HTTP_404_NOT_FOUND)

            # Verifica se campanha já existe
            campanha = bmm_campanha.objects.filter(EdiCampanha=nome_campanha, statusregistro_id=200).first()
            if campanha:
                campanha.template = template
                if data_fim:    
                    data_fim_formatada = format_date_for_django(data_fim)
                    if data_fim_formatada:
                        campanha.data_fim = data_fim_formatada
                if hora_fim:
                    hora_fim_formatada = format_time_for_django(hora_fim)
                    print("hora formatada", hora_fim_formatada)
                    if hora_fim_formatada:
                        campanha.horario_fim = hora_fim_formatada

                campanha.save()
                return Response({"id": campanha.pk}, status=status.HTTP_200_OK)

            # Busca o bot associado à empresa
            bot = Bot.objects.get(empresa=empresa_id, bot_padrao='S', statusregistro_id = 200)


            # Criação da nova campanha
            campanha_data = {
                "Campanha": nome_campanha,
                "empresa": empresa_id,
                "statusregistro_id": 200,
                "EdiCampanha": nome_campanha,
                "template": template.pk,
                "bot_id": bot.pk if bot else None,
                "CampanhaAtiva":"S",
                "status_campanha": "EA",

            }

            if data_fim:
                data_fim_formatada = format_date_for_django(data_fim)
                if data_fim_formatada:
                    campanha_data["data_fim"] = data_fim_formatada
                else:
                    return Response({"detail": "Formato de data inválido."}, status=status.HTTP_400_BAD_REQUEST)

            if hora_fim:
                hora_fim_formatada = format_time_for_django(hora_fim)
                if hora_fim_formatada:
                    campanha_data["horario_fim"] = hora_fim_formatada
                else:
                    return Response({"detail": "Formato de hora inválido."}, status=status.HTTP_400_BAD_REQUEST)

            # Serializa e salva a nova campanha
            serializer = self.get_serializer(data=campanha_data)
            if serializer.is_valid():
                serializer.save()

                # Criação de mensagens da campanha (optin e envio)
                if template_optin:
                    bmm_campanhas_msgs.objects.create(
                        campanha_id=serializer.data['id'],
                        wpptemplate=template_optin,
                        usotemplate='OPTIN'
                    )
                if template_envio:
                    bmm_campanhas_msgs.objects.create(
                        campanha_id=serializer.data['id'],
                        wpptemplate=template_envio,
                        usotemplate='ENVIO'
                    )

                return Response(serializer.data, status=status.HTTP_201_CREATED)

            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            print(e)
            return Response({"detail": "Erro ao processar a requisição."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



    @action(detail=False, methods=['get'])
    def feedback_do_dia(self, request):
        try:
            self.retorna_feedback.delay(request.user.empresa.pk)
            return Response(status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"erro": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @shared_task
    def retorna_feedback(id):
        # Filtra campanhas ativas e aprovadas para a empresa fornecida
        campanhas = bmm_campanha.objects.filter(
            empresa=id, statusregistro_id=200, status_campanha='EA'
        )

        if not campanhas.exists():
            return ["Nenhuma campanha encontrada para a empresa."]

        info = campanhas.last()
        bot = info.bot_id
        edi_integracao = info.bot_id.legenda_3
        provider = info.bot_id.bot_provedor.provedor_padrao
        edi = info.bot_id.EDI_Integracao

        # Agrega os status das mensagens e suas contagens
        status_counts = (
            bmm_boomerangue.objects.filter(campanha__in=campanhas)
            .values('bm_mensagem_status')
            .annotate(count=Count('bm_mensagem_status'))
            .order_by('-count')
        )

        # Conta o total de boomerangues
        total_boomerangues = bmm_boomerangue.objects.filter(campanha__in=campanhas).count()

        # Conta o total de enviados (bm_enviado = 1)
        total_enviados = bmm_boomerangue.objects.filter(campanha__in=campanhas, bm_enviado=1).count()

        # Conta o total de não enviados (bm_enviado = 0)
        total_nao_enviados = bmm_boomerangue.objects.filter(campanha__in=campanhas, bm_enviado=0).count()

        # Função para remover números e tratar valores None
        def remove_numeros(texto):
            if texto is None:
                texto = ""  # Substitui None por string vazia
            return re.sub(r'\d+', '', texto).strip()

        # Formata o resultado como lista de strings, removendo números dos status
        resultado = [
            f"{remove_numeros(item['bm_mensagem_status'])}: {item['count']}"
            for item in status_counts
        ]

        # Adiciona informações gerais ao resultado
        resultado.append(f"Total de boomerangues: {total_boomerangues}")
        resultado.append(f"Total enviados: {total_enviados}")
        resultado.append(f"Total não enviados: {total_nao_enviados}")

        # Exibe o resultado no console (opcional)
        for line in resultado:
            print(line)

        # Retorna o resultado formatado
        CampaignViewSet.chama_mensagens(resultado, id, edi, provider, edi_integracao, bot)
        return resultado
    
    def chama_mensagens(lista, id, edi, provider, edi_integracao, bot):
        # Verificar se os campos obrigatórios estão preenchidos
        if not lista:
            return Response({"error": "Lista vazia"}, status=400)

        feedback = " \n ".join(lista).replace('\n', '\\n')  # ou '\u000A'
        access_token = CampaignViewSet.obter_access_token(bot)
        usuarios = Usuario.objects.filter(empresa=id, statusregistro_id=200)
        print("Feed", feedback)
        for usuario in usuarios:
            if usuario.telefone:
                telefone = re.sub(r'\D', '', usuario.telefone)
                print("TELEFONE", telefone)
                json_data = {
                    "name": "feedback_campanhas_1",
                    "components": [
                        {
                            "type": "body",
                            "parameters": [
                                {"type": "text", "text": usuario.nome},
                                {"type": "text", "text": "Em andamento"},
                                {"type": "text", "text": feedback}
                            ]
                        }
                    ],
                    "language": {"policy": "deterministic", "code": "pt_BR"}
                }

                # URL da API para onde o JSON será enviado
                api_url = "https://api.boomerangue.co/messages/send-text"
                body = {
                    'number': telefone,
                    'text': '',
                    'template': json_data,
                    'instance': edi_integracao,
                    'provider': provider.lower()
                }
                header = {'Authorization': f'Bearer {access_token}'}

                # Enviar o JSON para a API
                response = requests.post(api_url, json=body, headers=header)

                # Verifica o status da resposta antes de tentar fazer o parse do JSON
                if response.status_code != 200:
                    print(f"Erro na requisição: {response.status_code}, Resposta: {response.text}")
                else:
                    try:
                        r = response.json()
                        print("RESPONSE", r)
                    except requests.exceptions.JSONDecodeError:
                        print("Erro ao decodificar o JSON da resposta.")

       


    @action(detail=False, methods=['post'])
    def envio_mensagens_campanha(self, request):
        try:
            campanha_id = request.data.get('id')
            campanha = bmm_campanha.objects.get(id=campanha_id)
            arquivos = bmm_boomerangueimportado.objects.filter(campanha=campanha_id, statusregistro_id=200, envio_msg='N')
            
            ger_empresas_log.objects.create(
                empresa=request.user.empresa,
                campanha=campanha,
                template=campanha.template,
                acao_id='Envio Mensagens',
                usuario=request.user,
                descricao='Inicio envio de mensagens'
            )

            channel_layer = get_channel_layer()

            async_to_sync(channel_layer.group_send)(f"chat_{request.user.empresa.pk}", {
                'type': 'chat_message',
                'message': f'Mensagens Enviadas: 0'
            })

            # Caso existam arquivos CSV
            if arquivos.exists():
                campanha.CampanhaAtiva = 'S'
                campanha.status_validacao = 'S'
                campanha.save()
                for arquivo in arquivos:
                    if self.processar_arquivo.delay(arquivo.id, campanha.id, request.user.id) == False:
                        return JsonResponse({"error": "Arquivo maior que 500 registros"}, status=202)
                    else:
                        return JsonResponse({"success": "Tarefa iniciada"}, status=202)

            # Caso não existam arquivos CSV, verificar boomerangues
            else:
                boomerangues = bmm_boomerangue.objects.filter(campanha=campanha_id, statusregistro_id=200)
                if boomerangues.exists():
                    campanha.CampanhaAtiva = 'S'
                    campanha.status_validacao = 'S'
                    campanha.status_campanha = 'EA'
                    campanha.save()

                    # Processar os boomerangues da campanha
                    if self.processar_boomerangue.delay(campanha.id, request.user.id) == False:
                        return JsonResponse({"error": "Boomerangue não pôde ser processado"}, status=202)
                    else:
                        return JsonResponse({"success": "Tarefa iniciada com boomerangues"}, status=202)
                else:
                    return JsonResponse({"error": "Nenhum arquivo ou boomerangue encontrado"}, status=404)

        except Exception as e:
            print(e)
            return JsonResponse({"error": "Ocorreu um erro ao tentar processar envio de mensagens"}, status=404)
        
    def retorna_info_msg(enviada, cont_env,cont_erro, empresa, tempo_espera, total):
        channel_layer = get_channel_layer()
        mensagem =  f'Mensagens enviadas: {cont_env} Próximo envio: {tempo_espera} Mensagens com erro: {cont_erro} Total: {total}'
        async_to_sync(channel_layer.group_send)(f'chat_{empresa}', {
            'type': 'chat_message',
            'message': mensagem
        })
    
    def retorna_erro(error, empresa):
        channel_layer = get_channel_layer()
        mensagem =  f'ERROR Ocorreu um erro: {error}'
        async_to_sync(channel_layer.group_send)(f'chat_{empresa}', {
            'type': 'chat_message',
            'message': mensagem
        })

    @shared_task
    def processar_arquivo(arquivo_id, campanha_id, usuario_id):
        campanha = bmm_campanha.objects.get(id=campanha_id)
        arquivo = bmm_boomerangueimportado.objects.get(id=arquivo_id)
        usuario = Usuario.objects.get(id=usuario_id)
        try:
            caminho_completo = os.path.join(settings.MEDIA_ROOT, arquivo.Caminho.name) 
            with open(caminho_completo, 'rb') as f:
                result = chardet.detect(f.read())
        except Exception as e:
            CampaignViewSet.retorna_erro("Arquivo CSV Não Encontrado", usuario.empresa.pk)
        dados = pd.read_csv(caminho_completo, encoding=result['encoding'], sep=';', dtype={'EdiIntegracaoPedido': str})
        bmheader_rows = dados[dados['arquivo'] == 'bmheader']
        num_linhas = bmheader_rows.shape[0]
        print('NUM LINHAS', num_linhas)
        msgs_enviadas = 0
        msgs_erros = 0
        if campanha.bot_id.bot_ativo == 'N':
            CampaignViewSet.retorna_erro("Bot Desativado", usuario.empresa.pk)
        if num_linhas <= 500:
            cnpjs = bmheader_rows['EdiIntegracaoPedido']
            tt = len(cnpjs)
            ultimo_cnpj = campanha.ultimo_cnpj_processado
            print("Ultimo CNPJ", ultimo_cnpj)
            min_seg = campanha.bot_id.bot_provedor.IntervaloMininoMin
            max_seg = campanha.bot_id.bot_provedor.IntervaloMininoMax
            inicio = (cnpjs == ultimo_cnpj).idxmax() if ultimo_cnpj else 0
            print("Inicio", inicio)
            for cnpj in cnpjs[inicio:]:
                campanha.refresh_from_db()
                if campanha.status_campanha == 'PA':
                    break
                try:
                    if CampaignViewSet.processar_cnpj(cnpj, campanha, caminho_completo, usuario):
                        msgs_enviadas +=1
                        enviada = True
                        tempo_espera = random.randint(min_seg, max_seg)
                        print("Mensagens enviadas",msgs_enviadas)
                    else:
                        msgs_erros +=1
                        enviada = False
                        tempo_espera = random.randint(min_seg, max_seg)
                        print("Erro no envio das mensagem:",msgs_erros )
                    CampaignViewSet.retorna_info_msg(enviada,msgs_enviadas, msgs_erros, usuario.empresa.pk, tempo_espera, tt)
                except Exception as e:
                    print(e)
                    CampaignViewSet.retorna_erro(e, usuario.empresa.pk)
                    pass
                campanha.ultimo_cnpj_processado = cnpj
                campanha.save()
                time.sleep(tempo_espera)
            return True
        else:
            return False


    @shared_task
    def processar_boomerangue(campanha_id, usuario_id):
        campanha = bmm_campanha.objects.get(id=campanha_id)
        boomerangues = bmm_boomerangue.objects.filter(campanha=campanha_id, statusregistro_id=200)
        usuario = Usuario.objects.get(id=usuario_id)
        
        try:
            tt = len(boomerangues)  # Apenas para efeito de contagem, ajustável conforme sua necessidade
            msgs_enviadas = 0
            msgs_erros = 0

            for boomerangue in boomerangues:
                # Log de início do processamento
                print(f"Processando Boomerangue {boomerangue.id}")

                # Suponha que você precise de algum campo específico do boomerangue para enviar as mensagens
                edi = boomerangue.edi_integracao

                if campanha.bot_id.bot_ativo == 'N':
                    CampaignViewSet.retorna_erro("Bot Desativado", usuario.empresa.pk)

                min_seg = campanha.bot_id.bot_provedor.IntervaloMininoMin
                max_seg = campanha.bot_id.bot_provedor.IntervaloMininoMax
                tempo_espera = random.randint(min_seg, max_seg)

                # Processar envio de mensagem para o CNPJ do boomerangue
                try:
                    if CampaignViewSet.processar_cnpj(edi, campanha, None, usuario):
                        msgs_enviadas += 1
                        enviada = True
                        print("Mensagens enviadas", msgs_enviadas)
                    else:
                        msgs_erros += 1
                        enviada = False
                        print("Erro no envio da mensagem:", msgs_erros)
                    
                    CampaignViewSet.retorna_info_msg(enviada, msgs_enviadas, msgs_erros, usuario.empresa.pk, tempo_espera, tt)
                except Exception as e:
                    print(e)
                    CampaignViewSet.retorna_erro(e, usuario.empresa.pk)

                time.sleep(tempo_espera)
            return True

        except Exception as e:
            CampaignViewSet.retorna_erro("Erro no processamento do boomerangue", usuario.empresa.pk)
            return False


    def processar_cnpj(cnpj_numerico, campanha, caminho_completo, usuario):
        try:
            boomerangue = bmm_boomerangue.objects.get(edi_integracao=cnpj_numerico, campanha=campanha.id)
            print("BMM", boomerangue.entidade.status_validacao)
            print("EDI", cnpj_numerico)
            if boomerangue:
                print("Boomerangue", boomerangue)
                bmm_boomerangueevento.objects.create(
                    boomerangue=boomerangue, 
                    campanha=campanha,
                    ProtocoloGeracao='None',
                    origemevento_id='A',
                    tipoevento_id='BM_ENVIAR',
                    DataProgramada=now(),
                    statusevento_id='S',
                    ChaveBot='N',
                    NomeBot=campanha.bot_id.bot,
                    DataBot=now()
                )
                print("passou o create")
                provider = boomerangue.campanha.bot_id.bot_provedor.provedor_padrao
                edi_integracao = boomerangue.campanha.bot_id.EDI_Integracao
                token_bot = boomerangue.campanha.bot_id.api_key
                access_token = ''
                url_boomerangue = ''
                template=''
                parameters = ''
                text = ''
                images = ''
                fluxos = ''
                tipo = 'body'
                if boomerangue.campanha.template.campanha_motivo == 'VDP' or boomerangue.campanha.template.campanha_motivo == 'VDS':
                    url_boomerangue = f'https://{boomerangue.empresa.url_boomerangue}.boomerangue.me/pt/oferta/{boomerangue.token_bm}'
                    boomerangue.short_url = url_boomerangue
                if provider == 'SPL':
                    access_token = CampaignViewSet.obter_access_token(boomerangue.campanha.bot_id)
                    edi_integracao = boomerangue.campanha.bot_id.legenda_3
                    parameters, template, tipo, fluxos, images = CampaignViewSet.ajuste_termos_sendpulse(boomerangue, url_boomerangue)
                else:
                    text, images = CampaignViewSet.ajuste_mensagem(boomerangue, url_boomerangue)
                
                numero_tel = boomerangue.telefone_bm
                print("Chegou aqui no envio das mensgens", )
                spl_key = boomerangue.entidade.lead_key_spl if boomerangue.entidade.lead_key_spl else None
                response = CampaignViewSet.envio_mensagens(numero_tel, provider.lower(), edi_integracao, access_token, token_bot, tipo, text, images, parameters, template, fluxos, spl_key)
                print(response.status_code)
                if response.status_code == 200:
                    resposta_json = response.json()
                    boomerangue.entidade.ultima_campanha_enviada = int(campanha.pk)
                                    # Extraindo o contact_id do JSON
                    status = ''
                    if not spl_key:
                        contact_id = resposta_json.get('data', {}).get('data', {}).get('contact_id')
                        status = resposta_json.get('data', {}).get('data', {}).get('status')
                        keysearch = resposta_json.get('data', {}).get('data', {}).get('id')
                        if contact_id:
                            print("CONTACT_ID", contact_id)
                            # Salvando o contact_id no campo lead_key_spl
                            boomerangue.entidade.lead_key_spl = contact_id
                            boomerangue.entidade.status_validacao = 'validado'
                    boomerangue.entidade.save()
                    print("campanha_id", campanha.pk)
                    bmm_boomerangueevento.objects.create(
                        boomerangue=boomerangue, 
                        campanha=campanha,
                        ProtocoloGeracao='None',
                        origemevento_id='A',
                        tipoevento_id='BM_Enviado',
                        DataProgramada=now(),
                        statusevento_id=f"{status}",
                        ChaveBot='N',
                        NomeBot=campanha.bot_id.bot,
                        DataBot=now()
                    )
                    print("Passou evento create")
                    bmm_boomeranguelog.objects.create(
                        tipolog_id='S',
                        origemlog_id = 'B',
                        campanha = campanha,
                        template = boomerangue.template,
                        boomerangue = boomerangue,
                        entidade_id = boomerangue.entidade,
                        acao_id = 'BM_ENVIO_MENSAGEM',
                        usuario = usuario,
                        acaoenviada_id = 'Envio Mensagem',
                        Telefone = boomerangue.entidade.Telefone1,
                        Complemento1 = f"Envio de mensagem da campanha {campanha.Campanha}"
                    )
                    print("Passsou log create")
                    if boomerangue.data_ult_envio == None:
                        boomerangue.data_pri_envio = datetime.datetime.now()
                        boomerangue.data_ult_envio = datetime.datetime.now()
                    else:
                        boomerangue.data_ult_envio = datetime.datetime.now()
                    
                    if boomerangue.bm_com_erro == 'S':
                        boomerangue.bm_com_erro = 'N'
                    boomerangue.bm_enviado = 1
                    boomerangue.bm_status = 'S'
                    if boomerangue.entidade.StatusOptIN == "S" and boomerangue.bm_aceito == 'N' and boomerangue.bm_enviado_reforco1 == None or boomerangue.bm_enviado_reforco1 == 'N':
                        boomerangue.bm_enviado_reforco1 = 'S'
                    elif boomerangue.entidade.StatusOptIN == "S" and boomerangue.bm_aceito == 'N' and boomerangue.bm_enviado_reforco1 == 'S':
                        boomerangue.bm_enviado_reforco2 = 'S'
                    boomerangue.save()
                    print("passou ultimo envio")


                    return True
                else:
                    CampaignViewSet.retorna_erro(f'Erro no envio de mensagens ERRO {response.status_code}', usuario.empresa.pk)
                    bmm_boomerangueevento.objects.create(
                        boomerangue=boomerangue, 
                        campanha=campanha,
                        ProtocoloGeracao='None',
                        origemevento_id='A',
                        tipoevento_id='BM_Erro_Enviar',
                        DataProgramada=now(),
                        statusevento_id='E',
                        ChaveBot='N',
                        NomeBot=campanha.bot_id.bot,
                        DataBot=now()
                    )
                    boomerangue.bm_com_erro = 'S'
                    boomerangue.bm_enviado = 0
                    boomerangue.save()
                    bmm_boomeranguelog.objects.create(
                        tipolog_id='S',
                        origemlog_id = 'B',
                        campanha = campanha,
                        template = boomerangue.template,
                        boomerangue = boomerangue,
                        entidade_id = boomerangue.entidade,
                        acao_id = 'BM_ERRO_ENVIO',
                        usuario = usuario,
                        acaoenviada_id = 'Erro no envio',
                        Telefone = boomerangue.entidade.Telefone1,
                        Complemento1 = f"Erro no envio de mensagem",
                        Complemento2 = f'Erro descrição: {response.text}'

                    )
                    return False
            else:
                return False
        except Exception as e:
            print(e)
            return False 

    def obter_access_token(bot_id):
        token_access_expire = bot_id.bot_provedor.access_token_expire
        agora = int(time.time())
        
        if agora < token_access_expire:
            return bot_id.bot_provedor.access_token
        else:
            client_id = bot_id.legenda_1
            client_secret = bot_id.legenda_2
            access_token = CampaignViewSet.authenticate(client_id, client_secret)
            bot_id.bot_provedor.access_token_expire = agora + 3600
            bot_id.bot_provedor.access_token = access_token
            bot_id.bot_provedor.save()
            return access_token

    def authenticate(client_id, client_secret):
        print("Entrou authenticate")
        endpoint = f'https://api.boomerangue.co/spl/auth'
        body = {"client_id": client_id, "client_secret": client_secret}
        r = requests.post(endpoint, json=body)
        print('authenticate',r)
        data = r.json()
        return data["access_code"]

    def login_bbpix():
        endpoint = 'https://pix.plugue.co/user/login'
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



    def criaPix(boomerangue, valor):
        print("VALOROOR",valor)
        endpoint = 'https://pix.plugue.co/bb/pix'
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
            "value": '0.01' if valor == 'None' else valor,
            "pix_key": pix_key,
            "callback_url": "https://localhost/",
            "wasabi_crt_url": wasabi_crt_url,
            "wasabi_crt_pass_url": wasabi_crt_pass_url,
            'client_id':client_id,
            "client_secret": client_secret,
            "dev_key": dev_key,
            "expiration": expiration,
        }
        access_token = CampaignViewSet.login_bbpix()
        
        r = requests.post(endpoint, json=body, headers={"Authorization": f"Bearer {access_token}"})

        data = r.json()
        print(data)
        
        # Verifica se o status é diferente de 200 e trata o erro
        if data['payment_charge'].get('error'):
            error_message =''
            if data['payment_charge'].get('userHelp'):
                error_message = data['payment_charge'].get('userHelp', 'Erro desconhecido')
            elif data['payment_charge'].get('error'):
                error_message = data['payment_charge'].get('message', 'Erro desconhecido')
            CampaignViewSet.retorna_erro(error_message, boomerangue.empresa.pk)
            LogSolicitacaoPagamento.objects.create(
                boomerangue = boomerangue,
                mensagem = error_message,
                acao = 'Criação da cobrança PIX',
            )
            return False
        else:
            expire_at_seconds = data['payment_charge']['calendario']['expiracao'] or ''
            data_vencimento = datetime.datetime.now() + timedelta(seconds=expire_at_seconds)
            charge = SolicitacaoPagamento.objects.create(
                boomerangue = boomerangue,
                tipo_pagamento = 'PIX',
                valor = data['payment_charge']['valor']['original'] or '0.00',
                conta = gateway,
                recorrencia = 'UNICO',
                empresa = boomerangue.empresa,
                expire_at = data['payment_charge']['calendario']['expiracao'] or "",
                txid = data['payment_charge']['txid'] or "",
                copia_e_cola = data['payment_charge']['pixCopiaECola'] or "",
                data_vencimento = data_vencimento.date()
            )
            if charge.pk:
                LogSolicitacaoPagamento.objects.create(
                solicitacao_pagamento = charge,
                boomerangue = boomerangue,
                mensagem = "Pix Criado com sucesso",
                acao = 'Criação da cobrança PIX',
            )
            else:
                LogSolicitacaoPagamento.objects.create(
                boomerangue = boomerangue,
                mensagem = "Falha ao criar solicitação de pagamento",
                acao = 'Criação da cobrança PIX',
                )
        
            return data

    def gera_qrcode_pix(boomerangue, valor):
        data = CampaignViewSet.criaPix(boomerangue, valor)
        print("LOGIN DATAS")
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
            
            nome_arquivo = f'qrcode_pix_{boomerangue.entidade.Telefone1}.png'
            caminho_arquivo = os.path.join(pasta_qrcode, nome_arquivo)
            img.save(caminho_arquivo)

            print(f'QR Code salvo em: {caminho_arquivo}')

            return caminho_arquivo, pix_copia_e_cola
        else:
            return False, False


    # def verifica_messagem(phone, bot):
    #     url = 'https://apitest.boomerangue.co/contact/get-by-phone'
    #     body = {
    #         'phone':phone,
    #         'bot_id': bot
    #     }
    #     request = requests.get(url, json=body)
    #     print("RESULTADO VMEME", request.json())

        
    def ajuste_mensagem_reposta(campanha, boomerangue_c, url):
        actions = []
        existing_actions = []
        templates = wpp_templates.objects.filter(empresa=campanha.empresa, statusregistro_id=200, processada_ajuste_resposta = 'N')
        for template in templates:
            ob = callToAction.objects.filter(template_resposta=template.pk, processada='N')
            for action in ob:
                print(action.palavra_acao)
                palavra_acao = action.palavra_acao.lower()

                # Constrói a mensagem_resposta com os componentes do template_resposta
                imagem = None
                ordem_componentes = ['HEADER', 'BODY', 'FOOTER', 'BUTTONS', 'LIST']
                for tipo_componente in ordem_componentes:
                    msgs = wpp_templatescomponents.objects.filter(template=action.template_resposta.pk, statusregistro_id=200, component_type=tipo_componente)
                    for msg in msgs:
                        if msg.image_content:
                            url_image_site = f'https://{campanha.empresa.url_boomerangue}.boomerangue.me'
                            imagem = url_image_site + msg.image_content.url
                        if boomerangue_c.campanha.gateway_pagamento != 'null' and msg.possui_qrcode_pix == 'S':
                            imagem = f'https://{campanha.empresa.url_boomerangue}.boomerangue.me'


                # Verifica se a palavra_acao já existe
                existing_actions = campanha.bot_id.call_to_actions
                existing_action = next((a for a in existing_actions if a.get(palavra_acao)), None)
                if template.id_sendpulse != None:
                    if existing_action:
                        # Se a palavra_acao já existe, atualiza os dados
                        existing_action[palavra_acao] = {
                                "template": action.template_resposta.template_name,
                                "type": 'img' if imagem else 'txt',
                        }
                    else:
                        existing_actions.append({
                                palavra_acao: {
                                    "template":  action.template_resposta.template_name,
                                    "type": 'img' if imagem else 'txt',
                                }
                            })
                else:
                    if existing_action:
                            # Se a palavra_acao já existe, atualiza os dados
                        existing_action[palavra_acao] = {
                                "message": action.template_resposta.pk,
                                "type": 'img' if imagem else 'txt',
                                "url": imagem,
                                "pix_valor": str(action.valor_pix),
                                "opcao": action.opcoes
                        }
                    else:
                            # Se a palavra_acao não existe, adiciona uma nova
                        existing_actions.append({
                                palavra_acao: {
                                    "message": action.template_resposta.pk,
                                    "type": 'img' if imagem else 'txt',
                                    "url": imagem,
                                    "pix_valor": str(action.valor_pix),
                                    "opcao": action.opcoes
                                }
                            })
                action.processada = 'S'
                action.bots_conectados.add(campanha.bot_id)
                action.save()
            campanha.bot_id.call_to_actions = existing_actions
            campanha.bot_id.save()
            template.processada_ajuste_resposta = 'S'
            template.save()
        print("Actions", existing_actions)





    def ajuste_termos_sendpulse(boomerangue, url):
        parameters = []
        fluxos = []
        mensagens=''
        print('Entrou ajuste de termos', boomerangue.entidade.StatusOptIN)
        if boomerangue.entidade.StatusOptIN == 'X' or boomerangue.entidade.StatusOptIN == None:
            if bmm_campanhas_msgs.objects.filter(campanha=boomerangue.campanha, statusregistro_id=200, usotemplate='OPTIN').exists():
                mensagens = bmm_campanhas_msgs.objects.filter(campanha=boomerangue.campanha, statusregistro_id=200, usotemplate='OPTIN')
        elif boomerangue.entidade.StatusOptIN == "S" and boomerangue.bm_aceito == 'N' and (boomerangue.bm_enviado_reforco1 == None or boomerangue.bm_enviado_reforco1 == 'N'):
            if bmm_campanhas_msgs.objects.filter(campanha=boomerangue.campanha, statusregistro_id=200, usotemplate='REP1').exists():
                mensagens = bmm_campanhas_msgs.objects.filter(campanha=boomerangue.campanha, statusregistro_id=200, usotemplate='REP1')
        elif boomerangue.entidade.StatusOptIN == "S" and boomerangue.bm_aceito == 'N' and boomerangue.bm_enviado_reforco1 == 'S':
            if bmm_campanhas_msgs.objects.filter(campanha=boomerangue.campanha, statusregistro_id=200, usotemplate='REP2').exists():
                mensagens = bmm_campanhas_msgs.objects.filter(campanha=boomerangue.campanha, statusregistro_id=200, usotemplate='REP2')
        elif boomerangue.entidade.StatusOptIN == 'S':
            if bmm_campanhas_msgs.objects.filter(campanha=boomerangue.campanha, statusregistro_id=200, usotemplate='ENVIO').exists():
                mensagens = bmm_campanhas_msgs.objects.filter(campanha=boomerangue.campanha, statusregistro_id=200, usotemplate='ENVIO')
        fields = wpp_fields.objects.all()
        if mensagens != '':
            for mensagem in mensagens:
                print(mensagem.usotemplate)
                if mensagem.wpptemplate.possui_call_to_action == "S":
                    CampaignViewSet.ajuste_mensagem_reposta(boomerangue.campanha, boomerangue, url)
                if mensagem.wpptemplate.id_sendpulse:
                    msgs = wpp_templatescomponents.objects.filter(template=mensagem.wpptemplate, statusregistro_id=200)
                    tipo_cp = []
                    tipo = ''
                    image = ''
                    for msg in msgs:
                        if msg.component_type == 'TEXT':
                                tipo_cp.append('body')
                        elif msg.url_formatada != None and msg.component_type == 'BUTTONS':
                                tipo_cp.append('button')
                        elif msg.url_formatada == None and msg.component_type == 'BUTTONS':
                                if fluxo_sendpulse.objects.filter(component=msg.pk).exists():
                                    flow = fluxo_sendpulse.objects.get(component=msg.pk)
                                    fluxos.append(flow.fluxo_id)
                                tipo_cp.append('button_quick')
                        if msg.url_formatada != None and msg.component_type == 'HEADER':
                            image = f"https://{boomerangue.empresa.url_boomerangue}.boomerangue.me" + msg.url_formatada

                        if boomerangue.campanha.gateway_pagamento != 'null' and msg.possui_qrcode_pix == 'S':
                            imagem = None
                            print("Entrou gera_qrcode")
                            url_site = f'https://{boomerangue.empresa.url_boomerangue}.boomerangue.me/'
                            qrcode_pix, pix_copia_cola = CampaignViewSet.gera_qrcode_pix(boomerangue)
                            imagem = url_site + qrcode_pix

                        if termos_sendpulse_troca.objects.filter(component=msg).exists():
                            termos = termos_sendpulse_troca.objects.filter(component=msg)
                            
                            # Converta termo_sendpulse em um número inteiro e associe com o termo
                            termos = [(int(termo.termo_sendpulse.strip('{}')), termo) for termo in termos]
                            
                            # Ordene a lista com base no número inteiro
                            termos.sort(key=lambda x: x[0])
                            
                            for _, termo in termos:
                                chave = termo.termo_troca
                                field = fields.get(exibicao=chave)
                                campo = field.campo_origem
                                tabela = field.tabela_origem
                                tabela_vinculada = field.tabela_vinculada
                                key = field.campo_chave
                                tabela_filtragem = field.tabela_vinculada_2
                                campo_filtragem = field.campo_vinculado_2
                                valor_filtragem = field.valor_filtragem
                                key2 = field.campo_chave_2
                                # Aqui você obtém o modelo de forma dinâmica usando apps.get_model()
                                try:
                                    app_name = key 
                                    model_name = tabela # Espera-se que tabela tenha formato 'app_name.ModelName'
                                    Model = apps.get_model(app_name, model_name)
                                    print("ENTROU NO TRY")
                                    if Model:
                                        print("ENTROU NO MODEL")
                                        # Supondo que você já tenha o ID ou algum identificador da instância do modelo
                                        if tabela == 'bmm_boomerangue':
                                            print("TABELA È BOOMERANGUE")
                                            instance = Model.objects.get(id=boomerangue.pk)  # Ajuste isso para pegar a instância correta
                                        else:
                                            print("TABELA NÂO È BOOMERANGUE")
                                            queryset = Model.objects.filter(boomerangue=boomerangue.pk)
                                            if queryset.exists():
                                                if queryset.count() > 1:
                                                    # Lógica se houver mais de um registro
                                                    if campo_filtragem:
                                                        print("CAMPO", campo_filtragem)
                                                        # O `campo_vinculado` é o campo da tabela vinculada que será usado para o filtro
                                                        model_vinculado = apps.get_model(key2, tabela_filtragem)
                                                        print("MODEL", model_vinculado)
                                                        id_filtro = model_vinculado.objects.get(nome_atributo = valor_filtragem, tipo_empresa = boomerangue.empresa.tipo_de_negocio)
                                                    
                                                        queryset = queryset.filter(atributo=id_filtro)
                                                        
                                                    # Se for um único resultado após o filtro, você pode buscar o primeiro
                                                    instance = queryset.first()
                                                else:
                                                    # Lógica para quando há apenas um registro
                                                    instance = queryset.first()
                                                    print("INSTANCIA", instance.pk) 
                                        # Use getattr para obter o valor do campo dinamicamente
                                        if hasattr(instance, campo):
                                            value = getattr(instance, campo)
                                        
                                        # Verifique se há um campo vinculado adicional para pegar o valor
                                        if field.campo_vinculado != 'null' and hasattr(value, field.campo_vinculado):
                                            value = getattr(value, field.campo_vinculado)
                                        
                                        # Caso específico para substituir pelo link curto
                                        if chave == "{"+"link_curto_bm"+"}":
                                            value = url
                                        
                                        print("VALOR", value)

                                except (LookupError, AttributeError) as e:
                                    # Tratar erro se o modelo ou campo não existir
                                    print(f"Erro ao acessar o modelo ou campo: {e}")
                                    value = ''
                                
                                parameters.append({
                                            'type': 'text',
                                            'text': value  
                                        })
                else:
                    CampaignViewSet.retorna_erro(f'Erro no envio de mensagens ERRO A mensagem cadastrada não é do tipo sendpulse', boomerangue.empresa.pk)
                    
                
                if 'body' in tipo_cp:
                    tipo = 'body'
                if 'button' in tipo_cp:
                    tipo = 'button'
                if 'button_quick' in tipo_cp:
                    tipo = 'button_quick'
                return parameters, mensagem.wpptemplate, tipo, fluxos, image
        else:
            CampaignViewSet.retorna_erro(f'Erro no envio de mensagens ERRO Não há mensagens cadastradas na campanha', boomerangue.empresa.pk)

    # ajusta mensagem evolution
    def ajuste_mensagem(boomerangue_c, url):
        mensagens=''
        if boomerangue_c.entidade.StatusOptIN == 'X' or boomerangue_c.entidade.StatusOptIN == None:
            if bmm_campanhas_msgs.objects.filter(campanha=boomerangue_c.campanha, statusregistro_id=200, usotemplate='OPTIN').exists():
                mensagens = bmm_campanhas_msgs.objects.filter(campanha=boomerangue_c.campanha, statusregistro_id=200, usotemplate='OPTIN')
        elif boomerangue_c.entidade.StatusOptIN == 'S':
            if bmm_campanhas_msgs.objects.filter(campanha=boomerangue_c.campanha, statusregistro_id=200, usotemplate='ENVIO').exists():
                mensagens = bmm_campanhas_msgs.objects.filter(campanha=boomerangue_c.campanha, statusregistro_id=200, usotemplate='ENVIO')
        fields = wpp_fields.objects.all()
        todas_mensagens = ""
        imagem = None
        pix_copia_cola = ''
        if mensagens != '':
            for mensagem in mensagens:
                if mensagem.wpptemplate.possui_call_to_action == "S":
                    CampaignViewSet.ajuste_mensagem_reposta(boomerangue_c.campanha, boomerangue_c, url)
                if mensagem.wpptemplate.id_sendpulse:
                    CampaignViewSet.retorna_erro(f'Erro no envio de mensagens ERRO A mensagem cadastrada não é do tipo Evolution', boomerangue_c.empresa.pk)
                ordem_componentes = ['HEADER', 'BODY', 'FOOTER', 'BUTTONS', 'LIST']
                print("ordem components")
                for tipo_componente in ordem_componentes:
                    msgs = wpp_templatescomponents.objects.filter(template=mensagem.wpptemplate, statusregistro_id=200, component_type=tipo_componente)
                    for msg in msgs:
                        text_content = msg.text_content
                        termos = re.findall(r'\{(.+?)\}', text_content)
                        if msg.image_content and not imagem:
                            url_image_site = f'https://{boomerangue_c.empresa.url_boomerangue}.boomerangue.me'
                            imagem = url_image_site + msg.image_content.url
                        if boomerangue_c.campanha.gateway_pagamento != 'null' and msg.possui_qrcode_pix == 'S':
                            imagem = None
                            print("Entrou gera_qrcode")
                            url_site = f'https://{boomerangue_c.empresa.url_boomerangue}.boomerangue.me/'
                            qrcode_pix, pix_copia_cola = CampaignViewSet.gera_qrcode_pix(boomerangue_c)
                            imagem = url_site + qrcode_pix
                        for termo in termos:
                            print("entrou termos")
                            chave = "{" + termo + "}"
                            field = fields.get(exibicao=chave)
                            if field.campo_origem != 'null':
                                campo = field.campo_origem
                                if getattr(boomerangue_c, campo):
                                    value = getattr(boomerangue_c, campo)
                                if field.campo_vinculado != 'null':
                                    if getattr(value, field.campo_vinculado):
                                        value = getattr(value, field.campo_vinculado)
                                if chave == "{"+"link_curto_bm"+"}":
                                    print("chave", url)
                                    value = url
                            if chave == "{"+"pix_copia_cola"+"}":
                                print('chavePix', pix_copia_cola)
                                value = pix_copia_cola if pix_copia_cola else ''
                            text_content = text_content.replace('{' + termo + '}', str(value))
                        todas_mensagens += text_content + "\n \n"

        else:
            CampaignViewSet.retorna_erro(f'Erro no envio de mensagens ERRO Não há mensagens cadastradas na campanha', boomerangue_c.empresa.pk)
            bmm_boomerangueevento.objects.create(
            boomerangue=boomerangue_c, 
            campanha=boomerangue_c.campanha,
            ProtocoloGeracao='NM',
            origemevento_id='B',
            tipoevento_id='BM_NAO_ENVIADO',
            DataProgramada=now(),
            statusevento_id='S',
            ChaveBot='N',
            NomeBot=boomerangue_c.campanha.bot_id.bot,
            DataBot=now()
        )
        # print("Mensagens", todas_mensagens)
        return todas_mensagens, imagem

    def envio_mensagens(numero, provider, edi_integracao, access_token, token_bot, type, text='', image='', parameters='', template_name='', fluxos='', spl_key=None):
        endpoint = 'https://api.boomerangue.co/messages/send-text'
        body = {
            'number': numero,
            'text': text,
            'template': None,
            'instance': edi_integracao,
            'provider': provider,
            'contact_id': spl_key
        }

        print("Numero", numero)
        print("msg", text)
        print("edi", edi_integracao)
        print("provedor", provider)
        print("image", image)
        print("token_bot", token_bot)
        print("TIPO", type)
        print("fluxos", fluxos)

        if provider == 'spl':
            print('Template', template_name, 'paremetro:', parameters)
            if type == 'body':
                body['template'] = {
                    "name": template_name.template_name,
                    "components": [
                        {
                            "type": type,
                            "parameters": parameters
                        }
                    ],
                    "language": {
                        "policy": "deterministic",
                        "code": "pt_BR"
                    }
                }
            elif type == 'button':
                body['template'] = {
                    "name": template_name.template_name,
                    "components": [
                        {
                            "type": type,
                            "sub_type": "url",
                            "index": 0,
                            "parameters": parameters
                        }
                    ],
                    "language": {
                        "policy": "deterministic",
                        "code": "pt_BR"
                    }
                }
            elif type == 'button_quick':
                components = [
                    {
                        "type": "body",
                        "parameters": parameters
                    }
                ]

                # Adicionar dinamicamente os botões de resposta rápida com base na quantidade de fluxos
                for index, fluxo in enumerate(fluxos):
                    components.append({
                        "type": "button",
                        "sub_type": "quick_reply",
                        "index": index,
                        "parameters": [
                            {
                                "type": "payload",
                                "payload": {
                                    "to_chain_id": fluxo
                                }
                            }
                        ]
                    })

                # Adicionar imagem ao cabeçalho, se disponível
                if image:
                    components.insert(1, {
                        "type": "header",
                        "parameters": [
                            {
                                "type": "image",
                                "image": {
                                    "link": image
                                }
                            }
                        ]
                    })

                body['template'] = {
                    "name": template_name.template_name,
                    "components": components,
                    "language": {
                        "policy": "deterministic",
                        "code": "pt_BR"
                    }
                }

        print("body template", body['template'])
        if image and type != 'button_quick':
            endpoint = 'https://api.boomerangue.co/messages/send-image'
            body = {
                'number': numero,
                'media_url': image or '',
                'media_caption': text or '',
                'instance': edi_integracao,
                'provider': provider,
                'contact_id': spl_key
            }

        header = {'Authorization': f'Bearer {access_token}'} if access_token else {'Authorization': f'Bearer {token_bot}'}

        try:
            r = requests.post(endpoint, headers=header, json=body)
            print("RR", r)
            print(r.json())
            return r
        except Exception as e:
            print(e)
            return JsonResponse({"error": str(e)}, status=500)



        
    @action(detail=False, methods=['get'])
    def ultimas_campanhas(self, request):
        campanhas = bmm_campanha.objects.filter(empresa=request.user.empresa, statusregistro_id=200).order_by('-id')[:10]
        serialized_campanhas = self.get_serializer(campanhas, many=True).data
        # Obtendo todas as opções do campo status_campanha
        opcoes_status = dict(bmm_campanha._meta.get_field('status_campanha').flatchoices)
        # Criando uma lista com todas as opções disponíveis
        for campanha in serialized_campanhas:
            campanha['opcoes'] = opcoes_status
            resultados = SolicitacaoPagamento.objects.filter(boomerangue__campanha__id=campanha['id'], status__in=['APROVADO', 'PAGO']).aggregate(
                ValorVendas=Sum(
                    Case(
                        When(status__in=['APROVADO', 'PAGO'], then=F('valor')),
                        default=Value(0),
                        output_field=FloatField()
                    )
                )
            )
            campanha['valor_total'] = resultados

        return Response(serialized_campanhas)


    # pega o id da ultima campanha
    @action(detail=False, methods=['get'], url_path='ultima_campanha')
    def ultima_campanha(self, request):
        prefixo = request.user.empresa.url_boomerangue
        ultima_campanha = bmm_campanha.objects.all().order_by('-id').first()
        if ultima_campanha:
            return Response({"id": ultima_campanha.id, 'prefixo':prefixo})
        else:
            return Response({"error": "Nenhuma campanha encontrada para a empresa."}, status=404)



class bmm_TemplateViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows Campaigns to be viewed, edited or created.
    """
    queryset = bmm_template.objects.all()
    serializer_class = Bmm_templateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def retorna_query(id_empresa):
        queryset = bmm_template.objects.filter(statusregistro_id=200, empresa=id_empresa).order_by('-cadastro_dt')[:25]
        return queryset
    
    def retorna_query_personalizada(id):
        queryset = bmm_template.objects.get(id=id)
        return queryset
    

    # Return data for edit in transportadora-list
    def retrieve(self, request, pk=None):
        try:
            condicao = bmm_template.objects.get(pk=pk)
        except bmm_template.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)

        serializer = self.get_serializer(condicao)
        return Response(serializer.data)
    
    # Edit data
    def patch(self, request, pk=None):
        try:
            condicao = bmm_template.objects.get(pk=pk)
        except bmm_template.DoesNotExist:
            return Response({"error": "Item not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(condicao, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    # delete itens
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()

        # Defina deleted_at com a data/hora atual
        instance.exclusao_dt = datetime.datetime.now()
        
        # Defina status como 9000
        instance.statusregistro_id = 9000

        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    # Api que duplica os templates
    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        original_template = get_object_or_404(bmm_template, pk=pk)

        new_template = bmm_template(
                empresa = original_template.empresa,
                nome_template=original_template.nome_template + " (Duplicado)",
                texto_header=original_template.texto_header,
                texto_footer=original_template.texto_footer,
                texto_promocional=original_template.texto_promocional,
                link_footer=original_template.link_footer,
                link_marketing=original_template.link_marketing,
                # Outros campos simples podem ser copiados diretamente
            )

            # Copiando os arquivos de imagem
            # Para campos de imagem, você precisa criar uma cópia do arquivo

        if original_template.image_banner_pc:
                # Cria uma cópia do arquivo de imagem
                new_template.image_banner_pc.save(
                    original_template.image_banner_pc.name, 
                    ContentFile(original_template.image_banner_pc.read()), 
                    save=False
                )

        if original_template.image_banner_mobile:
                # Cria uma cópia do arquivo de imagem
                new_template.image_banner_mobile.save(
                    original_template.image_banner_mobile.name, 
                    ContentFile(original_template.image_banner_mobile.read()), 
                    save=False
                )
        # Salvar o novo template
        new_template.save()
        # Retornar uma resposta - você pode personalizar isso
        return Response({"message": "Template duplicado com sucesso.", "new_template_id": new_template.id}, status=status.HTTP_201_CREATED)

    #Função que remove a imagem
    @action(detail=True, methods=['get'], url_path='remove-image')
    def remove_image(self, request, pk=None):
        opcao = self.get_object()

        # Atualiza a data de alteração
        opcao.alteracao_dt = datetime.datetime.now()

        # Define o campo image_footer como None
        opcao.image_footer = None

        # Salva o objeto opcao
        opcao.save()

        return Response({'status':'imagem excluida!'}, status=status.HTTP_204_NO_CONTENT)


    # retorna templates mais usados
    @action(detail=False, methods=['get'])
    def top_templates(self, request):
        top_templates = bmm_campanha.objects.filter(empresa = request.user.empresa, statusregistro_id=200).values('template').annotate(total=Count('template')).order_by('-total')[:5]
        # Obtém os objetos de template correspondentes
        queryset = bmm_template.objects.filter(id__in=[item['template'] for item in top_templates])

        serializer = self.get_serializer(queryset, many=True)
        response_data = serializer.data
        for item in response_data:
            item['total_campanhas'] = next((template['total'] for template in top_templates if template['template'] == item['id']), 0)

        response_data.sort(key=lambda x: x['total_campanhas'], reverse=True)
        
        return Response(response_data)


class CustomPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = 'page_size'
    max_page_size = 100

class StrToDate(Func):
    """ Função personalizada para converter string em data no formato MySQL """
    function = 'STR_TO_DATE'
    template = "%(function)s(%(expressions)s, '%%d/%%m/%%Y')"

class ExtractMonth(Func):
    """Extrai o mês de uma string no formato 'dd/mm/yyyy'."""
    function = 'SUBSTRING'
    template = '%(function)s(%(expressions)s FROM 4 FOR 2)'
    output_field = CharField()

class ExtractYear(Func):
    """Extrai o ano de uma string no formato 'dd/mm/yyyy'."""
    function = 'SUBSTRING'
    template = '%(function)s(%(expressions)s FROM 7 FOR 4)'
    output_field = CharField()

class bmm_boomerangueViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows Campaigns to be viewed, edited or created.
    """
    queryset = bmm_boomerangue.objects.all()
    serializer_class = Bmm_BoomerangueSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = CustomPagination

    def retorna_query(id_empresa):
        queryset = bmm_boomerangue.objects.filter(statusregistro_id=200, empresa=id_empresa)
        return queryset
    

    def retorna_query_personalizada(id):
        queryset = bmm_boomerangue.objects.get(id=id)
        return queryset
    

    def gerar_token_com_data_exata(self):
        """
        Gera um token no padrão especificado, incluindo a data e hora exata da criação.

        Retorna:
            str: O token gerado.
        """

        # Obtém a data e hora atual no formato AAAAmmddHHMMSS
        agora = datetime.datetime.now()
        data_hora = agora.strftime('%Y%m%d%H%M%S')

        # Parte aleatória hexadecimal
        hex_digits = string.hexdigits
        parte_aleatoria = ''.join(random.choice(hex_digits) for _ in range(20))  # Ajustar o comprimento se necessário

        # Combina as partes
        token = f"{data_hora}11ac{parte_aleatoria}"
        return token
    
    def ajusta_hora_data(self, start):
        return start['date'], start['time']

    def create(self, request, *args, **kwargs):
        try:
            # Verificar se já existe um boomerangue com o mesmo edi_integracao
            edi_integracao = request.data.get('edi_integracao')
            print("edi_integracao", edi_integracao)
            if bmm_boomerangue.objects.filter(edi_integracao=edi_integracao, statusregistro_id=200).exists():
                return Response({"error": "Já existe um boomerangue com o mesmo EDI_Integracao."},
                                status=status.HTTP_202_ACCEPTED)

            # Obter telefone ou usar o da entidade
            telefone_bm = request.data.get('telefone_bm')
            entidade_id = request.data.get('entidade')
            campanha_id = request.data.get('campanha')
            template = request.data.get('template')
            titulo_boomerangue = request.data.get('titulo_boomerangue')
            start = request.data.get('start')
            nome_entidade = ''
            calendarId = request.data.get('calendarId')
            data_consulta = request.data.get('data_consulta')
            hora_consulta = request.data.get('hora_consulta')
            end = request.data.get('end')
            try:
                entidade = ger_entidade.objects.get(id=entidade_id, statusregistro_id = 200)
                nome_entidade = entidade.Entidade
            except ger_entidade.DoesNotExist:
                    return Response({"error": "Entidade não encontrada."}, status=status.HTTP_404_NOT_FOUND)
            # Verificar se já existe um boomerangue para a mesma entidade e campanha
            if campanha_id:
                if bmm_boomerangue.objects.filter(entidade=entidade_id, campanha=campanha_id, statusregistro_id=200).exists():
                    return Response({"error": "Já existe um boomerangue para essa entidade e campanha."},
                                    status=status.HTTP_202_ACCEPTED)

            # Obter telefone da entidade se não foi fornecido
            if not telefone_bm:
                try:
                    telefone_bm = entidade.Telefone1
                except ger_entidade.DoesNotExist:
                    return Response({"error": "Entidade não encontrada."}, status=status.HTTP_404_NOT_FOUND)

            # Obter o template da campanha, se não foi fornecido
            if not template and campanha_id:
                try:
                    campanha = bmm_campanha.objects.get(id=campanha_id)
                    template = campanha.template.pk
                except bmm_campanha.DoesNotExist:
                    return Response({"error": "Campanha não encontrada."}, status=status.HTTP_404_NOT_FOUND)

            # Obter o tipo da empresa
            try:
                tipo_empresa = request.user.empresa.tipo_de_negocio
            except AttributeError:
                return Response({"error": "Tipo de empresa não encontrado para a entidade."}, status=status.HTTP_400_BAD_REQUEST)
            

            if start:
                data_consulta, hora_consulta = self.ajusta_hora_data(start)
            
            if end:
                data_end, hora_end = self.ajusta_hora_data(end)


            # Verificar se existem atributos relacionados ao tipo de empresa
            atributos = Atributo.objects.filter(tipo_empresa=tipo_empresa)
            if not atributos.exists():
                atributos = None

            # Preparar os dados para o serializer do Boomerangue
            data = request.data.copy()
            data['telefone_bm'] = re.sub(r'\D', '', telefone_bm) if telefone_bm else ''
            data['template'] = template
            data['titulo_boomerangue'] = titulo_boomerangue if titulo_boomerangue else nome_entidade
            data['edi_integracao'] = edi_integracao
            data['token_bm'] = self.gerar_token_com_data_exata()
            data['data_consulta'] = data_consulta
            data['hora_consulta'] = hora_consulta
            data['data_limite_consulta'] = data_end if end else None
            data['hora_limite_consulta'] = hora_end if end else None

            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            boomerangue = serializer.save()

            # Se existirem atributos, processá-los
            if atributos:
                atributos_data = request.data.get('atributos', {})

                # Validar atributos obrigatórios e associar atributos ao boomerangue
                for atributo in atributos:
                    valor_atributo = atributos_data.get(atributo.nome_atributo)
                    if atributo.obrigatorio and (valor_atributo is None or valor_atributo.strip() == ""):
                        return Response({"error": f"O atributo '{atributo.nome_atributo}' é obrigatório."},
                                        status=status.HTTP_404_NOT_FOUND)

                    # Criar o BoomerangueAtributo se o valor foi fornecido
                    if valor_atributo is not None and valor_atributo.strip() != "":
                        BoomerangueAtributo.objects.create(
                            boomerangue=boomerangue,
                            atributo=atributo,
                            valor_atributo=valor_atributo
                        )
            
            if calendarId:
                try:
                    grupo = GrupoAgendamentos.objects.get(pk=calendarId)
                    print("grupo", grupo)
                except GrupoAgendamentos.DoesNotExist:
                    return Response({'error': 'GrupoAgendamentos não encontrado'}, status=400)

                if BoomerangueAgendamento.objects.filter(boomerangue=boomerangue).exists():
                    print("Existe Agendamento")
                    agendamento = BoomerangueAgendamento.objects.get(boomerangue=boomerangue)
                    agendamento.grupo_agendamento = grupo
                    agendamento.save()
                else:
                    BoomerangueAgendamento.objects.create(
                        boomerangue=boomerangue,
                        grupo_agendamento=grupo
                    )


            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except ger_entidade.DoesNotExist:
            return Response({"error": "Entidade não encontrada."}, status=status.HTTP_404_NOT_FOUND)
        except bmm_campanha.DoesNotExist:
            return Response({"error": "Campanha não encontrada."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    # Return data for edit in transportadora-list
    def retrieve(self, request, pk=None):
        try:
            condicao = bmm_boomerangue.objects.get(pk=pk)
        except bmm_boomerangue.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)

        serializer = self.get_serializer(condicao)
        data = []
        data = serializer.data
        data['entidade_name'] = condicao.entidade.Entidade
        return Response(data)
    
    # Edit data
    def partial_update(self, request, pk=None):

        print("Entou partial update", pk)
        instance = self.get_queryset().get(pk=pk)
        changes = request.data.get('changes')
        telefone_bm = request.data.get('telefone_bm')
        entidade = request.data.get('entidade')
        # Mapeie os campos do JSON para os campos do modelo
        if changes:
            if 'title' in changes:
                instance.titulo_boomerangue = changes['title']  # Exemplo de mapeamento para o campo `titulo_boomerangue`

            if 'start' in changes:
                start = changes['start']
                print("START", start)
                instance.data_consulta, instance.hora_consulta = self.ajusta_hora_data(start)

            if 'calendarId' in changes:
                print("Entrou aqui")
                try:
                    grupo = GrupoAgendamentos.objects.get(pk=changes['calendarId'])
                    print("grupo", grupo)
                except GrupoAgendamentos.DoesNotExist:
                    return Response({'error': 'GrupoAgendamentos não encontrado'}, status=400)

                if BoomerangueAgendamento.objects.filter(boomerangue=instance.id).exists():
                    print("Existe Agendamento")
                    agendamento = BoomerangueAgendamento.objects.get(boomerangue=instance.id)
                    agendamento.grupo_agendamento = grupo
                    agendamento.save()
                else:
                    BoomerangueAgendamento.objects.create(
                        boomerangue=instance,
                        grupo_agendamento=grupo
                    )

        if telefone_bm:
            instance.telefone_bm = re.sub(r'\D', '', telefone_bm)
        if entidade:
            instance.entidade = ger_entidade.objects.get(id = entidade)
        # Salvar as alterações no banco de dados
        instance.save()

        # Retornar o objeto atualizado
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    # delete itens
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()

        # Defina deleted_at com a data/hora atual
        instance.exclusao_dt = datetime.datetime.now()
        
        # Defina status como 9000
        instance.statusregistro_id = 9000

        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @staticmethod
    def convert_date_string(date_string):
        return datetime.datetime.strptime(date_string, '%d/%m/%Y').strftime('%Y-%m-%d')

    @staticmethod
    def convert_data_consulta(queryset):
        return queryset.annotate(
            data_consulta_convertida=Cast(
                Substr('data_consulta', 7, 4) + 
                Substr('data_consulta', 4, 2) + 
                Substr('data_consulta', 1, 2),
                output_field=IntegerField()
            )
        )

    def filter_queryset(self, queryset, filters):
        if filters.get('lead'):
            queryset = queryset.filter(entidade__Entidade__icontains=filters['lead'])
            
        
        if filters.get('valores'):
            min_valor, max_valor = filters['valores']
            queryset = queryset.filter(valor_atual__range=(min_valor, max_valor))
            
        
        if filters.get('campanha'):
            queryset = queryset.filter(campanha=filters['campanha'])
            
        
        if filters.get('telefone_status'):
            if filters['telefone_status'] == 'nao_validado':
                queryset = queryset.filter(
                    Q(entidade__status_validacao='nao_validado') |
                    Q(entidade__status_validacao__isnull=True)
                )
            else:
                queryset = queryset.filter(entidade__status_validacao=filters['telefone_status'])
        
        if filters.get('status'):
           
            if filters['status'] == 'O':
                # Inclui status 'O' (autorizou) e 'X' (doou) quando o filtro é "Autorizou"
                queryset = queryset.filter(entidade__StatusOptIN='S')
            elif filters['status'] == 'S':
                queryset = queryset.filter(bm_status__in=['S', 'E', 'Z', 'O','X', 'D', 'C'])
            
            elif filters['status'] == 'E':
                queryset = queryset.filter(bm_status__in=['E', 'Z', 'O','X', 'D', 'C'])

            elif filters['status'] == 'X':
                
                queryset = queryset.filter(bm_aceito='S')

            else:
                # Filtra normalmente com base no valor do status selecionado
                queryset = queryset.filter(bm_status=filters['status'])
        
        if filters.get('repique'):
            if filters['repique'] == 'rep1':
                queryset = queryset.filter(bm_enviado_reforco1 = 'S')
            else:
                queryset = queryset.filter(bm_enviado_reforco2 = 'S')
        
        return queryset

    def filter_by_date(self, queryset, periodo_inicial, periodo_final, bmtipo):
        if not (periodo_inicial and periodo_final):
            return queryset


        if bmtipo == 'agendamento':
            queryset = self.convert_data_consulta(queryset)
            print("QUERY", queryset.query)  # Imprime a query SQL para debug
            periodo_inicial_int = int(periodo_inicial.replace('-', ''))
            periodo_final_int = int(periodo_final.replace('-', ''))
            return queryset.filter(
                data_consulta_convertida__range=(periodo_inicial_int, periodo_final_int)
            )
        else:
            return queryset.annotate(date=TruncDate('data_aceite_bm')).filter(
                date__range=(periodo_inicial, periodo_final)
            )

    def enrich_data(self, data):
        for item in data:
            entidade = ger_entidade.objects.filter(pk=item.get('entidade')).first()
            item.update({
                'entidade_nome': entidade.Entidade if entidade else "Lead não encontrado",
                'entidade_cnpj': entidade.CNPJNumerico if entidade else '',
                'telefone_valido': entidade.status_validacao if entidade else 'Sem info'
            })

            campanha = bmm_campanha.objects.filter(pk=item.get('campanha')).first()
            item['campanhaNome'] = campanha.Campanha if campanha else '-'

            atributos = BoomerangueAtributo.objects.filter(boomerangue=item['id'])
            for atributo in atributos:
                item[atributo.atributo.nome_atributo] = atributo.valor_atributo

        return data

    @action(detail=False, methods=['post'])
    def filtragem(self, request, *args, **kwargs):
        data = request.data
        filters = {
            'lead': data.get('lead'),
            'valores': [float(v.replace('.', '').replace(',', '.')) for v in data.get('valores', [])],
            'campanha': data.get('campanha'),
            'telefone_status': data.get('telefone_status'),
            'status': data.get('status'),
            'repique':data.get('repique')
        }

        print(filters)
        periodo_inicial = self.convert_date_string(data.get('periodo_inicial')) if data.get('periodo_inicial') else None
        periodo_final = self.convert_date_string(data.get('periodo_final')) if data.get('periodo_final') else None

        queryset = self.get_queryset().filter(empresa=request.user.empresa, statusregistro_id = 200).order_by("-cadastro_dt")
        
        if data.get('bmm_consulta'):
            pass  # Não aplica filtro adicional
        elif data.get('bm_tipo'):
            queryset = queryset.filter(bm_tipo=data.get('bm_tipo'))
        else:
            queryset = queryset.filter(bm_aceito='S')

        queryset = self.filter_queryset(queryset, filters)
        queryset = self.filter_by_date(queryset, periodo_inicial, periodo_final, data.get('bm_tipo', ''))
       

        paginator = self.pagination_class()
        paginated_queryset = paginator.paginate_queryset(queryset, request)
        serializer = self.get_serializer(paginated_queryset, many=True)
        
        enriched_data = self.enrich_data(serializer.data)
        return paginator.get_paginated_response(enriched_data)
    

    @action(detail=False, methods=['get'])
    def agendamentos(self, request, *args, **kwargs):
        # Obter a data de referência do parâmetro da requisição
        data_ref_str = request.query_params.get('mes')

        if not data_ref_str:
            return Response({"error": "Parâmetro 'mes' é obrigatório."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            data_ref = datetime.datetime.strptime(data_ref_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({"error": "Formato de data inválido. Use 'YYYY-MM-DD'."}, status=status.HTTP_400_BAD_REQUEST)

        # Calcular os meses anterior, atual e próximo, com tratamento de transição de ano
        mes_atual = data_ref.month
        ano_atual = data_ref.year

        mes_anterior = (data_ref - relativedelta(months=1)).month
        ano_mes_anterior = (data_ref - relativedelta(months=1)).year

        mes_proximo = (data_ref + relativedelta(months=1)).month
        ano_mes_proximo = (data_ref + relativedelta(months=1)).year

        # Annotar e filtrar os agendamentos diretamente no banco
        agendamentos = (
            self.queryset
            .filter(
                bm_tipo='agendamento',
                empresa=request.user.empresa,
                statusregistro_id=200
            )
            .annotate(
                mes=ExtractMonth(F('data_consulta')),
                ano=ExtractYear(F('data_consulta'))
            )
            .filter(
                Q(ano=str(ano_mes_anterior), mes=str(mes_anterior).zfill(2)) |
                Q(ano=str(ano_atual), mes=str(mes_atual).zfill(2)) |
                Q(ano=str(ano_mes_proximo), mes=str(mes_proximo).zfill(2))
            )
        )

        # Serializar e retornar os dados
        serializer = self.get_serializer(agendamentos, many=True)

        for data in serializer.data:
            try:
                bmm = BoomerangueAgendamento.objects.get(boomerangue=data['id'])
                data['calendarId'] = bmm.grupo_agendamento.pk
            except BoomerangueAgendamento.DoesNotExist:
                data['calendarId'] = ''

        return Response(serializer.data, status=status.HTTP_200_OK)
    

    @action(detail=False, methods=['post'], permission_classes=[])
    def atualiza_confirma(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        empresa = request.data.get('empresa')
        agendamento = request.data.get('agendou')
        boomerangue = request.data.get('boomerangue')
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            try:
                bmm = bmm_boomerangue.objects.get(id=boomerangue)
                campanha = bmm.campanha
                
                # Definir o fuso horário de Brasília
                brasilia_tz = pytz.timezone('America/Sao_Paulo')
                
                # Obter o momento atual no fuso horário de Brasília
                now = timezone.localtime(timezone.now(), brasilia_tz)
                
                def combine_date_time(date_value, time_str):
                    # Se a data for nula ou vazia, use a data de hoje em Brasília
                    if not date_value:
                        date_value = now.date()
                    elif isinstance(date_value, str) and not date_value.strip():
                        date_value = now.date()
                    elif isinstance(date_value, str):
                        try:
                            date_value = datetime.datetime.strptime(date_value, '%Y-%m-%d').date()
                        except ValueError:
                            date_value = now.date()
                    elif isinstance(date_value, datetime.datetime):
                        date_value = date_value.astimezone(brasilia_tz).date()
                    
                    if time_str:
                        if not isinstance(time_str, str):
                            time_str = str(time_str)
                        
                        formatted_time = format_time_for_django(time_str)
                        if formatted_time:
                            naive_datetime = datetime.datetime.combine(date_value, datetime.datetime.strptime(formatted_time, '%H:%M:%S').time())
                        else:
                            naive_datetime = datetime.datetime.combine(date_value, time.min)
                    else:
                        naive_datetime = datetime.datetime.combine(date_value, time.min)
                    
                    # Tornar o datetime consciente do fuso horário de Brasília
                    return brasilia_tz.localize(naive_datetime)

                campanha_fim = combine_date_time(campanha.data_fim, campanha.horario_fim)

                print(f"Campanha data: {campanha_fim}")
                print(f"NOW: {now}")

                if agendamento:
                    if now > campanha_fim:
                        bmm.bm_status = 'U'
                        bmm.bm_mensagem_status = '75 Agendamento Confirmado Com atraso'
                        bmm.data_resposta_wz = now
                    else:
                        bmm.bm_status = 'T'
                        bmm.bm_mensagem_status = '77 Agendamento Confirmado'
                        bmm.data_resposta_wz = now
                else:
                    print("entrou cancelamnento")
                    bmm.bm_status = 'Y'
                    bmm.data_resposta_wz = now
                    bmm.bm_mensagem_status = '76 Agendamento Cancelado'
                

                bmm.bm_encerrado = 'N'
                bmm.save()
                return Response(status=status.HTTP_200_OK)
            except Exception as e:
                return Response(str(e), status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        




    @action(detail=False, methods=['get'])
    def busca_agendamentos_integrador(self, request):
        try:
            empresa = request.user.empresa
            # Filtra apenas agendamentos do dia seguinte e que não estão cancelados
            
            confirmacoes = bmm_boomerangue.objects.filter(
                empresa=empresa,
                campanha__CampanhaAtiva='S',
                statusregistro_id=200,
                bm_encerrado = 'N',
                bm_tipo='agendamento',
            ).values('telefone_bm', 'data_resposta_wz', 'bm_status', 'extra_info_4','id')

            # Formata os dados para retornar apenas os campos necessários
            dados_formatados = [
                {
                    'telefone': registro['telefone_bm'],
                    'data_confirmacao': registro['data_resposta_wz'].strftime('%Y-%m-%d') if registro['data_resposta_wz'] else None,
                    'hora_confirmacao': registro['data_resposta_wz'].strftime('%H:%M:%S') if registro['data_resposta_wz'] else None,
                    'bm_status': registro['bm_status'],
                    'extra_info_4': registro['extra_info_4'],
                    'id':registro['id']
                }
                for registro in confirmacoes
            ]

            return Response(dados_formatados, status=status.HTTP_200_OK)

        except Exception as e:
            print(e)
            return Response(
                {'erro': f'Erro ao buscar agendamentos: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


    @action(detail=False, methods=['post'])
    def atualiza_status_boomerangue(self, request):
        try:
            # Filtra apenas agendamentos do dia seguinte e que não estão cancelados
            id = request.data.get('id')
            try:
                boomerangue = bmm_boomerangue.objects.get(id = id)
            except bmm_boomerangue.DoesNotExist:
                return Response(
                {'erro': f'Erro ao buscar boomerangue: Boomerangue não encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

            boomerangue.bm_encerrado = 'S'
            boomerangue.save()

            # Formata os dados para retornar apenas os campos necessários
            return Response(status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"ERROR": str(e)}, status = status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def agendamentos_adicionais(self, request):
        print("Entrou agendamentos adicionais")
        campanha = request.data.get("campanha")
        data = request.data.get("data_consulta")
        try:
            query_campanha = bmm_campanha.objects.get(empresa = request.user.empresa, id=campanha, statusregistro_id=200)
        except bmm_campanha.DoesNotExist:
            return Response({"error", "Campanha não encontrada"}, status=status.HTTP_404_NOT_FOUND)

        if data:
            print("data", data)
            query_bmm = bmm_boomerangue.objects.filter(empresa = request.user.empresa, data_consulta=data, statusregistro_id=200, bm_tipo="agendamento", campanha__isnull=True)

            for query in query_bmm:
                query.campanha = query_campanha
                query.save()
        return Response({"Success": "Concluído"}, status=status.HTTP_200_OK)
    


    @action(detail=False, methods=['post'], permission_classes=[])
    def optin_cancela(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        empresa = request.data.get('empresa')
        telefone = request.data.get("telefone")
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            try:
                tel = re.sub(r'\D', '', telefone)
                # Pega os últimos 8 dígitos do telefone
                tel_last_8 = tel[-8:]

                try:
                    # Filtra na tabela ger_entidade buscando por empresa e pelos últimos 8 dígitos do telefone
                    usuario = ger_entidade.objects.get(
                        Q(empresa=empresa) & 
                        Q(Telefone1__endswith=tel_last_8)
                    )
                except ger_entidade.DoesNotExist:
                    usuario = None
                    print("Nenhum usuário encontrado com esses critérios.")
                except ger_entidade.MultipleObjectsReturned:
                    usuario = None
                    print("Mais de um usuário encontrado com esses critérios.")
                
                try: 
                    bmm = bmm_boomerangue.objects.filter(campanha = usuario.ultima_campanha_enviada, entidade = usuario).last()
                    bmm.bm_status = 'Z'
                    bmm.save()
                except bmm_boomerangue.DoesNotExist:
                    return Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR)

                if usuario:
                    usuario.StatusOptIN = 'N'
                    usuario.save()
                return Response(status=status.HTTP_200_OK)
            except Exception as e:
                return Response(str(e), status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            return Response(status=status.HTTP_401_UNAUTHORIZED)

    # gera Excel
    @action(detail=False, methods=['post'])
    def gerar_excel(self, request, *args, **kwargs):
        # Acessando os dados enviados na requisição
        data = request.data

        # Extraindo os valores dos dados
        periodo_inicial = data.get('periodo_inicial')
        periodo_final = data.get('periodo_final')
        status = data.get('status')
        if periodo_inicial:
            periodo_inicial = datetime.datetime.strptime(periodo_inicial, '%d/%m/%Y').strftime('%Y-%m-%d')
        if periodo_final:
            periodo_final = datetime.datetime.strptime(periodo_final, '%d/%m/%Y').strftime('%Y-%m-%d')
        lead = data.get('lead')
        campanha = data.get('campanha')
        valores = data.get('valores', [])
        valores = [float(v.replace('.', '').replace(',', '.')) for v in valores]

        # Filtrando o queryset com base nos valores recebidos
        if data.get('bmm_consulta'):
            queryset = self.get_queryset().filter(
                empresa=request.user.empresa,
            ).prefetch_related('entidade')
        else:
            queryset = self.get_queryset().filter(
                empresa=request.user.empresa,
                bm_aceito='S',
            ).prefetch_related('entidade')

        if lead:
            queryset = queryset.filter(entidade__Entidade__icontains=lead)
        if valores:
            queryset = queryset.filter(valor_atual__gte=valores[0], valor_atual__lte=valores[1])
        if campanha:
            queryset = queryset.filter(campanha=campanha)
        if periodo_inicial and periodo_final:
            queryset = queryset.annotate(date=TruncDate('data_aceite_bm')).filter(
                date__gte=periodo_inicial,
                date__lte=periodo_final
            )
        if status:
            queryset = queryset.filter(bm_status=status)

        # Serializando os dados
        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data
        for item in data:
            entidade = ger_entidade.objects.get(pk=item.get('entidade'))
            campanha_nome = bmm_campanha.objects.get(pk=item.get('campanha'))
            item['campanhaNome'] = campanha_nome.Campanha
            if entidade:
                item['entidade_nome'] = entidade.Entidade
                item['entidade_cnpj'] = entidade.CNPJNumerico

        # Convertendo os dados para DataFrame do pandas
        df = pd.DataFrame(data)

        # Selecionando apenas as colunas desejadas
        campos_desejados = ['entidade_nome', 'entidade_cnpj', 'campanhaNome', 'valor_atual', 'data_aceite_bm', 'bm_mensagem_status', 'telefone_bm']
        df = df[campos_desejados]

        # Convertendo para Excel
        response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = 'attachment; filename=boomarange_dados.xlsx'
        df.to_excel(response, index=False, engine='openpyxl')

        return response

    @action(detail=False, methods=['get'])
    def ultimas_compras(self, request, *args, **kwargs):
        boomerangues = bmm_boomerangue.objects.filter(empresa = request.user.empresa, bm_aceito = 'S').order_by('-data_aceite_bm')[:10]
        serializer = self.get_serializer(boomerangues, many=True).data
        for data in serializer:
            data['campanhaNome'] = bmm_campanha.objects.get(id = data['campanha']).Campanha
            data['entidadeNome'] = ger_entidade.objects.get(id = data['entidade']).Entidade

        return Response(serializer)
    

    @action(detail=False, methods=['post'])
    def ultimas_vendas_campanhas(self, request, *args, **kwargs):
        data = request.data
        boomerangues = bmm_boomerangue.objects.filter(empresa = request.user.empresa, bm_aceito = 'S', campanha = data.get('id')).order_by('-data_aceite_bm')[:10]
        serializer = self.get_serializer(boomerangues, many=True).data
        for data in serializer:
            data['campanhaNome'] = bmm_campanha.objects.get(id = data['campanha']).Campanha
            data['entidadeNome'] = ger_entidade.objects.get(id = data['entidade']).Entidade

        return Response(serializer)


    @action(detail=False, methods=['post'])
    def top_vendedores(self, request, *args, **kwargs):
        data = request.data
        vendas = bmm_boomerangue.objects.filter(
        empresa=request.user.empresa, 
        bm_aceito='S',  
        campanha=data.get('id')
        ).values('vendedor__Vendedor', 'vendedor__CodigoVendedor').annotate(
        total_vendas=Count('id'),
        total_valor = Sum('valor_atual')
        ).order_by('-total_vendas')[:5]
        
        serializer = TopVendedorSerializer(vendas, many=True).data
    
        return Response(serializer)
    

    



class bmm_boomerangueitensViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows Campaigns to be viewed, edited or created.
    """
    queryset = bmm_boomerangueitens.objects.all()
    serializer_class = bmm_boomerangueitensSerializer
    permission_classes = [permissions.IsAuthenticated]

    def retorna_query():
        queryset = bmm_boomerangueitens.objects.filter(statusregistro_id=200)
        return queryset
    

    def retorna_query_personalizada(id):
        queryset = bmm_boomerangueitens.objects.get(id=id)
        return queryset
    
    # Return data for edit in transportadora-list
    def retrieve(self, request, pk=None):
        try:
            item = bmm_boomerangueitens.objects.get(pk=pk)
        except bmm_boomerangueitens.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)

        # Inicia a lógica para buscar dados relacionados
        produto_id = item.produto_id
        # importado = item.templateimportado_id
        produto_desc = None
        arquivo_import = None

        if produto_id is not None:
            try:
                produto_obj = ger_produtos.objects.get(pk=produto_id)
                produto_desc = produto_obj.Descricao
                foto = produto_obj.PathProduto
            except ger_produtos.DoesNotExist:
                foto = ''
                print(f"Warning: wppt_templates com ID {produto_id} não encontrado.")

        else:
            foto = ''

        # if importado is not None:
        #     try:
        #         importado_obj = bmm_boomerangueimportado.objects.get(pk=importado)
        #         arquivo_import = importado_obj.NomeArquivo
        #     except bmm_boomerangueimportado.DoesNotExist:
        #         print(f"Warning: wppt_templates com ID {importado} não encontrado.")

        # Prepara a resposta
        data = {
            'id': item.id,
            'valor_atacado': item.valor_atacado,
            'valor_unitario': item.valor_unitario,
            'valor_total_item': item.valor_total_item,
            'unidade_venda': item.unidade_venda,
            'produto_bloqueado': item.produto_bloqueado,
            'descricao': produto_desc,
            'unidade_caixa': item.unidade_caixa,
            'foto': foto,
            'quantidade_disponivel': item.quantidade_disponivel,
            'multiplo_boomerangue': item.multiplo_boomerangue,
            'quantidade_maxima': item.quantidade_maxima,
            'quantidade_minima': item.quantidade_minima 
            # 'arquivo_import': arquivo_import
        }

        return Response(data)
    
    # Edit data
    def patch(self, request, pk=None):
        try:
            condicao = bmm_boomerangueitens.objects.get(pk=pk)
        except bmm_boomerangueitens.DoesNotExist:
            return Response({"error": "Item not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(condicao, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    # delete itens
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()

        # Defina deleted_at com a data/hora atual
        instance.exclusao_dt = datetime.datetime.now()
        
        # Defina status como 9000
        instance.statusregistro_id = 9000

        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
    


    def list(self, request, *args, **kwargs):
        query = request.query_params.get('query', '')
        id = request.query_params.get('id', '')
        queryset = self.filter_queryset(self.get_queryset())

        if query:
            queryset = queryset.filter(campanha=id, produto__Descricao__icontains=query)
        else:
            # Obtenha a lista de IDs de produtos únicos
            produto_ids = bmm_boomerangueitens.objects.filter(campanha=id).values_list('produto', flat=True).distinct()
            # Obtenha o primeiro item boomerangueitens para cada produto
            item_ids = []
            for produto_id in produto_ids:
                item = bmm_boomerangueitens.objects.filter(produto=produto_id).order_by('ordem').first()
                if item:
                    item_ids.append(item.id)
            queryset = queryset.filter(id__in=item_ids)


        serializer = self.get_serializer(queryset, many=True)

        data = []
        for item in serializer.data:
                # Obtém o ID do wpptemplate do item
                produto_id = item.get('produto', None)
                importado = item.get('templateimportado', None)
                if produto_id is not None:
                    # Tenta obter o objeto wppt_templates usando o ID
                    try:
                        produto_obj = ger_produtos.objects.get(pk=produto_id)
                        produto_desc = produto_obj.Descricao
                        produto_foto = produto_obj.PathProduto
                    except produto_obj.DoesNotExist:
                        produto_desc = None
                        produto_foto=''
                        print(f"Warning: wppt_templates com ID {produto_id} não encontrado.")
                else:
                    produto_desc = None
                    produto_foto=''
                    print(f"Warning: 'wpptemplate' não está presente para o item com id={item['id']}")

                if importado is not None:
                    # Tenta obter o objeto wppt_templates usando o ID
                    try:
                        importado_obj = bmm_templateimportado.objects.get(pk=importado)
                        arquivo_import = importado_obj.NomeArquivo
                    except arquivo_import.DoesNotExist:
                        arquivo_import = None
                        print(f"Warning: wppt_templates com ID {produto_id} não encontrado.")
                else:
                    arquivo_import = None
                    print(f"Warning: 'wpptemplate' não está presente para o item com id={item['id']}")

                data.append({
                    'id': item['id'],
                    'unidade_caixa': item['unidade_caixa'],
                    'valor_atacado': item['valor_atacado'],
                    'valor_unitario': item['valor_unitario'],
                    'valor_total_item': item['valor_total_item'],
                    'unidade_venda': item['unidade_venda'],
                    'produto_bloqueado':item['produto_bloqueado'],
                    'descricao': produto_desc,
                    'arquivo_import': arquivo_import,
                    'foto': produto_foto

                })


      
        print(data)
        return Response(data)

    # Retorna lista com produtos mais vendidos
    @action(detail=False, methods=['get'])
    def produtos_vendidos(self, request):
        boomerangues = bmm_boomerangue.objects.filter(
            empresa=request.user.empresa,
            bm_aceito='S',
            bmstatus='C'
        )

        # Lista para armazenar os resultados agregados
        resultados_agregados = []

        # Consulta para agregar a quantidade comprada dos itens de todos os boomerangues
        itens = bmm_boomerangueitens.objects.filter(
            boomerangue__in=boomerangues.values_list('pk', flat=True),
            QuantidadeCompradaUN__gt=0
        ).values(
            'produto__Descricao_Amigavel',
            'produto__PathProduto',
        ).annotate(
            total_vendido=Sum('QuantidadeCompradaUN'),
            valor = Sum('ValorMultimplicadorCompra')
        ).order_by('-total_vendido')[:10]

        for item in itens:
            # Adiciona o resultado à lista de resultados agregados
            resultados_agregados.append({
                'nome_do_produto': item['produto__Descricao_Amigavel'],  # Adiciona o nome do produto
                'total_vendido': item['total_vendido'],
                'foto': item['produto__PathProduto'],
                'valor': item['valor']
            })

        print(resultados_agregados)
        return Response(resultados_agregados)


    # Retorna lista com top 5 compradores
    @action(detail=False, methods=['get', 'post'])
    def top_compradores(self, request):
        campanha = request.data.get('campanha','')
        print("CAMPANHA", campanha)
        pagamentos = SolicitacaoPagamento.objects.filter(empresa = request.user.empresa, status__in=['APROVADO', 'PAGO']).values('boomerangue__entidade__Entidade', 'boomerangue__entidade__id').annotate(total_comprado=Sum('valor')).order_by('-total_comprado')
        if campanha:
           pagamentos = pagamentos.filter(boomerangue__campanha=campanha)
        
        # Consulta para agregar a quantidade comprada dos itens de todas as entidades
        return Response(list(pagamentos[:5]))
    
    @action(detail=False, methods=['post'])
    def items_campanha(self, request):
        desativar = request.data.get('desativar', '')
        PathProduto = request.data.get('PathProduto','')
        Descricao_Amigavel = request.data.get('Descricao_Amigavel', '')
        valor_unitario = request.data.get("valor_unitario", '')
        quantidade_disponivel = request.data.get('quantidade_disponivel', '')
        multiplo_boomerangue = request.data.get("multiplo_boomerangue", '')
        quantidade_maxima = request.data.get("quantidade_maxima", '')
        quantidade_minima = request.data.get('quantidade_minima', '')

        it = bmm_boomerangueitens.objects.get(id = request.data.get('id'))
        produto = it.produto.pk
        itens = bmm_boomerangueitens.objects.filter(produto = produto)
        if desativar:
            for item in itens:
                item.item_ativo = 'N'
                item.save()
            
        else:
            prod = ger_produtos.objects.get(id = produto)
            prod.PathProduto = PathProduto
            prod.Descricao_Amigavel = Descricao_Amigavel
            prod.Descricao=Descricao_Amigavel
            prod.Descricao_Detalhada = Descricao_Amigavel
            prod.save()
            for item in itens:
                item.valor_unitario = float(valor_unitario.replace(',', '.'))
                item.quantidade_disponivel = quantidade_disponivel
                item.multiplo_boomerangue = multiplo_boomerangue
                item.quantidade_maxima = quantidade_maxima
                item.quantidade_minima = quantidade_minima
                item.save()
        return Response({"Success": 'Item alterado'})
            
        


class importcsv(viewsets.ModelViewSet):
    """
    API endpoint that allows Campaigns to be viewed, edited or created.
    """
    queryset = bmm_boomerangueimportado.objects.all()
    serializer_class = bmm_importadoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def retorna_query():
        queryset = bmm_boomerangueimportado.objects.filter(statusregistro_id=200)
        return queryset
    

    def retorna_query_personalizada(id):
        queryset = bmm_boomerangueimportado.objects.get(id=id)
        return queryset
    
    # Return data for edit in transportadora-list
    def retrieve(self, request, pk=None):
        try:
            condicao = bmm_boomerangueimportado.objects.get(pk=pk)
        except bmm_boomerangueimportado.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)

        serializer = self.get_serializer(condicao)
        return Response(serializer.data)
    
    # Edit data
    def patch(self, request, pk=None):
        try:
            condicao = bmm_boomerangueimportado.objects.get(pk=pk)
        except bmm_boomerangueimportado.DoesNotExist:
            return Response({"error": "Item not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(condicao, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    # delete itens
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()

        # Defina deleted_at com a data/hora atual
        instance.exclusao_dt = datetime.datetime.now()
        
        # Defina status como 9000
        instance.statusregistro_id = 9000

        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    
    def list(self, request, *args, **kwargs):
        query = request.query_params.get('query', '')
        id = request.query_params.get('id', '')
        queryset = self.filter_queryset(self.get_queryset())

        if query:
            queryset = queryset.filter(campanha=id, statusregistro_id=200, NomeArquivo__icontains=query)
        else:
            queryset = queryset.filter(campanha=id, statusregistro_id=200).order_by('-cadastro_dt')[:25]

        serializer = self.get_serializer(queryset, many=True)

        data = []
        for item in serializer.data:
                # Obtém o ID do wpptemplate do item
                data.append({
                'id': item.get('id'),
                'NomeArquivo': item.get('NomeArquivo'),
                'Caminho': item.get('Caminho'),
                'DataHora': item.get('DataHora'),
                'tipo_arquivo': item.get('tipo_arquivo'),
                'retorno_arquivo': item.get('retorno_arquivo'),
                'statusarquivo_id': item.get('statusarquivo_id'),
        })


      
        print(data)
        return Response(data)

    @action(detail=False, methods=['post'])
    def importa_csv(self, request):
        # Verifica se há arquivos no pedido
        print("Chegou aqyuiusdioajklsnd,ljaskd")
        try:
            if not request.FILES:
                return Response({"error": "Nenhum arquivo enviado."}, status=status.HTTP_400_BAD_REQUEST)

            campanha = bmm_campanha.objects.get(id = request.data.get('campanha'))
            statusarquivo_id = request.data.get('statusarquivo_id')

            for index, file in enumerate(request.FILES.values()):
                try:
                    # Acessa o Caminho e o NomeArquivo correspondentes
                    caminho = request.data.get(f'Caminho_{index}')
                    nome_arquivo = request.data.get(f'NomeArquivo_{index}')

                    # Cria um novo registro no modelo com o arquivo CSV
                    bmm_boomerangueimportado.objects.create(
                        campanha=campanha,
                        statusarquivo_id=statusarquivo_id,
                        Caminho=caminho,
                        NomeArquivo = nome_arquivo,
                        envio_msg='N'
                        # outros campos conforme necessário
                    )
                except Exception as e:
                    print(e)
                    # Tratamento de exceções genérico, ajuste conforme necessário
                    return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
                

            return Response({"status": "Arquivos importados com sucesso!"}, status=status.HTTP_201_CREATED)
        except Exception as e:
            print(e)




class importcsvTemplate(viewsets.ModelViewSet):
    """
    API endpoint that allows Campaigns to be viewed, edited or created.
    """
    queryset = bmm_templateimportado.objects.all()
    serializer_class = bmm_importadoTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def retorna_query():
        queryset = bmm_templateimportado.objects.filter(statusregistro_id=200)
        return queryset
    

    def retorna_query_personalizada(id):
        queryset = bmm_templateimportado.objects.get(id=id)
        return queryset
    
    # Return data for edit in transportadora-list
    def retrieve(self, request, pk=None):
        try:
            condicao = bmm_templateimportado.objects.get(pk=pk)
        except bmm_templateimportado.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)

        serializer = self.get_serializer(condicao)
        return Response(serializer.data)
    
    # Edit data
    def patch(self, request, pk=None):
        try:
            condicao =bmm_templateimportado.objects.get(pk=pk)
        except bmm_templateimportado.DoesNotExist:
            return Response({"error": "Item not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(condicao, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    # delete itens
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()

        # Defina deleted_at com a data/hora atual
        instance.exclusao_dt = datetime.datetime.now()
        
        # Defina status como 9000
        instance.statusregistro_id = 9000

        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=False, methods=['post'])
    def importa_csv(self, request):
        # Verifica se há arquivos no pedido
        if not request.FILES:
            return Response({"error": "Nenhum arquivo enviado."}, status=status.HTTP_400_BAD_REQUEST)

        template = bmm_template.objects.get(id = request.data.get('template'))
        statusarquivo_id = request.data.get('statusarquivo_id')

        for index, file in enumerate(request.FILES.values()):
            try:
                # Acessa o Caminho e o NomeArquivo correspondentes
                caminho = request.data.get(f'Caminho_{index}')
                nome_arquivo = request.data.get(f'NomeArquivo_{index}')

                # Cria um novo registro no modelo com o arquivo CSV
                bmm_templateimportado.objects.create(
                    template=template,
                    statusarquivo_id=statusarquivo_id,
                    Caminho=caminho,
                    NomeArquivo = nome_arquivo
                    # outros campos conforme necessário
                )
            except Exception as e:
                # Tratamento de exceções genérico, ajuste conforme necessário
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
            

        return Response({"status": "Arquivos importados com sucesso!"}, status=status.HTTP_201_CREATED)
    

class retorna_nome_arquivos(viewsets.ModelViewSet):
        queryset = bmm_templateimportado.objects.all()
        serializer_class = bmm_importadoTemplateSerializer

        permission_classes = [permissions.IsAuthenticated]
        filter_backends = [filters.SearchFilter]
        search_fields = ['NomeArquivo']
        # Return data for edit in transportadora-list
        def list(self, request, *args, **kwargs):
            query = request.query_params.get('query', '')  # Obtém o parâmetro 'query' da solicitação
            id = request.query_params.get('id', '')
            queryset = self.filter_queryset(self.get_queryset())  # Aplica filtros, se houver

            if query:
                # Filtra os resultados com base na consulta do usuário
                queryset = queryset.filter(template = id, NomeArquivo__icontains=query, statusregistro_id=200)
            serializer = self.get_serializer(queryset, many=True)

            data = []
            for item in serializer.data:
                data.append({
                    'id': item['id'], 
                    'tipo_arquivo': item['tipo_arquivo'],
                    'DataHora': item['DataHora'], 
                    'statusarquivo_id': item['statusarquivo_id'], 
                    'NomeArquivo':item['NomeArquivo'],
                    'retorno_arq': item['retorno_arquivo'],
                    'Caminho': item['Caminho']
                })
            print(data)
            return Response(data)
        
class retorna_originais_arquivos(viewsets.ModelViewSet):
    queryset = bmm_templateimportado.objects.all()
    serializer_class = bmm_importadoTemplateSerializer
    ppermission_classes = [permissions.IsAuthenticated]

    def list(self, request, *args, **kwargs):
        query = request.query_params.get('id', '')
        queryset = self.filter_queryset(self.get_queryset())

        queryset = queryset.filter(template = query, statusregistro_id=200).order_by('-DataHora')[:5]

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    

class retorna_nome_templates(viewsets.ModelViewSet):
        queryset = bmm_template.objects.all()
        serializer_class = Bmm_templateSerializer

        permission_classes = [permissions.IsAuthenticated]
        filter_backends = [filters.SearchFilter]
        search_fields = ['nome_template']
        # Return data for edit in transportadora-list
        def list(self, request, *args, **kwargs):
            query = request.query_params.get('query', '')  # Obtém o parâmetro 'query' da solicitação
            queryset = self.filter_queryset(self.get_queryset())  # Aplica filtros, se houver

            if query:
                # Filtra os resultados com base na consulta do usuário
                queryset = queryset.filter(empresa= request.user.empresa, nome_template__icontains=query, statusregistro_id=200)

            else:
                queryset = queryset.filter(empresa= request.user.empresa, statusregistro_id=200).order_by('-cadastro_dt')[:25]

            serializer = self.get_serializer(queryset, many=True)
            data = [{'id': item['id'], 'nome_template': item['nome_template'], 'texto_header': item['texto_header'], 'ativo': item['Ativo']} for item in serializer.data]
            print(data)
            return Response(data)


class PausaCampanhaViewSet(viewsets.ModelViewSet):
    queryset = bmm_campanha.objects.all()
    serializer_class = CampaignSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk=None):
        # Obtém o valor passado pela chamada da API
        valor_passado = pk  # Você pode ajustar conforme necessário
        print(valor_passado)
        # Verifica se existem campanhas vinculadas ao valor passado
        campanhas_vinculadas = bmm_campanha.objects.filter(template=valor_passado, statusregistro_id=200)

        if campanhas_vinculadas.exists():
            # Atualiza o campo apropriado para pausar a campanha
            campanhas_vinculadas.update(status_campanha='PA')

            # Você pode adicionar mais lógica aqui, se necessário

            return Response({'message': 'Campanhas pausadas com sucesso!','status':'200'}, status=status.HTTP_200_OK)
        else:
            return Response({'message': 'Nenhuma campanha encontrada nesse template.'}, status=status.HTTP_404_NOT_FOUND)



class filtro_campanhas(viewsets.ModelViewSet):
        queryset = bmm_campanha.objects.all()
        serializer_class = CampaignSerializer

        permission_classes = [permissions.IsAuthenticated]
        filter_backends = [filters.SearchFilter]
        search_fields = ['']
        # Return data for edit in transportadora-list
        def list(self, request, *args, **kwargs):
            query = request.query_params.get('query', '')
            queryset = self.filter_queryset(self.get_queryset())

            if query:
                queryset = queryset.filter(empresa=request.user.empresa, status_campanha=query, statusregistro_id=200).order_by('-id')
            else:
                queryset = queryset.filter(empresa=request.user.empresa, statusregistro_id=200).order_by('-id')

            paginator = CustomPagination()
            paginated_queryset = paginator.paginate_queryset(queryset, request)

            campanhas_dados = []
            for campanha in paginated_queryset:
                # Filtrando os boomerangues da campanha
                boomerangues = bmm_boomerangue.objects.filter(campanha=campanha)
                # Filtrando as solicitações aprovadas para esses boomerangues
                solicitacoes = SolicitacaoPagamento.objects.filter(boomerangue__in=boomerangues, status="APROVADO")

                # Calculando estatísticas para os boomerangues
                estatisticas = boomerangues.aggregate(
                    nBoomerangues=Count('id'),
                    Enviado=Sum(Case(When(bm_enviado=1, then=Value(1)), default=Value(0), output_field=IntegerField())),
                    Comprando=Sum(Case(When(dt_primeira_compra__isnull=False, bm_aceito='N', bm_com_erro='N', then=Value(1)), default=Value(0), output_field=IntegerField())),
                    ValorComprando=Sum(Case(When(dt_primeira_compra__isnull=False, bm_aceito='N', bm_com_erro='N', then=F('valor_atual')), default=Value(0), output_field=FloatField())),
                    CarrinhoAbandonado=Sum(Case(When(dt_ultima_compra__isnull=False, dt_ultima_compra__lte=now() - timedelta(hours=6), bm_aceito='N', bm_com_erro='N', then=Value(1)), default=Value(0), output_field=IntegerField())),
                    ValorCarrinhoAbandonado=Sum(Case(When(dt_ultima_compra__isnull=False, dt_ultima_compra__lte=now() - timedelta(hours=6), bm_aceito='N', bm_com_erro='N', then=F('valor_atual')), default=Value(0), output_field=FloatField())),
                    Vendas=Sum(Case(When(bm_aceito='S', then=Value(1)), default=Value(0), output_field=IntegerField()))
                )

                # Calculando valor total e ticket médio das solicitações aprovadas
                valor_vendas = solicitacoes.aggregate(total_valor=Coalesce(Sum('valor'), 0, output_field=FloatField()))['total_valor']
                quantidade_vendas = solicitacoes.count()
                ticket_medio = round(valor_vendas / quantidade_vendas) if quantidade_vendas > 0 else 0

                estatisticas['ValorVendas'] = valor_vendas
                estatisticas['TicketMedio'] = ticket_medio

                # Itens mais vendidos
                itens_mais_vendidos = bmm_boomerangueitens.objects.filter(campanha=campanha).values(
                    'produto_id', 'produto__Descricao_Amigavel', 'unidade_venda', 'produto__PathProduto'
                ).annotate(
                    qtdComprada=Sum('QuantidadeCompradaUN'),
                    totalcompra=F('ValorMultimplicadorCompra'),
                    nroPedidos=Count('boomerangue', distinct=True)
                ).filter(qtdComprada__gt=0).order_by('produto__Descricao_Amigavel')[:3]

                campanha_data = {
                    'id': campanha.id,
                    'TextoHeader': campanha.TextoHeader,
                    'Campanha': campanha.Campanha,
                    'TextoPromocional': campanha.TextoPromocional,
                    'status_campanha': campanha.status_campanha,
                    'Estatisticas': estatisticas,
                    'ItensMaisVendidos': list(itens_mais_vendidos)
                }
                campanhas_dados.append(campanha_data)

            return Response(campanhas_dados)

class filtro_boomerangues(viewsets.ModelViewSet):
        queryset = bmm_boomerangue.objects.all()
        serializer_class = Bmm_BoomerangueSerializer

        permission_classes = [permissions.IsAuthenticated]
        filter_backends = [filters.SearchFilter]
        search_fields = ['']
        # Return data for edit in transportadora-list
        def list(self, request, *args, **kwargs):
            query = request.query_params.get('query', '')  # Obtém o parâmetro 'query' da solicitação
            id = request.query_params.get('id', '')
            queryset = self.filter_queryset(self.get_queryset())  # Aplica filtros, se houver

            if query:
                # Filtra os resultados com base na consulta do usuário
                queryset = queryset.filter(campanha = id, status_campanha=query)
            else:
                queryset = queryset.filter(campanha = id)

            serializer = self.get_serializer(queryset, many=True)
            data = [{'id': item['id'], 'campanha_nome': item['campanha_nome'], 'titulo_boomerangue': item['titulo_boomerangue']} for item in serializer.data]
            print(data)
            return Response(data)


class remove_imagem(viewsets.ModelViewSet):
    queryset = bmm_template.objects.all()
    serializer_class = Bmm_templateSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['get'])
    def remove_image(self, request, pk=None):
        template = self.get_object()
        image_type = request.GET.get('image_type')

        # Verifique se o campo da imagem existe no objeto
        if hasattr(template, image_type):
            # Defina o campo da imagem como nulo no modelo
            setattr(template, image_type, None)
            template.save()
            return Response({'message': 'Imagem removida com sucesso.'})
        else:
            return Response({'message': 'Tipo de imagem inválido.'}, status=400)


# remove imagem da campanha
class remove_imagem_campanha(viewsets.ModelViewSet):
    queryset = bmm_campanha.objects.all()
    serializer_class = CampaignSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['get'])
    def remove_image(self, request, pk=None):
        template = self.get_object()
        image_type = request.GET.get('image_type')

        # Determine o campo da imagem com base no tipo fornecido
        image_field = getattr(template, image_type)

        # Remova o arquivo do sistema de arquivos
        image_field.delete(save=False)

        # Defina o campo da imagem como nulo no modelo
        setattr(template, image_type, None)
        template.save()

        return Response({'message': 'Imagem removida com sucesso.'})


# remove imagem da campanha
class retorna_boomerangues_nomes(viewsets.ModelViewSet):
    queryset = bmm_boomerangue.objects.all()
    serializer_class = Bmm_BoomerangueSerializer
    permission_classes = [permissions.IsAuthenticated]

    filter_backends = [filters.SearchFilter]
    search_fields = ['']

    def list(self, request, *args, **kwargs):
        query = request.query_params.get('query', '')
        id = request.query_params.get('id', '')
        queryset = self.filter_queryset(self.get_queryset())

        if query:
            # Filtra os resultados com base na consulta do usuário e no campo 'titulo_boomerangue'
            queryset = queryset.filter(campanha=id)
            queryset = queryset.filter(Q(entidade__Entidade__icontains=query) | Q(entidade__CNPJ__icontains=query))
            queryset = queryset.filter(statusregistro_id=200)
        else:
            queryset = queryset.filter(campanha=id, statusregistro_id=200)[:25]

        serializer = self.get_serializer(queryset, many=True)
        data = []
        for item in serializer.data:
            entidade_id = item.get('entidade', None)
            entidade = ger_entidade.objects.get(pk=entidade_id)


            data.append({'id': item['id'], 'campanha_nome': item['campanha_nome'], 'entidade': entidade.Entidade, 'TotalQuantidade': item['TotalQuantidade'], 'TotalProdutos':item['TotalProdutos'], 'valor_atual': item['valor_atual']})
        return Response(data)


# remove imagem da campanha
class retorna_nome_itens(viewsets.ModelViewSet):
    queryset = bmm_template_itens.objects.all()
    serializer_class = bmm_template_itensSerializer
    permission_classes = [permissions.IsAuthenticated]

    filter_backends = [filters.SearchFilter]
    search_fields = ['']


    def retrieve(self, request, pk=None):
        try:
            item = bmm_template_itens.objects.get(pk=pk)
        except bmm_template_itens.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)

        # Inicia a lógica para buscar dados relacionados
        produto_id = item.produto_id
        importado = item.templateimportado_id
        produto_desc = None
        arquivo_import = None

        if produto_id is not None:
            try:
                produto_obj = ger_produtos.objects.get(pk=produto_id)
                produto_desc = produto_obj.Descricao
                imagem_produto = produto_obj.PathProduto
            except ger_produtos.DoesNotExist:
                print(f"Warning: wppt_templates com ID {produto_id} não encontrado.")
        else:
            produto_desc = ''
            imagem_produto = ''

        if importado is not None:
            try:
                importado_obj = bmm_templateimportado.objects.get(pk=importado)
                arquivo_import = importado_obj.NomeArquivo
            except bmm_templateimportado.DoesNotExist:
                print(f"Warning: wppt_templates com ID {importado} não encontrado.")
        
        else:
            arquivo_import = ''

        # Prepara a resposta
        data = {
            'id': item.id,
            'valor_atacado': item.valor_atacado,
            'valor_unitario': item.valor_unitario,
            'valor_total_item': item.valor_total_item,
            'unidade_venda': item.unidade_venda,
            'produto_bloqueado': item.produto_bloqueado,
            'descricao': produto_desc,
            'unidade_caixa': item.unidade_caixa,
            'arquivo_import': arquivo_import,
            'imagem':imagem_produto,
        }

        return Response(data)

    def list(self, request, *args, **kwargs):
        query = request.query_params.get('query', '')
        id = request.query_params.get('id', '')
        queryset = self.filter_queryset(self.get_queryset())

        if query:
            queryset = queryset.filter(template=id, produto__Descricao__icontains=query)
        else:
            queryset = queryset.filter(template=id).order_by('ordem')[:50]

        serializer = self.get_serializer(queryset, many=True)

        data = []
        for item in serializer.data:
                # Obtém o ID do wpptemplate do item
                produto_id = item.get('produto', None)
                importado = item.get('templateimportado', None)
                if produto_id is not None:
                    # Tenta obter o objeto wppt_templates usando o ID
                    try:
                        produto_obj = ger_produtos.objects.get(pk=produto_id)
                        produto_desc = produto_obj.Descricao
                        imagem = produto_obj.PathProduto
                    except produto_obj.DoesNotExist:
                        produto_desc = None
                        imagem=''
                        print(f"Warning: wppt_templates com ID {produto_id} não encontrado.")
                else:
                    produto_desc = None
                    imagem = ''
                    print(f"Warning: 'wpptemplate' não está presente para o item com id={item['id']}")

                if importado is not None:
                    # Tenta obter o objeto wppt_templates usando o ID
                    try:
                        importado_obj = bmm_templateimportado.objects.get(pk=importado)
                        arquivo_import = importado_obj.NomeArquivo
                    except arquivo_import.DoesNotExist:
                        arquivo_import = None
                        print(f"Warning: wppt_templates com ID {produto_id} não encontrado.")
                else:
                    arquivo_import = None
                    print(f"Warning: 'wpptemplate' não está presente para o item com id={item['id']}")

                data.append({
                    'id': item['id'],
                    'unidade_caixa': item['unidade_caixa'],
                    'valor_atacado': item['valor_atacado'],
                    'valor_unitario': item['valor_unitario'],
                    'valor_total_item': item['valor_total_item'],
                    'unidade_venda': item['unidade_venda'],
                    'produto_bloqueado':item['produto_bloqueado'],
                    'descricao': produto_desc,
                    'arquivo_import': arquivo_import,
                    'imagem': imagem

                })


      
        return Response(data)
    

class logs_api(viewsets.ModelViewSet):
    queryset = bmm_boomeranguelog.objects.all()
    serializer_class = bmm_boomeranguelogSerializer
    permission_classes = [permissions.IsAuthenticated]

    filter_backends = [filters.SearchFilter]
    search_fields = ['']




    def retrieve(self, request, pk=None):
        try:
            item = bmm_boomeranguelog.objects.get(pk=pk)
        except bmm_boomeranguelog.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)

        # Inicia a lógica para buscar dados relacionados
        produto_id = item.produto_id
        importado = item.templateimportado_id
        produto_desc = None
        arquivo_import = None

        if produto_id is not None:
            try:
                produto_obj = ger_produtos.objects.get(pk=produto_id)
                produto_desc = produto_obj.Descricao
            except ger_produtos.DoesNotExist:
                print(f"Warning: wppt_templates com ID {produto_id} não encontrado.")

        if importado is not None:
            try:
                importado_obj = bmm_templateimportado.objects.get(pk=importado)
                arquivo_import = importado_obj.NomeArquivo
            except bmm_templateimportado.DoesNotExist:
                print(f"Warning: wppt_templates com ID {importado} não encontrado.")

        # Prepara a resposta
        data = {
            'id': item['id'],
                    'titulo_boomerangue': boomerangue_desc,
                    'tipolog_id': item['tipolog_id'],
                    'origemlog_id': item['origemlog_id'],
                    'Descricao': boomerangue_item_desc,
                    'boomerangueimportacao_id': item['boomerangueimportacao_id'],
                    'entidade':entidade_desc,
                    'entidade_id': entidade.pk,
                    'acao_id': item['acao_id'],
                    'acaoenviada_id': item['acaoenviada_id'],
                    'Token': item['Token'],
                    'Template': item['Template'],
                    'DataLog': item['DataLog'],
                    'TempoLog': item['TempoLog'],
                    'VerApiLog': item['VerApiLog'],
                    'Complemento1': item['Complemento1'],
        }

        return Response(data)

    def list(self, request, *args, **kwargs):
        query = request.query_params.get('query', '')
        id = request.query_params.get('id', '')
        queryset = self.filter_queryset(self.get_queryset())

        if query:
            queryset = queryset.filter(boomerangue__campanha=id, boomerangue__entidade__Entidade__icontains=query)
        else:
            queryset = queryset.filter(boomerangue__campanha=id).order_by('-DataLog')[:25]

        serializer = self.get_serializer(queryset, many=True)

        data = []
        for item in serializer.data:
                # Obtém o ID do wpptemplate do item
                boomerangue = item.get('boomerangue', None)
                boomerangue_item = item.get('boomerangueitem', None)
                entidade = item.get('entidade_id', None)
                if boomerangue is not None:
                    # Tenta obter o objeto wppt_templates usando o ID
                    try:
                        boomerangue_obj = bmm_boomerangue.objects.get(pk=boomerangue)
                        boomerangue_desc = boomerangue_obj.titulo_boomerangue
                    except boomerangue_obj.DoesNotExist:
                        boomerangue_desc = None
                        print(f"Warning: wppt_templates com ID {boomerangue} não encontrado.")
                else:
                    boomerangue_desc = None
                    print(f"Warning: 'wpptemplate' não está presente para o item com id={item['id']}")

                if boomerangue_item is not None:
                    # Tenta obter o objeto wppt_templates usando o ID
                    try:
                        boomerangue_item_obj = bmm_boomerangueitens.objects.get(pk=boomerangue_item)
                        boomerangue_item_desc = boomerangue_item_obj.produto.Descricao
                    except boomerangue_item_obj.DoesNotExist:
                        boomerangue_item_obj = None
                        print(f"Warning: wppt_templates com ID {produto_id} não encontrado.")
                else:
                    boomerangue_item = None
                    boomerangue_item_desc = ''
                    print(f"Warning: 'wpptemplate' não está presente para o item com id={item['id']}")


                if entidade is not None:
                    # Tenta obter o objeto wppt_templates usando o ID
                    try:
                        entidade_obj = ger_entidade.objects.get(pk=entidade)
                        entidade_desc = entidade_obj.Entidade
                    except entidade_obj.DoesNotExist:
                        entidade_obj = None
                        
                else:
                    entidade = None
                

                data.append({
                    'id': item['id'],
                    'titulo_boomerangue': boomerangue_desc,
                    'tipolog_id': item['tipolog_id'],
                    'origemlog_id': item['origemlog_id'],
                    'Descricao': boomerangue_item_desc,
                    'boomerangueimportacao_id': item['boomerangueimportacao_id'],
                    'entidade':entidade_desc,
                    'entidade_id': entidade_obj.pk,
                    'acao_id': item['acao_id'],
                    'acaoenviada_id': item['acaoenviada_id'],
                    'Token': item['Token'],
                    'Template': item['Template'],
                    'DataLog': item['DataLog'],
                    'TempoLog': item['TempoLog'],
                    'VerApiLog': item['VerApiLog'],
                    'Complemento1': item['Complemento1'],

                })


      
        
        return Response(data)



# remove imagem da campanha
class filtro_eventos(viewsets.ModelViewSet):
    queryset = bmm_boomerangueevento.objects.all()
    serializer_class = bmm_boomerangueEventoSerializer
    permission_classes = [permissions.IsAuthenticated]

    filter_backends = [filters.SearchFilter]
    search_fields = ['']


    def list(self, request, *args, **kwargs):
        query = request.query_params.get('query', '')
        id = request.query_params.get('id', '')
        queryset = self.filter_queryset(self.get_queryset())

        if query:
            queryset = queryset.filter(boomerangue__campanha=id, tipoevento_id=query).order_by('-DataGeracao')
        else:
            queryset = queryset.filter(boomerangue__campanha=id).order_by('-DataGeracao')[:25]

        serializer = self.get_serializer(queryset, many=True)

        data = []
        for item in serializer.data:
                # Obtém o ID do wpptemplate do item
                data.append({
                'id': item.get('id'),
                'tipoevento_id': item.get('tipoevento_id'),
                'origemevento_id': item.get('origemevento_id'),
                'DataGeracao': item.get('DataGeracao'),
                'ProtocoloGeracao': item.get('ProtocoloGeracao'),
                'DataProgramada': item.get('DataProgramada'),
                'statusevento_id': item.get('statusevento_id'),
                'ChaveBot': item.get('ChaveBot'),
                'NomeBot': item.get('NomeBot'),
                'DataBot': item.get('DataBot'),
        })


      
        
        return Response(data)
    


# Sem permissões abaixo


class logs_boomerangues(viewsets.ModelViewSet):
    queryset = bmm_boomeranguelog.objects.all()
    serializer_class = bmm_boomeranguelogSerializer
    # permission_classes = [permissions.IsAuthenticated]

    filter_backends = [filters.SearchFilter]
    search_fields = ['']

    def list(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    # def create(self, request, *args, **kwargs):
    #     return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def retrieve(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    # def update(self, request, *args, **kwargs):
    #     return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def destroy(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)
    
    # Edit data
    def partial_update(self, request, pk=None):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)
    

# Atualiza os valores do usuário no banco
class bmm_boomerangueitens_clientes(viewsets.ModelViewSet):
    """
    API endpoint that allows Campaigns to be viewed, edited or created.
    """
    queryset = bmm_boomerangueitens.objects.all()
    serializer_class = bmm_boomerangueitensSerializer
    # Não pode haver autenticação aqui
    # permission_classes = [permissions.IsAuthenticated]

    # Nenhuma outra ação é permitida nessa api somente o patch. Questão de segurança já que ela não pode ter o permissions.IsAuthenticated
    def list(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def create(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def retrieve(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    # def update(self, request, *args, **kwargs):
    #     return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def destroy(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)
    
    # Edit data
    def partial_update(self, request, pk=None):
        try:
            condicao = bmm_boomerangueitens.objects.get(pk=pk)
        except bmm_boomerangueitens.DoesNotExist:
            return Response({"error": "Item not found."}, status=status.HTTP_404_NOT_FOUND)

        """
        Verifica se os campos atualizados são permitidos.
        """
        # Somente estes campos podem ser atualizados
        campos_permitidos = {'QuantidadeCompradaUN', 'ValorMultimplicadorCompra', 'ValorTotalCompra'}  # campos permitidos para atualização
        campos_enviados = set(request.data)


        if not campos_enviados.issubset(campos_permitidos):
            campos_nao_permitidos = campos_enviados - campos_permitidos
            return Response({"error": f"Os seguintes campos não podem ser atualizados:{campos_nao_permitidos}"}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(condicao, data=request.data, partial=True)
        condicao.boomerangue.data_ult_open_web = now().strftime("%Y-%m-%d %H:%M:%S.%f")
        condicao.boomerangue.save()  
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

# Atualiza os valores do usuário no banco
class compra_efetuada(viewsets.ModelViewSet):
    """
    API endpoint that allows Campaigns to be viewed, edited or created.
    """
    queryset = bmm_boomerangue.objects.all()
    serializer_class = Bmm_BoomerangueSerializer
    # Não pode haver autenticação aqui
    # permission_classes = [permissions.IsAuthenticated]

    # Nenhuma outra ação é permitida nessa api somente o patch. Questão de segurança já que ela não pode ter o permissions.IsAuthenticated
    def list(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def create(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def retrieve(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    # def update(self, request, *args, **kwargs):
    #     return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def destroy(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)
    
    # Edit data
    def partial_update(self, request, pk=None):
        try:
            condicao = bmm_boomerangue.objects.get(pk=pk)
        except bmm_boomerangue.DoesNotExist:
            return Response({"error": "Item not found."}, status=status.HTTP_404_NOT_FOUND)

        def remover_caracteres_nao_numericos(valor):
            # Usa expressão regular para remover tudo que não for número
            return re.sub(r'\D', '', valor)
        """
        Verifica se os campos atualizados são permitidos.
        """
        # Somente estes campos podem ser atualizados
        # campos permitidos para atualização
        campos_permitidos = {'CNPJ', 'condicoes_pagamento'}  # campos permitidos para atualização
        campos_enviados = set(request.data)

        if not campos_enviados.issubset(campos_permitidos):
            campos_nao_permitidos = campos_enviados - campos_permitidos
            return Response({"error": f"Os seguintes campos não podem ser atualizados:{campos_nao_permitidos}"}, status=status.HTTP_404_NOT_FOUND)


        cnpj_original = remover_caracteres_nao_numericos(condicao.entidade.CNPJ)
        cnpj = remover_caracteres_nao_numericos(request.data['CNPJ'])


        if(cnpj_original != cnpj):
            desc = 'CNPJ'
            if(len(cnpj_original) == 11):
                desc = 'CPF'
            return Response({"error": f"{desc} Inválido"}, status=status.HTTP_404_NOT_FOUND)

        if(condicao.bm_aceito=='S' and condicao.bm_mensagem_status == '900 - Compra'):
            return Response({"error": f"Esse pedido já foi feito!"}, status=status.HTTP_404_NOT_FOUND)

        if(request.data['condicoes_pagamento'] == ''):
            return Response({"error": f"Escolha uma condição de pagamento"}, status=status.HTTP_404_NOT_FOUND)

        if(condicao.compra_minima_vlr > condicao.TotalProdutos):
            return Response({"error": f"O valor Mínimo para efetuar a compra é R$ {condicao.compra_minima_vlr}"}, status=status.HTTP_404_NOT_FOUND)

        itens = bmm_boomerangueitens.objects.filter(boomerangue=condicao.pk)
        for item in itens:
            if item.QuantidadeCompradaUN > 0:
                if item.produto.quantidade_disponivel < item.QuantidadeCompradaUN:
                    return Response({"error": f"O item {item.produto.Descricao_Amigavel} Está esgotado"}, status=status.HTTP_404_NOT_FOUND)
                else:
                    item.produto.quantidade_disponivel -= item.QuantidadeCompradaUN
                    item.produto.save()


        data = {
            'data_aceite_bm': datetime.datetime.now(),
            'bm_aceito': 'S',
            'bm_mensagem_status': '900 - Compra',
            'statusregistro_id': 5400,
            'bm_status':'C',
            'bmstatus': 'C',
            'status_integracao': 5,
            'condicoes_pagamento': request.data['condicoes_pagamento']
        }


        serializer = self.get_serializer(condicao, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class save_opcao_padrao(viewsets.ModelViewSet):
    queryset = ger_opcoes_padrao.objects.all()
    serializer_class = opcao_padraoSeriealizer
    permission_classes = [permissions.IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        aplicar_todos = request.query_params.get('check', '')
        print(request.data)
        empresa_do_usuario = request.user.empresa


        try:
            # Verifica se a opção padrão já existe
            opcao_padrao = ger_opcoes_padrao.objects.get(empresa=empresa_do_usuario)
            created = False
        except ger_opcoes_padrao.DoesNotExist:
            # Cria uma nova opção padrão se não existir
            opcao_padrao = ger_opcoes_padrao(empresa=empresa_do_usuario)
            created = True

        data = request.data.copy()
        imagem_arquivo = data.get('imagem_footer_padrao')
        if isinstance(imagem_arquivo, list):
            data['imagem_footer_padrao'] = imagem_arquivo[0] if imagem_arquivo else None

        with transaction.atomic():
            if created:
                # Tratamento específico para criação
                serializer = self.get_serializer(data=data)
                serializer.is_valid(raise_exception=True)
                self.perform_create(serializer)
            else:
                # Atualização da instância existente
                for key, value in data.items():
                    if hasattr(opcao_padrao, key):
                        setattr(opcao_padrao, key, value)
                opcao_padrao.save()

        # Aplica os valores aos templates, se necessário
        self.aplicar_valores_aos_templates(aplicar_todos, empresa_do_usuario, opcao_padrao)

        return Response({'status': 'sucesso', 'id': opcao_padrao.id}, status=status.HTTP_201_CREATED)

    def aplicar_valores_aos_templates(self, aplicar_todos, empresa, opcao_padrao):
        if aplicar_todos == 'true':
            print("entrou aqui")
            templates = bmm_template.objects.filter(empresa=empresa, statusregistro_id=200)
            print(templates)
        else:
            templates = bmm_template.objects.filter(
                empresa=empresa,
                link_footer__isnull=True,
                image_footer__isnull=True,
                statusregistro_id=200
            )

        for template in templates:
            template.link_footer = opcao_padrao.link_footer_padrao
            template.image_footer = opcao_padrao.imagem_footer_padrao
            template.save()        


    @action(detail=False, methods=['get'])
    def ultima(self, request):
        try:
            ultima_opcao = ger_opcoes_padrao.objects.filter(
                empresa=request.user.empresa
            ).latest('cadastro_dt')
            serializer = self.get_serializer(ultima_opcao)
            return Response(serializer.data)
        except ger_opcoes_padrao.DoesNotExist:
            return Response({'message': 'Nenhuma opção padrão encontrada.'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['get'], url_path='remove-image')
    def remove_image(self, request, pk=None):
        opcao_padrao = self.get_object()

        # Aqui você pode verificar qual campo de imagem deve ser removido.
        # Exemplo: remover 'imagem_footer_padrao'
        opcao_padrao.imagem_footer_padrao.delete(save=True)

        return Response({'status':'imagem excluida!'}, status=status.HTTP_204_NO_CONTENT)


#  Gráficos da tela dashboard campanhas
class indice_vendas_dia(viewsets.ModelViewSet):
    queryset = SolicitacaoPagamento.objects.all()
    serializer_class = VendasPorDiaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request, pk=None):
        id = request.query_params.get('id', '')
        try:
            vendas_por_dia = SolicitacaoPagamento.objects.filter(
                boomerangue__campanha_id=id,
                status__in = ["APROVADO", "PAGO"]
            ).values('data_tx').annotate(
                total_boomerangues=Count('id'),
                total_vendas=Sum('valor')
            ).order_by('data_tx')

            serializer = self.get_serializer(vendas_por_dia, many=True)
            print("DADOS", serializer.data)
            return Response(serializer.data)

        except SolicitacaoPagamento.DoesNotExist:
            return Response(status=404)


