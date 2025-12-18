from rest_framework import viewsets
from rest_framework import status
from rest_framework import permissions
from django.shortcuts import get_object_or_404
from rest_framework import filters
from rest_framework.response import Response
from boomerangue.apps.bmm_campanhas_msgs.models import bmm_campanhas_msgs
from boomerangue.apps.wpp_templates.models import wpp_templates
from .serializers import BmmCampanhasMsgsSerializer
from rest_framework.decorators import action

class BmmCampanhasMsgsViewSet(viewsets.ModelViewSet):
    queryset = bmm_campanhas_msgs.objects.all()
    serializer_class = BmmCampanhasMsgsSerializer

    permission_classes = [permissions.IsAuthenticated]

    # Custom create method
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            campanha = serializer.validated_data['campanha']
            wpptemplate = serializer.validated_data['wpptemplate']
            uso = serializer.validated_data['usotemplate']
            if bmm_campanhas_msgs.objects.filter(campanha=campanha, wpptemplate=wpptemplate, statusregistro_id=200).exists():
                return Response({"error": "Já existe uma template de mensagem assim."}, status=status.HTTP_400_BAD_REQUEST)
            if bmm_campanhas_msgs.objects.filter(campanha=campanha, usotemplate = uso, statusregistro_id=200).exists():
                return Response({"error": "Já existe um template com esse mesmo usotemplate"}, status=status.HTTP_400_BAD_REQUEST)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # Custom retrieve method
    def retrieve(self, request, pk=None):
        # Use get_object_or_404 para simplificar o tratamento de exceções
        condicao = get_object_or_404(bmm_campanhas_msgs, pk=pk)

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
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data)
        if serializer.is_valid():
            campanha = serializer.validated_data['campanha']
            uso = serializer.validated_data['usotemplate']
            if bmm_campanhas_msgs.objects.filter(campanha=campanha, usotemplate = uso, statusregistro_id=200).exclude(pk = instance.pk).exists():
                return Response({"error": "Já existe um template com esse mesmo usotemplate"}, status=status.HTTP_400_BAD_REQUEST)
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # Custom destroy method
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    # @action(detail=False, methods=['POST'])
    # def retorna_campanha(self, request):
    #     print('Cheueueueueueufhijodfnlskjdnfplsdnkfplksdmcklp´sdmiposdfs', request)
    #     try:
    #         condicao = bmm_campanhas_msgs.objects.filter(campanha=request.data['data'], statusregistro_id = 200)
    #         serializer = self.get_serializer(condicao, many=True)
    #         return Response(serializer.data)
    #     except Exception as e:
    #         print(e)
    #         return Response({'Error':'Msg não encontrada'}, status=404)



class retorna_nome_mensagens(viewsets.ModelViewSet):
        queryset = bmm_campanhas_msgs.objects.all()
        serializer_class = BmmCampanhasMsgsSerializer
        permission_classes = [permissions.IsAuthenticated]
        filter_backends = [filters.SearchFilter]
        search_fields = ['']
        # Return data for edit in transportadora-list
        def list(self, request, *args, **kwargs):
            query = request.query_params.get('query', '')  # Obtém o parâmetro 'query' da solicitação
            id = request.query_params.get('id', '')
            queryset = self.filter_queryset(self.get_queryset())  # Aplica filtros, se houver

            if query:
                # Filtra os resultados com base na consulta do usuário
                queryset = queryset.filter(campanha = id, wpptemplate__template_name__icontains=query, statusregistro_id=200).order_by('-cadastro_dt')

            else:
                queryset = queryset.filter(campanha = id, statusregistro_id=200).order_by('-cadastro_dt')[:20]

            serializer = self.get_serializer(queryset, many=True)
            data = []
            for item in serializer.data:
                # Obtém o ID do wpptemplate do item
                wpptemplate_id = item.get('wpptemplate', None)
                print(wpptemplate_id)
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
