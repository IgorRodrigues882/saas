import csv
from pathlib import Path
from io import TextIOWrapper
from django.core.management.base import BaseCommand
from boomerangue.apps.ger_entidades.models import ger_entidade, ger_entidade_tag

class Command(BaseCommand):
    help = 'Popula a tabela ger_entidade_tag com dados do CSV'

    def handle(self, *args, **kwargs):
        # Caminho para o arquivo CSV
        csv_path = Path("media/media/arq_campanhas/2. Tabela de Classificações de Clientes.csv")

        # Abre o arquivo CSV em modo binário e converte para texto com UTF-8
        with open(csv_path, mode="rb") as csvfile:
            wrapper = TextIOWrapper(csvfile, encoding="utf-8-sig")  # Remove o BOM
            reader = csv.DictReader(wrapper, delimiter=';')
            
            for row in reader:
                print(row)  # Verifica os dados
                cod_cliente = row.get("Cod. Cliente")  # Obtém o código do cliente (Cod. Cliente)
                print("CodCliente:", cod_cliente)  # Debug
                
                # Busca a entidade pelo código do cliente (EDI_Integracao)
                try:
                    entidade = ger_entidade.objects.get(EDI_Integracao=cod_cliente)
                    print(f"Entidade encontrada: {entidade.Entidade}")
                except ger_entidade.DoesNotExist:
                    self.stdout.write(f"Entidade não encontrada para o Cod.Cliente: {cod_cliente}")
                    continue  # Se a entidade não for encontrada, pula para o próximo registro

                # Obtém os valores das colunas do CSV
                tipo_cliente = row.get("Tipo Cliente")
                escritorio_vendas = row.get("Escritório Vendas")
                area = row.get("Escritório Área")
                
                # Cria ou atualiza o registro na tabela ger_entidade_tag
                entidade_tag, created = ger_entidade_tag.objects.update_or_create(
                    cod_entidade=cod_cliente,  # Usa Cod. Cliente como identificador
                    entidade=entidade,         # Relaciona com a entidade encontrada
                    defaults={
                        "tipo": tipo_cliente, 
                        "area": escritorio_vendas, 
                        "regiao": area
                    }
                )

                # Exibe mensagem de feedback
                if created:
                    self.stdout.write(f"Nova tag criada para a entidade {entidade.Entidade} - Cod. Cliente: {cod_cliente}")
                else:
                    self.stdout.write(f"Tag atualizada para a entidade {entidade.Entidade} - Cod. Cliente: {cod_cliente}")
