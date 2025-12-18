from django.db import models
from boomerangue.apps.wpp_templatescomponents.models import wpp_templatescomponents

class wpp_templatebuttons(models.Model):
    id = models.BigAutoField(primary_key=True)
    component_id = models.ForeignKey(wpp_templatescomponents, on_delete=models.CASCADE, null=True)
    button_type = models.CharField(max_length=20, choices=[
        ('QUICK_REPLY', 'QUICK_REPLY'),
        ('CALL_TO_ACTION', 'CALL_TO_ACTION'),
    ])
    button_text = models.CharField(max_length=255)
    cadastro_dt = models.DateTimeField(auto_now_add=True)
    alteracao_dt = models.DateTimeField(auto_now=True)
    exclusao_dt = models.DateTimeField(blank=True, null=True)
    statusregistro_id = models.IntegerField(default=200)

    class Meta:
        db_table = 'wpp_templatebuttons'
