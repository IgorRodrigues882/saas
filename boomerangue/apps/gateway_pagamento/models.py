from django.db import models
from boomerangue.apps.ger_empresas.models import ger_empresas
from storages.backends.s3boto3 import S3Boto3Storage


class WasabiStorage(S3Boto3Storage):
    bucket_name = 'boomerangue'
    custom_domain = f'{bucket_name}.s3.wasabisys.com'
    location = 'gateway_pagamentos/'  # Opcional: definir um subdiretório específico
    region_name = 'us-west-1'  # Altere conforme sua configuração
    endpoint_url = 'https://s3.us-west-1.wasabisys.com'


class gateway_pagamento(models.Model):
    id = models.BigAutoField(primary_key=True)
    empresa = models.ForeignKey(ger_empresas, on_delete=models.PROTECT, null=True)
    gateway_name = models.CharField(max_length=100)
    TIPOS_GATEWAY = [
        ('BB', 'Banco do Brasil'),
        ('MP', 'Mercado Pago'),
        ('SC', 'Sicoob'),
    ]
    gateway_type = models.CharField(max_length=2, choices=TIPOS_GATEWAY)
    certificados = models.FileField(storage=WasabiStorage(), upload_to='certificados/', null=True)
    certificados_senhas = models.FileField(storage=WasabiStorage(), upload_to='certificados_senhas/', null=True)
    certificado_name = models.CharField(max_length=500, null=True)
    certificados_senhas_name = models.CharField(max_length=500, null=True)
    certificados_url = models.CharField(max_length=500, null=True)
    certificados_senhas_url = models.CharField(max_length=500, null=True)
    dev_key = models.CharField(max_length=500, null=True)
    client_id = models.CharField(max_length=500, null=True)
    client_secret = models.CharField(max_length=1000, null=True)
    expiration_time = models.IntegerField(null=True)
    pix_key = models.CharField(max_length=200, null=True)
    cadastro_dt = models.DateTimeField(auto_now_add=True, null=True)
    alteracao_dt = models.DateTimeField(auto_now=True)
    exclusao_dt = models.DateTimeField(null=True)
    statusregistro_id = models.IntegerField(default=200)

    class Meta:
        db_table = 'gateway_pagamento'
