@echo off
REM Script de inicialização do projeto Boomerangue
REM Para Windows

echo =========================================
echo   Boomerangue - Script de Inicializacao
echo =========================================
echo.

REM Verificar se Docker está instalado
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] Docker nao esta instalado. Por favor, instale o Docker Desktop primeiro.
    pause
    exit /b 1
)

REM Verificar se Docker Compose está instalado
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] Docker Compose nao esta instalado. Por favor, instale o Docker Compose primeiro.
    pause
    exit /b 1
)

echo [OK] Docker e Docker Compose encontrados!
echo.

REM Verificar se arquivo .env existe
if not exist .env (
    echo [!] Arquivo .env nao encontrado. Copiando de .env.example...
    copy .env.example .env
    echo [!] Por favor, edite o arquivo .env com suas configuracoes antes de continuar!
    echo.
    pause
)

echo [OK] Arquivo .env encontrado!
echo.

REM Parar containers existentes (se houver)
echo [OK] Parando containers existentes...
docker-compose down 2>nul

REM Construir imagens
echo [OK] Construindo imagens Docker...
docker-compose build

if %errorlevel% neq 0 (
    echo [X] Erro ao construir imagens Docker.
    pause
    exit /b 1
)

REM Iniciar serviços de infraestrutura primeiro
echo [OK] Iniciando servicos de infraestrutura (MySQL, Redis, RabbitMQ)...
docker-compose up -d db redis rabbitmq

REM Aguardar serviços ficarem prontos
echo [OK] Aguardando servicos ficarem prontos (pode levar alguns minutos)...
timeout /t 15 /nobreak >nul

REM Executar migrações
echo [OK] Executando migracoes do banco de dados principal...
docker-compose run --rm web python manage.py migrate

if %errorlevel% neq 0 (
    echo [!] Aviso: Houve problemas nas migracoes. Continuando...
)

echo [OK] Executando migracoes do banco PIX...
docker-compose run --rm web python manage.py migrate --database=pix_db

if %errorlevel% neq 0 (
    echo [!] Aviso: Houve problemas nas migracoes do PIX. Continuando...
)

REM Coletar arquivos estáticos
echo [OK] Coletando arquivos estaticos...
docker-compose run --rm web python manage.py collectstatic --noinput

REM Perguntar se deseja criar superusuário
echo.
set /p create_superuser="Deseja criar um superusuario agora? (s/n): "
if /i "%create_superuser%"=="s" (
    docker-compose run --rm web python manage.py createsuperuser
)

REM Iniciar todos os serviços
echo.
echo [OK] Iniciando todos os servicos...
docker-compose up -d

if %errorlevel% neq 0 (
    echo [X] Erro ao iniciar servicos.
    pause
    exit /b 1
)

echo.
echo =========================================
echo   Boomerangue iniciado com sucesso!
echo =========================================
echo.
echo Servicos disponiveis:
echo   - Web App:          http://localhost
echo   - Django Admin:     http://localhost/admin
echo   - API:              http://localhost/api
echo   - RabbitMQ Mgmt:    http://localhost:15672
echo.
echo Comandos uteis:
echo   - Ver logs:         docker-compose logs -f
echo   - Parar servicos:   docker-compose down
echo   - Reiniciar:        docker-compose restart
echo   - Status:           docker-compose ps
echo.
echo [OK] Visualizando logs... (Ctrl+C para sair)
echo.

docker-compose logs -f
