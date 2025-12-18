from django.apps import AppConfig


class BoomerangueConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'boomerangue'

    def ready(self):
        from . import tasks  # Importa as tasks
        from django.db.utils import OperationalError
        try:
            tasks.cria_task_beat()
        except OperationalError:
            # Evita erro se o banco não estiver disponível durante a migração
            print("Banco de dados não disponível ainda.")