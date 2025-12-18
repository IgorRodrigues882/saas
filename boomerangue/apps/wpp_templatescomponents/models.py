from django.db import models
from boomerangue.apps.wpp_templates.models import wpp_templates

class wpp_templatescomponents(models.Model):
    id = models.BigAutoField(primary_key=True)
    template = models.ForeignKey(wpp_templates, on_delete=models.CASCADE, null=True)
    component_type = models.CharField(max_length=20, choices=[ #
        ('HEADER', 'HEADER'),
        ('BODY', 'BODY'),
        ('FOOTER', 'FOOTER'),
        ('BUTTONS', 'BUTTONS'),
        ('LIST', 'LIST'),
    ])
    format = models.CharField(max_length=20, choices=[ #
        ('TEXT', 'TEXT'),
        ('IMAGE', 'IMAGE'),
        ('DOCUMENT', 'DOCUMENT'),
        ('VIDEO', 'VIDEO'),
        ('LOCATION', 'LOCATION'),
    ])
    text_content = models.TextField(blank=True, null=True, db_collation='utf8mb4_unicode_ci') #
    image_content = models.ImageField(max_length=400, null=True, upload_to='media/whatsappImages/')
    url_formatada = models.CharField(max_length=1000, null=True)
    possui_qrcode_pix = models.CharField(max_length=1, default='N')
    cadastro_dt = models.DateTimeField(auto_now_add=True)
    alteracao_dt = models.DateTimeField(auto_now=True)
    exclusao_dt = models.DateTimeField(blank=True, null=True)
    statusregistro_id = models.IntegerField(default=200)

    class Meta:
        db_table = 'wpp_templatescomponents'

    def __str__(self):
        return f'Componente {self.id}'


class termos_sendpulse_troca(models.Model):
    id = models.BigAutoField(primary_key=True)
    component = models.ForeignKey(wpp_templatescomponents, on_delete=models.CASCADE, null=True)
    termo_sendpulse = models.CharField(max_length=30, null=True)
    termo_troca = models.CharField(max_length=30, null=True)

    class Meta:
        db_table = 'termos_sendpulse_troca'
    

class fluxo_sendpulse(models.Model):
    id = models.BigAutoField(primary_key=True)
    component = models.ForeignKey(wpp_templatescomponents, on_delete=models.CASCADE, null=True)
    fluxo_id = models.CharField(max_length=500, null=True)

    class Meta:
        db_table = 'fluxo_sendpulse'





    