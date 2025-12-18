from django_celery_beat.models import PeriodicTask, IntervalSchedule
import json
from django.core.management.base import BaseCommand

class Command(BaseCommand):

    def handle(self, *args, **kwargs):
        self.cria_task_beat()

    def cria_task_beat(self):
        # Verifica se já existe o intervalo de 1 minuto, senão cria
        schedule, created = IntervalSchedule.objects.get_or_create(
            every=1,
            period=IntervalSchedule.MINUTES,
        )

        # Cria a task no Celery Beat
        task, created = PeriodicTask.objects.get_or_create(
            interval=schedule,  # Associa o intervalo criado
            name='Minha Task Agendada',  # Nome único para a task
            task='api.campaign.views.encerra_campanhas_expiradas',  # Caminho para a task
            defaults={'args': json.dumps([])},  # Argumentos (se necessário)
        )

        if created:
            print("Task agendada com sucesso!")
        else:
            print("Task já existe.")

    # Chame a função em algum ponto do seu código