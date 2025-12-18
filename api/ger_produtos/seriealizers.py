from rest_framework import serializers

from boomerangue.apps.ger_produtos.models import ger_produtos


class GerProdutosSerializer(serializers.ModelSerializer):
    linha = serializers.CharField(source='LinhaProduto.LinhaProdutos', read_only=True)
    class Meta:
        model = ger_produtos
        exclude = ["id"]
        extra_fields = ['linha']
