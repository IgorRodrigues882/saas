from django.db import models

from boomerangue.apps.ger_empresas.models import ger_empresas, select_tipo_campanha
from boomerangue.apps.ger_entidades.models import ger_entidade
from boomerangue.apps.ger_dadosgerais.models import ger_condicoespagamento, ger_pais, ger_transportadora, ger_vendedores
from boomerangue.apps.ger_produtos.models import ger_produtos
from boomerangue.apps.bot.models import Bot
from boomerangue.apps.gateway_pagamento.models import gateway_pagamento
from login.models import Usuario
from django.core.exceptions import ValidationError
from django.utils.deconstruct import deconstructible
from django.core.files.images import get_image_dimensions
import os
import xml.etree.ElementTree as ET

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


class bmm_template(models.Model):
    id = models.AutoField(primary_key=True)
    empresa = models.ForeignKey(ger_empresas, on_delete=models.PROTECT, null=True)
    # regra = models.ForeignKey(bmm_regra, on_delete=models.PROTECT)
    nome_template = models.CharField(max_length=100, null=True)
    chave_campanha = models.CharField(max_length=100, null=True)
    edi_campanha_template = models.CharField(max_length=50, null=True)
    template_master_id = models.CharField(max_length=45, null=True)
    texto_header = models.CharField(max_length=200, null=True)
    texto_footer = models.CharField(max_length=200, null=True)
    texto_promocional = models.CharField(max_length=100, default='Pedido Express')
    link_footer = models.CharField(max_length=400, null=True)
    image_footer = models.FileField(max_length=400, null=True, upload_to='media/image_footer/', validators=[ValidateSVG()])
    image_banner_pc = models.ImageField(max_length=400, null=True, upload_to='media/banner_pc/')
    image_banner_mobile = models.ImageField(max_length=400, null=True, upload_to='media/banner_mobile/')
    image_inicial_pc = models.ImageField(max_length=400, null=True)
    image_inicial_mobile = models.ImageField(max_length=400, null=True)
    imagem_cabecalho_pc = models.ImageField(max_length=400, null=True)
    imagem_cabecalho_mobile = models.ImageField(max_length=400, null=True)
    imagem_marketing_pc = models.ImageField(max_length=400, null=True)
    imagem_marketing_mobile = models.ImageField(max_length=400, null=True)
    link_marketing = models.CharField(max_length=400, null=True)
    cadastro_dt = models.DateTimeField(auto_now_add=True)
    alteracao_dt = models.DateTimeField(auto_now=True)
    exclusao_dt = models.DateTimeField(null=True)
    statusregistro_id = models.IntegerField(default=200)
    Ativo = models.CharField(max_length=1, null=True, default='S')
    TIPOS_TEMPLATE_REGRAS = [
        ('PD', 'Padrao')
    ]
    template_regra_id = models.CharField(max_length=10, null=True, default='PD', choices=TIPOS_TEMPLATE_REGRAS)
    ItensNoTemplate = models.CharField(max_length=1, null=True, default='N')
    LeadNoTemplate = models.CharField(max_length=1, null=True, default='N')
    UsaSugestaoIA = models.CharField(max_length=1, null=True, default='N')
    TIPOS_CAMPANHAS = [
        ('VDP', 'Vendas de Produtos'),
        ('VDS', 'Vendas de Serviço'),
        ('MKT', 'Campanha de Marketing')
    ]
    campanha_motivo = models.CharField(max_length=3, null=True, default='VDP', choices=TIPOS_CAMPANHAS)

    class Meta:
        db_table = 'bmm_template'


class ger_opcoes_padrao(models.Model):
    id = models.AutoField(primary_key=True)
    empresa = models.ForeignKey(ger_empresas, on_delete=models.PROTECT, null=True)
    imagem_footer_padrao = models.FileField(max_length=400, null=True, upload_to='media/image_footer/', validators=[ValidateSVG()])
    link_footer_padrao = models.CharField(max_length=400, null=True)
    cadastro_dt = models.DateTimeField(auto_now_add=True, null=True)
    alteracao_dt = models.DateTimeField(auto_now=True, null=True)
    exclusao_dt = models.DateTimeField(null=True)
    statusregistro_id = models.IntegerField(default=200)

    class Meta:
        db_table = 'ger_opcoes_padrao'


class bmm_templateimportado(models.Model):
    id = models.AutoField(primary_key=True)
    tipo_arquivo = models.CharField(max_length=20, default='A Validar')
    template = models.ForeignKey(bmm_template, on_delete=models.PROTECT)
    NomeArquivo = models.CharField(max_length=200)
    Caminho = models.FileField(upload_to='media/arq_templates/', null=True)
    DataHora = models.DateTimeField(auto_now=True)
    retorno_arquivo = models.TextField(max_length=100, null=True)
    dtProcessamento = models.DateTimeField(null=True)
    statusarquivo_id = models.CharField(max_length=1)
    cadastro_dt = models.DateTimeField(auto_now_add=True, null=True)
    alteracao_dt = models.DateTimeField(auto_now=True, null=True)
    exclusao_dt = models.DateTimeField(null=True)
    statusregistro_id = models.IntegerField(default=200)

    class Meta:
        db_table = 'bmm_templateimportado'
        indexes = [
            models.Index(fields=['DataHora'], name='idDataHora'),
            models.Index(fields=['template', 'NomeArquivo'], name='IDBUSCA'),
        ]
        


class bmm_campanha(models.Model):
    id = models.BigAutoField(primary_key=True)
    Campanha = models.CharField(max_length=45, null=True)
    empresa = models.ForeignKey(ger_empresas, on_delete=models.PROTECT, null=True)
    # canalempresa_id = models.ForeignKey(bot_canalempresa, on_delete=models.SET_NULL, null=True)
    template = models.ForeignKey(bmm_template, on_delete=models.SET_NULL, null=True)
    CampanhaTag = models.CharField(max_length=45, null=True)
    EdiCampanha = models.CharField(max_length=50, null=True)
    NroLeads = models.IntegerField(default=0)
    TextoHeader = models.CharField(max_length=200, null=True)
    TextoFooter = models.CharField(max_length=200, null=True)
    TextoPromocional = models.CharField(max_length=100, default='Pedido Express')
    LinkFooter = models.CharField(max_length=400, null=True)
    ImageBannerPC = models.ImageField(max_length=400, null=True, upload_to='media/')
    ImageBannerMobile = models.ImageField(max_length=400, null=True, upload_to='media/')
    ImageInicialPC = models.ImageField(max_length=400, null=True)
    ImageInicialMobile = models.ImageField(max_length=400, null=True)
    ImagemCabecalhoPC = models.ImageField(max_length=400, null=True)
    ImagemCabecalhoMobile = models.ImageField(max_length=400, null=True)
    ImagemMarketingPC = models.ImageField(max_length=400, null=True)
    ImagemMarketingMobile = models.ImageField(max_length=400, null=True)
    LinkMarketing = models.CharField(max_length=400, null=True)
    CampanhaAtiva = models.CharField(max_length=1, default='N')

    bot_id = models.ForeignKey(Bot, on_delete=models.SET_NULL, null=True)
    Repique1 = models.CharField(max_length=1, default='N')
    Repique1minutos = models.IntegerField(default=240, null=True)
    Repique2 = models.CharField(max_length=1, default='N')
    Repique2minutos = models.IntegerField(default=240, null=True)
    CarrinhoAbandonado = models.CharField(max_length=1, default='N')
    CompraRecebida = models.CharField(max_length=1, default='N')
    ultimo_cnpj_processado = models.CharField(max_length=255, null=True, blank=True)

    # Definindo as opções de tipos de empresa.
    TIPOS_PERIODICIDADE = [
        ('MA', 'Manual'),
        ('D', 'Diário'),
        ('S', 'Semanal'),
        ('Q', 'Quinzenal'),
        ('ME', 'Mensal')
    ]
    TIPOS_CAMPANHA = [
        ('DUN', 'Distribuidora Unitário'),
        ('DCX', 'Distribuidora Caixa'),
        ('DCO', 'Distribuidora Combo')
    ]
    tipo_campanha = models.ForeignKey(select_tipo_campanha, on_delete=models.SET_NULL, null=True)
    periodicidade = models.CharField(max_length=2, choices=TIPOS_PERIODICIDADE,null=True)
    status_campanha = models.CharField(max_length=2, choices=[
        ('AG', 'Aguardando'),
        ("EA", "Em Andamento"),
        ("EC", "Encerrado"),
        ("PA", "Pausada")
    ], default="AG")
    data_inicio = models.DateField(null=True)
    horario_inicio = models.TimeField(null=True)
    data_fim = models.DateField(null=True)
    horario_fim = models.TimeField(null=True)
    EmFaseHomologacaoAteDt = models.DateTimeField(null=True)
    status_validacao = models.CharField(max_length=1, default='N')
    gateway_pagamento = models.ForeignKey(gateway_pagamento, on_delete=models.SET_NULL, null=True)
    cadastro_dt = models.DateTimeField(auto_now_add=True, null=True)
    custo_total = models.DecimalField(max_digits=18, decimal_places=6, default=0)
    mensagens_enviadas = models.IntegerField(default=0)
    mensagens_reenviadas = models.IntegerField(default=0)
    desvio_padrao = models.DecimalField(max_digits=18, decimal_places=6, default=0)
    statusregistro_id = models.IntegerField(default=200)
    NroLeadsValidos = models.IntegerField(null=True, default=0)

    class Meta:
        db_table = 'bmm_campanha'


class bmm_campanhaidentificadores(models.Model):
    id = models.AutoField(primary_key=True)
    campanha = models.ForeignKey(bmm_campanha, on_delete=models.PROTECT)
    identificador = models.CharField(max_length=50, null=True)
    identificador_ativo = models.CharField(max_length=1, default='S')
    template = models.ForeignKey(bmm_template, null=True, on_delete=models.SET_NULL)

    class Meta:
        db_table = 'bmm_campanhaidentificadores'


class bmm_boomerangueimportado(models.Model):
    id = models.AutoField(primary_key=True)
    campanha = models.ForeignKey(bmm_campanha, on_delete=models.PROTECT)
    NomeArquivo = models.CharField(max_length=200)
    Caminho = models.FileField(upload_to='media/arq_campanhas/', null=True)
    DataHora = models.DateTimeField(auto_now=True)
    tipo_arquivo = models.CharField(max_length=20, default='A Validar')
    retorno_arquivo = models.TextField(null=True)
    dtProcessamento = models.DateTimeField(null=True)
    statusarquivo_id = models.CharField(max_length=1)
    envio_msg = models.CharField(max_length=1, default='N')
    cadastro_dt = models.DateTimeField(auto_now_add=True, null=True)
    alteracao_dt = models.DateTimeField(auto_now=True)
    exclusao_dt = models.DateTimeField(null=True)
    statusregistro_id = models.IntegerField(default=200)

    class Meta:
        db_table = 'bmm_boomerangueimportado'
        indexes = [
            models.Index(fields=['DataHora'], name='idxDataHora'),
            models.Index(fields=['campanha', 'NomeArquivo'], name='IXBUSCA'),
        ]


class bmm_boomerangue(models.Model):

    id = models.AutoField(primary_key=True)
    empresa = models.ForeignKey(ger_empresas, on_delete=models.PROTECT, null=True)
    entidade = models.ForeignKey(ger_entidade, on_delete=models.PROTECT)
    template = models.ForeignKey(bmm_template, on_delete=models.PROTECT, null=True)
    campanha = models.ForeignKey(bmm_campanha, on_delete=models.PROTECT, null=True)
    boomerangueimportado = models.ForeignKey(bmm_boomerangueimportado, on_delete=models.PROTECT, null=True)
    # importacao = models.ForeignKey(Importacao, null=True, on_delete=models.SET_NULL)
    # status_boomerangue = models.ForeignKey(StatusBoomerangue, on_delete=models.PROTECT)
    campanha_nome = models.CharField(max_length=50, null=True)
    prefixo = models.CharField(max_length=50, null=True)
    edi_integracao = models.CharField(max_length=200, null=True)
    cod_puxada = models.CharField(max_length=20, null=True)
    chave_busca = models.CharField(max_length=150, null=True)
    bm_tipo = models.CharField(max_length=150, null=True)
    sai_relatorio = models.CharField(max_length=1, null=True)
    identificacao_relatorio = models.CharField(max_length=50, null=True)
    token_bm = models.CharField(max_length=50, null=True)
    short_url = models.CharField(max_length=200, null=True)
    telefone_bm = models.CharField(max_length=20, null=True)
    TelefoneOriginal = models.CharField(max_length=50,null=True)
    data_inicio_campanha = models.DateTimeField(null=True)
    data_final_campanha = models.DateTimeField(null=True)
    hora_inicio_envio = models.CharField(max_length=5, null=True)
    hora_final_envio = models.CharField(max_length=5, null=True)
    usar_desconto_geral = models.CharField(max_length=1, null=True)
    extra_info_4 = models.CharField(max_length=300, null=True)
    mensagem_personalizada = models.CharField(max_length=300, null=True)
    usar_status_envio_bm = models.CharField(max_length=1, null=True)
    nro_envios_reforcos = models.CharField(max_length=1, null=True)
    data_criacao_bm = models.DateTimeField(auto_now_add=True)
    data_programada_bm = models.DateTimeField(null=True)
    data_limite_envio_bm = models.DateTimeField(null=True)
    data_pri_envio = models.DateTimeField(null=True)
    data_ult_envio = models.DateTimeField(null=True)
    data_entrega = models.DateTimeField(null=True)
    data_optin = models.DateTimeField(null=True)
    data_leitura = models.DateTimeField(null=True)
    data_resposta_wz = models.DateTimeField(null=True)
    data_pri_click_link = models.DateTimeField(null=True)
    data_ult_click_link = models.DateTimeField(null=True)
    data_pri_open_web = models.DateTimeField(null=True)
    data_ult_open_web = models.DateTimeField(null=True)
    data_aceite_bm = models.DateTimeField(null=True)
    data_encerramento_bm = models.DateTimeField(null=True)
    data_proximo_repic = models.DateTimeField(null=True)
    data_proximo_repic_enviado = models.DateTimeField(null=True)
    data_prevista_repic1 = models.DateTimeField(null=True)
    data_prevista_repic2 = models.DateTimeField(null=True)
    data_prevista_repic3 = models.DateTimeField(null=True)
    data_repic_forcado = models.DateTimeField(null=True)
    data_repic_forcado_envio = models.DateTimeField(null=True)
    bm_data_limite_repic = models.DateTimeField(null=True)
    envia_boomerangue = models.CharField(max_length=1, null=True)
    bm_enviado = models.IntegerField(null=True)
    bm_foi_entregue = models.IntegerField(null=True)
    bm_optin_enviado = models.CharField(max_length=1, default='N')
    bm_optin_aceito = models.CharField(max_length=1, default='S')
    bm_foi_lido = models.IntegerField(null=True)
    bm_resposta_wz = models.IntegerField(null=True)
    bm_click_link = models.IntegerField(null=True)
    bm_open_web = models.IntegerField(null=True)
    bm_aceito = models.CharField(max_length=1, default='N')
    bm_encerrado = models.CharField(max_length=1, default='N')
    bm_ativo = models.CharField(max_length=1, default='S')
    bm_modo_teste = models.CharField(max_length=1, default='N')
    bm_com_erro = models.CharField(max_length=1, default='N')
    bm_mensagem_status = models.CharField(max_length=200, null=True)
    bm_enviado_reforco1 = models.CharField(max_length=1, null=True)
    bm_enviado_reforco2 = models.CharField(max_length=1, null=True)
    bm_enviado_reforco3 = models.CharField(max_length=1, null=True)
    data_instalacao_pwa = models.DateTimeField(null=True)
    data_instalacao_ult_pwa = models.DateTimeField(null=True)
    nro_instalacoes_pwa = models.IntegerField(null=True)
    titulo_boomerangue = models.CharField(max_length=255)
    lista_oferta = models.CharField(max_length=50, null=True)
    condicoes_pagamento = models.ForeignKey(ger_condicoespagamento, on_delete=models.PROTECT, null=True)
    condicoes_pagamento_escolhe = models.CharField(max_length=1, null=True)
    vendedor = models.ForeignKey(ger_vendedores, null=True, on_delete=models.SET_NULL)
    transportadora = models.ForeignKey(ger_transportadora, null=True, on_delete=models.SET_NULL)
    tipo_frete = models.CharField(max_length=1, default='F')
    transportadora_escolhe = models.CharField(max_length=1, default='N')
    dia_entrega_escolhe = models.CharField(max_length=1, default='N')
    nro_itens = models.IntegerField(default=0)
    pedido = models.IntegerField(null=True)
    compra_minima_vlr = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    compra_minima_qtd = models.DecimalField(max_digits=18, decimal_places=4, default=0)
    desconto_promocional = models.DecimalField(max_digits=18, decimal_places=4, default=0)
    valor_original = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    valor_atual = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    dt_primeira_compra = models.DateTimeField(null=True)
    dt_ultima_compra = models.DateTimeField(null=True)
    aciona_api_partner = models.CharField(max_length=1, null=True)
    chave_bot = models.CharField(max_length=15, null=True)
    nome_bot = models.CharField(max_length=50, null=True)
    data_bot = models.DateTimeField(null=True)
    status_bot = models.CharField(max_length=2, null=True)
    nome_bot_repique = models.CharField(max_length=50, null=True)
    data_bot_repique = models.DateTimeField(null=True)
    status_bot_repique = models.CharField(max_length=2, null=True)
    cadastro_dt = models.DateTimeField(auto_now_add=True, null=True)
    alteracao_dt = models.DateTimeField(auto_now=True)
    exclusao_dt = models.DateTimeField(null=True)
    statusregistro_id = models.IntegerField(default=200)
    bmstatus = models.CharField(max_length=1, null=True)
    status_integracao = models.CharField(max_length=1, default=0)
    dt_integracao = models.DateTimeField(null=True)
    bm_status = models.CharField(max_length=1, default = 'W')
    TotalProdutos = models.DecimalField(max_digits=18, decimal_places=4, default=0)
    TotalDesconto = models.DecimalField(max_digits=18, decimal_places=4, default=0)
    TotalAcrescimo = models.DecimalField(max_digits=18, decimal_places=4, default=0)
    TotalCupom = models.DecimalField(max_digits=18, decimal_places=4, default=0)
    TotalFidelidade = models.DecimalField(max_digits=18, decimal_places=4, default=0)
    TotalServicos = models.DecimalField(max_digits=18, decimal_places=4, default=0) 
    TotalFrete = models.DecimalField(max_digits=18, decimal_places=4, default=0)
    ComissaoPD = models.DecimalField(max_digits=18, decimal_places=4, default=0)
    ComissaoProdutos = models.DecimalField(max_digits=18, decimal_places=4, default=0)
    ComissaoValor = models.DecimalField(max_digits=18, decimal_places=4, default=0)
    TotalBoomerangue = models.DecimalField(max_digits=18, decimal_places=4, default=0)
    TotalQuantidade = models.DecimalField(max_digits=18, decimal_places=4, default=0)
    nome_medico = models.CharField(max_length=50, null=True)
    data_consulta = models.CharField(max_length=50, null=True)
    hora_consulta = models.CharField(max_length=50, null=True)
    data_limite_consulta = models.CharField(max_length=50, null=True)
    hora_limite_consulta = models.CharField(max_length=50, null=True)

    class Meta:
        db_table = 'bmm_boomerangue'


class bmm_boomerangueitens(models.Model):
    """
    Tabela de Boomerangue Itens.
    
    Tabela responsável por armazenar o vínculo entre os produtos e os boomerangues.
    """
    id = models.AutoField(primary_key=True)
    boomerangue = models.ForeignKey(bmm_boomerangue, on_delete=models.PROTECT)
    produto = models.ForeignKey(ger_produtos, on_delete=models.PROTECT)
    campanha = models.ForeignKey(bmm_campanha, on_delete=models.PROTECT)
    QuantidadeCompradaUN  = models.DecimalField(max_digits=18, decimal_places=4, default=0)
    QuantidadeCompradaCX = models.DecimalField(max_digits=18, decimal_places=4, default=0)    
    ValorMultimplicadorCompra  = models.DecimalField(max_digits=18, decimal_places=4, default=0)    
    ValorTotalCompra  = models.DecimalField(max_digits=18, decimal_places=4, default=0)    
    pedidoitem_id = models.IntegerField(null=True)
    edi_integracao_item = models.CharField(max_length=50, null=True)
    produto_original_id = models.CharField(max_length=50, null=True)
    quantidade_sugerida = models.DecimalField(max_digits=18, decimal_places=4, default=0)
    quantidade_minima = models.DecimalField(max_digits=18, decimal_places=4, default=0)
    quantidade_maxima = models.DecimalField(max_digits=18, decimal_places=4, default=9999999)
    quantidade_disponivel = models.DecimalField(max_digits=18, decimal_places=4, default=0)
    multiplo_boomerangue = models.DecimalField(max_digits=18, decimal_places=4, default=1)
    multiplo_pague = models.DecimalField(max_digits=18, decimal_places=4, default=1)
    MultiploCaixa = models.DecimalField(max_digits=18, decimal_places=6, default=1)   
    valor_item_original = models.DecimalField(max_digits=18, decimal_places=6, default=0)
    valor_atacado = models.DecimalField(max_digits=18, decimal_places=6, default=0)
    valor_unitario = models.DecimalField(max_digits=18, decimal_places=6, default=0)
    valor_unitario_calculado = models.DecimalField(max_digits=18, decimal_places=6, default=0)
    valor_total_item = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    valor_sem_desconto = models.DecimalField(max_digits=18, decimal_places=4, default=0)
    percentual_desconto = models.DecimalField(max_digits=10, decimal_places=4, default=0)
    item_ativo = models.CharField(max_length=1, default="S")
    ordem = models.CharField(max_length=4, default='0000')
    obrigatorio_compra = models.CharField(max_length=1, default="N")
    unidade_caixa = models.CharField(max_length=10, null=True)
    unidade_venda = models.CharField(max_length=10, null=True)
    tipo_item_boomerangue_id = models.CharField(max_length=2, default='UN')
    produto_bloqueado = models.CharField(max_length=1, default="N")
    complemento1 = models.CharField(max_length=100, null=True)
    cadastro_dt = models.DateTimeField(auto_now_add=True, null=True)
    alteracao_dt = models.DateTimeField(auto_now=True)
    exclusao_dt = models.DateTimeField(null=True)
    statusregistro_id = models.IntegerField(default=200)
    dtPrimeiroAcesso = models.DateTimeField(null=True)
    dtUltimoAcesso = models.DateTimeField(null=True)
    MaiorQuantidade = models.IntegerField(default=0)
    ValorUnitarioOriginal = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    pdComissaoItem = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    pdComissaoItemVlr = models.DecimalField(max_digits=18, decimal_places=4, default=0)
    statusintegracaoitem = models.CharField(max_length=1, default=0)
    dataintegracaoitem = models.DateTimeField(null=True)


    class Meta:
        db_table = 'bmm_boomerangueitens'
        indexes = [
            models.Index(fields=['boomerangue', 'produto_original_id', 'tipo_item_boomerangue_id', 'unidade_venda'], name='idListaOferta'),
            models.Index(fields=['boomerangue']),
            models.Index(fields=['boomerangue', 'produto_original_id']),
            models.Index(fields=['produto_original_id', 'edi_integracao_item'], name='ixEDIBUSCA'),
            models.Index(fields=['produto_bloqueado'], name='ixProdutoBloqueado'),
            models.Index(fields=['produto_original_id'], name='ixProdutoOriginal'),
        ]
        unique_together = ['boomerangue', 'produto_original_id', 'tipo_item_boomerangue_id', 'unidade_venda']


class bmm_template_itens(models.Model):
    id = models.AutoField(primary_key=True)
    boomerangue = models.ForeignKey(bmm_boomerangue, on_delete=models.PROTECT)
    template = models.ForeignKey(bmm_template, on_delete=models.PROTECT, null=True)
    produto = models.ForeignKey(ger_produtos, on_delete=models.PROTECT, null=True)
    empresa = models.ForeignKey(ger_empresas, on_delete=models.PROTECT, null = True)    
    edi_integracao_item = models.CharField(max_length=50, null=True)
    produto_original_id = models.CharField(max_length=50, null=True)
    quantidade_sugerida = models.DecimalField(max_digits=18, decimal_places=4, default=0)
    quantidade_minima = models.DecimalField(max_digits=18, decimal_places=4, default=0)
    quantidade_maxima = models.DecimalField(max_digits=18, decimal_places=4, default=999999)
    quantidade_disponivel = models.DecimalField(max_digits=18, decimal_places=4, default=0)
    multiplo_boomerangue = models.DecimalField(max_digits=18, decimal_places=4, default=1)
    multiplo_pague = models.DecimalField(max_digits=18, decimal_places=4, default=1)
    valor_item_original = models.DecimalField(max_digits=18, decimal_places=6, default=0)
    valor_atacado = models.DecimalField(max_digits=18, decimal_places=6, default=0)
    valor_unitario = models.DecimalField(max_digits=18, decimal_places=6, default=0)
    valor_unitario_calculado = models.DecimalField(max_digits=18, decimal_places=6, default=0)
    valor_total_item = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    valor_sem_desconto = models.DecimalField(max_digits=18, decimal_places=4, default=0)
    percentual_desconto = models.DecimalField(max_digits=10, decimal_places=4, default=0)
    item_ativo = models.CharField(max_length=1, default="S")
    ordem = models.CharField(max_length=4, default=0.0)
    obrigatorio_compra = models.CharField(max_length=1, default="N")
    unidade_caixa = models.CharField(max_length=10, null=True)
    unidade_venda = models.CharField(max_length=10, null=True)
    tipo_item_boomerangue_id = models.CharField(max_length=2, default=0)
    produto_bloqueado = models.CharField(max_length=1, default="N")
    complemento1 = models.CharField(max_length=100, null=True)
    templateimportado = models.ForeignKey(bmm_templateimportado, null=True, on_delete=models.PROTECT) 

    class Meta:
        db_table = 'bmm_templateitens'
        
        indexes = [
            models.Index(fields=['edi_integracao_item', 'empresa'], name='bmm_upsert'),
            # Other indexes...
        ]


class bmm_boomerangueevento(models.Model):
    id = models.BigAutoField(primary_key=True)
    boomerangue = models.ForeignKey(bmm_boomerangue, on_delete=models.PROTECT)
    campanha = models.ForeignKey(bmm_campanha, on_delete=models.PROTECT, null=True)
    tipoevento_id = models.CharField(max_length=20)
    origemevento_id = models.CharField(max_length=1)
    DataGeracao = models.DateTimeField(auto_now=True)
    ProtocoloGeracao = models.CharField(max_length=50)
    DataProgramada = models.DateTimeField()
    statusevento_id = models.CharField(max_length=1)
    ChaveBot = models.CharField(max_length=15)
    NomeBot = models.CharField(max_length=50)
    DataBot = models.DateTimeField()

    class Meta:
        db_table = 'bmm_boomerangueevento'
        indexes = [
            models.Index(fields=['boomerangue', 'tipoevento_id', 'ProtocoloGeracao'], name='iStatus'),
            models.Index(fields=['DataGeracao'], name='iDataGeracao'),
            models.Index(fields=['ProtocoloGeracao'], name='iProtocoloGeracao'),
            models.Index(fields=['NomeBot'], name='ixComp1'),
            models.Index(fields=['tipoevento_id', 'statusevento_id', 'NomeBot'], name='itipoevento_id'),
            models.Index(fields=['statusevento_id'], name='Istatusevento'),
        ]


class bmm_boomeranguelog(models.Model):
    id = models.BigAutoField(primary_key=True)
    tipolog_id = models.CharField(max_length=1)
    origemlog_id = models.CharField(max_length=1, null=True)
    campanha = models.ForeignKey(bmm_campanha, on_delete=models.PROTECT, null=True)
    template = models.ForeignKey(bmm_template, on_delete=models.PROTECT, null=True)
    boomerangue = models.ForeignKey(bmm_boomerangue, on_delete=models.PROTECT, null=True)
    boomerangueitem = models.ForeignKey(bmm_boomerangueitens, on_delete=models.PROTECT, null=True)
    boomerangueimportacao_id = models.IntegerField(null=True)
    entidade_id = models.ForeignKey(ger_entidade, on_delete=models.PROTECT, null=True)
    acao_id = models.CharField(max_length=25, null=True)
    usuario = models.ForeignKey(Usuario, on_delete=models.PROTECT, null=True)
    acaoenviada_id = models.CharField(max_length=25, null=True)
    Token = models.CharField(max_length=100, null=True)
    Template = models.CharField(max_length=25, null=True)
    DataLog = models.DateTimeField(auto_now_add=True)
    Telefone = models.CharField(max_length=25,null=True)
    Complemento1 = models.CharField(max_length=100, null=True)
    Complemento2 = models.CharField(max_length=400, null=True)
    Complemento3 = models.CharField(max_length=100, null=True)
    TempoLog = models.IntegerField(null=True)
    VerApiLog = models.CharField(max_length=3, null= True)
    valor= models.DecimalField(max_digits=18, decimal_places=2, default=0, null=True)

    class Meta:
        db_table = 'bmm_boomeranguelog'
        indexes = [
            models.Index(fields=['boomerangue'], name='iLista'),
            models.Index(fields=['boomerangueitem'], name='ilistitem'),
            models.Index(fields=['DataLog'], name='datalog'),
            models.Index(fields=['entidade_id'], name='ientidade_id'),
            models.Index(fields=['Complemento1', 'boomerangue'], name='Comp1'),
            models.Index(fields=['acao_id'], name='iAcao'),
            models.Index(fields=['acaoenviada_id'], name='IACAOLOG'),
        ]


class bmm_regra(models.Model):
    id = models.AutoField(primary_key=True)
    empresa = models.ForeignKey(ger_empresas, on_delete=models.PROTECT)
    # canal = models.ForeignKey('Canal', on_delete=models.PROTECT)
    regraenvio = models.CharField(max_length=20)
    regraintegracao = models.CharField(max_length=20)
    regrausuario = models.CharField(max_length=20)
    naolistaquantidade = models.CharField(max_length=1)
    salvarlog = models.CharField(max_length=1)
    UtilizaOptin = models.CharField(max_length=1)
    nromaximoleads = models.IntegerField(default=0)
    templateconfirmacao = models.ForeignKey(bmm_template, on_delete=models.PROTECT)
    solicitarconfirmacao = models.CharField(max_length=1)
    enviarlink = models.CharField(max_length=1)
    prefixoboomerangue = models.CharField(max_length=30)
    dominioboomerangue = models.CharField(max_length=100)
    Dominiohttps = models.CharField(max_length=1)
    cadastro_dt = models.DateTimeField(auto_now_add=True)
    alteracao_dt = models.DateTimeField(auto_now=True)
    exclusao_dt = models.DateTimeField(null=True)
    # statusregistro = models.ForeignKey('StatusRegistro', on_delete=models.PROTECT)

    class Meta:
        db_table = 'bmm_regra'
        indexes = [
            models.Index(fields=['empresa'], name='ixEmpresa'),
        ]


class bmm_regra_eventos(models.Model):
    id = models.AutoField(primary_key=True)
    regra = models.ForeignKey(bmm_regra, on_delete=models.PROTECT)
    evento = models.CharField(max_length=100)
    eventopadrao = models.CharField(max_length=20)
    acionaapiterceiros = models.CharField(max_length=1, default='N')
    urlapi = models.CharField(max_length=100, null=True)
    urlapiauth = models.CharField(max_length=100, null=True)
    urlpayload = models.TextField(null=True)
    acionarotinainterna = models.CharField(max_length=1, default='N')
    Rotinainterna = models.CharField(max_length=20)
    cadastro_dt = models.DateTimeField(auto_now_add=True)
    alteracao_dt = models.DateTimeField(auto_now=True)
    exclusao_dt = models.DateTimeField(null=True)
    # statusregistro = models.ForeignKey('StatusRegistro', on_delete=models.PROTECT)

    class Meta:
        db_table = 'bmm_regra_eventos'
        indexes = [
            models.Index(fields=['regra'], name='fk_bmm_regra_ev'),
        ]




class agendamento(models.Model):
    id = models.AutoField(primary_key=True)
    confirma_whatsapp = models.DateTimeField(null=True)
    data_consulta = models.DateTimeField()
    medico = models.IntegerField(null=True)
    paciente = models.IntegerField()
    cadastro_dt = models.DateTimeField(auto_now_add=True)
    alteracao_dt = models.DateTimeField(auto_now=True)
    exclusao_dt = models.DateTimeField(null=True)
    statusregistro_id = models.IntegerField(default=200)

    class Meta:
        db_table = 'agendamento'