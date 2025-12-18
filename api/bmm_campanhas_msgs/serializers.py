from rest_framework import serializers
from boomerangue.apps.bmm_campanhas_msgs.models import bmm_campanhas_msgs

class BmmCampanhasMsgsSerializer(serializers.ModelSerializer):
    class Meta:
        model = bmm_campanhas_msgs
        fields = '__all__'

    def create(self, validated_data):
        """
        Create and return a new Campaign instance, given the validated data.
        """
        return bmm_campanhas_msgs.objects.create(**validated_data)

    def update(self, instance, validated_data):
            # Verifique se um item com as mesmas características já existe
        if bmm_campanhas_msgs.objects.filter(campanha=validated_data['campanha'], wpptemplate = validated_data['wpptemplate'], statusregistro_id=200).exclude(pk=instance.pk).exists():
            raise serializers.ValidationError("Uma campanha mensagem com essas características já existe!")
        return super().update(instance, validated_data)