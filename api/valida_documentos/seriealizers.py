from rest_framework import serializers

from boomerangue.apps.validacao_documentos.models import validacao_documentos


class validacao_documentosSerializer(serializers.ModelSerializer):
    class Meta:
        model = validacao_documentos
        fields = "__all__"
        exclude = ["id"]