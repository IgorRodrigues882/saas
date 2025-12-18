from django.urls import path
from django.conf.urls import include
from django.urls import re_path
from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from ia.views import chat_view, relatorio
from django.conf.urls.i18n import i18n_patterns
from django.views.static import serve
from django.views.generic import TemplateView
from . import views
# from api.campaign.views import MessageConsumer

urlpatterns = [
    path("", views.index, name="home"),
    path("admin-django/", admin.site.urls),
    path("home_page", views.index, name="home_page"),
    re_path(r"^auth/", include("login.urls")),
    re_path(r"^", include("api.urls")),
    # re_path(r'ws/messages/$', MessageConsumer.as_asgi()), 
    path('entidades_list', views.entidades_view, name='entidades'),
    path('campanhas_list', views.campanhas_list, name='campanhas_list'),
    path('create_new_campaign', views.create_campaign, name='create_new_campaign'),
    path('campanha_consulta/<int:id>', views.campanha_consulta, name='campanha_consulta'),
    path('create_new_boomerangues', views.boomerangue_create, name='create_new_boomerangues'),
    path('boomerangue_consulta/<int:id>', views.boomerangue_consulta, name='boomerangue_consulta'),
    path('empresas_create', views.empresa_create, name='empresa_create'),
    path('empresas_list', views.empresa_list,name='empresas_list'),
    path('condicao_pagamento_create', views.condicao_pagamento_create, name='condicao_pagamento_create'),
    path('condicao_pagamento_list', views.condicao_pagamento_list, name='condicao_pagamento_list'),
    path('transportadora_create', views.transportadora_create, name='transportadora_create'),
    path('transportadoras_list', views.transportadora_list, name='transportadoras_list'),
    path('vendedores_create', views.vendedores_create, name='vendedores_create'),
    path('vendedores_list', views.vendedores_list, name="vendedores_list"),
    path('boomerangues_templates', views.boomerangue_template, name='boomerangues_templates'),
    path('login', views.login, name='login'),
    path('boomerangues_list', views.boomerangue_list, name='boomerangues_list'),
    path('create-entidade', views.create_entidade, name="create-entidade"),
    path('entidade_consulta/<int:id>', views.entidade_consulta, name='entidade_consulta'),
    path('boomerangue_previa/<str:id>', views.boomerangue_previa, name='boomerangue_previa'),
    path('bot_canal', views.bot_canal_list, name='bot_canal'),
    path('bot_canalempresa', views.bot_canalempresa_list, name='bot_canalempresa'),
    path('bot_provedor', views.bot_provedor_list, name='bot_provedor'),
    path('ger_categorias', views.ger_categorias_list, name='ger_categorias'),
    path('bots', views.bots, name='bots'),
    path("bots/<int:id>", views.bot_consulta, name="bot_consulta"),
    path('ger_grade', views.ger_grade_list, name='ger_grade'),
    path('ger_grupoprodutos', views.ger_grupoprodutos_list, name='ger_grupoprodutos'),
    path('load-more-items/', views.load_more_items, name='load_more_items'),
    path('ger_linhaprodutos', views.ger_linhaprodutos_list, name='ger_linhaprodutos'),
    path('ger_linhaprodutos/create', views.ger_linhaprodutos_create, name='ger_linhaprodutos_create'),
    path('ger_produtos', views.ger_produtos_list, name='ger_produtos'),
    path('ger_produtos/create', views.ger_produtos_create, name='ger_produtos_create'),
    path('ger_unidademedida', views.ger_unidademedida_list, name='ger_unidademedida'),
    path('ger_unidademedida/create', views.ger_unidademedida_create, name='ger_unidademedida_create'),
    path('login', views.login, name='login'),
    path('signup', views.signup, name='signup'),
    path('usuarios_list', views.usuarios_list, name='usuarios_list'),
    path('grupos_permissao_list', views.grupos_permissao_list, name='grupos_permissao_list'),
    path('boomerangues-list', views.boomerangues_list, name="boomerangues-list"),
    path('gateways-pagamentos', views.payment_gateways, name='gateways_pagamentos'),
    path('ajudante_ia', views.ia, name='ajudante_ia'),
    path('ia', chat_view, name='ia'),
    path('historico', views.historico, name='historico'),
    path('unidades', views.unidades, name='unidades'),
    path('kanban', views.kanban, name='kanban'),
    path('pix_gerados', views.pix_gerados, name='pix_gerados'),
    path('plug_admin', views.painel_plug, name='plug_admin'),
    path('geraRelatorio', relatorio, name='geraRelatorio'),
    path('wpp_templates', views.wpp_template, name='wpp_templates'),
    path('wpp_components', views.wpp_componente, name='wpp_components'),
    path('flows', views.flows, name='flows'),
    path('drawflow/', views.drawflow, name='drawflow'),
    path('drawflow/<str:flow_id>/', views.drawflow, name='drawflow_with_id'),
    path('set_language/<str:language_code>/<str:page>/', views.set_language, name='set_language'),
    path('templates/<int:id>', views.boomerangue_template_id, name="template_consulta"),
    path('load_more_items_tmplates_importados/', views.load_more_items_tmplates_importados, name='load_more_items_tmplates_importados/'),
    path('load_more_templates/', views.load_more_templates, name='load_more_templates'),
    path('load_more_entidades/', views.load_more_entidades, name='load_more_entidades'),
    path('load_more_mensagens_templates/', views.load_more_mensagens_templates, name='load_more_mensagens_templates'),
    path('load_more_boomerangues/', views.load_more_boomerangues, name='load_more_boomerangues'),
    path('load_more_messages_campanhas/', views.load_more_messages_campanhas, name='load_more_messages_campanhas'),
    path('load_more_itens_templates/', views.load_more_itens_templates, name='load_more_itens_templates'),
    path('load_more_logs_campanhas/', views.load_more_logs_campanhas, name='load_more_logs_campanhas'),
    path('load_more_eventos_campanhas/', views.load_more_eventos_campanhas, name='load_more_eventos_campanhas'),
    path('load_more_history/', views.load_more_history, name='load_more_history'),
    path('oferta/<str:token>', views.boomerangue_vendas, name='oferta'),
    path('campanhas_cliente/<str:token>', views.campanhas_cliente, name='campanhas_cliente'),
    path('pedido_realizado/<str:token>', views.pedido_realizado, name='pedido_realizado'),
    path('gerar_pdf/<str:token>', views.gerar_pdf, name='gerar_pdf'),
    path('meus_pedidos/<str:token>', views.meus_pedidos, name='meus_pedidos'),
    path('send_token', views.send_token, name='send_token'),
    path('mensagem_termos_troca/', views.mensagem_termos_troca, name='troca_termos'),
    path('cadastro_topic', views.send_notification, name='cadastro_topic'),
    path('chat', views.chat, name='chat'),
    path('agendamentos', views.agendamentos, name = 'agendamentos'),
    path('calendario_agendamentos', views.calendario, name = 'calendario'),
    path('mapa_interativo', views.mapa_interativo, name = 'mapa_interativo'),
    path('valida_documentos', views.validacao_documentos, name = 'valida_documentos'),
    path('vagas', views.vagas_html, name = 'vagas'),
    path('candidatos', views.candidatos, name = 'candidatos'),
    path('cadastros', views.cadastros, name = 'cadastros'),
    path('erro', views.Erro_404),
    path('firebase-messaging-sw.js', serve, {
        'path': 'firebase-messaging-sw.js',
        'document_root': settings.STATIC_ROOT,
    }),
    path('pwabuilder-sw.js', serve, {
        'path': 'pwabuilder-sw.js',
        'document_root': settings.STATIC_ROOT,
    }),
    path('manifest/<str:token>/', views.manifest, name='manifest'),
]

urlpatterns = [
    *i18n_patterns(*urlpatterns, prefix_default_language=True)
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

