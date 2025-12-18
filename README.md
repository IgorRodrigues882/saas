# Boomerangue (BMM)

![Python](https://img.shields.io/badge/Python-3.10-blue)
![Django](https://img.shields.io/badge/Django-4.1.4-green)
![DRF](https://img.shields.io/badge/DRF-3.14.0-red)
![License](https://img.shields.io/badge/License-Proprietary-yellow)

**Boomerangue** é uma plataforma SaaS empresarial completa desenvolvida em Django, projetada para gerenciar produtos, campanhas, mensagens, pagamentos e interações com clientes através de diversos canais, incluindo bots do WhatsApp e templates personalizados.

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Funcionalidades Principais](#-funcionalidades-principais)
- [Arquitetura](#-arquitetura)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Requisitos](#-requisitos)
- [Instalação](#-instalação)
  - [Instalação com Docker (Recomendado)](#instalação-com-docker-recomendado)
  - [Instalação Manual](#instalação-manual)
- [Configuração](#-configuração)
- [Uso](#-uso)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [API](#-api)
- [Desenvolvimento](#-desenvolvimento)
- [Testes](#-testes)
- [Deploy](#-deploy)
- [Segurança](#-segurança)
- [Troubleshooting](#-troubleshooting)
- [Contribuição](#-contribuição)
- [Licença](#-licença)

---

## 🎯 Visão Geral

Boomerangue é uma plataforma empresarial multi-tenant que oferece uma solução completa para:

- **Gestão de Empresas**: Controle completo de múltiplas empresas com isolamento de dados
- **Gerenciamento de Produtos**: Catálogo de produtos com categorias, grades, linhas e atributos
- **Automação de Campanhas**: Sistema de campanhas de marketing com mensagens automatizadas
- **Bots Inteligentes**: Integração com WhatsApp e outros canais de comunicação
- **Pagamentos**: Gateway de pagamento com suporte a PIX e outros métodos
- **B2B**: Funcionalidades específicas para vendas empresariais
- **Recrutamento**: Sistema completo de gestão de vagas e candidatos
- **IA Integrada**: Chatbots e geração de conteúdo com OpenAI e Hugging Face

---

## ✨ Funcionalidades Principais

### 🏢 Gestão Empresarial
- Multi-tenancy com isolamento de dados por subdomínio
- Gestão de empresas, entidades e dados gerais
- Sistema de permissões granulares
- Logs de atividades empresariais

### 📦 Catálogo de Produtos
- Gerenciamento completo de produtos
- Categorias hierárquicas
- Grades e variações de produtos
- Linhas e grupos de produtos
- Atributos personalizáveis
- Unidades de medida

### 🤖 Automação e Bots
- Bots multi-canal (WhatsApp, Telegram, etc.)
- Templates de mensagens parametrizados
- Campanhas automatizadas
- Respostas inteligentes com IA
- Webhooks e integrações

### 💳 Gateway de Pagamento
- Integração com múltiplos gateways
- Suporte completo a PIX
- Banco de dados dedicado para transações
- Histórico de vendas

### 📊 Campanhas e Marketing
- Criação e gerenciamento de campanhas
- Templates do WhatsApp Business API
- Componentes dinâmicos (botões, listas, etc.)
- Aprovação e versionamento de templates
- Integração com SendPulse

### 🎯 Recrutamento
- Gestão de vagas e processos seletivos
- Cadastro e triagem de candidatos
- Validação automática de documentos
- Pipeline de contratação

### 🔌 Integrações
- OpenAI (GPT) para IA conversacional
- Google Cloud Vision para análise de imagens
- N8N para automação de workflows
- RabbitMQ para mensageria
- AWS S3/Wasabi para armazenamento

### 📱 API REST Completa
- Endpoints para todos os módulos
- Autenticação por token
- Documentação automática
- Rate limiting
- Versionamento

---

## 🏗 Arquitetura

### Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        NGINX (Reverse Proxy)                 │
│                    Port 80/443 (Load Balancer)              │
└──────────────────┬──────────────────┬───────────────────────┘
                   │                  │
        ┌──────────▼──────────┐  ┌───▼──────────────┐
        │   Django/Gunicorn   │  │  Daphne (ASGI)   │
        │   Port 8000 (HTTP)  │  │  Port 8001 (WS)  │
        │   9 Workers         │  │  WebSockets      │
        └──────────┬──────────┘  └───┬──────────────┘
                   │                  │
        ┌──────────▼──────────────────▼──────────────┐
        │            MySQL Databases                  │
        │  - boomeranguev4 (Main)                    │
        │  - boomeranguepixv4 (PIX Transactions)     │
        └─────────────────────────────────────────────┘
                   │
        ┌──────────▼──────────────────────────────────┐
        │              Redis (Cache & Queue)          │
        │  - Django Cache                             │
        │  - Celery Broker                            │
        │  - Django Channels Layer                    │
        └─────────────────────────────────────────────┘
                   │
        ┌──────────▼──────────────────────────────────┐
        │           RabbitMQ (Message Broker)         │
        │  - Bot Messages                             │
        │  - Campaign Queue                           │
        │  - External Integrations                    │
        └─────────────────────────────────────────────┘
                   │
        ┌──────────▼──────────────────────────────────┐
        │         Celery Workers & Beat               │
        │  - Async Tasks Processing                   │
        │  - Scheduled Jobs (Campaign expiration)     │
        │  - Email/SMS sending                        │
        └─────────────────────────────────────────────┘
```

### Padrões de Arquitetura

- **Multi-Tenancy**: Isolamento de dados por subdomínio/hostname
- **Microservices-Ready**: Módulos independentes comunicando via API
- **Event-Driven**: RabbitMQ para mensageria assíncrona
- **Task Queue**: Celery para processamento em background
- **Real-Time**: WebSockets via Django Channels
- **RESTful API**: Endpoints padronizados com DRF

---

## 🛠 Tecnologias Utilizadas

### Backend
- **Python 3.10**
- **Django 4.1.4** - Framework web principal
- **Django REST Framework 3.14.0** - API REST
- **Django Channels 3.0.4** - WebSockets
- **Celery 5.3.6** - Task queue
- **Gunicorn** - WSGI Server
- **Daphne 3.0.2** - ASGI Server

### Bancos de Dados
- **MySQL 8.0** - Banco de dados principal
- **Redis 7** - Cache e broker

### Mensageria
- **RabbitMQ 3** - Message broker
- **Pika 1.3.2** - Cliente Python para RabbitMQ

### IA e Machine Learning
- **OpenAI 0.28.1** - GPT API
- **Transformers 4.46.3** - Hugging Face models
- **Scikit-learn 1.5.2** - ML algorithms
- **Google Cloud Vision 3.7.4** - Análise de imagens
- **Pytesseract 0.3.10** - OCR

### Armazenamento
- **AWS S3 / Wasabi** - Armazenamento de arquivos
- **Boto3 1.34.113** - SDK AWS

### Processamento de Documentos
- **WeasyPrint 60.1** - Geração de PDFs
- **PyPDF2 3.0.1** - Manipulação de PDFs
- **PyMuPDF 1.24.9** - Renderização de PDFs
- **OpenPyXL 3.1.5** - Processamento de Excel
- **Pillow 10.0.0** - Processamento de imagens

### DevOps
- **Docker** - Containerização
- **Docker Compose** - Orquestração de containers
- **Nginx** - Reverse proxy

---

## 📋 Requisitos

### Requisitos de Sistema

- **Python**: 3.10 ou superior
- **Docker**: 20.10 ou superior (para instalação com Docker)
- **Docker Compose**: 2.0 ou superior
- **MySQL**: 8.0 ou superior (se instalação manual)
- **Redis**: 7.0 ou superior (se instalação manual)
- **RabbitMQ**: 3.x (se instalação manual)

### Recursos de Hardware Recomendados

- **CPU**: 4+ cores
- **RAM**: 8GB mínimo, 16GB recomendado
- **Disco**: 50GB+ de espaço livre
- **Rede**: Conexão estável para APIs externas

---

## 🚀 Instalação

### Instalação com Docker (Recomendado)

Esta é a forma mais rápida e fácil de executar o projeto.

#### 1. Clone o repositório

```bash
git clone <repository-url>
cd projeto-bmm
```

#### 2. Configure as variáveis de ambiente

```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o arquivo .env com suas configurações
nano .env
```

**Variáveis obrigatórias mínimas:**
```env
SECRET_KEY=sua-chave-secreta-aqui
DB_PASSWORD=senha-do-banco
OPENAI_API_KEY=sua-chave-openai
```

#### 3. Inicie os containers

```bash
# Construir e iniciar todos os serviços
docker-compose up -d --build

# Verificar logs
docker-compose logs -f
```

#### 4. Execute as migrações

```bash
# Migração do banco principal
docker-compose exec web python manage.py migrate

# Migração do banco PIX
docker-compose exec web python manage.py migrate --database=pix_db

# Criar superusuário
docker-compose exec web python manage.py createsuperuser

# Coletar arquivos estáticos
docker-compose exec web python manage.py collectstatic --noinput
```

#### 5. Acesse a aplicação

- **Web App**: http://localhost
- **Admin**: http://localhost/admin
- **API**: http://localhost/api
- **RabbitMQ Management**: http://localhost:15672 (usuário: bmm, senha: bmm_password)

---

### Instalação Manual

#### 1. Clone e configure o ambiente virtual

```bash
git clone <repository-url>
cd projeto-bmm

# Criar ambiente virtual
python -m venv env

# Ativar ambiente virtual
# Windows
env\Scripts\activate
# Linux/Mac
source env/bin/activate

# Instalar dependências
pip install -r requirements.txt
```

#### 2. Configure o MySQL

```bash
# Entrar no MySQL
mysql -u root -p

# Executar script de inicialização
source init-db.sql
```

#### 3. Configure Redis e RabbitMQ

```bash
# Instalar e iniciar Redis
sudo apt-get install redis-server
sudo systemctl start redis

# Instalar e iniciar RabbitMQ
sudo apt-get install rabbitmq-server
sudo systemctl start rabbitmq-server
sudo rabbitmq-plugins enable rabbitmq_management
```

#### 4. Configure variáveis de ambiente

```bash
cp .env.example .env
# Edite .env com suas configurações
```

#### 5. Execute migrações e colete estáticos

```bash
python manage.py migrate
python manage.py migrate --database=pix_db
python manage.py createsuperuser
python manage.py collectstatic --noinput
```

#### 6. Inicie os servidores

```bash
# Terminal 1 - Django
python manage.py runserver

# Terminal 2 - Celery Worker
celery -A boomerangue worker -l info

# Terminal 3 - Celery Beat
celery -A boomerangue beat -l info

# Terminal 4 - Daphne (WebSockets)
daphne -b 0.0.0.0 -p 8001 boomerangue.asgi:application
```

---

## ⚙️ Configuração

### Configurações de Banco de Dados

Edite [boomerangue/settings.py](boomerangue/settings.py) para configurar os bancos de dados:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': os.getenv('DB_NAME', 'boomeranguev4'),
        'USER': os.getenv('DB_USER', 'bmm_normal'),
        'PASSWORD': os.getenv('DB_PASSWORD'),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '3306'),
    },
    'pix_db': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': os.getenv('PIX_DB_NAME', 'boomeranguepixv4'),
        # ... outras configurações
    }
}
```

### Configurações de Cache (Redis)

```python
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': f'redis://{os.getenv("REDIS_HOST", "localhost")}:6379/1',
    }
}
```

### Configurações de Celery

```python
CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')
```

### Configurações de Armazenamento (S3/Wasabi)

```python
if os.getenv('USE_S3') == 'True':
    DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
    AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
    AWS_STORAGE_BUCKET_NAME = os.getenv('AWS_STORAGE_BUCKET_NAME')
```

---

## 💻 Uso

### Acessar o Admin do Django

1. Acesse: http://localhost/admin
2. Use as credenciais do superusuário criado

### Usar a API REST

```bash
# Obter token de autenticação
curl -X POST http://localhost/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "seu_usuario", "password": "sua_senha"}'

# Fazer requisições autenticadas
curl -X GET http://localhost/api/produtos/ \
  -H "Authorization: Token seu_token_aqui"
```

### WebSockets

```javascript
// Conectar ao WebSocket
const socket = new WebSocket('ws://localhost/ws/chat/');

socket.onmessage = function(e) {
    const data = JSON.parse(e.data);
    console.log('Mensagem recebida:', data);
};

socket.send(JSON.stringify({
    'message': 'Hello World'
}));
```

### Celery Tasks

```python
# Em qualquer parte do código Django
from boomerangue.tasks import encerra_campanhas_expiradas

# Executar tarefa assíncrona
encerra_campanhas_expiradas.delay()
```

---

## 📁 Estrutura do Projeto

```
projeto-bmm/
├── boomerangue/                    # Projeto Django principal
│   ├── __init__.py
│   ├── settings.py                # Configurações principais
│   ├── urls.py                    # URLs principais
│   ├── wsgi.py                    # WSGI entry point
│   ├── asgi.py                    # ASGI entry point (WebSockets)
│   ├── celery.py                  # Configuração do Celery
│   ├── tasks.py                   # Tarefas do Celery
│   ├── routing.py                 # Rotas WebSocket
│   ├── consumers.py               # WebSocket consumers
│   ├── middleware.py              # Middlewares customizados
│   ├── multitenancy.py            # Sistema multi-tenant
│   ├── db_router.py               # Roteador de banco de dados
│   ├── utils.py                   # Funções utilitárias
│   ├── views.py                   # Views template-based
│   └── apps/                      # Aplicações Django (33 apps)
│       ├── ger_empresas/          # Gestão de empresas
│       ├── ger_produtos/          # Gestão de produtos
│       ├── bot/                   # Sistema de bots
│       ├── campaign/              # Campanhas
│       ├── gateway_pagamento/     # Gateway de pagamento
│       ├── pix_transactions/      # Transações PIX
│       ├── recrutamento/          # Sistema de recrutamento
│       └── ...                    # Outras apps
├── api/                           # APIs REST
│   ├── urls.py                    # URLs da API
│   ├── produtos/                  # API de produtos
│   ├── empresas/                  # API de empresas
│   ├── campaign/                  # API de campanhas
│   ├── ias/                       # API de IA
│   ├── pix/                       # API PIX
│   └── ...                        # Outras APIs
├── manage.py                      # Django CLI
├── requirements.txt               # Dependências Python
├── Dockerfile                     # Configuração Docker
├── docker-compose.yml             # Orquestração Docker
├── nginx.conf                     # Configuração Nginx
├── init-db.sql                    # Script inicialização DB
├── .env.example                   # Exemplo de variáveis de ambiente
├── .gitignore                     # Arquivos ignorados pelo Git
└── README.md                      # Este arquivo
```

### Principais Apps Django

| App | Descrição |
|-----|-----------|
| `ger_empresas` | Gestão de empresas e multi-tenancy |
| `ger_produtos` | Catálogo de produtos |
| `ger_categorias` | Categorias de produtos |
| `bot` | Sistema de bots core |
| `bot_canal` | Canais de comunicação |
| `bot_provedor` | Provedores de mensageria |
| `campaign` | Gestão de campanhas |
| `gateway_pagamento` | Integração com gateways |
| `pix_transactions` | Transações PIX |
| `recrutamento` | Sistema de RH |
| `msg_messages` | Processamento de mensagens |
| `ia_messages` | Mensagens com IA |

---

## 🔌 API

### Endpoints Principais

#### Autenticação

```
POST   /api/token/                 # Obter token
POST   /api/token/refresh/         # Atualizar token
POST   /api/logout/                # Logout
```

#### Empresas

```
GET    /api/empresas/              # Listar empresas
POST   /api/empresas/              # Criar empresa
GET    /api/empresas/{id}/         # Detalhes da empresa
PUT    /api/empresas/{id}/         # Atualizar empresa
DELETE /api/empresas/{id}/         # Deletar empresa
```

#### Produtos

```
GET    /api/produtos/              # Listar produtos
POST   /api/produtos/              # Criar produto
GET    /api/produtos/{id}/         # Detalhes do produto
PUT    /api/produtos/{id}/         # Atualizar produto
DELETE /api/produtos/{id}/         # Deletar produto
```

#### Campanhas

```
GET    /api/campaign/              # Listar campanhas
POST   /api/campaign/              # Criar campanha
GET    /api/campaign/{id}/         # Detalhes da campanha
PUT    /api/campaign/{id}/         # Atualizar campanha
DELETE /api/campaign/{id}/         # Deletar campanha
POST   /api/campaign/{id}/start/   # Iniciar campanha
POST   /api/campaign/{id}/stop/    # Parar campanha
```

#### Bots

```
GET    /api/bot/                   # Listar bots
POST   /api/bot/                   # Criar bot
GET    /api/bot/{id}/              # Detalhes do bot
POST   /api/bot/webhook/           # Webhook para mensagens
```

#### IA

```
POST   /api/ias/chat/              # Chat com IA
POST   /api/ias/generate/          # Gerar conteúdo
POST   /api/ias/analyze-image/     # Analisar imagem
```

#### PIX

```
GET    /api/pix/transactions/      # Listar transações
POST   /api/pix/create/            # Criar cobrança PIX
GET    /api/pix/status/{id}/       # Status da transação
```

### Documentação Interativa

Acesse a documentação interativa da API:
- **Swagger UI**: http://localhost/api/docs/
- **ReDoc**: http://localhost/api/redoc/

---

## 👨‍💻 Desenvolvimento

### Criar uma nova app Django

```bash
# Criar app dentro de boomerangue/apps/
python manage.py startapp nova_app boomerangue/apps/nova_app

# Adicionar em settings.py INSTALLED_APPS
'boomerangue.apps.nova_app',
```

### Criar uma nova API

```bash
# Criar estrutura em api/
mkdir api/nova_api
touch api/nova_api/__init__.py
touch api/nova_api/views.py
touch api/nova_api/serializers.py
touch api/nova_api/urls.py

# Incluir em api/urls.py
path('nova-api/', include('api.nova_api.urls')),
```

### Migrations

```bash
# Criar migrations
python manage.py makemigrations

# Aplicar migrations
python manage.py migrate

# Verificar status
python manage.py showmigrations
```

### Gerenciar Celery Tasks

```bash
# Listar tasks registradas
celery -A boomerangue inspect registered

# Monitorar tasks
celery -A boomerangue events

# Limpar queue
celery -A boomerangue purge
```

---

## 🧪 Testes

```bash
# Rodar todos os testes
python manage.py test

# Rodar testes de uma app específica
python manage.py test boomerangue.apps.ger_produtos

# Rodar com coverage
coverage run --source='.' manage.py test
coverage report
coverage html
```

---

## 🚢 Deploy

### Deploy com Docker Compose (Produção)

1. **Configure variáveis de ambiente de produção**

```bash
# Editar .env
DEBUG=False
ALLOWED_HOSTS=seu-dominio.com
SECRET_KEY=chave-super-secreta-aleatoria
# ... outras variáveis
```

2. **Configure SSL/TLS**

```bash
# Coloque seus certificados em ./ssl/
cp certificado.crt ssl/certificate.crt
cp chave-privada.key ssl/private.key

# Descomente as linhas SSL no nginx.conf
```

3. **Execute em produção**

```bash
docker-compose -f docker-compose.yml up -d
```

### Deploy Manual (VPS/Cloud)

1. **Instale dependências do sistema**

```bash
sudo apt-get update
sudo apt-get install python3.10 python3-pip mysql-server redis-server rabbitmq-server nginx
```

2. **Configure Supervisor para gerenciar processos**

```ini
# /etc/supervisor/conf.d/boomerangue.conf
[program:gunicorn]
command=/path/to/env/bin/gunicorn boomerangue.wsgi:application --bind 127.0.0.1:8000 --workers 9
directory=/path/to/projeto-bmm
user=www-data
autostart=true
autorestart=true

[program:daphne]
command=/path/to/env/bin/daphne -b 127.0.0.1 -p 8001 boomerangue.asgi:application
directory=/path/to/projeto-bmm
user=www-data
autostart=true
autorestart=true

[program:celery]
command=/path/to/env/bin/celery -A boomerangue worker -l info
directory=/path/to/projeto-bmm
user=www-data
autostart=true
autorestart=true

[program:celerybeat]
command=/path/to/env/bin/celery -A boomerangue beat -l info
directory=/path/to/projeto-bmm
user=www-data
autostart=true
autorestart=true
```

3. **Configure Nginx**

```bash
sudo cp nginx.conf /etc/nginx/sites-available/boomerangue
sudo ln -s /etc/nginx/sites-available/boomerangue /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔒 Segurança

### Checklist de Segurança

- [ ] Alterar `SECRET_KEY` para valor aleatório forte
- [ ] Definir `DEBUG=False` em produção
- [ ] Configurar `ALLOWED_HOSTS` corretamente
- [ ] Usar HTTPS (SSL/TLS)
- [ ] Mover credenciais para variáveis de ambiente
- [ ] Configurar `CSRF_TRUSTED_ORIGINS`
- [ ] Desabilitar `CORS_ALLOW_ALL_ORIGINS`
- [ ] Implementar rate limiting
- [ ] Configurar backup de banco de dados
- [ ] Monitorar logs de erro (Sentry)
- [ ] Atualizar dependências regularmente
- [ ] Implementar 2FA para admin
- [ ] Validar e sanitizar inputs
- [ ] Proteger contra SQL Injection
- [ ] Proteger contra XSS

### Variáveis Sensíveis

**NUNCA** commite os seguintes dados:
- `SECRET_KEY`
- Senhas de banco de dados
- API keys (OpenAI, Google, AWS, etc.)
- Certificados SSL
- Tokens de acesso

Use sempre variáveis de ambiente ou serviços como AWS Secrets Manager.

---

## 🔧 Troubleshooting

### Problema: Erro de conexão com MySQL

**Solução:**
```bash
# Verificar se o MySQL está rodando
docker-compose ps

# Ver logs do MySQL
docker-compose logs db

# Resetar o container
docker-compose restart db
```

### Problema: Celery não processa tasks

**Solução:**
```bash
# Verificar workers
celery -A boomerangue inspect active

# Reiniciar workers
docker-compose restart celery_worker celery_beat

# Limpar queue
celery -A boomerangue purge
```

### Problema: WebSocket não conecta

**Solução:**
```bash
# Verificar se Daphne está rodando
docker-compose logs daphne

# Verificar Redis
docker-compose exec redis redis-cli ping

# Testar conexão
wscat -c ws://localhost/ws/chat/
```

### Problema: Migrações falhando

**Solução:**
```bash
# Verificar migrações pendentes
python manage.py showmigrations

# Fake migrate se necessário
python manage.py migrate --fake app_name migration_name

# Resetar migrações (CUIDADO - apenas desenvolvimento)
python manage.py migrate app_name zero
```

### Problema: Arquivos estáticos não carregam

**Solução:**
```bash
# Coletar estáticos novamente
python manage.py collectstatic --clear --noinput

# Verificar permissões
chmod -R 755 staticfiles/

# Verificar configuração Nginx
nginx -t
```

---

## 🤝 Contribuição

### Como Contribuir

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Padrões de Código

- Siga a [PEP 8](https://pep8.org/)
- Use type hints quando possível
- Documente funções e classes
- Escreva testes para novas features
- Mantenha coverage acima de 80%

### Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: adiciona suporte a pagamento via cartão
fix: corrige erro ao enviar mensagens em lote
docs: atualiza documentação da API
refactor: reorganiza estrutura de produtos
test: adiciona testes para campanhas
```

---

## 📄 Licença

Este projeto é proprietário e confidencial. Todos os direitos reservados.

---

## 📞 Suporte

Para suporte e dúvidas:

- **Email**: suporte@boomerangue.me
- **Documentação**: https://docs.boomerangue.me
- **Issues**: https://github.com/seu-repo/issues

---

## 📚 Recursos Adicionais

### Documentação Externa

- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [Celery Documentation](https://docs.celeryproject.org/)
- [Docker Documentation](https://docs.docker.com/)

### Ferramentas Úteis

- **pgAdmin**: Gerenciamento de banco de dados
- **Postman**: Testar APIs
- **Flower**: Monitorar Celery
- **Sentry**: Monitoramento de erros
- **Grafana**: Dashboards de métricas

---

**Desenvolvido com ❤️ pela equipe Boomerangue**
