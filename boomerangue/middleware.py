
from django.conf import settings
from django.urls import reverse
from django.http import HttpResponseRedirect
from django.utils import translation
from .apps.ger_empresas.models import ger_empresas
from django.http import HttpResponseForbidden
from urllib.parse import urlparse
from django.middleware.csrf import CsrfViewMiddleware

class LanguagePrefixMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        language = request.session.get('django_language', settings.LANGUAGE_CODE)
        translation.activate(language)
        request.LANGUAGE_CODE = translation.get_language()

        response = self.get_response(request)

        if 'lang' in request.GET:
            language = request.GET['lang']
            if language in [lang[0] for lang in settings.LANGUAGES]:
                request.session['django_language'] = language

                # Redirecionar para a mesma página com o novo idioma
                current_view_name = request.resolver_match.url_name
                new_url = reverse(current_view_name, kwargs=request.resolver_match.kwargs, args=request.resolver_match.args)
                return HttpResponseRedirect()

        return response



class MultitenancyMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Defina aqui os mapeamentos de IP para inquilinos.
        tenant_ips = {
            "tenant1": "202.172.0.141",
            "tenant2": "185.202.172.141",
        }

        # Obtenha o endereço IP do cliente.
        client_ip = request.META.get("REMOTE_ADDR")

        # Determine o inquilino com base no IP.
        tenant = None
        for name, ip in tenant_ips.items():
            if client_ip == ip:
                tenant = name
                break

        # Se o inquilino não for encontrado, retorne uma resposta proibida.
        if tenant is None:
            return HttpResponseForbidden("Acesso proibido")

        # Defina o inquilino na solicitação para uso posterior.
        request.tenant = tenant

        # Chame o próximo middleware ou a view.
        response = self.get_response(request)

        return response



class CsrfExemptMiddleware(CsrfViewMiddleware):
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        return response

    def get_url_prefix(self,url):
        result = urlparse(url)
        prefix = result.netloc.split('.')[0]
        return prefix

    def process_view(self, request, callback, callback_args, callback_kwargs):
        if 'HTTP_REFERER' in request.META:
            url = request.META['HTTP_REFERER']
            prefix = self.get_url_prefix(url)
            print(prefix)
            if not ger_empresas.objects.filter(url_boomerangue=prefix).exists() and prefix != 'boomerangue':
                return HttpResponseForbidden('Origem não permitida')
