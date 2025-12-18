from rest_framework import routers

from .views import GerGrupoProdutosViewSet


router = routers.DefaultRouter()
router.register(r"ger_grupoprodutos", GerGrupoProdutosViewSet, basename="ger_grupoprodutos")

urlpatterns = router.urls
