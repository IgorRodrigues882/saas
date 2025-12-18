from rest_framework import routers

from .views import WPPTemplateComponenetsViewSet, WPPTemplateComponenets_retorno_ViewSet, termos_sendpulse_trocaViewSet, fluxo_sendpulseViewSet


router = routers.DefaultRouter()
router.register(r"wpp_templatescomponents", WPPTemplateComponenetsViewSet, basename="wpp_templatescomponents")
router.register(r"wpp_templatescomponents_retorno", WPPTemplateComponenets_retorno_ViewSet, basename="wpp_templatescomponents_retorno")
router.register(r"termo_troca", termos_sendpulse_trocaViewSet, basename="termo_troca")
router.register(r"fluxo_sendpulse", fluxo_sendpulseViewSet, basename="fluxo_sendpulse")
urlpatterns = router.urls
