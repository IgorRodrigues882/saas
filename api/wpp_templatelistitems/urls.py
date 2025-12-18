from rest_framework import routers

from .views import WPPTemplateListItemsViewSet


router = routers.DefaultRouter()
router.register(r"wpp_templatelistitems", WPPTemplateListItemsViewSet, basename="wpp_templatelistitems")

urlpatterns = router.urls
