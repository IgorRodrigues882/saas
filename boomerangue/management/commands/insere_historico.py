from concurrent.futures import ThreadPoolExecutor
import csv
from decimal import Decimal, InvalidOperation
from pathlib import Path
from django.core.management.base import BaseCommand
from django.db import transaction
from boomerangue.apps.ger_entidades.models import ger_entidade
from boomerangue.apps.ger_produtos.models import ger_produtos
from boomerangue.apps.historico_vendas.models import bmm_historico
from boomerangue.apps.ger_empresas.models import ger_condicoespagamento
from collections import defaultdict
from datetime import datetime

class Command(BaseCommand):
    help = 'Importa dados de um CSV para a tabela bmm_historico'
    
    def __init__(self):
        super().__init__()
        # Cache para entidades e produtos
        self.produto_cache = {}
        self.entidade_cache = {}
        self.condicao_cache = defaultdict(dict)
        self.BATCH_SIZE = 5000

    def pre_cache_data(self):
        """Pré-carrega dados frequentemente acessados"""
        self.stdout.write("Pré-carregando dados...")
        
        # Carrega todos os produtos
        for produto in ger_produtos.objects.all():
            self.produto_cache[produto.edi_integracao] = produto
            
        # Carrega todas as entidades
        for entidade in ger_entidade.objects.all():
            self.entidade_cache[entidade.EDI_Integracao] = entidade
            
        # Carrega condições de pagamento
        for condicao in ger_condicoespagamento.objects.filter(statusregistro_id=200):
            self.condicao_cache[condicao.empresa_id] = condicao

    def process_chunk(self, chunk):
        """Processa um conjunto de linhas do CSV"""
        instances_to_create = []
        success = 0
        failed = 0
        
        for row in chunk:
            try:
                integracao = row['Cod. Cliente']
                cod_material = row['Cod. Material']
                
                # Usa cache para entidades e produtos
                cliente = self.entidade_cache.get(integracao)
                if not cliente:
                    raise Exception(f"Cliente não encontrado: {integracao}")
                    
                produto = self.produto_cache.get(cod_material)
                if not produto:
                    raise Exception(f"Produto não encontrado: {cod_material}")
                
                condicao = self.condicao_cache.get(cliente.empresa_id)
                
                total_produtos = Decimal(row['Quantidade Venda'])
                total_pedido = Decimal(row['Valor Venda'].replace(',', '.'))
                
                # Verifica e converte a data de venda
                if row['Data Venda'].strip():
                    data_venda = datetime.strptime(row['Data Venda'], "%d/%m/%Y").strftime("%Y-%m-%d")
                else:
                    data_venda = None
                
                # Verifica se a entrada já existe no banco de dados
                registro_existente = bmm_historico.objects.filter(
                    entidade=cliente,
                    produto=produto,
                    dt_emissao=data_venda,
                    total_produtos=total_produtos,
                    total_pedido=total_pedido
                ).exists()
                
                if registro_existente:
                    self.stdout.write(f"Registro duplicado ignorado: {row}")
                    continue
                
                # Cria uma nova entrada
                instances_to_create.append(
                    bmm_historico(
                        empresa=cliente.empresa,
                        entidade=cliente,
                        total_produtos=total_produtos,
                        total_pedido=total_pedido,
                        total_nota=total_pedido,
                        dt_emissao=data_venda,
                        dt_saida=data_venda,
                        edi_condpgto='-',
                        cond_pgto='-',
                        canal_vendas=row['Canal Distribuição'],
                        Representante=row['Representante'],
                        produto=produto,
                        nronotas=1,
                        total_desconto=0,
                        tipo_historico='VENDA',
                        nfe='Null',
                        pedido=cliente.id,
                        tipovenda='venda',
                        autonumerador=1,
                        condicoespagamento=condicao
                    )
                )
                success += 1
            except Exception as e:
                failed += 1
                self.stdout.write(self.style.ERROR(f"Erro: {str(e)} - Linha: {row}"))
        
        return instances_to_create, success, failed


    def handle(self, *args, **kwargs):
        self.pre_cache_data()
        csv_file = Path("media/media/arq_campanhas/4. Tabela de Histórico de Compras.csv")
        
        total_linhas = sum(1 for _ in open(csv_file, encoding="utf-8-sig"))
        self.stdout.write(f"Total de linhas a processar: {total_linhas}")
        
        linhas_sucesso = 0
        linhas_falha = 0
        
        with open(csv_file, 'r', encoding="utf-8-sig") as file:
            reader = csv.DictReader(file, delimiter=';')
            current_chunk = []
            
            for row in reader:
                current_chunk.append(row)
                
                if len(current_chunk) >= self.BATCH_SIZE:
                    with transaction.atomic():
                        to_create, to_update, success, failed = self.process_chunk(current_chunk)
                        
                        if to_create:
                            bmm_historico.objects.bulk_create(to_create)
                        if to_update:
                            bmm_historico.objects.bulk_update(to_update, fields=[
                                'total_produtos', 'total_pedido', 'total_nota', 'dt_emissao', 
                                'dt_saida', 'canal_vendas', 'Representante', 'condicoespagamento'
                            ])
                        
                        linhas_sucesso += success
                        linhas_falha += failed
                        
                    self.stdout.write(f"Processadas {linhas_sucesso + linhas_falha} de {total_linhas} linhas")
                    current_chunk = []
            
            # Processa o último chunk se houver
            if current_chunk:
                with transaction.atomic():
                    to_create, to_update, success, failed = self.process_chunk(current_chunk)
                    if to_create:
                        bmm_historico.objects.bulk_create(to_create)
                    if to_update:
                        bmm_historico.objects.bulk_update(to_update, fields=[
                            'total_produtos', 'total_pedido', 'total_nota', 'dt_emissao', 
                            'dt_saida', 'canal_vendas', 'Representante', 'condicoespagamento'
                        ])
                    linhas_sucesso += success
                    linhas_falha += failed

        self.stdout.write(self.style.SUCCESS(
            f'Importação finalizada. {linhas_sucesso} sucesso(s), {linhas_falha} falha(s), '
            f'total: {linhas_sucesso + linhas_falha} linhas processadas.'
        ))