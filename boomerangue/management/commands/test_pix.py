import requests
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Teste pix'
    def handle(self, *args, **kwargs):
        busca_pix()



def login():
    endpoint = 'https://b201-2804-56c-d7b1-d600-a997-3bf7-3e4f-e2d7.ngrok-free.app/user/login'
    body = {   
        "username": "user",
        "password": "pass"
    }
    r = requests.post(endpoint, json=body)

    data = r.json()
    return data['access_token']


def busca_qrcode(cpf,nome):
        endpoint = 'https://b201-2804-56c-d7b1-d600-a997-3bf7-3e4f-e2d7.ngrok-free.app/bb/pix/'
        body = {
             
            'debtor_cpf': cpf,
            "debtor_name": nome,
            "value":"0.01",
            "pix_key": "app@plugthink.com.br",
            "callback_url": "https://localhost/",
            "wasabi_crt_url": "gateway_pagamentos/certificados/2/SC/chained_certificate.crt",
            "wasabi_crt_pass_url": "gateway_pagamentos/certificados_senhas/2/SC/api.boomerangue.co_privatekey.key"
        }
        access_token = login()
        r = requests.post(endpoint, json=body, headers={"Authorization": f"Bearer {access_token}"})

        print(r.json())
        return r.json()


def busca_pix():
    url = f"https://b201-2804-56c-d7b1-d600-a997-3bf7-3e4f-e2d7.ngrok-free.app/bb/pix/status"
    access_token = login()
    print(access_token)
    headers = {
        "Authorization": f"Bearer {access_token}",
    }

    body = {
        "txid": "",
        "client_id": "",
        "client_secret": "",
        "wasabi_crt_url": "gateway_pagamentos/certificados/47/BB/certificate.crt",
        "wasabi_crt_pass_url": "gateway_pagamentos/certificados_senhas/47/BB/api.boomerangue.co_privatekey.key",
        "dev_key": ""
    }

    response = requests.get(url, headers=headers, json=body)

    if response.status_code == 200:
        print("Status do pagamento PIX:", response.json())
    else:
        print("Erro:", response.status_code, response.json())