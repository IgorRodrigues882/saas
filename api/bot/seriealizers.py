import requests
from rest_framework import serializers, exceptions
from django.utils.crypto import get_random_string
import json
from boomerangue.apps.bot.models import Bot
from ..comunica.views import COMUNICA_BASE_URL


class BotSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bot
        fields = "__all__"

    def create(self, validated_data):
        # Obtenha o usuário autenticado a partir do contexto
        try:
            user = self.context["request"].user

            # Agora você pode usar 'user' para obter a empresa do usuário
            empresa_do_usuario = user.empresa  # Certifique-se de adaptar isso à sua lógica de modelo

            # Vincule a campanha à empresa do usuário antes de criar
            validated_data["empresa"] = empresa_do_usuario
            if validated_data['bot_padrao'] == 'S':
                if Bot.objects.filter(empresa=empresa_do_usuario, statusregistro_id=200, bot_padrao = 'S').exists():
                    bot_atual = Bot.objects.get(empresa=empresa_do_usuario, statusregistro_id=200, bot_padrao = 'S')
                    bot_atual.bot_padrao = 'N'
                    bot_atual.save()

            cnpj = user.empresa.cnpj
            cnpj = cnpj.replace("/", "")
            cnpj = cnpj.replace(".", "")
            cnpj = cnpj.replace("-", "")

            validated_data["EDI_Integracao"] = cnpj
            
            validated_data["api_key"] = get_random_string(length=32)

            # Change EDI_Integracao to correct format
            bot_created = Bot.objects.create(**validated_data)

            bot_created.EDI_Integracao = f"{bot_created.EDI_Integracao}-{bot_created.id}"

            bot_created.save()
            print("Salvou o bot")
            body = { "instance_name": bot_created.EDI_Integracao }
            headers = {
                    'Content-Type': 'application/json', 
                    'Authorization': f'Bearer {bot_created.api_key}'
                    }
                        
            instance_created = requests.post(
                    url=f"{COMUNICA_BASE_URL}/evl/instances/create/",
                    json=body,
                    headers=headers
                )
            print("instae", instance_created.json(), instance_created.text)
            if instance_created.status_code != 201:
                print("Entrou create instace diferente de 200")
                bot_created.delete()
                raise exceptions.ValidationError(detail=instance_created.json())
            return bot_created
        except Exception as e:
            print("Erro ao criar o bot", e)