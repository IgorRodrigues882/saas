from rest_framework import viewsets
from rest_framework.generics import ListAPIView
from rest_framework import permissions
from django.http import HttpResponse
from rest_framework import status
from django.utils import timezone
from boomerangue.apps.recrutamento.models import vagas, Candidates, DocumentReasons, DocumentTypeStd, DocumentStatus,CandidateStatus, DocumentTypes, DocumentTypesFields
from .seriealizers import vagasSerializer, ExportVagasSerializer, candidatesSerializer, ReasonsSerializer, stdSerializer, statusdocSerializer, statuscandidateSerializer, tipos_documentoSerializer, camposSerializer
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q
from rest_framework.pagination import PageNumberPagination
import csv
import openpyxl
from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
import xml.etree.ElementTree as ET
from xhtml2pdf import pisa
from django.template.loader import get_template
from django.utils.text import slugify
from rest_framework.views import APIView
from django.apps import apps
from django.core.exceptions import FieldDoesNotExist
import json
import pandas as pd # Adicionar pandas para facilitar exportação XLS/CSV
class CustomPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class CustomPaginationCadastros(PageNumberPagination):
    page_size = 5
    page_size_query_param = 'page_size'
    max_page_size = 100
class ExportMixin:
    def get_filtered_queryset(self, request):
        """Método reutilizável para aplicar filtros"""
        data = request.data
        status = data.get('jobstatus')
        query = data.get('search-vagas')
        
        queryset = self.queryset.filter(
            empresa=request.user.empresa,
            statusregistro_id=200
        ).order_by('-creation_date')
        
        if query:
            queryset = queryset.filter(title__icontains=query)
        if status:
            queryset = queryset.filter(jobstatus=status)
            
        return queryset

    def get_export_serializer(self, data):
        """Método para ser sobrescrito nas views específicas"""
        return self.get_serializer(data, many=True)

    def get_headers(self, serializer):
        return [field.label for field in serializer.child.fields.values()]

    def get_rows(self, serializer):
        return [list(item.values()) for item in serializer.data]

    def export_data(self, serializer, export_type, filename):
        headers = self.get_headers(serializer)
        rows = self.get_rows(serializer)
        
        export_method = getattr(self, f'export_{export_type}', None)
        if export_method:
            return export_method(headers, rows, filename)
        return Response({"error": "Formato não suportado"}, status=400)

    def export_excel(self, headers, rows, filename):
        wb = openpyxl.Workbook()
        ws = wb.active
        
        # Adicionar cabeçalhos
        ws.append(headers)
        
        # Adicionar dados
        for row in rows:
            ws.append(row)
        
        # Ajustar largura das colunas
        for column in range(1, len(headers) + 1):
            column_letter = openpyxl.utils.get_column_letter(column)
            ws.column_dimensions[column_letter].width = 20
        
        # Ajuste especial para coluna de descrição
        ws.column_dimensions['E'].width = 50
        
        buffer = BytesIO()
        wb.save(buffer)
        buffer.seek(0)
        return self.create_response(
            buffer.getvalue(), 
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            f"{filename}.xlsx"
        )


    def export_csv(self, headers, rows, filename):
        buffer = BytesIO()
        writer = csv.writer(buffer, delimiter=';')
        writer.writerow(headers)
        for row in rows:
            writer.writerow(row)
        return self.create_response(
            buffer.getvalue(),
            'text/csv',
            f"{filename}.csv"
        )

    
    def export_pdf(self, headers, rows, filename):
        template_path = 'pdf/export.html'
        context = {
            'headers': headers,
            'rows': rows,
            'title': 'Relatório de Vagas'
        }
        
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        template = get_template(template_path)
        html = template.render(context)
        
        # Criar PDF
        pisa_status = pisa.CreatePDF(
            html, 
            dest=response,
            encoding='UTF-8'
        )
        
        if pisa_status.err:
            return HttpResponse('Erro ao gerar PDF')
        return response


    def export_xml(self, headers, rows, filename):
        root = ET.Element("Vagas")
        for row in rows:
            item = ET.SubElement(root, "Vaga")
            for i, value in enumerate(row):
                ET.SubElement(item, headers[i].replace(' ', '_')).text = str(value)
        buffer = BytesIO()
        ET.ElementTree(root).write(buffer, encoding='utf-8', xml_declaration=True)
        return self.create_response(
            buffer.getvalue(),
            'application/xml',
            f"{filename}.xml"
        )

    def create_response(self, content, content_type, filename):
        response = HttpResponse(content, content_type=content_type)
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

class vagasViewSet(ExportMixin,viewsets.ModelViewSet):
    """
    API endpoint that allows ger_grupoprodutos to be viewed, edited or created.
    """

    queryset = vagas.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    def get_serializer_class(self):
        if self.action == 'exportar_dados':
            return ExportVagasSerializer
        return vagasSerializer

     # Return data for edit in transportadora-list)
    
    def retrieve(self, request, pk=None):
        try:
            condicao = vagas.objects.get(pk=pk, empresa = request.user.empresa)
        except vagas.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)

        serializer = self.get_serializer(condicao)
        return Response(serializer.data)
    
    # Edit data
    def partial_update(self, request, pk=None):
        try:
            condicao = vagas.objects.get(pk=pk, empresa = request.user.empresa)
        except vagas.DoesNotExist:
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
    def filtragem_vagas(self, request, *args, **kwargs):
        # Acessando os dados enviados na requisição
        data = request.data

        # Extraindo os valores dos dados
        status = data.get('jobstatus')
        query = data.get('search-vagas')
        print("Query", query)


        # Filtrando o queryset com base nos valores recebidos
        try:
            jobs = vagas.objects.filter(empresa=request.user.empresa, statusregistro_id=200).order_by('-creation_date')
        except vagas.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)
        
        if query:
            jobs = jobs.filter(title__icontains=query)
        
        if status:
            jobs = jobs.filter(jobstatus=status)


        # Paginação
        paginator = CustomPagination()
        paginated_queryset = paginator.paginate_queryset(jobs, request)

        # Serializando os dados
        serializer = self.get_serializer(paginated_queryset, many=True)
       

        return paginator.get_paginated_response(serializer.data)

    @action(detail=False, methods=['get'])
    def all(self, request, *args, **kwargs):
       """
       Endpoint para retornar todos os candidatos sem paginação.
       """
       queryset = self.queryset.filter(empresa=request.user.empresa, statusregistro_id=200, jobstatus="A").order_by('-dtcadastro')
       serializer = self.get_serializer(queryset, many=True)
       # Para compatibilidade com o frontend Kanban, inclua status_description e corkankan
       return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def busca(self, request, *args, **kwargs):
        query = request.query_params.get('query', '')
        queryset = self.filter_queryset(self.get_queryset())
        if query:
            queryset = queryset.filter(empresa = request.user.empresa)
            queryset = queryset.filter(Q(title__icontains=query) | Q(description__icontains=query))
            queryset = queryset.filter(statusregistro_id=200)
        else:
            queryset = queryset.filter(empresa = request.user.empresa, statusregistro_id=200)[:10]

        serializer = self.get_serializer(queryset, many=True)

        data = serializer.data
                
        return Response(data)
    
    @action(detail=False, methods=['post'])
    def exportar_dados(self, request):
        try:
            queryset = self.get_filtered_queryset(request)
            serializer = self.get_serializer(queryset, many=True)  # Mantém o objeto serializer
            
            export_type = request.data.get('export_type', 'excel').lower().strip()
            valid_formats = ['excel', 'csv', 'pdf', 'xml']
            
            if export_type not in valid_formats:
                return Response({"error": "Formato inválido"}, status=400)
            
            filename = f"vagas.{export_type}"
            
            # Passa o objeto serializer completo
            return self.export_data(serializer, export_type, filename)
            
        except Exception as e:
            print(e)
            return Response({"error": str(e)}, status=500)



class candidatosViewSet(ExportMixin,viewsets.ModelViewSet):
    """
    API endpoint that allows ger_grupoprodutos to be viewed, edited or created.
    """

    queryset = Candidates.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = candidatesSerializer
    # def get_serializer_class(self):
    #     if self.action == 'exportar_dados':
    #         return ExportVagasSerializer
    #     return vagasSerializer

     # Return data for edit in transportadora-list)
    
    def retrieve(self, request, pk=None):
        try:
            condicao = Candidates.objects.get(pk=pk, empresa = request.user.empresa)
        except Candidates.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)

        serializer = self.get_serializer(condicao)
        data = serializer.data
        data['job_desc'] = vagas.objects.get(job_id=data['job_id']).description
        status = CandidateStatus.objects.get(status_id=data['status_id'])
        data['status_description'] = status.status_description
        data['corkankan'] = status.corkankan
        return Response(data)
    
    # Edit data
    def partial_update(self, request, pk=None):
        try:
            condicao = Candidates.objects.get(pk=pk, empresa = request.user.empresa)
        except Candidates.DoesNotExist:
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
        instance.dtexclusao = timezone.now()
        
        # Defina status como 9000
        instance.situacao_id = 9000

        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


    @action(detail=False, methods=['post'])
    def filtragem_candidates(self, request, *args, **kwargs):
        # Acessando os dados enviados na requisição
        data = request.data

        # Extraindo os valores dos dados
        status = data.get('status')
        query = data.get('search-candidatos')
        vaga = data.get('vaga')
        unidade = data.get('unidade')
        print("Query", query)


        # Filtrando o queryset com base nos valores recebidos
        try:
            candidates = Candidates.objects.filter(empresa=request.user.empresa, dtexclusao__isnull=True).order_by('-dtcadastro')
        except Candidates.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)
        
        if query:
            candidates = candidates.filter(candidate__icontains=query)
        
        if status:
            candidates = candidates.filter(status_id=status)
        
        if unidade:
            candidates = candidates.filter(unidade_id=unidade)
        
        if vaga:
            candidates = candidates.filter(job_id=vaga)
            


        # Paginação
        paginator = CustomPagination()
        paginated_queryset = paginator.paginate_queryset(candidates, request)

        # Serializando os dados
        serializer = self.get_serializer(paginated_queryset, many=True)
        for data in serializer.data:
            status = CandidateStatus.objects.get(status_id=data['status_id'])
            data['status'] = status.status_description
            data['corkankan'] = status.corkankan
       

        return paginator.get_paginated_response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def busca(self, request, *args, **kwargs):
        query = request.query_params.get('query', '')
        queryset = self.filter_queryset(self.get_queryset())
        if query:
            queryset = queryset.filter(empresa = request.user.empresa)
            queryset = queryset.filter(Q(candidate__icontains=query) | Q(phone__icontains=query) | Q(cpf__icontains=query))
            queryset = queryset.filter(situacao_id__isnull=True)
        else:
            queryset = queryset.filter(empresa = request.user.empresa, situacao_id__isnull=True)[:10]

        serializer = self.get_serializer(queryset, many=True)

        data = serializer.data
                
        return Response(data)

    @action(detail=False, methods=['get'])
    def all(self, request, *args, **kwargs):
       """
       Endpoint para retornar todos os candidatos sem paginação.
       """
       queryset = self.queryset.filter(empresa=request.user.empresa, dtexclusao__isnull=True).order_by('-dtcadastro')
       serializer = self.get_serializer(queryset, many=True)
       # Para compatibilidade com o frontend Kanban, inclua status_description e corkankan
       for data in serializer.data:
           status = CandidateStatus.objects.get(status_id=data['status_id'])
           job = vagas.objects.get(job_id=data['job_id'])
           data['status_description'] = status.status_description
           data['corkankan'] = status.corkankan
           data['job_desc'] = job.title
       return Response(serializer.data)
    

class ReasonsViewSet(ExportMixin,viewsets.ModelViewSet):
    """
    API endpoint that allows ger_grupoprodutos to be viewed, edited or created.
    """

    queryset = DocumentReasons.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ReasonsSerializer
    # def get_serializer_class(self):
    #     if self.action == 'exportar_dados':
    #         return ExportVagasSerializer
    #     return vagasSerializer

     # Return data for edit in transportadora-list)
    
    def retrieve(self, request, pk=None):
        try:
            condicao = DocumentReasons.objects.get(pk=pk, empresa = request.user.empresa)
        except DocumentReasons.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)

        serializer = self.get_serializer(condicao)
        return Response(serializer.data)
    
    # Edit data
    def partial_update(self, request, pk=None):
        try:
            condicao = DocumentReasons.objects.get(pk=pk, empresa = request.user.empresa)
        except DocumentReasons.DoesNotExist:
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
        instance.dtexclusao = timezone.now()
        
        # Defina status como 9000
        instance.situacao_id = 9000

        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=False, methods=['post'])
    def filtragem_reacoes(self, request, *args, **kwargs):
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
            candidates = DocumentReasons.objects.filter(empresa=request.user.empresa, dtexclusao__isnull=True).order_by('-dtcadastro')
        except DocumentReasons.DoesNotExist:
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
        paginator = CustomPaginationCadastros()
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
            queryset = queryset.filter(Q(candidate__icontains=query) | Q(phone__icontains=query) | Q(cpf__icontains=query))
            queryset = queryset.filter(situacao_id__isnull=True)
        else:
            queryset = queryset.filter(empresa = request.user.empresa, situacao_id__isnull=True)[:10]

        serializer = self.get_serializer(queryset, many=True)

        data = serializer.data
                
        return Response(data)
    

class stdViewSet(ExportMixin,viewsets.ModelViewSet):
    """
    API endpoint that allows ger_grupoprodutos to be viewed, edited or created.
    """

    queryset = DocumentTypeStd.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = stdSerializer
    # def get_serializer_class(self):
    #     if self.action == 'exportar_dados':
    #         return ExportVagasSerializer
    #     return vagasSerializer

     # Return data for edit in transportadora-list)
    
    def retrieve(self, request, pk=None):
        try:
            condicao = DocumentTypeStd.objects.get(pk=pk, empresa = request.user.empresa)
        except DocumentTypeStd.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)

        serializer = self.get_serializer(condicao)
        return Response(serializer.data)
    
    # Edit data
    def partial_update(self, request, pk=None):
        try:
            condicao = DocumentTypeStd.objects.get(pk=pk, empresa = request.user.empresa)
        except DocumentTypeStd.DoesNotExist:
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
        instance.dtexclusao = timezone.now()
        
        # Defina status como 9000
        instance.situacao_id = 9000

        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=False, methods=['post'])
    def filtragem_std(self, request, *args, **kwargs):
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
            candidates = DocumentTypeStd.objects.filter(empresa=request.user.empresa, dtexclusao__isnull=True).order_by('-dtcadastro')
        except DocumentTypeStd.DoesNotExist:
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
        paginator = CustomPaginationCadastros()
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
            queryset = queryset.filter(Q(candidate__icontains=query) | Q(phone__icontains=query) | Q(cpf__icontains=query))
            queryset = queryset.filter(situacao_id__isnull=True)
        else:
            queryset = queryset.filter(empresa = request.user.empresa, situacao_id__isnull=True)[:10]

        serializer = self.get_serializer(queryset, many=True)

        data = serializer.data
                
        return Response(data)
    


class statusdocViewSet(ExportMixin,viewsets.ModelViewSet):
    """
    API endpoint that allows ger_grupoprodutos to be viewed, edited or created.
    """

    queryset = DocumentStatus.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = statusdocSerializer
    # def get_serializer_class(self):
    #     if self.action == 'exportar_dados':
    #         return ExportVagasSerializer
    #     return vagasSerializer

     # Return data for edit in transportadora-list)
    
    def retrieve(self, request, pk=None):
        try:
            condicao = DocumentStatus.objects.get(pk=pk, empresa = request.user.empresa)
        except DocumentStatus.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)

        serializer = self.get_serializer(condicao)
        return Response(serializer.data)
    
    # Edit data
    def partial_update(self, request, pk=None):
        try:
            condicao = DocumentStatus.objects.get(pk=pk, empresa = request.user.empresa)
        except DocumentStatus.DoesNotExist:
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
        instance.dtexclusao = timezone.now()
        
        # Defina status como 9000
        instance.situacao_id = 9000

        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=False, methods=['post'])
    def filtragem_statusdoc(self, request, *args, **kwargs):
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
            candidates = DocumentStatus.objects.filter(empresa=request.user.empresa, dtexclusao__isnull=True).order_by('-dtcadastro')
        except DocumentStatus.DoesNotExist:
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
        paginator = CustomPaginationCadastros()
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
            queryset = queryset.filter(Q(candidate__icontains=query) | Q(phone__icontains=query) | Q(cpf__icontains=query))
            queryset = queryset.filter(situacao_id__isnull=True)
        else:
            queryset = queryset.filter(empresa = request.user.empresa, situacao_id__isnull=True)[:10]

        serializer = self.get_serializer(queryset, many=True)

        data = serializer.data
                
        return Response(data)


class statuscandidateViewSet(ExportMixin, viewsets.ModelViewSet):
    """
    API endpoint that allows ger_grupoprodutos to be viewed, edited or created.
    """
    queryset = CandidateStatus.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = statuscandidateSerializer

    def retrieve(self, request, pk=None):
        try:
            condicao = CandidateStatus.objects.get(pk=pk, empresa=request.user.empresa)
        except CandidateStatus.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)

        serializer = self.get_serializer(condicao)
        return Response(serializer.data)

    def partial_update(self, request, pk=None):
        try:
            condicao = CandidateStatus.objects.get(pk=pk, empresa=request.user.empresa)
        except CandidateStatus.DoesNotExist:
            return Response({"error": "Item not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(condicao, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.dtexclusao = timezone.now()
        instance.situacao_id = 9000
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['post'])
    def filtragem_statuscandidate(self, request, *args, **kwargs):
        try:
            candidates = CandidateStatus.objects.filter(empresa=request.user.empresa, dtexclusao__isnull=True).order_by('-dtcadastro')
        except CandidateStatus.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)

        paginator = CustomPaginationCadastros()
        paginated_queryset = paginator.paginate_queryset(candidates, request)
        serializer = self.get_serializer(paginated_queryset, many=True)
        return paginator.get_paginated_response(serializer.data)

    @action(detail=False, methods=['get'])
    def busca(self, request, *args, **kwargs):
        query = request.query_params.get('query', '')
        queryset = self.filter_queryset(self.get_queryset())
        if query:
            queryset = queryset.filter(empresa=request.user.empresa)
            queryset = queryset.filter(Q(candidate__icontains=query) | Q(phone__icontains=query) | Q(cpf__icontains=query))
            queryset = queryset.filter(situacao_id__isnull=True)
        else:
            queryset = queryset.filter(empresa=request.user.empresa, situacao_id__isnull=True)[:10]

        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data
        return Response(data)

    @action(detail=False, methods=['get'])
    def all(self, request, *args, **kwargs):
        queryset = self.queryset.filter(empresa=request.user.empresa, dtexclusao__isnull=True).order_by('-dtcadastro')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
                
    


class tipos_documentoViewSet(ExportMixin,viewsets.ModelViewSet):
    """
    API endpoint that allows ger_grupoprodutos to be viewed, edited or created.
    """

    queryset = DocumentTypes.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = tipos_documentoSerializer
    # def get_serializer_class(self):
    #     if self.action == 'exportar_dados':
    #         return ExportVagasSerializer
    #     return vagasSerializer

     # Return data for edit in transportadora-list)
    
    def retrieve(self, request, pk=None):
        try:
            condicao = DocumentTypes.objects.get(pk=pk, document_type_std__empresa = request.user.empresa)
        except DocumentTypes.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)

        serializer = self.get_serializer(condicao)
        return Response(serializer.data)
    
    # Edit data
    def partial_update(self, request, pk=None):
        try:
            condicao = DocumentTypes.objects.get(pk=pk,document_type_std__empresa = request.user.empresa)
        except DocumentTypes.DoesNotExist:
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
        instance.dtexclusao = timezone.now()
        
        # Defina status como 9000
        instance.situacao_id = 9000

        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=False, methods=['post'])
    def filtragem_tipos_documento(self, request, *args, **kwargs):
        # Acessando os dados enviados na requisição
        data = request.data

        # Extraindo os valores dos dados
        query = data.get('search_doctype')
        processo = data.get('status_processo')
        obrigatorio = data.get('obrigatorio')




        # Filtrando o queryset com base nos valores recebidos
        try:
            candidates = DocumentTypes.objects.filter(document_type_std__empresa=request.user.empresa, dtexclusao__isnull=True).order_by('-dtcadastro')
        except DocumentTypes.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)
        
        if query:
            candidates = candidates.filter(type_description__icontains=query)
        
        if processo:
            candidates = candidates.filter(document_type_std__processo=processo)
        
        if obrigatorio:
            candidates = candidates.filter(docobrigatorio=obrigatorio)
        
            


        # Paginação
        paginator = CustomPagination()
        paginated_queryset = paginator.paginate_queryset(candidates, request)

        # Serializando os dados
        serializer = self.get_serializer(paginated_queryset, many=True)
        for data in serializer.data:
            std = DocumentTypeStd.objects.get(pk=data['document_type_std'])
            data['processo'] = std.processo
       

        return paginator.get_paginated_response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def busca(self, request, *args, **kwargs):
        query = request.query_params.get('query', '')
        queryset = self.filter_queryset(self.get_queryset())
        if query:
            queryset = queryset.filter(document_type_std__empresa = request.user.empresa)
            queryset = queryset.filter(Q(type_description__icontains=query) | Q(short_description__icontains=query))
            queryset = queryset.filter(situacao_id = 200)
        else:
            queryset = queryset.filter(empresa = request.user.empresa, situacao_id=200)[:10]

        serializer = self.get_serializer(queryset, many=True)

        data = serializer.data
                
        return Response(data)


class camposViewSet(ExportMixin,viewsets.ModelViewSet):
    """
    API endpoint that allows ger_grupoprodutos to be viewed, edited or created.
    """

    queryset = DocumentTypesFields.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = camposSerializer
    # def get_serializer_class(self):
    #     if self.action == 'exportar_dados':
    #         return ExportVagasSerializer
    #     return vagasSerializer

     # Return data for edit in transportadora-list)
    
    def retrieve(self, request, pk=None):
        try:
            condicao = DocumentTypesFields.objects.get(pk=pk, empresa = request.user.empresa)
        except DocumentTypesFields.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)

        serializer = self.get_serializer(condicao)
        return Response(serializer.data)
    
    # Edit data
    def partial_update(self, request, pk=None):
        try:
            condicao = DocumentTypesFields.objects.get(pk=pk, empresa = request.user.empresa)
        except DocumentTypesFields.DoesNotExist:
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
        instance.dtExclusao = timezone.now()
        
        # Defina status como 9000
        instance.situacao_id = 9000

        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=False, methods=['post'])
    def filtragem_campos(self, request, *args, **kwargs):
        # Acessando os dados enviados na requisição
        data = request.data
        doc = request.GET.get('doc')
        print("doc", doc)
        # Extraindo os valores dos dados
        # status = data.get('status')
        # query = data.get('search-candidatos')
        # vaga = data.get('vaga')
        # unidade = data.get('unidade')
        # print("Query", query)


        # Filtrando o queryset com base nos valores recebidos
        try:
            candidates = DocumentTypesFields.objects.filter(empresa=request.user.empresa, situacao_id=200, document_type=doc).order_by('-dtCadastro')
        except DocumentTypesFields.DoesNotExist:
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
        paginator = CustomPaginationCadastros()
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
            queryset = queryset.filter(Q(candidate__icontains=query) | Q(phone__icontains=query) | Q(cpf__icontains=query))
            queryset = queryset.filter(situacao_id__isnull=True)
        else:
            queryset = queryset.filter(empresa = request.user.empresa, situacao_id__isnull=True)[:10]

        serializer = self.get_serializer(queryset, many=True)

        data = serializer.data
                
        return Response(data)


# Lista de modelos permitidos para exportação (Nome do Modelo como string)
# Adicione ou remova modelos conforme necessário
ALLOWED_EXPORT_MODELS = [
    'recrutamento.vagas',
    'recrutamento.Candidates',
    'recrutamento.Applications',
    'recrutamento.Documents',
    'recrutamento.DocumentTypes',
    'recrutamento.CandidateStatus',
    'recrutamento.DocumentStatus',
    'recrutamento.DocumentReasons',
    'recrutamento.DocumentTypeStd',
    'recrutamento.DocumentTypesFields',
    'ger_empresas.ger_unidade' # Verifique se 'ger_empresas' é o app correto para ger_unidade
    # Adicione outros modelos sempre no formato 'app_label.ModelName'
]

# Formatos de exportação suportados
SUPPORTED_EXPORT_FORMATS = ['pdf', 'xls', 'csv', 'xml']


class UniversalExportView(viewsets.ModelViewSet): # Alterado de ModelViewSet para APIView, pois não usamos ações padrão do ViewSet aqui
    """
    Endpoint universal para exportação de dados de modelos permitidos.
    Recebe via POST:
    - model_name: Nome do modelo Django (string).
    - export_format: Formato desejado ('pdf', 'xls', 'csv', 'xml').
    - fields: Lista de nomes dos campos a exportar (list of strings).
    - field_labels (opcional): Dicionário mapeando nomes de campos para labels desejados (dict).
    - filters (opcional): Dicionário JSON para filtros (dict).
    """
    permission_classes = [permissions.IsAuthenticated]

    # Removido @action, pois agora é uma APIView padrão
    @action(detail=False, methods=['post'])
    def exporta(self, request, *args, **kwargs):
        try:
            # 1. Obter e validar parâmetros básicos
            data = request.data
            model_name = data.get('model_name')
            export_format = data.get('export_format', '').lower()
            fields = data.get('fields')
            # Obter os labels (novo parâmetro)
            field_labels = data.get('field_labels', {})
            filters_param = data.get('filters', {})

            if not all([model_name, export_format, fields]):
                return Response(
                    {"error": "Parâmetros 'model_name', 'export_format' e 'fields' são obrigatórios."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if not isinstance(fields, list) or not all(isinstance(f, str) for f in fields):
                 return Response(
                    {"error": "Parâmetro 'fields' deve ser uma lista de strings."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Validar field_labels (deve ser um dicionário)
            if not isinstance(field_labels, dict):
                 return Response(
                    {"error": "Parâmetro 'field_labels' deve ser um dicionário."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # 2. Validar Model Name
            if model_name not in ALLOWED_EXPORT_MODELS:
                return Response(
                    {"error": f"Modelo '{model_name}' não é permitido para exportação."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # 3. Validar Export Format
            if export_format not in SUPPORTED_EXPORT_FORMATS:
                return Response(
                    {"error": f"Formato de exportação '{export_format}' não suportado. Use um de: {', '.join(SUPPORTED_EXPORT_FORMATS)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # 4. Obter o Modelo Django
            try:
                app_label, model_name = model_name.split('.')  # Separa app e modelo
                model = apps.get_model(app_label=app_label, model_name=model_name)
            except ValueError:
                return Response(
                    {"error": "Formato inválido para model_name. Use 'app_label.model_name'."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            except LookupError:
                return Response(
                    {"error": f"Modelo '{model_name}' não encontrado no app '{app_label}'."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # invalid_fields = [f for f in fields if f not in model_fields] # Código removido
            # if invalid_fields: # Código removido
            #     return Response( # Código removido
            #         {"error": f"Campos inválidos para o modelo '{model_name}': {', '.join(invalid_fields)}"}, # Código removido
            #         status=status.HTTP_400_BAD_REQUEST # Código removido
            #     ) # Código removido

            # 6. Processar e Validar Filtros
            filters = {}
            if isinstance(filters_param, str):
                try:
                    filters = json.loads(filters_param)
                except json.JSONDecodeError:
                    return Response(
                        {"error": "Parâmetro 'filters' não é um JSON válido."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            elif isinstance(filters_param, dict):
                filters = filters_param
            else:
                 return Response(
                    {"error": "Parâmetro 'filters' deve ser um dicionário ou uma string JSON."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Validar chaves dos filtros contra os campos do modelo
            # invalid_filter_keys = [k for k in filters.keys() if k not in model_fields]
            # if invalid_filter_keys:
            #      return Response(
            #         {"error": f"Chaves de filtro inválidas para o modelo '{model_name}': {', '.join(invalid_filter_keys)}"},
            #         status=status.HTTP_400_BAD_REQUEST
            #     )

            # 7. Construir e Filtrar Queryset
            # ... (lógica de filtragem como antes) ...
            queryset = model.objects.all() # Simplificado para exemplo
            if hasattr(model, 'empresa') and hasattr(request.user, 'empresa'):
                 queryset = queryset.filter(empresa=request.user.empresa)
            if hasattr(model, 'document_type_std') and not hasattr(model, 'empresa'):
                queryset = queryset.filter(document_type_std__empresa=request.user.empresa)
            if hasattr(model, 'situacao_id'):
                 queryset = queryset.filter(Q(situacao_id=200) | Q(situacao_id__isnull=True))
            if hasattr(model, 'dtexclusao'):
                 queryset = queryset.filter(dtexclusao__isnull=True)
            if hasattr(model, 'statusregistro_id'):
                queryset = queryset.filter(statusregistro_id=200)

            if filters:
                try:
                    queryset = queryset.filter(**filters)
                except Exception as e:
                     return Response({"error": f"Erro ao aplicar filtros: {e}"}, status=status.HTTP_400_BAD_REQUEST)

            # 8. Selecionar os dados (usando values para eficiência)
            # Usar values() para obter dicionários
            data_to_export = list(queryset.values(*fields))

            # 9. Preparar Cabeçalhos (usando field_labels se fornecido)
            # Mantém a ordem original dos 'fields'
            headers = [field_labels.get(f, f) for f in fields] # Usa o label ou o nome técnico

            # 10. Gerar e Retornar o Arquivo
            filename = f"{model_name}_export_{timezone.now().strftime('%Y%m%d_%H%M%S')}"

            # Usar pandas para simplificar CSV e Excel
            if export_format in ['csv', 'xls']:
                # Criar DataFrame com nomes técnicos primeiro
                df = pd.DataFrame(data_to_export, columns=fields)
                # Renomear colunas usando o mapeamento field_labels
                # Apenas renomeia as colunas presentes em field_labels
                df.rename(columns=field_labels, inplace=True)

                buffer = BytesIO()

                if export_format == 'csv':
                    df.to_csv(buffer, index=False, sep=';', encoding='utf-8-sig') # utf-8-sig para compatibilidade Excel
                    content_type = 'text/csv'
                    filename += '.csv'
                else: # xls (usando openpyxl como engine)
                    df.to_excel(buffer, index=False, engine='openpyxl')
                    content_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                    filename += '.xlsx'

                buffer.seek(0)
                response = HttpResponse(buffer.getvalue(), content_type=content_type)
                response['Content-Disposition'] = f'attachment; filename="{filename}"'
                return response

            elif export_format == 'pdf':
                # Reutilizar/Adaptar lógica do ExportMixin ou implementar com reportlab/xhtml2pdf
                # Exemplo simples com xhtml2pdf (requer template 'pdf/generic_export.html')
                template_path = 'pdf/generic_export.html'
                # Passar os headers já com os labels corretos
                context = {
                    'headers': headers, # Já contém os labels na ordem correta
                    'rows': [ [item.get(f) for f in fields] for item in data_to_export ], # Garante a ordem
                    'title': f'Relatório de {model_name}'
                }
                try:
                    template = get_template(template_path)
                    html = template.render(context)
                    response = HttpResponse(content_type='application/pdf')
                    response['Content-Disposition'] = f'attachment; filename="{filename}.pdf"'
                    pisa_status = pisa.CreatePDF(html, dest=response, encoding='UTF-8')
                    if pisa_status.err:
                        raise Exception(f'Erro ao gerar PDF: {pisa_status.err}')
                    return response
                except Exception as e:
                     return Response(
                        {"error": f"Erro ao gerar PDF: {e}"},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )


            elif export_format == 'xml':
                # Usar xml.etree.ElementTree ou dicttoxml
                root = ET.Element(slugify(model_name) + "s") # Nome raiz sanitizado
                for item_dict in data_to_export:
                    item_elem = ET.SubElement(root, slugify(model_name)) # Nome do item sanitizado
                    # Iterar sobre os fields originais para manter a ordem e usar labels
                    for field_name in fields:
                        label = field_labels.get(field_name, field_name)
                        # Sanitizar o label para ser um nome de tag XML válido
                        tag_name = slugify(label).replace('-', '_')
                        if not tag_name: # Se o slugify resultar em vazio, use o nome técnico
                            tag_name = slugify(field_name).replace('-', '_')
                        if not tag_name: # Fallback final
                            tag_name = 'campo'

                        field_value = item_dict.get(field_name)
                        text_value = str(field_value) if field_value is not None else ''
                        ET.SubElement(item_elem, tag_name).text = text_value

                buffer = BytesIO()
                try:
                    tree = ET.ElementTree(root)
                    tree.write(buffer, encoding='utf-8', xml_declaration=True)
                    buffer.seek(0)
                    response = HttpResponse(buffer.getvalue(), content_type='application/xml')
                    response['Content-Disposition'] = f'attachment; filename="{filename}.xml"'
                    return response
                except Exception as e:
                    return Response(
                        {"error": f"Erro ao gerar XML: {e}"},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )

            return Response({"error": "Erro interno ao processar formato."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except FieldDoesNotExist as e:
             return Response(
                {"error": f"Erro de campo: {e}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            # Logar o erro real em produção
            print(f"Erro inesperado na exportação: {e}") # Log simplificado
            return Response(
                {"error": f"Ocorreu um erro interno no servidor durante a exportação: {e}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# --- Fim da adição ---