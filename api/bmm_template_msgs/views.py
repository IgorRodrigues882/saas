from rest_framework import viewsets
from rest_framework import permissions
from rest_framework import filters
from rest_framework import status
from rest_framework.response import Response
import datetime
from django.shortcuts import get_object_or_404
from boomerangue.apps.bmm_template_msgs.models import bmm_template_msgs
from boomerangue.apps.wpp_templates.models import wpp_templates
from boomerangue.apps.campaign.models import bmm_template
from .serializers import BmmTemplateMsgsSerializer
from rest_framework.decorators import action

class BmmTemplateMsgsViewSet(viewsets.ModelViewSet):
    queryset = bmm_template_msgs.objects.all()
    serializer_class = BmmTemplateMsgsSerializer
    permission_classes = [permissions.IsAuthenticated]


    # Custom create method
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            template = serializer.validated_data['template']
            wpptemplate = serializer.validated_data['wpptemplate']
            if bmm_template_msgs.objects.filter(template=template, wpptemplate=wpptemplate,statusregistro_id=200).exists():
                return Response({"error": "Já existe uma template de mensagem assim."}, status=status.HTTP_400_BAD_REQUEST)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


    def retrieve(self, request, pk=None):
        # Use get_object_or_404 para simplificar o tratamento de exceções
        condicao = get_object_or_404(bmm_template_msgs, pk=pk)

        # Obtém o objeto wppt_templates relacionado
        wpptemplate_obj = condicao.wpptemplate

        # Serializa os dados do bmm_template_msgs
        serializer = self.get_serializer(condicao)
        data = serializer.data

        # Adiciona os dados do wppt_templates ao retorno
        data['wpptemplate'] = {
            'id': wpptemplate_obj.id,
            'template_name': wpptemplate_obj.template_name,
            'category': wpptemplate_obj.category,
            'language': wpptemplate_obj.language
            # Adicione outros campos conforme necessário
        }

        return Response(data)
    

    # Custom update method
    def patch(self, request, pk=None):
        try:
            condicao = bmm_template_msgs.objects.get(pk=pk)
        except bmm_template_msgs.DoesNotExist:
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


class retorna_mensagens_template(viewsets.ModelViewSet):
        queryset = bmm_template_msgs.objects.all()
        serializer_class = BmmTemplateMsgsSerializer
        permission_classes = [permissions.IsAuthenticated]
        filter_backends = [filters.SearchFilter]
        search_fields = ['']

        def list(self, request, *args, **kwargs):
            query = request.query_params.get('query', '')  # Obtém o parâmetro 'query' da solicitação
            id = request.query_params.get('id', '')
            queryset = self.filter_queryset(self.get_queryset())  # Aplica filtros, se houver

            if query:
                # Filtra os resultados com base na consulta do usuário
                queryset = queryset.filter(template = id, wpptemplate__template_name__icontains=query, statusregistro_id=200)

            else:
                queryset = queryset.filter(template = id, statusregistro_id=200).order_by('-cadastro_dt')[:5]

            serializer = self.get_serializer(queryset, many=True)
            data = []
            for item in serializer.data:
                # Obtém o ID do wpptemplate do item
                wpptemplate_id = item.get('wpptemplate', None)

                if wpptemplate_id is not None:
                    # Tenta obter o objeto wppt_templates usando o ID
                    try:
                        wpptemplate_obj = wpp_templates.objects.get(pk=wpptemplate_id)
                        template_name = wpptemplate_obj.template_name
                        categoria = wpptemplate_obj.category
                        language = wpptemplate_obj.language
                        wpp_id = wpptemplate_obj.pk
                    except wpp_templates.DoesNotExist:
                        template_name = None
                        print(f"Warning: wppt_templates com ID {wpptemplate_id} não encontrado.")
                else:
                    template_name = None
                    print(f"Warning: 'wpptemplate' não está presente para o item com id={item['id']}")

                data.append({
                    'id': item['id'],
                    'template_name': template_name,
                    'uso_template': item['usotemplate'],
                    'categoria': categoria,
                    'language': language,
                    'wpp_id':wpp_id
                })

            return Response(data)
