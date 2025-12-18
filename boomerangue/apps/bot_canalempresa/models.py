from django.db import models
from django.utils import timezone
from boomerangue.apps.ger_empresas.models import ger_empresas
from boomerangue.apps.bot_canal.models import bot_canal
from boomerangue.apps.bot.models import Bot


class bot_canalempresa(models.Model):
    id = models.BigAutoField(primary_key=True)

    empresa = models.ForeignKey(ger_empresas, on_delete=models.PROTECT, null=True)
    canal = models.ForeignKey(bot_canal, on_delete=models.SET_NULL, null=True)
    bot = models.ForeignKey(Bot, on_delete=models.SET_NULL, null=True)
    bcc_ativo = models.CharField(max_length=1, default='S', choices=(('S', 'Sim'), ('N', 'Não')))
    key1 = models.CharField(max_length=200, blank=True, verbose_name='Chave de configuração 1')
    key2 = models.CharField(max_length=200, blank=True, verbose_name='Chave de configuração 2')
    key3 = models.CharField(max_length=200, blank=True, verbose_name='Chave de configuração 3')
    key4 = models.CharField(max_length=200, blank=True, verbose_name='Chave de configuração 4')
    limite_diario = models.IntegerField(default=100, verbose_name='Limite diário de mensagens')
    limite_semanal = models.IntegerField(default=500, verbose_name='Limite semanal de mensagens')
    taxa_crescimento_semanal = models.DecimalField(max_digits=10, decimal_places=2, default=1, verbose_name='Taxa de crescimento semanal')
    cadastro_dt = models.DateTimeField(auto_now=True)
    alteracao_dt = models.DateTimeField(auto_now=True)
    exclusao_dt = models.DateTimeField(null=True, blank=True)
    statusregistro_id = models.IntegerField(default=200)

    class Meta:
        db_table="bot_canalempresa"
