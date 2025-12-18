from rest_framework import routers

from .views import MsgMessageViewSet, canaisViewSet, canais_leadsViewSet, usuario_leadViewSet


router = routers.DefaultRouter()
router.register(r"msg_message", MsgMessageViewSet, basename="msg_message")

router.register(r"canais", canaisViewSet, basename="canaisViewSet")
router.register(r"canais_leads", canais_leadsViewSet, basename="canais_leads")
router.register(r"usuario_lead", usuario_leadViewSet, basename="usuario_lead")

urlpatterns = router.urls
