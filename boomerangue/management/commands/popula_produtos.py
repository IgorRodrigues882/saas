import csv
from pathlib import Path
from io import TextIOWrapper
from django.core.management.base import BaseCommand
from decimal import Decimal
from boomerangue.apps.ger_produtos.models import ger_produtos
from boomerangue.apps.ger_linhaprodutos.models import ger_linhaprodutos
from boomerangue.apps.ger_empresas.models import ger_empresas
from boomerangue.apps.ger_categorias.models import ger_categorias
from django.db import transaction

class Command(BaseCommand):
    help = 'Popula a tabela GerProdutos com dados do CSV'

    @transaction.atomic
    def handle(self, *args, **kwargs):
        csv_path = Path("media/media/arq_campanhas/3. Tabela de Produtos.csv")

        with open(csv_path, mode="rb") as csvfile:
            wrapper = TextIOWrapper(csvfile, encoding="utf-8-sig")
            reader = csv.DictReader(wrapper, delimiter=';')
            empresa = ger_empresas.objects.get(id=53)

            linhas_existentes = {linha.LinhaProdutos: linha for linha in ger_linhaprodutos.objects.filter(empresa=empresa)}
            produtos_existentes = {p.edi_integracao: p for p in ger_produtos.objects.filter(empresa=empresa)}
            categorias_existentes = {cat.Categoria: cat for cat in ger_categorias.objects.all()}
            categoria_nome = 'bigsix'
            if categoria_nome not in categorias_existentes:
                        nova_categoria = ger_categorias.objects.create(
                            Categoria=categoria_nome,
                            empresa=empresa,
                            TipoCategoria='N'
                        )
            else:
                nova_categoria = ger_categorias.objects.get(
                            Categoria=categoria_nome,
                            empresa=empresa
                        )

            linhas_to_create = []
            produtos_to_create = []
            produtos_to_update = []

            for row in reader:
                try:
                    cod_material = row.get("Cod. Material")
                    descricao_material = row.get("Descrição Material")
                    grupo_mercadoria = row.get("Grupo Mercadoria Externo")
                    saldo = row.get("Saldo")
                    ean = row.get('Código EAN/UPC')
                    qtd_caixa = row.get('Quantidade Na Caixa')
                    padrao_bg = row.get('Pertence ao Big Six')

                    try:
                        qtd_caixa = float(qtd_caixa) if qtd_caixa else 1
                    except ValueError:
                        self.stderr.write(f"Quantidade inválida na caixa para o material {cod_material}: {qtd_caixa}")
                        qtd_caixa = 1

                    try:
                        saldo = Decimal(saldo)
                    except ValueError:
                        self.stderr.write(f"Saldo inválido para o material {cod_material}: {saldo}")
                        continue

                    if grupo_mercadoria not in linhas_existentes:
                        nova_linha = ger_linhaprodutos(
                            LinhaProdutos=grupo_mercadoria,
                            empresa=empresa
                        )
                        linhas_existentes[grupo_mercadoria] = nova_linha
                        linhas_to_create.append(nova_linha)

                    linha = linhas_existentes[grupo_mercadoria]


                    if cod_material in produtos_existentes:
                        produto = produtos_existentes[cod_material]
                        produto.Descricao = descricao_material
                        produto.Descricao_Detalhada = descricao_material
                        produto.Descricao_Curta = descricao_material
                        produto.Descricao_Amigavel = descricao_material
                        produto.Descricao_Limpa = descricao_material
                        produto.Codigo = cod_material
                        produto.LinhaProduto = linha
                        produto.saldo = saldo
                        produto.EAN = ean
                        produto.Categoria2 = nova_categoria
                        produto.Destaque = "S" if padrao_bg.lower() == 'sim' else 'N'
                        produto.QuantidadePorCaixa = qtd_caixa
                        produtos_to_update.append(produto)
                    else:
                        novo_produto = ger_produtos(
                            empresa=empresa,
                            edi_integracao=cod_material,
                            Descricao=descricao_material,
                            Descricao_Detalhada=descricao_material,
                            Descricao_Curta=descricao_material,
                            Descricao_Amigavel=descricao_material,
                            Descricao_Limpa=descricao_material,
                            Codigo=cod_material,
                            LinhaProduto=linha,
                            saldo=saldo,
                            EAN=ean,
                            Categoria2=nova_categoria,
                            Destaque="S" if padrao_bg.lower() == 'sim' else 'N',
                            QuantidadePorCaixa=qtd_caixa
                        )
                        produtos_to_create.append(novo_produto)

                except Exception as e:
                    self.stderr.write(f"Erro ao processar o material {cod_material}: {str(e)}")

            if linhas_to_create:
                ger_linhaprodutos.objects.bulk_create(linhas_to_create, ignore_conflicts=True)
                self.stdout.write(f"{len(linhas_to_create)} novas linhas de produtos criadas.")

            if produtos_to_create:
                ger_produtos.objects.bulk_create(produtos_to_create, ignore_conflicts=True)
                self.stdout.write(f"{len(produtos_to_create)} novos produtos criados.")

            if produtos_to_update:
                ger_produtos.objects.bulk_update(
                    produtos_to_update,
                    ["Descricao", "Descricao_Detalhada", "Descricao_Curta", "Descricao_Amigavel", "Descricao_Limpa", "Codigo", "LinhaProduto", "saldo", "EAN", "Categoria2", "Destaque", "QuantidadePorCaixa"]
                )
                self.stdout.write(f"{len(produtos_to_update)} produtos atualizados.")
