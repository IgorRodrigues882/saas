from django.core.management.base import BaseCommand
from boomerangue.apps.ger_empresas.models import StringPersonalizada, ger_tipoempresa

class Command(BaseCommand):
    help = 'Popula a tabela StringPersonalizada com termos específicos'

    def handle(self, *args, **options):
        termos = ['vendas', 'Comprando', 'Compras', 'Produtos Mais Vendidos', 'Vendedores', 'Compra', 'Leads']
        self.stdout.write(self.style.SUCCESS('Iniciando Popula strings'))
        tipo_empresa = ger_tipoempresa.objects.get(pk=1)
        for termo in termos:
            StringPersonalizada.objects.get_or_create(chave=termo, valor=termo, tipo_empresa=tipo_empresa)
        
        self.stdout.write(self.style.SUCCESS('Tabela StringPersonalizada foi populada com sucesso!'))

# class Command(BaseCommand):
#     help = 'Limpa a tabela StringPersonalizada'

#     def handle(self, *args, **options):
#         StringPersonalizada.objects.all().delete()
#         self.stdout.write(self.style.SUCCESS('Tabela StringPersonalizada foi limpa com sucesso!'))