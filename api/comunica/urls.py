from django.urls import path
from . import views  # Assuming your views are in a file named views.py in the same Django app

urlpatterns = [
    path('instances/connection-state/<str:instance_name>/', views.get_connection_state, name='get_connection_state'),
    path('instances/connect/<str:instance_name>/', views.connect_instance, name='connect_instance'),
    path('instances/restart/<str:instance_name>/', views.restart_instance, name='restart_instance'),
    path('instances/disconnect/<str:instance_name>/', views.disconnect_instance, name="disconnect_instance"),
    path('messages/send-text/<str:instance_name>/', views.send_text, name='send_text'),
    path('messages/send-image/<str:instance_name>/', views.send_image, name='send_image'),
]