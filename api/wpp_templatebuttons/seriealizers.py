from rest_framework import serializers

from boomerangue.apps.wpp_templatebuttons.models import wpp_templatebuttons


class WPPTemplateButtonsSerializer(serializers.ModelSerializer):
    class Meta:
        model = wpp_templatebuttons
        fields = "__all__"
        exclude = ["id"]
