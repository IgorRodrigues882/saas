from django.db import models
from boomerangue.apps.ger_entidades.models import ger_entidade
from boomerangue.apps.ger_empresas.models import ger_empresas
# Create your models here.

class b2b_bonusconfig(models.Model):
    id = models.AutoField(primary_key=True)
    empresa = models.ForeignKey(ger_empresas, on_delete=models.CASCADE)
    entidade = models.ForeignKey(ger_entidade, on_delete=models.CASCADE)
    # categoriacliente = models.ForeignKey('CategoriaCliente', on_delete=models.CASCADE)
    # produto = models.ForeignKey('Produto', on_delete=models.CASCADE)
    # categoriaproduto = models.ForeignKey('CategoriaProduto', on_delete=models.CASCADE)
    cadastro_dt = models.DateTimeField(auto_now_add=True)
    alteracao_dt = models.DateTimeField(auto_now=True)
    exclusao_dt = models.DateTimeField(null=True)
    statusregistro_id = models.IntegerField(default=200)

    class Meta:
        db_table="b2b_bonusconfig"
        indexes = [
            models.Index(fields=['empresa']),
            models.Index(fields=['empresa', 'entidade']),
        ]

class b2b_bonusregraescalonada(models.Model):
    id = models.AutoField(primary_key=True)
    bonusconfig = models.ForeignKey(b2b_bonusconfig, on_delete=models.CASCADE)
    min_pedido_valor = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    max_pedido_valor = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    min_produto_qtd = models.IntegerField(null=True)
    max_produto_qtd = models.IntegerField(null=True)
    bonus_percentual = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    bonus_valor = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    cadastro_dt = models.DateTimeField(auto_now_add=True)
    alteracao_dt = models.DateTimeField(auto_now=True)
    exclusao_dt = models.DateTimeField(null=True)
    statusregistro_id = models.IntegerField(default=200)

    class Meta:
        db_table="b2b_bonusregraescalonada"
        indexes = [
            models.Index(fields=['bonusconfig']),
        ]


class b2b_bonusmovimento(models.Model):
    id = models.AutoField(primary_key=True)
    entidade = models.ForeignKey(ger_entidade, on_delete=models.CASCADE)
    #pedido = models.ForeignKey('Pedido', on_delete=models.CASCADE, null=True)
    #pedidoitem = models.ForeignKey('PedidoItem', on_delete=models.CASCADE, null=True)
    bonusconfig = models.ForeignKey(b2b_bonusconfig, on_delete=models.CASCADE, null=True)
    bonusescalonado = models.ForeignKey(b2b_bonusregraescalonada, on_delete=models.CASCADE, null=True)
    data_movimento = models.DateTimeField(auto_now_add=True)
    valor_movimento = models.DecimalField(max_digits=10, decimal_places=2)
    TIPO_MOVIMENTO_CHOICES = (
        ('ACUMULO', 'Acúmulo'),
        ('RESGATE', 'Resgate'),
    )
    tipo_movimento = models.CharField(max_length=7, choices=TIPO_MOVIMENTO_CHOICES)
    data_vencimento = models.DateField(null=True)
    cadastro_dt = models.DateTimeField(auto_now_add=True)
    alteracao_dt = models.DateTimeField(auto_now=True)
    exclusao_dt = models.DateTimeField(null=True)
    statusregistro_id = models.IntegerField(default=200)

    class Meta:
        db_table="b2b_bonusmovimento"