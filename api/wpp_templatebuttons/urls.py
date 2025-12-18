from rest_framework import routers

from .views import WPPTemplateButtonsViewSet


router = routers.DefaultRouter()
router.register(r"wpp_templatebuttons", WPPTemplateButtonsViewSet, basename="wpp_templatebuttons")

urlpatterns = router.urls
