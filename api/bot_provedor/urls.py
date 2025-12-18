from rest_framework import routers

from .views import BotProviderViewSet


router = routers.DefaultRouter()
router.register(r"bot_provedor", BotProviderViewSet, basename="bot_provedor")

urlpatterns = router.urls
