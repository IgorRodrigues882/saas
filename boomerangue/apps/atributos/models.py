from django.db import models
from boomerangue.apps.campaign.models import bmm_boomerangue
from boomerangue.apps.ger_empresas.models import ger_tipoempresa, ger_empresas

# Tabela de Atributos
class Atributo(models.Model):
    TIPO_ATRIBUTO_CHOICES = [
        ('texto', 'Texto'),
        ('combo', 'Combo'),
        ('textarea', 'Textarea'),
    ]

    nome_atributo = models.CharField(max_length=100)
    tipo_atributo = models.CharField(max_length=10, choices=TIPO_ATRIBUTO_CHOICES)
    conteudo_padrao = models.TextField(null=True, blank=True)
    obrigatorio = models.BooleanField(default=False)
    tipo_empresa = models.ForeignKey(ger_tipoempresa, on_delete=models.PROTECT, null=True)

    class Meta:
        db_table = 'Atributo'

    def __str__(self):
        return self.nome_atributo


class BoomerangueAtributo(models.Model):
    boomerangue = models.ForeignKey(bmm_boomerangue, on_delete=models.CASCADE)
    atributo = models.ForeignKey(Atributo, on_delete=models.CASCADE)
    valor_atributo = models.TextField()

    class Meta:
        unique_together = ('boomerangue', 'atributo')
        db_table = 'BoomerangueAtributo'

    def __str__(self):
        return f"{self.boomerangue} - {self.atributo}"



class GrupoAgendamentos(models.Model):
    nome = models.CharField(max_length=100)
    empresa = models.ForeignKey(ger_empresas, on_delete=models.CASCADE, null=True)
    color = models.CharField(max_length=100, default='#ffffff')
    bg_color = models.CharField(max_length=100)


class BoomerangueAgendamento(models.Model):
    boomerangue = models.ForeignKey(bmm_boomerangue, on_delete=models.CASCADE)
    grupo_agendamento = models.ForeignKey(GrupoAgendamentos, on_delete=models.CASCADE)
    dtcadastro = models.DateTimeField(auto_now_add=True)