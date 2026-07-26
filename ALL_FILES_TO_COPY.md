# 📦 TODOS LOS ARCHIVOS PARA COPIAR - PMOPILOT BACKEND COMPLETO

## 🎯 **INSTRUCCIONES RÁPIDAS:**

### **1. CREAR ESTRUCTURA EN TU MÁQUINA:**
```bash
# En tu carpeta PMOPilot local (donde está el frontend)
mkdir -p apps/backend/src/{core,integrations,models,services}
mkdir -p apps/backend/persistence
mkdir -p apps/backend/architecture/adrs
mkdir -p apps/backend/specs
mkdir -p apps/backend/prompts
mkdir -p localstack-init
```

### **2. COPIAR ESTOS ARCHIVOS:**
(Copia el contenido de cada archivo de abajo ↓)

### **3. HACER COMMIT Y PUSH:**
```bash
git add .
git commit -m "feat: backend completo PMOPilot"
git push origin main
```

### **4. EJECUTAR:**
```bash
chmod +x pmopilot-local.sh
./pmopilot-local.sh start
./pmopilot-local.sh test
```

---

## 📁 **ARCHIVOS RAÍZ:**

### **1. `.env.example`**
```env
# Configuración AWS y DynamoDB
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_KEY
AWS_REGION=us-east-1
DYNAMODB_ENDPOINT=http://localhost:4566  # Local para desarrollo, dejar vacío para producción
DYNAMODB_TABLE_PREFIX=pmopilot_

# Configuración Google Gemini
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
GEMINI_MODEL=gemini-2.5-flash

# Configuración SendGrid
SENDGRID_API_KEY=YOUR_SENDGRID_API_KEY
SENDGRID_FROM_EMAIL=noreply@pmopilot.dev

# Configuración Cloudflare
CLOUDFLARE_API_TOKEN=YOUR_CLOUDFLARE_API_TOKEN
CLOUDFLARE_ZONE_ID=YOUR_CLOUDFLARE_ZONE_ID
CLOUDFLARE_ACCOUNT_ID=YOUR_CLOUDFLARE_ACCOUNT_ID

# Configuración de la aplicación
APP_ENVIRONMENT=development  # development, staging, production
APP_NAME=PMOPilot
APP_VERSION=0.1.0
API_PREFIX=/api
BACKEND_PORT=8000
FRONTEND_PORT=3000
CORS_ORIGINS=http://localhost:3000,http://localhost:8000

# Configuración de seguridad
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# Configuración de roles RBAC
DEFAULT_USER_ROLE=guest
ALLOWED_ROLES=leader,tester,guest
```

### **2. `package.json`** (actualizar el existente)
```json
{
  "name": "pmopilot",
  "version": "0.1.0",
  "description": "PMOPilot - AI Semantic Orchestrator PMO for Spec-Driven Development Teams",
  "private": true,
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "cd apps/backend && uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload",
    "dev:frontend": "cd apps/frontend && npm run dev",
    "install:all": "npm install && cd apps/frontend && npm install && cd ../backend && pip install -r requirements.txt",
    "setup:env": "cp .env.example .env",
    "test": "echo \"No tests configured yet\"",
    "build": "echo \"Build process not implemented\"",
    "start": "echo \"Please use 'npm run dev' for development\""
  },
  "keywords": [
    "pmopilot",
    "ai",
    "semantic",
    "pmo",
    "sdd",
    "spec-driven-development",
    "orchestrator"
  ],
  "author": "Team PMOPilot",
  "license": "MIT",
  "devDependencies": {
    "concurrently": "^8.2.2"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=8.0.0"
  }
}
```

### **3. `pyproject.toml`**
```toml
[tool.poetry]
name = "pmopilot-backend"
version = "0.1.0"
description = "Backend de PMOPilot - AI Semantic Orchestrator PMO para Spec-Driven Development"
authors = ["Team PMOPilot"]
readme = "README.md"
packages = [{include = "apps/backend"}]

[tool.poetry.dependencies]
python = "^3.11"
fastapi = "^0.115.6"
uvicorn = {extras = ["standard"], version = "^0.34.0"}
pydantic = "^2.10.3"
pydantic-settings = "^2.7.0"
boto3 = "^1.35.71"
google-generativeai = "^0.8.4"
sendgrid = "^6.11.0"
python-multipart = "^0.0.16"
python-jose = "^3.3.0"
passlib = {extras = ["bcrypt"], version = "^1.7.4"}
httpx = "^0.28.0"
python-dotenv = "^1.0.1"

[tool.poetry.group.dev.dependencies]
pytest = "^8.3.4"
pytest-asyncio = "^0.24.0"
black = "^24.10.0"
ruff = "^0.8.4"
mypy = "^1.13.0"

[build-system]
requires = ["poetry-core"]
build-backend = "poetry.core.masonry.api"

[tool.black]
line-length = 88
target-version = ['py312']

[tool.ruff]
line-length = 88
target-version = "py312"
select = [
    "E",  # pycodestyle errors
    "W",  # pycodestyle warnings
    "F",  # pyflakes
    "I",  # isort
    "B",  # flake8-bugbear
]

[tool.mypy]
python_version = "3.12"
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true
```

### **4. `pmopilot-local.sh`**
```bash
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

# [CONTINÚA EL SCRIPT COMPLETO...]
# El script es muy largo (150+ líneas), copia el archivo completo
```

**Nota:** El script `pmopilot-local.sh` es muy largo. Mejor descargar/copiar el archivo completo.

### **5. `docker-compose.localstack.yml`**
```yaml
version: '3.8'

services:
  localstack:
    image: localstack/localstack:latest
    container_name: pmopilot-localstack
    ports:
      - "4566:4566"            # LocalStack Gateway
      - "8000:8000"            # DynamoDB Local
      - "4571:4571"            # CloudFormation
      - "4572:4572"            # CloudWatch
      - "4576:4576"            # SQS
      - "4584:4584"            # CloudWatch Logs
      - "4593:4593"            # STS
    environment:
      - SERVICES=dynamodb,s3,sqs,sns,lambda,cloudwatch,logs,sts
      - DEBUG=${DEBUG:-1}
      - DATA_DIR=/tmp/localstack/data
      - DOCKER_HOST=unix:///var/run/docker.sock
      - DEFAULT_REGION=us-east-1
      - LAMBDA_EXECUTOR=docker-reuse
      - LAMBDA_REMOTE_DOCKER=false
      - HOSTNAME_EXTERNAL=localhost
    volumes:
      - "/tmp/localstack:/tmp/localstack"
      - "/var/run/docker.sock:/var/run/docker.sock"
      - "./localstack-init:/docker-entrypoint-initaws.d"
    networks:
      - pmopilot-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4566/_localstack/health"]
      interval: 10s
      timeout: 5s
      retries: 10

  dynamodb-admin:
    image: aaronshaf/dynamodb-admin:latest
    container_name: pmopilot-dynamodb-admin
    ports:
      - "8001:8001"
    environment:
      - DYNAMO_ENDPOINT=http://localstack:4566
      - AWS_REGION=us-east-1
      - AWS_ACCESS_KEY_ID=test
      - AWS_SECRET_ACCESS_KEY=test
    depends_on:
      - localstack
    networks:
      - pmopilot-network

networks:
  pmopilot-network:
    driver: bridge
    name: pmopilot-network
```

**Los otros archivos raíz (`test-automated.py`, `test_backend.py`, `LOCAL_ORCHESTRATION.md`) también son largos. Mejor copiar los archivos completos.**

---

## 🐍 **ARCHIVOS BACKEND:**

### **6. `apps/backend/requirements.txt`**
```txt
fastapi==0.115.6
uvicorn[standard]==0.34.0
pydantic==2.10.3
pydantic-settings==2.7.0
boto3==1.35.71
google-generativeai==0.8.4
sendgrid==6.11.0
python-multipart==0.0.16
python-jose==3.3.0
passlib[bcrypt]==1.7.4
httpx==0.28.0
python-dotenv==1.0.1
pytest==8.3.4
pytest-asyncio==0.24.0
black==24.10.0
ruff==0.8.4
mypy==1.13.0
```

### **7. `apps/backend/persistence/database.py`**
```python
import os
import boto3
import time
from typing import Dict, List, Any, Optional
from botocore.exceptions import ClientError
from ..src.core.config import settings

class DynamoDBClient:
    _instance = None
    _resource = None

    @classmethod
    def get_client(cls):
        if cls._instance is None:
            # Configuración base del cliente
            client_args = {
                "region_name": settings.aws_region,
                "aws_access_key_id": settings.aws_access_key_id,
                "aws_secret_access_key": settings.aws_secret_access_key,
            }

            # Detectar LocalStack automáticamente si no hay endpoint configurado
            endpoint_url = settings.dynamodb_endpoint
            
            # Si no hay endpoint configurado, probar LocalStack
            if not endpoint_url:
                # Intentar conectar a LocalStack en puertos comunes
                localstack_ports = [4566, 8000]
                import socket
                
                for port in localstack_ports:
                    try:
                        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                        sock.settimeout(1)
                        result = sock.connect_ex(('localhost', port))
                        sock.close()
                        
                        if result == 0:
                            endpoint_url = f"http://localhost:{port}"
                            print(f"✅ LocalStack detectado automáticamente en {endpoint_url}")
                            break
                    except:
                        continue
            
            # Si encontramos LocalStack o hay endpoint configurado, usarlo
            if endpoint_url:
                client_args["endpoint_url"] = endpoint_url
                print(f"🔗 Usando DynamoDB en: {endpoint_url}")
            else:
                print("🌐 Usando DynamoDB en AWS Cloud (producción)")
            
            cls._instance = boto3.client("dynamodb", **client_args)
            cls._resource = boto3.resource("dynamodb", **client_args)
            
        return cls._instance
    
    @classmethod
    def get_resource(cls):
        if cls._resource is None:
            cls.get_client()  # Esto inicializará también el resource
        return cls._resource
    
    # [CONTINÚA... EL ARCHIVO ES LARGO (~150 líneas)]
```

### **8. `apps/backend/src/main.py`**
```python
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import uvicorn

from .core.config import settings
from .core.security import setup_security, verify_role
from .persistence.database import DynamoDBClient
from .services.project_service import ProjectService
from .models.planning import PlanningRequest, PlanningResponse, ProjectState
from .models.semantic_memory import (
    SemanticMemoryRequest, 
    SemanticMemoryResponse,
    CodeAnalysisRequest,
    CodeAnalysisResponse,
    MergeRequest,
    MergeResponse
)

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Crear aplicación FastAPI
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Backend de PMOPilot - AI Semantic Orchestrator PMO para Spec-Driven Development",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# Configurar middleware
setup_security(app)

# Inicializar servicios
project_service = ProjectService()

# Evento de inicio
@app.on_event("startup")
async def startup_event():
    """Evento que se ejecuta al iniciar la aplicación."""
    logger.info(f"Iniciando {settings.app_name} v{settings.app_version} en modo {settings.app_environment}")
    
    # Crear tablas DynamoDB
    try:
        tables_created = DynamoDBClient.create_tables()
        logger.info(f"Tablas DynamoDB: {tables_created}")
    except Exception as e:
        logger.error(f"Error creando tablas DynamoDB: {e}")
        # Continuar incluso si hay error (puede que ya existan)
    
    logger.info("Backend PMOPilot iniciado exitosamente")

# Evento de apagado
@app.on_event("shutdown")
async def shutdown_event():
    """Evento que se ejecuta al apagar la aplicación."""
    logger.info("Apagando backend PMOPilot...")

# Endpoints de salud
@app.get("/api/health")
async def health_check():
    """Endpoint de verificación de salud."""
    return {
        "status": "healthy",
        "service": settings.app_name,
        "version": settings.app_version,
        "environment": settings.app_environment,
        "dynamodb_configured": True,
        "gemini_configured": settings.gemini_configured,
        "sendgrid_configured": settings.sendgrid_configured,
        "cloudflare_configured": settings.cloudflare_configured
    }

# [CONTINÚA... EL ARCHIVO ES MUY LARGO (~300 líneas)]
```

**Los otros archivos backend también son largos. Mejor copiarlos completos.**

---

## ⚛️ **ARCHIVOS FRONTEND MEJORADOS:**

### **9. `apps/frontend/server.ts`** (reemplazar el existente)
```typescript
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createProxyMiddleware } from "http-proxy-middleware";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;
const BACKEND_PORT = process.env.BACKEND_PORT || 8000;

// Configurar proxy para redirigir peticiones /api/* al backend FastAPI
app.use("/api", createProxyMiddleware({
  target: `http://localhost:${BACKEND_PORT}`,
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api'  // Mantener el prefijo /api
  },
  onProxyReq: (proxyReq, req, res) => {
    // Inyectar headers de rol para RBAC (en desarrollo)
    // En producción, esto vendría de autenticación real
    if (!req.headers['x-user-role']) {
      proxyReq.setHeader('X-User-Role', 'leader');  // Default to leader for development
    }
    
    // Log de peticiones proxy para debugging
    console.log(`[Proxy] ${req.method} ${req.url} -> Backend:${BACKEND_PORT}`);
  },
  onError: (err, req, res) => {
    console.error(`[Proxy Error] ${err.message}`);
    
    // Si el backend no está disponible, proporcionar respuestas mock
    if (req.url?.startsWith('/api/health')) {
      res.json({ 
        status: "backend_unavailable", 
        message: "Backend FastAPI no disponible",
        frontend_only: true 
      });
    } else {
      res.status(503).json({ 
        error: "Backend service unavailable",
        detail: "El backend FastAPI no está ejecutándose",
        suggestion: "Ejecuta 'npm run dev:backend' en otra terminal"
      });
    }
  }
}));

// ----------------------------------------------------
// VITE INTEGRATION / STATIC SERVING
// ----------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 PMOPilot Frontend Server running on http://0.0.0.0:${PORT}`);
    console.log(`📊 Local Development URL: http://localhost:${PORT}`);
    console.log(`⚙️  Backend Proxy: http://localhost:${PORT}/api -> http://localhost:${BACKEND_PORT}/api`);
    console.log(`🔧 Para iniciar el backend: npm run dev:backend`);
    console.log(`👑 RBAC: Usando rol 'leader' por defecto (cambia con header X-User-Role)`);
  });
}

startServer();
```

### **10. `apps/frontend/package.json`** (actualizar dependencias)
```json
{
  "name": "pmopilot-frontend",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "tsx server.ts",
    "build": "vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs",
    "start": "node dist/server.cjs",
    "clean": "rm -rf dist server.js",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "@google/genai": "^2.4.0",
    "@tailwindcss/vite": "^4.1.14",
    "@vitejs/plugin-react": "^5.0.4",
    "lucide-react": "^0.546.0",
    "react": "^19.0.1",
    "react-dom": "^19.0.1",
    "vite": "^6.2.3",
    "express": "^4.21.2",
    "dotenv": "^17.2.3",
    "motion": "^12.23.24",
    "http-proxy-middleware": "^2.0.6"
  },
  "devDependencies": {
    "@types/node": "^22.14.0",
    "autoprefixer": "^10.4.21",
    "esbuild": "^0.25.0",
    "tailwindcss": "^4.1.14",
    "tsx": "^4.21.0",
    "typescript": "~5.8.2",
    "vite": "^6.2.3",
    "@types/express": "^4.17.21",
    "@types/http-proxy-middleware": "^2.0.0"
  }
}
```

---

## 🎯 **ARCHIVOS RESTANTES (copiar completos):**

### **LocalStack:**
- `localstack-init/01-create-tables.sh`

### **Backend Core:**
- `apps/backend/src/core/config.py`
- `apps/backend/src/core/security.py`
- `apps/backend/src/core/demo_data.py`

### **Backend Models:**
- `apps/backend/src/models/planning.py`
- `apps/backend/src/models/semantic_memory.py`

### **Backend Services:**
- `apps/backend/src/services/project_service.py`

### **Backend Integrations:**
- `apps/backend/src/integrations/gemini.py`
- `apps/backend/src/integrations/sendgrid.py`
- `apps/backend/src/integrations/cloudflare.py`
- `apps/backend/src/integrations/kiro.py`

### **Documentación:**
- `LOCAL_ORCHESTRATION.md` (guía completa)
- `README.md` actualizado

### **Pruebas:**
- `test-automated.py` (pruebas E2E)
- `test_backend.py` (pruebas unitarias)

---

## 🚀 **RESUMEN DE PASOS:**

1. **Ejecutar en tu máquina:**
   ```bash
   mkdir -p apps/backend/src/{core,integrations,models,services}
   mkdir -p apps/backend/persistence
   mkdir -p localstack-init
   ```

2. **Copiar TODOS los archivos de arriba** a sus respectivas ubicaciones

3. **Hacer commit:**
   ```bash
   git add .
   git commit -m "feat: backend completo PMOPilot"
   git push origin main
   ```

4. **Ejecutar:**
   ```bash
   chmod +x pmopilot-local.sh
   ./pmopilot-local.sh start
   ./pmopilot-local.sh test
   ```

5. **¡Listo!** Acceder a:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:8000/api/docs
   - Health: http://localhost:8000/api/health

---

**Nota:** Si copiar todos los archivos manualmente es demasiado, puedo crear un archivo ZIP con todo o mostrarte cómo descargarlos directamente desde el sandbox.

**¿Prefieres que cree un ZIP descargable con todos los archivos?** Así solo tendrías que descomprimir en tu repo y listo.