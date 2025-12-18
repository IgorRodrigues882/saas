from django.core.management.base import BaseCommand
from boomerangue.apps.ger_dadosgerais.models import ger_pais, ger_regiao

class Command(BaseCommand):
    help = 'Cadastra no banco de dados as regiões do Brasil'

    def handle(self, *args, **kwargs):
        # Suponha que você tenha uma lista de regiões do Brasil
        regioes_brasil = [
            {'Regiao': 'Região Norte', 'RegiaoReduzida': 'Norte'},
            {'Regiao': 'Região Nordeste', 'RegiaoReduzida': 'Nordeste'},
            {'Regiao': 'Região Centro-Oeste', 'RegiaoReduzida': 'Centro-Oeste'},
            {'Regiao': 'Região Sudeste', 'RegiaoReduzida': 'Sudeste'},
            {'Regiao': 'Região Sul', 'RegiaoReduzida': 'Sul'},
        ]

        # Verifique se o país Brasil já existe no banco de dados ou crie-o
        brasil, created = ger_pais.objects.get_or_create(
            SiglaPais='BR',
            defaults={
                'Pais': 'Brazil',
            }
        )

        # Cadastra as regiões do Brasil no banco de dados e associa ao Brasil
        for regiao_data in regioes_brasil:
            regiao, created = ger_regiao.objects.get_or_create(
                Regiao=regiao_data['Regiao'],
                pais_id=brasil,
                defaults={'RegiaoReduzida': regiao_data['RegiaoReduzida']}
            )

        self.stdout.write(self.style.SUCCESS('Regiões do Brasil cadastradas com sucesso'))
