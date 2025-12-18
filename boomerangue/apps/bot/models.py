from django.db import models
from django.utils.timezone import now
from boomerangue.apps.ger_empresas.models import ger_empresas
from boomerangue.apps.bot_provedor.models import bot_provedor
from django.utils.crypto import get_random_string


class Bot(models.Model):
    # Existing Bot model fields
    id = models.BigAutoField(primary_key=True)
    empresa = models.ForeignKey(ger_empresas, on_delete=models.PROTECT, null=True)
    bot = models.CharField(max_length=45, null=True)
    bot_apelido = models.CharField(max_length=20, null=True)
    bot_numero = models.CharField(max_length=20, null=True)
    bot_ativo = models.CharField(max_length=1, null=True, default='N')
    bot_passivo = models.CharField(max_length=1, null=True)
    bot_tipo = models.CharField(
        max_length=20,
        choices=[
            ("Conversational CO", "Conversational CO"),
            ("Boomerangue BM", "Boomerangue BM"),
            ("Mixto MX", "Mixto MX"),
            ("Comunica", "Comunica"),
            ("Bot", "Bot"),
            ("Serviço", "Serviço"),
            ("Recrutador", "Recrutador")
        ],
        null=True,
    )
    bot_meio = models.CharField(
        max_length=20,
        choices=[
            ("Comunica EVL", "Comunica EVL"),
            ("Comunica WO", "Comunica WO"),
            ("Comunica ZP", "Comunica ZP"),
            ("Comunica WB", "Comunica WB"),
            ("Comunica CO", "Comunica CO"),
        ],
        null=True,
    )
    cadastro_dt = models.DateTimeField(auto_now=True, null=True)
    alteracao_dt = models.DateTimeField(auto_now=True, null=True)
    exclusao_dt = models.DateTimeField(null=True)
    statusregistro_id = models.IntegerField(default=200)
    legenda_1 = models.CharField(max_length=100, null=True, blank=True)
    legenda_2 = models.CharField(max_length=100, null=True, blank=True)
    legenda_3 = models.CharField(max_length=100, null=True, blank=True)
    legenda_4 = models.CharField(max_length=100, null=True, blank=True)
    bot_provedor = models.ForeignKey(bot_provedor,on_delete=models.PROTECT, null=True)
    EDI_Integracao = models.CharField(max_length=100, null=True, blank=True)
    canal = models.CharField(max_length=45, blank=True)
    url_webhook = models.CharField(max_length=255, blank=True)
    webhook_ativo = models.CharField(max_length=45, blank=True, default="N")
    webhook_ativo_evento = models.CharField(max_length=45, blank=True, default="N")
    api_key = models.CharField(max_length=32, unique=True, null = True)
    limite_diario = models.IntegerField(default=100, blank=True)
    limite_semanal = models.IntegerField(default=500, blank=True)
    taxa_crescimento = models.DecimalField(default = 01.20, max_digits=4, decimal_places=2, null=True)
    limite_envio_plataforma = models.IntegerField(default=0, blank=True)
    HorarioInicioEnvio = models.IntegerField(default=8, null=True)
    HorarioFimEnvio = models.IntegerField(default=19, null=True)
    ftp = models.CharField(max_length=3, default="no")
    ftp_config = models.JSONField(default=dict, null=True)
    call_to_actions = models.JSONField(default=dict)
    bot_padrao = models.CharField(max_length=1, null=True, default='N')
    
    class Meta:
        db_table = "bot"


class BotActions(models.Model):
    id = models.BigAutoField(primary_key=True)
    bot = models.ForeignKey(Bot, on_delete=models.PROTECT)
    type_action = models.CharField(max_length=2, null=True, choices=(("CA", "Call to action"), ("AP", "API")))
    description = models.CharField(max_length=50, null=True)
    is_active = models.BooleanField(default=True)
    date_end = models.DateTimeField(null=True)
    date_start = models.DateTimeField(auto_now_add=True)
    rules = models.TextField(null=True)
    order = models.IntegerField(null=True)
    
    class Meta:
        db_table = "bot_actions"
        
class BotActionSteps(models.Model):
    bot_action = models.ForeignKey(BotActions, on_delete=models.CASCADE)
    description = models.CharField(max_length=50, null=True)
    order = models.IntegerField(null=True)
    type_step = models.CharField(max_length=2, choices=(("CA", "Call to action"), ("AP", "API")), null=True)
    method = models.CharField(max_length=6, choices=(
        ("POST", "POST"),
        ("GET", "GET"),
        ("PATCH", "PATCH"),
        ("DELETE", "DELETE"),
        ("PUT", "PUT")
        ), null=True)
    url = models.CharField(max_length=400, null=True)
    header = models.JSONField(default=dict)
    payload = models.JSONField(default=dict)
    rules_step = models.TextField(null=True)
    next_step_on_success = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, related_name='success_steps')
    next_step_on_failure = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, related_name='failure_steps')
    retry_on_failure = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = "bot_actions_steps"


class BotActionTrigger(models.Model):
    bot_action = models.ForeignKey(BotActions, on_delete=models.CASCADE)
    trigger_phrase = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)
    