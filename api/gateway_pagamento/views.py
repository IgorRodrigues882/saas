from rest_framework import viewsets
from rest_framework import permissions
from django.core.files.base import ContentFile
from rest_framework import status
from django.utils import timezone
from rest_framework.response import Response
from boomerangue.settings import AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
from boomerangue.apps.gateway_pagamento.models import gateway_pagamento
from .seriealizers import GatewayPagamentoSerializer
from rest_framework.decorators import action
import boto3
import urllib.parse
from botocore.client import Config
from botocore.exceptions import ClientError


class GatewayPagamentoViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows gateway_pagamento to be viewed, edited or created.
    """

    queryset = gateway_pagamento.objects.all()
    serializer_class = GatewayPagamentoSerializer
    permission_classes = [permissions.IsAuthenticated]
    # Return data for edit in transportadora-list

    def create(self, request, *args, **kwargs):
        empresa = request.user.empresa
        gateway_type = request.data.get('gateway_type')

        # Verifique se já existe um item com o mesmo gateway_type
        existing_item = gateway_pagamento.objects.filter(empresa=empresa, gateway_type=gateway_type, statusregistro_id=200).first()
        if existing_item:
            return Response({"error": "Já existe uma gateway para esse banco."}, status=status.HTTP_400_BAD_REQUEST)
        data = request.data.copy()  # Cria uma cópia dos dados

        if 'certificados' in data:
            file = data['certificados']
            data['certificados'] = ContentFile(file.read(), name=f"{empresa.id}/{data['gateway_type']}/{file.name}")
            data['certificado_name'] = file.name
            data['certificados_url'] = f"gateway_pagamentos/certificados/{empresa.id}/{data['gateway_type']}/{file.name}"
        
        if 'certificados_senhas' in data:
            file = data['certificados_senhas']
            data['certificados_senhas'] = ContentFile(file.read(), name=f"{empresa.id}/{data['gateway_type']}/{file.name}")
            data['certificados_senhas_url'] = f"gateway_pagamentos/certificados_senhas/{empresa.id}/{data['gateway_type']}/{file.name}"
            data['certificados_senhas_name'] = file.name

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def retrieve(self, request, pk=None):
        try:
            condicao = gateway_pagamento.objects.get(pk=pk)
        except gateway_pagamento.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)

        serializer = self.get_serializer(condicao)
        return Response(serializer.data)
    
    # Edit data
    def partial_update(self, request, pk=None):
        try:
            condicao = gateway_pagamento.objects.get(pk=pk)
        except gateway_pagamento.DoesNotExist:
            return Response({"error": "Item not found."}, status=status.HTTP_404_NOT_FOUND)

        gateway_type = request.data.get('gateway_type')
        # Verifique se já existe um item com o mesmo gateway_type
        existing_item = gateway_pagamento.objects.filter(empresa=condicao.empresa, gateway_type=gateway_type, statusregistro_id=200).exclude(pk=pk).first()
        if existing_item:
            return Response({"error": "Já existe uma gateway para esse banco."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Crie uma sessão do boto3 usando suas credenciais do Wasabi
        session = boto3.Session(
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        )

        # Crie um cliente do Wasabi
        s3_client = session.client('s3', endpoint_url='https://s3.us-west-1.wasabisys.com', config=Config(signature_version='s3v4'))

        if 'certificados' in request.data:
            file = request.data['certificados']
            certificado_name = file.name
            file_name = f"{condicao.empresa.id}/{gateway_type}/{file.name}"
            certificado_url = f"gateway_pagamentos/certificados/{file_name}"

            # Verifique se o arquivo já existe no Wasabi e exclua-o
            try:
                response = s3_client.list_objects(Bucket='boomerangue', Prefix=certificado_name)
                for obj in response.get('Contents', []):
                    s3_client.delete_object(Bucket='boomerangue', Key=obj['Key'])
            except ClientError:
                # O arquivo não existe
                pass

            request.data['certificados'] = ContentFile(file.read(), name=file_name)
            request.data['certificados_url'] = certificado_url
            request.data['certificado_name'] = certificado_name

        if 'certificados_senhas' in request.data:
            file = request.data['certificados_senhas']
            certificados_senhas_name = file.name
            file_name = f"{condicao.empresa.id}/{gateway_type}/{file.name}"
            certificados_senhas_url = f"gateway_pagamentos/certificados_senhas/{file_name}"

            # Verifique se o arquivo já existe no Wasabi e exclua-o
            try:
                response = s3_client.list_objects(Bucket='boomerangue', Prefix=certificados_senhas_name)
                for obj in response.get('Contents', []):
                    s3_client.delete_object(Bucket='boomerangue', Key=obj['Key'])
            except ClientError:
                # O arquivo não existe
                pass

            request.data['certificados_senhas'] = ContentFile(file.read(), name=file_name)
            request.data['certificados_senhas_url'] = certificados_senhas_url
            request.data['certificados_senhas_name'] = certificados_senhas_name
        serializer = self.get_serializer(condicao, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    # delete itens
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()

        # Crie uma sessão do boto3 usando suas credenciais do Wasabi

        self.exclui_arquivos_wasabi(instance)
        # Defina deleted_at com a data/hora atual
        instance.exclusao_dt = timezone.now()
        
        # Defina status como 9000
        instance.statusregistro_id = 9000

        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
    

    def exclui_arquivos_wasabi(self, instance):
        session = boto3.Session(
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        )

        # Crie um cliente do Wasabi
        s3_client = session.client('s3', endpoint_url='https://s3.us-west-1.wasabisys.com', config=Config(signature_version='s3v4'))

        # Apague os arquivos no Wasabi
        s3_client.delete_object(Bucket='boomerangue', Key=instance.certificados_url)
        s3_client.delete_object(Bucket='boomerangue', Key=instance.certificados_senhas_url)
    
    
    @action(detail=False, methods=['post'])
    def gera_url_temporaria(self, request):
        """
        Gera uma URL assinada para permitir o acesso temporário a um objeto no Wasabi.
        :param bucket_name: string
        :param object_name: string
        :param expiration: Tempo em segundos para o qual a URL assinada é válida
        :return: URL assinada como string. Se ocorrer um erro, retorna None.
        """
        key = request.data.get('object')

        # Crie uma sessão do boto3 usando suas credenciais do Wasabi
        session = boto3.Session(
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        )

        # Crie um cliente do Wasabi
        s3_client = session.client('s3', endpoint_url='https://s3.us-west-1.wasabisys.com', config=Config(signature_version='s3v4'))

        try:
            response = s3_client.generate_presigned_url('get_object',
                                                        Params={'Bucket': 'boomerangue',
                                                                'Key': key},
                                                        ExpiresIn=3600)
        except Exception as e:
            print(e)
            return None

        # A resposta contém a URL assinada
        print("resp",response)
        return Response(response, status=status.HTTP_201_CREATED)