
from rest_framework import routers

# Adicionar importação da nova view
from .views import (
    vagasViewSet,
    candidatosViewSet,
    ReasonsViewSet,
    stdViewSet,
    statusdocViewSet,
    statuscandidateViewSet,
    tipos_documentoViewSet,
    camposViewSet,
    UniversalExportView # Importar a nova view
)

router = routers.DefaultRouter()
router.register(r"vagas", vagasViewSet, basename="vagas")
router.register(r"candidatos", candidatosViewSet, basename="candidatos")
router.register(r"reacoes", ReasonsViewSet, basename="cadastros")
router.register(r"std", stdViewSet, basename="std")
router.register(r"statusdoc", statusdocViewSet, basename="statusdoc")
router.register(r"statuscandidate", statuscandidateViewSet, basename="statuscandidate")
router.register(r"tipos_documento", tipos_documentoViewSet, basename="tipos_documento")
router.register(r"campos", camposViewSet, basename="campos")
router.register(r"export", UniversalExportView, basename="export")

urlpatterns = router.urls

# Manter as URLs do router e adicionar a nova rota
# urlpatterns = router.urls + [
#     path('exportar/', UniversalExportView.as_view(), name='universal_export'),
# ]