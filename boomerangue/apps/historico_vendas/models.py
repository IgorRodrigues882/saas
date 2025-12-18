from django.db import models
from boomerangue.apps.ger_empresas.models import ger_empresas

from boomerangue.apps.ger_empresas.models import ger_empresas
from boomerangue.apps.ger_entidades.models import ger_entidade, ger_categoriaentidade
from boomerangue.apps.ger_dadosgerais.models import ger_condicoespagamento
from boomerangue.apps.ger_produtos.models import ger_produtos

class bmm_historico(models.Model):
    id = models.AutoField(primary_key=True)
    edi_integracao = models.CharField(max_length=100, null=True)
    tipo_historico = models.CharField(max_length=10, null=True)
    nfe = models.CharField(max_length=50, null=True)
    pedido = models.CharField(max_length=50, null=True)
    dt_emissao = models.DateTimeField(null=True)
    dt_saida = models.DateTimeField(null=True, blank= True)
    edi_condpgto = models.CharField(max_length=50, null=True)
    cond_pgto = models.CharField(max_length=200, null=True)
    fob = models.CharField(max_length= 1, default = 'F')
    total_produtos = models.DecimalField(max_digits=10, decimal_places=2, null=False)
    total_nota = models.DecimalField(max_digits=10, decimal_places=2, null=False)
    total_pedido = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    nronotas = models.IntegerField(null=False)
    total_desconto = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    tipovenda = models.CharField(max_length=10, null=True)
    autonumerador = models.IntegerField(null=True, blank = True)
    empresa = models.ForeignKey(ger_empresas, on_delete=models.PROTECT, null=False)
    entidade = models.ForeignKey(ger_entidade, on_delete=models.PROTECT, null=False)
    categoriaentidade = models.ForeignKey(ger_categoriaentidade, on_delete=models.PROTECT, null=True)
    condicoespagamento = models.ForeignKey(ger_condicoespagamento, on_delete=models.PROTECT, null=True)
    produto = models.ForeignKey(ger_produtos, on_delete=models.PROTECT, null=True)
    canal_vendas = models.CharField(max_length=100, null=True)
    Representante = models.CharField(max_length=100, null=True)


    def __str__(self):
        return self.edi_integracao

    class Meta:
        db_table = 'bmm_historico'
        indexes = [
            models.Index(fields=['edi_integracao']),
            models.Index(fields=['tipo_historico']),
            models.Index(fields=['nfe']),
            models.Index(fields=['pedido']),
            models.Index(fields=['dt_emissao']),
            models.Index(fields=['dt_saida']),
            models.Index(fields=['edi_condpgto']),
            models.Index(fields=['cond_pgto']),
            models.Index(fields=['fob']),
            models.Index(fields=['total_produtos']),
            models.Index(fields=['total_nota']),
            models.Index(fields=['total_pedido']),
            models.Index(fields=['nronotas']),
            models.Index(fields=['total_desconto']),
            models.Index(fields=['tipovenda']),
            models.Index(fields=['empresa']),
            models.Index(fields=['entidade']),
            models.Index(fields=['categoriaentidade']),
            models.Index(fields=['condicoespagamento']),
        ]

class historico_vendasimportado(models.Model):
    id = models.AutoField(primary_key=True)
    tipo_arquivo = models.CharField(max_length=20, default='A Validar')
    empresa = models.ForeignKey(ger_empresas, on_delete=models.PROTECT)
    NomeArquivo = models.CharField(max_length=200)
    Caminho = models.FileField(upload_to='media/arq_historico/', null=True)
    DataHora = models.DateTimeField(auto_now=True)
    retorno_arquivo = models.TextField(max_length=100, null=True)
    dtProcessamento = models.DateTimeField(null=True)
    statusarquivo_id = models.CharField(max_length=1)
    cadastro_dt = models.DateTimeField(auto_now_add=True, null=True)
    alteracao_dt = models.DateTimeField(auto_now=True, null=True)
    exclusao_dt = models.DateTimeField(null=True)
    statusregistro_id = models.IntegerField(default=200)

    class Meta:
        db_table = 'historico_vendasimportado'