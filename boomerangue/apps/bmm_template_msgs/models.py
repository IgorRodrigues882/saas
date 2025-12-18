from django.db import models
from boomerangue.apps.campaign.models import bmm_template
from boomerangue.apps.wpp_templates.models import wpp_templates

class bmm_template_msgs(models.Model):
    id = models.AutoField(primary_key=True)
    template = models.ForeignKey(bmm_template, on_delete=models.CASCADE)
    wpptemplate = models.ForeignKey(wpp_templates, on_delete=models.CASCADE) # 
    usotemplate = models.CharField(max_length=5, choices=[ #
        ('OPTIN', 'Optin'),  # (actual value, human-readable name)
        ('ENVIO', 'Envio'),  # (actual value, human-readable name)
        ('REP1', 'Repique 1'),  # (actual value, human-readable name)
        ('REP2', 'Repique 2'),
        ('CRABN','Carrinho Abandonado'),
        ('CPRCB','Compra Recebida')
    ]) #(Uso_Template. Valores possíveis: 'OPTIN', 'ENVIO')
    cadastro_dt = models.DateTimeField(auto_now_add=True)
    alteracao_dt = models.DateTimeField(null=True)
    exclusao_dt = models.DateTimeField(null=True)
    statusregistro_id = models.IntegerField(default = 200)

    class Meta:
        db_table = 'bmm_template_msgs'
    


