from rest_framework import serializers
from boomerangue.apps.ia_messages.models import ChatMessageIA, CanalMessageIA

class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessageIA
        fields = "__all__"


class CanalMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = CanalMessageIA
        fields = "__all__"
