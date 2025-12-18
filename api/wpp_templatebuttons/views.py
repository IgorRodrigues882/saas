from rest_framework import viewsets

from boomerangue.apps.wpp_templatebuttons.models import wpp_templatebuttons
from .seriealizers import WPPTemplateButtonsSerializer


class WPPTemplateButtonsViewSet(viewsets.ModelViewSet):
    queryset = wpp_templatebuttons.objects.all()
    serializer_class = WPPTemplateButtonsSerializer
    permission_classes = []
