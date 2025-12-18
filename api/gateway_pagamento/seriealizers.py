from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from boomerangue.apps.gateway_pagamento.models import gateway_pagamento

class GatewayPagamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = gateway_pagamento
        fields = "__all__"
        # exclude = ["id"]
    def create(self, validated_data):
        # Obtenha o usuário autenticado a partir do contexto
        user = self.context['request'].user

        # Agora você pode usar 'user' para obter a empresa do usuário
        empresa_do_usuario = user.empresa  # Certifique-se de adaptar isso à sua lógica de modelo

        # Vincule a campanha à empresa do usuário antes de criar
        validated_data['empresa'] = empresa_do_usuario
        return gateway_pagamento.objects.create(**validated_data)