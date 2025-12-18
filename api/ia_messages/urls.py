from rest_framework import routers
from .views import SendMessageAPIView, ChatHistoryAPIView

router = routers.DefaultRouter()
router.register(r"send-message", SendMessageAPIView, basename="send-message")

router.register(r"chat-history", ChatHistoryAPIView, basename="chat-history")

urlpatterns = router.urls