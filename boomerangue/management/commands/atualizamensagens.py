from boomerangue.apps.msg_messages.models import MsgMessage
from boomerangue.apps.bot.models import Bot
from django.core.management.base import BaseCommand
from boomerangue.apps.ger_empresas.models import ger_empresas

class Command(BaseCommand):
    help = 'Atualiza IDs de mensagens'

    def handle(self, *args, **kwargs):
        try:
            # Filtra as mensagens que precisam ser atualizadas
            mensagens = MsgMessage.objects.filter(bot='34', empresa='2')
            
            # Obtém os objetos de Bot e Empresa
            bot = Bot.objects.get(id='70')
            empresa = ger_empresas.objects.get(id='51')
            
            # Atualiza os campos nos objetos em memória
            for mensagem in mensagens:
                mensagem.bot = bot
                mensagem.empresa = empresa

            # Realiza o bulk_update para salvar todas as alterações em uma única operação
            MsgMessage.objects.bulk_update(mensagens, ['bot', 'empresa'])

            self.stdout.write(self.style.SUCCESS(f"{mensagens.count()} mensagens atualizadas com sucesso."))

        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Erro: {e}"))
