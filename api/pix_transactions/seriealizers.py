from rest_framework import serializers

from boomerangue.apps.pix_transactions.models import SolicitacaoPagamento 


class SolicitacaoPagamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = SolicitacaoPagamento 
        fields = "__all__"
        # exclude = ["id"]