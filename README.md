# PMOPilot - AI Semantic Orchestrator PMO for Spec-Driven Development

![PMOPilot Architecture](https://img.shields.io/badge/Architecture-Monorepo-blue)
![Backend](https://img.shields.io/badge/Backend-FastAPI%20%2B%20Python-green)
![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-blue)
![Database](https://img.shields.io/badge/Database-DynamoDB-orange)
![AI](https://img.shields.io/badge/AI-Gemini%20API-purple)

## 🚀 Descripción

PMOPilot es un **AI Team Orchestrator for Spec-Driven Development**, una plataforma de orquestación asistida por IA que ayuda a pequeños equipos que desarrollan software mediante Spec-Driven Development (SDD) utilizando herramientas como Kiro, Claude Code, Cursor o Copilot.

La plataforma actúa como una **Semantic PMO inteligente** que coordina automáticamente el ciclo de vida del proyecto, preserva la memoria colectiva, automatiza procesos repetitivos y guía al equipo desde la idea inicial hasta la entrega en producción.

## 🏗️ Arquitectura Full-Stack

### Estructura del Proyecto
```
PMOPilot/
├── apps/
│   ├── backend/              # Python + FastAPI + DynamoDB
│   │   ├── src/
│   │   │   ├── core/         # Configuración y seguridad
│   │   │   ├── integrations/ # Gemini, SendGrid, Cloudflare
│   │   │   ├── models/       # Pydantic schemas
│   │   │   ├── services/     # Lógica de negocio
│   │   │   └── main.py       # Aplicación FastAPI
│   │   ├── persistence/      # Cliente DynamoDB
│   │   └── requirements.txt
│   └── frontend/             # React + Vite + TypeScript
│       ├── src/
│       ├── server.ts         # Proxy al backend
│       └── package.json
├── .env.example              # Variables de entorno
├── package.json              # Scripts de orquestación
├── pyproject.toml            # Configuración Python
└── README.md
```

### Stack Tecnológico
- **Backend**: Python 3.12 + FastAPI + Uvicorn
- **Base de datos**: Amazon DynamoDB (NoSQL nativo)
- **Frontend**: React 19 + Vite + TypeScript + Tailwind CSS
- **IA**: Google Gemini API (gemini-2.5-flash)
- **Integraciones**: SendGrid (emails), Cloudflare (seguridad)
- **Seguridad**: RBAC (roles: leader, tester, guest)

## 🛠️ Instalación y Configuración

### 1. Instalar dependencias globales

```bash
# Instalar Node.js y npm
# Instalar Python 3.12 y pip

# Clonar el repositorio
git clone <repo-url>
cd PMOPilot
```

### 2. Configurar variables de entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env con tus credenciales
# AWS, Gemini, SendGrid, Cloudflare
```

### 3. Instalar todas las dependencias

```bash
# Instalar dependencias del frontend y herramientas de desarrollo
npm run install:all
```

### 4. Iniciar DynamoDB local (opcional para desarrollo)

```bash
# Usar Docker para DynamoDB local
docker run -p 8000:8000 amazon/dynamodb-local

# O usar un servicio AWS real
```

## 🚀 Ejecución

### Desarrollo (Full-Stack unificado)

```bash
# Inicia ambos servidores (backend en puerto 8000, frontend en puerto 3000)
npm run dev
```

### Desarrollo por separado

```bash
# Terminal 1: Backend FastAPI
npm run dev:backend

# Terminal 2: Frontend React + Proxy
npm run dev:frontend
```

### URLs de desarrollo
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Documentación API**: http://localhost:8000/api/docs

## 📡 Endpoints API Principales

### Gestión del Estado del Proyecto
- `GET /api/project/state` - Estado completo del proyecto
- `POST /api/planning` - Descomposición de briefs en épicas/historias/tareas
- `POST /api/semantic-memory` - Chat con memoria semántica y acciones propuestas

### Control de Pull Requests
- `POST /api/pull-requests/analyze` - Análisis SAST de código con Gemini
- `POST /api/pull-requests/{id}/merge` - Fusión de PR (requiere rol leader)

### Configuración y Seguridad
- `PUT /api/cloudflare/config` - Configuración de seguridad (requiere rol leader)
- `POST /api/project/bootstrap` - Inicialización de proyecto (requiere rol leader)

### Monitoreo
- `GET /api/health` - Verificación de salud del sistema

## 🔐 Sistema de Seguridad RBAC

El sistema implementa control de acceso basado en roles:

### Roles Disponibles
- **leader**: Acceso completo (fusionar PRs, configurar Cloudflare, bootstrap)
- **tester**: Acceso a análisis y pruebas (revisar PRs, ejecutar tests)
- **guest**: Acceso de solo lectura (ver estado, usar chat semántico)

### Headers de Autenticación
```http
X-User-Role: leader  # o tester, guest
```

## 🗃️ Esquema DynamoDB

### Patrón PK/SK con GSIs
```
Tabla: pmopilot_main

PK (Hash Key)        SK (Range Key)     Atributos
USER#<id>            USER#<id>          name, role, avatar
EPIC#<id>            EPIC#<id>          title, description, status
STORY#<id>           STORY#<id>         title, epic_id, status
TASK#<id>            TASK#<id>          title, priority, status, epic_id, story_id
PR#<id>              PR#<id>            title, branch, status, analysis
ADR#<id>             ADR#<id>           title, decision, context
LOG#<id>             LOG#<id>           log_type, message, timestamp
PROJECT#CONFIG       PROJECT#CONFIG     project_name, framework, team_members

Índices Secundarios Globales (GSI):
GSI1: (GSI1_PK, GSI1_SK) - Consultar historias por épica, tareas por épica
GSI2: (GSI2_PK, GSI2_SK) - Consultar tareas por historia
```

## 🤖 Agentes Inteligentes

### 1. Planning Agent
- Transforma especificaciones en lenguaje natural en backlog SDD estructurado
- Genera épicas, historias de usuario y tareas técnicas
- Asigna prioridades y criterios de aceptación

### 2. Semantic Memory Agent
- Chat contextual con memoria de proyecto
- Entiende intenciones naturales y propone acciones
- Restricción de dominio (solo ingeniería de software)

### 3. PR Arbiter Agent
- Análisis SAST de código con Gemini
- Verificación de cumplimiento con especificaciones SDD
- Generación automática de revisiones en markdown

### 4. Git Guardian Agent
- Coordinación de trabajo colaborativo
- Control de ramas activas y conflictos potenciales
- Gobernanza técnica automática

## 📊 Flujo de Trabajo SDD

1. **Especificación**: Usuario proporciona brief en lenguaje natural
2. **Planificación**: Planning Agent descompone en épicas/historias/tareas
3. **Desarrollo**: Equipo implementa usando herramientas de IA (Cursor, Copilot)
4. **Revisión**: PR Arbiter analiza código contra especificaciones
5. **Fusión**: Líder fusiona PR y actualiza estados automáticamente
6. **Observabilidad**: Dashboard muestra métricas y progreso

## 🔧 Configuración de Integraciones

### Google Gemini
- Obtén API Key en [Google AI Studio](https://makersuite.google.com/app/apikey)
- Configura `GEMINI_API_KEY` en `.env`
- Modelo por defecto: `gemini-2.5-flash`

### Amazon DynamoDB
- Para desarrollo local: `DYNAMODB_ENDPOINT=http://localhost:8000`
- Para producción: credenciales AWS reales

### SendGrid
- API Key para envío de notificaciones por email
- Configura remitente en `SENDGRID_FROM_EMAIL`

### Cloudflare
- API Token, Zone ID y Account ID para configuración de seguridad
- Protección DNS/CDN y Web Application Firewall (WAF)

## 🧪 Pruebas y Desarrollo

### Ejecutar pruebas (en desarrollo)
```bash
cd apps/backend
pytest tests/
```

### Linting y formateo
```bash
# Python
cd apps/backend
black src/
ruff check src/

# TypeScript
cd apps/frontend
npm run lint
```

### Estructura de pruebas
```
tests/
├── unit/           # Pruebas unitarias
├── integration/    # Pruebas de integración
└── e2e/           # Pruebas end-to-end
```

## 🚢 Despliegue

### Opción 1: Docker
```dockerfile
# Dockerfile para backend
FROM python:3.12-slim
# ... configuración

# Dockerfile para frontend
FROM node:18-alpine
# ... configuración
```

### Opción 2: Servicios AWS
- **Backend**: AWS Lambda + API Gateway
- **Base de datos**: DynamoDB
- **Frontend**: S3 + CloudFront
- **CI/CD**: GitHub Actions + AWS CodePipeline

### Opción 3: Kubernetes
```yaml
# Helm chart o manifests Kubernetes
# Despliegue escalable con auto-scaling
```

## 📈 Monitoreo y Observabilidad

### Métricas del proyecto
- Tareas completadas vs totales
- Distribución por prioridad
- Tasa de cumplimiento de especificaciones
- Tiempo promedio de ciclo (lead time)

### Logs estructurados
- Todos los eventos importantes se registran en DynamoDB
- Formato JSON para fácil procesamiento
- Integración con CloudWatch/Grafana

### Health checks
- Verificación de servicios externos
- Monitoreo de latencia de API
- Alertas automáticas

## 🤝 Contribución

### Guía de desarrollo
1. Fork el repositorio
2. Crea una rama feature: `git checkout -b feature/nueva-funcionalidad`
3. Haz commit de tus cambios: `git commit -m 'Add nueva funcionalidad'`
4. Push a la rama: `git push origin feature/nueva-funcionalidad`
5. Abre un Pull Request

### Convenciones de código
- **Python**: PEP 8, type hints, docstrings
- **TypeScript**: ESLint, interfaces explícitas
- **Commits**: Conventional Commits
- **Documentación**: Actualizar README y docstrings

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE) para más detalles.

## 🆘 Soporte

- **Documentación**: [docs.pmopilot.dev](https://docs.pmopilot.dev)
- **Issues**: [GitHub Issues](https://github.com/tu-org/pmopilot/issues)
- **Discord**: [Comunidad PMOPilot](https://discord.gg/pmopilot)

---

**PMOPilot** - Simplificando el desarrollo colaborativo asistido por IA 🚀
