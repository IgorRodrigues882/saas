from rest_framework import viewsets
from rest_framework import permissions
from rest_framework import status
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.request import Request
from django.http import JsonResponse
import datetime
import mimetypes
from datetime import datetime
from rest_framework.response import Response
from boomerangue.apps.msg_messages.models import MsgMessage, canais, canais_leads, usuario_lead
from login.models import Usuario
from boomerangue.apps.wpp_templates.models import wpp_templates
from boomerangue.apps.wpp_templatescomponents.models import wpp_templatescomponents, fluxo_sendpulse
from boomerangue.apps.ger_entidades.models import ger_entidade
from boomerangue.apps.campaign.models import bmm_boomerangue
from boomerangue.apps.pix_transactions.models import SolicitacaoPagamento
from boomerangue.apps.bot.models import Bot
from api.pix_transactions.seriealizers import SolicitacaoPagamentoSerializer
from api.campaign.views import CampaignViewSet
from .seriealizers import MsgMessageSerializer, canaisSerializer, canais_leadsSerializer, usuario_leadSerializer
from rest_framework.test import APIClient
from api.ger_entidades.seriealizers import CreateEntidadeSerializer
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from django.db.models import Exists, OuterRef, Sum, Q, Count, Subquery, Max, F, Value, IntegerField, Case, When, CharField
from boomerangue.apps.pix_database.models import PixEvent, PixRequest
import json
import os
from itertools import groupby
import requests
from boomerangue.apps.wpp_templates.models import ia_geracao
import openai
from PIL import Image, ImageEnhance, ImageFilter, ImageOps
import pytesseract
from celery import shared_task
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import io
from decimal import Decimal
import re
import fitz  # PyMuPDF
from django.core.files.base import ContentFile
from api.pix.views import buscar_status_pix
from google.cloud import vision  # Importa a biblioteca do Google Cloud Vision
from google.oauth2 import service_account


class MessagePagination(PageNumberPagination):
    page_size = 20  # Número de mensagens por página
    page_size_query_param = 'page_size'
    max_page_size = 100


class MsgMessageViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows MsgMessage to be viewed, edited or created.
    """

    queryset = MsgMessage.objects.all()
    serializer_class = MsgMessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = MessagePagination
    # Return data for edit in transportadora-list
    def retrieve(self, request, pk=None):
        try:
            condicao = MsgMessage.objects.get(pk=pk)
        except MsgMessage.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)

        serializer = self.get_serializer(condicao)
        data = serializer.data
        data['spl_key'] = condicao.entidade.lead_key_spl
        data['telefone'] = condicao.entidade.Telefone1
        return Response(data)
    
    # Edit data
    def patch(self, request, pk=None):
        try:
            condicao = MsgMessage.objects.get(pk=pk)
        except MsgMessage.DoesNotExist:
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
        instance.exclusao_dt = timezone.now()
        
        # Defina status como 9000
        instance.statusregistro_id = 9000

        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
    

    @action(detail=False, methods=['post'])
    def retorna_mensagens(self, request):
        boomerangue_id = request.data.get('bmm_id', '')
        entidade_id = request.data.get('entidade', '')
        campanha_id = request.data.get('campanha', '')

        if boomerangue_id:
            mensagens = list(MsgMessage.objects.filter(boomerangue_id=boomerangue_id).order_by('-DataHoraDoEvento'))
        elif entidade_id and campanha_id:
            boomerangue = bmm_boomerangue.objects.filter(campanha=campanha_id, entidade=entidade_id).last()
            mensagens = list(MsgMessage.objects.filter(boomerangue_id=boomerangue.id).order_by('-DataHoraDoEvento'))
        elif entidade_id:
            if ger_entidade.objects.filter(empresa = request.user.empresa, id=entidade_id).exists():
                boomerangue = bmm_boomerangue.objects.filter(entidade=entidade_id).last()
                mensagens = list(MsgMessage.objects.filter(boomerangue_id=boomerangue.id).order_by('-DataHoraDoEvento'))
            else:
                entidade_id = str(entidade_id)
                mensagens = list(MsgMessage.objects.filter(
                Q(Sender__endswith=entidade_id[-8:]) | Q(Receiver__endswith=entidade_id[-8:]),
                empresa=request.user.empresa
            ).order_by('-DataHoraDoEvento'))

        def ordenar_por_proxima_msg(mensagens_list):
            if not mensagens_list:
                return []

            mensagens_map = {msg.message_id: msg for msg in mensagens_list}
            mensagens_ordenadas = []
            visitados = set()

            mensagem_inicial = None
            for msg in mensagens_list:
                if not any(msg.message_id == other_msg.proxima_msg for other_msg in mensagens_list):
                    mensagem_inicial = msg
                    break

            mensagem_atual = mensagem_inicial
            while mensagem_atual:
                mensagens_ordenadas.append(mensagem_atual)
                visitados.add(mensagem_atual.message_id)
                proxima_msg_id = mensagem_atual.proxima_msg
                mensagem_atual = mensagens_map.get(proxima_msg_id)
                if mensagem_atual and mensagem_atual.message_id in visitados:
                    break

            return mensagens_ordenadas

        mensagens_ordenadas = []
        mensagens_grupo = []

        for i, mensagem in enumerate(mensagens):
            if i > 0 and mensagem.DataHoraDoEvento != mensagens[i - 1].DataHoraDoEvento:
                mensagens_ordenadas.extend(mensagens_grupo)
                mensagens_grupo = []

            mensagens_grupo.append(mensagem)

        if mensagens_grupo:
            mensagens_ordenadas.extend(ordenar_por_proxima_msg(mensagens_grupo))

        # Final ordering of the messages
        mensagens_ordenadas_final = []
        data_grupos = {}

        # Group messages by DataHoraDoEvento
        for msg in mensagens_ordenadas:
            data_evento = msg.DataHoraDoEvento
            if data_evento not in data_grupos:
                data_grupos[data_evento] = []
            data_grupos[data_evento].append(msg)

        # Sort groups by DataHoraDoEvento (descending) and within groups by proxima_msg
        for data_evento in sorted(data_grupos.keys(), reverse=True):
            grupo_msgs = data_grupos[data_evento]
            mensagens_ordenadas_final.extend(ordenar_por_proxima_msg(grupo_msgs))

        templates = wpp_templates.objects.filter(
            empresa=request.user.empresa,
            statusregistro_id=200,
        ).prefetch_related('wpp_templatescomponents_set')

        templates_dict = {tpl.template_name: tpl for tpl in templates}

        mensagens_to_update = []

        for mensagem in mensagens_ordenadas_final:
            if mensagem.direcao == 'O' and (mensagem.mensagem_tratada == 'N' or mensagem.mensagem_tratada is None):
                template = templates_dict.get(mensagem.MensagemTexto)
                if template:
                    todas_mensagens = ''
                    url = ''
                    ordem_componentes = ['HEADER', 'BODY', 'FOOTER', 'BUTTONS', 'LIST']

                    for tipo in ordem_componentes:
                        for msg in template.wpp_templatescomponents_set.filter(component_type=tipo):
                            if msg.image_content:
                                url = f'https://{request.user.empresa.url_boomerangue}.boomerangue.me' + msg.image_content.url
                            todas_mensagens += (msg.text_content or '') + "\n \n"

                    mensagem.URL_Anexo = url
                    mensagem.MensagemTexto = todas_mensagens
                    mensagem.mensagem_tratada = 'S'
                    mensagens_to_update.append(mensagem)

        MsgMessage.objects.bulk_update(mensagens_to_update, ['URL_Anexo', 'MensagemTexto'])

        page = self.paginate_queryset(mensagens_ordenadas_final)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(mensagens_ordenadas_final, many=True)
        return Response(serializer.data)


    def is_valid_phone(self, phone):
        """
        Valida e formata números de telefone em diferentes formatos.
        Retorna o número formatado se válido, None caso contrário.
        """
        # Remove todos os caracteres não numéricos
        phone = re.sub(r'\D', '', phone)
        
        # Se o telefone já começar com 55, verifica se tem o tamanho correto
        if phone.startswith('55'):
            if len(phone) >= 12:  # 55 + DDD + número (8 ou 9 dígitos)
                return phone
        else:
            # Se não começar com 55, verifica se é um número válido
            # Verifica se tem 10 ou 11 dígitos (com DDD)
            if len(phone) in [10, 11]:
                return '55' + phone
            # Verifica se tem 8 ou 9 dígitos (sem DDD)
            elif len(phone) in [8, 9]:
                return '5511' + phone  # Adiciona 55 e DDD padrão (11)
        
        return None

    @action(detail=False, methods=['post'])
    def retorna_mensagens_usuarios(self, request):
        campanha_id = request.data.get('campanha')
        query = request.data.get('query')
        user_canal = request.data.get('user_canal')
        user = request.data.get('user')
        empresa = request.user.empresa
        try:
            bot = Bot.objects.get(empresa = empresa, bot_padrao='S')
        except:
            bot=''
        # Subquery para pegar o ID e os dados da última mensagem de cada entidade
        ultima_mensagem_subquery = MsgMessage.objects.filter(
            entidade_id=OuterRef('pk')
        ).order_by('-DataHoraDoEvento').values('id', 'MensagemTexto', 'DataHoraDoEvento')[:1]

        entidades_query = ger_entidade.objects.filter(
            statusregistro_id=200,
            empresa=empresa
        )

        if campanha_id:
            entidades_query = entidades_query.filter(
                Exists(
                    MsgMessage.objects.filter(
                        campanha_id=campanha_id,
                        entidade_id=OuterRef('pk')
                    )
                )
            )
        else:
            entidades_query = entidades_query.filter(
                Exists(
                    MsgMessage.objects.filter(
                        empresa=empresa,
                        entidade_id=OuterRef('pk')
                    )
                )
            )

        # Aplicar filtros opcionais
        if query:
            entidades_query = entidades_query.filter(
                Q(Entidade__icontains=query) | Q(Telefone1__icontains=query)
            )

        if user_canal:
            if user:
                entidades_query = entidades_query.filter(
                    id__in=usuario_lead.objects.filter(
                        usuario_id=user_canal,
                        statusregistro_id=200
                    ).values('lead_id')
                )
            else:
                entidades_query = entidades_query.filter(
                    id__in=canais_leads.objects.filter(
                        canal_id=user_canal,
                        statusregistro_id=200
                    ).values('lead_id')
                )

        # Annotate última mensagem e contar mensagens não lidas
        entidades = entidades_query.annotate(
            ultima_mensagem_id=Subquery(ultima_mensagem_subquery.values('id')),
            ultima_mensagem_texto=Subquery(ultima_mensagem_subquery.values('MensagemTexto')),
            ultima_mensagem_data=Subquery(ultima_mensagem_subquery.values('DataHoraDoEvento')),
            msgs_nao_lidas=Count(
                'msgmessage',
                filter=Q(msgmessage__msg_lida__in=['N', None])
            )
        ).order_by('-ultima_mensagem_data')  # Alterado para ordenar por data

        entidades_dados = [
            {
                'entidade_id': entidade.id,
                'nome': entidade.Entidade,
                'telefone': entidade.Telefone1,
                'ultima_mensagem': entidade.ultima_mensagem_texto or '',
                'data': entidade.ultima_mensagem_data,
                'msgs_nao_lidas': entidade.msgs_nao_lidas,
            }
            for entidade in entidades
        ]

        # Buscar mensagens para usuários não cadastrados
        mensagens = MsgMessage.objects.filter(
            empresa=empresa,
            entidade__isnull=True
        )
        if bot:
            mensagens = mensagens.exclude(Sender=bot.bot_numero)

        # Se existe uma query de busca, aplicar também nos telefones não cadastrados
        if query:
            mensagens = mensagens.filter(
                Sender__icontains=query
            )

        mensagens = mensagens.order_by('-DataHoraDoEvento')  # Mantém a ordenação por data

        telefones_nao_cadastrados = {}
        for mensagem in mensagens:
            sender = mensagem.Sender
            telefone_formatado = self.is_valid_phone(sender)
            if telefone_formatado:
                if telefone_formatado not in telefones_nao_cadastrados:
                    telefones_nao_cadastrados[telefone_formatado] = mensagem
                elif mensagem.id > telefones_nao_cadastrados[telefone_formatado].id:
                    telefones_nao_cadastrados[telefone_formatado] = mensagem

        nao_cadastrados_dados = [
            {
                'entidade_id': None,
                'nome': None,
                'telefone': telefone,
                'ultima_mensagem': mensagem.MensagemTexto or '',
                'data': mensagem.DataHoraDoEvento,
                'msgs_nao_lidas': 0,
            }
            for telefone, mensagem in telefones_nao_cadastrados.items()
        ]

        # Combinar os dois conjuntos de dados e ordenar pela última mensagem
        dados_combinados = sorted(
            entidades_dados + nao_cadastrados_dados,
            key=lambda x: (x['data'] or datetime.min, x['entidade_id'] or 0),
            reverse=True
        )

        # Paginar os dados combinados
        page = self.paginate_queryset(dados_combinados)
        if page is not None:
            return self.get_paginated_response(page)

        return Response(dados_combinados)


    

    @action(detail=False, methods=['post'])
    def retorna_mensagens_docs(self, request):
        print("chegou mensagens doc")
        campanha_id = request.data.get('campanha')
        query = request.data.get('query', '')
        
        queryset = MsgMessage.objects.filter(Q(URL_Anexo__isnull=False) & ~Q(URL_Anexo=''), campanha_id = campanha_id).order_by('-DataHoraDoEvento')

        if query:
            queryset = queryset.filter(entidade__Entidade = query)

        page = self.paginate_queryset(queryset)

        serializer = self.get_serializer(page, many=True)
        dados = serializer.data
        for data in dados:
            entidade = ger_entidade.objects.get(id = data.get('entidade'))
            data['entidade_id'] = entidade.pk
            data['entidade'] = entidade.Entidade
            data['Telefone1'] = entidade.Telefone1

        return self.get_paginated_response(dados)


    @action(detail=False, methods=['post'])
    def retorna_status_mensagens(self, request):
        campanha_id = request.data.get('campanha')
        filtro_status = request.data.get('status')

        boomerangues = bmm_boomerangue.objects.filter(campanha=campanha_id)
        mensagens = MsgMessage.objects.filter(boomerangue__in=boomerangues)

        # Filtra entidades que possuem boomerangues
        entidades = ger_entidade.objects.filter(
            empresa=request.user.empresa,
            id__in=boomerangues.values('entidade_id')
        ).distinct()

        if filtro_status:
            mensagens = mensagens.filter(StatusEnvio=filtro_status)
            


        entidades_com_status = []
        for entidade in entidades:
            entidade_msgs = mensagens.filter(entidade_id=entidade.id)
            if entidade_msgs.exists():
                status_envio = entidade_msgs.earliest('DataHoraEnvio').StatusEnvio
                enviou = entidade_msgs.earliest('DataHoraEnvio').Delivered
                data = entidade_msgs.earliest('DataHoraEnvio').DataHoraDoEvento
            else:
                status_envio = 'K'  # Não enviado
                enviou = 'N'
                data = '-'
            entidade_data = CreateEntidadeSerializer(entidade).data
            entidade_data['status_envio'] = status_envio
            entidade_data['enviou'] = enviou
            entidade_data['data_evento_registro'] = data
            entidades_com_status.append(entidade_data)

        page = self.paginate_queryset(entidades_com_status)
        if page is not None:
            return self.get_paginated_response(page)

        return Response(entidades_com_status)

    # @action(detail=False, methods=['post'])
    # def envia_mensagem(self, request):
    #     # Recuperar parâmetros do corpo da requisição
    #     nome = request.user.empresa.template_resposta
    #     texto1 = request.user.nome
    #     texto2 = request.data.get('text2', '')
    #     campanha = request.data.get('campanha','')
    #     entidade = request.data.get('entidade')
    #     empresa = request.user.empresa
    #     retorno = self.chama_mensagens(texto1,texto2,campanha,entidade, nome, empresa)
    #     return retorno


    # def chama_mensagens(self, texto1,texto2,campanha, entidade, nome, empresa):
    #     # Verificar se os campos obrigatórios estão preenchidos
    #     if not texto1 or not texto2:
    #         return Response({"error": "Campos 'nome', 'text1' e 'text2' são obrigatórios."}, status=400)
    #     telefone = ''
    #     boomerangue = ''
    #     if ger_entidade.objects.filter(id = entidade).exists():
    #         if campanha:
    #             boomerangue = bmm_boomerangue.objects.filter(campanha=campanha, entidade=entidade).first()
    #         else:
    #             boomerangue = bmm_boomerangue.objects.filter(entidade=entidade).last()

    #         if not boomerangue:
    #             return Response({"error": "Boomerangue não encontrado."}, status=404)
        
    #     else:
    #         telefone = self.is_valid_phone(str(entidade))
        
    #     if telefone:
    #         bot = Bot.objects.get(empresa = empresa, bot_padrao='S')
    #         if not bot:
    #             return Response({"error": "Bot não encontrado."}, status=404)
    #         numero = telefone
    #         edi_integracao = bot.legenda_3
    #         provider = bot.bot_provedor.provedor_padrao
    #         edi = bot.EDI_Integracao
    #         access_token = CampaignViewSet.obter_access_token(bot)
    #     else:
    #         numero = boomerangue.telefone_bm
    #         edi_integracao = boomerangue.campanha.bot_id.legenda_3
    #         provider = boomerangue.campanha.bot_id.bot_provedor.provedor_padrao
    #         edi = boomerangue.campanha.bot_id.EDI_Integracao
    #         access_token = CampaignViewSet.obter_access_token(boomerangue.campanha.bot_id)
    #         lead_key = boomerangue.entidade.lead_key_spl
    #     # Definir o JSON a ser enviado
    #     print("NOME", nome)
    #     json_data = {
    #         "name": nome,
    #         "components": [
    #             {
    #                 "type": "body",
    #                 "parameters": [
    #                     {
    #                         "type": "text",
    #                         "text": texto2
    #                     },
    #                     {
    #                         "type": "text",
    #                         "text": texto1
    #                     }
    #                 ]
    #             }
    #         ],
    #         "language": {
    #             "policy": "deterministic",
    #             "code": "pt_BR"
    #         }
    #     }

    #     # URL da API para onde o JSON será enviado
    #     api_url = "https://api.boomerangue.co/messages/send-text"
    #     body = {
    #         'number': numero,
    #         'text': '',
    #         'template': json_data,
    #         'instance': edi_integracao,
    #         'provider': provider.lower()
    #     }
    #     header = {'Authorization': f'Bearer {access_token}'}

    #     print("HEADER", header)
    #     print("Numero", numero)
    #     print("edi", edi_integracao)
    #     print("provider", provider)
    #     print('json', json_data)
    #     # Enviar o JSON para a API
    #     response = requests.post(api_url, json=body, headers=header)
    #     print("Response total", response.text)
    #     r = response.json()

    #     print("RESPONSE", r)
    #     # Verificar se a requisição foi bem-sucedida
    #     if response.status_code == 200:
    #         return Response({"message": "Mensagem enviada com sucesso!"})
    #     else:
    #         return Response({"error": r}, status=response.status_code)  
        

    @action(detail=False, methods=['post'])
    def envia_mensagem(self, request):
        try:
            template_id = request.data.get('template_id')
            parametros = request.data.get('parametros', [])  # Lista de parâmetros para o template
            entidade = request.data.get('entidade', '')
            empresa = request.user.empresa
            campanha = request.data.get('campanha', '')
            type = request.data.get('type')
            message_text = request.data.get("message_text", '')

            print("Entidade", entidade)
            telefone = None
            boomerangue = None
            if type == 'chat':
                # Se for do tipo 'chat', pegamos o template pelo nome
                template_name = request.user.empresa.template_resposta
                template_id = None  # Garantimos que template_id seja None para não causar conflito

            if not template_id and not template_name:
                return Response({"error": "Template é obrigatório"}, status=400)

            # Busca o template no banco
            if template_id:
                # Se template_id estiver definido, buscamos pelo id
                template = wpp_templates.objects.filter(
                    id=template_id,
                    empresa=empresa,
                    statusregistro_id=200
                ).first()
            else:
                # Caso contrário, buscamos pelo nome do template
                template = wpp_templates.objects.filter(
                    template_name=template_name,
                    empresa=empresa,
                    statusregistro_id=200
                ).first()

            print("Template", template)


            if not template:
                return Response({"error": "Template não encontrado"}, status=404)

            fluxos = []
            components = wpp_templatescomponents.objects.filter(template_id = template.pk)
            for component in components:
                if fluxo_sendpulse.objects.filter(component_id=component.pk).exists():
                    fluxos.append(fluxo_sendpulse.objects.get(component_id=component.pk).fluxo_id)
            
            if ger_entidade.objects.filter(id = entidade).exists():
                entidade = ger_entidade.objects.get(id=entidade)
                if campanha:
                    boomerangue = bmm_boomerangue.objects.filter(campanha=campanha, entidade=entidade).first()
                else:
                    boomerangue = bmm_boomerangue.objects.filter(entidade=entidade).last()

                if not boomerangue:
                    return Response({"error": "Boomerangue não encontrado."}, status=404)
        
            else:
                telefone = self.is_valid_phone(str(entidade))

            
            if telefone:
                bot = Bot.objects.get(empresa = empresa, bot_padrao='S')
                entidade = ''
                if not bot:
                    return Response({"error": "Bot não encontrado."}, status=404)
                numero = telefone

            elif boomerangue:
                numero = boomerangue.telefone_bm
                bot = boomerangue.campanha.bot_id
            
            else:
                numero = entidade.Telefone1
                bot = Bot.objects.get(empresa = empresa, bot_padrao='S')

            # Monta o corpo da mensagem dinamicamente
            message_body = self.build_message_body(
                template=template,
                parametros=parametros,
                numero=numero,
                bot=bot,
                entidade=entidade,
                fluxos = fluxos
            )

            # Envia a mensagem
            return self.send_message(message_body, bot, message_text, boomerangue)

        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def build_message_body(self, template, parametros, numero, bot, entidade, fluxos):
        """Constrói o corpo da mensagem baseado no template e seus componentes"""
        components = []

        print('Fluxos', fluxos)
        if isinstance(template, str):
            # Se for uma string, busca o template no banco de dados
            template_obj = wpp_templates.objects.filter(
                template_name=template,
                empresa=bot.empresa,  # Assumindo que o bot tem uma relação com a empresa
                statusregistro_id=200
            ).first()
            if not template_obj:
                raise ValueError(f"Template '{template}' não encontrado no banco de dados.")
            template = template_obj
        # Adiciona componentes do corpo (text parameters)
        body_component = {
            "type": "body",
            "parameters": [
                {"type": "text", "text": param} for param in parametros
            ]
        }
        components.append(body_component)

        # Se o template possui call to action, adiciona os botões
        if fluxos:
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
        # Monta o corpo completo da mensagem
        message_body = {
            'number': numero,
            'text': '',
            'template': {
                "name": template.template_name,
                "components": components,
                "language": {
                    "policy": "deterministic",
                    "code": template.language
                }
            },
            'instance': bot.legenda_3,
            'provider': bot.bot_provedor.provedor_padrao.lower(),
            'contact_id': entidade.lead_key_spl if entidade else None
        }

        print("CORPO", message_body)

        return message_body

    def send_message(self, message_body, bot, message_text, boomerangue):
        """Envia a mensagem para a API do Boomerangue"""
        try:
            api_url = "https://api.boomerangue.co/messages/send-text"
            access_token = CampaignViewSet.obter_access_token(bot)
            headers = {'Authorization': f'Bearer {access_token}'}

            response = requests.post(api_url, json=message_body, headers=headers)

            # Imprime a resposta completa para inspeção
            
            try:
                response_json = response.json()
            except json.JSONDecodeError as e:
                print(f"Erro ao decodificar JSON: {e}")
                return Response({"error": "Erro na decodificação da resposta"}, status=500)

            if response.status_code == 200:
                # Tenta múltiplas formas de extrair o message_id
                message_id = None
                
                # Método 1: Caminho direto
                if 'data' in response_json and 'data' in response_json['data'] and 'message_id' in response_json['data']['data']:
                    message_id = response_json['data']['data']['message_id']
                
                # Método 2: Caminho alternativo
                if not message_id and 'payload' in response_json and 'data' in response_json['payload'] and 'data' in response_json['payload']['data'] and 'message_id' in response_json['payload']['data']['data']:
                    message_id = response_json['payload']['data']['data']['message_id']
                
                # Método 3: Busca recursiva
                def find_message_id(obj):
                    if isinstance(obj, dict):
                        if 'message_id' in obj:
                            return obj['message_id']
                        for value in obj.values():
                            result = find_message_id(value)
                            if result:
                                return result
                    return None
                
                # Se os métodos anteriores falharem
                if not message_id:
                    message_id = find_message_id(response_json)

                # Log detalhado

                if message_id:
                    try:
                        print("Entrou no try")
                        if MsgMessage.objects.filter(message_id=message_id).exists():
                            msg = MsgMessage.objects.get(message_id=message_id)
                            msg.MensagemTexto = message_text
                            msg.boomerangue = boomerangue if boomerangue else None
                            msg.entidade = boomerangue.entidade if boomerangue else None
                            msg.campanha = boomerangue.campanha if boomerangue else None
                            msg.save()
                    except Exception as db_error:
                        print(f"Erro ao salvar no banco de dados: {db_error}")
                else:
                    print("MESSAGE ID não encontrado em nenhuma das tentativas")

                return Response({
                    "message": "Mensagem enviada com sucesso!", 
                    "message_id": message_id
                })
            else:
                return Response({
                    "error": response.json(), 
                    "status_code": response.status_code
                }, status=response.status_code)

        except Exception as e:
            print(f"Erro geral: {e}")
            return Response({"error": str(e)}, status=500)

    def verificar_url_valida(self, url):
        try:
            # Enviar uma requisição HEAD para a URL
            response = requests.head(url, allow_redirects=True)
            
            # Verifica se o status code indica sucesso (código 200 a 399)
            if response.status_code >= 200 and response.status_code < 400:
                print(f"URL válida: {url}")
                return True
            else:
                print(f"URL inválida. Status code: {response.status_code}")
                return False
        except requests.exceptions.RequestException as e:
            # Captura qualquer exceção ocorrida durante a requisição
            print(f"Erro ao acessar a URL: {e}")
            return False
    

    def extrai_dados(self, url, empresa, ocr):
        try:
            # Baixar o arquivo do URL
            response = requests.get(url)
            print('RESPPP', response)
            response.raise_for_status()

            # Obter o Content-Type do cabeçalho da resposta
            content_type = response.headers.get('Content-Type')
            print(f"Content-Type: {content_type}")


            # Variável para armazenar o texto extraído
            extracted_text = ""

            # Extrair texto dependendo do tipo de arquivo e do OCR
            if ocr == 'tesseract':
                if 'image' in content_type:
                    # Carregar a imagem em memória
                    image = Image.open(io.BytesIO(response.content))
                    # Usar o Tesseract para fazer OCR
                    extracted_text = pytesseract.image_to_string(image, lang='por')

                elif 'pdf' in content_type:
                    # Carregar o PDF em memória
                    pdf_document = fitz.open(stream=response.content, filetype="pdf")
                    # Extrair texto do PDF
                    for page in pdf_document:
                        extracted_text += page.get_text()

                else:
                    return JsonResponse({'error': 'Tipo de arquivo não suportado'}, status=400)

            elif ocr == 'google' and not 'pdf' in content_type:
                if 'image' in content_type:
                    # Obtém o diretório base correto a partir do manage.py (raiz do projeto)
                    BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

                    # Constrói o caminho relativo para o arquivo de credenciais
                    credentials_path = os.path.join(BASE_DIR, 'gedarchivio-70a6574f5e92.json')

                    # Usa o caminho construído para carregar as credenciais
                    credentials = service_account.Credentials.from_service_account_file(credentials_path)
                    
                    # Usar Google Cloud Vision OCR com as credenciais
                    client = vision.ImageAnnotatorClient(credentials=credentials)

                    if 'image' in content_type:
                        image = vision.Image(content=response.content)
                    elif 'pdf' in content_type:
                        return JsonResponse({'error': 'OCR da Google ainda não suporta PDFs diretamente'}, status=400)

                    # Enviar a imagem para o Google Cloud Vision OCR
                    response_google = client.text_detection(image=image)
                    extracted_text = response_google.full_text_annotation.text

                else:
                    return JsonResponse({'error': 'Tipo de arquivo não suportado para o OCR da Google'}, status=400)

            print("TEXTO EXTRAIDO", extracted_text)

            # Criar o prompt para o GPT-4
            prompt = f"""
            Extraia do seguinte texto, que é um comprovante de pagamento de um banco, o valor pago, a data de pagamento e o ID da Transação:
            {extracted_text}
            Retorne esses dados extraídos no seguinte formato JSON:
            {{
                'valor': 'valor_do_documento',
                'data_pag': 'data do pagamento',
                'identificador': 'id_da_transacao'
            }}.
            Retorne somente o JSON, nada mais.
            A data deve vir no formato dd/mm/aaaa se não tiver
            """

            # Enviar o texto extraído para o GPT-4
            openai.api_key = ''
            response = openai.ChatCompletion.create(
                model='gpt-4o-mini',
                messages=[
                    {"role": "user", "content": prompt}
                ],
                max_tokens=100  # Ajuste conforme necessário
            )

            chatbot_response = response['choices'][0]['message']['content']
            tokens = response['usage']['total_tokens']
            print("Reposta", chatbot_response)

            if chatbot_response.strip():  # Verificar se a resposta não está vazia
                try:
                    # Limpar a resposta removendo espaços em branco no início e fim
                    chatbot_response = chatbot_response.strip()

                    # Usar regex para extrair o JSON da resposta
                    match = re.search(r'\{.*?\}', chatbot_response, re.DOTALL)
                    if match:
                        extracted_json = match.group(0)
                        parsed_response = json.loads(extracted_json)

                        ia_geracao.objects.create(
                            empresa=empresa,
                            prompt_text_produto='',
                            prompt_publico_alvo='',
                            prompt_descricao=prompt,
                            criatividade=None,
                            tomvoz=None,
                            text_gerado_ia=extracted_json,
                            tokens_usados=tokens
                        )
                        
                        if 'pdf' in content_type:
                            parsed_response['pdf'] = 'pdf'

                        return JsonResponse(parsed_response)
                    else:
                        print('JSON não encontrado na resposta')
                        return JsonResponse({'error': 'JSON não encontrado na resposta'}, status=500)

                except json.JSONDecodeError as e:
                    print("RRSRSRSR", e)
                    return JsonResponse({'error': 'Resposta do GPT-4 não é um JSON válido', 'detail': str(e)}, status=500)

            else:
                return JsonResponse({'error': 'GPT-4 retornou uma resposta vazia'}, status=500)

        except requests.RequestException as e:
            print("ERROR", e)
            return JsonResponse({'error': str(e)}, status=500)

    @action(detail=False, methods=['post'])
    def analisa_comprovante(self, request):
            print("Received Request Method:", request.method)
            print("Received Content-Type:", request.content_type)
            print("REQUEST", request.data)

            url = request.data.get('url', '')
            empresa = request.user.empresa
            print("URLL", url)
            if not url:
                return JsonResponse({'error': 'URL do comprovante não fornecida'}, status=400)

            retorno = self.extrai_dados(url,empresa, ocr='tesseract')
            return retorno
            

    
    @action(detail=False, methods=['post'])
    def atualiza_msg_lida(self, request):
        campanha = request.data.get('campanha')
        entidade = request.data.get('entidade')

        if campanha:
            boomerangue = bmm_boomerangue.objects.filter(campanha = campanha, entidade=entidade).first()
            messages = MsgMessage.objects.filter(boomerangue=boomerangue.pk)
        elif entidade and ger_entidade.objects.filter(id = entidade).exists():
            boomerangue = bmm_boomerangue.objects.filter(entidade = entidade).last()
            messages = MsgMessage.objects.filter(boomerangue=boomerangue.pk)
        else:
            entidade = str(entidade)
            messages = MsgMessage.objects.filter(Q(Sender__endswith=entidade[-8:]) | Q(Receiver__endswith=entidade[-8:]),
            empresa=request.user.empresa)

        # Atualiza todos os campos msg_lida para 'S'
        updated_count = messages.update(msg_lida='S')

        return Response({'detail': f'{updated_count} mensagens foram atualizadas para lidas.'})
    


    @action(detail=False, methods=['get'], permission_classes=[])
    def socket_messages(self, request):
        # Busca mensagens não lidas e não notificadas
        bot = Bot.objects.filter(bot_padrao='S')
        bots_numeros = bot.values_list('bot_numero', flat=True)
        bots_legendas = bot.values_list('legenda_3', flat=True)
        messages = MsgMessage.objects.filter(
            Q(msg_lida='N') | Q(msg_lida__isnull=True),
            Q(notificado='N') | Q(notificado__isnull=True)
        )
        
        # Agrupa mensagens considerando casos com e sem entidade
        grouped_messages = messages.values('empresa', 'entidade', 'Sender', 'Receiver').annotate(
            total=Count('id')
        )
        channel_layer = get_channel_layer()
        non_registered_counts = {}

        # Itera sobre os grupos para enviar via WebSocket
        for group in grouped_messages:
            empresa_id = group['empresa']
            entidade_id = group['entidade']
            sender = group['Sender']
            Receiver = group['Receiver']
            total_mensagens = group['total']

            # Lógica para determinar o grupo de mensagens
            if entidade_id is not None:
                # Grupo COM entidade
                grupo_mensagens = messages.filter(
                    empresa=empresa_id,
                    entidade=entidade_id,
                )
            else:
                # Grupo SEM entidade - agrupa por número de telefone
                grupo_mensagens = messages.filter(
                    Q(Sender=sender) | Q(Receiver=sender),
                    empresa=empresa_id,
                    entidade__isnull=True
                )

            # Busca a última mensagem do grupo
            ultima_mensagem = grupo_mensagens.latest('DataHoraDoEvento')

            # Prepara o payload com os detalhes da mensagem
            message_data = {
                'total_mensagens': total_mensagens,
                'MensagemTexto': ultima_mensagem.MensagemTexto,
                'DataHoraDoEvento': ultima_mensagem.DataHoraDoEvento.isoformat(),
                'direcao': ultima_mensagem.direcao,
                'complemento1': ultima_mensagem.complemento1,
                'evento2': ultima_mensagem.evento2,
                'URL_Anexo': ultima_mensagem.URL_Anexo if hasattr(ultima_mensagem, 'URL_Anexo') else None,
                'nome_anexo': ultima_mensagem.nome_anexo if hasattr(ultima_mensagem, 'nome_anexo') else None,
            }

            # Processamento de mensagens
            if entidade_id is not None:
                # Mensagens com entidade
                message_data['entidade_id'] = entidade_id
                async_to_sync(channel_layer.group_send)(
                    f'chat_{empresa_id}',
                    {
                        'type': 'send_new_message_notification',
                        "data": message_data
                    }
                )
            else:
                # Mensagens sem entidade - agrupa por número
                key = f"{empresa_id}_{sender}"
                if key not in non_registered_counts:
                    non_registered_counts[key] = {
                        'empresa_id': empresa_id,
                        'sender': sender,
                        'receiver': Receiver,
                        'total': 0,
                        'message_data': message_data
                    }
                
                non_registered_counts[key]['total'] += total_mensagens
                non_registered_counts[key]['message_data']['total_mensagens'] = non_registered_counts[key]['total']

        # Envia notificações para números não cadastrados
        for key, data in non_registered_counts.items():
            if data['sender'] in bots_numeros or data['sender'] in bots_legendas:
                data['message_data']['sender'] = data['receiver']
            else:
                data['message_data']['sender'] = data['sender']
            data['message_data']['entidade_id'] = None
            
            async_to_sync(channel_layer.group_send)(
                f'chat_{data["empresa_id"]}',
                {
                    'type': 'send_new_message_notification',
                    "data": data['message_data']                    
                }
            )

        # Atualiza as mensagens para marcar como notificadas
        messages.update(notificado='S')

        return Response({"status": "Mensagens enviadas via WebSocket"})

    

    @action(detail=False, methods=['get'], permission_classes=[])
    def chamada_processar_comprovantes(self, request):
        mensagens = MsgMessage.objects.filter(
            Q(URL_Anexo__isnull=False) &
            ~Q(URL_Anexo="") &
            (Q(doc_validado='N') | Q(doc_validado__isnull=True)),
            campanha__isnull = False,
            empresa = 8
        )

        for mensagem in mensagens:
            self.processar_comprovantes.delay(mensagem.id)

        return JsonResponse({"success": "Tarefa iniciada"}, status=202)

    @shared_task
    def processar_comprovantes(id):
        try:
            mensagem = MsgMessage.objects.select_related('empresa', 'entidade', 'boomerangue').get(id=id)
        except MsgMessage.DoesNotExist:
            return Response({"status": "Mensagem não encontrada"})

        url_anexo = mensagem.URL_Anexo
        empresa = mensagem.empresa
        boomerangue = mensagem.boomerangue
        viewset_instance = MsgMessageViewSet()
        try:
            response = requests.get(url_anexo)
            response.raise_for_status()
        except requests.exceptions.HTTPError as e:
            print(e)
            mensagem.doc_validado = 'X'
            mensagem.save(update_fields=['doc_validado'])
            # viewset_instance.chama_mensagens(empresa.empresa, f'Houve um erro ao tentar validar seu Comprovante. Ele não foi encontrado Por favor envie-o novamente.', boomerangue.campanha.pk, boomerangue.entidade.pk, empresa.template_resposta)
            aviso = 'Houve um erro ao tentar validar seu Comprovante. Ele não foi encontrado Por favor envie-o novamente.'
            msg = viewset_instance.build_message_body(
                template=empresa.template_resposta,  # Template da mensagem
                parametros=[empresa.empresa, aviso],  # Parâmetros da mensagem
                numero=boomerangue.telefone_bm,  # Número de telefone
                bot=boomerangue.campanha.bot_id,  # Bot que será usado
                entidade=boomerangue.entidade,  # Entidade associada
                fluxos=[]  # Fluxos associados (se houver)
            )
            viewset_instance.send_message(msg, boomerangue.campanha.bot_id, aviso, boomerangue )
            return Response({"status": "URL inválida"})


        # Obter o Content-Type do cabeçalho da resposta
        content_type = response.headers.get('Content-Type')
        print(f"Content-Type: {content_type}")

        print(f"url_anexo: {url_anexo}")


        if not viewset_instance.verificar_url_valida(url_anexo):
            mensagem.doc_validado = 'X'
            mensagem.save(update_fields=['doc_validado'])
            return Response({"status": "URL inválida"})

        # Processar inicialmente com Tesseract
        analisa_response = viewset_instance.extrai_dados(url_anexo, empresa, ocr='tesseract')

        print("ANalisa, json", analisa_response)
        
        if analisa_response.status_code == 400:
            mensagem.doc_validado = 'X'
            mensagem.save(update_fields=['doc_validado'])
            # viewset_instance.chama_mensagens(empresa.empresa, f'Formato de comprovante inválido! O comprovante deve ser enviado no formato PDF ou Imagem.', boomerangue.campanha.pk, boomerangue.entidade.pk, empresa.template_resposta)
            aviso = 'Formato de comprovante inválido! O comprovante deve ser enviado no formato PDF ou Imagem.'
            msg = viewset_instance.build_message_body(
                template=empresa.template_resposta,  # Template da mensagem
                parametros=[empresa.empresa, aviso],  # Parâmetros da mensagem
                numero=boomerangue.telefone_bm,  # Número de telefone
                bot=boomerangue.campanha.bot_id,  # Bot que será usado
                entidade=boomerangue.entidade,  # Entidade associada
                fluxos=[]  # Fluxos associados (se houver)
            )
            viewset_instance.send_message(msg, boomerangue.campanha.bot_id, aviso, boomerangue )
            return Response({"status": "Erro ao analisar dados"})

        if analisa_response.status_code != 200 and analisa_response.status_code != 400:
            mensagem.doc_validado = 'X'
            mensagem.save(update_fields=['doc_validado'])
            # viewset_instance.chama_mensagens(empresa.empresa, f'Houve um erro ao tentar validar seu Comprovante. Aguarde enquanto verificamos sua situação.', boomerangue.campanha.pk, boomerangue.entidade.pk, empresa.template_resposta)
            aviso = "Houve um erro ao tentar validar seu Comprovante. Aguarde enquanto verificamos sua situação."
            msg = viewset_instance.build_message_body(
                template=empresa.template_resposta,  # Template da mensagem
                parametros=[empresa.empresa, aviso],  # Parâmetros da mensagem
                numero=boomerangue.telefone_bm,  # Número de telefone
                bot=boomerangue.campanha.bot_id,  # Bot que será usado
                entidade=boomerangue.entidade,  # Entidade associada
                fluxos=[]  # Fluxos associados (se houver)
            )
            viewset_instance.send_message(msg, boomerangue.campanha.bot_id, aviso, boomerangue )
            return Response({"status": "Erro ao analisar dados"})

        try:
            data_dict = json.loads(analisa_response.content.decode('utf-8'))
            id_transacao = data_dict.get('identificador')
            valor = viewset_instance.converter_valor_monetario(data_dict.get('valor'))
            data_pagamento = viewset_instance.converter_data(data_dict.get('data_pag', ''))

            
        except (KeyError, ValueError, json.JSONDecodeError) as e:
            print(f"Erro ao processar dados: {e}")
            mensagem.doc_validado = 'X'
            mensagem.save(update_fields=['doc_validado'])
            return Response({"status": f"Erro no processamento: {e}"})
        
        if SolicitacaoPagamento.objects.filter(txid = id_transacao, status='APROVADO').exists():
            # viewset_instance.chama_mensagens(empresa.empresa, f'Esse pagamento já foi validado anteriormente, por favor anexe um novo comprovante.', boomerangue.campanha.pk, boomerangue.entidade.pk, empresa.template_resposta)
            aviso = 'Esse pagamento já foi validado anteriormente, por favor anexe um novo comprovante.'
            msg = viewset_instance.build_message_body(
                template=empresa.template_resposta,  # Template da mensagem
                parametros=[empresa.empresa, aviso],  # Parâmetros da mensagem
                numero=boomerangue.telefone_bm,  # Número de telefone
                bot=boomerangue.campanha.bot_id,  # Bot que será usado
                entidade=boomerangue.entidade,  # Entidade associada
                fluxos=[]  # Fluxos associados (se houver)
            )
            viewset_instance.send_message(msg, boomerangue.campanha.bot_id, aviso, boomerangue )
            mensagem.doc_validado = "O"
            mensagem.save(update_fields=['doc_validado'])
            return Response({"status": "Pagamento já realizado"})
        resultado_pix = buscar_status_pix(id_transacao, empresa.id, mensagem.entidade.Telefone1, mensagem.entidade.lead_key_spl)
        print(f"Resultado do pagamento: {resultado_pix}")

        # Se o pagamento não for feito, refazer o processo usando o OCR da Google
        if resultado_pix.get('pagamento_feito') != 'S':
            if not data_dict.get('pdf'):
                analisa_response = viewset_instance.extrai_dados(url_anexo, empresa, ocr='google')
                
                if analisa_response.status_code != 200 and analisa_response.status_code != 400:
                    mensagem.doc_validado = 'X'
                    mensagem.save(update_fields=['doc_validado'])
                    # viewset_instance.chama_mensagens(empresa.empresa, f'Houve um erro ao tentar validar seu Comprovante. Aguarde enquanto verificamos sua situação.', boomerangue.campanha.pk, boomerangue.entidade.pk, empresa.template_resposta)
                    aviso = 'Houve um erro ao tentar validar seu Comprovante. Aguarde enquanto verificamos sua situação.'
                    msg = viewset_instance.build_message_body(
                        template=empresa.template_resposta,  # Template da mensagem
                        parametros=[empresa.empresa, aviso],  # Parâmetros da mensagem
                        numero=boomerangue.telefone_bm,  # Número de telefone
                        bot=boomerangue.campanha.bot_id,  # Bot que será usado
                        entidade=boomerangue.entidade,  # Entidade associada
                        fluxos=[]  # Fluxos associados (se houver)
                    )
                    viewset_instance.send_message(msg, boomerangue.campanha.bot_id, aviso, boomerangue )
                    return Response({"status": "Erro ao analisar dados"})

                if analisa_response.status_code == 400:
                    mensagem.doc_validado = 'X'
                    mensagem.save(update_fields=['doc_validado'])
                    # viewset_instance.chama_mensagens(empresa.empresa, f'Formato de comprovante inválido! O comprovante deve ser enviado no formato PDF ou Imagem.', boomerangue.campanha.pk, boomerangue.entidade.pk, empresa.template_resposta)
                    aviso = 'Formato de comprovante inválido! O comprovante deve ser enviado no formato PDF ou Imagem.'
                    msg = viewset_instance.build_message_body(
                        template=empresa.template_resposta,  # Template da mensagem
                        parametros=[empresa.empresa, aviso],  # Parâmetros da mensagem
                        numero=boomerangue.telefone_bm,  # Número de telefone
                        bot=boomerangue.campanha.bot_id,  # Bot que será usado
                        entidade=boomerangue.entidade,  # Entidade associada
                        fluxos=[]  # Fluxos associados (se houver)
                    )
                    viewset_instance.send_message(msg, boomerangue.campanha.bot_id, aviso, boomerangue )
                    return Response({"status": "Erro ao analisar dados"})

                try:
                    data_dict = json.loads(analisa_response.content.decode('utf-8'))
                    id_transacao = data_dict.get('identificador')
                    valor = viewset_instance.converter_valor_monetario(data_dict.get('valor'))
                    data_pagamento = viewset_instance.converter_data(data_dict.get('data_pag', ''))

                except (KeyError, ValueError, json.JSONDecodeError) as e:
                    print(f"Erro ao processar dados com Google OCR: {e}")
                    mensagem.doc_validado = 'X'
                    mensagem.save(update_fields=['doc_validado'])
                    return Response({"status": f"Erro no processamento: {e}"})

                if SolicitacaoPagamento.objects.filter(txid = id_transacao, status='APROVADO').exists():
                    # viewset_instance.chama_mensagens(empresa.empresa, f'Esse pagamento já foi validado anteriormente, por favor anexe um novo comprovante.', boomerangue.campanha.pk, boomerangue.entidade.pk, empresa.template_resposta)
                    aviso = 'Esse pagamento já foi validado anteriormente, por favor anexe um novo comprovante.'
                    msg = viewset_instance.build_message_body(
                        template=empresa.template_resposta,  # Template da mensagem
                        parametros=[empresa.empresa, aviso],  # Parâmetros da mensagem
                        numero=boomerangue.telefone_bm,  # Número de telefone
                        bot=boomerangue.campanha.bot_id,  # Bot que será usado
                        entidade=boomerangue.entidade,  # Entidade associada
                        fluxos=[]  # Fluxos associados (se houver)
                    )
                    viewset_instance.send_message(msg, boomerangue.campanha.bot_id, aviso, boomerangue )
                    mensagem.doc_validado = "O"
                    mensagem.save(update_fields=['doc_validado'])
                    return Response({"status": "Pagamento já realizado"})
                resultado_pix = buscar_status_pix(id_transacao, empresa.id, mensagem.entidade.Telefone1, mensagem.entidade.lead_key_spl)
                print(f"Resultado do pagamento com OCR Google: {resultado_pix}")

                if resultado_pix.get('pagamento_feito') != 'S':
                    mensagem.doc_validado = 'X'
                    mensagem.save(update_fields=['doc_validado'])
                    # viewset_instance.chama_mensagens(empresa.empresa, f'Não detectamos o pagamento referente ao seu comprovante no sistema. Aguarde enquanto verificamos a situação.', boomerangue.campanha.pk, boomerangue.entidade.pk, empresa.template_resposta)
                    aviso = 'Não detectamos o pagamento referente ao seu comprovante no sistema. Aguarde enquanto verificamos a situação.'
                    msg = viewset_instance.build_message_body(
                        template=empresa.template_resposta,  # Template da mensagem
                        parametros=[empresa.empresa, aviso],  # Parâmetros da mensagem
                        numero=boomerangue.telefone_bm,  # Número de telefone
                        bot=boomerangue.campanha.bot_id,  # Bot que será usado
                        entidade=boomerangue.entidade,  # Entidade associada
                        fluxos=[]  # Fluxos associados (se houver)
                    )
                    viewset_instance.send_message(msg, boomerangue.campanha.bot_id, aviso, boomerangue )
                    return Response({"status": "Pagamento não realizado"})
            else:
                mensagem.doc_validado = 'X'
                mensagem.save(update_fields=['doc_validado'])
                # viewset_instance.chama_mensagens(empresa.empresa, f'Não detectamos o pagamento referente ao seu comprovante no sistema. Aguarde enquanto verificamos a situação.', boomerangue.campanha.pk, boomerangue.entidade.pk, empresa.template_resposta)
                aviso = 'Não detectamos o pagamento referente ao seu comprovante no sistema. Aguarde enquanto verificamos a situação.'
                msg = viewset_instance.build_message_body(
                    template=empresa.template_resposta,  # Template da mensagem
                    parametros=[empresa.empresa, aviso],  # Parâmetros da mensagem
                    numero=boomerangue.telefone_bm,  # Número de telefone
                    bot=boomerangue.campanha.bot_id,  # Bot que será usado
                    entidade=boomerangue.entidade,  # Entidade associada
                    fluxos=[]  # Fluxos associados (se houver)
                )
                viewset_instance.send_message(msg, boomerangue.campanha.bot_id, aviso, boomerangue )
                return Response({"status": "Pagamento não realizado"})

        
        # Continuar processamento após a validação do pagamento com OCR Tesseract ou Google

        if resultado_pix.get('data_tx_pix') != '':
            data_pagamento = resultado_pix.get('data_tx_pix')

        if resultado_pix.get('valor_pix'):
            valor = resultado_pix.get('valor_pix')
            print("VALOR", valor)

        # Verifica o tipo do arquivo e define a extensão correta
        file_extension = mimetypes.guess_extension(content_type) if content_type else ".jpg"  # Default para .jpg se content_type for None
        print('file_extension', file_extension)

        file_name = f"{empresa.id}/{mensagem.entidade.id}/{id_transacao}{file_extension}"
        file_content = ContentFile(response.content, name=file_name)

        data = {
            'message_id': mensagem.id,
            'txid': id_transacao,
            'valor': valor,
            'status': 'APROVADO',
            'data_tx': data_pagamento,
            'import_comprovante': file_content,
            'empresa': empresa.id,
            'boomerangue': boomerangue.id,
            'conta': boomerangue.campanha.gateway_pagamento.pk,
            'import_comprovante_url': f"comprovantes_pagamentos/comprovante/{file_name}",
            'tipo_pagamento': 'PIX',
            'recorrencia': 'UNICO'
        }

        try:
            existing_record = SolicitacaoPagamento.objects.get(txid=id_transacao, empresa=empresa)
            if existing_record.data_tx:
                # Remove `data_tx` dos dados a serem atualizados
                data.pop('data_tx', None)
            serializer = SolicitacaoPagamentoSerializer(existing_record, data=data, partial=True)
        except SolicitacaoPagamento.DoesNotExist:
            serializer = SolicitacaoPagamentoSerializer(data=data)

        if serializer.is_valid():
            serializer.save()

            # Atualização em lote de campos para evitar múltiplos saves
            boomerangue_atualizado = {
                'bm_aceito': 'S',
                'bm_status': 'D',
                'valor_atual': boomerangue.valor_atual + Decimal(str(valor)),
                'data_aceite_bm': datetime.now()
            }
            mensagem.doc_validado = "O"
            mensagem.save(update_fields=['doc_validado'])
            bmm_boomerangue.objects.filter(pk=boomerangue.pk).update(**boomerangue_atualizado)
            # viewset_instance.chama_mensagens(empresa.empresa, f'Seu comprovante valor: {valor} foi validado!', boomerangue.campanha.pk, boomerangue.entidade.pk, empresa.template_resposta)
            aviso = f'Seu comprovante valor: {valor} foi validado!'
            msg = viewset_instance.build_message_body(
                template=empresa.template_resposta,  # Template da mensagem
                parametros=[empresa.empresa, aviso],  # Parâmetros da mensagem
                numero=boomerangue.telefone_bm,  # Número de telefone
                bot=boomerangue.campanha.bot_id,  # Bot que será usado
                entidade=boomerangue.entidade,  # Entidade associada
                fluxos=[]  # Fluxos associados (se houver)
            )
            viewset_instance.send_message(msg, boomerangue.campanha.bot_id, aviso, boomerangue )
            pix_req = PixRequest.objects.using('pix_db').create(
                    amount = valor,
                    transaction_id = id_transacao,
                    status = 'COMPLETED',
                    txid='0',
                    data_tx = data_pagamento,
                    cpf = boomerangue.entidade.CNPJNumerico,
                    nome_pagador = boomerangue.entidade.Entidade,
                    empresa = int(boomerangue.empresa.id),
                    boomerangue = int(boomerangue.id),
                        # campanha = int(boomerangue.campanha.id)
            )

            PixEvent.objects.using('pix_db').create(
                    request=pix_req.id,
                    event_type='Pagamento Pix',
                    event_description=f'Pagamento Pix Realizado! Valor {valor}, Usuário: {boomerangue.entidade.Entidade}, Pago com comprovante.',
                )

        else:
            print(f"Erros de validação: {serializer.errors}")
            mensagem.doc_validado = 'X'
            mensagem.save(update_fields=['doc_validado'])

        return Response({"status": "Processamento de comprovantes concluído"})

    def converter_valor_monetario(self, valor_str):
        if not valor_str:
            return Decimal('0.00')  # Ou trate de forma adequada para strings vazias
        try:
            cleaned_value = re.sub(r'[^\d.]', '', valor_str)
            return Decimal(cleaned_value)
        except:
            # Trate o erro de conversão
            print(f'Erro ao converter valor: {valor_str}')
            return Decimal('0.00')  # Ou trate o erro conforme necessário

    def converter_data(self, data_str):
        try:
            # Converte a string no formato DD/MM/YYYY para um objeto datetime
            data_obj = datetime.strptime(data_str, "%d/%m/%Y")

            # Converte o objeto datetime para o formato ISO 8601 completo com hora, minuto, segundo e fuso horário UTC
            data_iso = data_obj.strftime("%Y-%m-%dT%H:%M:%S") + "Z"

            return data_iso
        except ValueError:
            # Retorna None ou uma string vazia se a conversão falhar
            return None

    @action(detail=False, methods=['post'])
    def retorna_total_campanha(self, request):
        id = request.data.get('id')
        mensagens = MsgMessage.objects.filter(campanha=id, empresa=request.user.empresa)
        soma = mensagens.aggregate(total=Sum('custo_mensagem'))
        print("TT_CAMPAN", soma)
        if soma['total'] is not None:
            return Response(soma)
        else:
            return Response({'total': '0.00'})
    



class canaisViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows MsgMessage to be viewed, edited or created.
    """

    queryset = canais.objects.all()
    serializer_class = canaisSerializer
    permission_classes = [permissions.IsAuthenticated]
    # pagination_class = MessagePagination
    # Return data for edit in transportadora-list
    def retrieve(self, request, pk=None):
        try:
            condicao = canais.objects.get(pk=pk)
        except canais.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)

        serializer = self.get_serializer(condicao)
        data = serializer.data
        return Response(data)
    
    # Edit data
    def patch(self, request, pk=None):
        try:
            condicao = canais.objects.get(pk=pk)
        except canais.DoesNotExist:
            return Response({"error": "Item not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(condicao, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    # delete itens
    # def destroy(self, request, *args, **kwargs):
    #     instance = self.get_object()

    #     # Defina deleted_at com a data/hora atual
    #     instance.exclusao_dt = timezone.now()
        
    #     # Defina status como 9000
    #     instance.statusregistro_id = 9000

    #     instance.save()
    #     return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=False, methods=['get'])
    def get_canais(self, request):
        try:
            verify = request.query_params.get('verify', '')
            canal = canais.objects.filter(empresa = request.user.empresa, statusregistro_id = 200)
            seriealizer = self.get_serializer(canal, many=True)
            # Dados do usuário logado
            if not verify:
                user_data = {
                    'user_logado_id': request.user.id,
                    'user_logado_username': 'Atribuídas a mim',
                    # Adicione outros campos do usuário conforme necessário
                }
                
                # Combine os dados do usuário com os dados dos canais
                response_data = [user_data] + seriealizer.data
            else:
                response_data = seriealizer.data

            return Response(response_data)
        except canais.DoesNotExist:
            return Response({"Error":'Essa empresa não possui canais'}, status=404)

    @action(detail=False, methods=['post'])
    def excluir_canais_em_lote(self, request):
        try:
            # Recebe a lista de IDs do corpo da requisição
            data = request.data
            ids = data.get('ids', [])

            if not ids:
                return JsonResponse({'success': False, 'message': 'Nenhum canal selecionado.'}, status=400)

            # Exclui todos os canais com os IDs recebidos
            canais.objects.filter(id__in=ids).delete()

            return JsonResponse({'success': True, 'message': 'Canais excluídos com sucesso.'})

        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)}, status=500)


class canais_leadsViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows MsgMessage to be viewed, edited or created.
    """

    queryset = canais_leads.objects.all()
    serializer_class = canais_leadsSerializer
    permission_classes = [permissions.IsAuthenticated]
    # pagination_class = MessagePagination
    # Return data for edit in transportadora-list

    def create(self, request, *args, **kwargs):
        # Obter os IDs dos canais enviados
        canais_ids = request.data.get('canais', [])

        if not canais_ids:
            return Response({'error': 'Nenhum canal selecionado'}, status=status.HTTP_400_BAD_REQUEST)

        # Obter os IDs dos leads
        lead_ids = request.data.get('lead_ids', [])

        if not lead_ids:
            return Response({'error': 'Nenhum lead fornecido'}, status=status.HTTP_400_BAD_REQUEST)

        canais_criados = []

        print("CANAIS", canais_ids)
        print("leadsss", lead_ids)

        # Iterar pelos leads
        for lead_id in lead_ids:
            try:
                lead = ger_entidade.objects.get(id=lead_id)
            except ger_entidade.DoesNotExist:
                return Response({'error': f'Lead inválido: {lead_id}'}, status=status.HTTP_400_BAD_REQUEST)

            # Iterar pelos canais
            for canal_id in canais_ids:
                try:
                    canal = canais.objects.get(id=canal_id)

                    # Verificar se já existe um vínculo entre o canal e o lead
                    if not canais_leads.objects.filter(canal=canal, lead=lead).exists():
                        # Criar o vínculo
                        canais_leads.objects.create(canal=canal, lead=lead)
                        canais_criados.append({'canal_id': canal_id, 'lead_id': lead_id})

                except canais.DoesNotExist:
                    return Response({'error': f'Canal inválido: {canal_id}'}, status=status.HTTP_400_BAD_REQUEST)

        if canais_criados:
            return Response({'message': 'Canais associados aos leads com sucesso', 'canais_criados': canais_criados}, status=status.HTTP_201_CREATED)
        else:
            return Response({'message': 'Nenhum novo vínculo criado, todos os canais já estão associados aos leads.'}, status=status.HTTP_200_OK)

    def retrieve(self, request, pk=None):
        try:
            condicao = canais_leads.objects.get(pk=pk)
        except canais_leads.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)

        serializer = self.get_serializer(condicao)
        data = serializer.data
        return Response(data)
    
    # Edit data
    def patch(self, request, pk=None):
        try:
            condicao = canais_leads.objects.get(pk=pk)
        except canais_leads.DoesNotExist:
            return Response({"error": "Item not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(condicao, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    # delete itens
    # def destroy(self, request, *args, **kwargs):
    #     instance = self.get_object()

    #     # Defina deleted_at com a data/hora atual
    #     instance.exclusao_dt = timezone.now()
        
    #     # Defina status como 9000
    #     instance.statusregistro_id = 9000

    #     instance.save()
    #     return Response(status=status.HTTP_204_NO_CONTENT)
    

    @action(detail=False, methods=['get'])
    def retorna_leads(self, request):
        id = request.query_params.get('id')
        usuarios = canais_leads.objects.filter(lead__empresa=request.user.empresa, canal=id).prefetch_related('lead')
        serializer = self.get_serializer(usuarios, many=True)

        # Iterar sobre os resultados serializados e adicionar o nome do lead
        data = serializer.data
        for usuario in data:
            lead_id = usuario['lead']  # Aqui o lead é provavelmente apenas um ID
            lead = ger_entidade.objects.get(id=lead_id)  # Busque o objeto lead completo
            usuario['lead_name'] = lead.Entidade  # Adicione o nome do lead ao resultado

        return Response(data)



    

class usuario_leadViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows MsgMessage to be viewed, edited or created.
    """

    queryset = usuario_lead.objects.all()
    serializer_class = usuario_leadSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = MessagePagination
    # Return data for edit in transportadora-list

    def create(self, request, *args, **kwargs):
        # Obter os IDs dos usuários enviados
        usuarios_ids = request.data.get('usuarios', [])
        
        if not usuarios_ids:
            return Response({'error': 'Nenhum usuário selecionado'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Obter a lista de IDs dos leads
        leads_ids = request.data.get('leads', [])
        
        if not leads_ids:
            return Response({'error': 'Nenhum lead fornecido'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar se todos os leads existem
        leads_validos = ger_entidade.objects.filter(id__in=leads_ids)
        leads_invalidos = set(leads_ids) - set(leads_validos.values_list('id', flat=True))
        
        if leads_invalidos:
            return Response({'error': f'Leads inválidos: {list(leads_invalidos)}'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Iterar pelos usuários e leads para criar os vínculos, se ainda não existirem
        usuarios_criados = []
        for usuario_id in usuarios_ids:
            try:
                usuario = Usuario.objects.get(id=usuario_id)
                
                for lead in leads_validos:
                    # Verificar se já existe um vínculo entre o usuário e o lead
                    if usuario_lead.objects.filter(usuario=usuario, lead=lead).exists():
                        continue  # Se já existir, pula para o próximo vínculo

                    # Criar o vínculo
                    usuario_lead.objects.create(usuario=usuario, lead=lead)
                    usuarios_criados.append({'usuario_id': usuario_id, 'lead_id': lead.id})

            except Usuario.DoesNotExist:
                return Response({'error': f'Usuário inválido: {usuario_id}'}, status=status.HTTP_400_BAD_REQUEST)
        
        if usuarios_criados:
            return Response({'message': 'Usuários associados aos leads com sucesso', 'vinculos_criados': usuarios_criados}, status=status.HTTP_201_CREATED)
        else:
            return Response({'message': 'Nenhum novo vínculo criado, todos os usuários já estão associados a estes leads.'}, status=status.HTTP_200_OK)

    def retrieve(self, request, pk=None):
        try:
            condicao = usuario_lead.objects.get(pk=pk)
        except usuario_lead.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)

        serializer = self.get_serializer(condicao)
        data = serializer.data
        return Response(data)
    
    # Edit data
    def patch(self, request, pk=None):
        try:
            condicao = usuario_lead.objects.get(pk=pk)
        except usuario_lead.DoesNotExist:
            return Response({"error": "Item not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(condicao, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    # delete itens
    # def destroy(self, request, *args, **kwargs):
    #     instance = self.get_object()

    #     # Defina deleted_at com a data/hora atual
    #     instance.exclusao_dt = timezone.now()
        
    #     # Defina status como 9000
    #     instance.statusregistro_id = 9000

    #     instance.save()
    #     return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=False, methods=['get'])
    def meus_leads(self, request):
        # Obtém o usuário autenticado
        usuario = request.user

        # Filtra os leads vinculados ao usuário autenticado
        leads = usuario_lead.objects.filter(usuario=usuario)

        # Verifica se o usuário tem leads vinculados
        if not leads.exists():
            return Response({'message': 'Nenhum lead vinculado a este usuário.'}, status=status.HTTP_404_NOT_FOUND)

        # Aplicar a paginação
        page = self.paginate_queryset(leads)
        if page is not None:
            # Serializa os dados dos leads paginados
            serializer = self.get_serializer(page, many=True)

            # Adicionar informações adicionais dos leads
            for data in serializer.data:
                lead = ger_entidade.objects.get(id=data['lead'])
                data['Entidade'] = lead.Entidade
                data['Telefone1'] = lead.Telefone1
                data['DataValidacaoWP'] = lead.DataValidacaoWP
                data['id'] = lead.id

            # Retorna a resposta paginada
            return self.get_paginated_response(serializer.data)

        # Se não houver paginação, retorna os dados normais
        serializer = self.get_serializer(leads, many=True)
        for data in serializer.data:
            lead = ger_entidade.objects.get(id=data['lead'])
            data['Entidade'] = lead.Entidade
            data['Telefone1'] = lead.Telefone1
            data['DataValidacaoWP'] = lead.DataValidacaoWP
            data['id'] = lead.id
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['post'])
    def excluir_vinculo(self, request):
        """
        Função que exclui o vínculo entre usuários e leads com base na lista de IDs recebidos.
        """
        # Obter os IDs dos usuários enviados
        try:
            usuario_id = request.user.id
            
            # Obter o ID do lead
            lead_ids = request.data.get('leads', [])

            print("LEAD", lead_ids)

            if not usuario_id and not lead_ids:
                return Response({'error': 'Nenhum usuário ou lead fornecido.'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Excluir vínculos baseados nos parâmetros fornecidos
            if lead_ids and usuario_id:
                # Se IDs de lead e usuários forem fornecidos, exclui o vínculo específico
                try:
                    usuario_lead.objects.filter(lead_id__in=lead_ids, usuario=usuario_id).delete()
                    return Response({'success': f'Vínculos entre os usuários {usuario_id} e o lead {lead_ids} excluídos com sucesso.'}, status=status.HTTP_200_OK)
                except Exception as e:
                    return Response({'error': e})
        except Exception as e:
            return Response({'error': 'Erro ao excluir vínculos.'}, status=status.HTTP_400_BAD_REQUEST)
    
