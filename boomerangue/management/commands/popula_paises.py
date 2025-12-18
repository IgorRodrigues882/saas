from django.core.management.base import BaseCommand
from boomerangue.apps.ger_dadosgerais.models import ger_pais
import pycountry

class Command(BaseCommand):
    help = 'Popula a tabela de países com todos os países do mundo'

    def handle(self, *args, **kwargs):
        print("ola")
        for pais in pycountry.countries:

            ger_pais.objects.create(
                Pais=pais.name,
                SiglaPais=pais.alpha_2,
            )
            self.stdout.write(self.style.SUCCESS(f'País {pais.name} criado com sucesso'))
