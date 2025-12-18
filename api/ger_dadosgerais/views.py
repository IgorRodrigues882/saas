from rest_framework import viewsets
from rest_framework import status
from rest_framework import permissions
from rest_framework import serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
import datetime
import pandas as pd

from boomerangue.apps.ger_dadosgerais.models import ger_transportadora, ger_vendedores, ger_pais, ger_uf, ger_cidade, ger_marcas, ger_regiao
from boomerangue.apps.ger_empresas.models import ger_empresas
from boomerangue.apps.ger_entidades.models import ger_entidade
from .seriealizers import CreateTransportadoraSerializer, CreateVendedorSerializer, VendedorPorCSVSerializer, GetCidadeSerializer


class createTransportadoraViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows Campaigns to be viewed, edited or created.
    """
    queryset = ger_transportadora.objects.all()
    serializer_class = CreateTransportadoraSerializer
    permission_classes = [permissions.IsAuthenticated]

    def retorna_query(empresa_id):
        queryset = ger_transportadora.objects.filter(statusregistro_id=200, empresa_id=empresa_id)
        return queryset
    
    # Return data for edit in transportadora-list
    def retrieve(self, request, pk=None):
        try:
            condicao = ger_transportadora.objects.get(pk=pk)
        except ger_transportadora.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)

        serializer = self.get_serializer(condicao)
        return Response(serializer.data)
    
    # Edit data
    def patch(self, request, pk=None):
        try:
            condicao = ger_transportadora.objects.get(pk=pk)
        except ger_transportadora.DoesNotExist:
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
    

# create vendedores
class createVendedoresViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows Campaigns to be viewed, edited or created.
    """
    queryset = ger_vendedores.objects.all()
    serializer_class = CreateVendedorSerializer
    permission_classes = [permissions.IsAuthenticated]

    def retorna_query(empresa_id):
        queryset = ger_vendedores.objects.filter(statusregistro_id=200,empresa_id=empresa_id)
        return queryset
    
    # Return data for edit in transportadora-list
    def retrieve(self, request, pk=None):
        try:
            condicao = ger_vendedores.objects.get(pk=pk)
        except ger_vendedores.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)

        serializer = self.get_serializer(condicao)
        data = serializer.data
        data['empresa'] = condicao.empresa.empresa
        return Response(data)
    
    # Edit data
    def patch(self, request, pk=None):
        try:
            condicao = ger_vendedores.objects.get(pk=pk)
        except ger_vendedores.DoesNotExist:
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
    

    # retorna lista de vendedores para a pesquisa
    def list(self, request, *args, **kwargs):
        query = request.query_params.get('query', '')  # Obtém o parâmetro 'query' da solicitação
        queryset = self.filter_queryset(self.get_queryset())  # Aplica filtros, se houver

        if query:
            # Filtra os resultados com base na consulta do usuário
            queryset = queryset.filter(empresa = request.user.empresa, Vendedor__icontains=query, statusregistro_id=200)
        else:
            queryset = queryset.filter(empresa = request.user.empresa, statusregistro_id=200)


        serializer = self.get_serializer(queryset, many=True)
        data = [{'id': item['id'], 'Vendedor': item['Vendedor'], 'Apelido': item['Apelido'], 'CodigoVendedor': item['CodigoVendedor'], 'VendedorBM': item['VendedorBM'], 'VendedorOriginal': item['VendedorOriginal'], 'LegendaVendedor': item['LegendaVendedor'], 'TelefoneVendedor': item['TelefoneVendedor'], 'ComissaoVenda': item['ComissaoVenda'], 'VendedorPadrao': item['VendedorPadrao'], 'empresa': request.user.empresa.empresa} for item in serializer.data]
        
        return Response(data)
    

    @action(detail=False, methods=['get'], url_path='items')
    def items(self, request):
        termo_busca = request.GET.get('q', '')
        page = int(request.GET.get('page', 1))
        items_por_pagina = 10
        inicio = (page - 1) * items_por_pagina
        fim = inicio + items_por_pagina

        # Substitua 'campo_busca' pelo campo que você deseja buscar
        if termo_busca:
            items = ger_vendedores.objects.filter(empresa = request.user.empresa, Vendedor__icontains=termo_busca, statusregistro_id=200)[inicio:fim]
            total = ger_vendedores.objects.filter(empresa = request.user.empresa, Vendedor__icontains=termo_busca, statusregistro_id=200).count()
        else:
            items = ger_vendedores.objects.filter(empresa = request.user.empresa, statusregistro_id=200)
            total = ger_vendedores.objects.filter(empresa = request.user.empresa, statusregistro_id=200).count()

        # Substitua 'id' e 'texto' pelos campos do seu modelo
        resultados = [{'id': item.id, 'text': item.Vendedor, 'integracao': item.Integracao_EDI} for item in items]

        return Response({
            'results': resultados,
            'pagination': {
                'more': fim < total
            }
        })
        




    @action(detail=False, methods=['post'], url_path='importar-arquivo')
    def importar_arquivo(self, request, *args, **kwargs):
        empresa_url = request.get_host().split('.')[0]
        empresa = get_object_or_404(ger_empresas, url_boomerangue=empresa_url)
        try:
            arquivos = request.FILES.getlist('Arquivo')
            
            for arquivo in arquivos:
                # Usar pandas para ler o arquivo CSV
                df = pd.read_csv(arquivo, encoding='utf-8')

                with transaction.atomic():
                    for index, row in df.iterrows():
                        data = row.to_dict()

                        try:
                            data["dtSincronizacao"] = datetime.datetime.strptime(data["dtSincronizacao"], "%d-%m-%Y %H:%M:%S")
                        except (KeyError, ValueError) as date_error:
                            # Tratar erro de formato de data ou chave não existente
                            return Response({"error": f"Erro na data: {str(date_error)}"}, status=400)

                        data["empresa"] = empresa.id

                        if ger_vendedores.objects.filter(**data).exists():  # se já existe um vendedor com mesmos dados
                            continue

                        # Criar um serializer com os dados da linha
                        serializer = VendedorPorCSVSerializer(data=data)

                        # Validar e salvar o objeto
                        try:
                            serializer.is_valid(raise_exception=True)
                            serializer.save()
                        except serializers.ValidationError as validation_error:
                            # Tratar erro de validação do serializer
                            return Response({"error": f"Erro ao salvar no banco de dados: {str(validation_error)}"}, status=400)

        except (pd.errors.EmptyDataError, pd.errors.ParserError, FileNotFoundError) as file_error:
            # Tratar erros relacionados ao arquivo CSV
            return Response({"error": f"Erro no arquivo CSV: {str(file_error)}"}, status=400)

        except Exception as e:
            # Qualquer outra exceção não tratada
            return Response({"error": str(e)}, status=400)


        return Response({'sucess': 'Importação concluída com sucesso'}, status=201)
    
    @action(detail=False, methods=['get'], url_path='exportar-vendedores')
    def exportar_vendedores(self, request, *args, **kwargs):
        empresa_url = request.get_host().split('.')[0]
        empresa = get_object_or_404(ger_empresas, url_boomerangue=empresa_url)

        objs = ger_vendedores.objects.filter(empresa=empresa)
        serializer = VendedorPorCSVSerializer(objs, many=True)

        df = pd.DataFrame(serializer.data)

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="exportar_vendedores.csv"'

        # Salvar o DataFrame como um arquivo CSV na resposta
        df.to_csv(response, index=False)

        return response
        

class GetPaises():
    def return_paises():
        queryset=ger_pais.objects.all()
        return queryset

class GetUF():
    def return_uf():
        queryset=ger_uf.objects.all()
        return queryset

class GetCidade(viewsets.ModelViewSet):
    queryset = ger_cidade.objects.all()    
    serializer_class = GetCidadeSerializer
    permission_classes = [permissions.IsAuthenticated]    
    # Return data for edit in transportadora-list
    def retrieve(self, request, pk=None):
        try:
            condicao = ger_cidade.objects.filter(uf_id__sigla=pk)
        except ger_cidade.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)


        cidade_info = [{"Cidade": cidade.Cidade, "pk": cidade.pk, 'ibge': cidade.CodIBGE} for cidade in condicao]


        return Response({"cidades": cidade_info})
    
    @action(detail=False, methods=['post'])
    def busca_cidades_estado(self, request):
        id_estado = request.data.get('id')
        if id_estado:
            try:
                condicao = ger_cidade.objects.filter(uf=id_estado)
            except ger_cidade.DoesNotExist:
                return Response({"error": "Item not found."}, status=404)

            cidade_info = [{"Cidade": cidade.Cidade, "pk": cidade.pk, 'ibge': cidade.CodIBGE} for cidade in condicao]
            return Response({"cidades": cidade_info})

    @action(detail=False, methods=['post'])
    def busca_estados(self, request):
        id_regiao = request.data.get('id')
        try:
            if id_regiao:
                condicao = ger_uf.objects.filter(regiao=id_regiao)
            else:
                condicao = ger_uf.objects.all()
        except ger_uf.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)

        estado_info = [{"uf": estado.uf, "pk": estado.pk} for estado in condicao]
        return Response({"estados": estado_info})
    
    @action(detail=False, methods=['post'])
    def busca_bairro(self, request):
        id_cidade = request.data.get('id')
        if id_cidade:
            try:
                # Usando values para pegar apenas os bairros únicos
                condicao = ger_entidade.objects.filter(cidade=id_cidade, empresa=request.user.empresa, statusregistro_id=200).values('Bairro').distinct()
            except ger_entidade.DoesNotExist:  # Corrigido para usar o nome correto da classe
                return Response({"error": "Item not found."}, status=404)

            # Convertendo o queryset para uma lista de dicionários
            bairro_info = [{"Bairro": bairro['Bairro'], "pk": bairro['Bairro']} for bairro in condicao]
            return Response({"bairro": bairro_info})

# create vendedores
class createMarcasViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows Campaigns to be viewed, edited or created.
    """
    queryset = ger_marcas.objects.all()
    serializer_class = CreateVendedorSerializer
    permission_classes = [permissions.IsAuthenticated]

    def retorna_query():
        queryset = ger_marcas.objects.filter(statusregistro_id=200)
        return queryset
    
    # Return data for edit in transportadora-list
    def retrieve(self, request, pk=None):
        try:
            condicao = ger_marcas.objects.get(pk=pk)
        except ger_marcas.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)

        serializer = self.get_serializer(condicao)
        return Response(serializer.data)
    
    # Edit data
    def patch(self, request, pk=None):
        try:
            condicao = ger_marcas.objects.get(pk=pk)
        except ger_marcas.DoesNotExist:
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