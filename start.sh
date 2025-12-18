#!/bin/bash

# Script de inicialização do projeto Boomerangue
# Para Linux/Mac

set -e

echo "========================================="
echo "  Boomerangue - Script de Inicialização"
echo "========================================="
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Função para exibir mensagens
print_message() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    print_error "Docker não está instalado. Por favor, instale o Docker primeiro."
    exit 1
fi

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose não está instalado. Por favor, instale o Docker Compose primeiro."
    exit 1
fi

print_message "Docker e Docker Compose encontrados!"

# Verificar se arquivo .env existe
if [ ! -f .env ]; then
    print_warning "Arquivo .env não encontrado. Copiando de .env.example..."
    cp .env.example .env
    print_warning "Por favor, edite o arquivo .env com suas configurações antes de continuar!"
    echo ""
    read -p "Pressione Enter para continuar depois de configurar o .env..."
fi

print_message "Arquivo .env encontrado!"

# Parar containers existentes (se houver)
print_message "Parando containers existentes..."
docker-compose down 2>/dev/null || true

# Construir imagens
print_message "Construindo imagens Docker..."
docker-compose build

# Iniciar serviços de infraestrutura primeiro
print_message "Iniciando serviços de infraestrutura (MySQL, Redis, RabbitMQ)..."
docker-compose up -d db redis rabbitmq

# Aguardar serviços ficarem prontos
print_message "Aguardando serviços ficarem prontos (pode levar alguns minutos)..."
sleep 10

# Verificar saúde dos serviços
print_message "Verificando saúde dos serviços..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if docker-compose ps | grep -q "healthy"; then
        print_message "Serviços de infraestrutura prontos!"
        break
    fi
    attempt=$((attempt + 1))
    echo -n "."
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    print_error "Timeout aguardando serviços ficarem prontos."
    print_warning "Verifique os logs: docker-compose logs"
    exit 1
fi

echo ""

# Executar migrações
print_message "Executando migrações do banco de dados principal..."
docker-compose run --rm web python manage.py migrate

print_message "Executando migrações do banco PIX..."
docker-compose run --rm web python manage.py migrate --database=pix_db

# Coletar arquivos estáticos
print_message "Coletando arquivos estáticos..."
docker-compose run --rm web python manage.py collectstatic --noinput

# Perguntar se deseja criar superusuário
echo ""
read -p "Deseja criar um superusuário agora? (s/n): " create_superuser
if [ "$create_superuser" = "s" ] || [ "$create_superuser" = "S" ]; then
    docker-compose run --rm web python manage.py createsuperuser
fi

# Iniciar todos os serviços
print_message "Iniciando todos os serviços..."
docker-compose up -d

echo ""
echo "========================================="
echo "  Boomerangue iniciado com sucesso!"
echo "========================================="
echo ""
echo "Serviços disponíveis:"
echo "  - Web App:          http://localhost"
echo "  - Django Admin:     http://localhost/admin"
echo "  - API:              http://localhost/api"
echo "  - RabbitMQ Mgmt:    http://localhost:15672"
echo ""
echo "Comandos úteis:"
echo "  - Ver logs:         docker-compose logs -f"
echo "  - Parar serviços:   docker-compose down"
echo "  - Reiniciar:        docker-compose restart"
echo "  - Status:           docker-compose ps"
echo ""
print_message "Visualizando logs... (Ctrl+C para sair)"
echo ""

docker-compose logs -f
