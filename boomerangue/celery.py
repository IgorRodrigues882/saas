# celery.py
from __future__ import absolute_import, unicode_literals
import os
from celery import Celery
from django.conf import settings

# Defina o módulo de configurações Django padrão para o programa 'celery'.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'boomerangue.settings')

app = Celery('boomerangue')   # Substitua 'your_project' pelo nome do seu projeto.

# Configure o Celery usando as configurações do settings.py do Django.
app.config_from_object('django.conf:settings', namespace='CELERY')


# Carregue as tarefas de todas as configurações de aplicativos Django registrados.
app.autodiscover_tasks()
