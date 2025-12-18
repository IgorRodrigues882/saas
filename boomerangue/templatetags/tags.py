
from django import template
from django.utils import translation
from django.db.models import Q
import re
from boomerangue.apps.ger_empresas.models import TipoEmpresaPermissao,  StringPersonalizada, permissoes_paginas
from boomerangue.apps.msg_messages.models import MsgMessage

register = template.Library()

@register.filter(name='get_item')
def get_item(dictionary, key):
    return dictionary.get(key)

@register.filter
def custom_floatformat(value, arg):
    try:
        return f"{float(value):.{arg}f}"
    except (ValueError, TypeError):
        return ""

@register.filter(name='remove_non_numeric')
def remove_non_numeric(value):
    return re.sub(r'\D', '', value)

@register.filter(name = 'formatar_cpf_ou_cnpj')
def formatar_cpf_ou_cnpj(valor):
    valor = ''.join(filter(str.isdigit, str(valor)))
    if len(valor) == 11:
        return "{}.{}.{}-{}".format(valor[:3], valor[3:6], valor[6:9], valor[9:])
    elif len(valor) == 14:
        return "{}.{}.{}/{}-{}".format(valor[:2], valor[2:5], valor[5:8], valor[8:12], valor[12:])
    return valor

@register.simple_tag
def empresa_tem_permissao(empresa):
    labels = permissoes_paginas.objects.all()
    resultados = {}
    for permissao in labels:
        ref = permissao.nome.replace(' ', '_')
        resultados[ref] = TipoEmpresaPermissao.objects.filter(tipo_empresa=empresa, permissao__nome=permissao.nome).exists()
    return resultados


@register.simple_tag(takes_context=True)
def get_string_personalizada(context, chave):
    try:
        lingua = translation.get_language()
        request = context['request']
        
        if request.user.is_authenticated:
            tipo = request.user.empresa.tipo_de_negocio
        else:
            dados = context['dados']
            tipo = dados.empresa.tipo_de_negocio

        return StringPersonalizada.objects.get(chave=chave, lingua=lingua, tipo_empresa = tipo).valor
    except StringPersonalizada.DoesNotExist:
        return chave


@register.simple_tag
def get_message_count(empresa):
    try:
        mensagens = MsgMessage.objects.filter(Q(msg_lida='N') | Q(msg_lida__isnull=True), empresa = empresa)
        return mensagens.count()
    except MsgMessage.DoesNotExist:
        return ''


@register.filter(name='formatar_atributo')
def formatar_atributo(value):
    if not isinstance(value, str):
        return value
    return value.replace('_', ' ').capitalize()
    
