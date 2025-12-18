from django.db import models
from django.core.exceptions import ValidationError
from django.utils.deconstruct import deconstructible
from django.core.files.images import get_image_dimensions
import os
import xml.etree.ElementTree as ET
#from boomerangue.apps.bot_canal.models import bot_canal


class permissoes_paginas(models.Model):
    nome = models.CharField(max_length=50)
    descricao = models.TextField()

    class Meta:
        db_table = 'permissoes_paginas'


class ger_tipoempresa(models.Model):
    id = models.AutoField(primary_key=True)
    value_prefixo = models.CharField(max_length=5)
    value = models.CharField(max_length=50)
    prompt_IA = models.TextField(null=True, blank=True)
    cadastro_dt = models.DateTimeField(auto_now_add=True)
    alteracao_dt = models.DateTimeField(auto_now=True)
    exclusao_dt = models.DateTimeField(null=True)
    statusregistro_id = models.IntegerField(default=200)

    class Meta:
        db_table = 'ger_tipoempresa'


class prompt_ia(models.Model):
    nome = models.CharField(max_length=50, default='Prompt Relatório IA')
    descricao = models.TextField(default = 'Desenvolva um relatório de vendas detalhado e profissional, apresentando as seguintes métricas chave: Número Total de Boomerangues ({nBoomerangues}), Boomerangues Enviados ({Enviado}), Total de Vendas em Reais (R$ {ValorVendas}), e Ticket Médio ({TicketMedio}). Este relatório deve oferecer uma visão clara e concisa do desempenho de vendas, com foco na análise e interpretação desses dados específicos.')
    tipo_empresa = models.ForeignKey(ger_tipoempresa, on_delete=models.CASCADE)

    class Meta:
        db_table = 'prompt_ia'


class StringPersonalizada(models.Model):
    chave = models.CharField(max_length=255)
    valor = models.TextField()
    lingua = models.CharField(max_length=3, default='pt')
    tipo_empresa = models.ForeignKey(ger_tipoempresa, on_delete=models.CASCADE, default = 1)
    class Meta:
        db_table = 'StringPersonalizada'


class TipoEmpresaPermissao(models.Model):
    tipo_empresa = models.ForeignKey(ger_tipoempresa, on_delete=models.CASCADE)
    permissao = models.ForeignKey(permissoes_paginas, on_delete=models.CASCADE)
    class Meta:
        db_table = 'TipoEmpresaPermissao'


class select_tipo_campanha(models.Model):
    id = models.AutoField(primary_key=True)
    tipo_empresa = models.ForeignKey(ger_tipoempresa, on_delete=models.CASCADE)
    option = models.CharField(max_length=50)
    option_prefix = models.CharField(max_length=5)
    
    class Meta:
        db_table = 'select_tipo_campanha'


# validação de imagem svg

@deconstructible
class ValidateSVG(object):
    def __init__(self, allowed_tags=["svg", "path", "circle", "rect", "polygon", "polyline", "line", "text", "defs", "style", "g", "metadata", "aipgfRef", "aipgf"]):
        self.allowed_tags = allowed_tags

    def __call__(self, value):
        ext = os.path.splitext(value.name)[1]  # [0] returns path+filename
        valid_extensions = ['.jpg', '.png', '.jpeg', '.svg', '.ico']
        if not ext.lower() in valid_extensions:
            raise ValidationError(u'Unsupported file extension.')

        if ext.lower() == '.svg':
            try:
                tree = ET.parse(value)
                root = tree.getroot()
                for elem in root.iter():
                    tag = elem.tag.split('}')[-1]
                    if tag not in self.allowed_tags:
                        raise ValidationError(f"Seu arquivo SVG possuí  uma tag {tag} não permitida em arquivos SVG Neste sistema.")
            except ET.ParseError:
                raise ValidationError("Erro ao analisar o arquivo SVG.")
        # else:
        #     try:
        #         w, h = get_image_dimensions(value)
        #         if w * h > (1920 * 1080):  # example of size validation
        #             raise ValidationError("A imagem é muito grande.")
        #     except Exception as e:
        #         raise ValidationError("Erro ao processar a imagem.")

    def __eq__(self, other):
        return (
            isinstance(other, ValidateSVG) and
            self.allowed_tags == other.allowed_tags
        )


class ger_empresas(models.Model):
    id = models.AutoField(primary_key=True)
    parceiro_id = models.IntegerField(default=1)
    tipoempresa_id = models.CharField(max_length=1, choices=[('M', 'Matriz'), ('F', 'Filial')], default='M')
    empresagestao_id = models.IntegerField(null=True)
    empresa = models.CharField(max_length=200)
    empresa_apelido = models.CharField(max_length=50, blank=True)
    cnpj = models.CharField(max_length=20)
    url_boomerangue = models.CharField(max_length=100, null=True)
    cod_puxada = models.CharField(max_length=50)
    chave_edi = models.CharField(max_length=50)
    cod_empresa = models.CharField(max_length=50)
    edi_integracao = models.CharField(max_length=50)
    tokenapi = models.CharField(max_length=50)
    tokennumerico = models.DecimalField(default=0, max_digits=15, decimal_places=0)
    tokenbmempresa = models.CharField(max_length=50)
    telefonesac = models.CharField(max_length=20, default='(00) 0000-0000')
    codtelefone = models.CharField(max_length=45, null=True)
    prefixopedido = models.CharField(max_length=3, default='PED')
    emailpedidodireto = models.CharField(max_length=200, null=True)
    emailpedidoempresa = models.CharField(max_length=200, null=True)
    emailpedidocopiacliente = models.BooleanField(default=False, null=True)
    comissaopadrao = models.DecimalField(max_digits=18, decimal_places=4, default=1.0000)
    bancodadosfirebase = models.CharField(max_length=100, default='boomeranguev4')
    categoriacorfundo = models.CharField(max_length=10, default='#FFFFFF')
    categoriacorletra = models.CharField(max_length=10, default='#000000')
    extarquivoimg = models.CharField(max_length=10, default='.png')
    integracao_status = models.CharField(max_length=1, null=True, default='0')
    cadastro_dt = models.DateTimeField(auto_now_add=True)
    alteracao_dt = models.DateTimeField(auto_now=True)
    exclusao_dt = models.DateTimeField(null=True)
    statusregistro_id = models.IntegerField(default=900)
    #canal_id = models.ForeignKey(bot_canal, on_delete=models.SET_NULL)
    canal_id = models.IntegerField(null=True)
    bot_id = models.IntegerField(null=True)
    Repique1 = models.CharField(max_length=1, default='N')
    Repique1minutos = models.IntegerField(default=240, null=True)
    Repique2 = models.CharField(max_length=1, default='N')
    Repique2minutos = models.IntegerField(default=240, null=True)
    CarrinhoAbandonado = models.CharField(max_length=1, default='N')
    CompraRecebida = models.CharField(max_length=1, default='N')
    template_resposta = models.CharField(max_length=200, null=True)
    template_optin_clinica = models.CharField(max_length=200, null=True)
    template_envio_clinica = models.CharField(max_length=200, null=True)
    template_envio_vendedores = models.CharField(max_length=200, null=True)
    template_optin_vendedores = models.CharField(max_length=200, null=True)
    # Definindo as opções de tipos de empresa.
    TIPOS_DE_EMPRESA = [
        ('DI', 'Distribuidora'),
        ('H', 'Hospital'),
        ('CM', 'Clínica Médica'),
        ('CD', 'Clínica Dentista'),
        ('I', 'Indústria'),
        ('DF', 'Default')
    ]

    TIPOS_DE_EMPRESA_ID = [
        ('DI', 'Distribuidora'),
        ('HSP', 'Hospital'),
        ('FUN', 'Fundacao'),
        ('IND', 'Industria'),
        ('ICAL', 'Industria Calcados'),
        ('COM', 'Comercio'),
        ('SRV', 'Servicos'),
        ('SEG', 'Seguros'),
        ('MED', 'Medicina'),
        ('ODO', 'Odontologia'),
        ('CLI', 'Clinicas'),
        ('EST', 'Clinicas Esteticas'),
        ('DF', 'Default'),
    ]
    # Definindo o campo 'tipo' no modelo 'ger_empresas' com escolhas (choices).
    # O campo 'tipo' permite que o usuário selecione um tipo de empresa a partir das opções definidas em TIPOS_DE_EMPRESA.
    # O valor padrão é definido como 'Default'.
    tipo = models.CharField(max_length=2, choices=TIPOS_DE_EMPRESA, default='DF')
    tipo_de_negocio =  models.ForeignKey(ger_tipoempresa, models.SET_NULL, null = True)
    botNumeroValidacao = models.CharField(max_length=45, null=True)
    prompt_IA_especifico = models.TextField(null=True, blank=True)
    prompt_IA_mapa = models.TextField(null=True, blank=True)
    image_logo_empresa = models.FileField(max_length=400, null=True, upload_to='media/logo_empresa/', validators=[ValidateSVG()])
    modelo_ia = models.CharField(max_length=200, null=True, blank=True)
    max_tokens_ia = models.IntegerField(default=800, null=True)

    # Método personalizado para obter o valor descritivo do campo 'tipo'.
    def get_tipo_descritivo(self):
        """
        Este método personalizado permite obter o valor descritivo do campo 'tipo' em vez do valor da tupla.
        
        Args:
            self: A instância do objeto ger_empresas.

        Returns:
            str: O valor descritivo do campo 'tipo', correspondente à opção selecionada na instância.
                Retorna 'Default' se não houver correspondência.
        """
        for code, desc in self.TIPOS_DE_EMPRESA:
            if code == self.tipo:
                return desc
        return 'Default'  # Retorna 'Default' se não houver correspondência.


    class Meta:
        db_table = 'ger_empresas'
        indexes = [
            models.Index(fields=['empresa']),
            models.Index(fields=['tokenapi']),
            models.Index(fields=['statusregistro_id']),
        ]

class ger_condicoespagamento(models.Model):
    id = models.AutoField(primary_key=True)
    empresa = models.ForeignKey(ger_empresas, on_delete=models.CASCADE, null=True)
    condicoes_pagamento = models.CharField(max_length=255)
    valor_minimo = models.DecimalField(max_digits=18, decimal_places=6, default=0)
    NroParcelas = models.IntegerField(default=1)
    status_condicoes_pagamento = models.IntegerField(default=0)
    CondicaoPadrao = models.CharField(max_length=1, default='N')
    CondicaoAtiva = models.CharField(max_length=1, default='S')
    prazo_medio = models.IntegerField(default=0)
    EDI_Integracao = models.CharField(max_length=50)
    COD_TIPO_CONDICAO_PAGAMENTO = models.IntegerField(null=True)
    PRC_ADICIONAL_FINANCEIRO = models.FloatField(null=True)
    PRIORIDADE_CONDICAO_PAGAMENTO = models.IntegerField(null=True)
    TIPO_DOCUMENTO = models.CharField(max_length=5, null=True)
    CondicaoAmigavel = models.CharField(max_length=100, null=True)
    CodTipoDocumentoCobranca = models.CharField(max_length=10, default='00')
    Sincronizado = models.CharField(max_length=1, default='N')
    dtSincronizacao = models.DateTimeField(null=True)
    Sincronizador_ver = models.CharField(max_length=12, null=True)
    Sincronizador_id = models.IntegerField(null=True)
    cadastro_dt = models.DateTimeField(auto_now_add=True, null=True)
    alteracao_dt = models.DateTimeField(auto_now=True, null=True)
    exclusao_dt = models.DateTimeField(null=True)
    statusregistro_id = models.IntegerField(default=200)

    class Meta:
        db_table = 'ger_condicoespagamento'
        indexes = [
            models.Index(fields=['empresa']),
            models.Index(fields=['empresa', 'EDI_Integracao']),
            models.Index(fields=['empresa', 'status_condicoes_pagamento', 'CodTipoDocumentoCobranca']),
            models.Index(fields=['empresa', 'condicoes_pagamento']),
        ]


class ger_empresa_b2b (models.Model):
    id = models.AutoField(primary_key=True)
    empresa = models.ForeignKey(ger_empresas, on_delete=models.CASCADE)
    b2b_store_id = models.IntegerField(null=True)
    b2b_integra = models.BooleanField(default=False)
    b2b_usaescalonamentopreco = models.IntegerField(default=1)
    b2b_usacupomdesconto = models.IntegerField(default=1)
    b2b_usaplanofidelidade = models.IntegerField(default=0)
    b2b_integradolokalizei = models.IntegerField(default=0)
    b2b_idcostumerlojalizei = models.CharField(max_length=45, default='0')
    b2b_integradobot = models.IntegerField(default=1)
    b2b_nomebot = models.CharField(max_length=45, default='plubot')
    b2b_nomeservicobot = models.CharField(max_length=45, default='plugsrvbot')
    b2b_precos_idtabelapadrao = models.IntegerField(default=0)
    b2b_logo_empresa_color = models.CharField(max_length=100)
    b2b_logo_empresa_bco = models.CharField(max_length=100)
    b2b_integradorativo = models.CharField(max_length=1, choices=[('S', 'Sim'), ('N', 'Não')], default='S')
    b2b_parceiro = models.CharField(max_length=50, default='PlugThink')
    b2b_nome_integrador = models.CharField(max_length=50, default='PlugThink')
    b2b_dataultimasincronizacao = models.DateTimeField(null=True)
    b2b_template_integracao = models.CharField(max_length=50, default='PADRAO')
    b2b_exportafirebase = models.CharField(max_length=1, default='N')
    b2b_exportapreco = models.CharField(max_length=1, default='N')
    b2b_usatabelaunica = models.CharField(max_length=1, default='S')
    b2b_tabelaprecopadrao_id = models.IntegerField(null=True)
    b2b_firebaseexportador = models.CharField(max_length=45, default='OLAPDV')
    b2b_produtosusarnomepersonalizado = models.CharField(max_length=1, default='N')
    b2b_empresademonstracao = models.CharField(max_length=1, default='N')
    b2b_formatoarquivoexportacao = models.CharField(max_length=100, default='c:\exporta\$$CODP​UXADA$$\Pedidos\\')
    b2b_pedidoexportacaoarquivo = models.CharField(max_length=45, default='FLAG')
    b2b_pedido_nome_arquivo = models.CharField(max_length=100, default='PEDIDO_$$CODP​UXADA$$DATAESP$$PED.TXT')
    b2b_pedido_formato = models.CharField(max_length=10, default='000000')
    b2b_pedido_formato_data = models.CharField(max_length=10, default='YYYYMMDD')
    b2b_cliente_nome_arquivo = models.CharField(max_length=45, default='PDV_$$CODP​UXADA$$DATAESP$$CLI.TXT')
    b2b_cadastro_clientes = models.CharField(max_length=1)
    b2b_integrador_inicio = models.DateTimeField(null=True)
    b2b_integrador_ult_atividade = models.DateTimeField(null=True)
    b2b_integrador_fim = models.DateTimeField(null=True)
    b2b_integrador_status_atual = models.CharField(max_length=200, default='Integrado')
    b2b_integrador_liberado = models.CharField(max_length=1, default='S')
    b2b_categoria_especiais = models.CharField(max_length=1, default='N')
    b2b_ia_vendascategorias = models.CharField(max_length=1, default='N')
    b2b_rotinaexportacao = models.CharField(max_length=1, default='T')
    cadastro_dt = models.DateTimeField(auto_now_add=True)
    alteracao_dt = models.DateTimeField(auto_now=True)
    exclusao_dt = models.DateTimeField(null=True)
    statusregistro_id = models.IntegerField(default=200)

    class Meta:
        db_table = 'ger_empresa_b2b'
        indexes = [
            models.Index(fields=['empresa_id']),
        ]


class ger_empresa_bmm(models.Model):
    id = models.AutoField(primary_key=True)
    empresa = models.ForeignKey(ger_empresas, on_delete=models.CASCADE)
    bm_site = models.CharField(max_length=100, default='https:\\boomerangue.me')
    bm_telentrada = models.CharField(max_length=1, choices=[('D', 'Usuário'), ('U', 'Login')], default='U')
    bm_enviaconfirmacaopartner = models.CharField(max_length=1, default='N')
    bm_usa_exportador = models.CharField(max_length=1, default='N')
    bm_bot_rotinaenvio = models.CharField(max_length=50, default='padrao')
    bm_bot_prefixo = models.CharField(max_length=45, default='bmbot_$$apelido')
    bm_bot_nromaxbots = models.IntegerField(default=3)
    bm_bot_nromaxenviosrodada = models.IntegerField(default=120)
    bm_bot_intervalorodada = models.IntegerField(default=30)
    bm_bot_enviarepic = models.CharField(max_length=1, choices=[('S', 'Sim'), ('N', 'Não')], default='N')
    bm_bot_calcrepicautomatico = models.CharField(max_length=1, choices=[('S', 'Sim'), ('N', 'Não')], default='N')
    bm_bot_intervalominimorepic = models.IntegerField(default=360)
    bm_bot_nrominimorepic = models.IntegerField(default=1)
    bm_bot_nromaximorepic = models.IntegerField(default=1)
    bm_bot_horainicialenvio = models.CharField(max_length=5, default='07:30')
    bm_bot_horafinalenvio = models.CharField(max_length=5, default='21:00')
    bm_bot_enviaferiado = models.CharField(max_length=1, choices=[('S', 'Sim'), ('N', 'Não')], default='N')
    bm_bot_enviasabado = models.CharField(max_length=1, choices=[('S', 'Sim'), ('N', 'Não')], default='S')
    bm_bot_enviadomingo = models.CharField(max_length=1, choices=[('S', 'Sim'), ('N', 'Não')], default='N')
    bm_bannerboomerangue = models.CharField(max_length=100)
    bm_horariosintegracao = models.CharField(max_length=100, default='04:00,10:00,16:00,20:00')
    cadastro_dt = models.DateTimeField(auto_now_add=True)
    alteracao_dt = models.DateTimeField(auto_now=True)
    exclusao_dt = models.DateTimeField(null=True)
    statusregistro_id = models.IntegerField(default=200)

    class Meta:
        db_table = 'ger_empresa_bmm'
        indexes = [
            models.Index(fields=['empresa_id']),
        ]


class ger_unidade(models.Model):
    # Django já cria um campo 'id' AutoField por padrão.
    # Se você quiser explicitá-lo (e garantir que é a PK):
    id = models.AutoField(primary_key=True)

    name = models.CharField(max_length=100, null=True, blank=True)
    connection_name = models.CharField(max_length=100, null=True, blank=True)
    empresa = models.ForeignKey(ger_empresas, on_delete=models.PROTECT)
    cadastro_dt = models.DateTimeField(auto_now_add=True)
    alteracao_dt = models.DateTimeField(auto_now=True)
    exclusao_dt = models.DateTimeField(null=True)
    statusregistro_id = models.IntegerField(default=200)
    flow_id = models.CharField(max_length=100, null=True, blank=True)
    bot_id = models.CharField(max_length=100, null=True, blank=True)
    message_modelo_id = models.CharField(max_length=100, null=True, blank=True)
    message_modelo_json = models.JSONField(null=True, blank=True)
    message_finalizado_id = models.CharField(max_length=100, null=True, blank=True)
    message_finalizado_json = models.JSONField(null=True, blank=True)
    cnpj = models.CharField(max_length=20, null=True, blank=True)
    boomerangue_url = models.CharField(max_length=100, null=True, blank=True)
    boomerangue_empresa_id = models.IntegerField(null=True, blank=True)
    boomerangue_apikey = models.CharField(max_length=100, null=True, blank=True)
    message_bemvindo_id = models.CharField(max_length=100, null=True, blank=True)
    message_bemvindo_json = models.JSONField(null=True, blank=True)
    message_reenvio_id = models.CharField(max_length=100, null=True, blank=True)
    message_reenvio_json = models.JSONField(null=True, blank=True)
    message_agenda_id = models.CharField(max_length=100, null=True, blank=True)
    message_agenda_json = models.JSONField(null=True, blank=True)
    message_agenda_flow_id = models.CharField(max_length=50, null=True, blank=True)
    message_agenda_flow_name = models.CharField(max_length=50, null=True, blank=True)
    message_agenda_flow_url = models.CharField(max_length=50, null=True, blank=True)
    message_notificacao_id = models.CharField(max_length=100, null=True, blank=True)
    message_notificacao_json = models.JSONField(null=True, blank=True)
    message_notificacao_flow_id = models.CharField(max_length=50, null=True, blank=True)
    message_notificacao_flow_name = models.CharField(max_length=50, null=True, blank=True)
    message_notificacao_flow_url = models.CharField(max_length=50, null=True, blank=True)

    class Meta:
        db_table = 'ger_unidade'