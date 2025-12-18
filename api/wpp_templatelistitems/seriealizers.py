from rest_framework import serializers

from boomerangue.apps.wpp_templatelistitems.models import wpp_templatelistitems


class WPPTemplateListItemsSerializer(serializers.ModelSerializer):
    class Meta:
        model = wpp_templatelistitems
        fields = "__all__"
        exclude = ["id"]
