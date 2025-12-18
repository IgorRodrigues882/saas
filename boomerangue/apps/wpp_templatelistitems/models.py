from django.db import models
from boomerangue.apps.wpp_templatescomponents.models import wpp_templatescomponents

class wpp_templatelistitems(models.Model): 
    id = models.BigAutoField(primary_key=True)
    component_id = models.ForeignKey(wpp_templatescomponents, on_delete=models.CASCADE, null=True)
    item_title = models.CharField(max_length=255)
    item_description = models.TextField(blank=True, null=True)
    button_id = models.IntegerField(blank=True, null=True)
    cadastro_dt = models.DateTimeField(auto_now_add=True)
    alteracao_dt = models.DateTimeField(auto_now=True)
    exclusao_dt = models.DateTimeField(blank=True, null=True)
    statusregistro_id = models.IntegerField(default=200)

    class Meta:
        db_table = 'wpp_templatelistitems'

    def __str__(self):
        return f'Item de Lista {self.id}'
