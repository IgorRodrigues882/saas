from rest_framework import routers

from .views import BotViewSet


router = routers.DefaultRouter()
router.register(r"bots", BotViewSet, basename="bot")

urlpatterns = router.urls
