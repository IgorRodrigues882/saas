from rest_framework import routers

from .views import GerLinhaProdutosViewSet


router = routers.DefaultRouter()
router.register(r"ger_linhaprodutos", GerLinhaProdutosViewSet, basename="ger_linhaprodutos")

urlpatterns = router.urls
