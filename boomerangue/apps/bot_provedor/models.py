from django.db import models
from django.utils import timezone
from boomerangue.apps.ger_empresas.models import ger_empresas

class bot_provedor(models.Model):
    id = models.BigAutoField(primary_key=True)
    empresa = models.ForeignKey(ger_empresas, on_delete=models.PROTECT, null=True)
    provedor = models.CharField(max_length=45, null=True, blank=True, verbose_name='Nome do provedor')
    email = models.CharField(max_length=1, default='N', choices=(('S', 'Sim'), ('N', 'Não')), verbose_name='Suporta Email?')
    whatsapp = models.CharField(max_length=1, default='S', choices=(('S', 'Sim'), ('N', 'Não')), verbose_name='Suporta WhatsApp?')
    sms = models.CharField(max_length=1, default='N', choices=(('S', 'Sim'), ('N', 'Não')), verbose_name='Suporta SMS?')
    provedor_ativo = models.CharField(max_length=1, default='S', choices=(('S', 'Sim'), ('N', 'Não')), verbose_name='Provedor Ativo?')
    legenda_1 = models.CharField(max_length=100, null=True, blank=True)
    legenda_2 = models.CharField(max_length=100, null=True, blank=True)
    legenda_3 = models.CharField(max_length=100, null=True, blank=True)
    legenda_4 = models.CharField(max_length=100, null=True, blank=True)
    provedor_teste = models.CharField(max_length=1, default='N', choices=(('S', 'Sim'), ('N', 'Não')), null=True)
    provedores = [
        ('WHAO', 'Whatsapp Oficial'),
        ('SPL', 'SendPulse'),
        ('EVL', 'Evolution'),
        ('EVL17', 'Evolution 1.7'),
        ('EVLWO', 'Evolution Oficial'),
        ('ZAPI', 'Zapi API'),
        ('PCOM', 'Plug Comunica'),
        ('TWILI', 'Twillio'),
        ('360D', '360 Dialog'),
        ('SMSD', 'SMS Dev'),
    ]
    provedor_padrao = models.CharField(max_length=5, choices=provedores, null=True)
    parametro_1 = models.CharField(max_length=200, null=True, blank=True)
    parametro_2 = models.CharField(max_length=200, null=True, blank=True)
    parametro_3 = models.CharField(max_length=200, null=True, blank=True)
    secret_1 = models.CharField(max_length=200, null=True, blank=True)
    secret_2 = models.CharField(max_length=200, null=True, blank=True)
    secret_3 = models.CharField(max_length=200, null=True, blank=True)
    NroNovoLimiteDiario = models.IntegerField(default = 50)
    NroNovoLimiteHora = models.IntegerField(default = 10)
    NroNovoLimiteMinuto = models.IntegerField(default = 1)
    NroNovoIntervaloMininoMin = models.IntegerField(default = 5)
    NroNovoIntervaloMininoMax = models.IntegerField(default = 9)
    LimiteDiario = models.IntegerField(default = 200)
    LimiteHora = models.IntegerField(default = 120)
    LimiteMinuto = models.IntegerField(default = 2)
    IntervaloMininoMin = models.IntegerField(default = 3)
    IntervaloMininoMax = models.IntegerField(default = 6)
    provedor_url_api = models.CharField(max_length=500, null=True, blank=True)
    access_token = models.CharField(max_length=2000, null=True, blank=True)
    access_token_expire = models.IntegerField(null=True, default=1)
    cadastro_dt = models.DateTimeField(auto_now_add=True, verbose_name='Data e hora de criação do registro')
    alteracao_dt = models.DateTimeField(auto_now=True, verbose_name='Data e hora da última modificação do registro')
    exclusao_dt = models.DateTimeField(null=True, blank=True, verbose_name='Data e hora de exclusão do registro')
    statusregistro_id = models.IntegerField(default=200,verbose_name='ID do status do registro')

    class Meta:
        db_table="bot_provedor"
