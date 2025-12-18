from django.db import models
import uuid

class PixRequest(models.Model):
    id = models.CharField(max_length=36, primary_key=True, default=uuid.uuid4, editable=False, unique=True)  # Campo `id` do tipo CHAR com 36 caracteres
    transaction_id = models.CharField(max_length=255, null=True)  # Campo `transaction_id` do tipo VARCHAR (255)
    pix_key = models.CharField(max_length=255, null=True)  # Campo `pix_key` do tipo VARCHAR (255)
    amount = models.DecimalField(max_digits=12, decimal_places=2)  # Campo `amount` do tipo DECIMAL com precisão 12,2
    txid = models.CharField(max_length=255, null=True, blank=True)  # Campo `txid` do tipo VARCHAR (255), pode ser nulo
    status = models.CharField(max_length=9, choices=[  # Campo `status` do tipo ENUM
        ('PENDING', 'Pendente'),
        ('COMPLETED', 'Concluído'),
        ('EXPIRED', 'Expirado'),
        ('CANCELLED', 'Cancelado'),
    ])  
    created_at = models.DateTimeField(auto_now_add=True)  # Campo `created_at` do tipo TIMESTAMP (data de criação)
    updated_at = models.DateTimeField(auto_now=True)  # Campo `updated_at` do tipo TIMESTAMP (data de atualização)
    data_expiracao = models.DateTimeField(null=True, blank=True)  # Campo `data_expiracao` do tipo DATETIME
    data_tx = models.DateTimeField(null=True, blank=True)  # Campo `data_tx` do tipo DATETIME (data da transação)
    cpf = models.CharField(max_length=20, null=True, blank=True)  # Campo `cpf` do tipo VARCHAR (11), pode ser nulo
    nome_pagador = models.CharField(max_length=255, null=True, blank=True)  # Campo `nome_pagador` do tipo VARCHAR (255), pode ser nulo
    empresa = models.IntegerField()  # Campo `empresa` do tipo INT
    boomerangue = models.IntegerField(null=True)
    campanha = models.ImageField(null=True)

    class Meta:
        db_table = 'pix_requests'
        app_label = 'pix_database'
        # A opção 'db_table' garante que o Django use o nome da tabela existente

    def save(self, *args, **kwargs):
    # Verifique para qual banco o registro está sendo salvo
        using = kwargs.pop('using', 'pix_db')
        print(f"Saving PixEvent to database: {using}")  # Isso ajudará a verificar qual banco de dados está sendo usado
        super(PixRequest, self).save(using=using, *args, **kwargs)
    

class PixEvent(models.Model):
    id = models.CharField(max_length=36, primary_key=True, default=uuid.uuid4, editable=False, unique=True)  # Campo `id` do tipo CHAR com 36 caracteres
    request = models.CharField(null=True, max_length=100)  # Relaciona com PixRequest
    event_type = models.CharField(max_length=255)  # Campo `event_type` do tipo VARCHAR (255)
    event_description = models.TextField()  # Campo `event_description` do tipo TEXT
    event_timestamp = models.DateTimeField(auto_now_add=True)  # Campo `event_timestamp` do tipo TIMESTAMP
    # teste = models.CharField(max_length=1, default='teste', null=True)

    class Meta:
        db_table = 'pix_events'  # Define o nome da tabela no banco de dados
        app_label = 'pix_database'

    
    def save(self, *args, **kwargs):
        # Verifique para qual banco o registro está sendo salvo
        using = kwargs.pop('using', 'pix_db')
        print(f"Saving PixEvent to database: {using}")  # Isso ajudará a verificar qual banco de dados está sendo usado
        super(PixEvent, self).save(using=using, *args, **kwargs)
