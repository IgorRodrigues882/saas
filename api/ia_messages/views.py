from rest_framework import viewsets
from django.db import connections
from rest_framework.response import Response
from rest_framework import status
from django.db import models
from django.apps import apps
from rest_framework import permissions
from boomerangue.apps.ia_messages.models import ChatMessageIA, CanalMessageIA
from .seriealizers import ChatMessageSerializer, CanalMessageSerializer
from rest_framework.decorators import action
from boomerangue.settings import OPEN_IA_GPT_API_KEY, DATABASES
import openai
import json
from rest_framework.pagination import PageNumberPagination

class CustomPagination(PageNumberPagination):
    page_size = 10  # Número de itens por página
    page_size_query_param = 'page_size'
    max_page_size = 100


# Configuração da chave da API OpenAI
openai.api_key = OPEN_IA_GPT_API_KEY

def execute_sql(query, db_params):
    """
    Executa uma consulta SQL no banco de dados especificado e retorna os resultados.
    """
    print("sem formatar",query, db_params)
    print("formatado", query.strip("`sql").strip())
    with connections['default'].cursor() as cursor:
        cursor.db.settings_dict.update(db_params)
        try:
            cursor.execute(query)
            if cursor.description:
                result = cursor.fetchall()
            else:
                result = []
        except Exception as e:
            result = f"Erro na execução da consulta: {str(e)}"
    return result

def generate_sql(query, schema_description, empresa_id):
    """
    Gera uma consulta SQL baseada na pergunta do usuário, na descrição das tabelas e no contexto da empresa.
    """
    prompt = f"""
    Você é um assistente SQL. Baseado na seguinte descrição das tabelas, gere a consulta SQL correta para responder à pergunta do usuário.
    Certifique-se de que todas as consultas retornem apenas dados relacionados à empresa_id com ID = {empresa_id}.

    Analise as tabelas e colunas abaixo e faça uma consulta SQL corretamente para responder a questão do usuário. Analise corretamente a pergunta do usuário e ache as tabelas correspondentes.
    Lembre-se que estou usando o django e as tabelas estão no formato models do django, logo no SQL os campos vinculados ficam assim: entidade = entidade_id, empresa = empresa_id e etc... Verifique se a tabela realmente possui um campo vinculado com a outra antes de fazer.
    Os campos vinculados em outras tabelas, só podem receber valores inteiros, no caso o id da foreignkey.

    EXTREMAMENTE IMPORTANTE:
        - `entidade`: Refere-se a qualquer tipo de entidade no sistema. Isso inclui:
            - Clientes: Entidades que compraram ou consomem produtos/serviços.
            - Leads: Entidades em potencial para conversão.
            - Doadores: Entidades que realizam doações.
            - Use a tabela ger_entidade para qualquer das palavras acima, não use rvd_entidade ou rvd_entidade_feedback.
        
        - `cidade`: É um campo que recebe uma foreign key do id da cidade, não o nome dela.
        - `Produtos`: O vínculo entre produtos e boomerangues é feito na tabela bmm_boomerangueitens, não existe produtos na tabela bmm_boomerangue.
        - `Vendas`: As compras são registradas na tabela bmm_historico.
        - `CNPJ`: Sempre comparar cnpj com o campo CNPJNumerico na tabela ger_entidade sempre com somente numeros.

    ### Tabelas e Colunas:
    {schema_description}

    Pergunta: {query}

    Por favor, forneça apenas a consulta SQL, sem aspas, sem formatação adicional, apenas a consulta SQL pura e simples.
    """
    
    response = openai.ChatCompletion.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "Você é um assistente que ajuda com dados de um banco de dados SQL."},
            {"role": "user", "content": prompt},
        ],
        max_tokens=1000,
        temperature=0,
    )
    return response.choices[0].message.content.strip()

def validate_sql_query(query, schema_description):
    """
    Valida a consulta SQL gerada contra o schema conhecido
    """
    # Verificações de segurança
    forbidden_keywords = ['DROP', 'DELETE', 'TRUNCATE', '--']
    for keyword in forbidden_keywords:
        if keyword.upper() in query.upper():
            return False, "Consulta contém palavra-chave não permitida"
    
    # Verifica se usa apenas tabelas conhecidas
    known_tables = [model._meta.db_table for model in apps.get_models()]
    for table in known_tables:
        if table in query:
            return True, "Consulta válida"
    
    return False, "Nenhuma tabela conhecida encontrada na consulta"

def format_result(query, sql_result):
    """
    Gera uma resposta amigável baseada na pergunta do usuário e nos resultados da consulta SQL.
    """
    result_str = json.dumps(sql_result, default=str, indent=2)
    prompt = f"""
    Você é um assistente que fornece respostas amigáveis com base em dados SQL. Abaixo está o resultado de uma consulta SQL baseada na pergunta do usuário.

    Pergunta: {query}
    Resultados da consulta:
    {result_str}

    Formate a resposta de forma clara e amigável para o usuário, explicando os resultados.
    """
    
    response = openai.ChatCompletion.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "Você é um assistente que formata respostas com base em dados SQL."},
            {"role": "user", "content": prompt},
        ],
        max_tokens=1000,
        temperature=0.1,
    )
    return response.choices[0].message.content.strip()


def generate_enhanced_schema():
    schema_description = "### Descrição Detalhada do Banco de Dados\n\n"
    for model in apps.get_models():
        # Filtrar modelos relevantes para evitar inclusão de modelos de sistema
        if not model._meta.app_label.startswith('django') and not model._meta.app_label.startswith('rest_framework'):
            table_name = model._meta.db_table
            schema_description += f"## Tabela: {table_name}\n"
            
            # Adicionar descrição mais específica e contexto de negócio
            schema_description += f"Descrição de Negócio: {model.__doc__ or 'Modelo de dados de negócio'}\n\n"
            
            schema_description += "### Campos Principais:\n"
            for field in model._meta.fields:
                # Adicionar mais contexto sobre o significado do campo
                description = getattr(field, 'help_text', 'Sem descrição específica')
                field_type = field.get_internal_type()
                
                schema_description += (
                    f"- **{field.name}** ({field_type}): {description}\n"
                    f"  - Pode ser nulo: {field.null}\n"
                    f"  - Único: {field.unique}\n\n"
                )
                # Destaque especial para campos de relacionamento
                if isinstance(field, models.ForeignKey):
                    schema_description += (
                        f"- **{field.name}** (ForeignKey):\n"
                        f"  - Relacionado com: {field.related_model._meta.object_name}\n"
                        f"  - Tabela de Referência: {field.related_model._meta.db_table}\n"
                        f"  - Sempre usar como '{field.name}_id'\n\n"
                    )
            
            
            schema_description += "\n---\n"
    
    return schema_description




class SendMessageAPIView(viewsets.ModelViewSet):
    queryset = ChatMessageIA.objects.all()
    serializer_class = ChatMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    
    def create(self, request, *args, **kwargs):
        user_message = request.data.get("message")
        id = request.data.get("id")
        schema_description = generate_enhanced_schema()  # Ajustar conforme o seu esquema
        print(schema_description)
        empresa_id = request.user.empresa.id  # Obtém o ID da empresa do usuário logado

        if id:
            canal = CanalMessageIA.objects.get(id=id)
        else:
            canal = CanalMessageIA.objects.create(empresa=request.user.empresa, user=request.user)

        # Armazena a mensagem do usuário
        chat = ChatMessageIA.objects.create(sender="user", message=user_message, user=request.user, canal=canal)


        try:
            sql_query = generate_sql(user_message, schema_description, empresa_id)
            is_valid, validation_message = validate_sql_query(sql_query, schema_description)
            
            if not is_valid:
                bot_response = f"Não foi possível gerar uma consulta válida: {validation_message}"
            else:
                db_params = {
                    'HOST': 'db25.plugdesk.com.br',
                    # 'PORT': 'sua_porta',
                    'USER': 'bmm_normal',
                    'PASSWORD': 'BRAG2faut9slom*herd',
                    'NAME': 'boomeranguev4',
                }
                sql_query = sql_query.strip("`sql").strip()
                sql_result = execute_sql(sql_query, db_params)
                bot_response = format_result(user_message, sql_result)
        except Exception as e:
            bot_response = f"Erro no processamento: {str(e)}"


        # Armazena a resposta do bot
        ChatMessageIA.objects.create(sender="bot", message=bot_response, user=request.user, canal=canal)

        return Response({"response": bot_response}, status=status.HTTP_200_OK)

class ChatHistoryAPIView(viewsets.ModelViewSet):
    queryset = CanalMessageIA.objects.all()
    serializer_class = CanalMessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = CustomPagination

    def list(self, request, *args, **kwargs):
        queryset = CanalMessageIA.objects.filter(user=request.user).order_by('-id')  # Ordenar do mais recente para o mais antigo
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            for data in serializer.data:
                if ChatMessageIA.objects.filter(canal=data['id']).exists():
                    message = ChatMessageIA.objects.filter(canal=data['id']).order_by('-id').first()
                    data['last_message'] = message.message
                    data['data_hora'] = message.timestamp
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        canal = CanalMessageIA.objects.get(id=pk, user=request.user)
        messages = ChatMessageIA.objects.filter(canal=canal).order_by('-id')  # Ordenar por horário decrescente
        page = self.paginate_queryset(messages)
        if page is not None:
            serializer = ChatMessageSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data)