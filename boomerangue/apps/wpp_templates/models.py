import os
from django.db import models
import uuid
from boomerangue.apps.ger_empresas.models import ger_empresas
from boomerangue.apps.bot_canal.models import bot_canal
from boomerangue.apps.bot.models import Bot

# Função para gerar o caminho de upload dinâmico
def flow_attachment_path(instance, filename):
    # Garante que n8n_workflow_id exista antes de usá-lo
    if hasattr(instance, 'flow'):
        flow = instance.flow
        if not flow.n8n_workflow_id:
            # Se for um novo fluxo, gera o ID antes de salvar o arquivo
            company_id = flow.empresa.id if flow.empresa else "default"
            unique_id = uuid.uuid4()
            flow.n8n_workflow_id = f"{company_id}_workflow_{unique_id}"
        # O arquivo será salvo em MEDIA_ROOT/flows/<n8n_workflow_id>/<filename>
        return f'flows/{flow.n8n_workflow_id}/{filename}'
    elif not instance.n8n_workflow_id:
        # Se for um novo fluxo, gera o ID antes de salvar o arquivo
        company_id = instance.empresa.id if instance.empresa else "default"
        unique_id = uuid.uuid4()
        instance.n8n_workflow_id = f"{company_id}_workflow_{unique_id}"
    # O arquivo será salvo em MEDIA_ROOT/flows/<n8n_workflow_id>/<filename>
    return f'flows/{instance.n8n_workflow_id}/{filename}'

# ... (outros modelos) ...

class wpp_templates(models.Model):
    id = models.BigAutoField(primary_key=True)
    empresa = models.ForeignKey(ger_empresas, on_delete=models.PROTECT, null=True)
    template_name = models.CharField(max_length=255) #
    category = models.CharField(max_length=25, choices=[
        ('ACCOUNT_UPDATE', 'ACCOUNT_UPDATE'),
        ('ALERT_UPDATE', 'ALERT_UPDATE'),
        ('APPOINTMENT_UPDATE', 'APPOINTMENT_UPDATE'),
        ('AUTO_REPLY', 'AUTO_REPLY'),
        ('ISSUE_RESOLUTION', 'ISSUE_RESOLUTION'),
        ('PAYMENT_UPDATE', 'PAYMENT_UPDATE'),
        ('PERSONAL_FINANCE_UPDATE', 'PERSONAL_FINANCE_UPDATE'),
        ('RESERVATION_UPDATE', 'RESERVATION_UPDATE'),
        ('SHIPPING_UPDATE', 'SHIPPING_UPDATE'),
        ('TICKET_UPDATE', 'TICKET_UPDATE'),
    ]) #
    language = models.CharField(max_length=10, default='PT-BR')
    cadastro_dt = models.DateTimeField(auto_now_add=True)
    alteracao_dt = models.DateTimeField(auto_now=True)
    exclusao_dt = models.DateTimeField(blank=True, null=True)
    statusregistro_id = models.IntegerField(default=200)
    canal_id = models.ForeignKey(bot_canal, on_delete=models.SET_NULL, null=True)
    bot_id = models.ForeignKey(Bot, on_delete=models.SET_NULL, null=True)
    Repique1 = models.CharField(max_length=1, default='N')
    Repique1minutos = models.IntegerField(default=240, null=True)
    Repique2 = models.CharField(max_length=1, default='N')
    Repique2minutos = models.IntegerField(default=240, null=True)
    CarrinhoAbandonado = models.CharField(max_length=1, default='N')
    CompraRecebida = models.CharField(max_length=1, default='N')
    id_sendpulse = models.CharField(max_length=255, null=True)
    possui_call_to_action = models.CharField(max_length=1, default='N')
    processada_ajuste_resposta = models.CharField(max_length=1, default='N')
    flow_id_1 = models.CharField(max_length=500, null=True)
    flow_id_2 = models.CharField(max_length=500, null=True)
    ajustada_fuxo_mensagens = models.CharField(max_length=1, default='N', null=True)
    status = models.CharField(max_length=30, null=True)
    class Meta:
        db_table = 'wpp_templates'

    def __str__(self):
        return self.template_name
    

class ia_criatividade(models.Model):
    id = models.BigAutoField(primary_key=True)
    criatividade = models.CharField(max_length=255)
    gpt = models.TextField(null=True)
    key = models.TextField(null=True)

    class Meta:
        db_table = 'ia_criatividade'


class ia_tomvoz(models.Model):
    id = models.BigAutoField(primary_key=True)
    tomvoz = models.CharField(max_length=255)
    gpt = models.TextField(null=True)
    key = models.TextField(null = True)

    class Meta:
        db_table = 'ia_tomvoz'


class ia_geracao(models.Model):
    id = models.BigAutoField(primary_key=True)
    empresa = models.ForeignKey(ger_empresas, on_delete=models.PROTECT, null=True)
    prompt_text_produto = models.TextField()
    prompt_publico_alvo = models.TextField(null=True)
    prompt_descricao = models.TextField(null=True)
    criatividade = models.ForeignKey(ia_criatividade, on_delete=models.PROTECT, null=True)
    tomvoz = models.ForeignKey(ia_tomvoz, on_delete=models.PROTECT, null=True)
    text_gerado_ia = models.TextField(null=True, db_collation='utf8mb4_unicode_ci')
    tokens_usados = models.CharField(null=True, max_length=255)
    cadastro_dt = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ia_geracao'


class gpt_engine(models.Model):
    id = models.BigAutoField(primary_key=True)
    gpt_engine = models.TextField(null=True)

    class Meta:
        db_table = 'gpt_engine'


class ia_prompt_settings(models.Model):
    id = models.BigAutoField(primary_key=True)
    prompt = models.TextField(null=True)
    gpt_engine = models.ForeignKey(gpt_engine, on_delete=models.PROTECT, null=True)
    cadastro_dt = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ia_prompt_settings'


class wpp_fields(models.Model):
    id = models.BigAutoField(primary_key=True)
    exibicao = models.CharField(null=True, max_length=100)
    descricao = models.CharField(null=True, max_length=100)
    tabela_origem = models.CharField(null=True, max_length=100)
    campo_origem = models.CharField(null=True, max_length=100)
    tabela_vinculada = models.CharField(null=True, max_length=100)
    tabela_vinculada_2 = models.CharField(null=True, max_length=100)
    campo_vinculado = models.CharField(null=True, max_length=100)
    campo_vinculado_2 = models.CharField(null=True, max_length=100)
    campo_chave = models.CharField(null=True, max_length=100)
    campo_chave_2 = models.CharField(null=True, max_length=100)
    valor_filtragem = models.CharField(null=True, max_length=100)

class callToAction(models.Model):
    id = models.BigAutoField(primary_key=True)
    empresa = models.ForeignKey(ger_empresas, on_delete=models.PROTECT, null=True)
    template = models.ForeignKey(wpp_templates, on_delete=models.PROTECT, null=True, related_name='template_call_to_actions')
    palavra_acao = models.CharField(max_length=100)
    link = models.CharField(null=True, max_length=500)
    template_resposta = models.ForeignKey(wpp_templates, on_delete=models.PROTECT, null=True, related_name='template_resposta_call_to_actions')
    processada = models.CharField(default='N', max_length=1)
    bots_conectados = models.ManyToManyField(Bot, blank=True)
    opcoes = models.CharField(max_length=3, null = True, choices=[
        ('PIX','Pix'),
        ('CPF', 'CPF/CNPJ')                               
    ])
    valor_pix = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    
    class Meta:
        db_table = 'callToAction'



class Flows(models.Model):
    id = models.BigAutoField(primary_key=True)
    empresa = models.ForeignKey(ger_empresas, on_delete=models.PROTECT, null=True)
    title = models.CharField(max_length=200, help_text="Nome ou título do fluxo")
    description = models.TextField(blank=True, null=True)
    userVariables = models.TextField(blank=True, null=True, help_text="JSON string das variáveis definidas pelo usuário no fluxo")
    flow_json = models.JSONField(help_text="Representação JSON do fluxo criado na UI")
    n8n_workflow_id = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="ID único"
    )
    # Mantém para compatibilidade, mas será depreciado em favor do FlowAttachment
    attached_file = models.FileField(
        upload_to=flow_attachment_path,
        null=True,
        blank=True,
        help_text="Arquivo anexado ao nó 'enviar_mensagem' do fluxo (depreciado)"
    )
    n8n_return_id = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="ID do fluxo n8n que retorna o resultado do fluxo"
    )
    cadastro_dt = models.DateTimeField(auto_now_add=True)
    alteracao_dt = models.DateTimeField(auto_now=True)
    exclusao_dt = models.DateTimeField(blank=True, null=True)
    statusregistro_id = models.IntegerField(default=200)

    class Meta:
        db_table = 'flows'

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        # A lógica de geração do n8n_workflow_id já está aqui e será usada pela função flow_attachment_path
        if not self.n8n_workflow_id:
             company_id = self.empresa.id if self.empresa else "default"
             unique_id = uuid.uuid4()
             self.n8n_workflow_id = f"{company_id}_workflow_{unique_id}"

        # Lógica opcional para excluir o arquivo antigo se um novo for enviado
        try:
            this = Flows.objects.get(id=self.id)
            if this.attached_file != self.attached_file:
                # Verifica se o arquivo antigo existe e o exclui
                if this.attached_file and os.path.isfile(this.attached_file.path):
                    os.remove(this.attached_file.path)
        except Flows.DoesNotExist:
            pass # Objeto é novo, não há arquivo antigo para excluir

        super().save(*args, **kwargs)

    # Opcional: Método para excluir o arquivo físico quando o objeto Flow for excluído
    def delete(self, *args, **kwargs):
        if self.attached_file:
             # Verifica se o arquivo existe e o exclui
            if os.path.isfile(self.attached_file.path):
                os.remove(self.attached_file.path)
        super().delete(*args, **kwargs)

# Novo modelo para armazenar múltiplos arquivos por fluxo
class FlowAttachment(models.Model):
    id = models.BigAutoField(primary_key=True)
    flow = models.ForeignKey(Flows, on_delete=models.CASCADE, related_name='attachments')
    node_id = models.CharField(max_length=100, help_text="ID do nó ao qual este arquivo está associado")
    file = models.FileField(upload_to=flow_attachment_path)
    file_name = models.CharField(max_length=255, help_text="Nome original do arquivo")
    file_type = models.CharField(max_length=100, help_text="Tipo MIME do arquivo")
    file_key = models.CharField(max_length=100, help_text="Chave única para identificar este arquivo no flow_json")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'flow_attachments'
        
    def __str__(self):
        return f"Arquivo {self.file_name} para nó {self.node_id} do fluxo {self.flow.title}"
        
    def delete(self, *args, **kwargs):
        # Exclui o arquivo físico ao excluir o registro
        if self.file and os.path.isfile(self.file.path):
            os.remove(self.file.path)
        super().delete(*args, **kwargs)