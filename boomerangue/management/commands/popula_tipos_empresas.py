from django.core.management.base import BaseCommand
from boomerangue.apps.ger_empresas.models import ger_tipoempresa

class Command(BaseCommand):
    help = 'Popula a tabela de permissões'
    def handle(self, *args, **kwargs):
        print("### Iniciando popula tipos empresas aguarde pois pode demorar ###")
        
        TIPOS_DE_EMPRESA_ID = [
            ('ADMIN', 'Plug_Admin'),
            ('DI', 'Distribuidora'),
            ('HSP', 'Hospital'),
            ('FUN', 'Fundacao'),
            ('IND', 'Industria'),
            ('ICAL', 'Industria Calcados'),
            ('COM', 'Comercio'),
            ('SRV', 'Servicos'),
            ('SEG', 'Seguros'),
            ('MED', 'Medicina'),
            ('ODO', 'Odontologia'),
            ('CLI', 'Clinicas'),
            ('EST', 'Clinicas Esteticas'),
            ('DF', 'Default'),
        ]

        for tipo in TIPOS_DE_EMPRESA_ID:
            ger_tipoempresa.objects.create(
                value_prefixo=tipo[0],
                value=tipo[1],
                statusregistro_id=200
            )
