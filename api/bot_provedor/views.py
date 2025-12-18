from rest_framework import viewsets
from rest_framework import permissions
from rest_framework import status
import datetime
from rest_framework.response import Response
from boomerangue.apps.bot_provedor.models import bot_provedor
from .seriealizers import BotProviderSerializer


class BotProviderViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows Bot Provider to be viewed, edited or created.
    """

    queryset = bot_provedor.objects.all()
    serializer_class = BotProviderSerializer
    permission_classes = [permissions.IsAuthenticated]

    # Return data for edit in transportadora-list
    def retrieve(self, request, pk=None):
        try:
            condicao = bot_provedor.objects.get(pk=pk)
        except bot_provedor.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)

        serializer = self.get_serializer(condicao)
        return Response(serializer.data)
    
    # Edit data
    def partial_update(self, request, pk=None):
        try:
            condicao = bot_provedor.objects.get(pk=pk)
        except bot_provedor.DoesNotExist:
            return Response({"error": "Item not found."}, status=status.HTTP_404_NOT_FOUND)
        

        if condicao.empresa.pk != request.user.empresa.pk:
            return Response({"error": "Sem autorização"}, status=status.HTTP_401_UNAUTHORIZED)

        serializer = self.get_serializer(condicao, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()

        # Defina deleted_at com a data/hora atual
        instance.exclusao_dt = datetime.datetime.now()
        
        # Defina status como 9000
        instance.statusregistro_id = 9000

        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)