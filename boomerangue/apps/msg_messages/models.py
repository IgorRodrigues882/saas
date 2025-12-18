from django.db import models
from boomerangue.apps.ger_empresas.models import ger_empresas
from boomerangue.apps.ger_entidades.models import ger_entidade
from boomerangue.apps.campaign.models import bmm_campanha, bmm_boomerangue
from boomerangue.apps.bot.models import Bot
from boomerangue.apps.ger_entidades.models import ger_entidade
from login.models import Usuario


class MsgMessage(models.Model):
    id = models.AutoField(primary_key=True)
    empresa = models.ForeignKey(ger_empresas, models.PROTECT)
    entidade = models.ForeignKey(ger_entidade, models.PROTECT, null=True)
    campanha = models.ForeignKey(bmm_campanha, models.PROTECT, null=True)
    boomerangue = models.ForeignKey(bmm_boomerangue, models.PROTECT, null=True)
    bot = models.ForeignKey(Bot, models.PROTECT)
    flow_id = models.CharField(max_length=70,null=True)
    direcao = models.CharField(max_length=1, default='I')
    instancia = models.CharField(max_length=100)
    conteudo = models.TextField(null=True)
    message_id = models.CharField(max_length=100)
    message_reference_id = models.CharField(max_length=100, null=True)
    evento1 = models.CharField(max_length=100)
    evento2 = models.CharField(max_length=100)
    Sender = models.CharField(max_length=100)
    SenderName = models.CharField(max_length=100, null=True)
    Receiver = models.CharField(max_length=100)
    ReceiverName = models.CharField(max_length=100, null=True)
    MensagemTexto = models.TextField(null=True)
    URL_Anexo = models.CharField(max_length=500, null=True)
    ButtonListSeletec = models.CharField(max_length=255, null=True)
    DataHoraDoEvento = models.DateTimeField(auto_now_add=True)
    DataHoraProgramada = models.DateTimeField(auto_now_add=True, null=True)
    DataHoraEnvio = models.DateTimeField(null=True)
    StatusEnvio = models.CharField(max_length=1, default='A')
    StatusMensagem = models.CharField(max_length=1, default='N')
    StatusFlow = models.CharField(max_length=1, default='W')
    Delivered = models.CharField(max_length=1, default='N')
    DataHoraDelivered = models.DateTimeField(null=True)
    Received = models.CharField(max_length=1, default='N')
    DataHoraReceived = models.DateTimeField(null=True)
    mRead = models.CharField(max_length=1, default='N')
    DataHoraRead = models.DateTimeField(null=True)
    Reply = models.CharField(max_length=1, default='N')
    DataHoraReply = models.DateTimeField(null=True)
    Removed = models.CharField(max_length=1, default='N')
    DataHoraRemoved = models.DateTimeField(null=True)
    OrigemMensagem = models.CharField(max_length=25, default='AUTO')
    TipoMensagem = models.CharField(max_length=2, default='T')
    NroCreditos = models.IntegerField(default=1)
    EDI_Integracao = models.CharField(max_length=100, null=True)
    MsgProgramada = models.CharField(max_length=1, default='S')
    MensagemCancelada = models.CharField(max_length=1, default='N')
    MensagemComErro = models.CharField(max_length=1, default='N')
    VerAPI = models.CharField(max_length=10, null=True)
    owner = models.CharField(max_length=100, null=True)
    source = models.CharField(max_length=100, null=True)
    FromMe = models.CharField(max_length=1, default='N')
    chave_integracao = models.IntegerField(null=True)
    complemento1 = models.CharField(max_length=50, null=True)
    complemento2 = models.CharField(max_length=50, null=True)
    complemento3 = models.CharField(max_length=50, null=True)
    complemento4 = models.CharField(max_length=50, null=True)
    complemento5 = models.CharField(max_length=50, null=True)
    complemento6 = models.CharField(max_length=50, null=True)
    complemento7 = models.CharField(max_length=50, null=True)
    complemento8 = models.CharField(max_length=50, null=True)
    complemento9 = models.CharField(max_length=500, null=True)
    nome_anexo = models.CharField(max_length=50, null=True)
    context = models.CharField(max_length=100, null=True)
    custo_mensagem = models.DecimalField(max_digits=18, decimal_places=6, default=0, null=True)
    flag_revisao = models.CharField(max_length=1, default='N')
    lista = [
        ("N",  "nao definido"),
        ("W", "WebHook"),
        ("M", "API Msg_Create")
    ]
    origemdados = models.CharField(max_length=1, null=True, choices=lista)
    cadastro_dt = models.DateTimeField(auto_now_add=True, null=True)
    alteracao_dt = models.DateTimeField(auto_now=True, null=True)
    exclusao_dt = models.DateTimeField(null=True)
    statusregistro_id = models.IntegerField(default=200, null=True)
    proxima_msg = models.CharField(max_length=100, null=True)
    mensagem_tratada = models.CharField(max_length=1, default='N', null=True)
    doc_validado = models.CharField(max_length=1, default='N', null=True)
    msg_lida = models.CharField(max_length=1, default='N', null=True)
    notificado = models.CharField(max_length=1, default='N', null=True)
    
    class Meta:
        db_table = 'msg_message'


class log_mensagens(models.Model):
    id = models.AutoField(primary_key=True)
    mensagem = models.ForeignKey(MsgMessage, on_delete=models.PROTECT)
    data_evento = models.DateTimeField(auto_now_add=True)
    status_mensagem = models.CharField(max_length=15, null=True)
    descricao = models.TextField()

    class Meta:
        db_table = 'log_mensagens'

    
class canais(models.Model):
    id = models.AutoField(primary_key=True)
    empresa = models.ForeignKey(ger_empresas, on_delete=models.CASCADE, null=True)
    canal_nome = models.CharField(max_length=50)
    cadastro_dt = models.DateTimeField(auto_now_add=True, null=True)
    alteracao_dt = models.DateTimeField(auto_now=True, null=True)
    exclusao_dt = models.DateTimeField(null=True)
    statusregistro_id = models.IntegerField(default=200, null=True)

    class Meta:
        db_table = 'canais'


class canais_leads(models.Model):
    id = models.AutoField(primary_key=True)
    canal = models.ForeignKey(canais, on_delete=models.CASCADE)
    lead = models.ForeignKey(ger_entidade, on_delete=models.CASCADE)
    cadastro_dt = models.DateTimeField(auto_now_add=True, null=True)
    alteracao_dt = models.DateTimeField(auto_now=True, null=True)
    exclusao_dt = models.DateTimeField(null=True)
    statusregistro_id = models.IntegerField(default=200, null=True)

    class Meta:
        db_table = 'canais_leads'


class usuario_lead(models.Model):
    id = models.AutoField(primary_key=True)
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    lead = models.ForeignKey(ger_entidade, on_delete=models.CASCADE)
    cadastro_dt = models.DateTimeField(auto_now_add=True, null=True)
    alteracao_dt = models.DateTimeField(auto_now=True, null=True)
    exclusao_dt = models.DateTimeField(null=True)
    statusregistro_id = models.IntegerField(default=200, null=True)

    class Meta:
        db_table = 'usuario_lead'



# class mensagens_spl(models.Model):
#     id = models.AutoField(primary_key=True)
#     conteudo = models.TextField(null=True)
#     lista = [
#         ('lida', 'Lida'),
#         ('entregue', 'Entregue'),
#         ('enviada', 'Enviada'),
#         ('clicada', 'Clicada')
#     ]
#     status = models.CharField(max_length=20, null=True, choices=lista)
#     data_envio = models.DateTimeField(null=True)
