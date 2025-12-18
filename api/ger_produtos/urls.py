from rest_framework import routers

from .views import GerProdutosViewSet


router = routers.DefaultRouter()
router.register(r"ger_produtos", GerProdutosViewSet, basename="ger_produtos")

urlpatterns = router.urls
