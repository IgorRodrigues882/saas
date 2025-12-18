from celery import shared_task
from datetime import datetime, timezone
from django.db.models import Q
from boomerangue.apps.campaign.models import bmm_campanha

@shared_task(name='encerra_campanhas_expiradas')
def encerra_campanhas_expiradas():
    # Obtém a data e hora atuais em UTC
    print("Executando")
    agora = datetime.now(timezone.utc)

        # Filtra campanhas com data e hora final já passadas
    campanhas_expiradas = bmm_campanha.objects.filter(
            Q(data_fim__lt=agora.date()) | 
            (Q(data_fim=agora.date()) & Q(horario_fim__lt=agora.time())),
            status_campanha='EA'  # Apenas campanhas ativas
    )

        # Atualiza o status para 'Encerrado'
    campanhas_expiradas.update(status_campanha='EC', CampanhaAtiva = 'N')

        # Log opcional
    print(f"{campanhas_expiradas.count()} campanhas encerradas.")


encerra_campanhas_expiradas.delay()