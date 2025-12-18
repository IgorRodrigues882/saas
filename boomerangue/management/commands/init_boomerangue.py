from django.core.management.base import BaseCommand
from .popula_paises import Command
from django.core.management import call_command


class Command(BaseCommand):
    def handle(self, *args, **kwargs):
        # ...
        call_command('popula_paises')

        call_command('popula_regioes_brasil')

        call_command('popula_estados_brasil')

        call_command('popula_cidades_brasil')

        call_command('popula_permissoes')

        call_command('popula_tipos_empresas')
        # ...


