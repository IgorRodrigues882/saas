from django.shortcuts import render
from django.db import models
import requests
from api.campaign.views import CampaignViewSet, bmm_TemplateViewSet, bmm_boomerangueViewSet, CustomPagination
from api.ger_empresas.views import createEmpresaViewSet, createCondPagamentoViewSet
from api.ger_dadosgerais.views import createTransportadoraViewSet, createVendedoresViewSet, GetPaises, GetUF, createMarcasViewSet
from api.ger_entidades.views import createEntidadeViewSet
from boomerangue.apps.bmm_template_msgs.models import bmm_template_msgs
from boomerangue.settings import ALLOWED_HOSTS
from boomerangue.apps.bot_canal.models import bot_canal
from boomerangue.apps.pix_transactions.models import SolicitacaoPagamento
from boomerangue.apps.bot.models import Bot
from django.core import serializers
from django.core.paginator import Paginator
import re
import json
from boomerangue.apps.campaign.models import bmm_campanha, bmm_template, bmm_templateimportado, bmm_template_itens, bmm_boomerangueevento, bmm_boomeranguelog, bmm_boomerangue, bmm_boomerangueitens
from boomerangue.apps.bmm_campanhas_msgs.models import bmm_campanhas_msgs
from boomerangue.apps.bot_canalempresa.models import bot_canalempresa
from boomerangue.apps.bot_provedor.models import bot_provedor
from boomerangue.apps.ger_categorias.models import ger_categorias
from boomerangue.apps.ger_grade.models import ger_grade
from boomerangue.apps.ger_grupoprodutos.models import ger_grupoprodutos
from boomerangue.apps.ger_linhaprodutos.models import ger_linhaprodutos
from boomerangue.apps.ger_empresas.models import ger_empresas, ger_condicoespagamento, ger_tipoempresa, permissoes_paginas, select_tipo_campanha, StringPersonalizada, ger_unidade
from django.db.models import Sum, Count, Case, When, Value, IntegerField, F, FloatField, Q
from boomerangue.apps.ger_produtos.models import ger_produtos
from boomerangue.apps.wpp_templates.models import wpp_templates, ia_criatividade, ia_geracao, ia_tomvoz, gpt_engine, ia_prompt_settings, wpp_fields, callToAction, Flows
from boomerangue.apps.wpp_templatescomponents.models import wpp_templatescomponents,termos_sendpulse_troca
from boomerangue.apps.ger_dadosgerais.models import ger_marcas, ger_unidademedida, ger_distribuidor, ger_regiao
from boomerangue.apps.ger_entidades.models import ger_entidade
from boomerangue.apps.gateway_pagamento.models import gateway_pagamento
from boomerangue.apps.atributos.models import Atributo
from boomerangue.apps.recrutamento.models import vagas, CandidateStatus

from api.ger_produtos.views import GerProdutosViewSet
from django.views.decorators.csrf import csrf_exempt
from login.models import Usuario, Grupos, Permissoes, TokenTemp
from django.db.models.functions import Coalesce, Now, ExtractHour, TruncDate
from datetime import timedelta
import datetime
from django.db.models import Subquery, OuterRef
from django.http import JsonResponse
from login.decorators import verify
from django.contrib.auth.models import Permission
from django.apps import apps
from django.conf import settings
from django.shortcuts import redirect
from django.utils import translation
from django.urls import reverse
from django.http import HttpResponse, HttpResponseRedirect
from weasyprint import HTML, CSS
from django.contrib.staticfiles.storage import staticfiles_storage
from django.template.loader import render_to_string
from babel.numbers import format_currency


def set_language(request, language_code, page):
    try:
        if language_code in [lang[0] for lang in settings.LANGUAGES]:
            request.session['django_language'] = language_code
        
        # # Construa a URL de destino com base na página fornecida
        # destination_url = f'/{language_code}/{page}'
        
        # Redirecione para a URL de destino
        if page == 'home':
            url = language_code
        else:
            url = page
        return redirect('/'+url)
    except Exception as e:
        print(e)


@verify()
def index(request):
    permissoes = permissoes_paginas.objects.all()
    boomerangues = bmm_boomerangue.objects.filter(empresa = request.user.empresa, statusregistro_id=200)
    campanhas_ativas = bmm_campanha.objects.filter(empresa = request.user.empresa, status_campanha='EA', statusregistro_id=200).count()
    nBoomerangues = boomerangues.count()

    ValorVendas = SolicitacaoPagamento.objects.filter(empresa = request.user.empresa, status__in=['APROVADO', 'PAGO']).aggregate(
                ValorVendas=Sum(
                    Case(
                        When(status__in=['APROVADO', 'PAGO'], then=F('valor')),
                        default=Value(0),
                        output_field=FloatField()
                    )
                )
            )


    # grafico pedidos confirmados
    bmm = boomerangues.filter(data_aceite_bm__gt=Now() - timedelta(weeks=1)).select_related('campanha')

    resultados = bmm.annotate(
            Dia=TruncDate('data_aceite_bm')
        ).values('Dia').annotate(
            Vendas=Sum(
                Case(
                    When(bm_aceito='S', then=Value(1)),
                    default=Value(0),
                    output_field=IntegerField()
                )
            ),
            ValorVendas=Sum(
                Case(
                    When(bm_aceito='S', then=F('valor_atual')),
                    default=Value(0),
                    output_field=FloatField()
                )
            ),
            TicketMedio=Sum(
                Case(
                    When(bm_aceito='S', then=F('valor_atual')),
                    default=Value(0),
                    output_field=FloatField()
                )
            ) / Sum(
                Case(
                    When(bm_aceito='S', then=Value(1)),
                    default=Value(0),
                    output_field=IntegerField()
                )
            )
        ).order_by('Dia')

    # Gráfico campanhas
    gr_campanha = bmm.values('campanha__Campanha').annotate(
        Dia=TruncDate('data_aceite_bm')).values('Dia').annotate(
        Envios=Count('id'),
        Aberturas=Sum(
            Case(
                When(data_pri_open_web__isnull=False, bm_com_erro='N', then=Value(1)),
                default=Value(0),
                output_field=IntegerField()
            )
        ),
        Vendas=Sum(
            Case(
                When(bm_aceito='S', then=Value(1)),
                default=Value(0),
                output_field=IntegerField()
            )
        )
    ).order_by('campanha__data_inicio')


    try: 
        vendeu = ValorVendas
    except:
        vendeu = 0
    print('VENDAS', vendeu)
    context = {"breadcrumb":{"parent":"Início","child":"Últimos 30 dias!"},
               'pedidos_confirmados': resultados,
               'gr_campanha': gr_campanha,
               'nBoomerangues':nBoomerangues,
               "CampanhasAtivas": campanhas_ativas if campanhas_ativas != None else 0,
            #    "TaxadeConversao": int(TaxadeConversao),
                'Vendas': vendeu,
                'ValorVendas': vendeu,
                'permissoes': permissoes

               }
    return render(request, 'home/index.html', context)

@verify(permission_codename = 'Resumo Leads')
def entidades_view(request):
    lead = StringPersonalizada.objects.get(chave = 'Leads', tipo_empresa=request.user.empresa.tipo_de_negocio, lingua = translation.get_language()).valor if StringPersonalizada.objects.filter(chave = 'Leads', tipo_empresa=request.user.empresa.tipo_de_negocio, lingua = translation.get_language()).exists() else 'Leads'
    context={
        "breadcrumb":{"parent":lead,"child":"Resumo " + lead}, 
        # "paises": GetPaises.return_paises(), 
        "uf": GetUF.return_uf()
    }
    return render(request, 'resumodaentidade/entidades-list.html', context)

def load_more_entidades(request):
    page = int(request.GET.get('page', 1))
    items_per_page = 10
    start_index = (page - 1) * items_per_page
    end_index = start_index + 10  # Carregar mais x itens por vez
    items = ger_entidade.objects.filter(statusregistro_id=200, empresa=request.user.empresa).order_by('-cadastro_dt')[start_index:end_index]

    items_list = []
    for item in items:
        try:
            cidade = item.cidade.Cidade
        except:
            cidade = '-'
        try:
            sigla = item.cidade.uf.sigla
        except:
            sigla = '-' 
        
        inscricao_estadual = item.InscricaoEstadual
        
        items_list.append({
            'Entidade': item.Entidade, 
            'pk': item.pk, 
            'CNPJ': item.CNPJ,
            'InscricaoEstadual': '-' if inscricao_estadual is None else inscricao_estadual,
            'cidade': cidade,
            'uf': sigla,
            'Telefone1': item.Telefone1,
            'Email_Comercial': item.Email_Comercial,
            'TelefoneValidacaoWP': item.TelefoneValidacaoWP,
            'DataValidacaoWP': item.DataValidacaoWP,
            'DataConfirmacaoWP': item.DataConfirmacaoWP,
            'vendedorValidacao': item.vendedorValidacao.Vendedor if item.vendedorValidacao is not None else '-',
        }) 

    return JsonResponse({'items': items_list})


@verify(permission_codename = 'Criar Lead')
def create_entidade(request):
    lead = StringPersonalizada.objects.get(chave = 'Leads', tipo_empresa=request.user.empresa.tipo_de_negocio, lingua = translation.get_language()).valor if StringPersonalizada.objects.filter(chave = 'Leads', tipo_empresa=request.user.empresa.tipo_de_negocio, lingua = translation.get_language()).exists() else 'Leads'
    context={"breadcrumb":{"parent":lead,"child":"Criar "+lead}, "paises": GetPaises.return_paises(), "uf": GetUF.return_uf()}
    return render(request, 'resumodaentidade/create-entidade.html', context)


@verify(permission_codename = 'Resumo Leads')
def entidade_consulta(request, id):
    try:
        entidade = ger_entidade.objects.get(empresa = request.user.empresa, id=id , statusregistro_id=200)
    except Exception as e:
        print(e)
        return render(request, 'error_page/error404.html')
    
    boomerangues = bmm_boomerangue.objects.filter(entidade = entidade)
    boomerangues_comprou = SolicitacaoPagamento.objects.filter(boomerangue__in=boomerangues, status__in=['APROVADO', 'PAGO'])
        # Extraia os boomerangues dos SolicitacaoPagamentos aprovados ou pagos
    boomerangue_ids_comprados = boomerangues_comprou.values_list('boomerangue', flat=True)

    # Filtre os itens boomerangue usando os IDs dos boomerangues comprados
    itens_boomerangue = bmm_boomerangueitens.objects.filter(boomerangue__in=boomerangue_ids_comprados)
    itens_vendidos = itens_boomerangue.filter(Q(QuantidadeCompradaUN__gt=0) | Q(QuantidadeCompradaCX__gt=0))
    produtos_mais_vendidos = (itens_vendidos.annotate(total_comprado=Sum('QuantidadeCompradaUN')).order_by('-total_comprado')[:5])

    total_compras = boomerangues_comprou.aggregate(Sum('valor'))['valor__sum']
    tt_bmm = boomerangues.count()
    total_bmm_compras = boomerangues_comprou.count()
    sem_compras = tt_bmm - total_bmm_compras

    maior_compra = boomerangues_comprou.order_by('-valor').first()
    mais_recente = boomerangues_comprou.order_by('-data_tx').first()
    print("Mais Recente", mais_recente)
    abandonados = boomerangues.aggregate(CarrinhoAbandonado=Sum(
    Case(
        When(dt_ultima_compra__isnull=False, dt_ultima_compra__lte=Now() - timedelta(hours=6), bm_aceito='N', bm_com_erro='N', then=Value(1)),
            default=Value(0),
            output_field=IntegerField()
        )
    ))

    ultimo_acesso = boomerangues.order_by('-data_ult_open_web').first()

    logs = bmm_boomeranguelog.objects.filter(entidade_id = id).order_by('-DataLog')[:5]

    lead = StringPersonalizada.objects.get(chave = 'Leads', tipo_empresa=request.user.empresa.tipo_de_negocio, lingua = translation.get_language()).valor if StringPersonalizada.objects.filter(chave = 'Leads', tipo_empresa=request.user.empresa.tipo_de_negocio, lingua = translation.get_language()).exists() else 'Leads'
    context={"breadcrumb":{"parent":lead,"child":entidade.Entidade}, 'Produtos': produtos_mais_vendidos, 'boomerangues': boomerangues, 'total': total_compras, 'total_boomerangues': tt_bmm, 'total_bmm_compras': total_bmm_compras, 'sem_compra': sem_compras, 'maior_compra':maior_compra,
    'mais_recente':mais_recente,
    'abandonados': abandonados['CarrinhoAbandonado'],
    'ultimo_acesso':ultimo_acesso,
    'logs': logs,
    'entidade': entidade         
    }
    return render(request, 'entidade_consulta/entidade_consulta.html', context)



@verify(permission_codename = 'Boomerangues')
def boomerangues_list(request):
    context={"breadcrumb":{"parent":"Entidades","child":"Boomerangues"}}
    return render(request, 'resumodaentidade/boomerangues-list.html', context)

# pag campanhas_list
@verify(permission_codename='Campanhas')
def campanhas_list(request):
    print('TIPO DE NEGOCIO', request.user.empresa.tipo_de_negocio)
    campanhas = CampaignViewSet.retorna_queryCampanha(request.user.empresa)

    page_number = request.GET.get('page', 1)
    paginator = Paginator(campanhas, CustomPagination.page_size)
    campanhas_page = paginator.get_page(page_number)

    campanha_instance = bmm_campanha.objects.first()
    status_campanha_choices = dict(campanha_instance._meta.get_field('status_campanha').flatchoices)

    context = {
        "breadcrumb": {"parent": "Dashboard", "child": "Campanhas"},
        "campanhas_page": campanhas_page,
        'choices': status_campanha_choices,
        'bots': Bot.objects.filter(empresa=request.user.empresa, bot_ativo='S', statusregistro_id=200),
        "wpptemplates": wpp_templates.objects.filter(empresa=request.user.empresa, statusregistro_id=200),
    }

    return render(request, 'campanhas/campanhas.html', context)


# pag create_campaign
@verify(permission_codename = 'Criar campanha')
def create_campaign(request):
    empresa = request.user.empresa
    select_tipos_campanhas = select_tipo_campanha.objects.filter(tipo_empresa = request.user.empresa.tipo_de_negocio)
    gateways = gateway_pagamento.objects.filter(empresa=request.user.empresa, statusregistro_id=200)
    bots = Bot.objects.filter(empresa=request.user.empresa, statusregistro_id=200)
    context = {
        "breadcrumb":{"parent":"Dashboard","child":"Criar campanha"}, 
        'tipos_periodicidade': bmm_campanha.TIPOS_PERIODICIDADE,
        "templates": bmm_template.objects.filter(empresa=empresa, statusregistro_id=200, Ativo='S'), 
        'select_tipos_campanhas': select_tipos_campanhas, 
        'gateways': gateways,
        'bots':bots
    }
    return render(request, 'campanhas/create_new_campaign.html', context)

@verify(permission_codename='Campanhas')
def campanha_consulta(request, id):
    try:
        empresa_url = request.get_host().split('.')[0]
        try:
            empresa = ger_empresas.objects.get(url_boomerangue=empresa_url)
        except ger_empresas.DoesNotExist:
            return redirect('/login')

        boomerangues = bmm_boomerangue.objects.filter(campanha_id=id)
        autorizados = boomerangues.filter(entidade__StatusOptIN='S').count()


        # Soma para bm_enviado = 1 e bm_enviado = 0 em uma única consulta
        somas = boomerangues.aggregate(
            total_enviados_1=Sum(Case(When(bm_enviado=1, then=1), output_field=IntegerField())),
            total_enviados_0=Sum(Case(When(bm_enviado=0, then=1), output_field=IntegerField()))
        )

        # Acessa as somas
        mensagens_enviadas_1 = somas['total_enviados_1'] if somas['total_enviados_1'] is not None else 0
        mensagens_enviadas_0 = somas['total_enviados_0'] if somas['total_enviados_0'] is not None else 0

        # Calcula o total de mensagens
        total_mensagens = mensagens_enviadas_1 + mensagens_enviadas_0

        # Calcula a porcentagem de mensagens enviadas
        if total_mensagens > 0:
            porcentagem_enviadas = (mensagens_enviadas_1 / total_mensagens) * 100
            print("porcentage,s", porcentagem_enviadas)
        else:
            porcentagem_enviadas = 0

        resultado_orm = boomerangues \
        .values('bm_status','bm_aceito','entidade__StatusOptIN') \
        .annotate(
            nBoomerangue=Count('id'),
            total=Sum('valor_atual')
        ) \
        .order_by('bm_status')


        # Inicializa o dicionário de resultados agregados
        resultado_agregado = {
            'enviados': {'nBoomerangue': 0, 'total': 0},
            'entregues': {'nBoomerangue': 0, 'total': 0},
            'autorizou': {'nBoomerangue': 0, 'total': 0},
            'nao_autorizado': None,
            'doando': None,
            'vai_doar': None,
            'ja_doou': None,
            'doou': None
        }

        for item in resultado_orm:
            status = item['bm_status']
            
            # Agrupamento baseado no status
            if item['bm_aceito'] == 'S':  # Autorizou, Doou, Comprando/Doando, Comprou
                resultado_agregado['doou'] = item
            if status in ['S', 'E', 'Z', 'O', 'X', 'D', 'C']:  # Enviados e relacionados
                resultado_agregado['enviados']['nBoomerangue'] += item['nBoomerangue']
                resultado_agregado['enviados']['total'] += item['total']
            if status in ['E', 'Z', 'O', 'X', 'D', 'C']:  # Entregues
                resultado_agregado['entregues']['nBoomerangue'] += item['nBoomerangue']
                resultado_agregado['entregues']['total'] += item['total']
            if status == 'Z':  # Não Autorizado
                resultado_agregado['nao_autorizado'] = item


        resultado_agregado['autorizou']['nBoomerangue'] = autorizados

        resultado = boomerangues.aggregate(
            nBoomerangues=Count('id'),
            comprando=Count(Case(
                When(bm_status = 'D', then=Value(0)),
                output_field=IntegerField()
            )),
        )

        # Adiciona dados de vendas aprovadas ou pagas da tabela SolicitacaoPagamento
        vendas_aprovadas_ou_pagas = SolicitacaoPagamento.objects.filter(
            boomerangue__campanha_id=id,
            status__in=['APROVADO', 'PAGO']
        ).aggregate(
            total_vendas=Sum('valor'),
            qtd_vendas=Count('id')
        )


        # Obtém o valor total ou 0 se for None
        valor_total = vendas_aprovadas_ou_pagas['total_vendas'] or 0

        # Formata o valor total no padrão de moeda do Brasil
        valor_total_formatado = format_currency(valor_total, 'BRL', locale='pt_BR')

        select_tipos_campanhas = select_tipo_campanha.objects.filter(tipo_empresa=request.user.empresa.tipo_de_negocio.pk)
        itens_mais_vendidos = bmm_boomerangueitens.objects.filter(campanha_id=id) \
            .values('produto_id', 'produto__Descricao_Amigavel', 'unidade_venda', 'produto__PathProduto') \
            .annotate(
                qtdComprada=Sum('QuantidadeCompradaUN'),
                totalcompra=F('ValorMultimplicadorCompra'),
                nroPedidos=Count('boomerangue', distinct=True)
            ) \
            .filter(qtdComprada__gt=0, ValorTotalCompra__gt=0) \
            .order_by('produto__Descricao_Amigavel')[:5]

        campanha = bmm_campanha.objects.get(id=id, empresa=request.user.empresa)
        logs = bmm_boomeranguelog.objects.filter(boomerangue__campanha=campanha).order_by('-DataLog')[:25]
        produto_ids = bmm_boomerangueitens.objects.filter(campanha=id).values_list('produto', flat=True).distinct()
        queryset = []
        for produto_id in produto_ids:
            item = bmm_boomerangueitens.objects.filter(produto=produto_id).order_by('ordem').first()
            if item:
                queryset.append(bmm_boomerangueitens.objects.get(id=item.id))
        eventos = bmm_boomerangueevento.objects.filter(boomerangue__campanha=id).order_by('-DataGeracao')[:25]
        tipoevento_ids = set(evento.tipoevento_id for evento in eventos)
        fields = wpp_fields.objects.all()
        fields_json = serializers.serialize('json', fields)
        criatividades = ia_criatividade.objects.all()
        toms = ia_tomvoz.objects.all()
        gateways = gateway_pagamento.objects.filter(empresa=request.user.empresa, statusregistro_id=200)

        context = {
            'json_fields': fields_json,
            'gateways': gateways,
            'tipo_campanha': bmm_campanha.TIPOS_CAMPANHA,
            "breadcrumb": {"parent": "Campanhas", "child": CampaignViewSet.retorna_query_personalizada(id).Campanha},
            "campanha_id": campanha.id,
            'tipos_periodicidade': bmm_campanha.TIPOS_PERIODICIDADE,
            'status': dict(campanha._meta.get_field('status_campanha').flatchoices),
            'Campanha_dados': campanha,
            'entidades': bmm_boomeranguelog.objects.filter(boomerangue__campanha=campanha).values_list('entidade_id__pk', flat=True).distinct(),
            'eventos': eventos,
            'itens_mais_vendidos': itens_mais_vendidos,
            'resultados': resultado,
            'tipoevento_ids': tipoevento_ids,
            'templates': bmm_template.objects.filter(empresa=request.user.empresa, statusregistro_id=200, Ativo='S'),
            "bmm_campanhas_msgs": bmm_campanhas_msgs.objects.filter(campanha=campanha, statusregistro_id=200).values("id", "wpptemplate__template_name", "wpptemplate__category", "usotemplate", 'wpptemplate__id').order_by('-cadastro_dt')[:20],
            "wpptemplates_restantes": wpp_templates.objects.filter(empresa=empresa, statusregistro_id=200),
            "logs": logs,
            "items": queryset,
            'select_tipos_campanhas': select_tipos_campanhas,
            "categorias": [choice[0] for choice in wpp_templates._meta.get_field('category').choices],
            'bots': Bot.objects.filter(empresa=request.user.empresa, bot_ativo='S'),
            "categorias": [choice[0] for choice in wpp_templates._meta.get_field('category').choices],
            "componentes": [choice[0] for choice in wpp_templatescomponents._meta.get_field('component_type').choices],
            "formatos": [choice[0] for choice in wpp_templatescomponents._meta.get_field('format').choices],
            'criatividades': criatividades,
            'toms': toms,
            'fields': fields,
            'entregues': resultado_agregado['entregues'],
            'autorizou': resultado_agregado['autorizou'],
            'doando': resultado_agregado['doando'],
            'ja_doou': resultado_agregado['ja_doou'],
            'nao_autorizado': resultado_agregado['nao_autorizado'],
            'vai_doar': resultado_agregado['vai_doar'],
            'doou': resultado_agregado['doou'],
            'resultado_formatado':list(resultado_orm),
            'valor_total_formatado': valor_total_formatado,
            'total_vendas_aprovadas_ou_pagas': vendas_aprovadas_ou_pagas['total_vendas'],
            'qtd_vendas_aprovadas_ou_pagas': vendas_aprovadas_ou_pagas['qtd_vendas'],
            'mensagens_count': boomerangues.count(),
            'mensagens_enviadas': mensagens_enviadas_1,
            'mensagens_nao_enviadas': mensagens_enviadas_0,
            'porcentagem_enviadas': round(porcentagem_enviadas),
            'Total':boomerangues.count(),
        }

        return render(request, 'campanhas/campanha-consulta.html', context)
    except Exception as e:
        print(e)
        return render(request, 'error_page/error404.html')


def load_more_eventos_campanhas(request):
    page = int(request.GET.get('page', 1))
    id = int(request.GET.get('id', 1))
    items_per_page = 25
    start_index = (page - 1) * items_per_page
    end_index = start_index + 25  # Carregar mais 5 itens por vez
    items = bmm_boomerangueevento.objects.filter(boomerangue__campanha=id).order_by('-DataGeracao')[start_index:end_index]

    items_list = []

    for item in items:
        # Supondo que as variáveis como boomerangue_desc, entidade_desc, etc., são calculadas ou obtidas de algum lugar
        items_list.append({
        'id': item.pk,
        'tipoevento_id': item.tipoevento_id,  # Atributo do objeto item
        'origemevento_id': item.origemevento_id,  # Atributo do objeto item
        'DataGeracao': item.DataGeracao,  # Atributo do objeto item
        'ProtocoloGeracao': item.ProtocoloGeracao,  # Atributo do objeto item
        'DataProgramada': item.DataProgramada,  # Atributo do objeto item
        'statusevento_id': item.statusevento_id,  # Atributo do objeto item
        'ChaveBot': item.ChaveBot,  # Atributo do objeto item
        'NomeBot': item.NomeBot,  # Atributo do objeto item
        'DataBot': item.DataBot,  # Atributo do objeto item
        })

    return JsonResponse({'itens':items_list})


def load_more_logs_campanhas(request):
    page = int(request.GET.get('page', 1))
    id = int(request.GET.get('id', 1))
    items_per_page = 25
    start_index = (page - 1) * items_per_page
    end_index = start_index + 25  # Carregar mais 5 itens por vez
    items = bmm_boomeranguelog.objects.filter(boomerangue__campanha=id).order_by('-DataLog')[start_index:end_index]

    items_list = []

    for item in items:
        if hasattr(item, 'boomerangueitem'):
            bmm_item = item.boomerangueitem.produto.Descricao if item.boomerangueitem != None else ''
        # Supondo que as variáveis como boomerangue_desc, entidade_desc, etc., são calculadas ou obtidas de algum lugar
        items_list.append({
            'id': item.pk,
            'titulo_boomerangue': item.boomerangue.titulo_boomerangue,  # Substitua por como você obtém boomerangue_desc
            'tipolog_id': item.tipolog_id,  # Substitua por como você obtém tipolog_id
            'origemlog_id': item.origemlog_id,  # Substitua por como você obtém origemlog_id
            'Descricao': bmm_item,  # Substitua por como você obtém boomerangue_item_desc
            'boomerangueimportacao_id': item.boomerangueimportacao_id,  # Substitua por como você obtém boomerangueimportacao_id
            'entidade': item.entidade_id.Entidade,  # Substitua por como você obtém entidade_desc
            'entidade_id': item.entidade_id.pk,  # Substitua por como você obtém entidade_obj.pk
            'acao_id': item.acao_id,  # Substitua por como você obtém acao_id
            'acaoenviada_id': item.acaoenviada_id,  # Substitua por como você obtém acaoenviada_id
            'Token': item.Token,  # Substitua por como você obtém Token
            'Template': item.Template,  # Substitua por como você obtém o nome do template
            'DataLog': item.DataLog,  # Substitua por como você obtém DataLog
            'TempoLog': item.TempoLog,  # Substitua por como você obtém TempoLog
            'VerApiLog': item.VerApiLog,  # Substitua por como você obtém VerApiLog
            'Complemento1': item.Complemento1,  # Substitua por como você obtém Complemento1
        })

    return JsonResponse({'itens':items_list})

def load_more_messages_campanhas(request):
    page = int(request.GET.get('page', 1))
    id = int(request.GET.get('id', 1))
    items_per_page = 20
    start_index = (page - 1) * items_per_page
    end_index = start_index + 20  # Carregar mais 5 itens por vez
    items = bmm_campanhas_msgs.objects.filter(campanha=id, statusregistro_id=200).order_by('-cadastro_dt')[start_index:end_index]

    items_list = [{"template_name": item.wpptemplate.template_name, "pk": item.pk, 'categoria': item.wpptemplate.category, 'usotemplate': item.usotemplate, 'wpptemplate_id': item.wpptemplate.pk} for item in items]

    return JsonResponse({'items': items_list})

def load_more_boomerangues(request):
    page = int(request.GET.get('page', 1))
    id = int(request.GET.get('id', 1))
    items_per_page = 25
    start_index = (page - 1) * items_per_page
    end_index = start_index + 25  # Carregar mais 5 itens por vez
    items = bmm_boomerangue.objects.filter(campanha=id, statusregistro_id=200).order_by('-cadastro_dt')[start_index:end_index]
    print('inicio', start_index, 'fim', end_index)
    items_list = [{"titulo_boomerangue": item.entidade.Entidade, "pk": item.pk, 'campanha_nome': item.campanha_nome,'vendidos':item.TotalQuantidade, 'produtosTotal': item.TotalProdutos, 'totalboomerangue': item.valor_atual} for item in items]

    return JsonResponse({'items': items_list})


@verify(permission_codename = 'Adicionar cond Pagto')
def boomerangue_create(request):
    context={"breadcrumb":{"parent":"Boomerangues","child":"Criar Boomerangue"}, "Campanhas": CampaignViewSet.retorna_queryCampanha(request.user.empresa), "templates": bmm_TemplateViewSet.retorna_query(request.user.empresa), 'condicoes': createCondPagamentoViewSet.retorna_query(request.user.empresa), "transportadoras": createTransportadoraViewSet.retorna_query(request.user.empresa), "Vendedores": createVendedoresViewSet.retorna_query(request.user.empresa), "Entidades": createEntidadeViewSet.retorna_query(request.user.empresa)}
    return render(request, 'boomerangues/boomerangues-create.html', context)

@verify(permission_codename = 'Empresas')
def empresa_create(request):
    context={"breadcrumb":{"parent":"Empresas","child":"Criar Empresa",}}
    return render(request, 'empresas/empresas-create.html', context)

@verify(permission_codename = 'Empresas')
def empresa_list(request):
    if request.user.empresa.tipo_de_negocio.value_prefixo == 'ADMIN':
        empresas = ger_empresas.objects.all()
        gpt_modelo = gpt_engine.objects.all()
    else:
        empresas = createEmpresaViewSet.retorna_query_personalizada(request.user.empresa.pk)
        gpt_modelo = ''
    
    context={"breadcrumb":{"parent":"Empresas","child":"Empresas"}, "empresas": empresas, "gpt_modelo": gpt_modelo}
    return render(request, 'empresas/empresas-list.html', context)

@verify(permission_codename = 'Adicionar cond Pagto')
def condicao_pagamento_create(request):
    context={"breadcrumb":{"parent":"Empresas","child":"Criar Condição pagamento"}, 'empresa': request.user.empresa}
    return render(request, 'condicao-pagamentos/condicao_pagamento.html', context)

@verify(permission_codename = 'Listar cond Pagto')
def condicao_pagamento_list(request):
    context={"breadcrumb":{"parent":"Empresas","child":"Condições de Pagamento"}, "condicoes": createCondPagamentoViewSet.retorna_query(request.user.empresa)}
    return render(request, 'condicao-pagamentos/condicao_pagamento_list.html', context)

@verify(permission_codename = 'Adicionar transportadoras')
def transportadora_create(request):
    context={"breadcrumb":{"parent":"Transportadoras","child":"Add Transportadora"}}
    return render(request, 'transportadoras/transportadoras-create.html', context)


@verify(permission_codename = 'Listar transportadoras')
def transportadora_list(request):
    context={"breadcrumb":{"parent":"Transportadoras","child":"Transportadoras"},"transportadoras": createTransportadoraViewSet.retorna_query(request.user.empresa)}
    return render(request, 'transportadoras/transportadoras-list.html', context)


@verify(permission_codename = 'Adicionar vendedores')
def vendedores_create(request):
    context={"breadcrumb":{"parent":"Vendedores","child":"Add vendedores"},"transportadoras": createTransportadoraViewSet.retorna_query(request.user.empresa), 'condicoes': createCondPagamentoViewSet.retorna_query(request.user.empresa)}
    return render(request, 'vendedores/vendedores-create.html', context)

@verify(permission_codename = 'Listar vendedores')
def vendedores_list(request):
    context={"breadcrumb":{"parent":"Vendedores","child":"Lista Vendedores"}, "vendedores": createVendedoresViewSet.retorna_query(request.user.empresa) ,"transportadoras": createTransportadoraViewSet.retorna_query(request.user.empresa), 'condicoes': createCondPagamentoViewSet.retorna_query(request.user.empresa)}
    return render(request, 'vendedores/vendedores-list.html', context)

@verify(permission_codename = 'Boomerangues Templates')
def boomerangue_template(request):
    empresa_url = request.get_host().split('.')[0]
    try:
        empresa = ger_empresas.objects.get(url_boomerangue = empresa_url)
    except ger_empresas.DoesNotExist:
        return redirect('/login')
    
    context={
        "breadcrumb":{"parent":"Boomerangues","child":"Boomerangues Templates"}, 
        "templates": bmm_TemplateViewSet.retorna_query(request.user.empresa), 
        "wpp_templates": wpp_templates.objects.filter(empresa=empresa),
        "tipos": bmm_template.TIPOS_CAMPANHAS
    }
    return render(request, 'boomerangues/boomerangues-templates.html', context)

def load_more_templates(request):
    page = int(request.GET.get('page', 1))
    items_per_page = 25
    start_index = (page - 1) * items_per_page
    end_index = start_index + 25  # Carregar mais 5 itens por vez
    items = bmm_template.objects.filter(statusregistro_id=200, empresa=request.user.empresa).order_by('-cadastro_dt')[start_index:end_index]

    items_list = [{"nome": item.nome_template, "pk": item.pk, 'texto_principal': item.texto_header, 'ativo': item.Ativo} for item in items]

    return JsonResponse({'items': items_list})

@verify(permission_codename = 'Boomerangues Templates')
def boomerangue_template_id(request, id):
    try:
        template = bmm_template.objects.get(pk=id, empresa = request.user.empresa)
        context={
            "breadcrumb":{"parent":"Boomerangues","child": f"{id} - {template.nome_template}"}, "template": bmm_TemplateViewSet.retorna_query_personalizada(id), 
            "mensagens": bmm_template_msgs.objects.filter(template=id, statusregistro_id=200).order_by('-cadastro_dt')[:25],
            "csv_importados": bmm_templateimportado.objects.filter(template=id, statusregistro_id=200).order_by('-DataHora')[:25],
            "wpp_templates": wpp_templates.objects.filter(empresa= request.user.empresa, statusregistro_id=200),
            "items": {
                "items": bmm_template_itens.objects.filter(template=id).order_by('ordem')[:50],
                "template": template,
                "boomerangues": bmm_boomerangue.objects.filter(empresa=request.user.empresa, statusregistro_id=200),
                "campanhas": bmm_campanha.objects.filter(empresa=request.user.empresa, CampanhaAtiva="S", statusregistro_id=200),
                "produtos": ger_produtos.objects.filter(empresa=request.user.empresa, statusregistro_id=200)
            }
        }
        return render(request, 'boomerangues/template-consulta.html', context)
    except Exception as e:
        print(e)
        return render(request, 'error_page/error404.html')


def load_more_itens_templates(request):
    page = int(request.GET.get('page', 1))
    id = int(request.GET.get('id'))
    items_per_page = 50
    start_index = (page - 1) * items_per_page
    end_index = start_index + 50  # Carregar mais 50 itens por vez

    items = bmm_template_itens.objects.filter(template=id).order_by('ordem')[start_index:end_index]

    items_list = []
    for item in items:
        produto_desc = None
        arquivo_import = None

        if item.produto_id:
            try:
                produto_obj = ger_produtos.objects.get(pk=item.produto_id)
                produto_desc = produto_obj.Descricao
                imagem = produto_obj.PathProduto
            except ger_produtos.DoesNotExist:
                print(f"Warning: wppt_templates com ID {item.produto_id} não encontrado.")

        else:
            imagem = ''
            produto_desc = ''


        if item.templateimportado_id:
            try:
                importado_obj = bmm_templateimportado.objects.get(pk=item.templateimportado_id)
                arquivo_import = importado_obj.NomeArquivo
            except bmm_templateimportado.DoesNotExist:
                print(f"Warning: wppt_templates com ID {item.templateimportado_id} não encontrado.")

        else:
            arquivo_import=''

        item_data = {
            'id': item.id,
            'imagem': item.produto.PathProduto,
            'valor_atacado': item.valor_atacado,
            'valor_unitario': item.valor_unitario,
            'valor_total_item': item.valor_total_item,
            'unidade_venda': item.unidade_venda,
            'produto_bloqueado': item.produto_bloqueado,
            'descricao': produto_desc,
            'unidade_caixa': item.unidade_caixa,
            'arquivo_import': arquivo_import,
            'imagem':imagem
        }
        items_list.append(item_data)

    return JsonResponse({'items': items_list})


# Carrega itens na pagina grupo produtos quando usuário chega ao final da tela
def load_more_items_tmplates_importados(request):
    page = int(request.GET.get('page', 1))
    id = int(request.GET.get('id'))
    print(id)
    items_per_page = 25
    start_index = (page - 1) * items_per_page
    end_index = start_index + 25  # Carregar mais 5 itens por vez
    items = bmm_templateimportado.objects.filter(
        template=id,
    ).order_by('-DataHora')[start_index:end_index]

    items_list = [{"NomeArquivo": item.NomeArquivo, "pk": item.pk, 'data': item.DataHora, 'tipo_arquivo': item.tipo_arquivo, 'statusarquivo_id': item.statusarquivo_id, 'Caminho': str(item.Caminho), 'retorno_arquivo': item.retorno_arquivo} for item in items]

    return JsonResponse({'items': items_list})


# Carrega itens na pagina grupo produtos quando usuário chega ao final da tela
def load_more_mensagens_templates(request):
    page = int(request.GET.get('page', 1))
    id = int(request.GET.get('id'))
    items_per_page = 25
    start_index = (page - 1) * items_per_page
    end_index = start_index + 25  # Carregar mais 5 itens por vez
    items = bmm_template_msgs.objects.filter(template=id, statusregistro_id=200).order_by('-cadastro_dt')[start_index:end_index]
    items_list = [{"template_name": item.wpptemplate.template_name, "pk": item.pk, 'categoria': item.wpptemplate.category, 'language': item.wpptemplate.language, 'usotemplate': item.usotemplate, 'wpp_id': item.wpptemplate.pk} for item in items]
    return JsonResponse({'items': items_list})


@verify(permission_codename = 'Boomerangues')
def boomerangue_previa(request, id):
    template = bmm_template.objects.get(id = id, empresa = request.user.empresa, statusregistro_id = 200)
    
    if bmm_boomerangue.objects.filter(empresa=request.user.empresa, statusregistro_id=200).exists():
        if bmm_boomerangue.objects.filter(template=template.pk).exists():
            dados = bmm_boomerangue.objects.filter(template=template.pk).first()
        else:
            dados = bmm_boomerangue.objects.filter(empresa=request.user.empresa,  statusregistro_id=200).first()
            
        if bmm_boomerangueitens.objects.filter(boomerangue=dados.pk).order_by('ordem').exists():
            produtos = bmm_boomerangueitens.objects.filter(boomerangue=dados.pk).order_by('ordem')
        else:
            # Carregar produtos pré-definidos
            produtos = get_produtos_predefinidos()
    else:
        produtos = get_produtos_predefinidos()
        dados = get_dados()
    try:
        distribuidor = ger_distribuidor.objects.get(cod_puxada=dados.cod_puxada, statusregistro_id = 200)
        cnpj = dados.entidade.CNPJ[:10] + '...'
        condicoes = ger_condicoespagamento.objects.filter(empresa = dados.empresa.pk, statusregistro_id = 200)
    except:
        distribuidor = MockDistribuidor('Distribuidor_Teste')
        cnpj = '123.456...'
        condicoes = empty_queryset()
    context = {"template": template,"dados":dados, "produtos": produtos, 'condicoes': condicoes, "distribuidor": distribuidor.distribuidor, 'cnpj': cnpj, 'image_footer': template.image_footer, 'image_banner_pc': template.image_banner_pc, 'image_banner_mobile': template.image_banner_mobile}
    return render(request, 'boomerangue_vendas/tela_principal.html', context)

# simula uma queryset quando não existe
class MockProduto:
    def __init__(self, pk, descricao_amigavel, sku, multiplo_boomerangue, quantidade_minima, quantidade_maxima, valor_total_item, valor_sem_desconto, percentual_desconto, path_produto, quantidade_comprada_un, valor_total_compra):
        self.pk = pk
        self.produto = MockDetalheProduto(descricao_amigavel, sku, path_produto)
        self.multiplo_boomerangue = multiplo_boomerangue
        self.quantidade_minima = quantidade_minima
        self.quantidade_maxima = quantidade_maxima
        self.valor_total_item = valor_total_item
        self.valor_sem_desconto = valor_sem_desconto
        self.percentual_desconto = percentual_desconto
        self.QuantidadeCompradaUN = quantidade_comprada_un
        self.ValorTotalCompra = valor_total_compra

class MockDetalheProduto:
    def __init__(self, descricao_amigavel, sku, path_produto):
        self.Descricao_Amigavel = descricao_amigavel
        self.SKU = sku
        self.PathProduto = path_produto

class MockDados:
    def __init__(self,pk, token_bm, chave_busca, bm_aceito, entidade, TotalProdutos, compra_minima_vlr, bm_ativo, tipo_frete):
        self.pk = pk
        self.token_bm = token_bm
        self.chave_busca = chave_busca
        self.bm_aceito = bm_aceito
        self.entidade = entidade
        self.TotalProdutos = TotalProdutos
        self.compra_minima_vlr = compra_minima_vlr
        self.bm_ativo = bm_ativo
        self.tipo_frete = tipo_frete

def get_dados():
    return MockDados(
            pk=1, token_bm='1231414141414', chave_busca="123", 
            bm_aceito='N', entidade='teste', TotalProdutos=0.000, 
            compra_minima_vlr=0.0000, bm_ativo="S", tipo_frete='C'
        )
        # Adicione mais produtos conforme necessário


def get_produtos_predefinidos():
    # Retorna uma lista de produtos mock
    return [
        MockProduto(
            pk=1, descricao_amigavel="Produto 1", sku="SKU1", 
            multiplo_boomerangue=1, quantidade_minima=1, quantidade_maxima=10, 
            valor_total_item=100, valor_sem_desconto=120, percentual_desconto=20, 
            path_produto="assets/images/products_examples/camisa.jpg", quantidade_comprada_un=2, valor_total_compra=200
        ),
        # Adicione mais produtos conforme necessário
    ]
class MockDistribuidor:
    def __init__(self, distribuidor_nome):
        self.distribuidor = distribuidor_nome

class MockCondicoesPagamento:
    def __init__(self, condicao_nome):
        self.condicao = condicao_nome

def empty_queryset():
    return []




@verify(permission_codename = 'Boomerangues')
def boomerangue_list(request):
    context={"breadcrumb":{"parent":"Boomerangues","child":"Boomerangues"}, "Boomerangues": bmm_boomerangueViewSet.retorna_query(request.user.empresa)}
    return render(request, 'boomerangues/boomerangue-list.html', context)

@verify(permission_codename = 'Boomerangues')
def boomerangue_consulta(request, id):
    try:
        boomerangue = bmm_boomerangue.objects.get(id = id, empresa = request.user.empresa)
        produtos = bmm_boomerangueitens.objects.filter(
            Q( QuantidadeCompradaCX__gt=0 ) | Q( QuantidadeCompradaUN__gt=0),
            boomerangue__pk=boomerangue.pk
        )
        # Define o locale para o Brasil

        # Realiza a consulta e soma os valores
        resultado = SolicitacaoPagamento.objects.filter(
            boomerangue=id, 
            status__in=["APROVADO", "PAGO"]
        ).aggregate(total=Sum('valor'))

        # Obtém o valor total ou 0 se for None
        valor_total = resultado['total'] or 0

        # Formata o valor total no padrão de moeda do Brasil
        valor_total_formatado = format_currency(valor_total, 'BRL', locale='pt_BR')
        logs = bmm_boomeranguelog.objects.filter(boomerangue = boomerangue.pk).order_by('-DataLog')[:10]
        context={"breadcrumb":{"parent":"Boomerangues","child":boomerangue.entidade.Entidade},
                 "Boomerangue": boomerangue, "Produtos": produtos, "logs": logs, "valor":valor_total_formatado}
        
        return render(request, 'boomerangue_consulta/boomerangue-consulta.html', context)
    except Exception as e:
        print(e)
        return render(request, 'error_page/error404.html')

@verify(permission_codename = 'Bot Canal')
def bot_canal_list(request):
    context={"breadcrumb":{"parent":"Bot","child":"Bot Canal"},"bot_canais": bot_canal.objects.filter(empresa = request.user.empresa,statusregistro_id = 200).order_by('-cadastro_dt'), "provedores": bot_provedor.objects.filter(empresa = request.user.empresa,statusregistro_id = 200).order_by('-cadastro_dt')}
    return render(request, 'bot_canal/bot_canal.html', context)


@verify(permission_codename = 'Bot Canal Empresa')
def bot_canalempresa_list(request):
    context={"breadcrumb":{"parent":"Bot","child":"Bot Canal Empresa"},"canais": bot_canalempresa.objects.filter(empresa = request.user.empresa, statusregistro_id = 200).order_by('-cadastro_dt'),"canais_bots": bot_canal.objects.filter(empresa = request.user.empresa, statusregistro_id = 200).order_by('-cadastro_dt'), "bots": Bot.objects.filter(empresa = request.user.empresa, statusregistro_id = 200).order_by('-cadastro_dt')}
    return render(request, 'bot_canalempresa/bot_canalempresa.html', context)


@verify(permission_codename = 'Bot Provedor')
def bot_provedor_list(request):
    admin = request.user.empresa.tipo_de_negocio.value_prefixo
    empresa_admin = ger_empresas.objects.filter(tipo_de_negocio__value_prefixo='ADMIN')
    # Obter bot_provedores da empresa do usuário
    provedores_usuario = bot_provedor.objects.filter(empresa=request.user.empresa, statusregistro_id=200)

    # Obter bot_provedores da empresa admin
    provedores_admin = bot_provedor.objects.filter(empresa__in=empresa_admin, statusregistro_id=200, provedor_teste='N')

    # Juntar as duas listas
    provedores = provedores_usuario.union(provedores_admin).order_by('-cadastro_dt')

    context={"breadcrumb":{"parent":"Bot","child":"Bot Provedores"},"provedores": provedores, 'admin':admin, 'id_empresa': request.user.empresa.pk, 'provedores_options': [(choice[0], choice[1]) for choice in bot_provedor._meta.get_field('provedor_padrao').choices]}
    return render(request, 'bot_provedor/bot_provedor.html', context)


@verify(permission_codename = 'Bots')
def bots(request):
    empresa_admin = ger_empresas.objects.filter(tipo_de_negocio__value_prefixo='ADMIN')
    # Obter bot_provedores da empresa do usuário
    provedores_usuario = bot_provedor.objects.filter(empresa=request.user.empresa, statusregistro_id=200)

    # Obter bot_provedores da empresa admin
    provedores_admin = bot_provedor.objects.filter(empresa__in=empresa_admin, statusregistro_id=200, provedor_teste='N')

    # Juntar as duas listas
    provedores = provedores_usuario.union(provedores_admin).order_by('-cadastro_dt')
    context={"breadcrumb":{"parent":"Bot","child":"Bots"},"bots": Bot.objects.filter(empresa = request.user.empresa, statusregistro_id = 200).order_by('-cadastro_dt'), "bots_tipos": [choice[0] for choice in Bot._meta.get_field('bot_tipo').choices], "bot_canais": bot_canal.objects.filter(empresa = request.user.empresa,statusregistro_id = 200).order_by('-cadastro_dt'), "provedores": provedores}
    return render(request, 'bots/bots.html', context)

def bot_consulta(request, id):
    bot = Bot.objects.get(pk=id)
    context = {
        "breadcrumb": {
            "parent":f"{bot.bot}",
            "child": f"{bot.bot}"
        },
        "bot": bot,
    }
    return render(request, 'bot_consulta/bot_consulta.html', context)

@verify(permission_codename = 'Categorias')
def ger_categorias_list(request):
    context={"breadcrumb":{"parent":"Geral","child":"Ger Categorias"},"ger_categorias": ger_categorias.objects.filter(empresa = request.user.empresa, statusregistro_id = 200).order_by('-cadastro_dt')}
    return render(request, 'ger_categorias/ger_categorias.html', context)

@verify(permission_codename = 'Grades')
def ger_grade_list(request):
    context={"breadcrumb":{"parent":"Geral","child":"Ger Grades"},"ger_grade": ger_grade.objects.filter(empresa = request.user.empresa, statusregistro_id = 200).order_by('-cadastro_dt')}
    return render(request, 'ger_grade/ger_grade.html', context)


@verify(permission_codename = 'Grupos de Produtos')
def ger_grupoprodutos_list(request):
    context={"breadcrumb":{"parent":"Geral","child":"Grupo Produtos"},"ger_grupoprodutos": ger_grupoprodutos.objects.filter(empresa = request.user.empresa, statusregistro_id = 200).order_by('-cadastro_dt')[:25]}
    return render(request, 'ger_grupoprodutos/ger_grupoprodutos.html', context)

# Carrega itens na pagina grupo produtos quando usuário chega ao final da tela
def load_more_items(request):
    page = int(request.GET.get('page', 1))
    items_per_page = 25
    start_index = (page - 1) * items_per_page
    end_index = start_index + 25  # Carregar mais 5 itens por vez
    items = ger_grupoprodutos.objects.filter(
        empresa_id=request.user.empresa,
        statusregistro_id=200
    ).order_by('-cadastro_dt')[start_index:end_index]

    items_list = [{"nome": item.GrupoProdutos, "pk": item.pk, 'data': item.cadastro_dt, 'ordem': item.OrdemGrupoProdutos, 'ativo': item.grupoAtivo} for item in items]

    return JsonResponse({'items': items_list})


@verify(permission_codename = 'Linhas de Produtos')
def ger_linhaprodutos_list(request):
    context={
        "breadcrumb":{"parent":"Geral","child":"Linha Produtos"},
        "ger_linhaprodutos": ger_linhaprodutos.objects.all()
    }
    return render(request, 'ger_linhaprodutos/ger_linhaprodutos.html', context)

@verify(permission_codename = 'Linhas de Produtos')
def ger_linhaprodutos_create(request):
    return render(request, 'ger_linhaprodutos/ger_linhaprodutos_create.html')


@verify(permission_codename = 'Listar transportadoras')
def ger_marcas_list(request):
    context={"ger_marcas": createMarcasViewSet.retorna_query()}
    return render(request, 'ger_marcas/ger_marcas.html', context)

@verify(permission_codename = 'Whatsapp Template')
def wpp_template(request):
    templates = wpp_templates.objects.filter(empresa=request.user.empresa, statusregistro_id=200).order_by('-cadastro_dt')
    criatividades = ia_criatividade.objects.all()
    toms = ia_tomvoz.objects.all()
    fields = wpp_fields.objects.all()
    fields_json = serializers.serialize('json', fields)
    opcoes =  callToAction._meta.get_field('opcoes').choices
    bots_sendpulse = Bot.objects.filter(empresa = request.user.empresa, statusregistro_id=200, bot_provedor__provedor_padrao = 'SPL')
    possui_gateway = gateway_pagamento.objects.filter(empresa=request.user.empresa, statusregistro_id=200).exists()
    context={"breadcrumb":{"parent":"Whatsapp","child":"Whatsapp Template"},'json_fields': fields_json,"wpp_templates": templates, 'opcoes': opcoes, "categorias": [choice[0] for choice in wpp_templates._meta.get_field('category').choices], "componentes": [choice[0] for choice in wpp_templatescomponents._meta.get_field('component_type').choices], "formatos": [choice[0] for choice in wpp_templatescomponents._meta.get_field('format').choices], 'criatividades': criatividades, 'toms': toms, 'fields': fields, 'bots': bots_sendpulse, 'possui_gateway': possui_gateway}
    return render(request, 'wpp_templates/wpp_templates.html', context)


@verify(permission_codename = 'Gateways Pagamento')
def payment_gateways(request):
    context={"breadcrumb":{"parent":"Gateways Pagamento"},
    "gateways": gateway_pagamento.TIPOS_GATEWAY,
    "lista": gateway_pagamento.objects.filter(empresa = request.user.empresa, statusregistro_id=200),
    }
    return render(request, 'gateways_payments/gateways_payments.html', context)


@verify(permission_codename = 'Whatsapp')
def wpp_componente(request):
    context={"breadcrumb":{"parent":"Whatsapp","child":"Whatsapp Componente"},"templates": wpp_templates.objects.filter(empresa = request.user.empresa, statusregistro_id = 200),"wpp_componente": wpp_templatescomponents.objects.filter(statusregistro_id = 200), "componentes": [choice[0] for choice in wpp_templatescomponents._meta.get_field('component_type').choices], "formatos": [choice[0] for choice in wpp_templatescomponents._meta.get_field('format').choices]}
    return render(request, 'wpp_components/wpp_components.html', context)

@verify(permission_codename = 'Listar transportadoras')
def ger_marcas_create(request):
    return render(request, 'ger_marcas/ger_marcas_create.html')


@verify(permission_codename = 'Produtos')
def ger_produtos_list(request):
    empresa_url = request.get_host().split('.')[0]
    try:
        empresa = ger_empresas.objects.get(url_boomerangue = empresa_url)
    except ger_empresas.DoesNotExist:
        return redirect('/login')
    
    context={
        "breadcrumb":{"parent":"Geral","child":"Produtos"},
        "ger_produtos": ger_produtos.objects.filter(empresa = empresa, statusregistro_id = 200),
        "ger_categorias": ger_categorias.objects.filter(empresa = empresa, statusregistro_id = 200).values("id", "Categoria"),
        "ger_marcas": ger_marcas.objects.filter(empresa = empresa).values("id", "Marca"),
        "ger_grades": ger_grade.objects.filter(empresa = empresa, statusregistro_id = 200).values("id", "Grade"),
        "ger_unidademedidas": ger_unidademedida.objects.all().values("id", "UnidadeMedida"),
        "ger_linhaprodutos": ger_linhaprodutos.objects.filter(empresa = empresa, statusregistro_id = 200).values("id", "LinhaProdutos"),
        "ger_grupoprodutos": ger_grupoprodutos.objects.filter(empresa = empresa, statusregistro_id = 200).values("id", "GrupoProdutos")
    }
    return render(request, 'ger_produtos/ger_produtos.html', context)

@verify(permission_codename = 'Produtos')
def ger_produtos_create(request):
    return render(request, 'ger_produtos/ger_produtos_create.html')


@verify(permission_codename = 'Listar transportadoras')
def ger_unidademedida_list(request):
    context={}
    return render(request, 'ger_unidademedida/ger_unidademedida.html', context)

@verify(permission_codename = 'Listar transportadoras')
def ger_unidademedida_create(request):
    return render(request, 'ger_unidademedida/ger_unidademedida_create.html')

def login(request):
    url_atual = request.get_host()
    if url_atual.split(':')[0] not in ALLOWED_HOSTS: #se estiver acessando pelo subdomínio, redireciona pro principal
        protocolo = 'https://' if request.is_secure() else 'http://'
        return HttpResponseRedirect(protocolo + url_atual[url_atual.index('.')+1:])
    else: # se estiver acessando pelo domínio principal, mas estiver logado, redireciona pro subdomínio da empresa
        try:
            token = TokenTemp.objects.get(token=request.COOKIES["token"])
            protocolo = 'https://' if request.is_secure() else 'http://'
            return HttpResponseRedirect(protocolo + token.usuario.empresa.url_boomerangue + '.' + url_atual + f'/auth/users/login_redirected/?token={token.token}')
        except:
            pass

    return render(request, 'auth/login-bs-tt-validation/login-bs-tt-validation.html')

def signup(request):
    url = request.get_host().split(':')[0]
    context = {
        'tipo_de_negocio': ger_tipoempresa.objects.filter(statusregistro_id = 200).exclude(value_prefixo__startswith='ADMIN')
    }
    if url not in ALLOWED_HOSTS:
        return HttpResponse(status=404)
    
    return render(request, 'auth/sign-up-one/sign-up-one.html', context)

@verify(permission_codename = 'Usuários')
def usuarios_list(request):
    empresa_url = request.get_host().split('.')[0]
    try:
        empresa = ger_empresas.objects.get(url_boomerangue = empresa_url)
    except ger_empresas.DoesNotExist:
        return redirect('/login')
    
    context={
        "usuarios": Usuario.objects.filter(empresa = empresa, statusregistro_id = 200),
        "grupos": Grupos.objects.filter(empresa = empresa),
        "modelos": [model.__name__.lower() for model in apps.get_models()],
    }
    return render(request, 'painel_admin/usuarios/contacts.html', context)

@verify(permission_codename = 'Grupos de Permissão')
def grupos_permissao_list(request):
    empresa_url = request.get_host().split('.')[0]
    try:
        empresa = ger_empresas.objects.get(url_boomerangue = empresa_url)
    except ger_empresas.DoesNotExist:
        return redirect('/login')
    
    grupos = Grupos.objects.filter(empresa = empresa)
    for grupo in grupos:
        grupo.usuarios = Usuario.objects.filter(grupo = grupo)

    context={
        "grupos": grupos
    }
    return render(request, 'painel_admin/grupos-permissao/grupos-permissao.html', context)

@verify(permission_codename = 'Inteligência Artificial')
def ia(request):
    context={"breadcrumb":{"parent":"Ajudante IA","child":"Inteligência Artificial"}}
    return render(request, 'ia/pagina-ia.html', context)


@verify(permission_codename = 'Histórico de vendas')
def historico(request):
    # Obter os primeiros 5 boomerangues
    boomerangues = SolicitacaoPagamento.objects.filter(
        status__in=['PAGO', 'APROVADO'],
        empresa=request.user.empresa
    ).order_by('-data_tx')[:10]
    
    print("boomerangues", boomerangues)
    # Somando os valores de todos os boomerangues
    total_aggregation = SolicitacaoPagamento.objects.filter(
        status__in=['PAGO', 'APROVADO'],
        empresa=request.user.empresa
    ).aggregate(total=Sum('valor'))
    
    # Verifique se a chave 'total' está no dicionário e atribua 0.00 se não estiver
    total = total_aggregation.get('total', 0.00) or 0.00

    print("TOTALL", total)
    lingua = translation.get_language()
    string = StringPersonalizada.objects.get(chave='vendas', lingua=lingua, tipo_empresa = request.user.empresa.tipo_de_negocio).valor

    context={"breadcrumb":{"parent":"Histórico De "+str(string),"child":"Historico "+str(string)}, 'Boomerangues': boomerangues, 'count': boomerangues.count(), "total": total}

    return render(request, 'historico_vendas/historico.html', context)

def load_more_history(request):
    page = int(request.GET.get('page', 1))
    items_per_page = 10
    start_index = (page - 1) * items_per_page
    end_index = start_index + 10  # Carregar mais 25 itens por vez
    items = SolicitacaoPagamento.objects.filter(
        Q(status = 'APROVADO') | Q(status = 'PAGO'),
        empresa=request.user.empresa
    ).order_by('-data_tx')[start_index:end_index]

    items_list = []

    for item in items:
        # Supondo que as variáveis como boomerangue_desc, entidade_desc, etc., são calculadas ou obtidas de algum lugar
        items_list.append({
            'id': item.pk,
            'entidade':item.boomerangue.entidade.pk,
            'entidade_nome': item.boomerangue.entidade.Entidade,
            'entidade_cnpj': item.boomerangue.entidade.CNPJNumerico,
            'TotalBoomerangue': item.valor,
            'campanhaNome': item.boomerangue.campanha.Campanha,
            'data_tx': item.data_tx,
            'boomerangue_status': item.boomerangue.bm_status,
            'boomerangue': item.boomerangue.pk,
            'valor': item.valor,
        })

    return JsonResponse({'itens':items_list})


def pix_gerados(request):

    context={"breadcrumb":{"parent":"CRM","child":"Pix Gerados"}}

    return render(request, 'pix_gerados/pix_gerados.html', context)


@verify(permission_codename = 'Painel Plug')
def painel_plug(request):
    tipos_de_negocios = ger_tipoempresa.objects.filter(statusregistro_id = 200)
    permissoes = permissoes_paginas.objects.all()
    strings = StringPersonalizada.objects.all()
    criatividades = ia_criatividade.objects.all()
    toms = ia_tomvoz.objects.all()
    versoes = gpt_engine.objects.all()
    ia_prompt = ia_prompt_settings.objects.get(id=1)
    fields = wpp_fields.objects.all()
    context={"breadcrumb":{"parent":"Plug Admin","child":"Plug Admin"}, 'tipos_de_negocios': tipos_de_negocios, 'permissoes': permissoes, 'strings': strings, 'criatividades': criatividades, 'toms': toms, 'versoes': versoes, 'ia_prompt': ia_prompt,'fields': fields}

    return render(request, 'painel_plug/painel_plug.html', context)


def Erro_404(request):
    return render(request, 'error_page/error404.html')    

@verify(permission_codename='Mensagens')
def chat(request):
    campanhas = bmm_campanha.objects.filter(empresa=request.user.empresa, statusregistro_id=200)

    # Obtém o nome da empresa e formata corretamente
    nome_empresa = request.user.empresa.empresa_apelido.lower().strip()
    empresa = re.sub(r"[^a-z0-9]", "", nome_empresa)
    print("empresa:", empresa)

    # Obtém todos os templates da empresa
    todos_templates = wpp_templates.objects.filter(empresa=request.user.empresa, statusregistro_id=200, status='APPROVED')
    
    # Lista para armazenar os templates encontrados
    templates_filtrados = []
    
    # Itera sobre os templates e verifica se o nome da empresa está contido no nome do template
    for template in todos_templates:
        template_name_cleaned = re.sub(r"[^a-z0-9]", "", template.template_name.lower())
        print("Template processado:", template_name_cleaned)
        
        # Verifica se 'bigfoods' está contido no nome do template
        if empresa in template_name_cleaned:  # Você pode ajustar esta string conforme necessário
            templates_filtrados.append(template)

    print("Total de templates encontrados:", len(templates_filtrados))
    print("Templates filtrados:", [t.template_name for t in templates_filtrados])

    context = {
        "breadcrumb": {"parent": "Chat", "child": "Mensagens"},
        "campanhas": campanhas,
        "nome_user": request.user.nome,
        "templates": templates_filtrados
    }

    return render(request, 'mensagens/mensagens.html', context)


@verify(permission_codename = 'Agendamentos')
def agendamentos(request):
    try:
        campos_dinamicos = Atributo.objects.filter(tipo_empresa = request.user.empresa.tipo_de_negocio)
    except Atributo.DoesNotExist:
        campos_dinamicos = None
    context={"breadcrumb":{"parent":"Agendamentos","child":"Agendamentos"}, "campos_dinamicos":campos_dinamicos}
    return render(request, 'agendamentos/agendamentos.html', context)


@verify(permission_codename = 'Agendamentos')
def calendario(request):
    context={"breadcrumb":{"parent":"Agendamentos","child":"Calendário"}}
    return render(request, 'agendamentos/calendario.html', context)

@verify(permission_codename = 'Mapa Interativo')
def mapa_interativo(request):
    context={"breadcrumb":{"parent":"Mapa Interativo","child":"Mapa Interativo"}, "uf": GetUF.return_uf(), 'regioes': ger_regiao.objects.all(), 'vendedores': createVendedoresViewSet.retorna_query(request.user.empresa)}
    return render(request, 'mapa_interativo/mapa.html', context)


@verify(permission_codename = 'Validacao de documentos')
def validacao_documentos(request):
    context={"breadcrumb":{"parent":"Validação de Documentos","child":"Validação de Documentos"}}
    return render(request, 'valida_documentos/valida_documentos.html', context)

@verify(permission_codename = 'Recrutamento')
@verify(permission_codename = 'Vagas')
def vagas_html(request):
    context={"breadcrumb":{"parent":"Recrutamento","child":"Vagas"}}
    return render(request, 'recrutamento/vagas.html', context)


@verify(permission_codename = 'Recrutamento')
@verify(permission_codename = 'Candidatos')
def candidatos(request):
    jobs = vagas.objects.filter(empresa=request.user.empresa, statusregistro_id=200, jobstatus="A")
    cs = CandidateStatus.objects.filter(empresa=request.user.empresa, situacao_id=200)
    unidade = ger_unidade.objects.filter(empresa=request.user.empresa, statusregistro_id=200)
    recrutadores = Usuario.objects.filter(empresa=request.user.empresa, statusregistro_id=200)
    context={"breadcrumb":{"parent":"Recrutamento","child":"Candidatos"},"jobs": jobs, "status_cadidate": cs, "unidades": unidade, "recrutadores": recrutadores}
    return render(request, 'recrutamento/candidatos/candidatos.html', context)

@verify(permission_codename = 'Recrutamento')
@verify(permission_codename = 'Cadastros')
def cadastros(request):
    context={"breadcrumb":{"parent":"Recrutamento","child":"Cadastros"}}
    return render(request, 'recrutamento/cadastros/cadastros.html', context)

@verify(permission_codename = 'Empresas')
@verify(permission_codename = 'Unidades')
def unidades(request):
    context={"breadcrumb":{"parent":"Empresas","child":"Unidades"}}
    return render(request, 'ger_empresas/unidades/unidades.html', context)

@verify(permission_codename = 'Recrutamento')
@verify(permission_codename = 'Kanban Admissao')
def kanban(request):
    context={"breadcrumb":{"parent":"Recrutamento","child":"Kanban"}}
    return render(request, 'kanban/kanban.html', context)

@verify(permission_codename='Whatsapp')
def flows(request):
    context={"breadcrumb":{"parent":"Whatsapp","child":"Flows"}}
    return render(request, 'flows/flows.html', context)

@verify(permission_codename='Whatsapp')
def drawflow(request, flow_id=None):
    try:
        if flow_id:
            flow = Flows.objects.get(n8n_workflow_id=flow_id, empresa=request.user.empresa, statusregistro_id=200)
        else:
            flow = ''
        context={"breadcrumb":{"parent":"Whatsapp","child":"Flows"}, "flow":flow}
        return render(request, 'flows/whatsapp_flow_editor.html', context)
    except Exception as e:
        print(e)
        return render(request, 'error_page/error404.html')


###############################################################################################################################################
# ############### As funções abaixo serão acessadas por usuários que receberão as ofertas, ou seja, que não estão cadastrados no sistema.





# boomerangue vendas
def boomerangue_vendas(request, token):
    try:
        url_atual = request.get_host()
        dados = bmm_boomerangue.objects.get(token_bm=token)
        hospital = 'N'
        print("Empresa:", dados.empresa.url_boomerangue)
        if dados.empresa.tipo_de_negocio.value_prefixo == 'HSP':
            hospital = 'S'
        if(dados.empresa.url_boomerangue == url_atual.split('.')[0]):
            template = bmm_campanha.objects.get(id = dados.campanha.pk)
            produtos = bmm_boomerangueitens.objects.filter(boomerangue=dados.pk).order_by('ordem')
            try:

                distribuidor = ger_distribuidor.objects.get(cod_puxada=dados.cod_puxada, statusregistro_id = 200)
            except:
                distribuidor = MockDistribuidor('Sem distribuidor')
            cnpj = dados.entidade.CNPJ[:10] + '...'
            try:
                condicoes = ger_condicoespagamento.objects.filter(empresa = dados.empresa.pk, statusregistro_id = 200)
            except:
                condicoes = empty_queryset()
            footer_image = bmm_template.objects.get(id = dados.template.pk).image_footer
            context = {"template": template,"dados":dados, "produtos": produtos, 'condicoes': condicoes, "distribuidor": distribuidor.distribuidor, 'cnpj': cnpj, 'image_footer': footer_image, 'image_banner_pc': template.ImageBannerPC, 'image_banner_mobile': template.ImageBannerMobile, 'hospital': hospital}
            return render(request, 'boomerangue_vendas/tela_principal.html', context)
        else:
            return render(request, 'error_page/error404.html')
    except Exception as e:
         print(e)
         return render(request, 'error_page/error404.html')        


def campanhas_cliente(request, token):
    try:
        url_atual = request.get_host()
        dados = bmm_boomerangue.objects.get(token_bm=token)
        if(dados.empresa.url_boomerangue == url_atual.split('.')[0]):
            cnpj = dados.entidade.CNPJ[:10] + '...'
            campanhas = bmm_boomerangue.objects.filter(entidade=dados.entidade.pk, statusregistro_id=200)
            context = {"dados":dados, "agora": datetime.datetime.now(), 'campanhas': campanhas, 'cnpj':cnpj}
            return render(request, 'boomerangue_vendas/campanhas.html', context)
        else:
            return render(request, 'error_page/error404.html')
    except:
        return render(request, 'error_page/error404.html')



def meus_pedidos(request, token):
    try:
        url_atual = request.get_host()
        if(dados.empresa.url_boomerangue == url_atual.split('.')[0]):
            dados = bmm_boomerangue.objects.get(token_bm=token)
            cnpj = dados.entidade.CNPJ[:10] + '...'
            items = bmm_boomerangue.objects.filter(entidade=dados.entidade.pk, statusregistro_id=200, bm_aceito='S')
            context = {"dados":dados, "agora": datetime.datetime.now(), 'items': items, 'cnpj':cnpj}
            return render(request, 'boomerangue_vendas/meus_pedidos.html', context)
        else:
            return render(request, 'error_page/error404.html')
    except:
        return render(request, 'error_page/error404.html')


# Carrega a pagina pedido realizado quando o cliente efetua a compra
@csrf_exempt
def pedido_realizado(request, token):
    try:
        url_atual = request.get_host()
        dados = bmm_boomerangue.objects.get(token_bm=token)
        if(dados.empresa.url_boomerangue == url_atual.split('.')[0]):
            # verifica se o boomerangue teve a compra confrimada antes de acessar a pagina pedido realizado
            if dados.bm_aceito == 'S' and dados.bm_mensagem_status == '900 - Compra':
                items = bmm_boomerangueitens.objects.filter(boomerangue=dados.pk, QuantidadeCompradaUN__gt=0 )
                context = {"dados":dados, "agora": datetime.datetime.now(), 'items': items}
                return render(request, 'boomerangue_vendas/pedido_realizado.html', context)
            else:
                context = {"token": token}
                return render(request, 'error_page/error404.html', context)
        else:
            return render(request, 'error_page/error404.html')
    except:
        return render(request, 'error_page/error404.html')



# envia token da notificação para o google
@csrf_exempt
def send_token(request):
    # Obtenha o token do usuário do corpo da requisição
    token = request.POST.get('userToken')

    # Defina os cabeçalhos da requisição
    headers = {
        'Authorization': 'key=AAAArtjQWoc:APA91bGP7pOYq31VrLkZaz-sn62YN2XAlnTW2E1ddTZgIMGfTUYsFZxMKlRbuYs0w7lh88COoiTDYNEYlIV4rsP8fzXJ9RlxX1ztK3NPU2HC42IT5NH4M1SMs3iqxZ7wdKLOS1Cz02YL',
        'Content-Type': 'application/json'
    }

    # URL da API
    url = f"https://iid.googleapis.com/iid/v1/{token}/rel/topics/all_boomerangue_users"

    # Faça a requisição POST
    response = requests.post(url, headers=headers, json={})

    # Retorne a resposta da API
    return JsonResponse(response.json())


@csrf_exempt
def send_notification(request):
    headers = {
        'Authorization': 'key=AAAArtjQWoc:APA91bGP7pOYq31VrLkZaz-sn62YN2XAlnTW2E1ddTZgIMGfTUYsFZxMKlRbuYs0w7lh88COoiTDYNEYlIV4rsP8fzXJ9RlxX1ztK3NPU2HC42IT5NH4M1SMs3iqxZ7wdKLOS1Cz02YL',
        'Content-Type': 'application/json'
    }

    token = request.POST.get('userToken')
    prefix = request.POST.get('prefixo')


    response = requests.post(
        f"https://iid.googleapis.com/iid/v1/{token}/rel/topics/{prefix}",
        headers=headers,
        json={}
    )

    return JsonResponse(response.json())



@csrf_exempt
def gerar_pdf(request, token):
    # Busca os dados baseado no token
    dados = bmm_boomerangue.objects.get(token_bm=token)

    # Verifica se os critérios para gerar o PDF são atendidos
    if dados.bm_aceito == 'S' and dados.bm_mensagem_status == '900 - Compra':
        items = bmm_boomerangueitens.objects.filter(boomerangue=dados.pk, QuantidadeCompradaUN__gt=0)
        # Supondo que você tenha o domínio definido em suas configurações
        domain = 'https://boomerangue.me'  # Exemplo: 'https://www.meusite.com'

        # Construa o caminho absoluto da imagem
        image_url = domain + staticfiles_storage.url('assets/images/boomerangue_logo3.png')
        context = {"dados": dados, 'produtos': items, 'image': image_url}

        # Renderiza seu template HTML com o contexto desejado
        html_string = render_to_string('pdf/pdf_pedido.html', context)

        # Gera o PDF
        html = HTML(string=html_string)
        css = CSS(string='@page { size: A4; margin: 0.5cm; }')
        pdf = html.write_pdf(stylesheets=[css])

        # Cria e retorna a resposta HTTP
        response = HttpResponse(pdf, content_type='application/pdf')
        # response['Content-Disposition'] = 'attachment; filename="pedido.pdf"'

        return response
    else:
        context = {"token": token}
        return render(request, 'error_page/error404.html', context)



# Manisfest para o pwa
def manifest(request, token):
    start_url = f"/oferta/{token}"

    manifest_data = {
        "short_name": "Boomerangue",
        "name": "Boomerangue",
        "theme_color": "#FE4170",
        "background_color": "#FE4170",
        "display": "standalone",
        "prefer_related_applications": True,
        "icons": [
            {
                "src": "/boomerangue/static/assets/images/logo/boomerangue.png",
                "type": "image/png",
                "sizes": "512x512"
            }
        ],
        "start_url": start_url
    }

    return JsonResponse(manifest_data)

# Api que ajusta mensagens
@csrf_exempt
def mensagem_termos_troca(request):
        print(request.body)
        data = json.loads(request.body)
        provider = data['provider']
        campanha = data['campanha_id']
        entidade = data['entidade_id']
        mensagem = data['message']
        pix_valor = data['pix_valor']
        boomerangue_c = bmm_boomerangue.objects.get(campanha=campanha, entidade=entidade)
        fields = wpp_fields.objects.all()
        if provider == 'spl':
            parameters = []
            msgs = wpp_templatescomponents.objects.filter(template__template_name = mensagem, statusregistro_id=200)
            tipo = ''
            tipo_cp = []
            for msg in msgs:
                if msg.component_type == 'TEXT':
                    tipo_cp.append('body')
                elif msg.url_formatada != None and msg.component_type == 'BUTTONS':
                    tipo_cp.append('button')
                elif msg.url_formatada == None and msg.component_type == 'BUTTONS':
                    tipo_cp.append('button_quick')
                if termos_sendpulse_troca.objects.filter(component = msg).exists():
                    termos = termos_sendpulse_troca.objects.filter(component = msg)
                    termos = [(int(termo.termo_sendpulse.strip('{}')), termo) for termo in termos]
                                # Ordene a lista com base no número inteiro
                    termos.sort(key=lambda x: x[0])
                    for _, termo in termos:
                        chave = termo.termo_troca
                        field = fields.get(exibicao=chave)
                        campo = field.campo_origem
                        if getattr(boomerangue_c, campo):
                            value = getattr(boomerangue_c, campo)
                        if field.campo_vinculado != 'null':
                            if getattr(value, field.campo_vinculado):
                                value = getattr(value, field.campo_vinculado)
                        if chave == "{"+"link_curto_bm"+"}":
                            value = boomerangue_c.short_url if boomerangue_c.short_url != None else ''
                        parameters.append({
                            'type': 'text',
                            'text': value  
                        })
                
            if 'body' in tipo_cp:
                tipo = 'body'
            if 'button' in tipo_cp:
                tipo = 'button'
            if 'button_quick' in tipo_cp:
                tipo = 'button_quick'

            print("tipo",tipo)
            if tipo == 'body':
                return JsonResponse({
                    "components": [
                        {
                            "type": tipo,
                            "parameters": parameters
                        }
                    ]
                })
            elif tipo == 'button':
                return JsonResponse({
                    "components": [
                        {
                            "type": tipo,
                            "sub_type": "url",
                            "index": 0,
                            "parameters": parameters
                        }
                    ]
                })
            elif tipo == 'button_quick':
                return JsonResponse({
                        "components": [
                            {
                            "type": "body",
                            "parameters": parameters
                            },
                            {
                            "type": "button",
                            "sub_type": "quick_reply",
                            "index": 0,
                            "parameters": [
                                {
                                "type": "payload",
                                "payload": {
                                    "to_chain_id": "6644f32995362752570b22cd"
                                }
                                }
                            ]
                            },
                             {
                            "type": "button",
                            "sub_type": "quick_reply",
                            "index": 1,
                            "parameters": [
                                {
                                "type": "payload",
                                "payload": {
                                    "to_chain_id": "6644f36cfbc1e93d930b0406"
                                }
                                }
                            ]
                            }
                        ],
                        
                })
        else:
            url = ''
            imagem = None
            if boomerangue_c.template.campanha_motivo == 'VDP' or boomerangue_c.template.campanha_motivo == 'VDS':
                url = f'https://{boomerangue_c.empresa.url_boomerangue}.boomerangue.me/pt/oferta/{boomerangue_c.token_bm}'
                boomerangue_c.short_url = url
            ordem_componentes = ['HEADER', 'BODY', 'FOOTER', 'BUTTONS', 'LIST']
            todas_mensagens = ''
            for tipo_componente in ordem_componentes:
                msgs = wpp_templatescomponents.objects.filter(template=mensagem, statusregistro_id=200, component_type=tipo_componente)
                for msg in msgs:
                    text_content = msg.text_content
                    termos = re.findall(r'\{(.+?)\}', text_content)
                    if msg.image_content and not imagem:
                            url_image_site = f'https://{boomerangue_c.empresa.url_boomerangue}.boomerangue.me'
                            imagem = url_image_site + msg.image_content.url
                    if boomerangue_c.campanha.gateway_pagamento != 'null' and msg.possui_qrcode_pix == 'S':
                            imagem = None
                            url_site = f'https://{boomerangue_c.empresa.url_boomerangue}.boomerangue.me/'
                            qrcode_pix, pix_copia_cola = CampaignViewSet.gera_qrcode_pix(boomerangue_c, pix_valor)
                            imagem = url_site + qrcode_pix

                    for termo in termos:
                            chave = "{" + termo + "}"
                            field = fields.get(exibicao=chave)
                            if field.campo_origem != 'null':
                                campo = field.campo_origem
                                if getattr(boomerangue_c, campo):
                                    value = getattr(boomerangue_c, campo)
                                if field.campo_vinculado != 'null':
                                    if getattr(value, field.campo_vinculado):
                                        value = getattr(value, field.campo_vinculado)
                                if chave == "{"+"link_curto_bm"+"}":
                                    print("chave", url)
                                    value = url
                            if chave == "{"+"pix_copia_cola"+"}":
                                print('chavePix', pix_copia_cola)
                                value = pix_copia_cola
                            text_content = text_content.replace('{' + termo + '}', str(value))
                    todas_mensagens += text_content + "\n \n"
            print(todas_mensagens)
            return JsonResponse({"message": todas_mensagens, "image": imagem})