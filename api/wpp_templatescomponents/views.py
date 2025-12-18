from rest_framework import viewsets
from rest_framework import status
from rest_framework import permissions
import datetime
import re
from rest_framework.decorators import action
from rest_framework.response import Response
from boomerangue.apps.wpp_templatescomponents.models import wpp_templatescomponents, termos_sendpulse_troca, fluxo_sendpulse
from boomerangue.apps.wpp_templates.models import callToAction, wpp_templates
from .seriealizers import WPPTemplateComponenetsSerializer, termos_sendpulse_trocaSerializer, fluxo_sendpulseSerializer


class WPPTemplateComponenetsViewSet(viewsets.ModelViewSet):
    queryset = wpp_templatescomponents.objects.all()
    serializer_class = WPPTemplateComponenetsSerializer
    permission_classes = [permissions.IsAuthenticated]

    # Return data for edit in transportadora-list

    def create(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            if serializer.validated_data['possui_qrcode_pix'] == 'S':
                existing_component = wpp_templatescomponents.objects.filter(
                    template=serializer.validated_data['template'], 
                    possui_qrcode_pix='S',
                    statusregistro_id = 200
                )
                if existing_component.exists():
                    return Response({"error": "Já existe um componente com qrcode pix marcado."}, status=status.HTTP_400_BAD_REQUEST)
                # if serializer.validated_data['image_content'] and existing_component.exists():
                #     return Response({"error": "Existe um componente com qrcode marcado. A imagem que será enviada será a do qrcode"}, status=status.HTTP_400_BAD_REQUEST)
            # Antes de salvar, verifique se o template possui uma 'call to action'
                # Se possuir, marque todas as ações associadas como não processadas
            if callToAction.objects.filter(template_resposta=serializer.validated_data['template'].pk).exists():
                call = callToAction.objects.filter(template_resposta=serializer.validated_data['template'].pk)
                for action in call:
                        action.processada = 'N'
                        action.save()
            # Salve o novo objeto
            template = wpp_templates.objects.get(pk = serializer.validated_data['template'].pk)
            if template.processada_ajuste_resposta =="S":
                template.processada_ajuste_resposta = 'N'
                template.save()
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def retrieve(self, request, pk=None):
        try:
            condicao = wpp_templatescomponents.objects.get(pk=pk)
        except wpp_templatescomponents.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)

        serializer = self.get_serializer(condicao)
        return Response(serializer.data)
    
    # Edit data
    def partial_update(self, request, pk=None):
        try:
            condicao = wpp_templatescomponents.objects.get(pk=pk)
            print("condição",condicao)
        except wpp_templatescomponents.DoesNotExist:
            return Response({"error": "Item not found."}, status=status.HTTP_404_NOT_FOUND)
        if condicao.template.processada_ajuste_resposta == 'S':
            condicao.template.processada_ajuste_resposta = 'N'
            condicao.template.save()
        if callToAction.objects.filter(template_resposta=condicao.template.pk).exists():
            call = callToAction.objects.filter(template_resposta=condicao.template.pk)
            for action in call:
                action.processada = 'N'
                action.save()
        
        serializer = self.get_serializer(condicao, data=request.data, partial=True)
        print('serielazie',serializer)
        if serializer.is_valid():
            if serializer.validated_data.get('possui_qrcode_pix') == 'S':
                existing_component = wpp_templatescomponents.objects.filter(
                    template=serializer.validated_data['template'], 
                    possui_qrcode_pix='S',
                    statusregistro_id = 200
                ).exclude(pk=pk)
                if existing_component.exists():
                    return Response({"error": "Já existe um componente com qrcode pix marcado."}, status=status.HTTP_400_BAD_REQUEST)
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
    def busca_texto_padrao(self, request):
        template_id = request.data.get('id')
        print("Template", template_id)
        try:
            ordem_componentes = ['HEADER', 'BODY', 'FOOTER', 'BUTTONS', 'LIST']
            mensagem = ''
            for ordem in ordem_componentes:
                templates = wpp_templatescomponents.objects.filter(template_id=template_id, component_type=ordem)
                print("Templates", templates)
                for template in templates:
                    mensagem += template.text_content + '\n'
                    print("Mensagem", mensagem)
            texto_padrao = mensagem
            return Response({"texto_padrao": texto_padrao})
        except wpp_templatescomponents.DoesNotExist:
            return Response({"error": "Template not found."}, status=status.HTTP_404_NOT_FOUND)
    

class WPPTemplateComponenets_retorno_ViewSet(viewsets.ModelViewSet):
    queryset = wpp_templatescomponents.objects.all()
    serializer_class = WPPTemplateComponenetsSerializer
    permission_classes = [permissions.IsAuthenticated]

    # Return data for edit in transportadora-list
    def retrieve(self, request, pk=None):
        try:
            condicao = wpp_templatescomponents.objects.filter(template=pk, statusregistro_id=200)
        except wpp_templatescomponents.DoesNotExist:
            return Response({"error": "Item not found."}, status=status.HTTP_404_NOT_FOUND)

        if condicao.exists():
            serializer = self.get_serializer(condicao, many=True)
            dados = serializer.data
            for i, index in enumerate(condicao):
                dados[i]['id_sendpulse'] = index.template.id_sendpulse  # Add id_sendpulse to each dictionary in 'dados'
            return Response(dados)  # Return the updated 'dados' dictionary
        else:
            return Response({"error": "Item not found."}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['post'])
    def send_pulse(self, request):
        id = request.data.get('id')
        component = wpp_templatescomponents.objects.get(id = id)
        terms = []
        if termos_sendpulse_troca.objects.filter(component=component).exists():
            termos_db = termos_sendpulse_troca.objects.filter(component=component)
            terms = [{'termo_troca': termo.termo_troca, 'termo': termo.termo_sendpulse} for termo in termos_db] 
        if component.text_content:
            print(component.text_content)
            terms_text_content = [f'{{{{{term}}}}}' for term in re.findall(r'{{(.*?)}}', component.text_content)]

            # Adicionar termos de component.text_content que não estão no banco de dados à lista de termos
            for term in terms_text_content:
                if term not in [t['termo'] for t in terms]:
                    terms.append({'termo_troca': '', 'termo': term})
        if terms:
            return Response({"data": terms})
        else:
            return Response({"error": 'Esse template não possuí termos'})




class termos_sendpulse_trocaViewSet(viewsets.ModelViewSet):
    queryset = termos_sendpulse_troca.objects.all()
    serializer_class = termos_sendpulse_trocaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        component_id = request.data.get('component')
        termo_sendpulse = request.data.get('termo_sendpulse')
        termo_troca = request.data.get('termo_troca')
        # Verificar se já existe um termo_sendpulse_troca com o mesmo component e termo_sendpulse
        termo = termos_sendpulse_troca.objects.filter(component=component_id, termo_sendpulse=termo_sendpulse).first()
        if termo:
            # Se existir, atualizar o termo_troca
            termo.termo_troca = termo_troca
            termo.save()
        else:
            # Se não existir, criar um novo termo_sendpulse_troca
            termo = termos_sendpulse_troca.objects.create(
                component_id=component_id,
                termo_sendpulse=termo_sendpulse,
                termo_troca=termo_troca
            )

        serializer = self.get_serializer(termo)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    # Return data for edit in transportadora-list
    def retrieve(self, request, pk=None):
        try:
            condicao = termos_sendpulse_troca.objects.get(pk=pk)
        except termos_sendpulse_troca.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)

        serializer = self.get_serializer(condicao)
        return Response(serializer.data)
    


class fluxo_sendpulseViewSet(viewsets.ModelViewSet):
    queryset = fluxo_sendpulse.objects.all()
    serializer_class = fluxo_sendpulseSerializer
    permission_classes = [permissions.IsAuthenticated]

    # Return data for edit in transportadora-list
    def retrieve(self, request, pk=None):
        try:
            condicao = fluxo_sendpulse.objects.get(component=pk)
        except fluxo_sendpulse.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)

        serializer = self.get_serializer(condicao)
        return Response(serializer.data)
    
    def create(self, request, *args, **kwargs):
        # Assuming the data contains a unique field 'id' or 'pk' to check for existence
        id = request.data.get('component')
        print(id)
        try:
            instance = fluxo_sendpulse.objects.get(component=id)
            print("entrou aqui", instance)
            serializer = self.get_serializer(instance, data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return Response(serializer.data)
        except fluxo_sendpulse.DoesNotExist:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

    def perform_update(self, serializer):
        serializer.save()

    def perform_create(self, serializer):
        serializer.save()

    