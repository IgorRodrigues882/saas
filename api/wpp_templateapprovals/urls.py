from rest_framework import routers

from .views import WPPTemplateApprovalsViewSet


router = routers.DefaultRouter()
router.register(r"wpp_templateapprovals", WPPTemplateApprovalsViewSet, basename="wpp_templateapprovals")

urlpatterns = router.urls
