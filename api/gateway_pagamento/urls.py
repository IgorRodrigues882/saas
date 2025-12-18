from rest_framework import routers
from .views import GatewayPagamentoViewSet
router = routers.DefaultRouter()

router.register(r"gatewayPagamento", GatewayPagamentoViewSet, basename="gatewayPagamento")
urlpatterns = router.urls
