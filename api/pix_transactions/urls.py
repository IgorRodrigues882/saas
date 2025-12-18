from rest_framework import routers

from .views import SolicitacaoPagamentoViewSet


router = routers.DefaultRouter()
router.register(r"pix_transaction", SolicitacaoPagamentoViewSet, basename="pix_transaction")

urlpatterns = router.urls
