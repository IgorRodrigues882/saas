from django.db import models
from boomerangue.apps.ger_empresas.models import ger_empresas
from boomerangue.apps.bot_provedor.models import bot_provedor

class bot_canal(models.Model):
    id = models.BigAutoField(primary_key=True)
    empresa = models.ForeignKey(ger_empresas, on_delete=models.PROTECT, null=True)
    # provedor = models.ForeignKey(bot_provedor, on_delete=models.PROTECT, null=True)
    canal = models.CharField(max_length=45, unique=True, blank=True)
    canal_ativo = models.CharField(max_length=1, default="S")
    cadastro_dt = models.DateTimeField(auto_now=True)
    alteracao_dt = models.DateTimeField(auto_now=True)
    exclusao_dt = models.DateTimeField(null=True)
    statusregistro_id = models.IntegerField(default=200)

    class Meta:
        db_table="bot_canal"
