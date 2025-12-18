from rest_framework import routers
from .views import createTransportadoraViewSet, createVendedoresViewSet, GetCidade


router = routers.DefaultRouter()
router.register(r"create-transportadora",createTransportadoraViewSet, basename="create-transportadora")
router.register(r"create-vendedor",createVendedoresViewSet, basename="create-vendedor")
router.register(r"pegacidade", GetCidade, basename="pegacidade")

urlpatterns = router.urls

