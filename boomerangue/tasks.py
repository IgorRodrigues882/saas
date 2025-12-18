from django_celery_beat.models import PeriodicTask, IntervalSchedule
import json

def cria_task_beat():
    print("Entrou task_beat")
    # Verifica se já existe o intervalo de 1 minuto, senão cria
    schedule, created = IntervalSchedule.objects.get_or_create(
        every=1,
        period=IntervalSchedule.MINUTES,
    )

    # Cria a task no Celery Beat
    task, created = PeriodicTask.objects.get_or_create(
        interval=schedule,  # Associa o intervalo criado
        name='encerra_campanhas_expiradas',  # Nome único para a task
        task='boomerangue.api.campaign.task.encerra_campanhas_expiradas',  # Caminho para a task
        defaults={'args': json.dumps([])},  # Argumentos (se necessário)
    )

    if created:
        print("Task agendada com sucesso!")
    else:
        print("Task já existe.")

# Chame a função em algum ponto do seu código

cria_task_beat()