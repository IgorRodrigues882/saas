from django.db import models
from django.utils import timezone
from boomerangue.apps.ger_empresas.models import ger_empresas

class ger_linhaprodutos(models.Model):
    id = models.BigAutoField(primary_key=True)

    empresa = models.ForeignKey(ger_empresas, on_delete=models.PROTECT, null=True)
    
    EDI_Integracao = models.CharField(max_length=50, blank=True)
    LinhaProdutos = models.CharField(max_length=50, blank=True)
    OrdemLinhaProdutos = models.CharField(max_length=50, default="000", null=True)
    LinhaAtiva = models.CharField(max_length=1, default="S")

    Sincronizado = models.CharField(max_length=1, default="N")
    dtSincronizacao = models.DateTimeField(null=True, verbose_name='Data e hora da última modificação do registro')
    verSincronizador = models.CharField(max_length=12, blank=True)
    idSincronizador = models.IntegerField(null=True)

    cadastro_dt = models.DateTimeField(auto_now_add=True, null=True)
    alteracao_dt = models.DateTimeField(auto_now=True, null=True)
    exclusao_dt = models.DateTimeField(null=True)
    statusregistro_id = models.IntegerField(default=200)

    class Meta:
        db_table = 'ger_linhaprodutos'

    def __str__(self):
        return f'Template {self.id} ({self.template_name})'
