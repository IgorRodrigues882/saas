from rest_framework import viewsets

from boomerangue.apps.wpp_templatelistitems.models import wpp_templatelistitems
from .seriealizers import WPPTemplateListItemsSerializer


class WPPTemplateListItemsViewSet(viewsets.ModelViewSet):
    queryset = wpp_templatelistitems.objects.all()
    serializer_class = WPPTemplateListItemsSerializer
    permission_classes = []
