#!/bin/bash
# PMOPilot Local Orchestrator
# Sistema completo de orquestación local para desarrollo y pruebas

set -e  # Exit on error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables de configuración
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOCALSTACK_PORT=4566
DYNAMODB_LOCAL_PORT=8000
BACKEND_PORT=8000
FRONTEND_PORT=3000
LOCALSTACK_CONTAINER="pmopilot-localstack"
DOCKER_NETWORK="pmopilot-network"

# Funciones de utilidad
print_header() {
    echo -e "\n${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC}  $1"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}→ $1${NC}"
}

check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "Comando '$1' no encontrado. Por favor instálalo."
        exit 1
    fi
}

wait_for_service() {
    local host=$1
    local port=$2
    local service=$3
    local max_attempts=30
    local attempt=1
    
    print_info "Esperando que $service esté disponible en $host:$port..."
    
    while ! nc -z $host $port 2>/dev/null; do
        if [ $attempt -eq $max_attempts ]; then
            print_error "$service no está disponible después de $max_attempts intentos"
            exit 1
        fi
        
        echo -n "."
        sleep 2
        ((attempt++))
    done
    
    echo ""
    print_success "$service está disponible"
}

# Comandos disponibles
case "${1:-help}" in
    "start")
        print_header "🚀 INICIANDO ENTORNO COMPLETO PMOPILOT"
        
        # Verificar dependencias
        print_header "1. VERIFICANDO DEPENDENCIAS"
        check_command docker
        check_command docker-compose
        check_command python3
        check_command pip3
        check_command npm
        check_command nc  # netcat
        
        # Crear red Docker si no existe
        if ! docker network ls | grep -q $DOCKER_NETWORK; then
            print_info "Creando red Docker: $DOCKER_NETWORK"
            docker network create $DOCKER_NETWORK
        fi
        
        # Iniciar LocalStack
        print_header "2. INICIANDO LOCALSTACK (AWS EMULADO)"
        if docker ps | grep -q $LOCALSTACK_CONTAINER; then
            print_warning "LocalStack ya está ejecutándose"
        else
            print_info "Iniciando contenedor LocalStack..."
            docker run -d \
                --name $LOCALSTACK_CONTAINER \
                --network $DOCKER_NETWORK \
                -p $LOCALSTACK_PORT:$LOCALSTACK_PORT \
                -p $DYNAMODB_LOCAL_PORT:$DYNAMODB_LOCAL_PORT \
                -e SERVICES=dynamodb,s3,sqs,sns,lambda \
                -e DATA_DIR=/tmp/localstack/data \
                -v /tmp/localstack:/tmp/localstack \
                -v /var/run/docker.sock:/var/run/docker.sock \
                localstack/localstack
            
            wait_for_service localhost $LOCALSTACK_PORT "LocalStack"
            
            # Configurar servicios en LocalStack
            print_info "Configurando DynamoDB en LocalStack..."
            aws configure set aws_access_key_id test --profile localstack
            aws configure set aws_secret_access_key test --profile localstack
            aws configure set region us-east-1 --profile localstack
            
            # Crear tabla DynamoDB
            aws dynamodb create-table \
                --table-name pmopilot_main \
                --attribute-definitions \
                    AttributeName=PK,AttributeType=S \
                    AttributeName=SK,AttributeType=S \
                    AttributeName=GSI1_PK,AttributeType=S \
                    AttributeName=GSI1_SK,AttributeType=S \
                --key-schema \
                    AttributeName=PK,KeyType=HASH \
                    AttributeName=SK,KeyType=RANGE \
                --provisioned-throughput \
                    ReadCapacityUnits=5,WriteCapacityUnits=5 \
                --global-secondary-indexes \
                    '[
                        {
                            \"IndexName\": \"GSI1\",
                            \"KeySchema\": [
                                {\"AttributeName\": \"GSI1_PK\", \"KeyType\": \"HASH\"},
                                {\"AttributeName\": \"GSI1_SK\", \"KeyType\": \"RANGE\"}
                            ],
                            \"Projection\": {\"ProjectionType\": \"ALL\"},
                            \"ProvisionedThroughput\": {
                                \"ReadCapacityUnits\": 5,
                                \"WriteCapacityUnits\": 5
                            }
                        }
                    ]' \
                --endpoint-url http://localhost:$LOCALSTACK_PORT \
                --profile localstack 2>/dev/null || true
        fi
        
        # Configurar variables de entorno
        print_header "3. CONFIGURANDO ENTORNO"
        
        if [ ! -f "$PROJECT_ROOT/.env" ]; then
            print_info "Creando archivo .env desde ejemplo..."
            cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env"
            
            # Actualizar con configuración LocalStack
            sed -i.bak 's|DYNAMODB_ENDPOINT=.*|DYNAMODB_ENDPOINT=http://localhost:'$LOCALSTACK_PORT'|' "$PROJECT_ROOT/.env"
            sed -i.bak 's|AWS_ACCESS_KEY_ID=.*|AWS_ACCESS_KEY_ID=test|' "$PROJECT_ROOT/.env"
            sed -i.bak 's|AWS_SECRET_ACCESS_KEY=.*|AWS_SECRET_ACCESS_KEY=test|' "$PROJECT_ROOT/.env"
            sed -i.bak 's|AWS_REGION=.*|AWS_REGION=us-east-1|' "$PROJECT_ROOT/.env"
            sed -i.bak 's|APP_ENVIRONMENT=.*|APP_ENVIRONMENT=development|' "$PROJECT_ROOT/.env"
            
            rm -f "$PROJECT_ROOT/.env.bak"
            print_success "Archivo .env configurado para LocalStack"
        else
            print_warning "Archivo .env ya existe, usando configuración existente"
        fi
        
        # Instalar dependencias backend
        print_header "4. INSTALANDO DEPENDENCIAS BACKEND"
        
        if [ ! -d "$PROJECT_ROOT/.venv" ]; then
            print_info "Creando entorno virtual Python..."
            python3 -m venv "$PROJECT_ROOT/.venv"
        fi
        
        # Activar entorno virtual
        source "$PROJECT_ROOT/.venv/bin/activate"
        
        print_info "Instalando/actualizando dependencias Python..."
        pip install --upgrade pip
        pip install -r "$PROJECT_ROOT/apps/backend/requirements.txt"
        
        # Instalar dependencias frontend
        print_header "5. INSTALANDO DEPENDENCIAS FRONTEND"
        
        if [ ! -d "$PROJECT_ROOT/apps/frontend/node_modules" ]; then
            print_info "Instalando dependencias Node.js..."
            cd "$PROJECT_ROOT/apps/frontend"
            npm install
            cd "$PROJECT_ROOT"
        else
            print_warning "Dependencias Node.js ya instaladas"
        fi
        
        # Instalar dependencias raíz
        if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
            print_info "Instalando dependencias raíz (concurrently)..."
            npm install
        fi
        
        # Iniciar servicios
        print_header "6. INICIANDO SERVICIOS PMOPILOT"
        
        # Verificar que LocalStack está listo
        wait_for_service localhost $LOCALSTACK_PORT "LocalStack"
        
        # Iniciar backend en background
        print_info "Iniciando backend FastAPI (puerto $BACKEND_PORT)..."
        cd "$PROJECT_ROOT"
        source "$PROJECT_ROOT/.venv/bin/activate"
        
        # Ejecutar backend en background
        uvicorn apps.backend.src.main:app \
            --host 0.0.0.0 \
            --port $BACKEND_PORT \
            --reload \
            --log-level info \
            --env-file "$PROJECT_ROOT/.env" &
        
        BACKEND_PID=$!
        echo $BACKEND_PID > "$PROJECT_ROOT/.backend.pid"
        
        wait_for_service localhost $BACKEND_PORT "Backend FastAPI"
        
        # Iniciar frontend en background
        print_info "Iniciando frontend React + Proxy (puerto $FRONTEND_PORT)..."
        cd "$PROJECT_ROOT/apps/frontend"
        npm run dev &
        
        FRONTEND_PID=$!
        echo $FRONTEND_PID > "$PROJECT_ROOT/.frontend.pid"
        
        wait_for_service localhost $FRONTEND_PORT "Frontend React"
        
        # Mostrar resumen
        print_header "🎉 ENTORNO PMOPILOT INICIADO EXITOSAMENTE"
        
        cat << EOF

${GREEN}✅ TODOS LOS SERVICIOS ESTÁN ACTIVOS${NC}

${BLUE}🔗 URLs de acceso:${NC}
• Frontend:      ${GREEN}http://localhost:3000${NC}
• Backend API:   ${GREEN}http://localhost:8000${NC}
• API Docs:      ${GREEN}http://localhost:8000/api/docs${NC}
• LocalStack:    ${GREEN}http://localhost:4566${NC}
• Health Check:  ${GREEN}http://localhost:8000/api/health${NC}

${BLUE}🛠️  Comandos útiles:${NC}
• Ver logs:      ${YELLOW}./pmopilot-local.sh logs${NC}
• Parar todo:    ${YELLOW}./pmopilot-local.sh stop${NC}
• Estado:        ${YELLOW}./pmopilot-local.sh status${NC}
• Limpiar:       ${YELLOW}./pmopilot-local.sh cleanup${NC}

${BLUE}🚀 Modo demo activado por defecto:${NC}
• Estado demo:   ${GREEN}http://localhost:8000/api/project/state?demo=true${NC}
• Modo producción: ${GREEN}http://localhost:8000/api/project/state?demo=false${NC}

${BLUE}📝 Pruebas rápidas:${NC}
curl -X GET "http://localhost:8000/api/health"
curl -X GET "http://localhost:8000/api/project/state?demo=true"
curl -X POST "http://localhost:8000/api/semantic-memory" \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Hola PMOPilot, crea una tarea para optimizar la base de datos"}'

${YELLOW}⚠️  Presiona Ctrl+C para detener todos los servicios${NC}

EOF
        
        # Mantener script ejecutándose para capturar Ctrl+C
        trap 'print_header "Deteniendo servicios..."; ./pmopilot-local.sh stop; exit 0' INT
        
        wait $BACKEND_PID $FRONTEND_PID
        
        ;;
    
    "stop")
        print_header "🛑 DETENIENDO ENTORNO PMOPILOT"
        
        # Detener frontend
        if [ -f "$PROJECT_ROOT/.frontend.pid" ]; then
            FRONTEND_PID=$(cat "$PROJECT_ROOT/.frontend.pid")
            if kill -0 $FRONTEND_PID 2>/dev/null; then
                print_info "Deteniendo frontend (PID: $FRONTEND_PID)..."
                kill $FRONTEND_PID
                rm -f "$PROJECT_ROOT/.frontend.pid"
                print_success "Frontend detenido"
            fi
        fi
        
        # Detener backend
        if [ -f "$PROJECT_ROOT/.backend.pid" ]; then
            BACKEND_PID=$(cat "$PROJECT_ROOT/.backend.pid")
            if kill -0 $BACKEND_PID 2>/dev/null; then
                print_info "Deteniendo backend (PID: $BACKEND_PID)..."
                kill $BACKEND_PID
                rm -f "$PROJECT_ROOT/.backend.pid"
                print_success "Backend detenido"
            fi
        fi
        
        # Detener LocalStack
        if docker ps | grep -q $LOCALSTACK_CONTAINER; then
            print_info "Deteniendo LocalStack..."
            docker stop $LOCALSTACK_CONTAINER > /dev/null
            docker rm $LOCALSTACK_CONTAINER > /dev/null
            print_success "LocalStack detenido"
        fi
        
        print_success "Todos los servicios detenidos"
        ;;
    
    "status")
        print_header "📊 ESTADO DEL ENTORNO PMOPILOT"
        
        echo -e "\n${BLUE}SERVICIOS:${NC}"
        
        # LocalStack
        if docker ps | grep -q $LOCALSTACK_CONTAINER; then
            echo -e "• LocalStack:     ${GREEN}✅ EJECUTÁNDOSE${NC}"
        else
            echo -e "• LocalStack:     ${RED}❌ DETENIDO${NC}"
        fi
        
        # Backend
        if [ -f "$PROJECT_ROOT/.backend.pid" ]; then
            BACKEND_PID=$(cat "$PROJECT_ROOT/.backend.pid")
            if kill -0 $BACKEND_PID 2>/dev/null; then
                echo -e "• Backend API:    ${GREEN}✅ EJECUTÁNDOSE (PID: $BACKEND_PID)${NC}"
            else
                echo -e "• Backend API:    ${RED}❌ DETENIDO${NC}"
            fi
        else
            echo -e "• Backend API:    ${YELLOW}⚠️  NO INICIADO${NC}"
        fi
        
        # Frontend
        if [ -f "$PROJECT_ROOT/.frontend.pid" ]; then
            FRONTEND_PID=$(cat "$PROJECT_ROOT/.frontend.pid")
            if kill -0 $FRONTEND_PID 2>/dev/null; then
                echo -e "• Frontend:       ${GREEN}✅ EJECUTÁNDOSE (PID: $FRONTEND_PID)${NC}"
            else
                echo -e "• Frontend:       ${RED}❌ DETENIDO${NC}"
            fi
        else
            echo -e "• Frontend:       ${YELLOW}⚠️  NO INICIADO${NC}"
        fi
        
        # Verificar conectividad
        echo -e "\n${BLUE}CONECTIVIDAD:${NC}"
        
        if nc -z localhost $LOCALSTACK_PORT 2>/dev/null; then
            echo -e "• LocalStack:     ${GREEN}✅ ACCESIBLE${NC}"
        else
            echo -e "• LocalStack:     ${RED}❌ INACCESIBLE${NC}"
        fi
        
        if nc -z localhost $BACKEND_PORT 2>/dev/null; then
            echo -e "• Backend API:    ${GREEN}✅ ACCESIBLE${NC}"
        else
            echo -e "• Backend API:    ${RED}❌ INACCESIBLE${NC}"
        fi
        
        if nc -z localhost $FRONTEND_PORT 2>/dev/null; then
            echo -e "• Frontend:       ${GREEN}✅ ACCESIBLE${NC}"
        else
            echo -e "• Frontend:       ${RED}❌ INACCESIBLE${NC}"
        fi
        
        # URLs
        echo -e "\n${BLUE}URLs:${NC}"
        echo "• Frontend:      http://localhost:$FRONTEND_PORT"
        echo "• Backend:       http://localhost:$BACKEND_PORT"
        echo "• API Docs:      http://localhost:$BACKEND_PORT/api/docs"
        echo "• Health Check:  http://localhost:$BACKEND_PORT/api/health"
        
        # Probar health check
        echo -e "\n${BLUE}HEALTH CHECK:${NC}"
        if curl -s http://localhost:$BACKEND_PORT/api/health > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Backend respondiendo correctamente${NC}"
        else
            echo -e "${RED}❌ Backend no responde${NC}"
        fi
        ;;
    
    "logs")
        print_header "📋 LOGS DEL SISTEMA"
        
        echo -e "${BLUE}Backend logs (últimas 20 líneas):${NC}"
        if [ -f "$PROJECT_ROOT/.backend.pid" ]; then
            BACKEND_PID=$(cat "$PROJECT_ROOT/.backend.pid")
            # Mostrar logs del proceso (puede requerir configuración de logging)
            echo "PID: $BACKEND_PID"
        else
            echo "Backend no está ejecutándose"
        fi
        
        echo -e "\n${BLUE}Frontend logs (últimas 20 líneas):${NC}"
        if [ -f "$PROJECT_ROOT/.frontend.pid" ]; then
            FRONTEND_PID=$(cat "$PROJECT_ROOT/.frontend.pid")
            echo "PID: $FRONTEND_PID"
        else
            echo "Frontend no está ejecutándose"
        fi
        
        echo -e "\n${BLUE}LocalStack logs (últimas 10 líneas):${NC}"
        if docker ps | grep -q $LOCALSTACK_CONTAINER; then
            docker logs --tail 10 $LOCALSTACK_CONTAINER
        else
            echo "LocalStack no está ejecutándose"
        fi
        ;;
    
    "cleanup")
        print_header "🧹 LIMPIANDO ENTORNO PMOPILOT"
        
        # Detener todos los servicios primero
        ./pmopilot-local.sh stop
        
        # Eliminar archivos temporales
        print_info "Eliminando archivos temporales..."
        rm -f "$PROJECT_ROOT/.backend.pid" "$PROJECT_ROOT/.frontend.pid"
        rm -rf "$PROJECT_ROOT/.venv"
        rm -rf "$PROJECT_ROOT/apps/frontend/node_modules"
        rm -rf "$PROJECT_ROOT/node_modules"
        rm -rf "$PROJECT_ROOT/__pycache__"
        rm -rf "$PROJECT_ROOT/apps/backend/__pycache__"
        
        # Eliminar red Docker
        if docker network ls | grep -q $DOCKER_NETWORK; then
            print_info "Eliminando red Docker: $DOCKER_NETWORK"
            docker network rm $DOCKER_NETWORK
        fi
        
        # Limpiar Docker
        print_info "Limpiando contenedores Docker huérfanos..."
        docker system prune -f
        
        print_success "Entorno completamente limpiado"
        ;;
    
    "test")
        print_header "🧪 EJECUTANDO PRUEBAS RÁPIDAS"
        
        # Verificar que los servicios están activos
        ./pmopilot-local.sh status
        
        echo -e "\n${BLUE}Ejecutando pruebas de API...${NC}"
        
        # Prueba 1: Health check
        echo -e "\n${YELLOW}1. Health Check:${NC}"
        curl -s http://localhost:$BACKEND_PORT/api/health | python3 -m json.tool
        
        # Prueba 2: Estado del proyecto demo
        echo -e "\n${YELLOW}2. Estado del proyecto (demo):${NC}"
        curl -s "http://localhost:$BACKEND_PORT/api/project/state?demo=true" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f'✅ Proyecto: {data.get(\"last_updated\", \"N/A\")}')
print(f'• Épicas: {len(data.get(\"epics\", []))}')
print(f'• Historias: {len(data.get(\"stories\", []))}')
print(f'• Tareas: {len(data.get(\"tasks\", []))}')
print(f'• Miembros: {len(data.get(\"team_members\", []))}')
print(f'• Tasa completado: {data.get(\"metrics\", {}).get(\"completion_rate\", 0)}%')
"
        
        # Prueba 3: Semantic Memory
        echo -e "\n${YELLOW}3. Semantic Memory (crear tarea):${NC}"
        curl -s -X POST "http://localhost:$BACKEND_PORT/api/semantic-memory" \
            -H "Content-Type: application/json" \
            -d '{
                "message": "Hola PMOPilot, crea una tarea para optimizar la base de datos DynamoDB",
                "history": [],
                "project_context": {}
            }' | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f'✅ Respuesta: {data[\"response\"][:100]}...')
if data.get(\"proposed_action\"):
    print(f'• Acción propuesta: {data[\"proposed_action\"][\"type\"]}')
    print(f'• Título: {data[\"proposed_action\"][\"data\"].get(\"title\", \"N/A\")}')
"
        
        # Prueba 4: Frontend proxy
        echo -e "\n${YELLOW}4. Frontend Proxy:${NC}"
        curl -s http://localhost:$FRONTEND_PORT/api/health | python3 -m json.tool
        
        print_success "\n✅ Todas las pruebas completadas"
        ;;
    
    "help"|*)
        print_header "🆘 AYUDA - PMOPILOT LOCAL ORCHESTRATOR"
        
        cat << EOF
${GREEN}Uso: ./pmopilot-local.sh [comando]${NC}

${BLUE}Comandos disponibles:${NC}
${GREEN}  start${NC}     - Inicia entorno completo (LocalStack + Backend + Frontend)
${GREEN}  stop${NC}      - Detiene todos los servicios
${GREEN}  status${NC}    - Muestra estado de todos los servicios
${GREEN}  logs${NC}      - Muestra logs de los servicios
${GREEN}  test${NC}      - Ejecuta pruebas rápidas de API
${GREEN}  cleanup${NC}   - Detiene y limpia completamente el entorno
${GREEN}  help${NC}      - Muestra esta ayuda

${BLUE}Requisitos:${NC}
• Docker y Docker Compose
• Python 3.11+ y pip
• Node.js 18+ y npm
• netcat (nc)

${BLUE}Flujo típico:${NC}
1. ${YELLOW}./pmopilot-local.sh start${NC}   # Inicia todo
2. ${YELLOW}./pmopilot-local.sh test${NC}    # Prueba que funcione
3. ${YELLOW}./pmopilot-local.sh status${NC}  # Verifica estado
4. ${YELLOW}./pmopilot-local.sh stop${NC}    # Detiene al terminar

${BLUE}Acceso rápido después de iniciar:${NC}
• Frontend: http://localhost:3000
• API Docs: http://localhost:8000/api/docs
• Health:   http://localhost:8000/api/health

${YELLOW}Nota:${NC} El script configurará automáticamente:
• LocalStack para AWS emulado
• DynamoDB local
• Variables de entorno
• Entorno virtual Python
• Dependencias Node.js

EOF
        ;;
esac