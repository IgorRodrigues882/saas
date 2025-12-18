from django.core.management.base import BaseCommand
from boomerangue.apps.ger_entidades.models import rvd_entidade_recommendation

class Command(BaseCommand):
    help='limpa tabela de cidades'
    def handle(self, *args, **kwargs):
        rvd_entidade_recommendation.objects.all().delete()