from rest_framework import viewsets
from rest_framework.pagination import PageNumberPagination
from rest_framework import status
from rest_framework.decorators import action
from rest_framework import permissions
import datetime
from django.core.exceptions import ObjectDoesNotExist
from django.conf import settings
import os
from django.db.models.functions import Cast
from django.db.models import Q, FloatField, F, Sum, Avg
from django.contrib.auth import authenticate
from rest_framework.response import Response
from django.http import QueryDict
from datetime import timedelta
from django.utils.timezone import now
import requests
from boomerangue.apps.ger_dadosgerais.models import ger_pais, ger_uf, ger_cidade, ger_condicoespagamento, ger_transportadora, ger_tabelaprecos, ger_vendedores
from boomerangue.apps.msg_messages.models import canais,canais_leads
from boomerangue.apps.atributos.models import BoomerangueAtributo
from boomerangue.apps.campaign.models import bmm_boomerangue
from boomerangue.apps.historico_vendas.models import bmm_historico
from django.core.cache import cache
from functools import reduce
from operator import and_
from boomerangue.apps.ger_entidades.models import ger_entidade, ger_entidade_tag, rvd_entidade_recommendation
from .seriealizers import CreateEntidadeSerializer, CoordinatesSerializer

# create entidade
class CustomPagination(PageNumberPagination):
    page_size = 20  # Número de usuários por página
    page_size_query_param = 'page_size'


def get_coordinates_from_cep(cep):
    print("CEP", cep)
    google_maps_api_key = os.getenv("GOOGLE_MAPS_API_KEY", settings.GOOGLE_MAPS_API_KEY)
    url = f"https://maps.googleapis.com/maps/api/geocode/json?address={cep}&key={google_maps_api_key}"
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        print('DAdos', data)
        if data['results']:
            location = data['results'][0]['geometry']['location']
            return location['lat'], location['lng']

class createEntidadeViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows Campaigns to be viewed, edited or created.
    """
    queryset = ger_entidade.objects.all()
    serializer_class = CreateEntidadeSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = CustomPagination

    def retorna_query(empresa_id):
        queryset = ger_entidade.objects.filter(statusregistro_id=200, empresa=empresa_id).order_by('-cadastro_dt')[:10]
        return queryset
    
    def get_last_8_digits(self,telefone):
        if telefone:
            return telefone[-8:]
        return None
    
    def create(self, request):
        """
        Cria uma nova instância de 'ger_entidade'.
        """
        # Inicializa o serializer com os dados recebidos na requisição (request.data).
        user = self.request.user

        # Agora você pode usar 'user' para obter a empresa do usuário
        empresa_do_usuario = user.empresa  # Certifique-se de adaptar isso à sua lógica de modelo

        request.data['empresa'] = empresa_do_usuario

        print('Dados', request.data)

        if request.data.get('CNPJ'):
            cnpj = request.data['CNPJ']
            try:
                ger_entidade.objects.get(CNPJ=cnpj, empresa=empresa_do_usuario.pk, statusregistro_id = 200)
                return Response({"error": "CNPJ/CPF já Cadastrado!"}, status=status.HTTP_400_BAD_REQUEST)
            except ObjectDoesNotExist:
                pass

        # Verificação e atualização pelo telefone
        telefone = request.data.get('Telefone1')
        if telefone:
            last_8_digits = self.get_last_8_digits(telefone)
            entidade, created = ger_entidade.objects.get_or_create(
                Telefone1__endswith=last_8_digits,
                empresa=empresa_do_usuario.pk,
                statusregistro_id=200,
                defaults=request.data  # Passa os dados da requisição para criação caso não exista
            )

            if not created:
                # Se a entidade já existe, atualizamos os campos
                for field, value in request.data.items():
                    setattr(entidade, field, value)
                entidade.save()

                # Retorna uma resposta com os dados atualizados e status HTTP 200 OK
                serializer = CreateEntidadeSerializer(entidade)
                return Response(serializer.data, status=status.HTTP_200_OK)
        
        if request.data.get('EDI_Integracao'):
            EDI_Integracao = request.data['EDI_Integracao']
            try:
                entidade_id = ger_entidade.objects.get(EDI_Integracao=EDI_Integracao, empresa=empresa_do_usuario.pk, statusregistro_id = 200)
                return Response({"error": "EDI_Integracao já cadastrado!", "id": entidade_id.pk}, status=status.HTTP_202_ACCEPTED)
            except ObjectDoesNotExist:
                pass
        

        serializer = CreateEntidadeSerializer(data=request.data)
        

        # Verifica se o serializer é válido, ou seja, se os dados passaram na validação.
        if serializer.is_valid():
            # Se os dados são válidos, salva a instância no banco de dados.
            serializer.save()
            
            # Retorna os dados serializados da instância criada com o status HTTP 201 Created
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        # Se os dados não são válidos, retorna os erros de validação do serializer
        # com o status HTTP 400 Bad Request.
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    
    # Return data for edit in transportadora-list
    def retrieve(self, request, pk=None):
        try:
            condicao = ger_entidade.objects.get(pk=pk,statusregistro_id = 200)
        except ger_entidade.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)

        serializer = self.get_serializer(condicao)
        if serializer.data['vendedorValidacao']:
            try:
                vendedor = ger_vendedores.objects.get(pk = serializer.data['vendedorValidacao'])
                validacao = vendedor.Vendedor
            except:
                validacao = '-'
        else:
            validacao = '-'

        data = serializer.data
        data['vendedorValidacao'] = validacao

        return Response(data)
    
    # Edit data
    def patch(self, request, pk=None):
        try:
            condicao = ger_entidade.objects.get(pk=pk)
        except ger_entidade.DoesNotExist:
            return Response({"error": "Item not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(condicao, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()

        # Defina deleted_at com a data/hora atual
        instance.exclusao_dt = datetime.datetime.now()
        
        # Defina status como 9000
        instance.statusregistro_id = 9000

        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    def list(self, request, *args, **kwargs):
        query = request.query_params.get('query', '')  # Obtém o parâmetro 'query' da solicitação
        queryset = self.filter_queryset(self.get_queryset())  # Aplica filtros, se houver
        vendedor = request.query_params.get('vendedor', '')
        if query:
            # Filtra os resultados com base na consulta do usuário
            queryset = queryset.filter(empresa= request.user.empresa, Entidade__icontains=query, statusregistro_id=200)

        elif vendedor:
            try:
                queryset = queryset.filter(empresa= request.user.empresa, vendedorValidacao=vendedor, statusregistro_id=200)
            except:
                return Response({'error': 'Não há Leads deste vendedor'}, status=status.HTTP_404_NOT_FOUND)

        else:
            queryset = queryset.filter(empresa= request.user.empresa, statusregistro_id=200).order_by('-cadastro_dt')[:10]

        serializer = self.get_serializer(queryset, many=True)
        data = []
        for item in serializer.data:
            # Obtém o ID do wpptemplate do item
            cidade = item.get('cidade', None)
            uf = item.get('uf', None)
            vendedor = item.get('vendedorValidacao', None)
            if cidade is not None:
                # Tenta obter o objeto wppt_templates usando o ID
                try:
                    cidade = ger_cidade.objects.get(pk=cidade)
                    Cidade = cidade.Cidade
                except cidade.DoesNotExist:
                    Cidade = ''
            else:
                Cidade = ''

            if uf is not None:
                # Tenta obter o objeto wppt_templates usando o ID
                try:
                    uf = ger_uf.objects.get(pk=uf)
                    sigla = uf.sigla
                except uf.DoesNotExist:
                    sigla = '' 
            else:
                sigla = ''

            if  vendedor is not None:
                try:
                    vendedor = ger_vendedores.objects.get(pk=vendedor)
                    validacao = vendedor.Vendedor
                except:
                    validacao = '-'
            else:
                validacao = '-'

            data.append({
                'Entidade': item['Entidade'], 
                'pk': item['id'], 
                'CNPJ': item['CNPJ'],
                'InscricaoEstadual': item['InscricaoEstadual'],
                'cidade': Cidade,
                'uf': sigla,
                'Telefone1': item['Telefone1'],
                'Email_Comercial': item['Email_Comercial'],
                'TelefoneValidacaoWP': item['TelefoneValidacaoWP'],
                'DataValidacaoWP': item['DataValidacaoWP'],
                'DataConfirmacaoWP': item['DataConfirmacaoWP'],
                'vendedorValidacao': validacao
            }) 
        return Response(data)
    




    @action(detail=False, methods=['post'])
    def filtros(self, request, *args, **kwargs):
        """
        Filtra os dados com base nas escolhas do usuário, incluindo cidade, estado e lead.
        Aplica paginação nos resultados.
        """
        try:
            queryset = self.filter_queryset(self.get_queryset())

            dado = request.data
            estado = dado.get('estado')
            cidade = dado.get('cidade')
            lead = dado.get('lead')
            escolhas_do_usuario = dado.get('escolhas', {})
            vendedor_selecionado = dado.get('vendedor')

            # Filtros iniciais
            queryset = queryset.filter(
                empresa=request.user.empresa,
                statusregistro_id=200,
            )

            # Filtros opcionais
            if estado:
                queryset = queryset.filter(uf=estado)
            if cidade:
                queryset = queryset.filter(cidade=cidade)
            if lead:
                queryset = queryset.filter(
                    Q(Entidade__icontains=lead) | 
                    Q(CNPJ__icontains=lead) | 
                    Q(Telefone1__icontains=lead)
                )

            # Filtros baseados nas escolhas
            if escolhas_do_usuario.get('nao_validados'):
                queryset = queryset.filter(DataValidacaoWP__isnull=True)
            if escolhas_do_usuario.get('validando'):
                queryset = queryset.filter(DataValidacaoWP__isnull=False, DataConfirmacaoWP__isnull=True)
            if escolhas_do_usuario.get('validados'):
                queryset = queryset.filter(DataValidacaoWP__isnull=False, DataConfirmacaoWP__isnull=False)


            # Use select_related para otimizar buscas relacionadas
            queryset = queryset.select_related('cidade', 'uf')

            # Paginar antes de processar
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                # Processar tags apenas para os resultados paginados
                entidade_tags = ger_entidade_tag.objects.filter(entidade__in=[data['id'] for data in serializer.data]).values('entidade', 'area', 'regiao', 'tipo')
                tag_map = {tag['entidade']: tag for tag in entidade_tags}

                for data in serializer.data:
                    tag = tag_map.get(data['id'])
                    if tag:
                        data['tag_area'] = tag['area']
                        data['tag_regiao'] = tag['regiao']
                        data['tag_tipo'] = tag['tipo']
                return self.get_paginated_response(serializer.data)

            # Caso não haja paginação
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)

        except Exception as e:
            print(e)
            return Response({'error': str(e)}, status=500)


    # filtros historico de vendas
    @action(detail=False, methods=['get'])
    def busca(self, request, *args, **kwargs):
        query = request.query_params.get('query', '')
        queryset = self.filter_queryset(self.get_queryset())
        print("Query", query)
        if query:
            queryset = queryset.filter(empresa = request.user.empresa)
            queryset = queryset.filter(Q(Entidade__icontains=query) | Q(CNPJ__icontains=query) | Q(Telefone1__icontains=query))
            queryset = queryset.filter(statusregistro_id=200)
        else:
            queryset = queryset.filter(empresa = request.user.empresa,statusregistro_id=200).order_by('-data_aceite_bm')[:25]

        serializer = self.get_serializer(queryset, many=True)

        data = serializer.data
                
        return Response(data)
    
    @action(detail=False, methods=['get'])
    def carregaLeads(self, request, *args, **kwargs):
        """
        Lista de entidades paginadas (20 por vez) para a empresa do usuário logado.
        """
        # Obtendo a empresa do usuário logado
        empresa_usuario = request.user.empresa

        # Obtendo parâmetros de consulta
        grupo_id = request.query_params.get('grupo_id','')
        campanha_id = request.query_params.get('campanha_id','')
        lead_id = request.query_params.get('lead_id','')
        search = request.query_params.get('search','')
        id = request.query_params.get('id','')
        # Filtrando o queryset para a empresa do usuário
        queryset = self.filter_queryset(self.get_queryset().filter(empresa=empresa_usuario, statusregistro_id=200))

        # Filtros adicionais com base nos parâmetros de consulta
        if grupo_id:
            leads_id = canais_leads.objects.filter(canal = grupo_id).values_list('lead')
            queryset = queryset.filter(id__in=leads_id)
        
        if campanha_id and campanha_id != 'undefined':
            queryset = queryset.filter(ultima_campanha_enviada=campanha_id)
        
        if lead_id:
            queryset = queryset.filter(Entidade=lead_id)
        
        if id:
            queryset = queryset.filter(id=id)

        if search:
            queryset = queryset.filter(Q(Entidade__icontains=search) | Q(CNPJ__icontains=search) | Q(Telefone1__icontains=search))

        # Paginação
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        # Caso não haja paginação
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


    @action(detail=False, methods=['post'], permission_classes=[])
    def busca_agendamento_info(self, request):
        empresa = request.data.get('empresa')
        telefone_bm = request.data.get('telefone_bm')
        username = request.data.get('username')
        password = request.data.get('password')
        
        # Autenticar o usuário
        user = authenticate(request, username=username, password=password)
        if user is not None:
            # Usuário autenticado, prosseguir com a operação
            
            # Pegar os últimos 8 dígitos do telefone
            ultimos_8_digitos = telefone_bm[-8:] if len(telefone_bm) >= 8 else telefone_bm

            # Criar a query para filtrar pelos últimos 8 dígitos
            query = Q(empresa=empresa) & (
                Q(Telefone1__endswith=ultimos_8_digitos)
            )

            queryset = self.get_queryset().filter(query).order_by('id').last()

            if not queryset:
                return Response({"error": "Nenhum registro encontrado"}, status=status.HTTP_404_NOT_FOUND)

            serializer = self.get_serializer(queryset)
            data = dict(serializer.data)  # Criar uma cópia mutável dos dados

            boomerangue = bmm_boomerangue.objects.filter(
                empresa=empresa, 
                entidade=queryset.id, 
                campanha=data['ultima_campanha_enviada'], 
                bm_tipo='agendamento'
            ).order_by('id').last()

            if boomerangue:
                data['data_agendamento'] = boomerangue.data_consulta
                data['hora_agendamento'] = boomerangue.hora_consulta
                data['nome_medico'] = boomerangue.nome_medico
                data['boomerangue'] = boomerangue.pk

                atributos = BoomerangueAtributo.objects.filter(boomerangue=boomerangue.pk)
                for atributo in atributos:
                    data[atributo.atributo.nome_atributo] = atributo.valor_atributo
            
            print("Boomerangue", boomerangue.pk)

            return Response(data)
        else:
            # Autenticação falhou
            return Response({"error": "Credenciais inválidas"}, status=status.HTTP_401_UNAUTHORIZED)
        

    @action(detail=False, methods=['get'])
    def list_coordinates(self, request):
        # Construção da chave de cache
        cache_key = f"coordinates_{request.user.empresa.id}_{hash(frozenset(request.query_params.items()))}"
        cached_result = cache.get(cache_key)
        
        if cached_result:
            return Response(cached_result)

        # Extração dos parâmetros
        bounds = request.query_params.get('bounds')
        regiao_id = request.query_params.get('regiao')
        estado_id = request.query_params.get('estado')
        cidade_id = request.query_params.get('cidade')
        query = request.query_params.get('query')
        bairro = request.query_params.get('bairro')
        empresa = request.user.empresa

        # Validação dos bounds
        if bounds:
            try:
                ne_lat, ne_lng, sw_lat, sw_lng = map(float, bounds.split(','))
            except ValueError:
                return Response({"error": "Bounds inválidos."}, status=400)

        # Query base
        entities = ger_entidade.objects.filter(
            CliLatitude__isnull=False,
            CliLongitude__isnull=False,
            empresa=empresa,
            statusregistro_id=200
        )

        # Aplicar filtros
        if bounds:
            entities = entities.filter(
                CliLatitude__lte=ne_lat,
                CliLatitude__gte=sw_lat,
                CliLongitude__lte=ne_lng,
                CliLongitude__gte=sw_lng
            )

        if query:
            entities = entities.filter(
                Q(Entidade__icontains=query) |
                Q(CNPJ__icontains=query) |
                Q(Telefone1__icontains=query)
            )

        if regiao_id:
            entities = entities.filter(uf__regiao=regiao_id)

        if estado_id:
            entities = entities.filter(uf_id=estado_id)
        
        if cidade_id:
            entities = entities.filter(cidade_id=cidade_id)
        
        if bairro:
            entities = entities.filter(Bairro__icontains=bairro)

        # Otimização da query final usando values() e select_related()
        result = entities.select_related('cidade', 'uf').values(
            'id',
            'Entidade',
            'CNPJ',
            'CliLatitude',
            'CliLongitude',
            'Telefone1',
            'Bairro',
            'CEP',
            'Endereco',
            cidade_nome=F('cidade__Cidade'),
            uf_sigla=F('uf__sigla')
        )

        # Converter para lista para serialização
        result_list = list(result)

        # ** Cálculos com base em rvd_entidade_recommendation **
        entidade_ids = entities.values_list('id', flat=True)

        # Vendas e cálculos para cada entidade
        # Média de compras (usando o campo `total_produtos`)
        media_compras = (
            bmm_historico.objects.filter(entidade_id__in=entidade_ids)
            .aggregate(media=Avg('total_produtos'))['media'] or 0
        )

        # Compras por entidade
        compras_por_entidade = bmm_historico.objects.filter(entidade_id__in=entidade_ids).values(
            'entidade_id'
        ).annotate(
            total_compras=Sum('total_produtos'),
            total_sugerido=Sum('total_pedido')  # Substitua `total_pedido` se necessário
        )

        # Mapeia compras por entidade para fácil acesso
        compras_map = {compra['entidade_id']: compra for compra in compras_por_entidade}

        # Atualização dos resultados
        result_list = []
        for entidade in result:
            entidade_id = entidade['id']
            compras = compras_map.get(entidade_id, {})
            total_compras = compras.get('total_compras', 0)
            total_sugerido = compras.get('total_sugerido', 0)

            entidade.update({
                "compra_acima_media": total_compras > media_compras,
                "compra_na_media": total_compras == media_compras,
                "compra_abaixo_media": total_compras < media_compras and total_compras != 0,
                "possui_sugestao_pedidos": total_sugerido > 0,
                "nao_comprou": total_compras == 0
            })
            result_list.append(entidade)

        # Quantidade de clientes selecionados
        total_clientes = entities.count()

        # Potencial de vendas atual (soma do campo `total_produtos`)
        potencial_atual = bmm_historico.objects.filter(
            entidade_id__in=entidade_ids
        ).aggregate(total=Sum('total_produtos'))['total'] or 0

        # Incremento percentual (valor padrão: 8.74%)
        incremento_percentual = float(request.query_params.get('incremento', 8.74))
        sugestao_vendas = float(potencial_atual) * (1 + incremento_percentual / 100)

        # Vendas nos últimos 15, 30, 60, 90 dias (usando o campo `dt_emissao` como referência)

        hoje = now()
        vendas_15_dias = bmm_historico.objects.filter(
            entidade_id__in=entidade_ids,
            dt_emissao__gte=hoje - timedelta(days=15)
        ).aggregate(total=Sum('total_produtos'))['total'] or 0

        vendas_30_dias = bmm_historico.objects.filter(
            entidade_id__in=entidade_ids,
            dt_emissao__gte=hoje - timedelta(days=30)
        ).aggregate(total=Sum('total_produtos'))['total'] or 0

        vendas_60_dias = bmm_historico.objects.filter(
            entidade_id__in=entidade_ids,
            dt_emissao__gte=hoje - timedelta(days=60)
        ).aggregate(total=Sum('total_produtos'))['total'] or 0

        vendas_90_dias = bmm_historico.objects.filter(
            entidade_id__in=entidade_ids,
            dt_emissao__gte=hoje - timedelta(days=90)
        ).aggregate(total=Sum('total_produtos'))['total'] or 0

        # Cache do resultado
        final_result = {
            "clientes": result_list,
            "estatisticas": {
                "quantidade_clientes": total_clientes,
                "potencial_vendas_atual": potencial_atual,
                "sugestao_vendas": sugestao_vendas,
                "vendas_ultimos_periodos": {
                    "quinze_dias": vendas_15_dias,
                    "trinta_dias": vendas_30_dias,
                    "sessenta_dias": vendas_60_dias,
                    "noventa_dias": vendas_90_dias,
                },
            },
        }

        cache.set(cache_key, final_result, timeout=300)

        return Response(final_result)

        


    @action(detail=False, methods=['get'])
    def update_missing_coordinates(self, request):
        """
        Atualiza entidades que possuem CEP, mas não têm latitude ou longitude.
        """
        entities_without_coordinates = ger_entidade.objects.filter(
            Q(CliLatitude__isnull=True) | Q(CliLongitude__isnull=True),
            CEP__isnull=False, empresa = request.user.empresa, statusregistro_id = 200
        )

        updated_entities = []
        for entidade in entities_without_coordinates:
            if entidade.CEP:
                result = get_coordinates_from_cep(entidade.CEP)
                if result:
                    latitude, longitude = result
                    entidade.CliLatitude = latitude
                    entidade.CliLongitude = longitude
                    entidade.save()
                    updated_entities.append(entidade.pk)
                else:
                    # Log ou tratamento de erro caso o CEP não retorne coordenadas
                    print(f"Coordenadas não encontradas para o CEP: {entidade.CEP}")

        return Response({
            "message": "Coordenadas atualizadas para as entidades com CEP.",
            "updated_entities": updated_entities,
            "count": len(updated_entities)
        })
