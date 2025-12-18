from rest_framework import routers

from .views import historico_vendas_importViewSet, historico_vendas_viewset


router = routers.DefaultRouter()
router.register(r"historico_vendas_import", historico_vendas_importViewSet, basename="historico_vendas_import")
router.register(r"historico_vendas", historico_vendas_viewset, basename="historico_vendas")

urlpatterns = router.urls