from rest_framework import viewsets
from rest_framework import permissions
from rest_framework import status
import datetime
from rest_framework.response import Response
from django.db.models import Q
from boomerangue.apps.ger_produtos.models import ger_produtos
from boomerangue.apps.ger_empresas.models import ger_empresas
from rest_framework.pagination import PageNumberPagination
from .seriealizers import GerProdutosSerializer
from rest_framework.decorators import action


class CustomPagination(PageNumberPagination):
    page_size = 20  # Número de usuários por página
    page_size_query_param = 'page_size'


class GerProdutosViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows wpp templates to be viewed, edited or created.
    """

    queryset = ger_produtos.objects.all()
    serializer_class = GerProdutosSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = CustomPagination

    def retorna_query():
        queryset = ger_produtos.objects.all()
        return queryset

    # Return data for edit in transportadora-list
    def retrieve(self, request, pk=None):
        try:
            condicao = ger_produtos.objects.get(pk=pk)
        except ger_produtos.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)

        serializer = self.get_serializer(condicao)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        data = request.data

        empresa_url = request.get_host().split('.')[0]
        try:
            empresa = ger_empresas.objects.get(url_boomerangue = empresa_url)
        except ger_empresas.DoesNotExist:
            return Response(data, status=status.HTTP_400_BAD_REQUEST)

        data["empresa"] = empresa.id

        produto_serializer = GerProdutosSerializer(data=request.data)
        if produto_serializer.is_valid():
            produto_serializer.save()
            data = {'sucesso':'Produto criado com sucesso.'}
            return Response(data, status=status.HTTP_200_OK)
        
        data = {
            'erro': 'Erro ao criar produto',
            'erros_serializer': produto_serializer.errors
        }
        return Response(data, status=status.HTTP_400_BAD_REQUEST)

        
    
    # Edit data
    def patch(self, request, pk=None):
        try:
            condicao = ger_produtos.objects.get(pk=pk)
        except ger_produtos.DoesNotExist:
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
    
    @action(detail=False, methods=['post'])
    def get_produtos(self, request, *args, **kwargs):
        desc = request.data.get('desc', None)
        print("Descrição", desc)
        try:
            if desc:
                produtos = ger_produtos.objects.filter(empresa=request.user.empresa, statusregistro_id=200, Descricao__icontains=desc)
            else:
                produtos = ger_produtos.objects.filter(empresa=request.user.empresa, statusregistro_id=200)
        except:
            return Response({"error": "Item not found."}, status=status.HTTP_404_NOT_FOUND)
        # Paginação
        page = self.paginate_queryset(produtos)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        # Caso não haja paginação
        serializer = self.get_serializer(produtos, many=True)
        return Response(serializer.data)
    

    @action(detail=False, methods=['get'])
    def busca(self, request, *args, **kwargs):
        query = request.query_params.get('query', '')
        queryset = self.filter_queryset(self.get_queryset())
        print("Query", query)
        if query:
            queryset = queryset.filter(empresa = request.user.empresa, statusregistro_id=200)
            queryset = queryset.filter(Q(Descricao__icontains=query)
            | Q(Descricao_Longa__icontains=query) 
            | Q(Descricao_Curta__icontains=query)
            | Q(Descricao_Amigavel__icontains=query)
            | Q(EAN__icontains=query)
            | Q(Codigo__icontains=query)
            | Q(SKU__icontains=query)
            )
        else:
            queryset = queryset.filter(empresa = request.user.empresa,statusregistro_id=200)[:20]

        serializer = self.get_serializer(queryset, many=True)

        data = serializer.data
                
        return Response(data)
