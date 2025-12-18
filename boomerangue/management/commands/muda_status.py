from django.core.management.base import BaseCommand
from boomerangue.apps.campaign.models import bmm_boomerangue

class Command(BaseCommand):
    help = 'atualiza status vbalidação'

    def handle(self, *args, **options):
        bomerangues = bmm_boomerangue.objects.filter(campanha = 47, empresa = 47)
        for boomerangue in bomerangues:
            boomerangue.entidade.status_validacao = 'validado'
            boomerangue.entidade.save()