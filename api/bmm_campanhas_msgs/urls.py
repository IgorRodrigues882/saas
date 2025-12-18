from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BmmCampanhasMsgsViewSet, retorna_nome_mensagens

router = DefaultRouter()
router.register(r'bmm_campanhas_msgs', BmmCampanhasMsgsViewSet)
router.register(r'retorna_nome_mensagens', retorna_nome_mensagens)
urlpatterns = [
    path('', include(router.urls)),
]
