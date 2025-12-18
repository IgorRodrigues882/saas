
from rest_framework.routers import DefaultRouter
from .views import BmmTemplateMsgsViewSet, retorna_mensagens_template

router = DefaultRouter()
router.register(r'bmm_template_msgs', BmmTemplateMsgsViewSet, basename="bmm_template_msgs")
router.register(r'retorna_nome_mensagens_template', retorna_mensagens_template, basename="retorna_nome_mensagens")

urlpatterns = router.urls