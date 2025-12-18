from rest_framework import viewsets

from boomerangue.apps.wpp_templateapprovals.models import wpp_templateapprovals
from .seriealizers import WPPTemplateApprovalsSerializer


class WPPTemplateApprovalsViewSet(viewsets.ModelViewSet):
    queryset = wpp_templateapprovals.objects.all()
    serializer_class = WPPTemplateApprovalsSerializer
    permission_classes = []
