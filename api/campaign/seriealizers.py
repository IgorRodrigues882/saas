from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from boomerangue.apps.campaign.models import bmm_campanha, bmm_template, bmm_boomerangue, bmm_boomerangueitens, bmm_boomerangueimportado, bmm_templateimportado, bmm_template_itens, bmm_boomeranguelog, bmm_boomerangueevento, ger_opcoes_padrao, agendamento


class CampaignSerializer(serializers.ModelSerializer):
    class Meta:
        model = bmm_campanha
        fields = "__all__"
        # exclude = ["id"]

    def create(self, validated_data):
        # Obtenha o usuário autenticado a partir do contexto
        user = self.context['request'].user

        # Agora você pode usar 'user' para obter a empresa do usuário
        empresa_do_usuario = user.empresa  # Certifique-se de adaptar isso à sua lógica de modelo

        # Vincule a campanha à empresa do usuário antes de criar
        validated_data['empresa'] = empresa_do_usuario

        # Verifique se já existe uma campanha com o mesmo EdiCampanha para a mesma empresa
        edi_campanha = validated_data.get('EdiCampanha')
        if bmm_campanha.objects.filter(EdiCampanha=edi_campanha, empresa=empresa_do_usuario, statusregistro_id=200).exists():
            raise serializers.ValidationError({"error":"Uma campanha com este EdiCampanha já existe para esta empresa."})
        

        return bmm_campanha.objects.create(**validated_data)

    def update(self, instance, validated_data):
        # Verifique se a condição específica é atendida
        print(instance.template.campanha_motivo)
        if validated_data.get('status_campanha') == 'EA' and instance.template.campanha_motivo != 'MKT' and not bmm_boomerangueitens.objects.filter(campanha=instance.pk, statusregistro_id=200).exists():
            raise ValidationError({"error": "Não há itens cadastrados! O status 'EM ANDAMENTO' só pode ser aplicado se a campanha tiver itens cadastrados.", 'original':instance.status_campanha})
        # if validated_data.get('status_campanha') == 'EA' and instance.status_validacao == 'N':
        #     raise ValidationError({"error": "Os números ainda não foram validados, aguarde alguns minutos", 'original':instance.status_campanha})
        
        
        # Atualize a instância com os novos dados
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        return instance
    

class Bmm_templateSerializer(serializers.ModelSerializer):
    class Meta:
        model = bmm_template
        fields = "__all__"
        # exclude = ["id"]

    def create(self, validated_data):
        # Obtenha o usuário autenticado a partir do contexto
        user = self.context['request'].user

        # Agora você pode usar 'user' para obter a empresa do usuário
        empresa_do_usuario = user.empresa  # Certifique-se de adaptar isso à sua lógica de modelo

        # Vincule a campanha à empresa do usuário antes de criar
        validated_data['empresa'] = empresa_do_usuario

        # Verifique se image_footer não foi fornecido
        if 'image_footer' not in validated_data or validated_data['image_footer'] is None:
            if ger_opcoes_padrao.objects.filter(empresa=empresa_do_usuario).exists():
                image_padrao = ger_opcoes_padrao.objects.get(empresa=empresa_do_usuario)
                validated_data['image_footer'] = image_padrao.imagem_footer_padrao
        
        # if user.empresa.tipo_de_negocio.value_prefixo == 'CLI':
        if bmm_template.objects.filter(nome_template=validated_data['nome_template'], statusregistro_id=200, empresa = empresa_do_usuario).exists():
                raise serializers.ValidationError("Template com o mesmo nome já existe!")
                
        return bmm_template.objects.create(**validated_data)
    def update(self, instance, validated_data):
        # Obtenha o usuário autenticado a partir do contexto
        user = self.context['request'].user

        # Agora você pode usar 'user' para obter a empresa do usuário
        empresa_do_usuario = user.empresa  # Certifique-se de adaptar isso à sua lógica de modelo

        # Verifique se o objeto que está sendo editado pertence à empresa do usuário
        if instance.empresa != empresa_do_usuario:
            raise serializers.ValidationError("You do not have permission to edit this item.")

        # Atualize os campos do objeto e, se necessário, vincule a empresa do usuário
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # Vincule o template à empresa do usuário
        instance.empresa = empresa_do_usuario

        instance.save()
        return instance
    
class Bmm_BoomerangueSerializer(serializers.ModelSerializer):
    class Meta:
        model = bmm_boomerangue
        fields = "__all__"
        # exclude = ["id"]

    def create(self, validated_data):
        # Obtenha o usuário autenticado a partir do contexto
        user = self.context['request'].user

        # Agora você pode usar 'user' para obter a empresa do usuário
        empresa_do_usuario = user.empresa  # Certifique-se de adaptar isso à sua lógica de modelo

        # Vincule a campanha à empresa do usuário antes de criar
        validated_data['empresa'] = empresa_do_usuario
        return bmm_boomerangue.objects.create(**validated_data)


class bmm_boomerangueitensSerializer(serializers.ModelSerializer):
    class Meta:
        model = bmm_boomerangueitens
        fields = "__all__"
        # exclude = ["id"]

    def create(self, validated_data):
        """
        Create and return a new Campaign instance, given the validated data.
        """
        return bmm_boomerangueitens.objects.create(**validated_data)



class bmm_importadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = bmm_boomerangueimportado
        fields = "__all__"
        # exclude = ["id"]

    def create(self, validated_data):
        """
        Create and return a new Campaign instance, given the validated data.
        """
        return bmm_boomerangueimportado.objects.create(**validated_data)
    

class bmm_importadoTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = bmm_templateimportado
        fields = "__all__"
        # exclude = ["id"]

    

class bmm_template_itensSerializer(serializers.ModelSerializer):
    class Meta:
        model = bmm_template_itens
        fields = "__all__"
        # exclude = ["id"]

    def create(self, validated_data):
        """
        Create and return a new Campaign instance, given the validated data.
        """
        return bmm_template_itens.objects.create(**validated_data)
    

class bmm_boomeranguelogSerializer(serializers.ModelSerializer):
    class Meta:
        model = bmm_boomeranguelog
        fields = "__all__"
        # exclude = ["id"]

    def create(self, validated_data):
        """
        Create and return a new Campaign instance, given the validated data.
        """
        return bmm_boomeranguelog.objects.create(**validated_data)
    
class bmm_boomerangueEventoSerializer(serializers.ModelSerializer):
    class Meta:
        model = bmm_boomerangueevento
        fields = "__all__"
        # exclude = ["id"]

    def create(self, validated_data):
        """
        Create and return a new Campaign instance, given the validated data.
        """
        return bmm_boomerangueevento.objects.create(**validated_data)
    


class opcao_padraoSeriealizer(serializers.ModelSerializer):
    class Meta:
        model = ger_opcoes_padrao
        fields = "__all__"

    def create(self, validated_data):
        # Obtenha o usuário autenticado a partir do contexto
        user = self.context['request'].user

        # Agora você pode usar 'user' para obter a empresa do usuário
        empresa_do_usuario = user.empresa  # Certifique-se de adaptar isso à sua lógica de modelo

        # Vincule a campanha à empresa do usuário antes de criar
        validated_data['empresa'] = empresa_do_usuario
        

        return ger_opcoes_padrao.objects.create(**validated_data)    
    

# Trata os dados do seriealizer dos gráfico do indice
class VendasPorDiaSerializer(serializers.Serializer):
    data_tx = serializers.DateTimeField()
    total_boomerangues = serializers.IntegerField()
    total_vendas = serializers.DecimalField(max_digits=10, decimal_places=2)



# trata dados top vendedores
class TopVendedorSerializer(serializers.Serializer):
    vendedor__Vendedor = serializers.CharField()
    vendedor__CodigoVendedor = serializers.CharField()
    total_vendas = serializers.IntegerField()
    total_valor = serializers.FloatField()


class AgendamentoTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = agendamento
        fields = "__all__"
        # exclude = ["id"]