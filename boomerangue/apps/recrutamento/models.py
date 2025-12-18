from django.db import models
from login.models import Usuario
from boomerangue.apps.ger_empresas.models import ger_empresas, ger_unidade
from django.utils import timezone

class vagas(models.Model):
    job_id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=255)
    empresa = models.ForeignKey(ger_empresas, on_delete=models.PROTECT)
    description = models.TextField(null=True)
    jobstatus = models.CharField(max_length=50, null=True)
    creation_date = models.DateTimeField(auto_now_add=True)
    dtcadastro = models.DateTimeField(auto_now_add=True,null=True)
    dtalteracao = models.DateTimeField(null=True)
    dtexclusao = models.DateTimeField(null=True)
    statusregistro_id = models.IntegerField(default=200, null=True)
    user_id = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True)
    unidade_id = models.ForeignKey(ger_unidade, on_delete=models.SET_NULL, null=True)

    class Meta:
        db_table = 'jobs'  # Substitua pelo nome real da tabela


class CandidateStatus(models.Model):
    status_id = models.AutoField(primary_key=True)
    status_description = models.CharField(max_length=255, blank=False, db_collation='utf8mb4_unicode_ci')
    empresa = models.ForeignKey(ger_empresas, on_delete=models.PROTECT, null=True)
    dtcadastro = models.DateTimeField(auto_now_add=True,null=True, blank=True)
    dtalteracao = models.DateTimeField(null=True, blank=True)
    dtexclusao = models.DateTimeField(null=True, blank=True)
    situacao_id = models.IntegerField(default=200, null=True)
    user = models.ForeignKey(
        Usuario,
        on_delete=models.PROTECT,
        null=True,
        db_column='user_id'
    )
    unidade = models.ForeignKey(
        ger_unidade,  # Supondo que existe um modelo Unidade
        on_delete=models.PROTECT,
        null=True,
        db_column='unidade_id'
    )
    status_description_short = models.CharField(max_length=20, null=True, blank=True)
    corkankan = models.CharField(max_length=10, default='&000000', null=True)
    status_agrupado = models.CharField(max_length=40, default='padrao', null=True)
    icon = models.CharField(max_length=50, null=True)
    ordemcandstatus = models.IntegerField(null=True)

    class Meta:
        db_table = 'candidate_status'  # Substitua pelo nome real da tabela

class Candidates(models.Model):
    candidate_id = models.AutoField(primary_key=True)
    job_id = models.ForeignKey(vagas, on_delete=models.SET_NULL, null=True)
    candidate = models.CharField(max_length=255)
    empresa = models.ForeignKey(ger_empresas, on_delete=models.PROTECT, null=True)
    email = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, null=True, blank=True)
    # Se quiser que registration_date receba a data/hora atual automaticamente:
    registration_date = models.DateTimeField(default=timezone.now)
    # Ou use auto_now_add para preencher somente na criação:
    # registration_date = models.DateTimeField(auto_now_add=True)
    
    sex = models.CharField(max_length=1, default='M', null=True, blank=True)
    status_id = models.ForeignKey(CandidateStatus, on_delete=models.SET_NULL, null=True)
    dtcadastro = models.DateTimeField(null=True, blank=True, auto_now_add=True)
    dtalteracao = models.DateTimeField(null=True, blank=True)
    dtexclusao = models.DateTimeField(null=True, blank=True)
    situacao_id = models.IntegerField(null=True, blank=True)
    user_id = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, related_name='candidates_as_user')
    unidade_id = models.ForeignKey(ger_unidade, on_delete=models.SET_NULL, null=True)
    cpf = models.CharField(max_length=50, null=True, blank=True)
    chave_edi = models.CharField(max_length=50, null=True, blank=True)
    dtiniciopreenchimento = models.DateTimeField(null=True, blank=True)
    dtultimopreenchimento = models.DateTimeField(null=True, blank=True)
    dtenvioflow = models.DateTimeField(null=True, blank=True)
    photo_candidate = models.CharField(max_length=300, null=True, blank=True)
    notasinternas = models.TextField(null=True, blank=True)  # mediumtext
    fonterecurtamento = models.CharField(max_length=45, null=True, blank=True)
    recrutador_id = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, related_name='candidates_as_recruiter')
    tokencandidate = models.CharField(max_length=50, null=True, blank=True)
    dtConfirmacaoGed = models.DateTimeField(null=True, blank=True)
    dtConfirmacaoCPF = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.candidate} (ID: {self.candidate_id})"
    
    class Meta:
        db_table = 'candidates'

class CandidateInfo(models.Model):
    candidate_info_id = models.AutoField(primary_key=True)
    document_id = models.IntegerField(null=True, blank=True)
    candidate_id = models.ForeignKey(Candidates, on_delete=models.PROTECT, null=True)
    document_type_id = models.IntegerField(null=True, blank=True)
    message_id = models.IntegerField(null=True, blank=True)
    eventos_id = models.IntegerField(null=True, blank=True)
    template_id = models.IntegerField(null=True, blank=True)
    flow_id = models.IntegerField(null=True, blank=True)
    
    candidate_info = models.CharField(max_length=255, null=True, blank=True)
    candidate_data = models.TextField(null=True, blank=True)  # mediumtext
    
    Origem_inro = models.CharField(max_length=10, null=True, blank=True)
    chave_edi = models.CharField(max_length=100, null=True, blank=True)
    
    dtcadastro = models.DateTimeField(null=True, blank=True)
    dtalteracao = models.DateTimeField(null=True, blank=True)
    dtexclusao = models.DateTimeField(null=True, blank=True)
    
    # De acordo com a imagem, situacao_id tem default 200
    situacao_id = models.IntegerField(default=200, null=True, blank=True)
    
    user_id = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True)
    unidade_id = models.ForeignKey(ger_unidade, on_delete=models.SET_NULL, null=True)

    class Meta:
        db_table = 'candidate_info'

    def __str__(self):
        return f"CandidateInfo {self.candidate_info_id}"
    


class Applications(models.Model):
    application_id = models.AutoField(primary_key=True)
    candidate = models.ForeignKey(
        Candidates,
        on_delete=models.CASCADE,
        db_column='candidate_id'
    )
    job = models.ForeignKey(
        vagas,
        on_delete=models.CASCADE,
        db_column='job_id'
    )
    empresa = models.ForeignKey(ger_empresas, on_delete=models.PROTECT, null=True)
    application_status = models.CharField(max_length=50, null=True)
    application_date = models.DateTimeField(auto_now_add=True)
    dtcadastro = models.DateTimeField(auto_now_add=True, null=True)
    dtalteracao = models.DateTimeField(null=True)
    dtexclusao = models.DateTimeField(null=True)
    situacao_id = models.IntegerField(default=200)
    user = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        db_column='user_id'
    )
    unidade = models.ForeignKey(
        ger_unidade,
        on_delete=models.SET_NULL,
        null=True,
        db_column='unidade_id'
    )

    class Meta:
        db_table = 'applications'
        indexes = [
            models.Index(fields=['job'], name='idx_applications_job_id'),
            models.Index(fields=['candidate'], name='idx_applications_candidate_id'),
        ]


class DocumentTypeStd(models.Model):
    document_type_std_id = models.AutoField(primary_key=True)
    document_type_std = models.CharField(max_length=50)
    empresa = models.ForeignKey(ger_empresas, on_delete=models.PROTECT, null=True)
    processo = models.CharField(max_length=1, default='R')
    dtcadastro = models.DateTimeField(null=True)
    dtalteracao = models.DateTimeField(null=True)
    dtexclusao = models.DateTimeField(null=True)
    situacao_id = models.IntegerField(default=200)
    user = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        db_column='user_id'
    )
    column_9 = models.IntegerField(null=True)
    unidade = models.ForeignKey(
        ger_unidade,
        on_delete=models.SET_NULL,
        null=True,
        db_column='unidade_id'
    )

    class Meta:
        db_table = 'document_type_std'


class DocumentTypes(models.Model):
    document_type_id = models.AutoField(primary_key=True)
    document_type_std = models.ForeignKey(
        DocumentTypeStd,
        on_delete=models.CASCADE,
        db_column='document_type_std_id'
    )
    type_description = models.CharField(max_length=60)
    help_text = models.TextField(null=True)
    docobrigatorio = models.CharField(max_length=1, default='N')
    docorder = models.CharField(max_length=4, default='0000')
    dtcadastro = models.DateTimeField(null=True)
    dtalteracao = models.DateTimeField(null=True)
    dtexclusao = models.DateTimeField(null=True)
    situacao_id = models.IntegerField(default=200)
    user = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        db_column='user_id'
    )
    unidade = models.ForeignKey(
        ger_unidade,
        on_delete=models.SET_NULL,
        null=True,
        db_column='unidade_id'
    )
    short_description = models.CharField(max_length=45, null=True)
    tokenged = models.CharField(max_length=50, null=True)
    agendamento = models.CharField(max_length=1, default='N')
    tokentypedoc = models.CharField(max_length=50, null=True)
    flow_id = models.CharField(max_length=50, null=True)

    class Meta:
        db_table = 'document_types'


class UnitConfig(models.Model):
    unidade = models.OneToOneField(
        ger_unidade,
        on_delete=models.CASCADE,
        primary_key=True,
        db_column='unidade_id'
    )
    cnpj = models.CharField(max_length=20, null=True)
    empresa = models.ForeignKey(ger_empresas, on_delete=models.PROTECT, null=True)
    tokenempresa_ged = models.CharField(max_length=100, null=True)
    boomerangue_url = models.CharField(max_length=100, null=True)
    boomerangue_empresa_token = models.CharField(max_length=100, null=True)
    boomerangue_apikey = models.CharField(max_length=100, null=True)
    event_bemvindo_id = models.IntegerField(null=True)
    event_mensagem_id = models.IntegerField(null=True)
    event_reenvio_id = models.IntegerField(null=True)
    event_finalizou_id = models.IntegerField(null=True)
    dtcadastro = models.DateTimeField(null=True)
    dtalteracao = models.DateTimeField(null=True)
    dtexclusao = models.DateTimeField(null=True)
    situacao_id = models.IntegerField(default=200)
    user = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        db_column='user_id'
    )
    event_agendamento = models.IntegerField(null=True)
    chavebot = models.CharField(max_length=50, null=True)
    tokenthinkhire = models.CharField(max_length=50, null=True)

    class Meta:
        db_table = 'unit_config'


class DocumentFields(models.Model):
    document_fields_id = models.AutoField(primary_key=True)
    document = models.ForeignKey(
        'Documents',
        on_delete=models.CASCADE,
        db_column='document_id',
        null=True
    )
    document_types_field = models.ForeignKey(
        'DocumentTypesFields',
        on_delete=models.CASCADE,
        db_column='document_types_field_id'
    )
    conteudo = models.CharField(max_length=500, null=True)
    dtCadastro = models.DateTimeField(auto_now_add=True)
    usuario = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        db_column='usuario_id'
    )
    dtAlteracao = models.DateTimeField(null=True)
    dtExclusao = models.DateTimeField(null=True)
    situacao_id = models.IntegerField(default=200)
    empresa = models.ForeignKey(ger_empresas, on_delete=models.PROTECT, null=True)

    class Meta:
        db_table = 'document_fields'

class DocumentReasons(models.Model):
    document_reasons_id = models.AutoField(primary_key=True)
    document_reasons = models.CharField(max_length=50)
    empresa = models.ForeignKey(ger_empresas, on_delete=models.PROTECT, null=True)
    dtcadastro = models.DateTimeField(auto_now_add=True)
    dtalteracao = models.DateTimeField(null=True)
    dtexclusao = models.DateTimeField(null=True)
    situacao_id = models.IntegerField(default=200)
    user = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        db_column='user_id'
    )
    unidade = models.ForeignKey(
        ger_unidade,
        on_delete=models.SET_NULL,
        null=True,
        db_column='unidade_id'
    )

    class Meta:
        db_table = 'document_reasons'

class DocumentStatus(models.Model):
    document_status_id = models.AutoField(primary_key=True)
    document_status = models.CharField(max_length=50)
    dtcadastro = models.DateTimeField(auto_now_add=True,null=True)
    empresa = models.ForeignKey(ger_empresas, on_delete=models.PROTECT, null=True)
    dtalteracao = models.DateTimeField(null=True)
    dtexclusao = models.DateTimeField(null=True)
    situacao_id = models.IntegerField(default=200)
    user = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        db_column='user_id'
    )
    unidade = models.ForeignKey(
        ger_unidade,
        on_delete=models.SET_NULL,
        null=True,
        db_column='unidade_id'
    )
    document_status_short = models.CharField(max_length=20, null=True)

    class Meta:
        db_table = 'document_status'

class DocumentTypesFields(models.Model):
    document_types_field_id = models.AutoField(primary_key=True)
    document_type = models.ForeignKey(
        DocumentTypes,
        on_delete=models.CASCADE,
        db_column='document_type_id',
        null=True
    )
    fieldsearch = models.CharField(max_length=100)
    empresa = models.ForeignKey(ger_empresas, on_delete=models.PROTECT, null=True)
    fieldobg = models.CharField(max_length=1, default='N')
    fieldorder = models.CharField(max_length=4, default='0000')
    dtCadastro = models.DateTimeField(auto_now_add=True)
    usuario = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        db_column='usuario_id'
    )
    dtAlteracao = models.DateTimeField(null=True)
    dtExclusao = models.DateTimeField(null=True)
    situacao_id = models.IntegerField(default=200)
    tokenged_tipodoc = models.CharField(max_length=100, null=True)
    tokenfield = models.CharField(max_length=50, null=True)

    class Meta:
        db_table = 'document_types_fields'

class Documents(models.Model):
    document_id = models.AutoField(primary_key=True)
    candidate = models.ForeignKey(
        Candidates,
        on_delete=models.CASCADE,
        db_column='candidate_id',
        null=True
    )
    file_path = models.CharField(max_length=400, null=True)
    upload_date = models.DateTimeField(auto_now_add=True)
    document_type = models.ForeignKey(
        DocumentTypes,
        on_delete=models.SET_NULL,
        null=True,
        db_column='document_type_id'
    )
    document_status = models.IntegerField(default=0)
    dtaprocacao = models.DateTimeField(null=True)
    dtcadastro = models.DateTimeField(null=True)
    dtalteracao = models.DateTimeField(null=True)
    dtexclusao = models.DateTimeField(null=True)
    situacao_id = models.IntegerField(default=200)
    user = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        db_column='user_id'
    )
    unidade = models.ForeignKey(
        ger_unidade,
        on_delete=models.SET_NULL,
        null=True,
        db_column='unidade_id'
    )
    document_complement = models.CharField(max_length=100, null=True)
    document_side = models.CharField(max_length=100, default='Frente')
    document_obs = models.TextField(null=True)
    chave_edi = models.CharField(max_length=100, null=True)
    informacaoprincipal = models.CharField(max_length=200, null=True)
    document_reasons = models.ForeignKey(
        DocumentReasons,
        on_delete=models.SET_NULL,
        null=True,
        db_column='document_reasons_id'
    )
    imageoriginal = models.CharField(max_length=400, null=True)
    ged_token = models.CharField(max_length=50, null=True)
    ged_status = models.CharField(max_length=1, default='A')
    empresa = models.ForeignKey(ger_empresas, on_delete=models.PROTECT, null=True)
    tokendocument = models.CharField(max_length=50, null=True)
    ged_update = models.DateTimeField(null=True)
    verImage = models.IntegerField(default=0)
    dtConfirmacaoDocGed = models.DateTimeField(null=True)

    class Meta:
        db_table = 'documents'
        unique_together = (('candidate', 'document_type', 'document_side', 'document_complement'),)

class Event(models.Model):
    eventos_id = models.AutoField(primary_key=True)
    eventos = models.CharField(max_length=50)
    telefone = models.CharField(max_length=50)
    template = models.ForeignKey(
        'Template',
        on_delete=models.SET_NULL,
        null=True,
        db_column='template_id'
    )
    flow = models.ForeignKey(
        'Flow',
        on_delete=models.SET_NULL,
        null=True,
        db_column='flow_id'
    )
    usa_template = models.CharField(max_length=1, default='S')
    evento_ativo = models.CharField(max_length=1, default='S')
    dtcadastro = models.DateTimeField(null=True)
    dtalteracao = models.DateTimeField(null=True)
    empresa = models.ForeignKey(ger_empresas, on_delete=models.PROTECT, null=True)
    dtexclusao = models.DateTimeField(null=True)
    situacao_id = models.IntegerField(default=200)
    user = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        db_column='user_id'
    )
    unidade = models.ForeignKey(
        ger_unidade,
        on_delete=models.SET_NULL,
        null=True,
        db_column='unidade_id'
    )

    class Meta:
        db_table = 'event'

class Flow(models.Model):
    flow_id = models.AutoField(primary_key=True)
    flow = models.CharField(max_length=50)
    flow_json = models.JSONField(null=True)
    chave_edi = models.CharField(max_length=50, null=True)
    flow_ativo = models.CharField(max_length=1, default='S')
    dtcadastro = models.DateTimeField(null=True)
    dtalteracao = models.DateTimeField(null=True)
    empresa = models.ForeignKey(ger_empresas, on_delete=models.PROTECT, null=True)
    dtexclusao = models.DateTimeField(null=True)
    situacao_id = models.IntegerField(default=200)
    user = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        db_column='user_id'
    )
    unidade = models.ForeignKey(
        ger_unidade,
        on_delete=models.SET_NULL,
        null=True,
        db_column='unidade_id'
    )

    class Meta:
        db_table = 'flow'

class JobsDocumentTypes(models.Model):
    jobs_document_types_id = models.AutoField(primary_key=True)
    job = models.ForeignKey(
        vagas,
        on_delete=models.CASCADE,
        db_column='job_id',
        null=True
    )
    document_type = models.ForeignKey(
        DocumentTypes,
        on_delete=models.CASCADE,
        db_column='document_types_id',
        null=True
    )
    docobg = models.CharField(max_length=1, default='N')
    docorder = models.CharField(max_length=4, default='0000')
    dtCadastro = models.DateTimeField(auto_now_add=True)
    usuario = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        db_column='usuario_id'
    )
    dtAlteracao = models.DateTimeField(null=True)
    dtExclusao = models.DateTimeField(null=True)
    situacao_id = models.IntegerField(default=200)
    empresa = models.ForeignKey(ger_empresas, on_delete=models.PROTECT, null=True)

    class Meta:
        db_table = 'jobs_document_types'

class MessageStatus(models.Model):
    message_status_id = models.AutoField(primary_key=True)
    message_description = models.CharField(max_length=255)
    dtcadastro = models.DateTimeField(null=True)
    dtalteracao = models.DateTimeField(null=True)
    empresa = models.ForeignKey(ger_empresas, on_delete=models.PROTECT, null=True)
    dtexclusao = models.DateTimeField(null=True)
    situacao_id = models.IntegerField(default=200)
    user = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        db_column='user_id'
    )
    unidade = models.ForeignKey(
        ger_unidade,
        on_delete=models.SET_NULL,
        null=True,
        db_column='unidade_id'
    )

    class Meta:
        db_table = 'message_status'

class Messages(models.Model):
    message_id = models.AutoField(primary_key=True)
    usuario = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        db_column='usuario_id',
        related_name='messages_as_usuario'
    )
    candidate = models.ForeignKey(
        Candidates,
        on_delete=models.CASCADE,
        db_column='candidate_id',
        null=True
    )
    document_type = models.ForeignKey(
        DocumentTypes,
        on_delete=models.SET_NULL,
        null=True,
        related_name='document_type',
        db_column='document_type_id'
    )
    fluxo = models.CharField(max_length=2, default='IN')
    message_content = models.TextField(null=True)
    send_date = models.DateTimeField(auto_now_add=True)
    msg_lida = models.BooleanField(default=False)
    dtcadastro = models.DateTimeField(null=True)
    dtalteracao = models.DateTimeField(null=True)
    dtexclusao = models.DateTimeField(null=True)
    situacao_id = models.IntegerField(default=200)
    user = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        db_column='user_id',
        related_name='messages_as_user'
    )
    unidade = models.ForeignKey(
        ger_unidade,
        on_delete=models.SET_NULL,
        null=True,
        db_column='unidade_id'
    )
    dtenviomensagem = models.DateTimeField(null=True)
    template_id = models.CharField(max_length=100, null=True)
    flow_id = models.CharField(max_length=100, null=True)
    message_status = models.ForeignKey(
        MessageStatus,
        on_delete=models.SET_NULL,
        null=True,
        db_column='message_status_id',
        default=1
    )
    enviardestinatario = models.CharField(max_length=1, default='N')
    phonedestino = models.CharField(max_length=100, null=True)
    document = models.ForeignKey(
        Documents,
        on_delete=models.SET_NULL,
        null=True,
        db_column='document_id'
    )
    tp_message = models.CharField(max_length=20, default='NORMAL')
    var01 = models.CharField(max_length=50, null=True)
    var02 = models.CharField(max_length=50, null=True)
    var03 = models.CharField(max_length=50, null=True)
    usavar = models.CharField(max_length=1, default='N')
    flow01 = models.CharField(max_length=100, null=True)
    flow02 = models.CharField(max_length=100, null=True)
    flow03 = models.CharField(max_length=100, null=True)
    phoneanterior = models.CharField(max_length=45, null=True)
    document_type_reenvio = models.ForeignKey(
        DocumentTypes,
        on_delete=models.SET_NULL,
        null=True,
        related_name='reenvio_document_type',
        db_column='document_type_reenvio_id'
    )

    class Meta:
        db_table = 'messages'
        indexes = [
            models.Index(fields=['enviardestinatario', 'tp_message', 'dtenviomensagem', 'document'], 
                      name='idx_msg_dest_status'),
        ]

class OperationLogs(models.Model):
    log_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        db_column='user_id'
    )
    candidate = models.ForeignKey(
        Candidates,
        on_delete=models.SET_NULL,
        null=True,
        db_column='candidate_id'
    )
    unidade = models.ForeignKey(
        ger_unidade,
        on_delete=models.SET_NULL,
        null=True,
        db_column='unidade_id'
    )
    operation_date = models.DateTimeField(auto_now_add=True)
    operation_type = models.CharField(max_length=50)
    description = models.TextField(null=True)
    ip_address = models.CharField(max_length=45, null=True)
    register = models.IntegerField(null=True)
    flow_id = models.CharField(max_length=100, null=True)
    template_id = models.CharField(max_length=100, null=True)

    class Meta:
        db_table = 'operation_logs'

class Process(models.Model):
    process_id = models.AutoField(primary_key=True)
    candidate = models.ForeignKey(
        Candidates,
        on_delete=models.SET_NULL,
        null=True,
        db_column='candidate_id'
    )
    unidade = models.ForeignKey(
        ger_unidade,
        on_delete=models.SET_NULL,
        null=True,
        db_column='unidade_id'
    )
    type_process_id = models.CharField(max_length=3, default='MOU')
    modelo = models.CharField(max_length=100, null=True)
    texto = models.TextField(null=True)
    dtcadastro = models.DateTimeField(auto_now_add=True)
    dtalteracao = models.DateTimeField(auto_now=True)
    dtexclusao = models.DateTimeField(null=True)
    situacao_id = models.IntegerField(null=True)
    user = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        db_column='user_id'
    )
    chave_edi = models.CharField(max_length=50, null=True)
    dtprocessamento = models.DateTimeField(null=True)
    status_processamento = models.CharField(max_length=1, default='P')
    status_anterior = models.IntegerField(null=True)
    status_novo = models.IntegerField(null=True)

    class Meta:
        db_table = 'process'

class Template(models.Model):
    template_id = models.AutoField(primary_key=True)
    template = models.CharField(max_length=50)
    template_json = models.JSONField(null=True)
    template_ativo = models.CharField(max_length=1, default='S')
    empresa = models.ForeignKey(ger_empresas, on_delete=models.PROTECT, null=True)
    chave_edi = models.CharField(max_length=50, null=True)
    dtcadastro = models.DateTimeField(null=True)
    dtalteracao = models.DateTimeField(null=True)
    dtexclusao = models.DateTimeField(null=True)
    situacao_id = models.IntegerField(default=200)
    user = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        db_column='user_id'
    )
    unidade = models.ForeignKey(
        ger_unidade,
        on_delete=models.SET_NULL,
        null=True,
        db_column='unidade_id'
    )
    template_msg = models.TextField(null=True)
    templateusavar = models.CharField(max_length=1, default='N')

    class Meta:
        db_table = 'template'


# class SystemGroup(models.Model):
#     id = models.AutoField(primary_key=True)
#     name = models.CharField(max_length=100, null=True)
#     uuid = models.CharField(max_length=36, null=True)

#     class Meta:
#         db_table = 'system_group'

# class SystemProgram(models.Model):
#     id = models.AutoField(primary_key=True)
#     name = models.CharField(max_length=100, null=True)
#     controller = models.CharField(max_length=100, null=True)

#     class Meta:
#         db_table = 'system_program'

# class SystemGroupProgram(models.Model):
#     id = models.AutoField(primary_key=True)
#     system_group = models.ForeignKey(
#         SystemGroup,
#         on_delete=models.CASCADE,
#         db_column='system_group_id',
#         null=True
#     )
#     system_program = models.ForeignKey(
#         SystemProgram,
#         on_delete=models.CASCADE,
#         db_column='system_program_id',
#         null=True
#     )

#     class Meta:
#         db_table = 'system_group_program'

# class SystemPreference(models.Model):
#     id = models.TextField(primary_key=True)  # Campo original é mediumtext
#     preference = models.TextField(null=True)

#     class Meta:
#         db_table = 'system_preference'

# class SystemUnit(models.Model):
#     id = models.AutoField(primary_key=True)
#     name = models.CharField(max_length=100, null=True)
#     connection_name = models.CharField(max_length=100, null=True)
#     flow_id = models.CharField(max_length=100, null=True)
#     bot_id = models.CharField(max_length=100, null=True)
#     message_modelo_id = models.CharField(max_length=100, null=True)
#     message_modelo_json = models.JSONField(null=True)
#     message_finalizado_id = models.CharField(max_length=100, null=True)
#     message_finalizado_contatos = models.CharField(max_length=100, null=True)
#     cnpj = models.CharField(max_length=20, null=True)
#     boomerangue_url = models.CharField(max_length=100, null=True)
#     boomerangue_empresa_id = models.IntegerField(null=True)
#     boomerangue_apikey = models.CharField(max_length=100, null=True)
#     message_bemvindo_id = models.CharField(max_length=100, null=True)
#     message_bemvindo_json = models.JSONField(null=True)
#     message_reenvio_id = models.CharField(max_length=100, null=True)
#     message_reenvio_json = models.JSONField(null=True)
#     message_agenda_id = models.CharField(max_length=100, null=True)
#     message_agenda_json = models.JSONField(null=True)
#     message_agenda_flow1 = models.CharField(max_length=50, null=True)
#     message_agenda_flow2 = models.CharField(max_length=50, null=True)
#     message_agenda_flow3 = models.CharField(max_length=50, null=True)
#     message_notificacao_id = models.CharField(max_length=100, null=True)
#     message_notificacao_json = models.JSONField(null=True)
#     message_notificacao_flow1 = models.CharField(max_length=50, null=True)
#     message_notificacao_flow2 = models.CharField(max_length=50, null=True)
#     message_notificacao_flow3 = models.CharField(max_length=50, null=True)

#     class Meta:
#         db_table = 'system_unit'

# class SystemUsers(models.Model):
#     id = models.AutoField(primary_key=True)
#     name = models.CharField(max_length=100, null=True)
#     login = models.CharField(max_length=100, null=True)
#     password = models.CharField(max_length=100, null=True)
#     email = models.CharField(max_length=100, null=True)
#     frontpage = models.ForeignKey(
#         SystemProgram,
#         on_delete=models.SET_NULL,
#         null=True,
#         db_column='frontpage_id'
#     )
#     system_unit = models.ForeignKey(
#         SystemUnit,
#         on_delete=models.SET_NULL,
#         null=True,
#         db_column='system_unit_id'
#     )
#     active = models.CharField(max_length=1, null=True, default='N')
#     accepted_term_policy = models.CharField(max_length=1, null=True)
#     accepted_term_policy_at = models.TextField(null=True)
#     NotificationAdmin = models.CharField(max_length=1, default='N')

#     class Meta:
#         db_table = 'system_users'

# class SystemUserGroup(models.Model):
#     id = models.AutoField(primary_key=True)
#     system_user = models.ForeignKey(
#         SystemUsers,
#         on_delete=models.CASCADE,
#         db_column='system_user_id',
#         null=True
#     )
#     system_group = models.ForeignKey(
#         SystemGroup,
#         on_delete=models.CASCADE,
#         db_column='system_group_id',
#         null=True
#     )

#     class Meta:
#         db_table = 'system_user_group'

# class SystemUserProgram(models.Model):
#     id = models.AutoField(primary_key=True)
#     system_user = models.ForeignKey(
#         SystemUsers,
#         on_delete=models.CASCADE,
#         db_column='system_user_id',
#         null=True
#     )
#     system_program = models.ForeignKey(
#         SystemProgram,
#         on_delete=models.CASCADE,
#         db_column='system_program_id',
#         null=True
#     )

#     class Meta:
#         db_table = 'system_user_program'

# class SystemUserUnit(models.Model):
#     id = models.AutoField(primary_key=True)
#     system_user = models.ForeignKey(
#         SystemUsers,
#         on_delete=models.CASCADE,
#         db_column='system_user_id',
#         null=True
#     )
#     system_unit = models.ForeignKey(
#         SystemUnit,
#         on_delete=models.CASCADE,
#         db_column='system_unit_id',
#         null=True
#     )

#     class Meta:
#         db_table = 'system_user_unit'

# class SystemAccessLog(models.Model):
#     id = models.AutoField(primary_key=True)
#     sessionid = models.TextField(null=True)
#     login = models.TextField(null=True)
#     login_time = models.DateTimeField(null=True)
#     login_year = models.CharField(max_length=4, null=True)
#     login_month = models.CharField(max_length=2, null=True)
#     login_day = models.CharField(max_length=2, null=True)
#     logout_time = models.DateTimeField(null=True)
#     impersonated = models.CharField(max_length=1, null=True)
#     access_ip = models.CharField(max_length=45, null=True)
#     impersonated_by = models.CharField(max_length=200, null=True)

#     class Meta:
#         db_table = 'system_access_log'

# class SystemAccessNotificationLog(models.Model):
#     id = models.AutoField(primary_key=True)
#     login = models.TextField(null=True)
#     email = models.TextField(null=True)
#     ip_address = models.TextField(null=True)
#     login_time = models.TextField(null=True)

#     class Meta:
#         db_table = 'system_access_notification_log'

# class SystemChangeLog(models.Model):
#     id = models.AutoField(primary_key=True)
#     logdate = models.DateTimeField(null=True)
#     login = models.TextField(null=True)
#     tablename = models.TextField(null=True)
#     primarykey = models.TextField(null=True)
#     pkvalue = models.TextField(null=True)
#     operation = models.TextField(null=True)
#     columnname = models.TextField(null=True)
#     oldvalue = models.TextField(null=True)
#     newvalue = models.TextField(null=True)
#     access_ip = models.TextField(null=True)
#     transaction_id = models.TextField(null=True)
#     log_trace = models.TextField(null=True)
#     session_id = models.TextField(null=True)
#     class_name = models.TextField(null=True)
#     php_sapi = models.TextField(null=True)
#     log_year = models.CharField(max_length=4, null=True)
#     log_month = models.CharField(max_length=2, null=True)
#     log_day = models.CharField(max_length=2, null=True)

#     class Meta:
#         db_table = 'system_change_log'

# class SystemRequestLog(models.Model):
#     id = models.AutoField(primary_key=True)
#     endpoint = models.TextField(null=True)
#     logdate = models.TextField(null=True)
#     log_year = models.CharField(max_length=4, null=True)
#     log_month = models.CharField(max_length=2, null=True)
#     log_day = models.CharField(max_length=2, null=True)
#     session_id = models.TextField(null=True)
#     login = models.TextField(null=True)
#     access_ip = models.TextField(null=True)
#     class_name = models.TextField(null=True)
#     http_host = models.TextField(null=True)
#     server_port = models.TextField(null=True)
#     request_uri = models.TextField(null=True)
#     request_method = models.TextField(null=True)
#     query_string = models.TextField(null=True)
#     request_headers = models.TextField(null=True)
#     request_body = models.TextField(null=True)  # LongText
#     request_duration = models.IntegerField(null=True)

#     class Meta:
#         db_table = 'system_request_log'

# class SystemSqlLog(models.Model):
#     id = models.AutoField(primary_key=True)
#     logdate = models.DateTimeField(null=True)
#     login = models.TextField(null=True)
#     database_name = models.TextField(null=True)
#     sql_command = models.TextField(null=True)  # LongText
#     statement_type = models.TextField(null=True)
#     access_ip = models.CharField(max_length=45, null=True)
#     transaction_id = models.TextField(null=True)
#     log_trace = models.TextField(null=True)
#     session_id = models.TextField(null=True)
#     class_name = models.TextField(null=True)
#     php_sapi = models.TextField(null=True)
#     request_id = models.TextField(null=True)
#     log_year = models.CharField(max_length=4, null=True)
#     log_month = models.CharField(max_length=2, null=True)
#     log_day = models.CharField(max_length=2, null=True)

#     class Meta:
#         db_table = 'system_sql_log'