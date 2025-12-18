from django.db import models
from boomerangue.apps.ger_empresas.models import ger_empresas

class ger_grupoprodutos(models.Model):
    id = models.BigAutoField(primary_key=True)

    empresa = models.ForeignKey(ger_empresas, on_delete=models.CASCADE, null=True)
    EDI_Integracao = models.CharField(max_length=50, null=True)
    GrupoProdutos = models.CharField(max_length=50, null=True)
    OrdemGrupoProdutos = models.CharField(max_length=5, null=True)
    grupoAtivo = models.CharField(max_length=1, choices=[
        ('S', 'Ativo'),
        ('N', 'Inativo'),
    ])
    Sincronizado = models.CharField(max_length=1, default='N')
    dtSincronizacao = models.DateTimeField(null=True)
    verSincronizador = models.CharField(max_length=12, null=True)
    idSincronizador = models.IntegerField(null=True)
    cadastro_dt = models.DateTimeField(auto_now_add=True, null=True)
    alteracao_dt = models.DateTimeField(auto_now=True, null=True)
    exclusao_dt = models.DateTimeField(null=True)
    statusregistro_id = models.IntegerField(default=200)

    class Meta:
        db_table = 'ger_grupoprodutos'

    def __str__(self):
        return self.GrupoProdutos  # Retorna o nome do grupo de produtos como representação padrão
