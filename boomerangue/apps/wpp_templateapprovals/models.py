from django.db import models
from boomerangue.apps.wpp_templates.models import wpp_templates

class wpp_templateapprovals(models.Model):
    id = models.BigAutoField(primary_key=True)
    template_id = models.ForeignKey(wpp_templates, on_delete=models.CASCADE, null=True)
    aprovado_por = models.CharField(max_length=255, null=True)
    status_aprovacao = models.CharField(max_length=10, choices=[
        ('Pendente', 'Pendente'),
        ('Aprovado', 'Aprovado'),
        ('Rejeitado', 'Rejeitado'),
    ], default='Pendente')
    data_aprovacao = models.DateTimeField(null=True)
    comentarios_aprovacao = models.TextField(blank=True, null=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)
    cadastro_dt = models.DateTimeField(auto_now_add=True)
    alteracao_dt = models.DateTimeField(auto_now=True)
    exclusao_dt = models.DateTimeField(blank=True, null=True)
    statusregistro_id = models.IntegerField(default=200)

    class Meta:
        db_table = 'wpp_templateapprovals'
