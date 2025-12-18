from rest_framework import serializers
from decimal import Decimal

from boomerangue.apps.ger_empresas.models import ger_empresas, ger_condicoespagamento, ger_tipoempresa, TipoEmpresaPermissao, permissoes_paginas, select_tipo_campanha, StringPersonalizada, prompt_ia, ger_unidade


class CreateEmpresaSerializer(serializers.ModelSerializer):

    class Meta:
        model = ger_empresas
        fields = "__all__"
        # exclude = ["id"]

    def create(self, validated_data):
        """
        Create and return a new Campaign instance, given the validated data.
        """
        return ger_empresas.objects.create(**validated_data)
    

class CreateCondPagamentoSerializer(serializers.ModelSerializer):


    class Meta:
        model = ger_condicoespagamento
        fields = "__all__"
        # exclude = ["id"]

    def create(self, validated_data):
        # Obtenha o usuário autenticado a partir do contexto
        user = self.context['request'].user

        # Agora você pode usar 'user' para obter a empresa do usuário
        empresa_do_usuario = user.empresa  # Certifique-se de adaptar isso à sua lógica de modelo

        # Vincule a campanha à empresa do usuário antes de criar
        validated_data['empresa'] = empresa_do_usuario
        return ger_condicoespagamento.objects.create(**validated_data)
    

class ger_tipoempresaSeriealizer(serializers.ModelSerializer):

    class Meta:
        model = ger_tipoempresa
        fields = "__all__"



class ger_tipoempresapermissaoSeriealizer(serializers.ModelSerializer):
    nome_permissao = serializers.CharField(source='permissao.nome', read_only=True)
    class Meta:
        model = TipoEmpresaPermissao
        fields = "__all__"


class permissao_por_paginaSeriealizer(serializers.ModelSerializer):

    class Meta:
        model = permissoes_paginas
        fields = "__all__"


class select_tipo_campanhaSeriealizer(serializers.ModelSerializer):

    class Meta:
        model = select_tipo_campanha
        fields = "__all__"
    
    
class StringPersonalizadaSeriealizer(serializers.ModelSerializer):

    class Meta:
        model = StringPersonalizada
        fields = "__all__"


class prompt_iaSeriealizer(serializers.ModelSerializer):

    class Meta:
        model = prompt_ia
        fields = "__all__"


class ger_unidadeSerializer(serializers.ModelSerializer):


    class Meta:
        model = ger_unidade
        fields = "__all__"
        # exclude = ["id"]

        read_only_fields = ['empresa']  # Campo definido internamente

    def create(self, validated_data):
        user = self.context['request'].user
        if not hasattr(user, 'empresa'):
            raise serializers.ValidationError("Usuário não possui empresa vinculada.")
        validated_data['empresa'] = user.empresa
        return super().create(validated_data)