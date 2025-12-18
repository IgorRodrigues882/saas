from rest_framework import routers

from .views import GerGradeViewSet


router = routers.DefaultRouter()
router.register(r"ger_grade", GerGradeViewSet, basename="ger_grade")

urlpatterns = router.urls
