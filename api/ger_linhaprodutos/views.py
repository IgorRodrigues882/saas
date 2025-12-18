from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework import permissions

from boomerangue.apps.ger_linhaprodutos.models import ger_linhaprodutos
from .seriealizers import GerLinhaProdutosSerializer


class GerLinhaProdutosViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows ger_linhaprodutos to be viewed, edited or created.
    """

    queryset = ger_linhaprodutos.objects.all()
    serializer_class = GerLinhaProdutosSerializer
    permission_classes = [permissions.IsAuthenticated]
