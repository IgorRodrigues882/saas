# Imports necessários no início do arquivo
from rest_framework.parsers import MultiPartParser, FormParser
import os # Já importado, mas garantindo
from rest_framework import viewsets
from rest_framework import status
from rest_framework import permissions
from rest_framework import filters
from django.db.models import Q
from django.conf import settings # Para buscar URL/API Key do n8n
from dotenv import load_dotenv
import datetime
import time
import json
import requests # Para chamadas à API do n8n
import logging # Para logs
from rest_framework.response import Response
from boomerangue.apps.wpp_templates.models import wpp_templates, ia_criatividade, ia_tomvoz, gpt_engine, ia_prompt_settings, wpp_fields, callToAction, Flows, FlowAttachment
from boomerangue.apps.wpp_templatescomponents.models import wpp_templatescomponents
from boomerangue.apps.bot.models import Bot
from .seriealizers import WPPTemplatesSerializer, criatividade_iaSerializer, tomvoz_iaSerializer, gpt_engineSerializer, ia_prompt_settingsSerializer, wpp_fieldsSerializer, callToActionSerializer, FlowsSerializer
from rest_framework.decorators import action
from api.campaign.views import CampaignViewSet
from rest_framework.pagination import PageNumberPagination
import base64 # Adicionado
from django.core.files.base import ContentFile # Adicionado
from django.core.files.uploadedfile import InMemoryUploadedFile # Para criar objeto similar ao uploaded
import re # Para regex no base64
from rest_framework.parsers import JSONParser # Adicionado

load_dotenv()

logger = logging.getLogger(__name__)

domain = 'http://plug.localhost:8000'

class CustomPagination(PageNumberPagination):
    page_size = 15
    page_size_query_param = 'page_size'
    max_page_size = 100

class WPPTemplatesViewSet(viewsets.ModelViewSet):
    queryset = wpp_templates.objects.all()
    serializer_class = WPPTemplatesSerializer
    permission_classes = [permissions.IsAuthenticated]


    def create(self, request):
        template_name = request.data.get('template_name')
        if wpp_templates.objects.filter(empresa = request.user.empresa, template_name=template_name, statusregistro_id=200).exists():
            return Response({"error": "Um item com este nome já existe."}, status=status.HTTP_400_BAD_REQUEST)
        return super().create(request)

    # Return data for edit in transportadora-list
    def retrieve(self, request, pk=None):
        try:
            condicao = wpp_templates.objects.get(pk=pk)
        except wpp_templates.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)

        serializer = self.get_serializer(condicao)
        return Response(serializer.data)

    # Edit data
    # Edit data
    def partial_update(self, request, pk=None):
        try:
            condicao = wpp_templates.objects.get(pk=pk)
        except wpp_templates.DoesNotExist:
            return Response({"error": "Item not found."}, status=status.HTTP_404_NOT_FOUND)
        if wpp_templates.objects.filter(empresa = request.user.empresa, template_name=condicao.template_name, statusregistro_id=200).exclude(pk=pk).exists():
            return Response({"error": "Um item com este nome já existe."}, status=status.HTTP_400_BAD_REQUEST)
        serializer = self.get_serializer(condicao, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, pk=None):
        instance = self.get_object()

        # Defina deleted_at com a data/hora atual
        instance.exclusao_dt = datetime.datetime.now()

        # Defina status como 9000
        instance.statusregistro_id = 9000

        print("instancia",instance.pk)

        obs = callToAction.objects.filter(template=instance.pk)
        for ob in obs:
            bots = ob.bots_conectados.all()
            for bot in bots:
                actions = bot.call_to_actions
                palavra_acao = ob.palavra_acao.lower()
                actions = [action for action in actions if not action.get(palavra_acao)]
                bot.call_to_actions = actions
                bot.save()
                print(palavra_acao)
            ob.delete()

        if callToAction.objects.filter(template_resposta=instance.pk).exists():
            obs = callToAction.objects.filter(template_resposta=instance.pk)
            for ob in obs:
                ob.template_resposta = None
                ob.template.processada_ajuste_resposta = 'N'
                ob.save()

        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


    @action(detail=False, methods=['get'])
    def list_templates_by_empresa(self, request):

        empresa = request.query_params.get('id')
        print("AHA", empresa)
        templates = wpp_templates.objects.filter(empresa=empresa, statusregistro_id=200)
        serializer = self.get_serializer(templates, many=True)
        return Response(serializer.data)

    def salva_image_diretorio(self, image):
        try:
            # A URL completa, incluindo parâmetros, é usada para baixar a imagem
            image_response = requests.get(image, stream=True)
            if image_response.status_code == 200:
                # Extraia o nome da imagem da URL completa
                image_name = os.path.basename(image.split('?')[0])
                # Caminho onde a imagem será salva
                image_path = os.path.join('media/media/whatsappImages', image_name)
                print("IMAGEPATHHHHHHHHHHHHHHHHHHH", image_path)
                # Crie os diretórios se não existirem
                os.makedirs(os.path.dirname(image_path), exist_ok=True)
                # Salve a imagem em chunks para evitar problemas de memória
                with open(image_path, 'wb') as f:
                    for chunk in image_response.iter_content(1024):
                        f.write(chunk)
                print(f"Imagem salva em: {image_path}")  # Debug
                return '/'+image_path
            else:
                print(f"Falha ao baixar a imagem. Status code: {image_response.status_code}")
                return None
        except Exception as e:
            print(f"Erro ao baixar ou salvar a imagem: {e}")
            return None


    @action(detail=False, methods=['post'])
    def busca_sendpulse(self, request):
        try:
            bot = Bot.objects.get(id=request.data.get('bot_id'))
        except:
            return Response({"error": 'Erro ao tentar achar bot'})
        if bot.bot_provedor.provedor_padrao == 'SPL':
            agora = int(time.time())
            tempo_expire_token = bot.bot_provedor.access_token_expire
            if tempo_expire_token and agora < tempo_expire_token:
                access_token = bot.bot_provedor.access_token
            else:
                client_id = bot.legenda_1
                client_secret = bot.legenda_2
                access_token = CampaignViewSet.authenticate(client_id, client_secret)
                bot.bot_provedor.access_token_expire = agora + 3600
                bot.bot_provedor.access_token = access_token
                bot.bot_provedor.save()

            body = {
                "provider": "spl",
                "bot_id": bot.legenda_3
            }
            header = {'Authorization': f'Bearer {access_token}'}
            r = requests.post('https://api.boomerangue.co/templates', json=body, headers=header)
            if r.status_code == 200:
                data = r.json()
                try:
                    for item in data['data']:
                        print(item)
                        template = wpp_templates.objects.filter(empresa=request.user.empresa, id_sendpulse=item['id'], statusregistro_id=200).first()
                        if template:
                            template.template_name = item['name']
                            template.category = item['previous_category'] if item['previous_category'] else 'SHIPPING_UPDATE'
                            template.language = item['language']
                            template.bot_id = bot
                            template.status = item['status']
                            template.id_sendpulse = item['id']
                            template.save()
                        else:
                            template = wpp_templates()
                            template.empresa = request.user.empresa
                            template.template_name = item['name']
                            template.category = item['previous_category'] if item['previous_category'] else 'SHIPPING_UPDATE'
                            template.language = item['language']
                            template.bot_id = bot
                            template.id_sendpulse = item['id']
                            template.status = item['status']
                            template.save()
                            print("cadastrou template")

                        for component in item['components']:
                            if component['type'] == 'BUTTONS':
                                for button in component['buttons']:
                                    component_model = wpp_templatescomponents.objects.filter(
                                        template=template,
                                        component_type=component['type'],
                                        text_content=button['text']
                                    ).first()
                                    if component_model:
                                        component_model.format = component.get('format', 'TEXT')
                                        component_model.text_content = button['text']
                                        if button['type'] == 'URL':
                                            component_model.url_formatada = button['url']
                                            component_model.text_content += "</br> URL: " + button['url']
                                    else:
                                        component_model = wpp_templatescomponents()
                                        component_model.template = template
                                        component_model.component_type = component['type']
                                        component_model.format = component.get('format', 'TEXT')
                                        component_model.text_content = button['text']
                                        if button['type'] == 'URL':
                                            component_model.url_formatada = button['url']
                                            component_model.text_content += "</br> URL: " + button['url']
                                        component_model.save()
                            else:
                                component_model = wpp_templatescomponents.objects.filter(
                                    template=template,
                                    component_type=component['type']
                                ).first()
                                if component_model:
                                    component_model.format = component.get('format', 'TEXT')
                                    component_model.text_content = component.get('text', '')
                                    if component.get('format', 'TEXT') == 'IMAGE' and 'example' in component:
                                        image_url = component['example']['header_handle'][0]
                                        image_path = self.salva_image_diretorio(image_url)
                                        if image_path:
                                            component_model.url_formatada = image_path
                                    component_model.save()
                                else:
                                    component_model = wpp_templatescomponents()
                                    component_model.template = template
                                    component_model.component_type = component['type']
                                    component_model.format = component.get('format', 'TEXT')
                                    component_model.text_content = component.get('text', '')
                                    if component.get('format', 'TEXT') == 'IMAGE' and 'example' in component:
                                        image_url = component['example']['header_handle'][0]
                                        image_path = self.salva_image_diretorio(image_url)
                                        if image_path:
                                            component_model.url_formatada = image_path
                                    component_model.save()
                    return Response({'success': "Sincronização concluída"})
                except Exception as e:
                    print(e)
                    return Response({"error": "Erro ao tentar sincronizar"})
            else:
                return Response({"error": "Erro ao tentar sincronizar"})
        else:
            return Response({"error": 'Esse bot não tem provedor sendpulse'})




class retorna_nome_templates(viewsets.ModelViewSet):
    queryset = wpp_templates.objects.all()
    serializer_class = WPPTemplatesSerializer
    permission_classes = [permissions.IsAuthenticated]
    permission_classes = []
    filter_backends = [filters.SearchFilter]
    search_fields = ['template_name']
    # Return data for edit in transportadora-list
    def list(self, request, *args, **kwargs):
        query = request.query_params.get('query', '')  # Obtém o parâmetro 'query' da solicitação
        queryset = self.filter_queryset(self.get_queryset())  # Aplica filtros, se houver

        if query:
            # Filtra os resultados com base na consulta do usuário
            queryset = queryset.filter(empresa= request.user.empresa,template_name__icontains=query, statusregistro_id=200)

        serializer = self.get_serializer(queryset, many=True)
        data = [{'id': item['id'], 'template_name': item['template_name']} for item in serializer.data]

        return Response(data)


class retorna_opcoes_anteriores(viewsets.ModelViewSet):
    queryset = wpp_templates.objects.all()
    serializer_class = WPPTemplatesSerializer
    permission_classes = [permissions.IsAuthenticated]
    permission_classes = []
    filter_backends = [filters.SearchFilter]
    search_fields = ['template_name']

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        queryset = queryset.filter(empresa= request.user.empresa, statusregistro_id=200)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class RetornaOpcoesFiltradas(viewsets.ModelViewSet):
    queryset = wpp_templates.objects.all()
    serializer_class = WPPTemplatesSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['category']

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        # Obtenha as escolhas do usuário da solicitação (request)
        escolhas_do_usuario = request.GET.get('filterOption', '').split(',')

        # Lista para armazenar os resultados de cada escolha
        resultados = []

        # Use as escolhas do usuário para filtrar o queryset e acumular resultados
        for escolha in escolhas_do_usuario:
            resultados.extend(queryset.filter(empresa=request.user.empresa, statusregistro_id=200, category=escolha))

        serializer = self.get_serializer(resultados, many=True)
        return Response(serializer.data)




class criatividade_iaViewSet(viewsets.ModelViewSet):
    queryset = ia_criatividade.objects.all()
    serializer_class = criatividade_iaSerializer
    permission_classes = [permissions.IsAuthenticated]

    # Return data for edit in transportadora-list
    def retrieve(self, request, pk=None):
        try:
            condicao = ia_criatividade.objects.get(pk=pk)
        except ia_criatividade.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)

        serializer = self.get_serializer(condicao)
        return Response(serializer.data)

    # Edit data
    def patch(self, request, pk=None):
        try:
            condicao = ia_criatividade.objects.get(pk=pk)
        except ia_criatividade.DoesNotExist:
            return Response({"error": "Item not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(condicao, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class tomvozViewSet(viewsets.ModelViewSet):
    queryset = ia_tomvoz.objects.all()
    serializer_class = tomvoz_iaSerializer
    permission_classes = [permissions.IsAuthenticated]

    # Return data for edit in transportadora-list
    def retrieve(self, request, pk=None):
        try:
            condicao = ia_tomvoz.objects.get(pk=pk)
        except ia_tomvoz.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)

        serializer = self.get_serializer(condicao)
        return Response(serializer.data)

    # Edit data
    def patch(self, request, pk=None):
        try:
            condicao = ia_tomvoz.objects.get(pk=pk)
        except ia_tomvoz.DoesNotExist:
            return Response({"error": "Item not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(condicao, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class gpt_engineViewSet(viewsets.ModelViewSet):
    queryset = gpt_engine.objects.all()
    serializer_class = gpt_engineSerializer
    permission_classes = [permissions.IsAuthenticated]

    # Return data for edit in transportadora-list
    def retrieve(self, request, pk=None):
        try:
            condicao = gpt_engine.objects.get(pk=pk)
        except gpt_engine.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)

        serializer = self.get_serializer(condicao)
        return Response(serializer.data)

    # Edit data
    def patch(self, request, pk=None):
        try:
            condicao = gpt_engine.objects.get(pk=pk)
        except gpt_engine.DoesNotExist:
            return Response({"error": "Item not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(condicao, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ia_prompt_settingsViewSet(viewsets.ModelViewSet):
    queryset = ia_prompt_settings.objects.all()
    serializer_class = ia_prompt_settingsSerializer
    permission_classes = [permissions.IsAuthenticated]

    # Return data for edit in transportadora-list
    def retrieve(self, request, pk=None):
        try:
            condicao = ia_prompt_settings.objects.get(pk=pk)
        except ia_prompt_settings.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)

        serializer = self.get_serializer(condicao)
        return Response(serializer.data)

    # Edit data
    def patch(self, request, pk=None):
        try:
            condicao = ia_prompt_settings.objects.get(pk=pk)
        except ia_prompt_settings.DoesNotExist:
            return Response({"error": "Item not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(condicao, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class wpp_fieldsViewSet(viewsets.ModelViewSet):
    queryset = wpp_fields.objects.all()
    serializer_class = wpp_fieldsSerializer
    permission_classes = [permissions.IsAuthenticated]


    # Return data for edit in transportadora-list
    def retrieve(self, request, pk=None):
        try:
            condicao = wpp_fields.objects.get(pk=pk)
        except wpp_fields.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)

        serializer = self.get_serializer(condicao)
        return Response(serializer.data)

    # Edit data
    def patch(self, request, pk=None):
        try:
            condicao = wpp_fields.objects.get(pk=pk)
        except wpp_fields.DoesNotExist:
            return Response({"error": "Item not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(condicao, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # def destroy(self, request, *args, **kwargs):
    #     instance = self.get_object()

    #     # Defina deleted_at com a data/hora atual
    #     instance.exclusao_dt = datetime.datetime.now()

    #     # Defina status como 9000
    #     instance.statusregistro_id = 9000

    #     instance.save()
    #     return Response(status=status.HTTP_204_NO_CONTENT)

class callToActionViewSet(viewsets.ModelViewSet):
        queryset = callToAction.objects.all()
        serializer_class = callToActionSerializer
        permission_classes = [permissions.IsAuthenticated]

        # Create data
        def create(self, request):
            palavra_acao = request.data.get('palavra_acao').lower()
            try:
                condicao = callToAction.objects.get(palavra_acao=palavra_acao, empresa = request.user.empresa)
                serializer = self.get_serializer(condicao, data=request.data, partial=True)
            except callToAction.DoesNotExist:
                serializer = self.get_serializer(data=request.data)

            if serializer.is_valid():

                template = serializer.validated_data['template_resposta']
                template.processada_ajuste_resposta = 'N'
                template.save()

                # informa a empresa do usuário
                serializer.validated_data['palavra_acao'] = palavra_acao
                serializer.validated_data['empresa'] = request.user.empresa
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


        # Return data for edit in transportadora-list
        def retrieve(self, request, pk=None):
            try:
                condicao = callToAction.objects.filter(template=pk)
            except callToAction.DoesNotExist:
                return Response({"error": "Item not found."}, status=404)

            serializer = self.get_serializer(condicao, many=True)
            return Response(serializer.data)

        def partial_update(self, request, pk=None):
            try:
                condicao = callToAction.objects.get(pk=pk)
            except callToAction.DoesNotExist:
                return Response({"error": "Item not found."}, status=status.HTTP_404_NOT_FOUND)

            serializer = self.get_serializer(condicao, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.validated_data['palavra_acao'] = serializer.validated_data['palavra_acao'].lower()
                nova_palavra_acao = serializer.validated_data['palavra_acao']

                # Verifica se a palavra de ação mudou
                if nova_palavra_acao != condicao.palavra_acao.lower():
                    # Se a palavra de ação mudou, remove a antiga do bot
                    bots = condicao.bots_conectados.all()
                    print('bots',bots)

                    # Itera sobre os bots e remove a palavra de ação do JSON de cada bot
                    for bot in bots:
                        actions = bot.call_to_actions
                        palavra_acao = condicao.palavra_acao.lower()
                        actions = [action for action in actions if not action.get(palavra_acao)]
                        bot.call_to_actions = actions
                        bot.save()

                template = serializer.validated_data['template_resposta']
                template.processada_ajuste_resposta = 'N'
                template.save()

                serializer.validated_data['empresa'] = request.user.empresa
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        def destroy(self, request, pk=None):
            try:
                condicao = callToAction.objects.get(pk=pk)
            except callToAction.DoesNotExist:
                return Response({"error": "Item not found."}, status=status.HTTP_404_NOT_FOUND)

            # Pega a lista de bots com a palavra de ação
            bots = condicao.bots_conectados.all()

            # Itera sobre os bots e remove a palavra de ação do JSON de cada bot
            for bot in bots:
                actions = bot.call_to_actions
                palavra_acao = condicao.palavra_acao.lower()
                actions = [action for action in actions if not action.get(palavra_acao)]
                bot.call_to_actions = actions
                bot.save()

            # Exclui a palavra de ação
            condicao.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

# --- Funções Auxiliares n8n ---

def convert_drawflow_to_n8n(drawflow_data, user_variables):
    """
    Converte o JSON do Drawflow para o formato de workflow do n8n.
    Implementação básica focada nos nós principais e mapeamento de API.
    """
    logger.info("Iniciando conversão de Drawflow para n8n...")
    n8n_nodes = []
    n8n_connections = {}
    node_id_map = {} # Mapeia ID Drawflow para ID n8n (gerado aqui)
    node_counter = 1 # Para gerar IDs n8n únicos
    node_positions = {} # Armazena posições para cálculo relativo

    try:
        # Verifica se drawflow_data é string e tenta convertê-lo para dict
        if isinstance(drawflow_data, str):
            try:
                drawflow_data = json.loads(drawflow_data)
                logger.info("Convertido drawflow_data de string para dict")
            except json.JSONDecodeError:
                logger.error("Falha ao converter drawflow_data de string para dict")
                return None

        # Assume que o módulo principal se chama 'Home' no Drawflow JSON
        drawflow_nodes_dict = drawflow_data.get('drawflow', {}).get('Home', {}).get('data', {})
        if not isinstance(drawflow_nodes_dict, dict):
            logger.error("Estrutura de nós do Drawflow inválida ou não encontrada.")
            return None
    except Exception as e:
        logger.error(f"Erro ao acessar estrutura de nós do Drawflow: {e}")
        return None

    flow_title = "Fluxo Convertido" # Título padrão

    # 1. Primeira Passada: Criar nós n8n e mapear IDs/Posições
    position_x_offset = 250 # Offset inicial X
    position_y_offset = 100
    for df_node_id, df_node in drawflow_nodes_dict.items():
        n8n_node_ui_id = f"node_{node_counter}"
        node_id_map[df_node_id] = n8n_node_ui_id
        node_counter += 1

        # Usa posições do Drawflow como base (ajustar escala se necessário)
        pos_x = df_node.get('pos_x', position_x_offset) + position_x_offset
        pos_y = df_node.get('pos_y', position_y_offset) + position_y_offset
        node_positions[n8n_node_ui_id] = [pos_x, pos_y]

        node_type = df_node.get('name')
        node_data = df_node.get('data', {})
        node_label = df_node.get('label', node_type) # Usa label se existir

        n8n_node_base = {
            "id": n8n_node_ui_id,
            "name": node_label,
            "type": "n8n-nodes-base.noOp", # Tipo padrão para nós não mapeados
            "typeVersion": 1,
            "position": [pos_x, pos_y],
            "parameters": {}
        }

        # --- Mapeamento de Tipos de Nó ---
        if node_type == 'inicio':
            n8n_node_base["type"] = "n8n-nodes-base.webhook"
            n8n_node_base["name"] = node_label or "Webhook Trigger"
            n8n_node_base["parameters"] = {
                "path": f"webhook-flow-{df_node_id}", # Gera um path único
                "httpMethod": "POST",
                "responseMode": "onReceived",
                "options": {}
            }
            # Preserva todos os dados do nó
            if node_data:
                n8n_node_base["parameters"]["data"] = node_data

        elif node_type == 'enviar_mensagem':
            # Agora usando WhatsApp Cloud API
            n8n_node_base["type"] = "n8n-nodes-base.httpRequest"
            n8n_node_base["name"] = node_label or "Enviar Mensagem WhatsApp"
            
            # Preserva o texto e tipo de mensagem
            message_text = node_data.get('text', '')
            message_type = node_data.get('messageType', 'text')
            dynamic_buttons = node_data.get('dynamicButtons', [])
            
            # Configura os parâmetros para envio de mensagem WhatsApp
            n8n_node_base["parameters"] = {
                "url": "{{$env.WHATSAPP_API_URL}}/messages",
                "method": "POST",
                "sendHeaders": True,
                "headerParameters": {
                    "parameters": [
                        {"name": "Authorization", "value": "Bearer {{$env.WHATSAPP_API_TOKEN}}"},
                        {"name": "Content-Type", "value": "application/json"}
                    ]
                },
                "sendBody": True,
                "contentType": "json",
                "options": {},
                "nodeData": node_data  # Preserva todos os dados originais
            }
            
            # Constrói o body baseado no tipo de mensagem
            body = {
                "messaging_product": "whatsapp",
                "recipient_type": "individual",
                "to": "{{$node[\"Webhook Trigger\"].json[\"phoneNumber\"]}}",
                "type": message_type
            }
            
            # Adiciona conteúdo adequado ao tipo
            if message_type == 'text':
                body["text"] = {"body": message_text}
            elif message_type == 'image':
                body["image"] = {
                    "link": "{{$env.DEFAULT_IMAGE_URL}}",
                    "caption": message_text
                }
            elif message_type == 'template':
                body["template"] = {
                    "name": "{{$env.TEMPLATE_NAME}}",
                    "language": {"code": "pt_BR"},
                    "components": []
                }
            
            # Adiciona botões se houver
            if dynamic_buttons and len(dynamic_buttons) > 0:
                if message_type == 'interactive':
                    body["interactive"] = {
                        "type": "button",
                        "body": {"text": message_text},
                        "action": {
                            "buttons": [
                                {"type": "reply", "reply": {"id": btn.get('id', f'btn_{i}'), "title": btn.get('text', 'Botão')}}
                                for i, btn in enumerate(dynamic_buttons)
                            ]
                        }
                    }
            
            n8n_node_base["parameters"]["jsonBody"] = json.dumps(body)

        elif node_type == 'aguardar_resposta':
            # Implementação mais completa para aguardar resposta
            n8n_node_base["type"] = "n8n-nodes-base.wait"
            n8n_node_base["name"] = node_label or "Aguardar Resposta"
            
            # Preserva configurações originais
            timeout_seconds = node_data.get('timeoutSeconds', 300)
            variable_name = node_data.get('variableName', 'user_response')
            prompt_message = node_data.get('promptMessage', 'Digite sua resposta:')
            expected_type = node_data.get('expectedType', 'any')
            
            n8n_node_base["parameters"] = {
                "resumeMode": "webhook",
                "webhook": {
                    "path": f"response-{df_node_id}",
                    "responseMode": "lastNode"
                },
                "timeout": timeout_seconds,
                "limitWaitTime": True,
                "maxWaitTime": timeout_seconds,
                "options": {},
                "nodeData": node_data  # Preserva todos os dados originais
            }
            
            # Adiciona um nó Set depois para salvar a resposta na variável
            set_node_ui_id = f"node_{node_counter}"
            node_counter += 1
            set_pos_x, set_pos_y = node_positions[n8n_node_base["id"]]
            set_pos_y += 100 # Posiciona abaixo do nó de espera
            node_positions[set_node_ui_id] = [set_pos_x, set_pos_y]
            
            set_node = {
                "id": set_node_ui_id,
                "name": f"Salvar Resposta em {variable_name}",
                "type": "n8n-nodes-base.set",
                "typeVersion": 1,
                "position": [set_pos_x, set_pos_y],
                "parameters": {
                    "values": {
                        "string": [
                            {
                                "name": variable_name,
                                "value": "{{$json.body}}"
                            }
                        ]
                    },
                    "options": {}
                }
            }
            n8n_nodes.append(set_node)
            node_id_map[f"{df_node_id}_set"] = set_node_ui_id

        elif node_type == 'condicao':
            n8n_node_base["type"] = "n8n-nodes-base.if"
            n8n_node_base["name"] = node_label or "Condição"
            op_map = {'==': 'equal', '!=': 'notEqual', '>': 'larger', '<': 'smaller', '>=': 'largerEqual', '<=': 'smallerEqual', 'contains': 'contains', 'startsWith': 'startsWith', 'endsWith': 'endsWith'}
            n8n_operator = op_map.get(node_data.get('operator'), 'equal')
            variable_expression = f"{{{{{node_data.get('variable', '')}}}}}"
            value_to_compare = node_data.get('value', '')
            value_type = 'string' # Default
            try:
                float(value_to_compare); value_type = 'number'
            except ValueError:
                if value_to_compare.lower() in ['true', 'false']: value_type = 'boolean'

            n8n_node_base["parameters"] = {
                "conditions": [{
                    value_type: { "value1": variable_expression, "operation": n8n_operator, "value2": value_to_compare }
                }],
                "nodeData": node_data  # Preserva todos os dados originais
            }

        elif node_type == 'definir_variavel':
            n8n_node_base["type"] = "n8n-nodes-base.set"
            n8n_node_base["name"] = node_label or f"Definir {node_data.get('variableName', '?')}"
            var_type = node_data.get('variableType', 'string') or 'string'
            n8n_type_key = 'string'
            if var_type == 'number': n8n_type_key = 'number'
            elif var_type == 'boolean': n8n_type_key = 'boolean'

            n8n_node_base["parameters"] = {
                "values": { n8n_type_key: [{"name": node_data.get('variableName', 'var_indefinida'), "value": node_data.get('variableValue', '')}] },
                "options": {},
                "nodeData": node_data  # Preserva todos os dados originais
            }

        elif node_type == 'chamada_api':
            n8n_node_base["type"] = "n8n-nodes-base.httpRequest"
            n8n_node_base["name"] = node_label or f"API: {node_data.get('method', 'GET')}"
            headers = {}
            try: headers = json.loads(node_data.get('headers', '{}')) if node_data.get('headers') else {}
            except json.JSONDecodeError: 
                logger.warning(f"Cabeçalhos inválidos no nó API {df_node_id}")
                # Tenta tratar como string simples se falhar como JSON
                if isinstance(node_data.get('headers'), str):
                    headers_str = node_data.get('headers')
                    if ':' in headers_str:
                        key, value = headers_str.split(':', 1)
                        headers = {key.strip(): value.strip()}

            # Prepara o corpo da requisição
            request_body = node_data.get('body', '{}')
            if isinstance(request_body, str):
                try:
                    if not request_body:
                        request_body = '{}'
                    json.loads(request_body)  # Testa se é JSON válido
                except json.JSONDecodeError:
                    # Se não for JSON válido, converte para JSON válido
                    request_body = json.dumps({"data": request_body})
                    logger.warning(f"Corpo da requisição convertido para JSON válido no nó API {df_node_id}")

            n8n_node_base["parameters"] = {
                "url": node_data.get('url', ''),
                "method": node_data.get('method', 'GET'),
                "sendHeaders": True,
                "headerParameters": {"parameters": [{"name": k, "value": v} for k, v in headers.items()]},
                "sendBody": node_data.get('method', 'GET') not in ['GET', 'DELETE'] and bool(node_data.get('body')),
                "contentType": "json", # Assume JSON
                "jsonBody": request_body,
                "options": {},
                "nodeData": node_data  # Preserva todos os dados originais
            }
            
            # Adiciona nó Set para mapeamento, se necessário
            mappings = node_data.get('responseMappings', [])
            response_variable = node_data.get('responseVariable')
            
            if mappings or response_variable:
                set_node_ui_id = f"node_{node_counter}"
                node_counter += 1
                set_pos_x, set_pos_y = node_positions[n8n_node_base["id"]]
                set_pos_y += 100 # Posiciona abaixo do nó HTTP
                node_positions[set_node_ui_id] = [set_pos_x, set_pos_y]

                set_values = { "string": [], "number": [], "boolean": [] }
                
                # Adiciona mapeamento para variável de resposta geral
                if response_variable:
                    set_values["string"].append({
                        "name": response_variable,
                        "value": "{{$json}}"
                    })
                
                # Adiciona mapeamentos específicos
                for mapping in mappings:
                    api_field = mapping.get('apiField')
                    local_var = mapping.get('localVariable')
                    if api_field and local_var:
                        var_type = 'string' # Default
                        found_var = next((v for v in user_variables if v.get('name') == local_var), None)
                        if found_var: var_type = found_var.get('type', 'string')

                        n8n_type_key = 'string'
                        if var_type == 'number': n8n_type_key = 'number'
                        elif var_type == 'boolean': n8n_type_key = 'boolean'

                        # Expressão n8n para acessar valor (assume resposta JSON no nó anterior)
                        value_expression = f'{{{{$json.{api_field}}}}}'
                        if api_field.startswith('$'):
                            # Tenta usar JSONata
                            value_expression = f'{{{{$jsonata(\'{api_field}\')}}}}'
                            logger.info(f"Usando expressão JSONata para mapeamento: {value_expression}")

                        set_values[n8n_type_key].append({"name": local_var, "value": value_expression})

                if any(v for k_list in set_values.values() for v in k_list): # Verifica se há valores em alguma lista
                    set_node = {
                        "id": set_node_ui_id,
                        "name": f"Mapear Resposta API {df_node_id}",
                        "type": "n8n-nodes-base.set", "typeVersion": 1,
                        "position": [set_pos_x, set_pos_y],
                        "parameters": { 
                            "values": set_values, 
                            "options": {"keepOnlySet": False},
                            "nodeData": {"parentNodeId": df_node_id, "mappings": mappings}
                        }
                    }
                    n8n_nodes.append(set_node)
                    node_id_map[f"{df_node_id}_set"] = set_node_ui_id # Mapeia ID do nó Set

        elif node_type == 'atraso':
            n8n_node_base["type"] = "n8n-nodes-base.wait"
            n8n_node_base["name"] = node_label or "Atraso"
            delay_time = node_data.get('delayTime', 5)
            delay_unit = node_data.get('delayUnit', 'seconds')
            n8n_unit = delay_unit if delay_unit in ['seconds', 'minutes', 'hours'] else 'seconds'
            n8n_node_base["parameters"] = {
                "amount": delay_time, 
                "unit": n8n_unit,
                "resumeMode": "timeInterval",
                "nodeData": node_data  # Preserva todos os dados originais
            }

        elif node_type == 'fim':
            n8n_node_base["type"] = "n8n-nodes-base.noOp" # Nó NoOp como ponto final visual
            n8n_node_base["name"] = node_label or "Fim"
            n8n_node_base["parameters"] = {
                "nodeData": node_data  # Preserva todos os dados originais
            }

        else:
            logger.warning(f"Tipo de nó Drawflow não mapeado: {node_type}. Usando nó NoOp.")
            n8n_node_base["name"] = f"Não Mapeado: {node_label or node_type}"
            n8n_node_base["parameters"] = {
                "nodeData": node_data  # Preserva todos os dados originais para futuro mapeamento
            }

        n8n_nodes.append(n8n_node_base)

    # 2. Segunda Passada: Criar conexões n8n
    for df_node_id, df_node in drawflow_nodes_dict.items():
        source_n8n_node_id = node_id_map.get(df_node_id)
        if not source_n8n_node_id: continue

        # Determina o ID de origem efetivo (pode ser o nó Set após uma API)
        set_node_n8n_id = node_id_map.get(f"{df_node_id}_set")
        effective_source_id = set_node_n8n_id if set_node_n8n_id else source_n8n_node_id
        source_node_type = df_node.get('name')

        # Conecta API -> Set ou Aguardar -> Set se existir
        if set_node_n8n_id and source_n8n_node_id:
            if source_n8n_node_id not in n8n_connections: n8n_connections[source_n8n_node_id] = {"main": [[]]}
            n8n_connections[source_n8n_node_id]["main"][0].append({"node": set_node_n8n_id, "type": "main", "index": 0})

        # Itera sobre as saídas do nó Drawflow
        outputs = df_node.get('outputs', {})
        for output_name, output_data in outputs.items():
            connections = output_data.get('connections', [])
            for connection in connections:
                target_df_id = connection.get('node')
                target_n8n_id = node_id_map.get(target_df_id)
                target_input_index = 0
                try: 
                    # Extrai o número do input (input_1, input_2, etc.)
                    target_input = connection.get('output', 'input_1')
                    if target_input.startswith('input_'):
                        target_input_index = int(target_input.split('_')[-1]) - 1
                    else:
                        target_input_index = 0
                except: 
                    target_input_index = 0

                if target_n8n_id:
                    source_output_index = 0 # Default
                    
                    # Determina o índice de saída com base no tipo de nó
                    if source_node_type == 'condicao':
                        if output_name == 'output_1': source_output_index = 0  # True
                        elif output_name == 'output_2': source_output_index = 1  # False
                    elif 'output_' in output_name:
                        # Para nós com múltiplas saídas numeradas (como botões)
                        try:
                            source_output_index = int(output_name.split('_')[-1]) - 1
                        except:
                            source_output_index = 0
                            
                    # Garante que o nó fonte exista no dicionário de conexões
                    if effective_source_id not in n8n_connections:
                        n8n_connections[effective_source_id] = {"main": [[] for _ in range(max(4, source_output_index+1))]}
                        
                    # Garante que há slots suficientes para o índice de saída
                    while len(n8n_connections[effective_source_id]["main"]) <= source_output_index:
                        n8n_connections[effective_source_id]["main"].append([])

                    # Adiciona a conexão
                    n8n_connections[effective_source_id]["main"][source_output_index].append({
                        "node": target_n8n_id, "type": "main", "index": target_input_index
                    })

    # Monta o JSON final do workflow n8n
    n8n_workflow_final = {
        "name": flow_title,
        "nodes": n8n_nodes,
        "connections": n8n_connections,
        "active": True,
        "settings": {
            "executionOrder": "v1", 
            "saveManualExecutions": True,
            "callerPolicy": "workflowsFromSameOwner",
            "errorWorkflow": ""
        },
        "tags": [],
        "triggerCount": 1,
        "id": None # ID será definido pelo n8n ou na atualização
    }

    logger.info("Conversão Drawflow para n8n concluída.")
    return n8n_workflow_final

def sync_n8n_workflow(n8n_workflow_json, existing_n8n_id=None):
    """
    Cria ou atualiza um workflow na API do n8n usando credenciais fornecidas.
    Retorna o ID do workflow n8n (novo ou existente) em caso de sucesso, ou None em caso de falha.
    """
    # Usa configurações do environment ou settings.py
    n8n_url = os.getenv('N8N_URL')
    n8n_api_key = os.getenv('N8N_API_KEY')

    if not n8n_url or not n8n_api_key:
        logger.error("URL ou API Key do n8n não fornecidas.")
        return None

    headers = {
        'Authorization': f'ApiKey {n8n_api_key}',
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': n8n_api_key
    }
    api_url_base = n8n_url.rstrip('/') + '/api/v1/workflows'

    try:
        # Verifica se o ID existente é um placeholder gerado pelo model

        # Prepara o payload removendo o ID e o campo active, pois n8n não os aceita no corpo
        payload = {k: v for k, v in n8n_workflow_json.items() if k not in ['id', 'active']}

        if existing_n8n_id:
            # Atualiza workflow existente (ID real do n8n)
            api_url = f"{api_url_base}/{existing_n8n_id}"
            logger.info(f"Tentando atualizar workflow n8n ID: {existing_n8n_id} em {api_url}")
            response = requests.put(api_url, headers=headers, json=payload, timeout=20) # Aumentado timeout
            response.raise_for_status()
            logger.info(f"Workflow n8n {existing_n8n_id} atualizado com sucesso. Status: {response.status_code}")
            return str(existing_n8n_id) # Retorna o ID existente como string
        else:
            # Cria novo workflow (ou se o ID era placeholder)
            logger.info(f"Tentando criar novo workflow n8n em {api_url_base} (ID anterior era placeholder ou inexistente)")
            response = requests.post(api_url_base, headers=headers, json=payload, timeout=20) # Aumentado timeout
            response.raise_for_status()
            response_data = response.json()
            new_n8n_id = response_data.get('id')
            if new_n8n_id:
                logger.info(f"Novo workflow n8n criado com sucesso. ID: {new_n8n_id}")
                return str(new_n8n_id) # Retorna o novo ID como string
            else:
                logger.error(f"API n8n retornou sucesso mas sem ID no corpo da resposta: {response_data}")
                return None

    except requests.exceptions.RequestException as e:
        logger.error(f"Erro ao comunicar com a API do n8n: {e}")
        if hasattr(e, 'response') and e.response is not None:
            logger.error(f"n8n API Response Status: {e.response.status_code}")
            try:
                error_details = e.response.json()
                logger.error(f"n8n API Response Body: {json.dumps(error_details, indent=2)}")
            except json.JSONDecodeError:
                logger.error(f"n8n API Response Body (non-JSON): {e.response.text}")
        return None
    except Exception as e:
        logger.error(f"Erro inesperado durante sincronização com n8n: {e}", exc_info=True)
        return None

# --- ViewSet ---

class FlowsViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows Flows to be viewed, edited or created,
    and synchronizes them with n8n. Handles multipart/form-data for file uploads.
    """
    queryset = Flows.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = FlowsSerializer
    parser_classes = (MultiPartParser, FormParser) # Adicionado para lidar com uploads

    def _extract_base64_from_html(self, html_content, node_id, flow_id=None):
        """
        Extrai conteúdo Base64 de uma tag img no HTML
        Retorna: (dados_decodificados, mime_type, nome_arquivo)
        """
        if not html_content:
            return None, None, None
            
        try:
            # Regex para encontrar Base64 em src (com ou sem escape)
            # Primeiro procuramos em formato normal (sem escape de \ para JSON)
            match = re.search(r'src="data:([^;]+);base64,([^"]+)"', html_content)
            
            # Se não encontrar, tenta com escape (formato JSON)
            if not match:
                match = re.search(r'src=\\"data:([^;]+);base64,([^\\"]+)\\"', html_content)
                
            if not match:
                path = re.search(r'src="([^"]+)"', html_content)
                if not path:
                    logger.info(f"Não encontrado Base64 no HTML do nó {node_id} do fluxo {flow_id}")
                    if flow_id:
                        if FlowAttachment.objects.filter(flow_id=flow_id, node_id=node_id).exists():
                            attachment = FlowAttachment.objects.get(flow_id=flow_id, node_id=node_id)
                            self._delete_flow_media(attachment.file.name)
                            attachment.delete()
                return None, None, None
                
            mime_type = match.group(1)
            encoded_data = match.group(2)
            
            # Tenta decodificar o Base64
            try:
                decoded_data = base64.b64decode(encoded_data)
            except Exception as e:
                logger.error(f"Erro ao decodificar Base64 no nó {node_id}: {e}")
                return None, None, None
            
            # Gera nome de arquivo com base no ID do nó
            extension_map = {
                'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif',
                'application/pdf': 'pdf',
                'video/mp4': 'mp4', 'video/quicktime': 'mov',
                'audio/mpeg': 'mp3', 'audio/ogg': 'ogg',
            }
            file_ext = extension_map.get(mime_type, 'bin')
            file_name = f"node_{node_id}_image.{file_ext}"
            
            return decoded_data, mime_type, file_name
            
        except Exception as e:
            logger.error(f"Erro ao extrair Base64 do HTML para nó {node_id}: {e}")
            return None, None, None

    def _save_uploaded_file(self, flow_instance, node_id, uploaded_file):
        """Salva um UploadedFile para um fluxo e retorna a URL relativa."""
        try:
            # Gera um nome de arquivo seguro
            original_name = uploaded_file.name
            safe_file_name = "".join(c if c.isalnum() or c in ['.', '_'] else '_' for c in original_name)
            # Trunca o nome se for muito longo
            max_len = 50
            if len(safe_file_name) > max_len:
                name_part, current_ext = os.path.splitext(safe_file_name)
                safe_file_name = name_part[:max_len - len(current_ext)] + current_ext

            # Define o caminho do diretório e o cria se não existir
            # Usa o n8n_workflow_id que é o identificador usado na URL
            dir_id = flow_instance.n8n_workflow_id if flow_instance.n8n_workflow_id else str(flow_instance.pk)
            logger.info(f"ID do diretório para mídia: {dir_id}")
            
            # Verificação adicional de ID
            if not dir_id:
                logger.error(f"Erro crítico: flow_instance não tem PK ou n8n_workflow_id válido: pk={flow_instance.pk}, n8n_id={flow_instance.n8n_workflow_id}")
                return None
                
            # Log de media root para debug
            logger.info(f"MEDIA_ROOT configurado: {settings.MEDIA_ROOT}")
            
            media_dir = os.path.join(settings.MEDIA_ROOT, 'flows', dir_id)
            logger.info(f"Diretório completo para mídia: {media_dir}")
            
            # Verifica e cria os diretórios na hierarquia completa
            if not os.path.exists(media_dir):
                logger.info(f"Criando diretório para mídia do fluxo: {media_dir}")
                try:
                    os.makedirs(media_dir, exist_ok=True)
                    logger.info(f"Diretório criado com sucesso: {media_dir}")
                except Exception as e:
                    logger.error(f"Erro ao criar diretório de mídia {media_dir}: {e}", exc_info=True)
                    # Tenta criar diretório pai se falhar
                    parent_dir = os.path.dirname(media_dir)
                    if not os.path.exists(parent_dir):
                        logger.info(f"Tentando criar diretório pai: {parent_dir}")
                        os.makedirs(parent_dir, exist_ok=True)
                    # Tenta novamente o diretório completo
                    os.makedirs(media_dir, exist_ok=True)
            else:
                logger.info(f"Diretório para mídia do fluxo já existe: {media_dir}")

            # Verifica se o nome do arquivo indica que é um arquivo extraído de base64 ou HTML
            if original_name.startswith("node_") and ("_image." in original_name):
                # Usa o mesmo nome recebido para manter consistência
                final_file_name = original_name
                logger.info(f"Usando nome consistente para imagem extraída: {final_file_name}")
            else:
                # Adiciona o ID do nó ao nome do arquivo para evitar colisões
                final_file_name = f"{node_id}_{safe_file_name}"
            
            file_path = os.path.join(media_dir, final_file_name)
            logger.info(f"Caminho completo do arquivo: {file_path}")

            # Salva o arquivo
            try:
                with open(file_path, 'wb+') as destination:
                    for chunk in uploaded_file.chunks():
                        destination.write(chunk)
                logger.info(f"Arquivo físico salvo com sucesso em: {file_path}")
            except Exception as e:
                logger.error(f"Erro ao salvar arquivo físico em {file_path}: {e}", exc_info=True)
                return None

            # Define a URL base do site
            
            # Retorna a URL completa (domínio + URL relativa)
            media_url = settings.MEDIA_URL
            logger.info(f"MEDIA_URL configurado: {media_url}")
            
            relative_url = os.path.join(settings.MEDIA_URL, 'flows', dir_id, final_file_name).replace("\\", "/") # Garante barras corretas
            # Constrói a URL completa para uso no HTML e JSON
            full_url = domain + relative_url
            logger.info(f"URL completa final: {full_url}")
            
            # Teste de existência do arquivo salvo
            if os.path.exists(file_path):
                file_size = os.path.getsize(file_path)
                logger.info(f"Arquivo verificado em disco: {file_path}, tamanho: {file_size} bytes")
            else:
                logger.warning(f"ALERTA: Arquivo não encontrado em disco após tentativa de salvamento: {file_path}")
            
            # Construct the path relative to MEDIA_ROOT for the FileField name
            relative_path_for_field = os.path.join('flows', dir_id, final_file_name).replace("\\", "/")

            # Cria ou atualiza o registro FlowAttachment
            try:
                attachment, created = FlowAttachment.objects.update_or_create(
                    flow=flow_instance,
                    node_id=node_id,
                    defaults={
                        'file_name': final_file_name,  # Usa o nome final em vez do original
                        'file_type': uploaded_file.content_type,
                        'file_key': f"file_node_{node_id}",
                        # Assign the relative path to the 'file' field (which is a FileField)
                        'file': relative_path_for_field
                    }
                )
                if created:
                    logger.info(f"Novo FlowAttachment criado para nó {node_id}")
                else:
                    logger.info(f"FlowAttachment existente atualizado para nó {node_id}")

                logger.info(f"FlowAttachment salvo/atualizado com ID {attachment.id}, File path set to: {attachment.file.name}")
            except Exception as e:
                logger.error(f"Erro ao salvar FlowAttachment: {e}", exc_info=True)
                # Não removemos o arquivo mesmo se falhar o FlowAttachment, apenas logamos o erro
            
            return full_url  # Retornamos a URL completa em vez de apenas a relativa

        except Exception as e:
            logger.error(f"Erro ao salvar arquivo para flow {flow_instance.pk}, nó {node_id}: {e}", exc_info=True)
            return None

    def _delete_flow_media(self, media_url):
        """Deleta um arquivo de mídia do sistema de arquivos."""
        if not media_url:
            return False
        try:
            # Verifica se media_url é um FieldFile ou uma string
            if hasattr(media_url, 'name'):
                # Se for um FieldFile, pegamos o nome (path relativo)
                file_path = os.path.join(settings.MEDIA_ROOT, media_url.name)
                if os.path.exists(file_path):
                    os.remove(file_path)
                    logger.info(f"Mídia deletada: {file_path}")
                    return True
            else:
                # Se for uma string, continuamos com a lógica atual
                # Remover o domínio da URL se estiver presente
                if isinstance(media_url, str) and media_url.startswith(domain):
                    media_url = media_url[len(domain):]
                
                # Continua com a lógica para construir o caminho do arquivo
                if isinstance(media_url, str) and media_url.startswith(settings.MEDIA_URL):
                    relative_path = media_url[len(settings.MEDIA_URL):]
                    file_path = os.path.join(settings.MEDIA_ROOT, relative_path.lstrip('/'))

                    if os.path.exists(file_path):
                        os.remove(file_path)
                        logger.info(f"Mídia deletada: {file_path}")
                        
                        # Tenta encontrar e deletar o FlowAttachment correspondente
                        try:
                            from boomerangue.apps.wpp_templates.models import FlowAttachment
                            # Extrai o node_id do nome do arquivo (assumindo formato node_id_filename.ext)
                            filename = os.path.basename(file_path)
                            parts = filename.split('_', 1)
                            if len(parts) > 1:
                                node_id = parts[0]
                                # Busca pelo attachment baseado na parte final do caminho
                                attachments = FlowAttachment.objects.filter(file__endswith=filename)
                                if attachments.exists():
                                    for attachment in attachments:
                                        logger.info(f"Deletando FlowAttachment ID {attachment.id} para nó {attachment.node_id}")
                                        attachment.delete()
                        except Exception as e:
                            logger.error(f"Erro ao deletar FlowAttachment para {file_path}: {e}", exc_info=True)
                        
                        return True
            return False
        except Exception as e:
            logger.error(f"Erro ao deletar mídia {media_url}: {e}", exc_info=True)
            return False

    # Removida _process_flow_media - lógica incorporada em create/update

    def retrieve(self, request, pk=None):
        try:
            condicao = Flows.objects.get(n8n_workflow_id=pk, empresa = request.user.empresa)
            print("JSON", condicao.flow_json)
        except Flows.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)

        serializer = self.get_serializer(condicao)
        data = serializer.data
        return Response(data)

    # Edit data

    def create(self, request, *args, **kwargs):
        # request.data é um QueryDict quando multipart/form-data é usado
        data_copy = request.data.copy() # Cria cópia mutável

        # Extrai e deserializa flow_json
        flow_json_str = data_copy.get('flow_json')
        flow_json_dict = None
        if flow_json_str:
            try:
                flow_json_dict = json.loads(flow_json_str)
                logger.info(f"JSON do fluxo recebido e deserializado com sucesso. Tamanho: {len(flow_json_str)} caracteres")
            except json.JSONDecodeError:
                logger.error(f"Formato inválido para flow_json: {flow_json_str[:100]}...")
                return Response({"error": "Formato inválido para flow_json."}, status=status.HTTP_400_BAD_REQUEST)
        else:
            logger.error("flow_json é obrigatório mas não foi enviado.")
            return Response({"error": "flow_json é obrigatório."}, status=status.HTTP_400_BAD_REQUEST)

        # Cria uma instância inicial para ter o PK para salvar arquivos
        # Passa apenas os dados não-JSON para o serializer inicialmente
        initial_data = {
            'title': data_copy.get('title'),
            'description': data_copy.get('description'),
            'empresa': request.user.empresa.id # Associa à empresa do usuário
            # flow_json e userVariables serão definidos após processamento
        }
        serializer = self.get_serializer(data=initial_data)
        if not serializer.is_valid():
            logger.error(f"Erro ao validar dados iniciais do fluxo: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        instance = serializer.save() # Salva para obter o PK
        logger.info(f"Instância inicial do fluxo criada com ID: {instance.pk}, n8n_workflow_id: {instance.n8n_workflow_id}")

        # Ensure n8n_workflow_id is generated and saved *before* processing files
        if not instance.n8n_workflow_id:
            instance.save() # Garante que a lógica save() do modelo foi executada
            instance.refresh_from_db() # Recarrega para pegar o ID se foi gerado no save()
            logger.info(f"n8n_workflow_id após save/refresh: {instance.n8n_workflow_id}")
        else:
            logger.info(f"Usando n8n_workflow_id existente: {instance.n8n_workflow_id}")

        # Processa arquivos e atualiza o flow_json_dict
        nodes = flow_json_dict.get('drawflow', {}).get('Home', {}).get('data', {})
        if isinstance(nodes, dict) and nodes:
            for node_id, node_content in nodes.items():
                node_html = node_content.get('html')
                if node_html:
                    # Processa Base64 embutido no HTML, converte para arquivo e atualiza a URL
                    decoded_data, mime_type, file_name = self._extract_base64_from_html(node_html, node_id, instance.pk)
                    if decoded_data:
                        # Criar um arquivo temporário para o conteúdo base64
                        file_content = ContentFile(decoded_data)
                        temp_uploaded_file = InMemoryUploadedFile(
                            file=file_content, field_name=None, name=file_name,
                            content_type=mime_type, size=len(decoded_data), charset=None
                        )
                        
                        # Salva o arquivo extraído e atualiza o campo data com a URL
                        new_media_url = self._save_uploaded_file(instance, node_id, temp_uploaded_file)
                        if new_media_url:
                            logger.info(f"Mídia salva para nó {node_id} do fluxo {instance.pk}: {new_media_url}")
                            # Atualiza o campo data do nó com a URL da mídia
                            node_content_data = node_content.get('data', {})
                            if isinstance(node_content_data, dict):
                                node_content_data['mediaUrl'] = new_media_url
                                # Não cria ou modifica campo 'data' se não existir ou não for dict
                            else:
                                logger.warning(f"Campo 'data' não é dict no nó {node_id}. Mídia salva mas não vinculada no JSON.")
                    
                # Processa arquivos enviados por upload, em vez de Base64 inline no HTML
                file_key = f'node_{node_id}_file'
                if file_key in request.FILES:
                    uploaded_file = request.FILES[file_key]
                    logger.info(f"Arquivo enviado para o nó {node_id} do fluxo {instance.pk}: {uploaded_file.name}")
                    
                    # Processa metadados adicionais para este arquivo (opcional)
                    file_metadata = {}
                    metadata_key = f'node_{node_id}_metadata'
                    if metadata_key in data_copy:
                        try:
                            file_metadata = json.loads(data_copy[metadata_key])
                        except json.JSONDecodeError:
                            logger.warning(f"Formato inválido para metadados do arquivo no nó {node_id}")
                    
                    # Salva o arquivo e atualiza o campo data com a URL
                    new_media_url = self._save_uploaded_file(instance, node_id, uploaded_file)
                    if new_media_url:
                        logger.info(f"Mídia (upload) salva para nó {node_id} do fluxo {instance.pk}: {new_media_url}")
                        # Atualiza o campo data do nó com a URL da mídia
                        node_content_data = node_content.get('data', {})
                        if isinstance(node_content_data, dict):
                            node_content_data['mediaUrl'] = new_media_url
                            # Adiciona metadados se existirem
                            if file_metadata:
                                for key, value in file_metadata.items():
                                    node_content_data[f'media_{key}'] = value
                        else:
                            logger.warning(f"Campo 'data' não é dict no nó {node_id}. Mídia salva mas não vinculada no JSON.")

            # Valida e garante que mediaUrls sejam consistentes
            self._validate_flow_media_urls(flow_json_dict)
        else:
            logger.error("Estrutura de nós do Drawflow inválida no JSON recebido durante criação.")
            # Considerar deletar a instância criada ou retornar erro?
            instance.delete() # Remove instância parcialmente criada
            return Response({"error": "Estrutura interna do flow_json inválida."}, status=status.HTTP_400_BAD_REQUEST)

        # Atualiza a instância com o flow_json processado e userVariables
        instance.flow_json = flow_json_dict # Salva o dict processado
        user_variables_str = data_copy.get('userVariables', '[]')
        try:
            instance.userVariables = json.loads(user_variables_str)
        except json.JSONDecodeError:
            logger.warning(f"userVariables inválido recebido para fluxo {instance.pk}. Usando lista vazia.")
            instance.userVariables = []
        instance.save(update_fields=['flow_json', 'userVariables'])

        # --- Integração n8n (após salvar tudo) ---
        try:
            # Converte o flow_json final (dict) para o formato n8n
            n8n_workflow_json = convert_drawflow_to_n8n(instance.flow_json, instance.userVariables)
            if n8n_workflow_json:
                # Cria no n8n (não passa ID existente na criação)
                new_n8n_id = sync_n8n_workflow(n8n_workflow_json, None)
                if new_n8n_id:
                    logger.info(f"Atualizando n8n_workflow_id para Flow ID {instance.pk} para {new_n8n_id} após criação.")
                    instance.n8n_return_id = new_n8n_id
                    instance.save(update_fields=['n8n_return_id'])
                else:
                    logger.warning(f"Falha ao sincronizar com n8n após criar Flow ID {instance.pk}. O ID n8n não foi definido.")
            else:
                logger.error(f"Falha ao converter flow_json para n8n para Flow ID {instance.pk} durante criação.")

        except Exception as e:
            logger.error(f"Erro inesperado durante a integração n8n para Flow ID {instance.pk} após criação: {e}", exc_info=True)
        # --- Fim Integração n8n ---

        # Recarrega a instância para garantir que temos os dados mais atualizados
        instance.refresh_from_db()
        
        # Retorna os dados completos da instância criada
        final_serializer = self.get_serializer(instance)
        headers = self.get_success_headers(final_serializer.data)
        return Response(final_serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    # Edit data
    def partial_update(self, request, pk=None):
        logger.warning(f"Iniciando partial_update para fluxo PK={pk} recebido na URL")
        logger.warning(f"Tipo de request.data: {type(request.data)}")
        logger.warning(f"Chaves em request.data: {list(request.data.keys())}")
        logger.warning(f"Arquivos em request.FILES: {list(request.FILES.keys())}")

        try:
            # Busca pelo n8n_workflow_id (recebido como pk na URL) e empresa
            instance = self.get_queryset().get(n8n_workflow_id=pk, empresa=request.user.empresa)
            logger.info(f"Encontrado fluxo para atualização: ID={instance.pk}, n8n_workflow_id={instance.n8n_workflow_id}")
        except Flows.DoesNotExist:
            logger.error(f"Fluxo não encontrado: n8n_workflow_id={pk}, empresa={request.user.empresa.id}")
            return Response({"error": "Flow não encontrado."}, status=status.HTTP_404_NOT_FOUND)

        data_copy = request.data.copy() # Cria cópia mutável

        # Extrai e deserializa flow_json da requisição
        flow_json_str = data_copy.get('flow_json')
        flow_json_dict = None
        if flow_json_str:
            try:
                flow_json_dict = json.loads(flow_json_str)
                logger.info(f"JSON do fluxo recebido (string) e deserializado com sucesso. Tamanho: {len(flow_json_str)} caracteres")
            except json.JSONDecodeError:
                logger.error(f"Formato inválido para flow_json na atualização: {flow_json_str[:100]}...")
                return Response({"error": "Formato inválido para flow_json."}, status=status.HTTP_400_BAD_REQUEST)
        else:
            # Se flow_json não veio na requisição PATCH, usa o existente na instância
            flow_json_dict = instance.flow_json if isinstance(instance.flow_json, dict) else {}
            logger.info("Usando flow_json existente na instância (não enviado na requisição)")

        # Processa arquivos e atualiza o flow_json_dict
        nodes = flow_json_dict.get('drawflow', {}).get('Home', {}).get('data', {})
        if isinstance(nodes, dict):
            logger.info(f"Processando {len(nodes)} nós no fluxo para atualização")
            nodes_processados = 0
            arquivos_processados = 0
            exclusoes_processadas = 0
            
            for node_id, node_data in nodes.items():
                if node_data.get('name') == 'enviar_mensagem':
                    nodes_processados += 1
                    node_content_data = node_data.get('data', {})
                    node_html = node_data.get('html', '')
                    logger.info(f"Processando nó {node_id} (enviar_mensagem): {node_content_data.get('messageType', 'desconhecido')}")

                    # Processa exclusão
                    if node_content_data.get('deleteMedia'):
                        old_media_url = node_content_data.get('mediaUrl')
                        if old_media_url:
                            deleted = self._delete_flow_media(old_media_url)
                            if deleted:
                                exclusoes_processadas += 1
                                logger.info(f"Mídia excluída com sucesso: {old_media_url}")
                            else:
                                logger.warning(f"Falha ao excluir mídia: {old_media_url}")
                        node_content_data.pop('mediaUrl', None)
                        node_content_data.pop('mediaFileName', None) # Remove nome também
                        node_content_data.pop('deleteMedia', None)
                        logger.info(f"Flags de mídia removidos do nó {node_id} após exclusão")

                    # Processa upload
                    elif node_content_data.get('has_uploaded_file'): # Usa elif para não processar upload se deleteMedia=True
                        file_key = node_content_data.get('uploaded_file_key')
                        logger.info(f"Nó {node_id} tem flag has_uploaded_file=true, file_key={file_key}")
                        
                        uploaded_file = request.FILES.get(file_key)
                        if uploaded_file:
                            logger.info(f"Encontrado arquivo para nó {node_id}: {uploaded_file.name}, tamanho: {uploaded_file.size} bytes")
                            arquivos_processados += 1
                            
                            # Deleta mídia antiga antes de salvar a nova
                            old_media_url = node_content_data.get('mediaUrl')
                            if old_media_url:
                                deleted = self._delete_flow_media(old_media_url)
                                if deleted:
                                    logger.info(f"Mídia anterior excluída antes do upload: {old_media_url}")
                                else:
                                    logger.warning(f"Falha ao excluir mídia anterior: {old_media_url}")

                            # Salva novo arquivo
                            new_media_url = self._save_uploaded_file(instance, node_id, uploaded_file)
                            if new_media_url:
                                node_content_data['mediaUrl'] = new_media_url
                                node_content_data['mediaFileName'] = uploaded_file.name
                                logger.info(f"Arquivo salvo para nó {node_id} com URL: {new_media_url}")
                            else:
                                logger.error(f"Falha ao salvar upload para nó {node_id} no fluxo {instance.pk}")
                                # Remove flags se o save falhou
                                node_content_data.pop('has_uploaded_file', None)
                                node_content_data.pop('uploaded_file_key', None)
                        else:
                            logger.warning(f"Flag 'has_uploaded_file' presente para nó {node_id} mas arquivo '{file_key}' não encontrado em request.FILES. Files disponíveis: {list(request.FILES.keys())}")
                            # Remove flags se o arquivo não veio
                            node_content_data.pop('has_uploaded_file', None)
                            node_content_data.pop('uploaded_file_key', None)

                        # Limpa flags temporárias do JSON após processar upload (mesmo se falhou)
                        node_content_data.pop('has_uploaded_file', None)
                        node_content_data.pop('uploaded_file_key', None)
                    
                    # NOVO: Processa base64 do HTML
                    decoded_data, mime_type, file_name = self._extract_base64_from_html(node_html, node_id, instance.pk)
                    if decoded_data:
                        # Criar um arquivo temporário para o conteúdo base64
                        file_content = ContentFile(decoded_data)
                        temp_uploaded_file = InMemoryUploadedFile(
                            file=file_content, field_name=None, name=file_name,
                            content_type=mime_type, size=len(decoded_data), charset=None
                        )
                        
                        # Deleta mídia antiga antes de salvar a nova
                        old_media_url = node_content_data.get('mediaUrl')
                        if old_media_url:
                            deleted = self._delete_flow_media(old_media_url)
                            if deleted:
                                logger.info(f"Mídia anterior excluída antes de salvar base64 do HTML: {old_media_url}")
                        
                        # Salva o arquivo e atualiza o mediaUrl no JSON
                        new_media_url = self._save_uploaded_file(instance, node_id, temp_uploaded_file)
                        if new_media_url:
                            # Atualiza os dados do nó
                            node_content_data['mediaUrl'] = new_media_url
                            node_content_data['mediaFileName'] = file_name
                            node_content_data['mediaFileType'] = mime_type
                            
                            # Atualiza o HTML para usar a URL em vez do base64
                            # Substitui src="data:..." por src="URL_NOVA"
                            original_html = node_html
                            updated_html = re.sub(
                                r'src="data:[^"]+;base64,[^"]+"', 
                                f'src="{new_media_url}"', 
                                node_html
                            )
                            
                            # Logs de depuração para entender melhor por que a substituição não está funcionando
                            logger.info(f"HTML original (30 primeiros caracteres): {original_html[:60]}...")
                            logger.info(f"HTML atualizado (30 primeiros caracteres): {updated_html[:60]}...")
                            logger.info(f"URL sendo substituída: {new_media_url}")
                            
                            # Se ainda contém base64, tenta outras abordagens
                            if 'base64' in updated_html:
                                logger.warning(f"base64 ainda está presente no HTML após substituição. Tentando método alternativo.")
                                
                                # Abordagem mais direta com replace
                                try:
                                    # Pega toda a parte de src="data:..."
                                    full_src_pattern = r'src=\\"data:[^"\\]+'
                                    src_match = re.search(full_src_pattern, node_html)
                                    if src_match:
                                        full_src = src_match.group(0)
                                        new_src = f'src=\\"{new_media_url}'
                                        direct_updated_html = node_html.replace(full_src, new_src)
                                        if direct_updated_html != node_html:
                                            updated_html = direct_updated_html
                                            logger.info("Substituição direta de base64 por URL bem-sucedida!")
                                except Exception as e:
                                    logger.error(f"Erro durante substituição direta: {e}")
                                
                                # Tenta outro padrão se ainda não conseguiu substituir
                                if original_html == updated_html or 'base64' in updated_html:
                                    logger.warning(f"Primeira tentativa de substituição base64->URL falhou no nó {node_id}, tentando padrão alternativo")
                                    try:
                                        # Obtém a string original do base64 para substituição direta
                                        base64_match = re.search(r'src=\\"(data:[^"\\]+)\\"', node_html)
                                        if base64_match:
                                            base64_str = base64_match.group(1)
                                            updated_html = node_html.replace(base64_str, new_media_url)
                                            if original_html != updated_html:
                                                logger.info(f"Substituição direta de URL base64 bem-sucedida para nó {node_id}")
                                            else:
                                                logger.error(f"Falha na substituição alternativa de base64->URL para nó {node_id}")
                                    except Exception as e:
                                        logger.error(f"Erro durante substituição alternativa base64->URL: {e}", exc_info=True)
                            
                            # Atualiza o HTML do nó
                            node_data['html'] = updated_html
                            
                            logger.info(f"Base64 do HTML processado para nó {node_id}: URL={new_media_url}, Nome={file_name}")
                            arquivos_processados += 1
                        else:
                            logger.error(f"Falha ao salvar imagem base64 do HTML para nó {node_id}")

                    # Adiciona Lógica para processar Base64 (mediaPreviewUrl)
                    # Verifica APÓS checar deleteMedia e has_uploaded_file
                    base64_preview = node_content_data.get('mediaPreviewUrl')
                    # Generalizado para qualquer tipo de data URI com base64
                    if isinstance(base64_preview, str) and base64_preview.startswith('data:') and ';base64,' in base64_preview:
                        logger.info(f"Encontrado Base64 em mediaPreviewUrl para nó {node_id} durante update")
                        try:
                            header, encoded = base64_preview.split(';base64,', 1)
                            # Extrai o MIME type completo
                            mime_type_match = re.search(r'data:(?P<mime>[a-zA-Z0-9/.-]+);?.*', header)
                            mime_type = mime_type_match.group('mime') if mime_type_match else 'application/octet-stream'

                            # Determina a extensão
                            extension_map = {
                                'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif',
                                'application/pdf': 'pdf',
                                'video/mp4': 'mp4', 'video/quicktime': 'mov',
                                'audio/mpeg': 'mp3', 'audio/ogg': 'ogg',
                            }
                            file_ext = extension_map.get(mime_type, 'bin')

                            data = base64.b64decode(encoded)
                            file_content = ContentFile(data)
                            # Usa o mesmo padrão de nome que adotamos no _extract_base64_from_html
                            base64_filename = f"node_{node_id}_image.{file_ext}"

                            temp_uploaded_file = InMemoryUploadedFile(
                                file=file_content, field_name=None, name=base64_filename,
                                content_type=mime_type, size=len(data), charset=None
                            )

                            # Deleta mídia antiga antes de salvar a nova
                            old_media_url = node_content_data.get('mediaUrl')
                            if old_media_url:
                                deleted = self._delete_flow_media(old_media_url)
                                if deleted:
                                     logger.info(f"Mídia anterior excluída (update via Base64): {old_media_url}")

                            # Salva o arquivo decodificado
                            new_media_url = self._save_uploaded_file(instance, node_id, temp_uploaded_file)
                            if new_media_url:
                                node_content_data['mediaUrl'] = new_media_url
                                node_content_data['mediaFileName'] = base64_filename
                                logger.info(f"Arquivo Base64 (update) salvo para nó {node_id}: {new_media_url}")
                            else:
                                logger.error(f"Falha ao salvar Base64 (update) para nó {node_id} no fluxo {instance.pk}")

                            # Remove o preview Base64 do JSON final
                            node_content_data.pop('mediaPreviewUrl', None)

                        except Exception as e:
                            logger.error(f"Erro ao processar Base64 (update) para nó {node_id}: {e}", exc_info=True)
                            node_content_data.pop('mediaPreviewUrl', None)

                    # Atualiza o 'data' dentro do nó no JSON principal
                    nodes[node_id]['data'] = node_content_data
            
            logger.info(f"Processamento de nós concluído: {nodes_processados} nós processados, {arquivos_processados} arquivos salvos, {exclusoes_processadas} arquivos excluídos")
            # Atualiza o 'data' no flow_json_dict
            flow_json_dict['drawflow']['Home']['data'] = nodes
            
            # Valida e depura URLs de mídia
            self._validate_flow_media_urls(flow_json_dict)
            
            # VALIDAÇÃO FINAL - verifica e limpa qualquer base64 residual em todos os nós
            if isinstance(flow_json_dict, dict):
                nodes = flow_json_dict.get('drawflow', {}).get('Home', {}).get('data', {})
                if isinstance(nodes, dict):
                    for node_id, node_data in nodes.items():
                        node_html = node_data.get('html', '')
                        if 'base64' in node_html:
                            logger.warning(f"EMERGÊNCIA: base64 detectado no nó {node_id} após processamento")
                            # Limpa agressivamente - identifica o base64
                            try:
                                # Extrair a tag img completa - tenta com e sem escape
                                div_match = None
                                
                                # Primeiro tenta sem escape (formato direto)
                                div_pattern = r'<div class="media-preview">.*?</div>'
                                div_match = re.search(div_pattern, node_html, re.DOTALL)
                                
                                # Se não encontrou, tenta com escape (formato JSON)
                                if not div_match:
                                    div_pattern = r'<div class=\\"media-preview\\">.*?</div>'
                                    div_match = re.search(div_pattern, node_html, re.DOTALL)
                                
                                if div_match:
                                    div_tag = div_match.group(0)
                                    # Nó tem mediaUrl?
                                    node_content = node_data.get('data', {})
                                    media_url = node_content.get('mediaUrl')
                                    
                                    if media_url:
                                        # Determina o formato baseado no que foi encontrado
                                        if '"media-preview"' in div_tag:
                                            # Sem escape
                                            new_div = f'<div class="media-preview"><img src="{media_url}" alt="Preview"></div>'
                                        else:
                                            # Com escape
                                            new_div = f'<div class=\\"media-preview\\"><img src=\\"{media_url}\\" alt=\\"Preview\\"></div>'
                                        
                                        new_html = node_html.replace(div_tag, new_div)
                                        node_data['html'] = new_html
                                        logger.info(f"EMERGÊNCIA: substituição total da tag div com mediaUrl aplicada para nó {node_id}")
                                    else:
                                        logger.error(f"EMERGÊNCIA: Nó {node_id} não tem mediaUrl definido para substituição forçada")
                                        
                                        # Última tentativa - remover a base64 completamente se falhar tudo
                                        if '"media-preview"' in div_tag:
                                            # Sem escape
                                            clean_div = '<div class="media-preview"></div>'
                                        else:
                                            # Com escape
                                            clean_div = '<div class=\\"media-preview\\"></div>'
                                        
                                        new_html = node_html.replace(div_tag, clean_div)
                                        node_data['html'] = new_html
                                        logger.info(f"EMERGÊNCIA: removida div com base64 para nó {node_id}")
                                else:
                                    # Se não encontrou a tag div, tenta uma substituição direta
                                    try:
                                        # Busca data URIs com e sem escape
                                        data_uri_pattern = r'src="data:[^"]+"'
                                        data_uri_match = re.search(data_uri_pattern, node_html)
                                        
                                        if data_uri_match:
                                            # Sem escape
                                            data_uri = data_uri_match.group(0)
                                            node_content = node_data.get('data', {})
                                            media_url = node_content.get('mediaUrl')
                                            if media_url:
                                                new_src = f'src="{media_url}"'
                                                new_html = node_html.replace(data_uri, new_src)
                                                node_data['html'] = new_html
                                                logger.info(f"EMERGÊNCIA: substituição direta de src sem escape para nó {node_id}")
                                        else:
                                            # Com escape
                                            data_uri_pattern = r'src=\\"data:[^\\"]+"'
                                            data_uri_match = re.search(data_uri_pattern, node_html)
                                            if data_uri_match:
                                                data_uri = data_uri_match.group(0)
                                                node_content = node_data.get('data', {})
                                                media_url = node_content.get('mediaUrl')
                                                if media_url:
                                                    new_src = f'src=\\"{media_url}\\"'
                                                    new_html = node_html.replace(data_uri, new_src)
                                                    node_data['html'] = new_html
                                                    logger.info(f"EMERGÊNCIA: substituição direta de src com escape para nó {node_id}")
                                    except Exception as e:
                                        logger.error(f"EMERGÊNCIA: erro ao tentar substituição direta: {e}", exc_info=True)
                                    
                                    logger.error(f"EMERGÊNCIA: não foi possível encontrar a div de preview no nó {node_id}")
                            except Exception as e:
                                logger.error(f"EMERGÊNCIA: erro ao limpar base64 residual: {e}", exc_info=True)
                    
                    # Atualiza o flow_json_dict com as mudanças de emergência
                    flow_json_dict['drawflow']['Home']['data'] = nodes
                    logger.info("Validação final de base64 concluída")
            else:
                logger.warning("Impossível executar validação final de base64 - flow_json_dict não é um dicionário")
        else:
             logger.error("Estrutura de nós do Drawflow inválida no JSON recebido durante atualização.")
             # Não atualiza o flow_json se a estrutura estiver inválida
             flow_json_dict = instance.flow_json # Mantém o JSON antigo

        # Atualiza data_copy com o flow_json processado (como string)
        data_copy['flow_json'] = json.dumps(flow_json_dict)

        # Adiciona log para verificar o JSON final antes de enviar ao serializer
        logger.debug(f"flow_json final (string) a ser passado para o serializer: {data_copy['flow_json'][:500]}...")

        # Processa userVariables se veio na requisição
        user_variables_data = data_copy.get('userVariables')
        if user_variables_data:
            try:
                # Adiciona um log para depuração
                logger.info(f"Tipo de userVariables recebido: {type(user_variables_data)}, valor: {str(user_variables_data)[:200]}")
                
                # Se já é uma string, tenta fazer parse
                if isinstance(user_variables_data, str):
                    try:
                        user_variables_list = json.loads(user_variables_data)
                    except json.JSONDecodeError:
                        logger.warning(f"Falha ao fazer parse do JSON string em userVariables: {user_variables_data[:100]}...")
                        raise ValueError("userVariables deve ser um JSON válido.")
                # Se já é um tipo de dados Python (lista/dict), use diretamente
                else:
                    user_variables_list = user_variables_data
                    
                # Verifica se é uma lista, independentemente da origem
                if not isinstance(user_variables_list, list):
                    raise ValueError("userVariables deve ser uma lista.")
                    
                # Salva como string no modelo (que é TextField)
                data_copy['userVariables'] = json.dumps(user_variables_list)
                logger.info(f"userVariables processado e serializado com sucesso")
            except Exception as e:
                logger.warning(f"userVariables inválido recebido para fluxo {instance.pk}: {str(e)}")
                data_copy.pop('userVariables', None)  # Remove do data_copy para não passar ao serializer
        else:
            # Se não veio, remove para não tentar atualizar com None
            data_copy.pop('userVariables', None)

        # Passa data_copy (com flow_json e userVariables processados) para o serializer
        serializer = self.get_serializer(instance, data=data_copy, partial=True)

        # Log antes de validar
        logger.debug(f"Dados enviados para validação do serializer: { {k: v[:100] + '...' if isinstance(v, str) and len(v) > 100 else v for k, v in data_copy.items()} }")

        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        instance.refresh_from_db() # Recarrega a instância com dados salvos

        # --- Integração n8n (após salvar tudo) ---
        try:
            # Garante que flow_json e userVariables sejam dict/list
            flow_json_data_final = instance.flow_json if isinstance(instance.flow_json, dict) else {}
            user_variables_final = instance.userVariables if isinstance(instance.userVariables, list) else []

            n8n_workflow_json = convert_drawflow_to_n8n(flow_json_data_final, user_variables_final)
            if n8n_workflow_json:
                # Atualiza no n8n usando o ID existente
                new_n8n_id = sync_n8n_workflow(n8n_workflow_json, instance.n8n_return_id)
                if new_n8n_id and new_n8n_id != instance.n8n_return_id:
                    logger.info(f"Atualizando n8n_workflow_id para Flow ID {instance.pk} para {new_n8n_id} após atualização.")
                    # Renomeia pasta de mídia se ID mudou
                    try:
                        old_media_dir = os.path.join(settings.MEDIA_ROOT, 'flows', instance.n8n_workflow_id)
                        new_media_dir = os.path.join(settings.MEDIA_ROOT, 'flows', new_n8n_id)
                        if os.path.exists(old_media_dir):
                            os.rename(old_media_dir, new_media_dir)
                            logger.info(f"Diretório de mídia renomeado de {instance.n8n_workflow_id} para {new_n8n_id}.")
                            # Atualiza URLs no JSON salvo
                            current_flow_json = instance.flow_json
                            needs_url_update = False
                            if isinstance(current_flow_json, dict):
                                nodes = current_flow_json.get('drawflow', {}).get('Home', {}).get('data', {})
                                if isinstance(nodes, dict):
                                    old_id_str = instance.n8n_workflow_id
                                    for node_id, node_data in nodes.items():
                                        node_content_data = node_data.get('data', {})
                                        media_url = node_content_data.get('mediaUrl')
                                        if media_url and old_id_str in media_url:
                                            new_media_url = media_url.replace(old_id_str, new_n8n_id)
                                            node_content_data['mediaUrl'] = new_media_url
                                            nodes[node_id]['data'] = node_content_data
                                            needs_url_update = True
                                if needs_url_update:
                                    current_flow_json['drawflow']['Home']['data'] = nodes
                                    instance.flow_json = current_flow_json
                                    instance.n8n_workflow_id = new_n8n_id
                                    instance.save(update_fields=['flow_json', 'n8n_workflow_id'])
                                    logger.info(f"URLs de mídia e ID n8n atualizados no BD para {new_n8n_id}")
                                else: # Se não precisou atualizar URLs, só salva o ID novo
                                    instance.n8n_workflow_id = new_n8n_id
                                    instance.save(update_fields=['n8n_workflow_id'])
                    except OSError as e:
                        logger.error(f"Erro ao renomear diretório de mídia durante atualização do ID n8n de {instance.n8n_workflow_id} para {new_n8n_id}: {e}")
                        instance.n8n_workflow_id = new_n8n_id # Salva o novo ID mesmo assim
                        instance.save(update_fields=['n8n_workflow_id'])
                elif not new_n8n_id:
                    logger.warning(f"Falha ao sincronizar com n8n após atualizar Flow ID {instance.pk}.")
            else:
                logger.error(f"Falha ao converter flow_json para n8n para Flow ID {instance.pk} durante atualização.")

        except Exception as e:
            logger.error(f"Erro inesperado durante a integração n8n para Flow ID {instance.pk} após atualização: {e}", exc_info=True)
        # --- Fim Integração n8n ---

        # Recarrega a instância para garantir que o serializer retorne os dados mais recentes
        instance.refresh_from_db()
        final_serializer = self.get_serializer(instance)
        logger.info(f"Atualização do fluxo {instance.pk} concluída. Retornando dados serializados.")
        return Response(final_serializer.data)

    # delete itens
    def destroy(self, request, pk=None):
        try:
            instance = self.get_object()
            
            # Log para fins de diagnóstico
            logger.info(f"Iniciando exclusão do fluxo com ID {pk}")
            
            # Primeiramente, vamos encontrar e excluir todos os arquivos associados a este fluxo
            flow_files = FlowAttachment.objects.filter(flow=instance)
            
            for file_attachment in flow_files:
                try:
                    # Tenta excluir o arquivo físico
                    if file_attachment.file:
                        file_path = os.path.join(settings.MEDIA_ROOT, file_attachment.file.name)
                        if os.path.exists(file_path):
                            os.remove(file_path)
                            logger.info(f"Arquivo físico excluído: {file_path}")
                        else:
                            logger.warning(f"Arquivo físico não encontrado para exclusão: {file_path}")
                    
                    # Exclui o registro do anexo
                    file_attachment.delete()
                    logger.info(f"Registro de anexo excluído para nó: {file_attachment.node_id}")
                    
                except Exception as e:
                    logger.error(f"Erro ao excluir anexo {file_attachment.id}: {e}", exc_info=True)
            
            # Agora vamos excluir o diretório completo dos arquivos deste fluxo
            try:
                dir_id = instance.n8n_workflow_id if instance.n8n_workflow_id else str(instance.pk)
                flow_media_dir = os.path.join(settings.MEDIA_ROOT, 'flows', dir_id)
                
                if os.path.exists(flow_media_dir) and os.path.isdir(flow_media_dir):
                    import shutil
                    shutil.rmtree(flow_media_dir)
                    logger.info(f"Diretório de mídia do fluxo excluído: {flow_media_dir}")
            except Exception as e:
                logger.error(f"Erro ao excluir diretório de mídia do fluxo: {e}", exc_info=True)
            
            # Exclui o fluxo em si
            response = super().destroy(request, pk)
            logger.info(f"Fluxo {pk} excluído com sucesso")
            
            return response
            
        except Exception as e:
            logger.error(f"Erro ao excluir fluxo {pk}: {e}", exc_info=True)
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    @action(detail=False, methods=['post'], parser_classes=[JSONParser])
    def filtragem_flows(self, request, *args, **kwargs):
        # Acessando os dados enviados na requisição
        data = request.data

        # Extraindo os valores dos dados
        query = data.get('search-flows')
        print("Query", query)


        # Filtrando o queryset com base nos valores recebidos
        try:
            flows = Flows.objects.filter(empresa=request.user.empresa, statusregistro_id=200).order_by('-cadastro_dt')
        except Flows.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)

        if query:
            flows = flows.filter(Q(title__icontains=query)| Q(description__icontains=query))




        # Paginação
        paginator = CustomPagination()
        paginated_queryset = paginator.paginate_queryset(flows, request)

        # Serializando os dados
        serializer = self.get_serializer(paginated_queryset, many=True)


        return paginator.get_paginated_response(serializer.data)

    @action(detail=False, methods=['get'])
    def busca(self, request, *args, **kwargs):
        query = request.query_params.get('query', '')
        queryset = self.filter_queryset(self.get_queryset())
        if query:
            queryset = queryset.filter(empresa = request.user.empresa)
            queryset = queryset.filter(Q(title__icontains=query)| Q(description__icontains=query))
            queryset = queryset.filter(statusregistro_id=200)
        else:
            queryset = queryset.filter(empresa = request.user.empresa, statusregistro_id=200)[:10]

        serializer = self.get_serializer(queryset, many=True)

        data = serializer.data

        return Response(data)

    def _validate_flow_media_urls(self, flow_json_dict):
        """
        Função de diagnóstico para validar que todos os nós de tipo enviar_mensagem têm
        mediaUrl definido corretamente quando o tipo de mensagem é media.
        """
        if not isinstance(flow_json_dict, dict):
            logger.warning("_validate_flow_media_urls: flow_json_dict não é um dicionário")
            return
            
        nodes = flow_json_dict.get('drawflow', {}).get('Home', {}).get('data', {})
        if not isinstance(nodes, dict):
            logger.warning("_validate_flow_media_urls: nodes não é um dicionário")
            return
            
        for node_id, node_data in nodes.items():
            if node_data.get('name') == 'enviar_mensagem':
                node_content = node_data.get('data', {})
                message_type = node_content.get('messageType', '')
                media_url = node_content.get('mediaUrl', '')
                
                # Verifica se é um tipo de mídia e se tem URL
                if message_type in ['image', 'video', 'audio', 'document'] and not media_url:
                    logger.warning(f"Nó {node_id} tem messageType='{message_type}' mas mediaUrl está vazio")
                elif media_url:
                    logger.info(f"Nó {node_id} tem messageType='{message_type}' e mediaUrl='{media_url}'")
                    
        return flow_json_dict