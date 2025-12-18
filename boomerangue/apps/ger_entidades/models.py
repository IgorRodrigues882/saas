from django.db import models
from boomerangue.apps.ger_empresas.models import ger_empresas
from boomerangue.apps.ger_dadosgerais.models import ger_pais, ger_uf, ger_cidade, ger_condicoespagamento, ger_transportadora, ger_tabelaprecos, ger_vendedores
from boomerangue.apps.ger_produtos.models import ger_produtos
# Create your models here.
class ger_categoriaentidade(models.Model):
    id = models.BigAutoField(primary_key=True)
    empresa = models.ForeignKey(ger_empresas, on_delete=models.PROTECT)
    CategoriaEntidade = models.CharField(max_length=50)
    CategoriaPadrao = models.CharField(max_length=1,default='N')
    EDI_Integracao = models.CharField(max_length=50, null=True)
    Sincronizado = models.CharField(max_length=1, default='N')
    dtSincronizacao = models.DateTimeField(null=True)
    Sincronizador_ver = models.CharField(max_length=12, null=True)
    Sincronizador_id = models.IntegerField(null=True)
    cadastro_dt = models.DateTimeField(auto_now_add=True, null=True)
    alteracao_dt = models.DateTimeField(auto_now=True, null=True)
    exclusao_dt = models.DateTimeField(null=True)
    statusregistro_id = models.IntegerField(default=200)


    class Meta:
        db_table = 'ger_categoriaentidade'
        indexes = [
            models.Index(fields=['empresa'], name='idEmpresa'),
        ]




class ger_entidade(models.Model):
    id = models.BigAutoField(primary_key=True)
    empresa = models.ForeignKey(ger_empresas, on_delete=models.PROTECT, null=True)
    TipoEmpresa = models.CharField(max_length=1, choices=[('F', 'Pessoa Física'), ('J', 'Pessoa Jurídica')], default='F')
    TipoEntidade = models.IntegerField(default='1')  # Referência à tabela ger_dadosgerais com grupo igual a 'ENT_TIPOENTIDADE'
    # EntidadeMatriz = models.ForeignKey(ger_entidade, on_delete=models.SET_NULL, null=True, related_name='entidade_filial')
    # RedeEntidade = models.ForeignKey(ger_entidade, on_delete=models.SET_NULL, null=True, related_name='entidade_rede')
    InscricaoEstadual = models.CharField(max_length=10, null=True)
    CNPJ = models.CharField(max_length=20, null=True)
    CNPJNumerico = models.CharField(max_length=20, null=True, help_text='Campo que armazena o CNPJ em formato numérico, sempre deve ser usado nas comparações de cnpj com somente números')
    cnpj_valido = models.IntegerField(default=0, null=True)
    Entidade = models.CharField(max_length=100, null=True)
    Fantasia = models.CharField(max_length=100, null=True)
    Endereco = models.CharField(max_length=500, null=True)
    Numero = models.CharField(max_length=20, null=True)
    Complemento = models.CharField(max_length=200, null=True)
    Bairro = models.CharField(max_length=200, null=True)
    CliLatitude = models.CharField(max_length=25, null=True)
    CliLongitude = models.CharField(max_length=25, null=True)
    pais = models.ForeignKey(ger_pais, on_delete=models.SET_NULL, null=True, help_text='Campo foreign key para a tabela pais, aramazena o id do pais vinculado')
    uf = models.ForeignKey(ger_uf, on_delete=models.SET_NULL, null=True, help_text='Campo foreign key para a tabela UF, aramazena o id da UF vinculada')
    cidade = models.ForeignKey(ger_cidade, on_delete=models.SET_NULL, null=True, help_text='Campo foreign key para a tabela cidade, aramazena o id da cidade vinculada')
    Telefone1 = models.CharField(max_length=25, null=True)
    Telefone2 = models.CharField(max_length=25, null=True)
    WhatsAPPComercial = models.CharField(max_length=50, null=True)
    Email_Comercial = models.EmailField(max_length=100, null=True)
    Email_Compras = models.EmailField(max_length=100, null=True)
    EMAIL_NFE = models.EmailField(max_length=100, null=True)
    EMAIL_Marketing = models.EmailField(max_length=100, null=True)
    Entidade_Ativa = models.CharField(max_length=1, default='S')
    Cliente = models.CharField(max_length=1, default='S')
    CEP = models.CharField(max_length=15, null=True)
    # AtividadePrincipal = models.ForeignKey('AtividadePrincipal', on_delete=models.SET_NULL, null=True)
    ReceitaTelefone = models.CharField(max_length=50, null=True)
    ReceitaEmail = models.EmailField(max_length=100, null=True)
    ReceitaDataSituacao = models.DateField(null=True)
    ReceitaAtivo = models.CharField(max_length=1, default='V')
    DtAberturaEmpresa = models.DateField(null=True)
    Capital_Social = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    NomeContato = models.CharField(max_length=255, null=True)
    SobrenomeContato = models.CharField(max_length=255, null=True)
    ultima_campanha_enviada = models.IntegerField(null=True)
    # StatusEntidade = models.ForeignKey('StatusEntidade', on_delete=models.SET_NULL, null=True)
    # StatusIntegracao = models.ForeignKey('StatusIntegracao', on_delete=models.SET_NULL, null=True)
    # OrigemEntidade = models.ForeignKey('OrigemEntidade', on_delete=models.SET_NULL, null=True)
    EDI_Integracao = models.CharField(max_length=50, null=True)
    TokenCliente = models.CharField(max_length=100, null=True)
    Sincronizado = models.CharField(max_length=1, default='N')
    dtSincronizacao = models.DateTimeField(null=True)
    Sincronizador_ver = models.CharField(max_length=12, null=True)
    Sincronizador_id = models.IntegerField(null=True)
    cadastro_dt = models.DateTimeField(auto_now_add=True, null=True)
    alteracao_dt = models.DateTimeField(auto_now=True, null=True)
    exclusao_dt = models.DateTimeField(null=True)
    statusregistro_id = models.IntegerField(default=200)
    TelefoneValidacaoWP = models.CharField(max_length=45, default='-')
    DataValidacaoWP = models.DateTimeField(null =True)
    DataConfirmacaoWP = models.DateTimeField(null=True)
    vendedorValidacao = models.ForeignKey(ger_vendedores,on_delete=models.PROTECT, null=True )
    RespostaValidacaoWP = models.CharField(max_length=1, default='-')
    OPTIONS = [
        ('X', 'Não fez opt-in'),
        ('N', 'Não Aceitou'),
        ('P', 'Pediu pra excluir dados'),
        ('E', 'Pediu pra enviar seus dados'),
        ('S', 'Aceitou opt-in')
    ]
    StatusOptIN = models.CharField(max_length=1, choices=OPTIONS, default='X', null=True)
    DtAceiteOptin = models.DateTimeField(null=True)
    optinMensagemID = models.IntegerField(null=True)

    estagio_flow = models.IntegerField(default=0, null=True)
    # 0 -> conversa normal
    # 1 -> aceitou fazer o pix e precisa enviar cnpj/cpf
    # 2 ->
    telefone_original = models.CharField(max_length=25, null=True)
    telefone_validado = models.CharField(max_length=25, null=True)
    lista = [
        ('validado', 'Validado'),
        ('nao_validado', 'Não Validado'),
        ('rejeitado', 'Rejeitado'),
    ]
    status_validacao = models.CharField(max_length=25, default='nao_validado', choices=lista, null=True)
    data_validacao = models.DateTimeField(null=True)
    lead_key_spl = models.CharField(max_length=80, null=True)
    keysearchmessage  = models.CharField(max_length=100, null=True)
    keysearchmessagedate = models.DateTimeField(null=True)
    areceber = models.DecimalField(max_digits=18, decimal_places=2, default=0, null=True)
    Limite_de_credito = models.DecimalField(max_digits=18, decimal_places=2, default=0, null=True, help_text="Limite de credito da entidade")
    saldo = models.DecimalField(max_digits=18, decimal_places=2, default=0, null=True, help_text="Saldo da entidade")
    class Meta:
        db_table = 'ger_entidade'
        unique_together = [['empresa', 'EDI_Integracao'], ['TokenCliente']]
        indexes = [
            models.Index(fields=['CliLatitude', 'CliLongitude']),
            models.Index(fields=['uf']),
            models.Index(fields=['cidade']),
        ]


class ger_entidadeendereco(models.Model):
    id = models.BigAutoField(primary_key=True)
    empresa = models.ForeignKey(ger_empresas, on_delete=models.PROTECT)
    entidade = models.ForeignKey(ger_entidade, on_delete=models.CASCADE)
    EDI_Integracao = models.CharField(max_length=50, null=True)
    TipoEndereco_id = models.CharField(max_length=3, choices=[('E', 'Fiscal'), ('C', 'Cobrança'), ('ENT', 'Entrega')])
    EnderecoExibicao = models.CharField(max_length=100, null=True)
    TipoEmpresa = models.CharField(max_length=1, choices=[('F', 'Pessoa Física'), ('J', 'Pessoa Jurídica')])
    CNPJEndereco = models.CharField(max_length=20, null=True)
    InscricaoEndereco = models.CharField(max_length=20, null=True)
    CEP = models.CharField(max_length=20, default='00000-000')
    Endereco = models.CharField(max_length=70)
    Numero = models.CharField(max_length=20, null=True)
    Complemento = models.CharField(max_length=30, null=True)
    Bairro = models.CharField(max_length=50, null=True)
    pais = models.ForeignKey(ger_pais, on_delete=models.PROTECT)
    uf = models.ForeignKey(ger_uf, on_delete=models.SET_NULL, null=True)
    cidade = models.ForeignKey(ger_cidade, on_delete=models.SET_NULL, null=True)
    PontoReferencia = models.CharField(max_length=70, null=True)
    TelefoneEndereco1 = models.CharField(max_length=25, null=True)
    RestricaoEntrega = models.CharField(max_length=50, null=True)
    EnderecoAtivo = models.CharField(max_length=1, default='S')
    EnderecoPadrao = models.CharField(max_length=1, default='N')
    Sincronizado = models.CharField(max_length=1, default='N')
    dtSincronizacao = models.DateTimeField(null=True)
    verSincronizador = models.CharField(max_length=12, null=True)
    idSincronizador = models.IntegerField(null=True)
    cadastro_dt = models.DateTimeField(auto_now_add=True, null=True)
    alteracao_dt = models.DateTimeField(auto_now=True, null=True)
    exclusao_dt = models.DateTimeField(null=True)
    statusregistro_id = models.IntegerField(default=200)
    

    class Meta:
        db_table = 'ger_entidadeendereco'
        unique_together = [['empresa', 'entidade', 'TipoEndereco_id', 'EDI_Integracao']]


class ger_entidadeempresa(models.Model):
    id = models.BigAutoField(primary_key=True)
    entidade = models.ForeignKey(ger_entidade, on_delete=models.PROTECT)
    empresa = models.ForeignKey(ger_empresas, on_delete=models.PROTECT)
    EDI_Integracao = models.CharField(max_length=50, null=True)
    MarcaEmpresa = models.CharField(max_length=100, null=True)
    urlMinhasEntregas = models.CharField(max_length=100, default='https://app.lokalizei.com/track/?id={pedido}', null=True)
    SaldoDisponivel = models.DecimalField(max_digits=15, decimal_places=2, default=0.00, null=True)
    LimiteCredito = models.DecimalField(max_digits=15, decimal_places=2, default=0.00, null=True)
    GrupoEntidade_id = models.BigIntegerField(null=True)
    CategoriaEntidade_id = models.IntegerField(null=True)
    icondicoespagamento_id = models.BigIntegerField(null=True)
    CondPgtoCodTpDocCobranca = models.CharField(max_length=10, null=True)
    NroCondicoesPgto = models.PositiveSmallIntegerField(default=0, null=True)
    dtAlteracaoCondPgto = models.DateTimeField(null=True)
    TabelaPreco_id = models.BigIntegerField(null=True)
    TabelaPrecoSistema_id = models.BigIntegerField(null=True)
    RotaVenda_id = models.BigIntegerField(null=True)
    Vendedor_id = models.BigIntegerField(null=True)
    Transportadora_id = models.IntegerField(null=True)
    fretepadrao_id = models.IntegerField(default=0, null=True)
    StatusAcesso_id = models.PositiveSmallIntegerField(default=0, null=True)
    idEntidadeEndereco = models.BigIntegerField(default=0, null=True)
    dtAlteracaoEndereco = models.DateTimeField(null=True)
    NroEnderecos = models.PositiveSmallIntegerField(default=0, null=True)
    Sincronizado = models.CharField(max_length=1, default='N')
    dtSincronizacao = models.DateTimeField(null=True)
    Sincronizador_ver = models.CharField(max_length=12, null=True)
    Sincronizador_id = models.IntegerField(null=True)
    cadastro_dt = models.DateTimeField(auto_now_add=True, null=True)
    alteracao_dt = models.DateTimeField(auto_now=True, null=True)
    exclusao_dt = models.DateTimeField(null=True)
    statusregistro_id = models.IntegerField(default=200)

    class Meta:
        db_table = 'ger_entidadeempresa'
        unique_together = [['empresa', 'entidade']]


class ger_entidadecondicoespagamento(models.Model):
    id = models.BigAutoField(primary_key=True)
    empresa = models.ForeignKey(ger_empresas, on_delete=models.PROTECT)
    entidade = models.ForeignKey(ger_entidade, on_delete=models.CASCADE)
    CondicaoPagamento = models.ForeignKey(ger_condicoespagamento, on_delete=models.CASCADE)
    ParcelaMinima = models.DecimalField(max_digits=18, decimal_places=2, default=0.00, null=True)
    Multiplicador = models.DecimalField(max_digits=18, decimal_places=8, default=1.00000000, null=True)
    MultiplicadorAPI = models.DecimalField(max_digits=18, decimal_places=8, default=1.00000000, null=True)
    EntidadeCondicaoAtiva = models.CharField(max_length=1, default='S', null=True)
    EDI_Integracao = models.CharField(max_length=50, default='001', null=True)
    Sincronizado = models.CharField(max_length=1, default='N')
    dtSincronizacao = models.DateTimeField(null=True)
    Sincronizador_ver = models.CharField(max_length=12, null=True)
    Sincronizador_id = models.IntegerField(null=True)
    cadastro_dt = models.DateTimeField(auto_now_add=True, null=True)
    alteracao_dt = models.DateTimeField(auto_now=True, null=True)
    exclusao_dt = models.DateTimeField(null=True)
    statusregistro_id = models.IntegerField(default=200)

    class Meta:
        db_table = 'ger_entidadecondicoespagamento'
        unique_together = [['entidade', 'empresa', 'CondicaoPagamento']]


class ger_entidadetransportadora(models.Model):
    id = models.BigAutoField(primary_key=True)
    empresa = models.ForeignKey(ger_empresas, on_delete=models.PROTECT)
    entidade = models.ForeignKey(ger_entidade, on_delete=models.CASCADE)
    transportadora = models.ForeignKey(ger_transportadora, null=True, on_delete=models.CASCADE)
    EDI_Integracao = models.CharField(max_length=50, default='001', null=True)
    EntidadeTransportadoraAtiva = models.CharField(max_length=1, default='S')
    Sincronizado = models.CharField(max_length=1, default='N')
    dtSincronizacao = models.DateTimeField(null=True)
    Sincronizador_ver = models.CharField(max_length=12, null=True)
    Sincronizador_id = models.IntegerField(null=True)
    cadastro_dt = models.DateTimeField(auto_now_add=True, null=True)
    alteracao_dt = models.DateTimeField(auto_now=True, null=True)
    exclusao_dt = models.DateTimeField(null=True)
    statusregistro_id = models.IntegerField(default=200)

    class Meta:
        db_table = 'ger_entidadetransportadora'
        unique_together = [['entidade', 'empresa', 'transportadora']]


class ger_entidadetabelapreco(models.Model):
    id = models.BigAutoField(primary_key=True)
    empresa = models.ForeignKey(ger_empresas, on_delete=models.PROTECT)
    entidade = models.ForeignKey(ger_entidade, on_delete=models.CASCADE)
    EDI_Integracao = models.CharField(max_length=50, null=True)
    tabela_preco = models.ForeignKey(ger_tabelaprecos, null=True, on_delete=models.CASCADE)
    TabelaAtivaEntidade = models.CharField(max_length=1, default='S')
    ValorMinimoPedido = models.DecimalField(max_digits=18, decimal_places=2, default=0.00, null=True)
    TabelaValidaDesde = models.DateField(null=True)
    TabelaValidaAte = models.DateField(null=True)
    Sincronizado = models.CharField(max_length=1, default='N')
    dtSincronizacao = models.DateTimeField(null=True)
    verSincronizador = models.CharField(max_length=12, null=True)
    idSincronizador = models.IntegerField(null=True)
    cadastro_dt = models.DateTimeField(auto_now_add=True, null=True)
    alteracao_dt = models.DateTimeField(auto_now=True, null=True)
    exclusao_dt = models.DateTimeField(null=True)
    statusregistro_id = models.IntegerField(default=200)

    class Meta:
        db_table = 'ger_entidadetabelapreco'
        unique_together = [['empresa', 'entidade']]
        indexes = [
            models.Index(fields=['empresa', 'entidade']),
            models.Index(fields=['empresa', 'entidade', 'tabela_preco']),
            models.Index(fields=['empresa', 'entidade', 'EDI_Integracao'])
        ]


class ger_grupoentidade(models.Model):
    id = models.BigAutoField(primary_key=True)
    empresa = models.ForeignKey(ger_empresas, on_delete=models.PROTECT)
    GrupoEntidade = models.CharField(max_length=50)
    GrupoPadrao = models.CharField(default='N', max_length=1)
    EDI_Integracao = models.CharField(max_length=50, null=True)
    Sincronizado = models.CharField(max_length=1, default='N')
    dtSincronizacao = models.DateTimeField(null=True)
    Sincronizador_ver = models.CharField(max_length=12, null=True)
    Sincronizador_id = models.IntegerField(null=True)
    cadastro_dt = models.DateTimeField(auto_now_add=True, null=True)
    alteracao_dt = models.DateTimeField(auto_now=True, null=True)
    exclusao_dt = models.DateTimeField(null=True)
    statusregistro_id = models.IntegerField(default=200)

    class Meta:
        db_table = 'ger_grupoentidade'
        indexes = [
            models.Index(fields=['empresa']),
        ]

class ger_entidade_tag(models.Model):
    id = models.BigAutoField(primary_key=True)
    entidade = models.ForeignKey(ger_entidade, on_delete=models.PROTECT)
    cod_entidade = models.CharField(max_length=100)
    tipo = models.CharField(max_length=50, null=True)
    area = models.CharField(max_length=100, null=True)
    regiao = models.CharField(max_length=100, null=True)
    cadastro_dt = models.DateTimeField(auto_now_add=True, null=True)
    alteracao_dt = models.DateTimeField(auto_now=True, null=True)
    exclusao_dt = models.DateTimeField(null=True)
    statusregistro_id = models.IntegerField(default=200)

    class Meta:
        db_table = 'ger_entidade_tag'
        indexes = [
            models.Index(fields=['entidade','cod_entidade']),
        ]



class rvd_entidade(models.Model):
    id = models.BigAutoField(primary_key=True)
    entidade = models.ForeignKey(ger_entidade, on_delete=models.PROTECT)
    empresa = models.ForeignKey(ger_empresas, on_delete=models.PROTECT)
    categoria = models.CharField(max_length=100)
    porte = models.CharField(max_length=50)
    potencial_regiao = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    potencial_cliente = models.DecimalField(max_digits=18, decimal_places=2, default=0)  

    class Meta:
        db_table = 'rvd_entidade'

    def __str__(self):
        return self.nome
    


class rvd_entidade_recommendation(models.Model):
    id = models.BigAutoField(primary_key=True)
    entidade = models.ForeignKey(ger_entidade, on_delete=models.PROTECT)
    empresa = models.ForeignKey(ger_empresas, on_delete=models.PROTECT)
    produto = models.ForeignKey(ger_produtos, on_delete=models.PROTECT)
    relevancia = models.DecimalField(max_digits=18, decimal_places=4, default=0) 
    quantidade_media = models.DecimalField(max_digits=18, decimal_places=2, default=0) 
    recommendation = models.IntegerField(null=True, default=0) 
    quantidade_sugerida = models.DecimalField(max_digits=18, decimal_places=2, default=0) 
    sazonalidade = models.DecimalField(max_digits=18, decimal_places=4, default=0) 
    regional = models.DecimalField(max_digits=18, decimal_places=4, default=0) 
    big_six = models.BooleanField(default=False)
    valor_estimado = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    valor_estimado_15 = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    valor_estimado_30 = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    valor_estimado_60 = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    valor_estimado_90 = models.DecimalField(max_digits=18, decimal_places=2, default=0)

    class Meta:
        db_table = 'rvd_entidade_recommendation'

    def __str__(self):
        return f"Recomendação - {self.cliente.nome} para Produto {self.produto_id}"
    

        
class rvd_relevancialog(models.Model):
    """
    Modelo que armazena logs de ajustes de relevância para rastreabilidade.

    Atributos:
        produto (ForeignKey): Produto cujo peso foi ajustado.
        peso_anterior (float): Peso anterior ao ajuste.
        peso_atual (float): Peso após o ajuste.
        data_ajuste (datetime): Data e hora do ajuste.
    """
    produto_id = models.ForeignKey(ger_produtos, on_delete=models.CASCADE)
    peso_anterior = models.FloatField()
    peso_atual = models.FloatField()
    data_ajuste = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'rvd_relevancialog'
    
class rvd_sazonalidade(models.Model):
    """
    Modelo que representa padrões sazonais de vendas para produtos.

    Atributos:
        produto (ForeignKey): Produto associado ao padrão sazonal.
        mes (int): Mês (1 a 12) associado ao padrão sazonal.
        fator (float): Fator sazonal para o mês.
    """
    produto_id = models.ForeignKey(ger_produtos, on_delete=models.CASCADE)
    mes = models.PositiveSmallIntegerField()
    fator = models.FloatField()

    class Meta:
        db_table = 'rvd_sazonalidade'

    
class rvd_entidade_feedback(models.Model):
    """
    Modelo que armazena feedbacks de clientes sobre os produtos recomendados.

    Atributos:
        cliente (ForeignKey): Cliente que forneceu o feedback.
        produto (ForeignKey): Produto recomendado.
        aceito (bool): Indica se o cliente aceitou a recomendação.
        comentario (str): Comentário opcional do cliente.
        data_hora (datetime): Data e hora do feedback.
    """
    entidade_id = models.ForeignKey(ger_entidade, on_delete=models.CASCADE)
    produto = models.ForeignKey(ger_produtos, on_delete=models.CASCADE)
    aceito = models.BooleanField()
    feedback = models.TextField(blank=True, null=True)
    data_criacao = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = "rvd_entidade_feedback"
        verbose_name = "Feedback de Cliente"
        verbose_name_plural = "Feedbacks de Clientes"
        
class rvd_regionalproduct(models.Model):
    region = models.CharField(max_length=100, unique=True)  # Nome da região
    produto_id = models.BigIntegerField()                  # ID do produto
    popularity_score = models.FloatField(default=0.0)      # Relevância/Popularidade
    updated_at = models.DateTimeField(auto_now=True)       # Última atualização
    
    class Meta:
        db_table = "rvd_regionalproduct"
        verbose_name = "Produto Regional"
        verbose_name_plural = "Produtos Regionais"