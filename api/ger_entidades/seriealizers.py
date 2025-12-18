from rest_framework import serializers

from boomerangue.apps.ger_entidades.models import ger_entidade
from boomerangue.apps.ger_dadosgerais.models import ger_pais, ger_cidade, ger_uf


class CreateEntidadeSerializer(serializers.ModelSerializer):
    cidade_nome = serializers.CharField(source='cidade.Cidade', read_only=True)
    uf_sigla = serializers.CharField(source='uf.sigla', read_only=True)

    class Meta:
        model = ger_entidade
        fields = "__all__"  # Inclui todos os campos do modelo
        extra_fields = ['cidade_nome', 'uf_sigla']  # Inclui os novos campos no serializer

    def create(self, validated_data):
        # Obtenha o usuário autenticado a partir do contexto
        return ger_entidade.objects.create(**validated_data)


class CoordinatesSerializer(serializers.ModelSerializer):
    cidade_nome = serializers.CharField(source='cidade.Cidade', read_only=True)
    uf_sigla = serializers.CharField(source='uf.sigla', read_only=True)

    class Meta:
        model = ger_entidade
        fields = [
            'id', 'Entidade', 'CNPJ', 'CliLatitude', 'CliLongitude',
            'Telefone1', 'cidade_nome', 'uf_sigla', 'CEP','Bairro','Endereco'
            # Adicione outros campos específicos necessários para esta função
         ]

