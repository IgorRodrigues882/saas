from rest_framework import serializers
from boomerangue.apps.bmm_template_msgs.models import bmm_template_msgs

class BmmTemplateMsgsSerializer(serializers.ModelSerializer):
    class Meta:
        model = bmm_template_msgs
        fields = '__all__'


    def create(self, validated_data):
        """
        Create and return a new Campaign instance, given the validated data.
        """
        return bmm_template_msgs.objects.create(**validated_data)
    
    def update(self, instance, validated_data):
        # Verifique se um item com as mesmas características já existe
        if bmm_template_msgs.objects.filter(template=validated_data['template'], wpptemplate = validated_data['wpptemplate'], statusregistro_id=200).exclude(pk=instance.pk).exists():
            raise serializers.ValidationError("Item with this characteristic already exists.")
        return super().update(instance, validated_data)