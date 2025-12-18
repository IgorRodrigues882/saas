from django.db import models
from boomerangue.apps.ger_empresas.models import ger_empresas
from boomerangue.apps.bot.models import Bot

class SofBot(models.Model):
    empresa = models.ForeignKey(ger_empresas, on_delete=models.CASCADE)
    bot = models.ForeignKey(Bot, on_delete=models.CASCADE)
    tipo_id = models.CharField(max_length=1, choices=[('C', 'Consulta'), ('M', 'Menu'), ('G', 'Mensagem'), ('P', 'Push')])
    menubot = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True)
    tipolista_id = models.CharField(max_length=2, choices=[('LI', 'Lista'), ('BU', 'Botões'), ('ME', 'Menu numerado')])
    comando = models.CharField(max_length=20, unique=True)
    tipoConexao = models.CharField(max_length=1, choices=[('G', 'GET'), ('P', 'POST')])
    conexaoUrl = models.CharField(max_length=500)
    header = models.TextField()
    body = models.TextField()
    response = models.TextField()
    numerosOK = models.TextField()
    numerosError = models.TextField()
    diassemanaexecutar = models.CharField(max_length=7, default='0111110')
    iniciaenvios = models.CharField(max_length=2, default='00')
    finalenvios = models.CharField(max_length=2, default='00')
    enviarhorafixa = models.CharField(max_length=4, null=True, blank=True)
    opcaomenu = models.CharField(max_length=2, default='1')
    ativo = models.CharField(max_length=1, default='S')
    # grupo_usuarios_permitido = models.ForeignKey('GrupoUsuarios', on_delete=models.CASCADE)
    dataultimoenvio = models.DateTimeField(null=True, blank=True)
    dataproximoenvio = models.DateTimeField(null=True, blank=True)
    dataultimaconsulta = models.DateTimeField(null=True, blank=True)
    dataultimoerro = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "SofBot"
        verbose_name_plural = "SofBots"
        db_table = 'sofbot'

    def __str__(self):
        return f"SofBot {self.id} - {self.comando}"