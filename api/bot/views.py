import datetime
from rest_framework import viewsets, exceptions
from rest_framework import permissions
from rest_framework import status
from rest_framework.response import Response
from boomerangue.apps.bot.models import Bot
from .seriealizers import BotSerializer
import requests
from ..comunica.views import COMUNICA_BASE_URL
import json
from django.http import JsonResponse
import logging
from asgiref.sync import sync_to_async, async_to_sync

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BotViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows Bot to be viewed, edited or created.
    """

    queryset = Bot.objects.all()
    serializer_class = BotSerializer
    permission_classes = [permissions.IsAuthenticated]

    # Return data for edit in transportadora-list
    def retrieve(self, request, pk=None):
        try:
            condicao = Bot.objects.get(pk=pk)
        except Bot.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)

        serializer = self.get_serializer(condicao)
        return Response(serializer.data)

    def partial_update(self, request, pk=None):
        try:
            condicao = Bot.objects.get(pk=pk)
        except Bot.DoesNotExist:
            return Response({"error": "Item not found."}, status=status.HTTP_404_NOT_FOUND)
        data: dict = request.data
        webhook_ativo = str(data.get("webhook_ativo"))
        if data.get('bot_padrao') == 'S':
            if Bot.objects.filter(empresa=request.user.empresa, statusregistro_id=200, bot_padrao = 'S').exists():
                bot_atual = Bot.objects.get(empresa=request.user.empresa, statusregistro_id=200, bot_padrao = 'S')
                bot_atual.bot_padrao = 'N'
                bot_atual.save()
        serializer = self.get_serializer(condicao, data=data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        _comunica = False
        if str(condicao.webhook_ativo) != webhook_ativo or condicao.webhook_ativo_evento != data.get("webhook_ativo_evento", "N"):
            ## _comunica -> Para ver se precisa chamar o set_webhook
            _comunica = True
        serializer.save()
        if _comunica:
            logger.info("ENTROU")
            set_webhook = self.set_webhook(data, condicao)
            logger.info(set_webhook)
            if set_webhook.status_code != 200:
                return JsonResponse({"error": "Failed to set webhook"})
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        headers = {
            'Content-Type': 'application/json', 
            'Authorization': f'Bearer {instance.api_key}'
        }
        instance_deleted = requests.delete(
            url=f"{COMUNICA_BASE_URL}/evl/instances/delete/{instance.EDI_Integracao}/",
            headers=headers
            )
        if instance_deleted.status_code != 204 and instance.bot_provedor.provedor_padrao == 'EVL':
            raise exceptions.ValidationError(detail="Couldn't delete")       
        instance.exclusao_dt = datetime.datetime.now()
        instance.statusregistro_id = 9000
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @sync_to_async
    def get_api_key(self, instance_name):
        bot = Bot.objects.get(EDI_Integracao=instance_name)
        return bot.api_key


    async def build_headers(self, instance_name):
        api_key = await self.get_api_key(instance_name)
        return {'Authorization': f'Bearer {api_key}'} 
    
    @async_to_sync
    async def set_webhook(self, data: dict, condicao): 
        webhook_ativo = data.get("webhook_ativo")
        headers = await self.build_headers(condicao.EDI_Integracao)
        webhook_ativo = data.get("webhook_ativo")
        body = {
            "instance_name": condicao.EDI_Integracao,
            "provider": "evl",
            "enabled": True if webhook_ativo == "S" else False,
            "url": f"{COMUNICA_BASE_URL}/webhook?provider=evl&source=whatsapp&number={condicao.bot_numero}&retransmit={'yes' if webhook_ativo == 'S' else 'no'}",
            "webhookByEvents": True if data.get("webhook_ativo_evento") == "S" else False,
            "events": [
                "MESSAGES_UPSERT",
                "MESSAGES_UPDATE",
                "SEND_MESSAGE",
            ]
        }
        set_webhook = requests.post(f"{COMUNICA_BASE_URL}/set-webhook/", headers=headers, json=body)
        logger.info(set_webhook)
        return set_webhook
