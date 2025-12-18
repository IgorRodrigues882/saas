from rest_framework import routers

from .views import BotChannelCompanyViewSet


router = routers.DefaultRouter()
router.register(r"bot_canalempresa", BotChannelCompanyViewSet, basename="bot_canalempresa")

urlpatterns = router.urls
