from django.urls import re_path

from boomerangue.consumers import MessageConsumer

websocket_urlpatterns = [
    re_path(r'ws/messages/(?P<room_name>\w+)/$', MessageConsumer.as_asgi()),
]
