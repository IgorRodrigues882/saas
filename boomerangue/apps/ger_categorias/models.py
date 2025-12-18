from django.db import models
from boomerangue.apps.ger_empresas.models import ger_empresas

class ger_categorias(models.Model):
    id = models.BigAutoField(primary_key=True)

    empresa = models.ForeignKey(ger_empresas, on_delete=models.PROTECT, null=True)
    EDI_Integracao = models.CharField(max_length=50, null=True)
    TipoCategoria = models.CharField(max_length=2, choices=[
        ('N', 'Normal'),
        ('TV', 'Top Vendas'),
        ('S', 'Sugestão'),
    ])
    categoriaanterior_id = models.IntegerField(default=0, null=True)
    CategoriaSubstituta_id = models.IntegerField(default=0, null=True)
    Categoria = models.CharField(max_length=50)
    CategoriaAmigavel = models.CharField(max_length=50, null=True)
    CategoriaPersonalizada = models.CharField(max_length=50, null=True)
    CategoriaDescricao = models.CharField(max_length=255, null=True)
    OrdemCategoria = models.CharField(max_length=5, null=True)
    OrdemExibicao = models.CharField(max_length=5, null=True)
    CategoriaIcone = models.CharField(max_length=255, null=True)
    IconePersonalizado = models.CharField(max_length=255, null=True)
    CategoriaCorFundo = models.CharField(max_length=10, null=True)
    CategoriaCorLetra = models.CharField(max_length=10, null=True)
    Categoria1Prioridade = models.IntegerField(null=True)
    Categoria1Ativa = models.IntegerField(null=True)
    CategoriaUsarDoProduto = models.CharField(max_length=1, null=True)
    CategoriaDesativarForcado = models.CharField(max_length=1, null=True)
    Sincronizado = models.CharField(max_length=1, default='N' , null=True)
    dtSincronizacao = models.DateTimeField(null=True)
    verSincronizador = models.CharField(max_length=12,null=True)
    idSincronizador = models.IntegerField(null=True)
    cadastro_dt = models.DateTimeField(auto_now_add=True, null=True)
    alteracao_dt = models.DateTimeField(auto_now=True)
    exclusao_dt = models.DateTimeField(null=True)
    statusregistro_id = models.IntegerField(default=200)

    class Meta:
        db_table="ger_categorias"

    def __str__(self):
        return self.Categoria  # Retorna o nome da categoria como representação padrão
