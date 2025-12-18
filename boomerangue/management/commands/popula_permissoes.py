from django.core.management.base import BaseCommand
from boomerangue.apps.ger_empresas.models import permissoes_paginas
from boomerangue.apps.ger_dadosgerais.models import ger_dados_cep 

class Command(BaseCommand):
    help = 'Popula a tabela de permissões'
    def handle(self, *args, **kwargs):
        print("### Iniciando popula permissoes aguarde pois pode demorar ###")
        labels = [
            "Boomerangues",
            "Boomerangues Templates",
            "Campanhas",
            "Criar campanha",
            "Histórico de vendas",
            "Empresas",
            "Leads",
            "Resumo Leads",
            "Criar Lead",
            "Bots",
            "Bot Canal",
            "Bot Canal Empresa",
            "Bot Provedor",
            "Whatsapp",
            "Whatsapp Template",
            "Geral",
            "Vendedores",
            "Listar vendedores",
            "Adicionar vendedores",
            "Transportadoras",
            "Listar transportadoras",
            "Adicionar transportadoras",
            "Condição Pagto",
            "Listar cond Pagto",
            "Adicionar cond Pagto",
            "Tabelas",
            "Categorias",
            "Grades",
            "Produtos",
            "Grupos de Produtos",
            "Linhas de Produtos",
            "Ajudante IA",
            "Inteligência Artificial",
            "Criar Empresa",
            "Painel Admin",
            "Usuários",
            "Grupos de Permissão",
            "Whatsapp",
            "Painel Plug",
            "Gateways Pagamento",
            "Mensagens",
            "Agendamentos",
            "Mapa Interativo",
            "Validacao de documentos",
            "Recrutamento",
            "Vagas",
            "Kanban Admissao",
            "Candidatos",
            "Cadastros",
            "Reacoes",
            "Grupo Documentos",
            "Status Documentos",
            "Status Candidatos",
            "Tipos Documentos",
            "Unidades",
            "Flows"
        ]
        for label in labels:
            permissoes_paginas.objects.get_or_create(
                nome=label,
                descricao=label,
            )


# class Command(BaseCommand):
#     help = 'Exclui todos os valores da tabela de permissões'
#     def handle(self, *args, **kwargs):
#         print("### Iniciando a exclusão de todas as permissões ###")
#         ger_dados_cep.objects.filter(cep__isnull=True).delete()
#         print("### Todas as permissões foram excluídas com sucesso ###")