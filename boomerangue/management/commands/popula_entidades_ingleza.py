import re
import csv
from pathlib import Path
import time
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry
from io import TextIOWrapper
from django.core.management.base import BaseCommand
from boomerangue.apps.ger_entidades.models import ger_entidade
from boomerangue.apps.ger_empresas.models import ger_empresas
from boomerangue.apps.ger_dadosgerais.models import ger_pais, ger_uf, ger_cidade, ger_dados_cep
import requests
from django.db import transaction

class Command(BaseCommand):
    help = 'Popula a tabela ger_entidade com dados da ingleza'

    @transaction.atomic
    def handle(self, *args, **kwargs):
        try:
            csv_path = Path("media/media/arq_campanhas/1. Tabela de Clientes.csv")
            self.stdout.write(self.style.SUCCESS(f"Iniciando processamento do arquivo: {csv_path}"))

            with open(csv_path, mode="rb") as csvfile:
                wrapper = TextIOWrapper(csvfile, encoding="utf-8-sig")
                reader = csv.DictReader(wrapper, delimiter=';')

                empresa = ger_empresas.objects.get(id=53)
                entidades_to_create = []
                entidades_to_update = []
                ceps_processados = 0
                ceps_com_erro = 0

                # Pré-carregar entidades e CEPs existentes
                self.stdout.write("Carregando dados existentes...")
                existing_entidades = {
                    e.EDI_Integracao: e for e in ger_entidade.objects.filter(empresa=empresa)
                }
                existing_ceps = {
                    cep.cep: cep for cep in ger_dados_cep.objects.all()
                }
                self.stdout.write(f"Encontradas {len(existing_entidades)} entidades e {len(existing_ceps)} CEPs existentes")

                for row in reader:
                    try:
                        cod_cliente = row.get("Cod.Cliente")
                        nome_cliente = row.get("Nome Cliente")
                        nome_cliente_abreviado = row.get("Nome Cliente Abreviado")
                        cnpj = row.get("Cliente - CNPJ")
                        cep = re.sub(r'\D', '', row.get("Cliente - Cep", ""))

                        # Processamento dos valores numéricos com tratamento de erro
                        try:
                            a_receber = float(row.get("A Receber", "0").replace(",", ".")) if row.get("A Receber") else 0
                            limite_credito = float(row.get("Limite de crédito", "0").replace(",", ".")) if row.get("Limite de crédito") else 0
                            saldo = float(row.get("Saldo", "0").replace(",", ".")) if row.get("Saldo") else 0
                        except ValueError as e:
                            self.stdout.write(self.style.WARNING(f"Erro ao converter valores numéricos para o cliente {cod_cliente}: {e}"))
                            a_receber = limite_credito = saldo = 0

                        # Processamento do CEP
                        dados_cep = existing_ceps.get(cep)
                        if not dados_cep and cep:
                            dados_cep = self.get_or_create_dados_cep(cep)
                            if dados_cep:
                                existing_ceps[cep] = dados_cep
                                ceps_processados += 1
                                self.stdout.write(f"CEP {cep} processado com sucesso")
                            else:
                                ceps_com_erro += 1
                                self.stdout.write(self.style.WARNING(f"Não foi possível processar o CEP {cep}"))

                        # Preparação dos dados de endereço
                        endereco = dados_cep.logradouro if dados_cep else None
                        bairro = dados_cep.bairro if dados_cep else None
                        uf = dados_cep.uf if dados_cep else None
                        cidade = None
                        if dados_cep and dados_cep.ibge:
                            cidade = ger_cidade.objects.filter(CodIBGE=dados_cep.ibge).first()
                        pais = ger_pais.objects.filter(SiglaPais='BR').first()

                        # Atualizar ou criar entidades
                        if cod_cliente in existing_entidades:
                            entidade = existing_entidades[cod_cliente]
                            entidade.Entidade = nome_cliente
                            entidade.Fantasia = nome_cliente_abreviado
                            entidade.CNPJNumerico = cnpj
                            entidade.CEP = cep
                            entidade.areceber = a_receber
                            entidade.Limite_de_credito = limite_credito
                            entidade.saldo = saldo
                            entidade.Endereco = endereco
                            entidade.Bairro = bairro
                            entidade.pais = pais
                            entidade.uf = uf
                            entidade.cidade = cidade
                            entidades_to_update.append(entidade)
                        else:
                            nova_entidade = ger_entidade(
                                EDI_Integracao=cod_cliente,
                                empresa=empresa,
                                Entidade=nome_cliente,
                                Fantasia=nome_cliente_abreviado,
                                CNPJNumerico=cnpj,
                                CEP=cep,
                                areceber=a_receber,
                                Limite_de_credito=limite_credito,
                                saldo=saldo,
                                Endereco=endereco,
                                Bairro=bairro,
                                pais=pais,
                                uf=uf,
                                cidade=cidade,
                            )
                            entidades_to_create.append(nova_entidade)

                    except Exception as row_error:
                        self.stdout.write(self.style.ERROR(f"Erro ao processar linha: {row_error}"))
                        continue

                # Salvar dados em lote
                try:
                    if entidades_to_create:
                        ger_entidade.objects.bulk_create(entidades_to_create, ignore_conflicts=True)
                    if entidades_to_update:
                        ger_entidade.objects.bulk_update(
                            entidades_to_update,
                            ["Entidade", "Fantasia", "CNPJNumerico", "CEP", "areceber", 
                             "Limite_de_credito", "saldo", "Endereco", "Bairro", "pais", "uf", "cidade"]
                        )
                except Exception as save_error:
                    self.stdout.write(self.style.ERROR(f"Erro ao salvar dados: {save_error}"))
                    raise

                # Relatório final
                self.stdout.write(self.style.SUCCESS(
                    f"\nRelatório de Importação:"
                    f"\n- {len(entidades_to_create)} entidades criadas"
                    f"\n- {len(entidades_to_update)} entidades atualizadas"
                    f"\n- {ceps_processados} CEPs processados com sucesso"
                    f"\n- {ceps_com_erro} CEPs com erro de processamento"
                ))

        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Erro crítico durante a execução: {e}"))
            raise


    def get_or_create_dados_cep(self, cep):
        """
        Busca ou cria um registro de CEP no banco de dados.
        Retorna None em caso de erro.
        """
        if not cep:
            return None

        try:
            # Tentar buscar o CEP existente
            dados_cep = ger_dados_cep.objects.filter(cep=cep).first()
            if dados_cep:
                return dados_cep

            # Configurar retry strategy
            retry_strategy = Retry(
                total=3,  # número total de tentativas
                backoff_factor=1,  # tempo entre tentativas (1s, 2s, 4s)
                status_forcelist=[403, 500, 502, 503, 504]  # status codes para retry
            )
            adapter = HTTPAdapter(max_retries=retry_strategy)
            
            # Criar sessão com retry
            session = requests.Session()
            session.mount("https://", adapter)
            
            # Adicionar delay para evitar sobrecarga
            time.sleep(0.5)  # espera 1 segundo entre requisições

            # Se não existe, buscar na API
            response = session.get(
                f"https://ws.hubdodesenvolvedor.com.br/v2/cep/?cep={cep}&token=165050455aqRfCBVwIl297993592",
                timeout=10
            )
            
            # Log detalhado da resposta
            self.stdout.write(f"Status code para CEP {cep}: {response.status_code}")
            if response.status_code == 403:
                self.stdout.write(self.style.WARNING(
                    f"Erro 403 para CEP {cep}. Headers: {response.headers}\n"
                    f"Conteúdo da resposta: {response.text}"
                ))
                return None
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get('status') and data.get('result'):
                    result = data['result']
                    self.stdout.write(f"Dados do CEP {cep} recebidos da API: {result}")

                    # Buscar UF relacionada
                    uf = ger_uf.objects.filter(sigla=result.get("uf")).first()
                    if not uf:
                        self.stdout.write(self.style.WARNING(f"UF não encontrada para o CEP {cep}"))

                    # Criar e salvar novo registro de CEP
                    dados_cep = ger_dados_cep(
                        cep=result.get("cep"),
                        logradouro=result.get("logradouro"),
                        complemento=result.get("complemento"),
                        bairro=result.get("bairro"),
                        localidade=result.get("localidade"),
                        uf=uf,
                        unidade=result.get("unidade"),
                        ibge=result.get("ibge"),
                        gia=result.get("gia"),
                    )
                    
                    try:
                        dados_cep.save()
                        self.stdout.write(self.style.SUCCESS(f"CEP {cep} salvo com sucesso"))
                        return dados_cep
                    except Exception as save_error:
                        self.stdout.write(self.style.ERROR(f"Erro ao salvar CEP {cep}: {save_error}"))
                        return None
                else:
                    self.stdout.write(self.style.WARNING(
                        f"Resposta da API inválida para o CEP {cep}: {data}"
                    ))
                    return None
            else:
                self.stdout.write(self.style.WARNING(
                    f"Erro na API do CEP {cep}: Status code {response.status_code}"
                ))
                return None

        except requests.RequestException as e:
            self.stdout.write(self.style.ERROR(f"Erro na requisição do CEP {cep}: {e}"))
            return None
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Erro inesperado ao processar CEP {cep}: {e}"))
            return None