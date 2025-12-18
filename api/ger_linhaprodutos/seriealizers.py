from rest_framework import serializers

from boomerangue.apps.ger_linhaprodutos.models import ger_linhaprodutos


class GerLinhaProdutosSerializer(serializers.ModelSerializer):
    class Meta:
        model = ger_linhaprodutos
        fields = '__all__'

    def create(self, validated_data):
        # Obtenha o usuário autenticado a partir do contexto
        user = self.context['request'].user

        # Agora você pode usar 'user' para obter a empresa do usuário
        empresa_do_usuario = user.empresa  # Certifique-se de adaptar isso à sua lógica de modelo

        # Vincule a campanha à empresa do usuário antes de criar
        validated_data['empresa'] = empresa_do_usuario
        return ger_linhaprodutos.objects.create(**validated_data)
