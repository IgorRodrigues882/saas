from rest_framework import routers

from .views import validacao_documentosViewSet


router = routers.DefaultRouter()
router.register(r"validacao_documentos", validacao_documentosViewSet, basename="validacao_documentos")

urlpatterns = router.urls