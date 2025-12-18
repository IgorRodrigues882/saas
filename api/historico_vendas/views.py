from rest_framework import viewsets
from rest_framework import permissions
from rest_framework import status
from decimal import Decimal
import datetime
from django.db.models import Avg, Count, Sum, F, ExpressionWrapper, FloatField
from datetime import timedelta
from django.utils.timezone import now
from rest_framework.response import Response
from django.db.models.functions import TruncMonth
from rest_framework.decorators import action
from boomerangue.apps.historico_vendas.models import historico_vendasimportado, bmm_historico
from boomerangue.apps.ger_empresas.models import ger_condicoespagamento
from boomerangue.apps.ger_produtos.models import ger_produtos
from boomerangue.apps.ger_entidades.models import ger_entidade, rvd_entidade_recommendation
from boomerangue.apps.wpp_templates.models import gpt_engine, ia_geracao
from .seriealizers import historico_vendasSerializer, historico_vendas
from boomerangue.apps.ger_dadosgerais.models import ger_vendedores
from boomerangue.apps.ger_empresas.models import ger_empresas
from boomerangue.apps.bot.models import Bot
from django.contrib.auth import authenticate
import openai
import requests
from api.campaign.views import CampaignViewSet
from celery import shared_task
from django.conf import settings
import re
from rest_framework.pagination import PageNumberPagination
from math import radians, sin, cos, sqrt, atan2

class historico_vendas_importViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows wpp templates to be viewed, edited or created.
    """

    queryset = historico_vendasimportado.objects.all()
    serializer_class = historico_vendasSerializer
    permission_classes = [permissions.IsAuthenticated]

    def retorna_query():
        queryset = historico_vendasimportado.objects.all()
        return queryset
    

    def create(self, request, *args, **kwargs):
        # Verifica se há arquivos no pedido
        if not request.FILES:
            return Response({"error": "Nenhum arquivo enviado."}, status=status.HTTP_400_BAD_REQUEST)
        
        statusarquivo_id = request.data.get('statusarquivo_id')

        for index, file in enumerate(request.FILES.values()):
            try:
                # Acessa o Caminho e o NomeArquivo correspondentes
                caminho = request.data.get(f'Caminho_{index}')
                nome_arquivo = request.data.get(f'NomeArquivo_{index}')

                # Cria um novo registro no modelo com o arquivo CSV
                historico_vendasimportado.objects.create(
                    empresa=request.user.empresa,
                    statusarquivo_id=statusarquivo_id,
                    Caminho=caminho,
                    NomeArquivo = nome_arquivo
                    # outros campos conforme necessário
                )
            except Exception as e:
                # Tratamento de exceções genérico, ajuste conforme necessário
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
            

        return Response({"status": "Arquivos importados com sucesso!"}, status=status.HTTP_201_CREATED)


    # Return data for edit in transportadora-list
    def retrieve(self, request, pk=None):
        try:
            condicao = historico_vendasimportado.objects.get(pk=pk)
        except historico_vendasimportado.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)

        serializer = self.get_serializer(condicao)
        return Response(serializer.data)
    
    # Edit data
    def patch(self, request, pk=None):
        try:
            condicao = historico_vendasimportado.objects.get(pk=pk)
        except historico_vendasimportado.DoesNotExist:
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


class HistoricoPagination(PageNumberPagination):
    page_size = 10  # Número de itens por página
    page_size_query_param = 'page_size'  # Permite o cliente alterar o tamanho da página
    max_page_size = 100  # Tamanho máximo permitido por página

class historico_vendas_viewset(viewsets.ModelViewSet):
    """
    API endpoint that allows wpp templates to be viewed, edited or created.
    """

    queryset = bmm_historico.objects.all()
    serializer_class =historico_vendas
    permission_classes = [permissions.IsAuthenticated]

    def retorna_query():
        queryset = bmm_historico.objects.all()
        return queryset
    

    def create(self, request, *args, **kwargs):
        empresa = request.user.empresa
        integracao = request.data.get('user_cod')
        cod_material = request.data.get('cod_material')
        qtd_venda = request.data.get('qtd_venda')
        valor = request.data.get('valor')
        data = request.data.get('data')
        canal = request.data.get('canal')
        rep = request.data.get('rep')

        # Validação dos campos obrigatórios
        # if not all([integracao, cod_material, qtd_venda, valor, data]):
        #     return Response(
        #         {'erro': 'Campos obrigatórios faltando'},
        #         status=status.HTTP_400_BAD_REQUEST
        #     )

        try:
            cliente = ger_entidade.objects.get(EDI_Integracao=integracao)
        except ger_entidade.DoesNotExist:
            return Response(
                {'erro': f"Entidade não existe: {integracao}"}, 
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            produto = ger_produtos.objects.get(edi_integracao=cod_material)
        except ger_produtos.DoesNotExist:
            return Response(
                {'erro': f"Produto não existe: {cod_material}"}, 
                status=status.HTTP_404_NOT_FOUND
            )


        try:
            condicao = ger_condicoespagamento.objects.filter(empresa = empresa, statusregistro_id=200).last()
        except ger_condicoespagamento.DoesNotExist:
            return Response(
                {'erro': f"Condição não existe: {cod_material}"}, 
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            historico = {
                "empresa": empresa.id,
                "total_produtos": Decimal(str(qtd_venda)),
                "entidade": cliente.id,
                'total_pedido': Decimal(str(valor)),
                'total_nota': Decimal(str(valor)),  # Assumindo mesmo valor
                'dt_emissao': data,
                'dt_saida':data,
                'edi_condpgto':'-',
                'cond_pgto': '-',
                'canal_vendas': canal,
                "Representante": rep,
                'produto': produto.id,
                'nronotas': 1,  # Campo obrigatório
                'total_desconto': 0,  # Campo obrigatório
                'tipo_historico': 'VENDA',  # Assumindo que são vendas
                'nfe':'Null',
                'pedido': cliente.id,
                'tipovenda':'venda',
                'autonumerador':1,
                'condicoespagamento': condicao.pk
            }

            serializer = self.get_serializer(data=historico)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response(
                {'erro': f"Erro ao processar: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    # Return data for edit in transportadora-list
    def retrieve(self, request, pk=None):
        try:
            condicao = historico_vendasimportado.objects.get(pk=pk)
        except historico_vendasimportado.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)

        serializer = self.get_serializer(condicao)
        return Response(serializer.data)
    
    # Edit data
    def patch(self, request, pk=None):
        try:
            condicao = historico_vendasimportado.objects.get(pk=pk)
        except historico_vendasimportado.DoesNotExist:
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
    

    def calcular_frequencia_compras(self,historicos):
        # Obtém o período total de compras
        if not historicos.exists():
            return "Sem Histórico"
        
        # Obtém a primeira e a última compra
        primeira_compra = historicos.earliest('dt_emissao').dt_emissao
        ultima_compra = historicos.latest('dt_emissao').dt_emissao
        
        # Calcula o período total de compras em dias
        periodo_total_dias = (ultima_compra - primeira_compra).days
        
        # Conta o número total de compras
        total_compras = historicos.count()
        
        # Intervalos de compras nos últimos períodos
        compras_ultimos_12_meses = historicos.filter(dt_emissao__gte=now() - timedelta(days=365)).count()
        compras_ultimos_6_meses = historicos.filter(dt_emissao__gte=now() - timedelta(days=180)).count()
        compras_ultimos_3_meses = historicos.filter(dt_emissao__gte=now() - timedelta(days=90)).count()
        
        # Lógica para determinar a frequência
        if total_compras == 0:
            return "Sem Compras"
        
        # Cálculo de compras por período
        compras_por_ano = compras_ultimos_12_meses
        compras_por_semestre = compras_ultimos_6_meses
        compras_por_trimestre = compras_ultimos_3_meses
        
        # Classificação da frequência
        if compras_por_ano >= 10:
            frequencia = "Anual"
            media_compras_por_periodo = "Alto Volume"
        elif compras_por_ano >= 6:
            frequencia = "Semestral"
            media_compras_por_periodo = "Médio Volume"
        elif compras_por_ano >= 3:
            frequencia = "Trimestral"
            media_compras_por_periodo = "Baixo Volume"
        else:
            frequencia = "Irregular"
            media_compras_por_periodo = "Muito Baixo"
        
        # Informações adicionais
        detalhes_frequencia = {
            "frequencia": frequencia,
            "volume_compras": media_compras_por_periodo,
            "total_compras_ano": compras_por_ano,
            "total_compras_semestre": compras_por_semestre,
            "total_compras_trimestre": compras_por_trimestre,
            "periodo_total_dias": periodo_total_dias
        }
        
        return detalhes_frequencia
    
    def calcular_potencial_cliente(self,historicos):
        # Total gasto
        total_gasto = historicos.aggregate(total=Sum('total_nota'))['total'] or 0
        total_compras = historicos.count()
        
        # Cálculo do ticket médio
        ticket_medio = total_gasto / total_compras if total_compras > 0 else 0

        # Classificação do potencial do cliente
        if total_gasto > 100000:  # Limite para Alto
            potencial_cliente = "Alto"
        elif total_gasto > 50000:  # Limite para Moderado
            potencial_cliente = "Moderado"
        else:  # Baixo
            potencial_cliente = "Baixo"

        return {
            "total_gasto": total_gasto,
            "ticket_medio": ticket_medio,
            "potencial_cliente": potencial_cliente
        }

    @action(detail=True, methods=['get'])
    def busca_sugestao(self, request, pk=None):
        entidade_id = pk
        entidade = ger_entidade.objects.get(id=entidade_id)
        historicos = bmm_historico.objects.filter(entidade_id=entidade_id)

        # Chamada da função de frequência
        frequencia_compras = self.calcular_frequencia_compras(historicos)

        # Chamada da função de potencial do cliente
        potencial_cliente_info = self.calcular_potencial_cliente(historicos)
        # Cálculos básicos
        total_compras = historicos.count()

        # Métricas avançadas
        dias_ultima_compra = (
            now() - historicos.latest('dt_emissao').dt_emissao
        ).days if historicos.exists() else None

        # Produtos recorrentes
        produtos_recorrentes = historicos.values('produto__Descricao', 'produto__id').annotate(
            qtd=Count('produto__id'),
            total=Sum('total_nota'),
            total_prod=Sum('total_produtos'),
            valor_unitario=ExpressionWrapper(
                F('total') / F('total_prod'),  # Total dos produtos dividido pela quantidade
                output_field=FloatField()   # Garante que o resultado seja um float
            )
        ).filter(qtd__gte=3).order_by('-total_prod')

        # Potencial da região
        try:
            regiao = historicos.first().entidade.uf.regiao
        except:
            regiao = None
        if regiao:
            total_vendas_regiao = bmm_historico.objects.filter(entidade__uf__regiao=regiao).aggregate(total=Sum('total_nota'))['total'] or 0
            num_entidades_regiao = bmm_historico.objects.filter(entidade__uf__regiao=regiao).values('entidade_id').distinct().count()
            potencial_regiao = total_vendas_regiao / num_entidades_regiao if num_entidades_regiao > 0 else 0
        else:
            potencial_regiao = None
        
        # Total dos últimos 3 meses
        ultimo_mes = now().month
        ultimo_ano = now().year
        historico_ultimo_trimestre = historicos.annotate(mes=TruncMonth('dt_emissao')).filter(
            dt_emissao__gte=now() - timedelta(days=90)
        ).values('mes').annotate(total_mes=Sum('total_nota')).order_by('mes')

        # Calcula o percentual de crescimento
        if historico_ultimo_trimestre.count() >= 2:
            mes_atual = historico_ultimo_trimestre.last()['total_mes'] or 0
            mes_passado = historico_ultimo_trimestre.first()['total_mes'] or 0
            tendencia_crescimento = ((mes_atual - mes_passado) / mes_passado * 100) if mes_passado > 0 else 0
        else:
            tendencia_crescimento = None

        produtos_sugeridos_queryset = rvd_entidade_recommendation.objects.filter(entidade=entidade_id).values_list(
            'produto__Descricao', 'produto__EAN', 'produto__Codigo', 'produto__QuantidadePorCaixa', 'produto__LinhaProduto__LinhaProdutos'
        )

        # Converte o queryset em uma lista de dicionários
        produtos_sugeridos = [
            {
                "descricao": produto[0],
                "ean": produto[1],
                "codigo": produto[2],
                "quantidade_por_caixa": produto[3],
                "linha_produto": produto[4]
            }
            for produto in produtos_sugeridos_queryset
        ]

            # Verifique se `frequencia_compras` é um dicionário
        if isinstance(frequencia_compras, dict):
            frequencia = frequencia_compras.get('frequencia', 'Indefinido')
        else:
            frequencia = frequencia_compras  # Aqui será "Sem Histórico" ou "Sem Compras"
        # Montando o JSON final
        response_data = {
            "cliente": {
                "id": entidade_id,
                "nome": entidade.Entidade,
                "categoria": historicos.first().entidade.Entidade if historicos.exists() else "N/A",
                "porte": "Grande" if historicos.exists() else "N/A",  # Exemplo de porte, ajuste conforme necessidade
                "periodo_compras": "Últimos 12 meses",  # Você pode calcular o período real
                "cnpj": entidade.CNPJNumerico,
            },
            "estatisticas": {
                "potencial_regiao": potencial_regiao or 0.00,  # Exemplo, substitua com um cálculo real
                "potencial_cliente": potencial_cliente_info['potencial_cliente'],  # Inclui potencial do cliente
            },
            "metricas": {
                "total_compras": total_compras or 0.00,
                "frequencia": frequencia,  # Exemplo, calcule com base nos dados
                "ticket_medio": potencial_cliente_info['ticket_medio'] or 0.00,  # Inclui ticket médio
                "total_gasto": potencial_cliente_info['total_gasto'] or 0.00,  # Inclui total gasto
            },
            "metricas_avancadas": {
                "tendencia_crescimento": f"{tendencia_crescimento:.2f}%" if tendencia_crescimento is not None else "N/A",
                "dias_desde_ultima_compra": dias_ultima_compra,
            },
            "produtos_sugeridos": produtos_sugeridos,
            "produtos": [
                {
                    "nome": prod['produto__Descricao'],
                    "score": "Alto",  # Exemplo, adicione lógica para calcular o score
                    "quantidade": prod['total_prod'],
                    "valor_unitario": prod['valor_unitario'],  # Exemplo, calcule o valor unitário com base nos dados
                    "total": prod['total'],
                    "recorrente": prod['qtd'] >= 3,
                }
                for prod in produtos_recorrentes
            ],
        }

        return Response(response_data)
    

    @action(detail=False, methods=['post'])
    def ia_analise(self, request, dados_ia=None, empresa_id=None):
        print("entrou função analise")
        # Verificar se o prompt está configurado para a empresa
        if dados_ia:
            empresa = ger_empresas.objects.get(id = empresa_id)
            print("dados ia", dados_ia)
            data = dados_ia
        else:
            print("request")
            empresa = request.user.empresa
            data = request.data

        prompt_template = empresa.prompt_IA_mapa
        if not prompt_template:
            return Response(
                {'error': "Não há prompt específico para essa empresa!"},
                status=status.HTTP_404_NOT_FOUND
            )

        if not empresa.modelo_ia:
            return Response(
                {'error': "Não há modelo IA específico para essa empresa!"},
                status=status.HTTP_404_NOT_FOUND
            )
        else:
            modelo_ia = gpt_engine.objects.get(id=empresa.modelo_ia)

        # Obter a entidade atual
        # Obter a entidade atual
        entidade_atual = ger_entidade.objects.get(id=data.get('id_cliente'))

        if not entidade_atual or not entidade_atual.uf.regiao:
            return Response({'error': "Entidade ou região associada não encontrada."}, status=status.HTTP_400_BAD_REQUEST)

        # Função para calcular a distância geográfica
        def calcular_distancia(lat1, lon1, lat2, lon2):
            R = 6371.0  # Raio da Terra em km
            
            # Verificar se as variáveis lat1, lon1, lat2, lon2 são None
            if None in [lat1, lon1, lat2, lon2]:
                raise ValueError("Uma ou mais coordenadas de latitude ou longitude são None")

            # Garantir que as variáveis sejam floats
            lat1, lon1, lat2, lon2 = map(lambda x: float(x), [lat1, lon1, lat2, lon2])
            
            # Convertendo para radianos
            lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
            
            dlat = lat2 - lat1
            dlon = lon2 - lon1
            a = sin(dlat / 2)**2 + cos(lat1) * cos(lat2) * sin(dlon / 2)**2
            c = 2 * atan2(sqrt(a), sqrt(1 - a))
            return R * c

        # Buscar os 5 clientes mais próximos da entidade atual
        clientes_proximos = ger_entidade.objects.filter(
            uf__regiao=entidade_atual.uf.regiao, CliLatitude__isnull=False, CliLongitude__isnull=False
        ).exclude(id=entidade_atual.id)

        # Ordenar clientes por distância
        clientes_ordenados = sorted(
            clientes_proximos,
            key=lambda cliente: calcular_distancia(
                entidade_atual.CliLatitude, entidade_atual.CliLongitude,
                cliente.CliLatitude, cliente.CliLongitude
            )
        )[:5]

        # Buscar as últimas 5 notas de cada cliente
        historico_final = []
        for cliente in clientes_ordenados:
            historicos_cliente = bmm_historico.objects.filter(
                entidade=cliente
            ).order_by('-dt_emissao')[:5]

            # Agrupar por NFe
            historico_data = {}
            for historico in historicos_cliente:
                nfe_id = historico.nfe

                if nfe_id not in historico_data:
                    historico_data[nfe_id] = {
                        "nfe": nfe_id or '',
                        "pedido": historico.pedido or '',
                        "dt_emissao": historico.dt_emissao.strftime('%Y-%m-%d %H:%M:%S') if historico.dt_emissao else None,
                        "total_nota": 0.0,
                        "total_produtos": 0.0,
                        "produtos": []
                    }

                historico_data[nfe_id]["total_nota"] += float(historico.total_nota)
                historico_data[nfe_id]["total_produtos"] += float(historico.total_produtos or 1) if historico.produto else 0

                if historico.produto:
                    historico_data[nfe_id]['produtos'].append({
                        "produto_id": historico.produto.id,
                        "descricao": historico.produto.Descricao or '',
                        "quantidade": float(historico.total_produtos or 1),
                        "total": float(historico.produto.saldo or 0),
                        "unitario_calculado": float(historico.total_nota) / float(historico.total_produtos or 1),
                        "sku": historico.produto.SKU or '',
                    })

            historico_final.append({
                "cliente": cliente.Entidade,
                "historicos": list(historico_data.values())
            })

        # Formatar para o prompt
        historico_formatado = "\n\n".join([
            f"Cliente: {item['cliente']}\n" +
            "\n".join([
                f"NFe: {hist['nfe']}, Data: {hist['dt_emissao']}, Total: R$ {hist['total_nota']}\n" +
                "\n".join([
                    f" Produto - {prod['descricao']}, Quantidade: {prod['quantidade']}, Valor Unitário: R$ {prod['unitario_calculado']}"
                    for prod in hist['produtos']
                ])
                for hist in item['historicos']
            ])
            for item in historico_final
        ])


            # Receber os dados enviados pelo fetch
        historico_vendas = data.get('historico_vendas', [])

            # Formatar o histórico de vendas em uma string
        if historico_vendas != []:
                historico_formatado = "\n".join([
                    f"Data: {item['dt_emissao']}, NFe: {item['nfe']}, Total: R$ {item['total_nota']}\n"
                    f"Produtos:\n" +
                    "\n".join([
                        f"  - {produto['descricao']}, Quantidade: {produto['quantidade']}, Valor Unitário: R$ {produto['unitario_calculado']}"
                        for produto in item.get('produtos', [])
                    ])
                    for item in historico_vendas
                ])

            # Substituir os placeholders no prompt pelo valor correspondente
        try:
                formatted_prompt = prompt_template
                for key, value in data.items():
                    placeholder = f"{{{key}}}"
                    if key == "historico_vendas" and historico_vendas:
                        formatted_prompt = formatted_prompt.replace(placeholder, historico_formatado)
                    else:
                        formatted_prompt = formatted_prompt.replace(placeholder, str(value))
                    if key == 'vendas_regiao' and historico_final:
                        formatted_prompt = formatted_prompt.replace(placeholder, historico_final)
                
                

                # Substituir o placeholder {Sugestao_vendas}
        except Exception as e:
                return Response(
                    {'error': f"Erro ao formatar o prompt: {str(e)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Configurar a API da OpenAI
        openai.api_key = settings.OPEN_IA_GPT_API_KEY

            # Chamada para a OpenAI API
        try:
                response = openai.ChatCompletion.create(
                    model=modelo_ia.gpt_engine,
                    messages=[
                        {"role": "user", "content": formatted_prompt}
                    ],
                    max_tokens=empresa.max_tokens_ia,
                )
                ia_response = response.choices[0].message['content'].strip()
                tokens = response.usage['total_tokens']
                ia_geracao.objects.create(
                    empresa=empresa,
                    prompt_text_produto='',
                    prompt_publico_alvo='',
                    prompt_descricao=formatted_prompt,
                    criatividade=None,
                    tomvoz=None,
                    text_gerado_ia=ia_response,
                    tokens_usados=tokens
                )

                # Retornar a resposta gerada
                return Response({'result': ia_response}, status=status.HTTP_200_OK)
        except openai.error.OpenAIError as e:
                return Response(
                    {'error': f"Erro ao se comunicar com a IA: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

    @action(detail=True, methods=['get'])
    def detalhes(self, request, pk):
        # Obtem o historico de vendas do cliente, ordenado pela data mais recente
        historicos = bmm_historico.objects.filter(entidade_id=pk).order_by('-dt_emissao')

        # Prefetch dos produtos para otimizar as consultas
        historicos = historicos.select_related('produto')

        # Consolidar os produtos por NFE no historico
        historico_data = {}

        for historico in historicos:
            nfe_id = historico.nfe  # Identificar a NFE ao qual o historico pertence

            # Verifica se a NFE ja foi adicionada ao resultado
            if nfe_id not in historico_data:
                historico_data[nfe_id] = {
                    "nfe": nfe_id or '',
                    "pedido": historico.pedido or '',
                    "dt_emissao": historico.dt_emissao.strftime('%Y-%m-%d %H:%M:%S') if historico.dt_emissao else None,
                    "total_nota": 0.0,  # Inicializa o total das notas
                    "total_produtos": 0.0,  # Inicializa o total de produtos
                    "produtos": [],
                    "entidade": historico.entidade.Entidade,
                    "regiao": historico.entidade.uf.regiao.Regiao
                }

            # Atualiza os totais para a NFE correspondente
            historico_data[nfe_id]["total_nota"] += float(historico.total_nota)
            historico_data[nfe_id]["total_produtos"] += float(historico.total_produtos or 1) if historico.produto else 0

            # Adiciona o produto ao NFE correspondente
            if historico.produto:
                historico_data[nfe_id]['produtos'].append({
                    "produto_id": historico.produto.id,
                    "descricao": historico.produto.Descricao or '',
                    "quantidade": float(historico.total_produtos or 1),
                    "total": float(historico.produto.saldo or 0),
                    "unitario_calculado": float(historico.total_nota) / float(historico.total_produtos or 1),
                    "sku": historico.produto.SKU or '',
                })

        # Converte o dicionario para uma lista
        historico_list = list(historico_data.values())

        # Paginação
        paginator = HistoricoPagination()
        paginated_data = paginator.paginate_queryset(historico_list, request, view=self)

        return paginator.get_paginated_response(paginated_data)
    

    @action(detail=False, methods=['post'])
    def envia_resumo(self, request):
        vendedores = request.data.get('vendedores', '')
        texto_ia = request.data.get('textareavalue', '')
        try:
            bot = Bot.objects.filter(statusregistro_id=200, bot_padrao='S', empresa=request.user.empresa).last()
        except Bot.DoesNotExist:
            return Response({'error': 'Bot não encontrado'}, status=404)
        edi_integracao = bot.legenda_3
        provider = bot.bot_provedor.provedor_padrao
        edi = bot.EDI_Integracao
        template = request.user.empresa.template_optin_vendedores

        if not template:
            return Response({'error': 'Template não encontrado'}, status=404)

        vendedores_data = []
        if vendedores:
            items = ger_vendedores.objects.filter(id__in=vendedores, statusregistro_id=200, empresa=request.user.empresa)

            for item in items:
                vendedores_data.append({
                    'nome': item.Vendedor,
                    'telefone': re.sub(r'\D', '', item.TelefoneVendedor)
                })
            if texto_ia:
                texto_ia = self.gerar_resumo(texto_ia, 'gpt-4o-mini', 800)
            access_token = CampaignViewSet.obter_access_token(bot)
            self.envia_mensagem.delay(vendedores_data, texto_ia, edi_integracao, provider, edi, template, access_token)

        return Response({'success': 'Tarefa Iniciada'}, status=200)

    
    @action(detail=False, methods=['post'], permission_classes=[])
    def recebe_cnpj(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        empresa = request.data.get('empresa')
        cnpj = request.data.get('cnpj')

        # Validando se todos os campos foram enviados
        if not username or not password or not cnpj:
            return Response(
                {"error": "Username, password, and CNPJ are required."},
                status=400
            )
        
        # Validando o formato e a validade do CNPJ
        if not self._is_valid_cnpj(cnpj):
            return Response(
                {"error": "Invalid CNPJ."},
                status=400
            )

        user = authenticate(request, username=username, password=password)

        if user is not None:
            cnpj_formatado = ''.join(filter(str.isdigit, cnpj))

            try:
                entidade = ger_entidade.objects.get(
                    CNPJNumerico=cnpj_formatado,
                    empresa=empresa,
                    statusregistro_id=200
                )
            except ger_entidade.DoesNotExist:
                return Response({"error": "Entidade não encontrada"}, status=404)

            # Chamar a função `busca_sugestao` internamente
            sugestao_response = self.busca_sugestao(request, pk=entidade.id)
            
            # Garantir que o retorno é um Response
            if isinstance(sugestao_response, Response):
                sugestao_data = sugestao_response.data
            else:
                sugestao_data = {}
            
            detalhes = self.detalhes(request, pk=entidade.id)

            if isinstance(detalhes, Response):
                detalhes_data = detalhes.data
            else:
                detalhes_data = {}


            produtos = detalhes_data.get('results', [])

            # Pegar os primeiros 5 itens
            primeiros_5_produtos = produtos[:5]

            dados_ia = {
                'porte': sugestao_data.get('cliente', {}).get('porte'),
                'nome_cliente': sugestao_data.get('cliente', {}).get('nome'),
                'id_cliente': sugestao_data.get('cliente', {}).get('id'),
                'potencialCliente': sugestao_data.get('estatisticas', {}).get('potencial_cliente'),
                'potencialRegiao': sugestao_data.get('estatisticas', {}).get('potencial_regiao'),
                'diasUltimaCompra': sugestao_data.get('metricas_avancadas', {}).get('dias_desde_ultima_compra'),
                'ticket_medio': sugestao_data.get('metricas', {}).get('ticket_medio'),
                'total_compras': sugestao_data.get('metricas', {}).get('total_compras'),
                'total_gasto': sugestao_data.get('metricas', {}).get('total_gasto'),
                'tendencia_crescimento': sugestao_data.get('metricas_avancadas', {}).get('tendencia_crescimento'),
                'historico_vendas': primeiros_5_produtos
            }



            try:
                # Definir os dados globalmente para o request

                # Chame o método ia_analise
                ia_response = self.ia_analise(request, dados_ia, empresa)
                resumo = self.gerar_resumo(ia_response.data.get('result'),'gpt-4o-mini')
                # Retornar o JSON final com a resposta da IA
                return Response(
                    {
                        "ia_response": resumo
                    },
                    status=200
                )
            except Exception as e:
                return Response(
                    {"error": f"Erro ao processar análise de IA: {str(e)}"},
                    status=500
                )

        return Response({"error": "Autenticação falhou."}, status=403)

    def _is_valid_cnpj(self, cnpj: str) -> bool:
        # Remove caracteres não numéricos
        cnpj = ''.join(filter(str.isdigit, cnpj))

        # Verifica se o CNPJ tem exatamente 14 dígitos
        if len(cnpj) != 14:
            return False
        
        # Verifica se todos os dígitos são iguais (CNPJs inválidos)
        if cnpj == cnpj[0] * 14:
            return False

        # Calcula os dois dígitos verificadores
        def calculate_digit(cnpj_partial, weights):
            total = sum(int(cnpj_partial[i]) * weights[i] for i in range(len(weights)))
            remainder = total % 11
            return '0' if remainder < 2 else str(11 - remainder)

        # Pesos para o primeiro e segundo dígito verificador
        weights_first = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        weights_second = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

        # Calcula o primeiro dígito verificador
        first_digit = calculate_digit(cnpj[:12], weights_first)
        if first_digit != cnpj[12]:
            return False

        # Calcula o segundo dígito verificador
        second_digit = calculate_digit(cnpj[:13], weights_second)
        if second_digit != cnpj[13]:
            return False

        return True

    @shared_task
    def envia_mensagem(vendedores_data, texto_ia, edi_integracao, provider, edi, template, access_token):
        for vendedor in vendedores_data:
            telefone = vendedor['telefone']
            nome = vendedor['nome']
            print("nome", nome)
            print('telefone', telefone)
            print('texto', texto_ia)
            texto_ajustado = texto_ia.replace("\n", "\\n")
            json_data = {
                "name": "ingleza_optin_vendedores",
                "components": [
                    {
                        "type": "body",
                        "parameters": [
                            {
                                "type": "text",
                                "text": nome  # Nome do vendedor
                            },
                            {
                                "type": "text",
                                "text": texto_ajustado  # Mensagem personalizada
                            }
                        ]
                    },
                    {
                        "type": "button",
                        "sub_type": "quick_reply",
                        "index": 0,
                        "parameters": [
                            {
                                "type": "payload",
                                "payload": {
                                    "to_chain_id": "6762ca75bfe4faf8d207a26b"
                                }
                            }
                        ]
                    }
                ],
                "language": {
                    "policy": "deterministic",
                    "code": "pt_BR"
                }
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

    def gerar_resumo(self,texto, model, max_caracteres=1000):
        """
        Gera um resumo do texto fornecido com um limite máximo de caracteres.

        Args:
            texto (str): O texto a ser resumido.
            max_caracteres (int): O número máximo de caracteres permitidos para o resumo. Default é 1000.

        Returns:
            str: O resumo gerado ou uma mensagem de erro.
        """
        print("Modelo", model)
        try:
            # Configurar a API da OpenAI
            openai.api_key = settings.OPEN_IA_GPT_API_KEY

            # Chamar a API para gerar o resumo
            resposta = openai.ChatCompletion.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": f"Resuma o texto a seguir em até {max_caracteres} caracteres, atenção não pode passar de {max_caracteres} caracteres. Escreva-o formatado para ser uma mensagem do whatsapp"},
                    {"role": "user", "content": texto}
                ],
                max_tokens=1200,  # Aproximadamente 1000 caracteres
                temperature=0.2
            )

            resumo = resposta['choices'][0]['message']['content'].strip()


            # Verificar se o resumo está dentro do limite de caracteres
            if len(resumo) > max_caracteres:
                return resumo[:max_caracteres] + "..."

            return resumo

        except Exception as e:
            return f"Erro ao gerar resumo: {str(e)}"


