import pika
from rest_framework.decorators import api_view
from rest_framework.response import Response
import json
import socket

def publish_to_queue(queue_name, message):
    connection = None
    try:
        # Aumentar timeout da conexão
        socket.setdefaulttimeout(30)  # 30 segundos de timeout
        
        credentials = pika.PlainCredentials(
            username='',
            password=''
        )
        
        # Configurações mais robustas
        parameters = pika.ConnectionParameters(
            host='rabbit1.apifacil.com.br',
            port=5672,
            credentials=credentials,
            heartbeat=60,
            blocked_connection_timeout=30,
            connection_attempts=3,  # Tentativas de reconexão
            retry_delay=5,         # Delay entre tentativas em segundos
            socket_timeout=15      # Timeout do socket
        )
        
        connection = pika.BlockingConnection(parameters)
        channel = connection.channel()
        
        # Declarar a fila com confirmação
        channel.queue_declare(queue=queue_name, durable=True)
        
        # Publicar com confirmação
        channel.confirm_delivery()
        
        channel.basic_publish(
            exchange='',
            routing_key=queue_name,
            body=message,
            properties=pika.BasicProperties(
                delivery_mode=2,  # Mensagem persistente
                content_type='application/json'
            ),
            mandatory=True  # Garantir que a mensagem chegue a uma fila
        )
        
    except pika.exceptions.AMQPConnectionError as e:
        print(f"Erro de conexão com RabbitMQ: {e}")
        raise Exception("Não foi possível conectar ao servidor RabbitMQ")
    except pika.exceptions.AMQPChannelError as e:
        print(f"Erro no canal AMQP: {e}")
        raise Exception("Erro no canal de comunicação com RabbitMQ")
    except socket.timeout as e:
        print(f"Timeout na conexão: {e}")
        raise Exception("Timeout ao tentar conectar com RabbitMQ")
    except Exception as e:
        print(f"Erro inesperado: {e}")
        raise
    finally:
        if connection and not connection.is_closed:
            connection.close()

@api_view(['POST'])
def create_task(request):
    try:
        data = request.data
        user_id = data.get('telefone')
        action = data.get('action')
        
        if not user_id or not action:
            return Response(
                {'error': 'Campos "telefone" e "action" são obrigatórios.'}, 
                status=400
            )
        
        task_data = json.dumps({
            'user_id': user_id,
            'action': action
        })
        
        publish_to_queue('tasks_queue', task_data)
        return Response({'message': 'Task created successfully!'}, status=201)
        
    except Exception as e:
        return Response(
            {'error': f'Erro ao criar task: {str(e)}'}, 
            status=500
        )