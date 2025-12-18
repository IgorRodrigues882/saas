from rest_framework import routers

from .views import BotChannelViewSet


router = routers.DefaultRouter()
router.register(r"bot_canal", BotChannelViewSet, basename="bot_canal")

urlpatterns = router.urls
