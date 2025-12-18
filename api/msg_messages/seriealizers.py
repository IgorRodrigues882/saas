from rest_framework import serializers

from boomerangue.apps.msg_messages.models import MsgMessage, canais, canais_leads, usuario_lead 


class MsgMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = MsgMessage 
        fields = "__all__"
        # exclude = ["id"]
    
class canaisSerializer(serializers.ModelSerializer):
    class Meta:
        model = canais 
        fields = "__all__"
        # exclude = ["id"]

class canais_leadsSerializer(serializers.ModelSerializer):
    class Meta:
        model = canais_leads  
        fields = "__all__"
        # exclude = ["id"]

class usuario_leadSerializer(serializers.ModelSerializer):
    class Meta:
        model = usuario_lead  
        fields = "__all__"
        # exclude = ["id"]
