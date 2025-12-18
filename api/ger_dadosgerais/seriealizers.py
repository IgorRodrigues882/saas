from rest_framework import serializers

from boomerangue.apps.ger_dadosgerais.models import ger_transportadora, ger_vendedores, ger_cidade, ger_marcas


class CreateTransportadoraSerializer(serializers.ModelSerializer):
    class Meta:
        model = ger_transportadora
        fields = "__all__"
        # exclude = ["id"]

    def create(self, validated_data):
        # Obtenha o usuário autenticado a partir do contexto
        user = self.context['request'].user

        # Agora você pode usar 'user' para obter a empresa do usuário
        empresa_do_usuario = user.empresa  # Certifique-se de adaptar isso à sua lógica de modelo

        # Vincule a campanha à empresa do usuário antes de criar
        validated_data['empresa'] = empresa_do_usuario

        return ger_transportadora.objects.create(**validated_data)
    

class CreateVendedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = ger_vendedores
        fields = "__all__"
        # exclude = ["id"]

    def create(self, validated_data):
        # Obtenha o usuário autenticado a partir do contexto
        user = self.context['request'].user

        # Agora você pode usar 'user' para obter a empresa do usuário
        empresa_do_usuario = user.empresa  # Certifique-se de adaptar isso à sua lógica de modelo

        # Vincule a campanha à empresa do usuário antes de criar
        validated_data['empresa'] = empresa_do_usuario

        return ger_vendedores.objects.create(**validated_data)
    
    

class VendedorPorCSVSerializer(serializers.ModelSerializer):
    class Meta:
        model = ger_vendedores
        fields = "__all__"
    
class GetCidadeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ger_cidade
        fields = "__all__"
        
    def create(self, validated_data):
        """
        Create and return a new Campaign instance, given the validated data.
        """
        return ger_cidade.objects.create(**validated_data)


class CreateMarcasSerializer(serializers.ModelSerializer):
    class Meta:
        model = ger_marcas
        fields = "__all__"
        # exclude = ["id"]

    def create(self, validated_data):
        """
        Create and return a new Campaign instance, given the validated data.
        """
        return ger_marcas.objects.create(**validated_data)