from channels.generic.websocket import AsyncWebsocketConsumer
import json
from django.core.cache import cache
from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


class MessageConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'chat_{self.room_name}'
        
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message
            }
        )

    async def chat_message(self, event):
        message = event['message']
        await self.send(text_data=json.dumps({
            'message': message
        }))

    async def send_new_message_notification(self, event):
        message = event['data']
        payload = {
            'total_mensagens': message.get('total_mensagens'),
            'MensagemTexto': message.get('MensagemTexto'),
            'DataHoraDoEvento': message.get('DataHoraDoEvento'),
            'direcao': message.get('direcao'),
            'complemento1': message.get('complemento1'),
            'evento2': message.get('evento2'),
            'URL_Anexo': message.get('URL_Anexo'),
            'nome_anexo': message.get('nome_anexo'),
            'entidade_id': message.get('entidade_id'),
            'sender': message.get('sender')
        }
        
        await self.send(text_data=json.dumps(payload))
    

    async def return_validation(self, event):
        response = event['response']
        await self.send(text_data=json.dumps({
            'response': response
        }))