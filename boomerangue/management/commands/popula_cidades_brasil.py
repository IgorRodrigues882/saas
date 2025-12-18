from django.core.management.base import BaseCommand
from boomerangue.apps.ger_dadosgerais.models import ger_pais, ger_uf, ger_mesoregiao, ger_cidade
import requests

class Command(BaseCommand):
    help = 'Popula a tabela de cidades'

    def handle(self, *args, **kwargs):

        # Lista de estados a serem populados
        pais = ger_pais.objects.get(SiglaPais='BR')
        estados = ger_uf.objects.all().values('sigla')
        for estado_sigla in estados:
            sigla = estado_sigla['sigla']
            cidades_estado = requests.get(f'https://servicodados.ibge.gov.br/api/v1/localidades/estados/{sigla}/municipios')
            print(cidades_estado)
            for cidade_data in cidades_estado.json():
                cidade_nome = cidade_data['nome']
                print(cidade_nome)
                cod_ibge = cidade_data['id']

                try:
                    # Encontra o estado correspondente no banco de dados
                    estado = ger_uf.objects.get(sigla=sigla)
                    # Obtém ou cria a instância do modelo ger_mesoregiao
                    mesoregiao, created = ger_mesoregiao.objects.get_or_create(
                        uf_id=estado,
                        MesoRegiao=cidade_data['microrregiao']['mesorregiao']['nome']
                    )

                    # Cadastra a cidade associada ao estado, mesorregião e país (Brasil, por exemplo)
                    ger_cidade.objects.create(
                        pais_id=pais,
                        uf_id=estado,
                        MesoRegiao_id=mesoregiao,
                        Cidade=cidade_nome,
                        CodIBGE=cod_ibge,
                    )

                    self.stdout.write(self.style.SUCCESS(f'Cidade {cidade_nome} cadastrada com sucesso em {estado_sigla}'))

                except Exception as e:
                    print(e)
                    self.stderr.write(self.style.ERROR(f'Erro ao cadastrar cidade {cidade_nome} em {estado_sigla}: {str(e)}'))

        self.stdout.write(self.style.SUCCESS('Cidades cadastradas com sucesso'))
