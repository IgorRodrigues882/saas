from django.core.management.base import BaseCommand
from boomerangue.apps.ger_dadosgerais.models import ger_pais, ger_uf

class Command(BaseCommand):
    help = 'Popula a tabela de UF (estados) do Brasil com regiões'

    def handle(self, *args, **kwargs):
        # Suponha que você tenha uma lista de estados do Brasil com siglas e regiões
        estados_brasil = [
            {'uf': 'Acre', 'sigla': 'AC', 'regiao': 'Região Norte'},
            {'uf': 'Alagoas', 'sigla': 'AL', 'regiao': 'Região Nordeste'},
            {'uf': 'Amapá', 'sigla': 'AP', 'regiao': 'Região Norte'},
            {'uf': 'Amazonas', 'sigla': 'AM', 'regiao': 'Região Norte'},
            {'uf': 'Bahia', 'sigla': 'BA', 'regiao': 'Região Nordeste'},
            {'uf': 'Ceará', 'sigla': 'CE', 'regiao': 'Região Nordeste'},
            {'uf': 'Distrito Federal', 'sigla': 'DF', 'regiao': 'Região Centro-Oeste'},
            {'uf': 'Espírito Santo', 'sigla': 'ES', 'regiao': 'Região Sudeste'},
            {'uf': 'Goiás', 'sigla': 'GO', 'regiao': 'Região Centro-Oeste'},
            {'uf': 'Maranhão', 'sigla': 'MA', 'regiao': 'Região Nordeste'},
            {'uf': 'Mato Grosso', 'sigla': 'MT', 'regiao': 'Região Centro-Oeste'},
            {'uf': 'Mato Grosso do Sul', 'sigla': 'MS', 'regiao': 'Região Centro-Oeste'},
            {'uf': 'Minas Gerais', 'sigla': 'MG', 'regiao': 'Região Sudeste'},
            {'uf': 'Pará', 'sigla': 'PA', 'regiao': 'Região Norte'},
            {'uf': 'Paraíba', 'sigla': 'PB', 'regiao': 'Região Nordeste'},
            {'uf': 'Paraná', 'sigla': 'PR', 'regiao': 'Região Sul'},
            {'uf': 'Pernambuco', 'sigla': 'PE', 'regiao': 'Região Nordeste'},
            {'uf': 'Piauí', 'sigla': 'PI', 'regiao': 'Região Nordeste'},
            {'uf': 'Rio de Janeiro', 'sigla': 'RJ', 'regiao': 'Região Sudeste'},
            {'uf': 'Rio Grande do Norte', 'sigla': 'RN', 'regiao': 'Região Nordeste'},
            {'uf': 'Rio Grande do Sul', 'sigla': 'RS', 'regiao': 'Região Sul'},
            {'uf': 'Rondônia', 'sigla': 'RO', 'regiao': 'Região Norte'},
            {'uf': 'Roraima', 'sigla': 'RR', 'regiao': 'Região Norte'},
            {'uf': 'Santa Catarina', 'sigla': 'SC', 'regiao': 'Região Sul'},
            {'uf': 'São Paulo', 'sigla': 'SP', 'regiao': 'Região Sudeste'},
            {'uf': 'Sergipe', 'sigla': 'SE', 'regiao': 'Região Nordeste'},
            {'uf': 'Tocantins', 'sigla': 'TO', 'regiao': 'Região Norte'},
        ]

        # Verifique se o país Brasil já existe no banco de dados ou crie-o
        brasil, created = ger_pais.objects.get_or_create(
            SiglaPais='BR',
            defaults={
                'Pais': 'Brazil',}
        )

        # Cadastra os estados do Brasil no banco de dados e associa ao país e à região correta
        for estado_data in estados_brasil:
            regiao_nome = estado_data['regiao']
            
            # Verifica se a região já existe no banco de dados ou cria-a
            regiao, created = ger_regiao.objects.get_or_create(Regiao=regiao_nome)

            # Cadastra o estado e associa ao país e à região
            estado, created = ger_uf.objects.get_or_create(
                uf=estado_data['uf'],
                sigla=estado_data['sigla'],
                pais_id=brasil,
                regiao_id=regiao,
            )

        self.stdout.write(self.style.SUCCESS('Estados do Brasil cadastrados com sucesso'))
