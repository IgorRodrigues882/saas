from rest_framework import serializers
from boomerangue.apps.recrutamento.models import vagas, Candidates, DocumentReasons, DocumentTypeStd, DocumentStatus, CandidateStatus, DocumentTypes, DocumentTypesFields
from django.template.defaultfilters import date as django_date
from django.utils import timezone
from django.db.models import Q # Importar Q para consultas OR

class vagasSerializer(serializers.ModelSerializer):
    class Meta:
        model = vagas
        fields = "__all__"
        read_only_fields = ['empresa']  # Campo definido internamente

    def create(self, validated_data):
        user = self.context['request'].user
        if not hasattr(user, 'empresa'):
            raise serializers.ValidationError("Usuário não possui empresa vinculada.")
        validated_data['empresa'] = user.empresa
        return super().create(validated_data)


class candidatesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Candidates
        fields = "__all__"
        read_only_fields = ['empresa']  # Campo definido internamente

    def validate(self, data):
        """
        Verifica a unicidade de email, cpf e phone na criação e edição,
        e limpa os campos CPF e telefone.
        """
        user = self.context['request'].user
        if not hasattr(user, 'empresa'):
            raise serializers.ValidationError("Usuário não possui empresa vinculada.")
        empresa = user.empresa

        # Obtém os dados a serem validados. Usa get() para lidar com partial updates.
        # Se o campo não estiver presente na atualização parcial, usa o valor da instância existente.
        instance = self.instance
        email = data.get('email', getattr(instance, 'email', None))
        cpf = data.get('cpf', getattr(instance, 'cpf', None))
        phone = data.get('phone', getattr(instance, 'phone', None))

        # --- Limpeza dos campos ---
        cpf_cleaned = None
        if cpf:
            cpf_cleaned = ''.join(filter(str.isdigit, cpf))
            # Atualiza o dicionário 'data' se o campo 'cpf' foi fornecido na requisição
            if 'cpf' in data:
                data['cpf'] = cpf_cleaned # Armazena o valor limpo para salvar

        phone_cleaned = None
        if phone:
            phone_cleaned = ''.join(filter(str.isdigit, phone))
            # Atualiza o dicionário 'data' se o campo 'phone' foi fornecido na requisição
            if 'phone' in data:
                 data['phone'] = phone_cleaned # Armazena o valor limpo para salvar
        # --- Fim Limpeza ---


        # --- Verificação de Unicidade ---
        query = Q()
        if email:
            query |= Q(email=email)
        if cpf_cleaned:
            query |= Q(cpf=cpf_cleaned)
        if phone_cleaned:
            query |= Q(phone=phone_cleaned)

        # Só executa a query se houver algum campo para verificar
        if query:
            queryset = Candidates.objects.filter(query, empresa=empresa, dtexclusao__isnull=True)

            # Se for uma edição (self.instance existe), exclui o próprio objeto da verificação
            if instance:
                queryset = queryset.exclude(pk=instance.pk)

            if queryset.exists():
                errors = {}
                # Verifica individualmente qual campo causou a duplicidade
                if email and queryset.filter(email=email).exists():
                    errors['email'] = f"Já existe outro candidato cadastrado com este e-mail ({email})."
                if cpf_cleaned and queryset.filter(cpf=cpf_cleaned).exists():
                     errors['cpf'] = f"Já existe outro candidato cadastrado com este CPF ({cpf})." # Mostra o CPF original
                if phone_cleaned and queryset.filter(phone=phone_cleaned).exists():
                     errors['phone'] = f"Já existe outro candidato cadastrado com este telefone ({phone})." # Mostra o telefone original

                if errors:
                    raise serializers.ValidationError(errors)
        # --- Fim Verificação de Unicidade ---

        return data

    def create(self, validated_data):
        # A validação e limpeza já ocorreram no método validate
        user = self.context['request'].user
        # A verificação da empresa já foi feita no validate, mas mantemos aqui por segurança
        if not hasattr(user, 'empresa'):
            raise serializers.ValidationError("Usuário não possui empresa vinculada.")
        validated_data['empresa'] = user.empresa
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # A validação e limpeza já ocorreram no método validate
        # Os dados em validated_data já contêm os valores limpos de cpf/phone (se foram enviados)
        return super().update(instance, validated_data)
    

class ReasonsSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentReasons
        fields = "__all__"
        read_only_fields = ['empresa']  # Campo definido internamente

    def create(self, validated_data):
        user = self.context['request'].user
        if not hasattr(user, 'empresa'):
            raise serializers.ValidationError("Usuário não possui empresa vinculada.")
        validated_data['empresa'] = user.empresa
        validated_data['user'] = user
        return super().create(validated_data)
    

class stdSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentTypeStd
        fields = "__all__"
        read_only_fields = ['empresa']  # Campo definido internamente

    def create(self, validated_data):
        user = self.context['request'].user
        if not hasattr(user, 'empresa'):
            raise serializers.ValidationError("Usuário não possui empresa vinculada.")
        validated_data['empresa'] = user.empresa
        validated_data['user'] = user
        return super().create(validated_data)


class statusdocSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentStatus
        fields = "__all__"
        read_only_fields = ['empresa']  # Campo definido internamente

    def create(self, validated_data):
        user = self.context['request'].user
        if not hasattr(user, 'empresa'):
            raise serializers.ValidationError("Usuário não possui empresa vinculada.")
        validated_data['empresa'] = user.empresa
        validated_data['user'] = user
        return super().create(validated_data)


class statuscandidateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CandidateStatus
        fields = "__all__"
        read_only_fields = ['empresa']  # Campo definido internamente

    def create(self, validated_data):
        user = self.context['request'].user
        if not hasattr(user, 'empresa'):
            raise serializers.ValidationError("Usuário não possui empresa vinculada.")
        validated_data['empresa'] = user.empresa
        validated_data['user'] = user
        return super().create(validated_data)
    

class tipos_documentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentTypes
        fields = "__all__"
        # read_only_fields = ['empresa']  # Campo definido internamente

    # def create(self, validated_data):
    #     user = self.context['request'].user
    #     if not hasattr(user, 'empresa'):
    #         raise serializers.ValidationError("Usuário não possui empresa vinculada.")
    #     validated_data['empresa'] = user.empresa
    #     validated_data['user'] = user
    #     return super().create(validated_data)

class camposSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentTypesFields
        fields = "__all__"
        read_only_fields = ['empresa']  # Campo definido internamente

    def create(self, validated_data):
        user = self.context['request'].user
        if not hasattr(user, 'empresa'):
            raise serializers.ValidationError("Usuário não possui empresa vinculada.")
        validated_data['empresa'] = user.empresa
        validated_data['usuario'] = user
        return super().create(validated_data)

class ExportVagasSerializer(serializers.ModelSerializer):
    status = serializers.CharField(source='jobstatus', label='Status da Vaga')
    data_criacao = serializers.SerializerMethodField(label='Data de Criação')  # Alterado para SerializerMethodField
    unidade = serializers.CharField(source='unidade_id.nome', label='Unidade', default='')
    nome = serializers.CharField(source='title', label='Nome')
    descricao = serializers.CharField(source='description', label='Descrição')

    class Meta:
        model = vagas
        fields = ['nome', 'status', 'data_criacao', 'unidade', 'descricao']

    def get_data_criacao(self, obj):
        # Formata considerando o fuso horário correto
        return django_date(timezone.localtime(obj.creation_date), "d/m/Y H:i")
    
