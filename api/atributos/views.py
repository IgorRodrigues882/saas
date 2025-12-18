from rest_framework import viewsets
from rest_framework import permissions
from rest_framework import status
from django.utils import timezone
from rest_framework.response import Response
from boomerangue.apps.atributos.models import Atributo, GrupoAgendamentos
from .seriealizers import AtributoSerializer, grupoAgendamentosSerializer
import zipfile
from django.http import HttpResponse
from django.conf import settings
import os
import zipfile
from io import BytesIO
from rest_framework.decorators import action

class AtributoViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows ger_grade to be viewed, edited or created.
    """

    queryset = Atributo.objects.all()
    serializer_class = AtributoSerializer
    permission_classes = [permissions.IsAuthenticated]

    # Return data for edit in transportadora-list
    def retrieve(self, request, pk=None):
        try:
            condicao = Atributo.objects.get(pk=pk)
        except Atributo.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)

        serializer = self.get_serializer(condicao)
        return Response(serializer.data)
    
    def partial_update(self, request, pk=None):
        try:
            # Tenta buscar o atributo pelo ID (pk)
            condicao = Atributo.objects.get(pk=pk)
        except Atributo.DoesNotExist:
            return Response({"error": "Item not found."}, status=status.HTTP_404_NOT_FOUND)

        # Obtém o nome do atributo enviado na requisição
        nome_atributo = request.data.get('nome_atributo')
        tipo_empresa = request.data.get("tipo_empresa")

        # Verificar se já existe outro atributo com o mesmo nome, excluindo o atual
        if nome_atributo and Atributo.objects.filter(nome_atributo=nome_atributo, tipo_empresa = tipo_empresa).exclude(pk=pk).exists():
            return Response(
                {"error": "Já existe um atributo com o mesmo nome."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Se não houver duplicidade, continua com a atualização parcial
        serializer = self.get_serializer(condicao, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # Create new attribute
    def create(self, request, *args, **kwargs):
        nome_atributo = request.data.get('nome_atributo')
        tipo_empresa = request.data.get("tipo_empresa")

        # Verificar se já existe um atributo com o mesmo nome
        if Atributo.objects.filter(nome_atributo=nome_atributo, tipo_empresa = tipo_empresa).exists():
            return Response(
                {"error": "Já existe um atributo com o mesmo nome."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Se não existir, continuar com a criação
        return super().create(request, *args, **kwargs)
    
    # delete itens
    # def destroy(self, request, *args, **kwargs):
    #     instance = self.get_object()

    #     # Defina deleted_at com a data/hora atual
    #     instance.exclusao_dt = timezone.now()
        
    #     # Defina status como 9000
    #     instance.statusregistro_id = 9000

    #     instance.save()
    #     return Response(status=status.HTTP_204_NO_CONTENT)


    @action(detail=False, methods=['post'])
    def busca_atributos(self, request):
        print("chegou busca atributos")
        try:
            pk = request.data.get('id')
            condicao = Atributo.objects.filter(tipo_empresa=pk)
        except Atributo.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)

        serializer = self.get_serializer(condicao, many=True)
        return Response(serializer.data)



class GrupoAgendamentosViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows ger_grade to be viewed, edited or created.
    """

    queryset = GrupoAgendamentos.objects.all()
    serializer_class = grupoAgendamentosSerializer
    permission_classes = [permissions.IsAuthenticated]



    # Return data for edit in transportadora-list
    def retrieve(self, request, pk=None):
        try:
            condicao = GrupoAgendamentos.objects.get(pk=pk)
        except GrupoAgendamentos.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)

        serializer = self.get_serializer(condicao)
        return Response(serializer.data)
    
    # Edit data
    def patch(self, request, pk=None):
        try:
            condicao = GrupoAgendamentos.objects.get(pk=pk)
        except GrupoAgendamentos.DoesNotExist:
            return Response({"error": "Item not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(condicao, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def busca_grupos(self, request):
        id_empresa = request.user.empresa
        agendamentos = GrupoAgendamentos.objects.filter(empresa=id_empresa)
        serializer = self.get_serializer(agendamentos, many=True)
        return Response(serializer.data)
        
    
    @action(detail=False, methods=['get'])
    def download_integrador(self, request):
        print("Entrou downloads")
        try:
            # Criar um buffer de memória para o arquivo ZIP
            zip_buffer = BytesIO()
            
            # Criar o arquivo ZIP na memória
            with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                # Caminho para os arquivos
                config_path = os.path.join(settings.BASE_DIR, 'static', 'files', 'config.json')
                exe_path = os.path.join(settings.BASE_DIR, 'static', 'files', 'teste_clinicas.exe')
                
                print(config_path)
                print(exe_path)
                # Verificar se os arquivos existem
                if not os.path.exists(config_path) or not os.path.exists(exe_path):
                    print("Não achou os arquivos")
                    return Response(
                        {'error': 'Arquivos não encontrados'}, 
                        status=status.HTTP_404_NOT_FOUND
                    )
                
                # Adicionar arquivos ao ZIP
                zip_file.write(config_path, 'config.json')
                zip_file.write(exe_path, 'teste_clinicas.exe')
            
            # Preparar a resposta
            response = HttpResponse(
                zip_buffer.getvalue(), 
                content_type='application/zip'
            )
            response['Content-Disposition'] = 'attachment; filename="integrador_package.zip"'
            
            return response
        
        except Exception as e:
            return Response(
                {'error': f'Erro ao gerar arquivo: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    