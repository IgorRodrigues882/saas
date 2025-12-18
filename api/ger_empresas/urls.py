from rest_framework import routers
from .views import createEmpresaViewSet, createCondPagamentoViewSet, ger_tipoempresaViewSet, permissao_por_paginaViewSet, ger_tipoempresapermissaoViewSet, SelectTipoCampanhaViewSet, StringPersonalizadasViewSet, prompt_iaViewSet, ger_unidadeViewSet


router = routers.DefaultRouter()
router.register(r"create-empresa",createEmpresaViewSet, basename="create-empresa")
router.register(r"create-condPagamento",createCondPagamentoViewSet, basename="create-condPagamento")
router.register(r"ger_tipoempresa",ger_tipoempresaViewSet, basename="ger_tipoempresa")
router.register(r"tipoempresapermissao",ger_tipoempresapermissaoViewSet, basename="tipoempresapermissao")
router.register(r"permissao_pagina",permissao_por_paginaViewSet, basename="permissao_pagina")
router.register(r"select_tipo_campanha",SelectTipoCampanhaViewSet, basename="select_tipo_campanha")
router.register(r"stringspersonalizadas",StringPersonalizadasViewSet, basename="stringspersonalizadas")
router.register(r"prompt_ia",prompt_iaViewSet, basename="prompt_ia")
router.register(r"unidades",ger_unidadeViewSet, basename="unidades")
urlpatterns = router.urls