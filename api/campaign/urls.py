from rest_framework import routers
from .views import CampaignViewSet, bmm_TemplateViewSet, bmm_boomerangueViewSet, bmm_boomerangueitensViewSet, importcsv, importcsvTemplate, retorna_nome_arquivos, retorna_originais_arquivos, retorna_nome_templates, PausaCampanhaViewSet, filtro_campanhas, remove_imagem, remove_imagem_campanha, filtro_boomerangues, retorna_boomerangues_nomes, retorna_nome_itens, logs_api, filtro_eventos, bmm_boomerangueitens_clientes,compra_efetuada,save_opcao_padrao,indice_vendas_dia, logs_boomerangues


router = routers.DefaultRouter()
router.register(r"campanhas",CampaignViewSet, basename="campanhas")
router.register(r"bmm_template",bmm_TemplateViewSet, basename="bmm_template")
router.register(r"bmm_boomerangue",bmm_boomerangueViewSet, basename="bmm_boomerangue")
router.register(r"bmm_boomerangueitens",bmm_boomerangueitensViewSet, basename="bmm_boomerangueitens")
router.register(r"importa_csv",importcsv, basename="importa_csv")
router.register(r"importa_csv_template",importcsvTemplate, basename="importa_csv_template")
router.register(r"retorna_nome_arquivos",retorna_nome_arquivos, basename="retorna_nome_arquivos")
router.register(r"retorna_originais_arquivos",retorna_originais_arquivos, basename="retorna_originais_arquivos")
router.register(r"retorna_nome_templates",retorna_nome_templates, basename="retorna_nome_templates")
router.register(r"pausa_campanhas",PausaCampanhaViewSet, basename="pausa_campanhas")
router.register(r"filtro_campanhas",filtro_campanhas, basename="filtro_campanhas")
router.register(r"remove_imagem",remove_imagem, basename="remove_imagem")
router.register(r"remove_imagem_campanha",remove_imagem_campanha, basename="remove_imagem_campanha")
router.register(r"filtro_boomerangues",filtro_boomerangues, basename="filtro_boomerangues")
router.register(r"retorna_boomerangues_nomes",retorna_boomerangues_nomes, basename="retorna_boomerangues_nomes")
router.register(r"retorna_nome_itens",retorna_nome_itens, basename="retorna_nome_itens")
router.register(r"logs_api",logs_api, basename="logs_api")
router.register(r"filtro_eventos",filtro_eventos, basename="filtro_eventos")
router.register(r"bmm_boomerangueitens_clientes",bmm_boomerangueitens_clientes, basename="bmm_boomerangueitens_clientes")
router.register(r"compra_efetuada",compra_efetuada, basename="compra_efetuada")
router.register(r"save_opcao_padrao",save_opcao_padrao, basename="save_opcao_padrao")
router.register(r"indice_vendas_dia",indice_vendas_dia, basename="indice_vendas_dia")
router.register(r"log_bmm",logs_boomerangues, basename="log_bmm")


urlpatterns = router.urls