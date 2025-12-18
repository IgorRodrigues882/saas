from rest_framework import routers

from .views import GerCategoriasViewSet


router = routers.DefaultRouter()
router.register(r"ger_categorias", GerCategoriasViewSet, basename="ger_categorias")

urlpatterns = router.urls
