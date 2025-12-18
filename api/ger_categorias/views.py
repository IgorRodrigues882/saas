from rest_framework import viewsets
from rest_framework import permissions
from rest_framework import status
from django.utils import timezone
from rest_framework.response import Response
import datetime
from boomerangue.apps.ger_categorias.models import ger_categorias
from .seriealizers import GerCategoriasSerializer


class GerCategoriasViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows ger_categorias to be viewed, edited or created.
    """

    queryset = ger_categorias.objects.all()
    serializer_class = GerCategoriasSerializer
    permission_classes = [permissions.IsAuthenticated]
    # Return data for edit in transportadora-list
    def retrieve(self, request, pk=None):
        try:
            condicao = ger_categorias.objects.get(pk=pk)
        except ger_categorias.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)

        serializer = self.get_serializer(condicao)
        return Response(serializer.data)
    
    # Edit data
    def patch(self, request, pk=None):
        try:
            condicao = ger_categorias.objects.get(pk=pk)
        except ger_categorias.DoesNotExist:
            return Response({"error": "Item not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(condicao, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    # delete itens
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()

        # Defina deleted_at com a data/hora atual
        instance.exclusao_dt = timezone.now()
        
        # Defina status como 9000
        instance.statusregistro_id = 9000

        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
