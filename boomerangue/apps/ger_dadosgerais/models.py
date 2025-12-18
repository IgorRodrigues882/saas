from django.db import models
from boomerangue.apps.ger_empresas.models import ger_empresas, ger_condicoespagamento

# Create your models here.
class ger_dadosgerais(models.Model):
    id = models.AutoField(primary_key=True)
    grupo = models.CharField(max_length=255)
    texto = models.CharField(max_length=255)
    valornumerico = models.IntegerField(null=True)
    valorfinanceiro = models.DecimalField(max_digits=18, decimal_places=6, null=True)
    valortexto = models.CharField(max_length=255, null=True)
    ordem = models.IntegerField()
    cadastro_dt = models.DateTimeField(auto_now_add=True)
    alteracao_dt = models.DateTimeField(auto_now=True)
    exclusao_dt = models.DateTimeField(null=True)
    statusregistro_id = models.IntegerField()

    class Meta:
        db_table = 'ger_dadosgerais'
        indexes = [
            models.Index(fields=['grupo']),
            models.Index(fields=['grupo', 'texto']),
            models.Index(fields=['grupo', 'valornumerico']),
            models.Index(fields=['grupo', 'valorfinanceiro']),
            models.Index(fields=['grupo', 'valortexto']),
        ]


class ger_pais(models.Model):
    id = models.AutoField(primary_key=True)
    Pais = models.CharField(max_length=50)
    moeda_id = models.IntegerField(default=1)
    SiglaPais = models.CharField(max_length=3, null=True)
    cadastro_dt = models.DateTimeField(auto_now_add=True)
    alteracao_dt = models.DateTimeField(auto_now=True)
    exclusao_dt = models.DateTimeField(null=True)
    statusregistro_id = models.IntegerField(default=200)

    class Meta:
        db_table = 'ger_pais'
        indexes = [
            models.Index(fields=['Pais'], name='idx_pais_unique'),
        ]


class ger_regiao(models.Model):
    id = models.BigAutoField(primary_key=True)
    Regiao = models.CharField(max_length=50)
    pais = models.ForeignKey(ger_pais, on_delete=models.CASCADE, null=True)
    RegiaoReduzida = models.CharField(max_length=20)
    cadastro_dt = models.DateTimeField(auto_now_add=True)
    alteracao_dt = models.DateTimeField(auto_now=True)
    exclusao_dt = models.DateTimeField(null=True)
    statusregistro_id = models.IntegerField(default=200)

    class Meta:
        db_table = 'ger_regiao'
        indexes = [
            models.Index(fields=['id']),
        ]

class ger_uf(models.Model):
    id = models.AutoField(primary_key=True)
    pais = models.ForeignKey(ger_pais, on_delete=models.CASCADE)
    regiao = models.ForeignKey(ger_regiao, on_delete=models.CASCADE)
    uf = models.CharField(max_length=50)
    sigla = models.CharField(max_length=10)
    cadastro_dt = models.DateTimeField(auto_now_add=True)
    alteracao_dt = models.DateTimeField(auto_now=True)
    exclusao_dt = models.DateTimeField(null=True)
    statusregistro_id = models.IntegerField(default=200)

    class Meta:
        db_table = 'ger_uf'
        indexes = [
            models.Index(fields=['id']),
        ]

class ger_mesoregiao(models.Model):
    id = models.BigAutoField(primary_key=True)
    uf = models.ForeignKey(ger_uf, on_delete=models.PROTECT)
    MesoRegiao = models.CharField(max_length=50)
    cadastro_dt = models.DateTimeField(auto_now_add=True)
    alteracao_dt = models.DateTimeField(auto_now=True)
    exclusao_dt = models.DateTimeField(null=True)
    statusregistro_id = models.IntegerField(default=200)

    class Meta:
        db_table = 'ger_mesoregiao'
        indexes = [
            models.Index(fields=['id']),
        ]


class ger_cidade(models.Model):
    id = models.BigAutoField(primary_key=True)
    pais = models.ForeignKey(ger_pais, on_delete=models.PROTECT, null=True)
    uf = models.ForeignKey(ger_uf, on_delete=models.PROTECT)
    MesoRegiao = models.ForeignKey(ger_mesoregiao, on_delete=models.PROTECT, null=True)
    Cidade = models.CharField(max_length=100)
    CodIBGE = models.CharField(max_length=10, null=True)
    cadastro_dt = models.DateTimeField(auto_now_add=True, null=True)
    alteracao_dt = models.DateTimeField(auto_now=True, null=True)
    exclusao_dt = models.DateTimeField(null=True)
    statusregistro_id = models.IntegerField(default=200)

    class Meta:
        db_table = 'ger_cidade'
        indexes = [
            models.Index(fields=['id']),
            models.Index(fields=['CodIBGE']),
        ]


class ger_parceiros(models.Model):
    id = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=40)
    parceiro_apelido = models.CharField(max_length=20)
    cidade = models.ForeignKey(ger_cidade, on_delete=models.PROTECT)
    parceiro_ativo = models.CharField(max_length=1, default='S')
    cadastro_dt = models.DateTimeField(auto_now_add=True)
    alteracao_dt = models.DateTimeField(auto_now=True)
    exclusao_dt = models.DateTimeField(null=True)
    statusregistro_id = models.IntegerField(default=200)

    class Meta:
        db_table = 'ger_parceiros'
        indexes = [
            models.Index(fields=['id']),
        ]


class ger_rotavenda(models.Model):
    id = models.BigAutoField(primary_key=True)
    empresa = models.ForeignKey(ger_empresas, on_delete=models.PROTECT, null=True)
    RotaVenda = models.CharField(max_length=50)
    RotaPadrao = models.CharField(max_length=1, default='S')
    RotaAtiva = models.CharField(max_length=1, default='S')
    DiaEntrega_id = models.SmallIntegerField(default=0)
    Integracao_EDI = models.CharField(max_length=50, null=True)
    Sincronizado = models.CharField(max_length=1, default='N')
    dtSincronizacao = models.DateTimeField(null=True)
    Sincronizador_ver = models.CharField(max_length=12, null=True)
    Sincronizador_id = models.IntegerField(null=True)
    cadastro_dt = models.DateTimeField(auto_now_add=True, null=True)
    alteracao_dt = models.DateTimeField(auto_now=True, null=True)
    exclusao_dt = models.DateTimeField(null=True)
    statusregistro_id = models.IntegerField(default=200)

    class Meta:
        db_table = 'ger_rotavenda'
        indexes = [
            models.Index(fields=['empresa_id']),
            models.Index(fields=['id']),
        ]


class ger_tabelaprecos(models.Model):
    id = models.AutoField(primary_key=True)
    empresa = models.ForeignKey(ger_empresas, on_delete=models.PROTECT, null=True)
    TabelaPreco = models.CharField(max_length=100)
    TabelaAtiva = models.CharField(max_length=1, default='S')
    TabelaPadrao = models.CharField(max_length=1, default='S')
    ExportaTabelaPreco = models.CharField(max_length=1, default='S')
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
        db_table = 'ger_tabelaprecos'
        indexes = [
            models.Index(fields=['empresa_id']),
            models.Index(fields=['id']),
            models.Index(fields=['empresa_id', 'ExportaTabelaPreco']),
            models.Index(fields=['ExportaTabelaPreco']),
            models.Index(fields=['empresa_id', 'TabelaPreco']),
        ]

class ger_transportadora(models.Model):
    id = models.AutoField(primary_key=True)
    empresa = models.ForeignKey(ger_empresas, on_delete=models.PROTECT, null=True)
    EDI_Integracao = models.CharField(max_length=50, null=True)
    Transportadora = models.CharField(max_length=100)
    TransportadoraAtivo = models.CharField(max_length=1, default='S')
    TransportadoraPadrao = models.CharField(max_length=1, default='N')
    Sincronizado = models.CharField(max_length=1, default='N')
    dtSincronizacao = models.DateTimeField(null=True)
    Sincronizador_ver = models.CharField(max_length=12, null=True)
    Sincronizador_id = models.IntegerField(null=True)
    cadastro_dt = models.DateTimeField(auto_now_add=True, null=True)
    alteracao_dt = models.DateTimeField(auto_now=True, null=True)
    exclusao_dt = models.DateTimeField(null=True)
    statusregistro_id = models.IntegerField(default=200)

    class Meta:
        db_table = 'ger_transportadora'
        indexes = [
            models.Index(fields=['id']),
            models.Index(fields=['empresa_id', 'EDI_Integracao'], name='ixEDI'),
            models.Index(fields=['Transportadora', 'empresa_id'], name='ixNome'),
        ]

class ger_vendedores(models.Model):
    id = models.BigAutoField(primary_key=True)
    empresa = models.ForeignKey(ger_empresas, on_delete=models.PROTECT, null=True)
    CodigoVendedor = models.CharField(max_length=25, null=True)
    Vendedor = models.CharField(max_length=50)
    VendedorBM = models.CharField(max_length=50, null=True)
    VendedorOriginal = models.CharField(max_length=50, null=True)
    Apelido = models.CharField(max_length=40)
    LegendaVendedor = models.CharField(max_length=50, default='Seu Vendedor')
    TelefoneVendedor = models.CharField(max_length=25, null=True)
    VendedorPadrao = models.CharField(max_length=1, default='N')
    Integracao_EDI = models.CharField(max_length=50, null=True)
    Integracao_EDI2 = models.CharField(max_length=50, null=True)
    ComissaoVenda = models.DecimalField(max_digits=18, decimal_places=4, default=0.0000)
    TabelaPrecoPadrao = models.ForeignKey(ger_tabelaprecos, on_delete=models.PROTECT, null=True)
    CondicaoPgtoPadrao = models.ForeignKey(ger_condicoespagamento, on_delete=models.PROTECT, null=True)
    TransportadoraPadrao = models.ForeignKey(ger_transportadora, on_delete=models.PROTECT, null=True)
    MarcaPadrao = models.CharField(max_length=50, null=True)
    Sincronizado = models.CharField(max_length=1, default='N')
    dtSincronizacao = models.DateTimeField(null=True)
    Sincronizador_ver = models.CharField(max_length=12, null=True)
    Sincronizador_id = models.IntegerField(null=True)
    cadastro_dt = models.DateTimeField(auto_now_add=True, null=True)
    alteracao_dt = models.DateTimeField(auto_now=True, null=True)
    exclusao_dt = models.DateTimeField(null=True)
    statusregistro_id = models.IntegerField(default=200)

    class Meta:
        db_table = 'ger_vendedores'
        indexes = [
            models.Index(fields=['id']),
            models.Index(fields=['empresa_id', 'Integracao_EDI'], name='EDI1'),
            models.Index(fields=['empresa_id', 'Integracao_EDI2'], name='EDI2'),
            models.Index(fields=['empresa_id', 'id'], name='EDI3'),
        ]

class ger_unidademedida(models.Model):
    id = models.BigAutoField(primary_key=True)
    empresa = models.ForeignKey(ger_empresas, on_delete=models.PROTECT)
    EDI_Integracao = models.CharField(max_length=50, null=True)
    UnidadeMedida = models.CharField(max_length=50)
    Sigla = models.CharField(max_length=50)
    Sincronizado = models.CharField(max_length=1, default='N')
    dtSincronizacao = models.DateTimeField(null=True)
    verSincronizador = models.CharField(max_length=12, null=True)
    idSincronizador = models.IntegerField(null=True)
    cadastro_dt = models.DateTimeField(auto_now_add=True, null=True)
    alteracao_dt = models.DateTimeField(auto_now=True, null=True)
    exclusao_dt = models.DateTimeField(null=True)
    statusregistro_id = models.IntegerField(default=200)

    class Meta:
        db_table = 'ger_unidademedida'
        indexes = [
            models.Index(fields=['id']),
            models.Index(fields=['empresa_id']),
            models.Index(fields=['empresa_id', 'EDI_Integracao'], name='ixEdi'),
            models.Index(fields=['UnidadeMedida'], name='ixUnidadeMedida'),
        ]


class ger_marcas(models.Model):
    id = models.AutoField(primary_key=True)
    empresa = models.ForeignKey(ger_empresas, on_delete=models.PROTECT)
    EDI_Integracao = models.CharField(max_length=50, null=True)
    Marca = models.CharField(max_length=50)
    Site = models.CharField(max_length=100, null=True)
    LogoMarca = models.CharField(max_length=200, null=True)
    MarcaPadrao = models.CharField(max_length=1, default='N')
    OrdemMarca = models.CharField(max_length=4, null=True)
    Sincronizado = models.CharField(max_length=1, null=True)
    dtSincronizacao = models.DateTimeField(null=True)
    verSincronizador = models.CharField(max_length=12,null=True)
    idSincronizador = models.IntegerField(null=True)
    cadastro_dt = models.DateTimeField(auto_now_add=True, null=True)
    alteracao_dt = models.DateTimeField(auto_now=True, null=True)
    exclusao_dt = models.DateTimeField(null=True)
    statusregistro_id = models.IntegerField(default=200)

    class Meta:
        db_table = 'ger_marcas'
        indexes = [
            models.Index(fields=['id']),
            models.Index(fields=['empresa_id', 'EDI_Integracao'], name='UMARCA'),
            models.Index(fields=['Marca'], name='IMARCAS1'),
        ]


class ger_distribuidor(models.Model):
    id = models.AutoField(primary_key=True)
    distribuidor = models.CharField(max_length=200, null=True)
    cod_puxada = models.CharField(max_length=20, null=True)
    cadastro_dt = models.DateTimeField(auto_now_add=True, null=True)
    alteracao_dt = models.DateTimeField(auto_now=True, null=True)
    exclusao_dt = models.DateTimeField(null=True)
    statusregistro_id = models.IntegerField(default=200)

    class Meta:
        db_table = 'ger_distribuidor'

class ger_dados_cep(models.Model):
    id = models.AutoField(primary_key=True)
    cep =  models.CharField(max_length=200, null=True)
    logradouro =  models.CharField(max_length=200, null=True)
    complemento =  models.CharField(max_length=200, null=True)
    bairro =  models.CharField(max_length=200, null=True)
    localidade =  models.CharField(max_length=200, null=True)
    uf = models.ForeignKey(ger_uf, on_delete=models.SET_NULL, null=True)
    unidade= models.CharField(max_length=200, null=True)
    ibge= models.CharField(max_length=200, null=True)
    gia= models.CharField(max_length=200, null=True)


    class Meta:
        db_table = 'ger_dados_cep'

        indexes = [
            models.Index(fields=['id']),
            models.Index(fields=['cep']),
        ]