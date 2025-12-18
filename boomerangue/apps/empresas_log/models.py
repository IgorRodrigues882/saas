
from django.db import models
from boomerangue.apps.campaign.models import ger_empresas, bmm_campanha, bmm_template, Usuario

class ger_empresas_log(models.Model):
    id = models.AutoField(primary_key=True)
    empresa = models.ForeignKey(ger_empresas, on_delete=models.PROTECT)
    campanha = models.ForeignKey(bmm_campanha, on_delete=models.PROTECT, null=True)
    template = models.ForeignKey(bmm_template, on_delete=models.PROTECT, null=True)
    usuario = models.ForeignKey(Usuario, on_delete=models.PROTECT, null=True)
    DataLog = models.DateTimeField(auto_now_add=True)
    acao_id = models.CharField(max_length=25, null=True)
    descricao = models.CharField(max_length=100, null=True)