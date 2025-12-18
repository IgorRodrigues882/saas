from rest_framework import serializers

from boomerangue.apps.wpp_templateapprovals.models import wpp_templateapprovals


class WPPTemplateApprovalsSerializer(serializers.ModelSerializer):
    class Meta:
        model = wpp_templateapprovals
        fields = "__all__"
        exclude = ["id"]
