from rest_framework import viewsets
from rest_framework import status
from rest_framework import permissions
import datetime
from rest_framework.response import Response
from rest_framework.decorators import action
from django.http import JsonResponse
from django.db.models import Q
from rest_framework.pagination import PageNumberPagination

from boomerangue.apps.ger_empresas.models import ger_empresas, ger_condicoespagamento, ger_tipoempresa, TipoEmpresaPermissao, permissoes_paginas, select_tipo_campanha, StringPersonalizada, prompt_ia, ger_unidade
from .seriealizers import CreateEmpresaSerializer, CreateCondPagamentoSerializer,StringPersonalizadaSeriealizer, ger_tipoempresaSeriealizer, ger_tipoempresapermissaoSeriealizer, permissao_por_paginaSeriealizer, select_tipo_campanhaSeriealizer, prompt_iaSeriealizer, ger_unidadeSerializer


class CustomPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class createEmpresaViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows Campaigns to be viewed, edited or created.
    """
    queryset = ger_empresas.objects.all()
    serializer_class = CreateEmpresaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def retorna_query():
        queryset = ger_empresas.objects.filter(statusregistro_id=200)
        return queryset
    
    def retorna_query_personalizada(id):
        queryset = ger_empresas.objects.filter(statusregistro_id=200, id=id)
        return queryset
    
    def retrieve(self, request, pk=None):
        try:
            condicao = ger_empresas.objects.get(pk=pk)
        except ger_empresas.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)

        serializer = self.get_serializer(condicao)
        return Response(serializer.data)
    

    def patch(self, request, pk=None):
        try:
            condicao = ger_empresas.objects.get(pk=pk)
        except ger_empresas.DoesNotExist:
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
    def get_empresas(self, request):
        data = request.data
        empresas = ger_empresas.objects.filter(tipo_de_negocio = data.get('id'), statusregistro_id=200)
        serializer = self.get_serializer(empresas, many = True)
        return Response(serializer.data)


    @action(detail=False, methods=['get'])
    def get_empresas_block(self, request):
        if request.user.empresa.tipo_de_negocio.value_prefixo == 'ADMIN':
            empresas = ger_empresas.objects.filter(statusregistro_id=900)
            serializer = self.get_serializer(empresas, many = True)
            return Response(serializer.data)
        
    
    


class createCondPagamentoViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows Campaigns to be viewed, edited or created.
    """
    queryset = ger_condicoespagamento.objects.all()
    serializer_class = CreateCondPagamentoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def retorna_query(empresa_id):
        queryset = ger_condicoespagamento.objects.filter(statusregistro_id=200, empresa=empresa_id)
        return queryset

    def retrieve(self, request, pk=None):
        try:
            condicao = ger_condicoespagamento.objects.get(pk=pk)
        except ger_condicoespagamento.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)

        serializer = self.get_serializer(condicao)
        return Response(serializer.data)
    

    def patch(self, request, pk=None):
        try:
            condicao = ger_condicoespagamento.objects.get(pk=pk)
        except ger_condicoespagamento.DoesNotExist:
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
    


class ger_tipoempresaViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows Campaigns to be viewed, edited or created.
    """
    queryset = ger_tipoempresa.objects.all()
    serializer_class = ger_tipoempresaSeriealizer
    permission_classes = [permissions.IsAuthenticated]


    def retrieve(self, request, pk=None):
        try:
            condicao = ger_tipoempresa.objects.get(pk=pk)
        except ger_tipoempresa.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)

        serializer = self.get_serializer(condicao)
        return Response(serializer.data)
    

    def patch(self, request, pk=None):
        try:
            condicao = ger_tipoempresa.objects.get(pk=pk)
        except ger_tipoempresa.DoesNotExist:
            return Response({"error": "Item not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(condicao, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    # delete itens
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()

        TipoEmpresaPermissao.objects.filter(tipo_empresa=instance.pk).delete()
        ger_empresas.objects.filter(tipo_de_negocio = instance.pk).update(tipo_de_negocio=None)

        # Defina deleted_at com a data/hora atual
        instance.exclusao_dt = datetime.datetime.now()
        
        # Defina status como 9000
        instance.statusregistro_id = 9000


        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
    


    

class ger_tipoempresapermissaoViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows Campaigns to be viewed, edited or created.
    """
    queryset = TipoEmpresaPermissao.objects.all()
    serializer_class = ger_tipoempresapermissaoSeriealizer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request):
        ids = request.data.get('ids', [])
        grupo = request.data.get('grupo', '')
        tipo_empresa = ger_tipoempresa.objects.get(id=grupo)
        permissoes = permissoes_paginas.objects.filter(nome__in=ids)
        if TipoEmpresaPermissao.objects.filter(tipo_empresa=tipo_empresa).exists():
            TipoEmpresaPermissao.objects.filter(tipo_empresa=tipo_empresa).delete()
        for permissao in permissoes:
            TipoEmpresaPermissao.objects.create(tipo_empresa=tipo_empresa, permissao=permissao)
        return JsonResponse({'message': 'Criado com sucesso'}, status=201)


    def retrieve(self, request, pk=None):
        try:
            condicao = TipoEmpresaPermissao.objects.select_related('permissao').filter(tipo_empresa_id=pk)
        except TipoEmpresaPermissao.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)

        serializer = self.get_serializer(condicao, many=True)
        data = serializer.data
        return Response(data)

    



    def patch(self, request, pk=None):
        try:
            condicao = TipoEmpresaPermissao.objects.get(pk=pk)
        except TipoEmpresaPermissao.DoesNotExist:
            return Response({"error": "Item not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(condicao, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

    
class permissao_por_paginaViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows Campaigns to be viewed, edited or created.
    """
    queryset = permissoes_paginas.objects.all()
    serializer_class = permissao_por_paginaSeriealizer
    permission_classes = [permissions.IsAuthenticated]


    def retrieve(self, request, pk=None):
        try:
            condicao = permissoes_paginas.objects.get(pk=pk)
        except permissoes_paginas.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)

        serializer = self.get_serializer(condicao)
        return Response(serializer.data)
    

    def patch(self, request, pk=None):
        try:
            condicao = permissoes_paginas.objects.get(pk=pk)
        except permissoes_paginas.DoesNotExist:
            return Response({"error": "Item not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(condicao, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    



class SelectTipoCampanhaViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows Campaigns to be viewed, edited or created.
    """
    queryset = select_tipo_campanha.objects.all()
    serializer_class = select_tipo_campanhaSeriealizer
    permission_classes = [permissions.IsAuthenticated]


    def create(self, request, *args, **kwargs):
        options = request.data.getlist('option')
        option_prefixes = request.data.getlist('option_prefix')
        tipo_empresa = request.data.get('tipo_empresa')
        tipo_empresa = ger_tipoempresa.objects.get(id=tipo_empresa)
        print("tipo empresa", tipo_empresa)
        for option, option_prefix in zip(options, option_prefixes):
            obj, created = select_tipo_campanha.objects.update_or_create(
                option_prefix=option_prefix,
                defaults={'option': option},
                tipo_empresa=tipo_empresa
            )
        # Exclui os objetos que não estão na lista de option_prefixes
        # select_tipo_campanha.objects.exclude(option_prefix__in=option_prefixes).delete()

        return Response({"success": "Options created successfully."}, status=status.HTTP_201_CREATED)


    def retrieve(self, request, pk=None):
        try:
            condicao = select_tipo_campanha.objects.filter(tipo_empresa=pk)
        except select_tipo_campanha.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)

        serializer = self.get_serializer(condicao, many=True)
        return Response(serializer.data)
    

    def patch(self, request, pk=None):
        try:
            condicao = select_tipo_campanha.objects.get(pk=pk)
        except select_tipo_campanha.DoesNotExist:
            return Response({"error": "Item not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(condicao, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    



class StringPersonalizadasViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows Campaigns to be viewed, edited or created.
    """
    queryset = StringPersonalizada.objects.all()
    serializer_class = StringPersonalizadaSeriealizer
    permission_classes = [permissions.IsAuthenticated]


    def create(self, request, *args, **kwargs):
        if request.user.empresa.tipo_de_negocio.value_prefixo == 'ADMIN':
            termos = request.data.get('termos')
            grupo = request.data.get('grupo')

            try:
                grupo = ger_tipoempresa.objects.get(pk=grupo)
            except ger_tipoempresa.DoesNotExist:
                return Response({"error": "Grupo não encontrado."}, status=status.HTTP_404_NOT_FOUND)
            

            if termos and grupo:
                for termo in termos:
                    chave = termo['chave']
                    valor = termo['valor']

                    # Verifica se já existe uma StringPersonalizada com a mesma chave e grupo
                    string_personalizada = StringPersonalizada.objects.filter(
                        chave=chave, tipo_empresa=grupo
                    ).first()

                    if string_personalizada:
                        # Se existir, atualiza o valor
                        string_personalizada.valor = valor
                        string_personalizada.save()
                    else:
                        # Se não existir, cria uma nova instância
                        StringPersonalizada.objects.create(
                            chave=chave, valor=valor, tipo_empresa=grupo
                        )
                        

                    

                return Response({"message": "Termos atualizados com sucesso."}, status=status.HTTP_200_OK)
            else:
                return Response({"error": "Dados inválidos."}, status=status.HTTP_400_BAD_REQUEST)
            
        return Response({"error": "Você não é admin"}, status=status.HTTP_400_BAD_REQUEST)




    def retrieve(self, request, pk=None):
        try:
            if StringPersonalizada.objects.filter(tipo_empresa=pk).exists():
                condicao = StringPersonalizada.objects.filter(tipo_empresa=pk)
            else:
                condicao = StringPersonalizada.objects.filter(tipo_empresa=1)
        except StringPersonalizada.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)

        serializer = self.get_serializer(condicao, many=True)
        return Response(serializer.data)
    

    def patch(self, request, pk=None):
        try:
            condicao = StringPersonalizada.objects.get(pk=pk)
        except StringPersonalizada.DoesNotExist:
            return Response({"error": "Item not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(condicao, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    



class prompt_iaViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows Campaigns to be viewed, edited or created.
    """
    queryset = prompt_ia.objects.all()
    serializer_class = prompt_iaSeriealizer
    permission_classes = [permissions.IsAuthenticated]


    def create(self, request, *args, **kwargs):
        tipo_empresa = request.data.get('tipo_empresa')
        descricao = request.data.get('descricao')

        print(tipo_empresa, descricao)

        grupo = ger_tipoempresa.objects.get(pk=tipo_empresa)

        
        string_personalizada, created = prompt_ia.objects.get_or_create(tipo_empresa=grupo)

    
        string_personalizada.descricao = descricao
        string_personalizada.save()



        return Response({"message": "Termos atualizados com sucesso."}, status=status.HTTP_200_OK)    



    def retrieve(self, request, pk=None):
        try:
            condicao = prompt_ia.objects.get(tipo_empresa=pk)
        except prompt_ia.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)

        serializer = self.get_serializer(condicao)
        return Response(serializer.data)
    

    def patch(self, request, pk=None):
        try:
            condicao = prompt_ia.objects.get(tipo_empresa=pk)
        except prompt_ia.DoesNotExist:
            return Response({"error": "Item not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(condicao, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    


class ger_unidadeViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows Campaigns to be viewed, edited or created.
    """
    queryset = ger_unidade.objects.all()
    serializer_class = ger_unidadeSerializer
    permission_classes = [permissions.IsAuthenticated]


    def retrieve(self, request, pk=None):
        try:
            condicao = ger_unidade.objects.get(pk=pk)
        except ger_unidade.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)

        serializer = self.get_serializer(condicao)
        return Response(serializer.data)
    

    def patch(self, request, pk=None):
        try:
            condicao = ger_unidade.objects.get(pk=pk, empresa=request.user.empresa)
        except ger_unidade.DoesNotExist:
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
    def filtragem_unidades(self, request, *args, **kwargs):
        # Acessando os dados enviados na requisição
        data = request.data
        # Extraindo os valores dos dados
        # status = data.get('status')
        # query = data.get('search-candidatos')
        # vaga = data.get('vaga')
        # unidade = data.get('unidade')
        # print("Query", query)


        # Filtrando o queryset com base nos valores recebidos
        try:
            candidates = ger_unidade.objects.filter(empresa=request.user.empresa, statusregistro_id=200).order_by('-cadastro_dt')
        except ger_unidade.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)
        
        # if query:
        #     candidates = candidates.filter(candidate__icontains=query)
        
        # if status:
        #     candidates = candidates.filter(status_id=status)
        
        # if unidade:
        #     candidates = candidates.filter(unidade_id=unidade)
        
        # if vaga:
        #     candidates = candidates.filter(job_id=vaga)
            


        # Paginação
        paginator = CustomPagination()
        paginated_queryset = paginator.paginate_queryset(candidates, request)

        # Serializando os dados
        serializer = self.get_serializer(paginated_queryset, many=True)
       

        return paginator.get_paginated_response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def busca(self, request, *args, **kwargs):
        query = request.query_params.get('query', '')
        queryset = self.filter_queryset(self.get_queryset())
        if query:
            queryset = queryset.filter(empresa = request.user.empresa)
            queryset = queryset.filter(Q(name__icontains=query) | Q(cnpj__icontains=query))
            queryset = queryset.filter(statusregistro_id=200)
        else:
            queryset = queryset.filter(empresa = request.user.empresa, statusregistro_id=200)[:10]

        serializer = self.get_serializer(queryset, many=True)

        data = serializer.data
                
        return Response(data)
    
    @action(detail=False, methods=['get'])
    def all(self, request, *args, **kwargs):
       """
       Endpoint para retornar todos os candidatos sem paginação.
       """
       queryset = self.queryset.filter(empresa=request.user.empresa, statusregistro_id=200).order_by('-cadastro_dt')
       serializer = self.get_serializer(queryset, many=True)
       # Para compatibilidade com o frontend Kanban, inclua status_description e corkankan
       return Response(serializer.data)