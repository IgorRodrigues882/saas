from rest_framework import serializers

from boomerangue.apps.wpp_templatescomponents.models import wpp_templatescomponents, termos_sendpulse_troca, fluxo_sendpulse


class WPPTemplateComponenetsSerializer(serializers.ModelSerializer):
    class Meta:
        model = wpp_templatescomponents
        fields = "__all__"
        # exclude = ["id"]

    def create(self, validated_data):
        # Obtenha o usuário autenticado a partir do contexto
        if wpp_templatescomponents.objects.filter(template=validated_data['template'], component_type = validated_data['component_type'], statusregistro_id=200).exists():
            raise serializers.ValidationError("Item with this characteristic already exists.")

        return wpp_templatescomponents.objects.create(**validated_data)
    
    def update(self, instance, validated_data):
        # Verifique se um item com as mesmas características já existe
        if wpp_templatescomponents.objects.filter(template=validated_data['template'], component_type = validated_data['component_type'], statusregistro_id=200).exclude(pk=instance.pk).exists():
            raise serializers.ValidationError("Item with this characteristic already exists.")
        return super().update(instance, validated_data)
    


class termos_sendpulse_trocaSerializer(serializers.ModelSerializer):
    class Meta:
        model = termos_sendpulse_troca
        fields = "__all__"
        # exclude = ["id"]


class fluxo_sendpulseSerializer(serializers.ModelSerializer):
    class Meta:
        model = fluxo_sendpulse
        fields = "__all__"
        # exclude = ["id"]

