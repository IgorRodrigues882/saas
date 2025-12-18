from django.db import models
from boomerangue.apps.ger_empresas.models import ger_empresas

class ger_grade(models.Model):
    id = models.BigAutoField(primary_key=True)

    empresa = models.ForeignKey(ger_empresas, on_delete=models.PROTECT, null=True)
    EDI_Integracao = models.CharField(max_length=50, null=True)
    Grade = models.CharField(max_length=50, null=True)
    Caracteristica_id = models.BigIntegerField(null=True)
    NroInicial = models.SmallIntegerField(null=True)
    NroFinal = models.SmallIntegerField(null=True)
    Grade01 = models.CharField(max_length=50, blank=True)
    Grade02 = models.CharField(max_length=50, blank=True)
    Grade03 = models.CharField(max_length=50, blank=True)
    Grade04 = models.CharField(max_length=50, blank=True)
    Grade05 = models.CharField(max_length=50, blank=True)
    Grade06 = models.CharField(max_length=50, blank=True)
    Grade07 = models.CharField(max_length=50, blank=True)
    Grade08 = models.CharField(max_length=50, blank=True)
    Grade09 = models.CharField(max_length=50, blank=True)
    Grade10 = models.CharField(max_length=50, blank=True)
    Grade11 = models.CharField(max_length=50, blank=True)
    Grade12 = models.CharField(max_length=50, blank=True)
    Grade13 = models.CharField(max_length=50, blank=True)
    Grade14 = models.CharField(max_length=50, blank=True)
    Grade15 = models.CharField(max_length=50, blank=True)
    Grade16 = models.CharField(max_length=50, blank=True)
    Grade17 = models.CharField(max_length=50, blank=True)
    Grade18 = models.CharField(max_length=50, blank=True)
    Grade19 = models.CharField(max_length=50, blank=True)
    Grade20 = models.CharField(max_length=50, blank=True)
    Grade21 = models.CharField(max_length=50, blank=True)
    Grade22 = models.CharField(max_length=50, blank=True)
    Grade23 = models.CharField(max_length=50, blank=True)
    Grade24 = models.CharField(max_length=50, blank=True)
    Grade25 = models.CharField(max_length=50, blank=True)
    Sincronizado = models.CharField(max_length=1, default='N')
    dtSincronizacao = models.DateTimeField(auto_now_add=True)
    verSincronizador = models.CharField(max_length=12, null=True)
    idSincronizador = models.PositiveIntegerField(null=True)
    cadastro_dt = models.DateTimeField(auto_now_add=True, null=True)
    alteracao_dt = models.DateTimeField(auto_now=True, null=True)
    exclusao_dt = models.DateTimeField(null=True)
    statusregistro_id = models.IntegerField(default=200)

    class Meta:
        db_table = 'ger_grade'

    def __str__(self):
        return self.Grade  # Retorna o nome da grade como representação padrão
