from django.db import models
import uuid

class validacao_documentos(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nome = models.CharField(max_length=100, null=True)
    data_nascimento = models.CharField(max_length=100, null=True)
    cpf = models.CharField(max_length=14, null=True)
    nome_mae = models.CharField(max_length=100, null=True)
    nome_pai = models.CharField(max_length=100, null=True)
    sexo = models.CharField(max_length=1, choices=[('M','Masculino'),('F','Feminino'),('N',"Não especificado")], null=True)
    nacionalidade = models.CharField(max_length=70, null=True)
    uf_nascimento = models.CharField(max_length=2, null=True)
    cidade_nascimento = models.CharField(max_length=500, null=True)
    passaporte = models.CharField(max_length=100, null=True)
    rne_rnm = models.CharField(max_length=100, null=True)
    documento_identificacao = models.CharField(max_length=100, null=True)
    orgao_expedidor = models.CharField(max_length=100, null=True)
    uf_expedidor = models.CharField(max_length=2, null=True)
    documento_identificacao_estrangeiro = models.CharField(max_length=100, null=True)
    reside_brasil = models.CharField(max_length=2, null=True)
    tempo_residencia = models.CharField(max_length=50, null=True)
    brasileiro_naturalizado = models.CharField(max_length=1, null=True)
    documento_valido = models.CharField(max_length=1, null=True)
    cadastro_dt = models.DateTimeField(auto_now_add=True)
    alteracao_dt = models.DateTimeField(auto_now=True)
    exclusao_dt = models.DateTimeField(blank=True, null=True)
    statusregistro_id = models.IntegerField(default=200)

    class Meta:
        db_table = 'validacao_documentos'
        indexes = [
            models.Index(fields=['cpf'], name='cpf_verification'),
        ]