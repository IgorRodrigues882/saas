from django.core.management.base import BaseCommand
from boomerangue.apps.campaign.models import bmm_boomerangue
from boomerangue.apps.ger_entidades.models import ger_entidade
from django.db.models import Q

class Command(BaseCommand):
    help = 'atualiza status boomerangue'

    def handle(self, *args, **options):

        try:
            # Filtra todos os usuários da empresa 8 com `statusoptin = 'N'`
            usuarios = ger_entidade.objects.filter(empresa=8, StatusOptIN='N')

            if not usuarios:
                print("Nenhum usuário encontrado com statusoptin = 'N' para a empresa 8.")
            
            # Itera sobre cada usuário encontrado
            for usuario in usuarios:
                try:
                    # Busca o último boomerangue para a última campanha enviada do usuário
                    bmm = bmm_boomerangue.objects.filter(
                        campanha=usuario.ultima_campanha_enviada,
                        entidade=usuario
                    ).last()
                    
                    # Verifica se um boomerangue foi encontrado
                    if bmm:
                        bmm.bm_status = 'Z'
                        bmm.save()
                        print(f"Status atualizado para 'Z' para boomerangue ID {bmm.id} do usuário ID {usuario.id}")
                    else:
                        print(f"Nenhum boomerangue encontrado para a última campanha do usuário ID {usuario.id}")
                
                except Exception as e:
                    print(f"Erro ao processar o usuário ID {usuario.id}: {e}")

        except Exception as e:
            print(f"Erro ao buscar usuários: {e}")
