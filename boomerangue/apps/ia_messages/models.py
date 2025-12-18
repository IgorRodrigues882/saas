from django.db import models
from login.models import Usuario
from boomerangue.apps.ger_empresas.models import ger_empresas


class CanalMessageIA(models.Model):
    id = models.AutoField(primary_key=True)
    empresa = models.ForeignKey(ger_empresas, on_delete=models.PROTECT)
    user = models.ForeignKey(Usuario, on_delete=models.PROTECT, null=True)
    cadastro_dt = models.DateTimeField(auto_now_add=True, null=True)

    class Meta:
        db_table = 'CanalMessageIA'

class ChatMessageIA(models.Model):
    sender = models.CharField(max_length=10, choices=[("user", "User"), ("bot", "Bot")])
    user = models.ForeignKey(Usuario, on_delete=models.PROTECT)
    message = models.TextField(db_collation='utf8mb4_unicode_ci')
    timestamp = models.DateTimeField(auto_now_add=True)
    canal = models.ForeignKey(CanalMessageIA, on_delete=models.PROTECT, null=True)
    tokens = models.IntegerField(null=True)

    class Meta:
        db_table = 'ChatMessageIA'
    
