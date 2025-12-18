from httpx import AsyncClient
from django.http import JsonResponse
import asyncio
from boomerangue.apps.bot.models import Bot
from asgiref.sync import sync_to_async
import json
COMUNICA_BASE_URL = 'https://api.boomerangue.co'
from rest_framework import status
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MAX_RETRIES = 6
RETRY_INTERVAL = 10  # seconds

@sync_to_async
def alterar_bot_ativo(instance_name, ativo: str = 'S'):
  bot = Bot.objects.get(EDI_Integracao=instance_name)
  bot.bot_ativo = ativo
  bot.save()

@sync_to_async
def get_api_key(instance_name):
  bot = Bot.objects.get(EDI_Integracao=instance_name)
  return bot.api_key


async def build_headers(instance_name):
  api_key = await get_api_key(instance_name)
  return {'Authorization': f'Bearer {api_key}'} 

async def get_connection_state(request, instance_name):
  provider = 'evl'
  url = f'{COMUNICA_BASE_URL}/{provider}/instances/connection-state/'
  headers = await build_headers(instance_name)
  body = { "instance_name": instance_name }
  retries = 0
  while retries <= MAX_RETRIES:
    try:
      async with AsyncClient() as client:
        response = await client.post(url, json=body, headers=headers)
        
        if response.status_code == 200:
          data = response.json()          
          if data.get('connected', False):
            await alterar_bot_ativo(instance_name)
            return JsonResponse(data)
        else:
          raise Exception(f"Request failed with status code {response.status_code}")
    except Exception as e:
      print(f"Error during request: {e}")

      # Sleep for the retry interval before the next attempt
    await asyncio.sleep(RETRY_INTERVAL)
    retries += 1

  # Return a JsonResponse with connected set to False after all retries
  return JsonResponse({'connected': False})
  
async def connect_instance(request, instance_name):
  provider = 'evl'
  url = f'{COMUNICA_BASE_URL}/{provider}/instances/connect/'
  print("URL", url)
  headers = await build_headers(instance_name)
  body = { "instance_name": instance_name }
  print("HEADER", headers)
  return await post(url, body, headers=headers)

async def disconnect_instance(request, instance_name):
  if request.method != 'DELETE':
    return JsonResponse({"error": "Invalid method"})
  provider = 'evl'
  url = f'{COMUNICA_BASE_URL}/{provider}/instances/disconnect/{instance_name}/'
  headers = await build_headers(instance_name)
  data:dict = await delete(url, headers)
  if data.get("disconnected", False):
    await alterar_bot_ativo(instance_name, ativo='N')
  return JsonResponse(data)

      
async def restart_instance(request, instance_name):
  provider = 'evl'
  url = f'{COMUNICA_BASE_URL}/{provider}/instances/restart/'
  api_key = get_api_key(instance_name)
  headers = {'Authorization': f'Bearer {api_key}'}
  body = { "instance_name": instance_name }
  return await post(url, body, headers=headers)

async def get(url, headers=None):
  async with AsyncClient() as client:
    response = await client.get(url)
    if response.status_code in [200, 201]:
      data = response.json()
      return JsonResponse(data)
    else:
      raise Exception(f"Request failed with status: {response.status_code}")

async def post(url, body, headers=None):
  async with AsyncClient() as client:
    response = await client.post(url, json=body, headers=headers, timeout=30)
    if response.status_code == 200:
      data = response.json()
      return JsonResponse(data)
    else:
      raise Exception(f"Request failed with status: {response.status_code}")


async def delete(url, headers):
  async with AsyncClient() as client:
    response = await client.delete(url, headers=headers)
    try:
      data = response.json()
      print(data)
    except json.decoder.JSONDecodeError:
      return {"error": "Invalid JSON response"}
    if not data.get('error', False):
      data = response.json()
      return data
    else:
      raise Exception(f"Request failed with status: {response.status_code}")

async def send_text(request, instance_name):
  if request.method != "POST":
    return JsonResponse({"error": "method invalid"}, status=status.HTTP_405_METHOD_NOT_ALLOWED)
  logger.info("COMEÇANDO ENVIO")
  data: dict = json.loads(request.body)
  provider = data.get("provider", "evl")
  number = data.get("number", None)
  text_message = data.get("text_message")
  headers = await build_headers(instance_name)
  url = f'{COMUNICA_BASE_URL}/messages/send-text'
  body = {
    "number": number,
    "text": text_message,
    'provider':provider,
    'instance': instance_name
  }
  
  async with AsyncClient() as client:
    response = await client.post(url, json=body, headers=headers, timeout=30)
    if response.status_code == 200:
      data = response.json()
      return JsonResponse({"success": "Mensagem Enviada!"}, status=status.HTTP_200_OK)
    else:
      return JsonResponse({"error": "Erro ao enviar mensagem"}, status=status.HTTP_400_BAD_REQUEST) 
      
async def send_image(request, instance_name):
  provider = 'evl'
  url = f'{COMUNICA_BASE_URL}/{provider}/messages/send-image/{instance_name}'
  body = { # sample
    "number": "5547992645220",
    "options": {
      "delay": 1200,
      "presence": "composing"
    },
    "mediaMessage": {
      "mediatype": "image",
      "caption": "Enviado via Bot Boomerangue",
      "media": "https://evolution-api.com/files/evolution-api.jpg"
    }
  }
  return await post(url, body)
