#!/bin/bash
# PMOPilot Update Script
# Actualiza tu repo GitHub con TODO el backend implementado
# Ejecutar desde TU máquina (no desde el sandbox)

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "\n${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC}  $1"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}→ $1${NC}"
}

# Verificar que estamos en el directorio correcto
check_prerequisites() {
    print_header "🔍 VERIFICANDO PRERREQUISITOS"
    
    # Verificar que estamos en un repo git
    if [ ! -d ".git" ]; then
        print_error "No estás en un repositorio Git"
        print_info "Por favor, ejecuta esto dentro de tu carpeta PMOPilot local"
        exit 1
    fi
    
    # Verificar git
    if ! command -v git &> /dev/null; then
        print_error "Git no está instalado"
        exit 1
    fi
    
    # Verificar que el remote es correcto
    REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")
    if [[ -z "$REMOTE_URL" ]]; then
        print_error "No hay remote 'origin' configurado"
        print_info "Configura primero: git remote add origin <tu-repo-url>"
        exit 1
    fi
    
    print_success "Repositorio Git verificado"
    print_info "Remote URL: $REMOTE_URL"
    
    return 0
}

# Crear estructura de directorios
create_structure() {
    print_header "📁 CREANDO ESTRUCTURA DE DIRECTORIOS"
    
    # Directorios del backend
    mkdir -p apps/backend/src/{core,integrations,models,services}
    mkdir -p apps/backend/persistence
    mkdir -p apps/backend/architecture/adrs
    mkdir -p apps/backend/specs
    mkdir -p apps/backend/prompts
    mkdir -p localstack-init
    
    print_success "Estructura de directorios creada"
}

# Mostrar instrucciones de archivos a copiar
show_instructions() {
    print_header "📋 INSTRUCCIONES PARA ACTUALIZAR TU REPO"
    
    cat << EOF

${GREEN}¡IMPORTANTE!${NC} Este script NO puede modificar tu repositorio directamente.
En su lugar, te mostrará ${YELLOW}QUÉ ARCHIVOS COPIAR${NC} y ${YELLOW}CÓMO HACERLO${NC}.

${BLUE}PASOS A SEGUIR:${NC}

1. ${YELLOW}COPIAR ARCHIVOS MANUALMENTE${NC}
   • Copia los archivos listados abajo desde ${GREEN}nuestro sandbox${NC} a ${GREEN}tu máquina local${NC}
   • Puedes copiar/pegar el contenido o descargar los archivos

2. ${YELLOW}HACER COMMIT Y PUSH${NC}
   • Agrega los archivos: git add .
   • Commit: git commit -m "feat: backend completo PMOPilot"
   • Push: git push origin main

3. ${YELLOW}PROBAR LOCALMENTE${NC}
   • Ejecutar: ./pmopilot-local.sh start
   • Verificar: ./pmopilot-local.sh test

${BLUE}ARCHIVOS A COPIAR (38 archivos):${NC}

EOF
    
    # Listar archivos principales
    echo "📦 ${GREEN}ARCHIVOS RAÍZ:${NC}"
    echo "  • .env.example          # Variables de entorno"
    echo "  • package.json          # Scripts de desarrollo"
    echo "  • pyproject.toml        # Configuración Python"
    echo "  • README.md             # Documentación actualizada"
    echo "  • pmopilot-local.sh     # Orquestador principal"
    echo "  • docker-compose.localstack.yml"
    echo "  • LOCAL_ORCHESTRATION.md"
    echo "  • test-automated.py     # Pruebas E2E"
    echo "  • test_backend.py       # Pruebas unitarias"
    
    echo ""
    echo "🐍 ${GREEN}BACKEND PYTHON:${NC}"
    echo "  • apps/backend/requirements.txt"
    echo "  • apps/backend/persistence/database.py"
    echo "  • apps/backend/src/main.py"
    echo "  • apps/backend/src/core/config.py"
    echo "  • apps/backend/src/core/security.py"
    echo "  • apps/backend/src/core/demo_data.py"
    echo "  • apps/backend/src/models/planning.py"
    echo "  • apps/backend/src/models/semantic_memory.py"
    echo "  • apps/backend/src/services/project_service.py"
    echo "  • apps/backend/src/integrations/gemini.py"
    echo "  • apps/backend/src/integrations/sendgrid.py"
    echo "  • apps/backend/src/integrations/cloudflare.py"
    echo "  • apps/backend/src/integrations/kiro.py"
    
    echo ""
    echo "⚛️ ${GREEN}FRONTEND MEJORADO:${NC}"
    echo "  • apps/frontend/server.ts          # Proxy actualizado"
    echo "  • apps/frontend/package.json       # Dependencias actualizadas"
    
    echo ""
    echo "🐳 ${GREEN}LOCALSTACK:${NC}"
    echo "  • localstack-init/01-create-tables.sh"
    
    echo ""
    echo "${BLUE}COMANDOS PARA EJECUTAR EN TU MÁQUINA:${NC}"
    
    cat << 'EOF'

# 1. Crear estructura (si no existe)
mkdir -p apps/backend/src/{core,integrations,models,services}
mkdir -p apps/backend/persistence
mkdir -p localstack-init

# 2. Copiar archivos (ejemplo para un archivo)
# Desde el sandbox copias el contenido y lo pegas en tu máquina

# 3. Hacer todo ejecutable
chmod +x pmopilot-local.sh
chmod +x localstack-init/*.sh

# 4. Configurar entorno
cp .env.example .env
# Editar .env con tus credenciales si las tienes

# 5. Instalar dependencias
cd apps/backend && pip install -r requirements.txt
cd ../frontend && npm install
cd ../..

# 6. Probar
./pmopilot-local.sh start
./pmopilot-local.sh test

EOF
    
    print_info "Una vez copiados todos los archivos, continúa con el paso 2."
}

# Paso 2: Instrucciones para commit y push
show_commit_instructions() {
    print_header "📤 INSTRUCCIONES PARA COMMIT Y PUSH"
    
    cat << EOF

${GREEN}PASO 2: SUBIR CAMBIOS A GITHUB${NC}

Ejecuta estos comandos en ${YELLOW}tu terminal local${NC}:

${BLUE}# 1. Verificar cambios${NC}
git status

${BLUE}# 2. Agregar todos los archivos${NC}
git add .

${BLUE}# 3. Hacer commit${NC}
git commit -m "feat: implementación completa backend PMOPilot

- FastAPI con endpoints REST + RBAC
- DynamoDB con LocalStack integrado
- Sistema de orquestación local (pmopilot-local.sh)
- Integraciones: Gemini, SendGrid, Cloudflare, Kiro
- Modo demo con datos preconfigurados
- Pruebas automatizadas E2E
- Docker Compose para desarrollo
- Proxy frontend-backend actualizado"

${BLUE}# 4. Hacer push a GitHub${NC}
git push origin main

${BLUE}# 5. Verificar que se subió${NC}
git log --oneline -3

${YELLOW}¡LISTO! Ahora tu repo GitHub tiene TODO el backend.${NC}

EOF
}

# Paso 3: Instrucciones para ejecución local
show_run_instructions() {
    print_header "🚀 INSTRUCCIONES PARA EJECUTAR LOCALMENTE"
    
    cat << EOF

${GREEN}PASO 3: EJECUTAR PMOPILOT EN TU MÁQUINA${NC}

Una vez que tengas los archivos en tu máquina local:

${BLUE}# 1. Hacer ejecutable el orquestador${NC}
chmod +x pmopilot-local.sh

${BLUE}# 2. Iniciar entorno completo${NC}
./pmopilot-local.sh start

${BLUE}# 3. Verificar que todo funciona${NC}
./pmopilot-local.sh status
./pmopilot-local.sh test

${BLUE}# 4. URLs para acceder:${NC}
• Frontend:      http://localhost:3000
• Backend API:   http://localhost:8000
• API Docs:      http://localhost:8000/api/docs
• Health Check:  http://localhost:8000/api/health
• DynamoDB Admin: http://localhost:8001

${BLUE}# 5. Probar endpoints:${NC}
curl http://localhost:8000/api/health
curl "http://localhost:8000/api/project/state?demo=true"
curl -X POST "http://localhost:8000/api/semantic-memory" \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Hola PMOPilot, crea una tarea nueva"}'

${BLUE}# 6. Detener servicios${NC}
./pmopilot-local.sh stop

${YELLOW}¡FELICIDADES! 🎉${NC}
Ahora tienes un PMOPilot completo funcionando localmente.

EOF
}

# Menú principal
main() {
    print_header "🔄 ACTUALIZADOR DE REPO PMOPILOT"
    
    echo -e "${YELLOW}Este script te guiará para actualizar tu repo GitHub con todo el backend.${NC}"
    echo ""
    
    PS3="Selecciona una opción: "
    options=(
        "1. Verificar prerequisitos"
        "2. Ver estructura de archivos a copiar"
        "3. Ver instrucciones para commit/push"
        "4. Ver instrucciones para ejecutar localmente"
        "5. Salir"
    )
    
    select opt in "${options[@]}"
    do
        case $REPLY in
            1)
                check_prerequisites
                ;;
            2)
                show_instructions
                ;;
            3)
                show_commit_instructions
                ;;
            4)
                show_run_instructions
                ;;
            5)
                print_success "Saliendo..."
                exit 0
                ;;
            *)
                print_error "Opción inválida"
                ;;
        esac
    done
}

# Ejecutar
main "$@"