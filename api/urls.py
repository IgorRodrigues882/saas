"""
API route registration

To register a new app, import it as:
    from api.bots.urls import urlpatterns as bot_urls

After that concatenate its value in api_urlpatterns like:
    api_urlpatterns += bot_urls
"""

from django.urls import path, include

from api.bot.urls import urlpatterns as bot_urls

from api.campaign.urls import urlpatterns as campaign_urls
from api.ger_empresas.urls import urlpatterns as ger_empresas_urls
from api.ger_dadosgerais.urls import urlpatterns as ger_dadosgerais_urls
from api.ger_entidades.urls import urlpatterns as ger_entidades_urls
from api.bot_canal.urls import urlpatterns as bot_canal_urls
from api.bot_canalempresa.urls import urlpatterns as bot_canalempresas_urls
from api.bot_provedor.urls import urlpatterns as bot_provedor_urls
from api.ger_categorias.urls import urlpatterns as ger_categorias_urls
from api.ger_grade.urls import urlpatterns as ger_grade
from api.ger_grupoprodutos.urls import urlpatterns as ger_grupoprodutos
from api.ger_linhaprodutos.urls import urlpatterns as ger_linhaprodutos
from api.ger_produtos.urls import urlpatterns as ger_produtos
from api.wpp_templates.urls import urlpatterns as wpp_templates_urls
from api.wpp_templatescomponents.urls import urlpatterns as wpp_templatescomponents_urls
from api.wpp_templatelistitems.urls import urlpatterns as wpp_templatelistitems_urls
from api.wpp_templatebuttons.urls import urlpatterns as wpp_templatebuttons_urls
from api.wpp_templateapprovals.urls import urlpatterns as wpp_templateapprovals_urls


from api.wpp_templates.urls import urlpatterns as wpp_templates_urls
from api.wpp_templatescomponents.urls import urlpatterns as wpp_templatescomponents_urls
from api.wpp_templatelistitems.urls import urlpatterns as wpp_templatelistitems_urls
from api.wpp_templatebuttons.urls import urlpatterns as wpp_templatebuttons_urls
from api.wpp_templateapprovals.urls import urlpatterns as wpp_templateapprovals_urls

from api.wpp_templates.urls import urlpatterns as wpp_templates_urls
from api.wpp_templatescomponents.urls import urlpatterns as wpp_templatescomponents_urls
from api.wpp_templatelistitems.urls import urlpatterns as wpp_templatelistitems_urls
from api.wpp_templatebuttons.urls import urlpatterns as wpp_templatebuttons_urls
from api.wpp_templateapprovals.urls import urlpatterns as wpp_templateapprovals_urls

from api.bmm_campanhas_msgs.urls import urlpatterns as bmm_campanhas_msgs_urls
from api.bmm_template_msgs.urls import urlpatterns as bmm_template_msgs_urls

from api.historico_vendas.urls import urlpatterns as historico_vendas_urls
from api.comunica.urls import urlpatterns as comunica_urls
from api.gateway_pagamento.urls import urlpatterns as gateway_pagamento_urls
from api.pix.urls import urlpatterns as pix_urlpatterns
from api.msg_messages.urls import urlpatterns as msg_messages_urls
from api.pix_transactions.urls import urlpatterns as pix_transactions
from api.atributos.urls import urlpatterns as atributos
from api.ia_messages.urls import urlpatterns as ia_messages
from api.rabbitmq.urls import urlpatterns as rabbitmq
from api.valida_documentos.urls import urlpatterns as valida_documentos
from api.recrutamento.urls import urlpatterns as recrutamento

api_urlpatterns = []
api_urlpatterns += bot_urls
api_urlpatterns += campaign_urls
api_urlpatterns += ger_empresas_urls
api_urlpatterns += ger_dadosgerais_urls
api_urlpatterns += ger_entidades_urls
api_urlpatterns += bot_canal_urls
api_urlpatterns += bot_canalempresas_urls
api_urlpatterns += bot_provedor_urls
api_urlpatterns += ger_categorias_urls
api_urlpatterns += ger_grade
api_urlpatterns += ger_grupoprodutos
api_urlpatterns += ger_linhaprodutos
api_urlpatterns += ger_produtos
api_urlpatterns += wpp_templates_urls
api_urlpatterns += wpp_templatescomponents_urls
api_urlpatterns += wpp_templatelistitems_urls
api_urlpatterns += wpp_templatebuttons_urls
api_urlpatterns += wpp_templateapprovals_urls
api_urlpatterns += wpp_templates_urls
api_urlpatterns += wpp_templatescomponents_urls
api_urlpatterns += wpp_templatelistitems_urls
api_urlpatterns += wpp_templatebuttons_urls
api_urlpatterns += wpp_templateapprovals_urls
api_urlpatterns += wpp_templates_urls
api_urlpatterns += wpp_templatescomponents_urls
api_urlpatterns += wpp_templatelistitems_urls
api_urlpatterns += wpp_templatebuttons_urls
api_urlpatterns += wpp_templateapprovals_urls
api_urlpatterns += wpp_templates_urls
api_urlpatterns += wpp_templatescomponents_urls
api_urlpatterns += wpp_templatelistitems_urls
api_urlpatterns += wpp_templatebuttons_urls
api_urlpatterns += wpp_templateapprovals_urls
api_urlpatterns += wpp_templates_urls
api_urlpatterns += wpp_templatescomponents_urls
api_urlpatterns += wpp_templatelistitems_urls
api_urlpatterns += wpp_templatebuttons_urls
api_urlpatterns += wpp_templateapprovals_urls
api_urlpatterns += bmm_campanhas_msgs_urls
api_urlpatterns += bmm_template_msgs_urls
api_urlpatterns += historico_vendas_urls
api_urlpatterns += comunica_urls
api_urlpatterns += gateway_pagamento_urls
api_urlpatterns += msg_messages_urls
api_urlpatterns += pix_transactions
api_urlpatterns += atributos
api_urlpatterns += ia_messages
api_urlpatterns += valida_documentos
api_urlpatterns += recrutamento

urlpatterns = [path("api/", include(api_urlpatterns)), path("pix/", include(pix_urlpatterns)), path("rabbit/", include(rabbitmq))]


