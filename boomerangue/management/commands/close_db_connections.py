from django.core.management.base import BaseCommand
from django.db import connections

# comando para ser executado quando o erro too_manyconnections acontecer 
class Command(BaseCommand):
    help = 'Closes all database connections'

    def handle(self, *args, **options):
        connections.close_all()
        self.stdout.write(self.style.SUCCESS('Successfully closed all database connections'))