from rest_framework import routers

from .views import AtributoViewSet, GrupoAgendamentosViewSet


router = routers.DefaultRouter()
router.register(r"atributos", AtributoViewSet, basename="atributos")
router.register(r"grupoAgendamentos", GrupoAgendamentosViewSet, basename="grupoAgendamentos")

urlpatterns = router.urls
