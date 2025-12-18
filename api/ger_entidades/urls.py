from rest_framework import routers
from .views import createEntidadeViewSet


router = routers.DefaultRouter()
router.register(r"create-entidade",createEntidadeViewSet, basename="create-entidade")



urlpatterns = router.urls