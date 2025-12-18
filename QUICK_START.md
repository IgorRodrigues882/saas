# 🚀 Guia de Início Rápido - Boomerangue

Este guia ajudará você a executar o Boomerangue em menos de 5 minutos!

## Pré-requisitos

- **Docker** instalado ([Download aqui](https://www.docker.com/get-started))
- **Docker Compose** instalado (geralmente vem com Docker Desktop)
- **8GB de RAM** disponível

## Passos Rápidos

### 1. Clone o Projeto

```bash
git clone <repository-url>
cd projeto-bmm
```

### 2. Configure as Variáveis de Ambiente

```bash
# Linux/Mac
cp .env.example .env

# Windows (CMD)
copy .env.example .env
```

**Edite o arquivo `.env` e altere pelo menos:**
- `SECRET_KEY` - Use uma chave aleatória forte
- `DB_PASSWORD` - Senha do banco de dados
- `OPENAI_API_KEY` - Sua chave da OpenAI (se for usar IA)

### 3. Execute o Script de Inicialização

#### Linux/Mac

```bash
chmod +x start.sh
./start.sh
```

#### Windows

```cmd
start.bat
```

### 4. Acesse a Aplicação

Aguarde alguns minutos e acesse:

- **Web App**: http://localhost
- **Admin**: http://localhost/admin
- **API**: http://localhost/api
- **RabbitMQ**: http://localhost:15672

## Primeiros Passos

### Criar um Superusuário

Se você pulou esta etapa no script de inicialização:

```bash
docker-compose exec web python manage.py createsuperuser
```

### Acessar o Admin

1. Vá para http://localhost/admin
2. Use as credenciais do superusuário criado
3. Explore as 33 aplicações disponíveis!

### Testar a API

```bash
# Obter token
curl -X POST http://localhost/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "seu_usuario", "password": "sua_senha"}'

# Usar o token para acessar a API
curl -X GET http://localhost/api/empresas/ \
  -H "Authorization: Token SEU_TOKEN_AQUI"
```

## Comandos Úteis

### Ver Logs

```bash
# Todos os serviços
docker-compose logs -f

# Serviço específico
docker-compose logs -f web
docker-compose logs -f celery_worker
```

### Parar a Aplicação

```bash
docker-compose down
```

### Reiniciar a Aplicação

```bash
docker-compose restart
```

### Ver Status dos Containers

```bash
docker-compose ps
```

### Executar Comandos Django

```bash
# Migrações
docker-compose exec web python manage.py migrate

# Shell interativo
docker-compose exec web python manage.py shell

# Criar app
docker-compose exec web python manage.py startapp nome_app
```

### Executar Comandos no Banco de Dados

```bash
# Acessar MySQL
docker-compose exec db mysql -u bmm_normal -p

# Fazer backup
docker-compose exec db mysqldump -u bmm_normal -p boomeranguev4 > backup.sql

# Restaurar backup
docker-compose exec -T db mysql -u bmm_normal -p boomeranguev4 < backup.sql
```

## Estrutura de Serviços

O projeto executa os seguintes containers:

| Container | Porta | Descrição |
|-----------|-------|-----------|
| `web` | 8000 | Django/Gunicorn (HTTP) |
| `daphne` | 8001 | ASGI (WebSockets) |
| `nginx` | 80, 443 | Reverse Proxy |
| `db` | 3306 | MySQL |
| `redis` | 6379 | Cache & Queue |
| `rabbitmq` | 5672, 15672 | Message Broker |
| `celery_worker` | - | Async Tasks |
| `celery_beat` | - | Scheduled Tasks |

## Acessar Serviços Externos

### RabbitMQ Management

- **URL**: http://localhost:15672
- **Usuário**: bmm
- **Senha**: bmm_password (ou conforme `.env`)

### Arquivos Estáticos e Media

- **Estáticos**: http://localhost/static/
- **Media**: http://localhost/media/

## Solução de Problemas Comuns

### Erro: "Port already in use"

Outro serviço está usando a porta 80, 3306 ou outra porta necessária.

**Solução:**
```bash
# Parar outros serviços MySQL/Nginx locais
sudo systemctl stop mysql
sudo systemctl stop nginx

# Ou altere as portas no docker-compose.yml
```

### Erro: "MySQL connection refused"

O MySQL ainda está inicializando.

**Solução:**
```bash
# Aguarde mais tempo ou reinicie
docker-compose restart db
docker-compose logs -f db
```

### Erro: "No migrations to apply"

Tudo certo! Não há migrações pendentes.

### Migrações falhando

**Solução:**
```bash
# Verificar conexão com banco
docker-compose exec web python manage.py dbshell

# Tentar migração específica
docker-compose exec web python manage.py migrate nome_app
```

## Próximos Passos

Agora que o projeto está rodando:

1. 📖 Leia o [README.md](README.md) completo
2. 🏢 Cadastre sua primeira empresa
3. 📦 Adicione produtos ao catálogo
4. 🤖 Configure um bot
5. 📊 Crie sua primeira campanha
6. 🔌 Explore a API em http://localhost/api

## Dicas de Desenvolvimento

### Hot Reload

O código é montado como volume, então mudanças são refletidas automaticamente:

```yaml
# Em docker-compose.yml
volumes:
  - .:/home/app
```

### Debugar com PDB

```python
# Adicione no código
import pdb; pdb.set_trace()

# Acesse o container
docker-compose exec web python manage.py runserver
```

### Executar Testes

```bash
docker-compose exec web python manage.py test
```

### Monitorar Celery Tasks

```bash
# Ver tasks ativas
docker-compose exec celery_worker celery -A boomerangue inspect active

# Ver tasks registradas
docker-compose exec celery_worker celery -A boomerangue inspect registered

# Purgar queue
docker-compose exec celery_worker celery -A boomerangue purge
```

## Recursos Adicionais

- **Documentação API**: http://localhost/api/docs/
- **Django Admin**: http://localhost/admin/doc/
- **RabbitMQ Docs**: https://www.rabbitmq.com/documentation.html
- **Celery Docs**: https://docs.celeryproject.org/

---

**Pronto! Você está com o Boomerangue rodando! 🎉**

Para informações mais detalhadas, consulte o [README.md](README.md) completo.
