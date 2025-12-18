from rest_framework import serializers

from boomerangue.apps.historico_vendas.models import historico_vendasimportado, bmm_historico


class historico_vendasSerializer(serializers.ModelSerializer):
    class Meta:
        model = historico_vendasimportado
        exclude = ["id"]


class historico_vendas(serializers.ModelSerializer):
    class Meta:
        model = bmm_historico
        exclude = ["id"]
 