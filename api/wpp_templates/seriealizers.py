from rest_framework import serializers

from boomerangue.apps.wpp_templates.models import wpp_templates, ia_criatividade, ia_tomvoz, gpt_engine, ia_prompt_settings, wpp_fields, callToAction, Flows


class WPPTemplatesSerializer(serializers.ModelSerializer):
    class Meta:
        model = wpp_templates
        fields = "__all__"
        # exclude = ["id"]

    def create(self, validated_data):
        # Obtenha o usuário autenticado a partir do contexto
        user = self.context['request'].user

        # Agora você pode usar 'user' para obter a empresa do usuário
        empresa_do_usuario = user.empresa  # Certifique-se de adaptar isso à sua lógica de modelo

        # Vincule a campanha à empresa do usuário antes de criar
        validated_data['empresa'] = empresa_do_usuario
        

        return wpp_templates.objects.create(**validated_data)
    


class criatividade_iaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ia_criatividade
        fields = "__all__"


class tomvoz_iaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ia_tomvoz
        fields = "__all__"


class gpt_engineSerializer(serializers.ModelSerializer):
    class Meta:
        model = gpt_engine
        fields = "__all__"


class ia_prompt_settingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ia_prompt_settings
        fields = "__all__"


class wpp_fieldsSerializer(serializers.ModelSerializer):
    class Meta:
        model = wpp_fields
        fields = "__all__"

class callToActionSerializer(serializers.ModelSerializer):
    class Meta:
        model = callToAction
        fields = "__all__"


class FlowsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Flows
        fields = "__all__"
        # exclude = ["id"]
        read_only_fields = ['empresa']  # Campo definido internamente

    def create(self, validated_data):
        # A validação e limpeza já ocorreram no método validate
        user = self.context['request'].user
        # A verificação da empresa já foi feita no validate, mas mantemos aqui por segurança
        if not hasattr(user, 'empresa'):
            raise serializers.ValidationError("Usuário não possui empresa vinculada.")
        validated_data['empresa'] = user.empresa
        return super().create(validated_data)