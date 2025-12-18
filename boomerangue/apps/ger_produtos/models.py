from django.db import models
from boomerangue.apps.ger_empresas.models import ger_empresas
from boomerangue.apps.ger_grade.models import ger_grade
from boomerangue.apps.ger_linhaprodutos.models import ger_linhaprodutos
from boomerangue.apps.ger_grupoprodutos.models import ger_grupoprodutos
from boomerangue.apps.ger_dadosgerais.models import ger_marcas, ger_unidademedida
from boomerangue.apps.ger_categorias.models import ger_categorias

class ger_produtos(models.Model):
    id = models.BigAutoField(primary_key=True)

    empresa = models.ForeignKey(ger_empresas, on_delete=models.CASCADE)
    edi_integracao = models.CharField(max_length=50)
    marca = models.ForeignKey(ger_marcas, on_delete=models.CASCADE, null=True)
    Marca_Filtro = models.CharField(max_length=50, null=True)
    SKU = models.CharField(max_length=50, null=True)
    Codigo = models.CharField(max_length=50, null=True)
    CodigoFornecedor = models.CharField(max_length=50, null=True)
    Busca = models.CharField(max_length=50, null=True)
    EAN = models.CharField(max_length=50, null=True)
    DUN = models.CharField(max_length=50, null=True)
    Agrupador = models.CharField(max_length=50, null=True)
    ProdutoBusca = models.CharField(max_length=100, null=True)
    Destaque = models.CharField(max_length=1, choices=[
        ('S', 'Sim'),
        ('N', 'Não'),
    ], default='N')
    SaiListaGeral = models.CharField(max_length=1, choices=[
        ('S', 'Sim'),
        ('N', 'Não'),
    ], default='S')
    TemVariacao = models.CharField(max_length=1, choices=[
        ('S', 'Sim'),
        ('N', 'Não'),
    ], default='N')
    UsarDescricaoPersonalizada = models.CharField(max_length=1, choices=[
        ('S', 'Sim'),
        ('N', 'Não'),
    ], default='N')
    UsaMultiplicador = models.CharField(max_length=1, choices=[
        ('S', 'Sim'),
        ('N', 'Não'),
    ], default='N')
    produtoAtivo = models.CharField(max_length=1, choices=[
        ('S', 'Sim'),
        ('N', 'Não'),
    ], default='S')
    GrupoAtivo = models.CharField(max_length=1, choices=[
        ('S', 'Sim'),
        ('N', 'Não'),
    ],default='S')
    LinhaAtiva = models.CharField(max_length=1, choices=[
        ('S', 'Sim'),
        ('N', 'Não'),
    ], default='S')
    CEST = models.CharField(max_length=20, null=True)
    NCM = models.CharField(max_length=20, null=True)
    Descricao = models.CharField(max_length=150, null=True)
    Descricao_Longa = models.CharField(max_length=150, null=True)
    Descricao_Curta = models.CharField(max_length=150, null=True)
    Descricao_Detalhada = models.CharField(null=True, max_length=200)
    Descricao_Amigavel = models.CharField(max_length=150, null=True)
    Descricao_Limpa = models.CharField(max_length=150, null=True)
    Descricao_Personalizada = models.CharField(max_length=150, null=True)
    LinhaProduto = models.ForeignKey(ger_linhaprodutos, on_delete=models.SET_NULL, null=True)
    GrupoProdutos = models.ForeignKey(ger_grupoprodutos, on_delete=models.SET_NULL, null=True)
    Categoria1 = models.ForeignKey(ger_categorias, on_delete=models.SET_NULL, null=True, related_name="Categoria1")
    Categoria2 = models.ForeignKey(ger_categorias, on_delete=models.SET_NULL, null=True, related_name="Categoria2")
    Categoria3 = models.ForeignKey(ger_categorias, on_delete=models.SET_NULL, null=True, related_name="Categoria3")
    CategoriaApp1 = models.ForeignKey(ger_categorias, on_delete=models.SET_NULL, null=True, related_name="CategoriaApp1")
    CategoriaApp2 = models.ForeignKey(ger_categorias, on_delete=models.SET_NULL, null=True, related_name="CategoriaApp2")
    CategoriaAPP1Ordem = models.CharField(max_length=5, default='0000', null=True)
    CategoriaAPP2Ordem = models.CharField(max_length=5, default='0000', null=True)
    grade = models.ForeignKey(ger_grade, on_delete=models.SET_NULL, null=True)
    UnidadeMedidaUn = models.ForeignKey(ger_unidademedida, on_delete=models.SET_NULL, null=True, related_name="UnidadeMedidaUn")
    Fator_Unitario = models.DecimalField(max_digits=18, decimal_places=6, default=1)
    UnidadeMedidaCx = models.ForeignKey(ger_unidademedida, on_delete=models.SET_NULL, null=True, related_name="UnidadeMedidaCx")
    cadastro_dt = models.DateTimeField(auto_now_add=True, null=True)
    alteracao_dt = models.DateTimeField(auto_now=True, null=True)
    exclusao_dt = models.DateTimeField(null=True)
    statusregistro_id = models.IntegerField(default=200)
    OrdemPersonalizada = models.CharField(max_length=100, default='0000')
    PathProduto = models.CharField(max_length=500, null=True, default=None)
    quantidade_disponivel = models.DecimalField(max_digits=18, decimal_places=4, default=0, null=True)
    saldo = models.DecimalField(max_digits=18, decimal_places=2, default=0, null=True)
    QuantidadePorCaixa = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=1, 
        null=True, 
        help_text="Quantidade de itens por caixa"
    )

    final_relevance = models.DecimalField(max_digits=18, decimal_places=4, default=1, null=True)
    relevancia_peso = models.DecimalField(max_digits=18, decimal_places=4, default=1, null=True)

    class Meta:
        db_table = 'ger_produtos'
        indexes = [
            models.Index(fields=['empresa_id', 'edi_integracao'], name='ix_gerproduto_upsert'),
            models.Index(fields=['Descricao', 'Descricao_Curta', 'Descricao_Amigavel', 'EAN', 'Codigo', 'SKU'], name='ix_gerproduto'),
            models.Index(fields=['Descricao_Detalhada'], name='desc_detalhada')
        ]

    def __str__(self):
        return self.Descricao  # Retorna a descrição do produto como representação padrão