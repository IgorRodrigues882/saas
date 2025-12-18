from rest_framework import routers

from .views import WPPTemplatesViewSet, retorna_nome_templates, retorna_opcoes_anteriores, RetornaOpcoesFiltradas, criatividade_iaViewSet, tomvozViewSet, gpt_engineViewSet, ia_prompt_settingsViewSet, wpp_fieldsViewSet, callToActionViewSet, FlowsViewSet


router = routers.DefaultRouter()
router.register(r"wpp_templates", WPPTemplatesViewSet, basename="wpp_templates")
router.register(r"list_templates", retorna_nome_templates, basename="list_templates")
router.register(r"retorna_originais", retorna_opcoes_anteriores, basename="retorna_originais")
router.register(r"retorna_filtro", RetornaOpcoesFiltradas, basename="retorna_filtros")
router.register(r"criatividade", criatividade_iaViewSet, basename="criatividade")
router.register(r"tomvoz", tomvozViewSet, basename="tomvoz")
router.register(r"gpt_engine", gpt_engineViewSet, basename="gpt_engine")
router.register(r"prompt_settings", ia_prompt_settingsViewSet, basename="prompt_settings")
router.register(r"wpp_fields", wpp_fieldsViewSet, basename="wpp_fields")
router.register(r"callToActionTemplate", callToActionViewSet, basename="callToActionTemplate")
router.register(r"flows", FlowsViewSet, basename="flows") # Alterado para plural
urlpatterns = router.urls
