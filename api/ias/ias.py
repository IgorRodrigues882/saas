
import openai
from django.conf import settings

def chat_gpt(prompt, modelo = None, tokens = None):
    if not modelo:
        modelo = 'gpt-4o-mini'
    if not tokens:
        tokens = 800
    openai.api_key = settings.OPEN_IA_GPT_API_KEY
    response = openai.ChatCompletion.create(
            model=modelo,
            messages=[
                    {"role": "user", "content": prompt}
                ],
                max_tokens=tokens  # Ajuste conforme necessário
    )

    chatbot_response = response['choices'][0]['message']['content']
    quant_tokens = response['usage']['total_tokens']
    return chatbot_response, quant_tokens