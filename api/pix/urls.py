from django.urls import path

from .views import gera_qrcode_pix, cpf_verification, cpf_create, txid_verification, busca_pix


urlpatterns = [
    path("spl", gera_qrcode_pix, name="pix-create"),
    path("spl/cpf", cpf_verification, name="cpf"),
    path("spl/cpf-create", cpf_create, name="cpf-create"),

    path("txid", txid_verification, name="txid"),

    path("spl/busca_pix", busca_pix, name="busca_pix"),
    
]