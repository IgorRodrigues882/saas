from django.db import models
from boomerangue.apps.gateway_pagamento.models import gateway_pagamento
from boomerangue.apps.ger_empresas.models import ger_empresas
from boomerangue.apps.ger_entidades.models import ger_entidade
from boomerangue.apps.campaign.models import bmm_boomerangue
import uuid
from storages.backends.s3boto3 import S3Boto3Storage

#class ContaBancaria(models.Model):
#    id = models.CharField(max_length=36, primary_key=True, default=uuid.uuid4, editable=False, unique=True)
#    banco_codigo = models.CharField(max_length=10)
#    agencia = models.CharField(max_length=10)
#    conta = models.CharField(max_length=20)
#    chave_pix = models.CharField(max_length=77, blank=True, null=True)
#    empresa = models.ForeignKey(ger_empresas, on_delete=models.PROTECT)
#    created_at = models.DateTimeField(auto_now_add=True)
#    updated_at = models.DateTimeField(auto_now=True)
#
#    def _str_(self):
#        return f"{self.banco_codigo} - {self.agencia} - {self.conta}"

class WasabiStorage(S3Boto3Storage):
    bucket_name = 'boomerangue'
    custom_domain = f'{bucket_name}.s3.wasabisys.com'
    location = 'comprovantes_pagamentos/'  # Opcional: definir um subdiretório específico
    region_name = 'us-west-1'  # Altere conforme sua configuração
    endpoint_url = 'https://s3.us-west-1.wasabisys.com'

class SolicitacaoPagamento(models.Model):
    RECORRENCIA_CHOICES = [
        ('UNICO', 'Único'),
        ('PARCELADO', 'Parcelado'),
        ('RECORRENTE', 'Recorrente'),
    ]
    
    TIPO_CHOICES = [
        ('PIX', 'Pix'),
        ('CARTAO', 'Cartão'),
        ('BOLETO', 'Boleto'),
    ]

    STATUS_CHOICES = [
        ('PENDENTE', 'Pendente'),
        ('APROVADO', 'Aprovado'),
        ('REJEITADO', 'Rejeitado'),
        ('CANCELADO', 'Cancelado'),
    ]

    id = models.CharField(max_length=36, primary_key=True, default=uuid.uuid4, editable=False, unique=True)
    boomerangue = models.ForeignKey(bmm_boomerangue, on_delete=models.PROTECT)
    txid = models.CharField(max_length=100, null=True)
    id_txid = models.CharField(max_length=100, null=True)
    status = models.CharField(max_length=10, default="PENDENTE", choices=STATUS_CHOICES)
    copia_e_cola = models.CharField(max_length=300, null=True)
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    data_vencimento = models.DateTimeField(blank=True, null=True)
    tipo_pagamento = models.CharField(max_length=7, choices=TIPO_CHOICES)
    conta = models.ForeignKey(gateway_pagamento, on_delete=models.PROTECT)
    recorrencia = models.CharField(max_length=10, choices=RECORRENCIA_CHOICES)
    empresa = models.ForeignKey(ger_empresas, on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    expire_at = models.IntegerField(null=True)
    data_tx = models.DateTimeField(blank=True, null=True)
    import_comprovante = models.FileField(storage=WasabiStorage(), upload_to='comprovante/', null=True)
    import_comprovante_url = models.CharField(max_length=500, null=True) 


    def _str_(self):
        return f"{self.valor} - {self.recorrencia} {self.status}"


class LogSolicitacaoPagamento(models.Model):
    id = models.CharField(max_length=36, primary_key=True, default=uuid.uuid4, editable=False, unique=True)
    boomerangue = models.ForeignKey(bmm_boomerangue, on_delete=models.PROTECT, null=True)
    solicitacao_pagamento = models.ForeignKey(SolicitacaoPagamento, on_delete=models.PROTECT, null=True)
    mensagem = models.TextField(null=True)
    acao = models.TextField(null=True)
    data_log = models.DateTimeField(auto_now_add=True)

    def _str_(self):
        return f"Log de Transação {self.solicitacao_pagamento.id} - {self.data_log}"


class Recebimento(models.Model):
    TIPO_CHOICES = [
        ('RECEBIMENTO', 'Recebimento'),
        ('CANCELAMENTO', 'Cancelamento'),
    ]

    id = models.CharField(max_length=36, primary_key=True, default=uuid.uuid4, editable=False, unique=True)
    solicitacao_pagamento = models.ForeignKey(SolicitacaoPagamento, on_delete=models.PROTECT)
    tipo = models.CharField(max_length=13, choices=TIPO_CHOICES)
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    data_recebimento = models.DateTimeField(auto_now_add=True)

    def _str_(self):
        return f"{self.tipo} - {self.valor}"