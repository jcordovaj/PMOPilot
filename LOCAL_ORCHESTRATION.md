# 🚀 Sistema de Orquestación Local PMOPilot

## 📋 Descripción

Sistema completo de orquestación local que abstracta toda la complejidad de levantar el entorno de desarrollo PMOPilot. Incluye:

- **LocalStack** para emular AWS completo (DynamoDB, S3, SQS, etc.)
- **Backend FastAPI** con autodetcción de LocalStack
- **Frontend React** con proxy inverso
- **Scripts de inicialización** automáticos
- **Pruebas end-to-end** automatizadas
- **Health checks** y monitoreo

## 🎯 Filosofía PMOPilot

> "El usuario solo debe ejecutar un comando para tener todo funcionando"

## 🛠️ Requisitos Previos

```bash
# Verificar que tienes instalado:
docker --version        # Docker 20+
docker-compose --version # Docker Compose 2+
python3 --version       # Python 3.11.6+ (compatible con .spmo env)
pip3 --version          # pip
npm --version           # Node.js 18+
nc -h                   # netcat (para health checks)
```

## 🚀 Comenzar Rápidamente

### **Opción 1: Usar el orquestador (RECOMENDADO)**

```bash
# Hacer ejecutable el script si no lo está
chmod +x pmopilot-local.sh

# Iniciar entorno completo
./pmopilot-local.sh start
```

### **Opción 2: Pasos manuales**

```bash
# 1. Iniciar LocalStack
docker-compose -f docker-compose.localstack.yml up -d

# 2. Configurar entorno
cp .env.example .env

# 3. Instalar dependencias backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r apps/backend/requirements.txt

# 4. Instalar dependencias frontend
cd apps/frontend && npm install && cd ../..

# 5. Iniciar servicios
npm run dev:backend &  # Backend en puerto 8000
npm run dev:frontend & # Frontend en puerto 3000
```

## 📊 Comandos del Orquestador

| Comando | Descripción |
|---------|-------------|
| `./pmopilot-local.sh start` | Inicia entorno completo |
| `./pmopilot-local.sh stop` | Detiene todos los servicios |
| `./pmopilot-local.sh status` | Muestra estado de servicios |
| `./pmopilot-local.sh logs` | Muestra logs en tiempo real |
| `./pmopilot-local.sh test` | Ejecuta pruebas automatizadas |
| `./pmopilot-local.sh cleanup` | Detiene y limpia completamente |
| `./pmopilot-local.sh help` | Muestra ayuda completa |

## 🌐 Servicios Iniciados

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Frontend** | http://localhost:3000 | React + Vite + Proxy |
| **Backend API** | http://localhost:8000 | FastAPI + Endpoints |
| **API Docs** | http://localhost:8000/api/docs | Swagger UI |
| **Redoc** | http://localhost:8000/api/redoc | Redoc documentation |
| **LocalStack** | http://localhost:4566 | AWS emulado |
| **DynamoDB Admin** | http://localhost:8001 | UI para DynamoDB |
| **Health Check** | http://localhost:8000/api/health | Estado del sistema |

## 🧪 Pruebas Automatizadas

### **Ejecutar suite completa**
```bash
./pmopilot-local.sh test
# O directamente:
python test-automated.py
```

### **Pruebas individuales con curl**
```bash
# Health check
curl http://localhost:8000/api/health

# Estado demo
curl "http://localhost:8000/api/project/state?demo=true"

# Semantic Memory
curl -X POST "http://localhost:8000/api/semantic-memory" \
  -H "Content-Type: application/json" \
  -d '{"message": "Crea una tarea para optimizar la base de datos"}'

# Planning Agent
curl -X POST "http://localhost:8000/api/planning" \
  -H "Content-Type: application/json" \
  -d '{"brief": "Sistema de gestión de tareas", "stack": "React"}'
```

## 🔧 Configuración Avanzada

### **Variables de Entorno (.env)**
```bash
# Copiar y editar
cp .env.example .env

# Configuración importante:
APP_ENVIRONMENT=development
DYNAMODB_ENDPOINT=http://localhost:4566  # LocalStack
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_REGION=us-east-1

# Para usar AWS real (producción):
# DYNAMODB_ENDPOINT=
# AWS_ACCESS_KEY_ID=tu_key_real
# AWS_SECRET_ACCESS_KEY=tu_secret_real
```

### **LocalStack Personalizado**
```bash
# Editar docker-compose.localstack.yml para agregar servicios:
services:
  localstack:
    environment:
      - SERVICES=dynamodb,s3,sqs,sns,lambda,cloudwatch  # Agregar más
```

### **Puertos Personalizados**
```bash
# Editar pmopilot-local.sh:
BACKEND_PORT=8080
FRONTEND_PORT=3001
LOCALSTACK_PORT=4567
```

## 🐛 Solución de Problemas

### **Problema: Docker no está corriendo**
```bash
# Iniciar Docker
sudo systemctl start docker
# Verificar
docker ps
```

### **Problema: Puerto en uso**
```bash
# Verificar qué usa el puerto
sudo lsof -i :3000
sudo lsof -i :8000
sudo lsof -i :4566

# Matar proceso
kill -9 <PID>
# O usar puertos diferentes
```

### **Problema: LocalStack no inicia**
```bash
# Ver logs
docker logs pmopilot-localstack

# Limpiar y reiniciar
./pmopilot-local.sh cleanup
./pmopilot-local.sh start
```

### **Problema: Dependencias Python**
```bash
# Recrear entorno virtual
rm -rf .venv
python3 -m venv .venv
source .venv/bin/activate
pip install -r apps/backend/requirements.txt
```

## 🎪 Modo Demo vs Producción

### **Modo Demo (default)**
```bash
# Usa datos preconfigurados sin necesidad de DynamoDB
http://localhost:8000/api/project/state?demo=true

# Características:
# • 4 épicas, 5 historias, 7 tareas preconfiguradas
# • 4 miembros de equipo demo
# • 2 PRs activas, 3 ADRs
# • Métricas en tiempo real
# • Ideal para demostraciones y pruebas
```

### **Modo Producción**
```bash
# Usa DynamoDB real (LocalStack o AWS)
http://localhost:8000/api/project/state?demo=false

# Requiere:
# • DynamoDB configurado (LocalStack o AWS)
# • Tablas creadas (se crean automáticamente)
# • Datos reales del usuario
```

## 🔄 Flujo de Desarrollo Típico

```bash
# 1. Iniciar entorno
./pmopilot-local.sh start

# 2. Verificar que todo funciona
./pmopilot-local.sh status
./pmopilot-local.sh test

# 3. Desarrollar
# • Editar código en apps/backend/src/ o apps/frontend/src/
# • Los servicios se recargan automáticamente

# 4. Probar cambios
curl "http://localhost:8000/api/health"
# O usar el frontend: http://localhost:3000

# 5. Detener al terminar
./pmopilot-local.sh stop

# 6. Limpiar (opcional)
./pmopilot-local.sh cleanup
```

## 📈 Monitoreo y Logs

### **Ver logs en tiempo real**
```bash
# Backend
tail -f nohup.out  # Si usas & para background

# LocalStack
docker logs -f pmopilot-localstack

# Frontend
cd apps/frontend && npm run dev  # En terminal separada
```

### **Health Checks Programáticos**
```python
import requests

# Verificar backend
response = requests.get("http://localhost:8000/api/health")
print(response.json())

# Verificar frontend proxy
response = requests.get("http://localhost:3000/api/health")
print(response.json())
```

## 🔐 Seguridad Local

### **Credenciales de Desarrollo**
```bash
# LocalStack usa credenciales de prueba
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test

# Backend JWT (solo desarrollo)
JWT_SECRET_KEY=super-secret-key-change-in-production
```

### **RBAC en Desarrollo**
```bash
# Headers para pruebas:
curl -H "X-User-Role: leader" http://localhost:8000/api/project/state

# Roles disponibles:
# • leader: Acceso completo
# • tester: Solo lectura y análisis
# • guest: Solo lectura básica
```

## 🚢 Para Producción

### **Cambiar a AWS Real**
1. Eliminar `DYNAMODB_ENDPOINT` del `.env`
2. Configurar credenciales AWS reales
3. Las tablas se crearán automáticamente en AWS

### **Despliegue en Nube**
```bash
# Backend: FastAPI en AWS Lambda/ECS
# Frontend: React en S3 + CloudFront
# Database: DynamoDB en AWS
# CI/CD: GitHub Actions + AWS CodePipeline
```

## 📞 Soporte

### **Problemas Comunes**
1. **Docker out of memory**: `docker system prune -a`
2. **Python version mismatch**: Verificar `python --version`
3. **Port conflicts**: Usar `./pmopilot-local.sh cleanup`

### **Debug Detallado**
```bash
# Modo verbose
DEBUG=1 ./pmopilot-local.sh start

# Inspeccionar contenedores
docker inspect pmopilot-localstack

# Ver todos los procesos
ps aux | grep pmopilot
```

---

## 🎉 ¡Listo para Desarrollar!

Con este sistema de orquestación, puedes:

1. **Iniciar todo con un comando**: `./pmopilot-local.sh start`
2. **Probar instantáneamente**: `./pmopilot-local.sh test`
3. **Desarrollar con hot reload**: Los cambios se reflejan automáticamente
4. **Tener datos demo realistas**: Sin necesidad de configurar nada
5. **Transicionar a producción**: Cambiando variables de entorno

**¡Happy coding! 🚀**