# Bienvenido a PMOPilot

Tu Asistente para desarrollar proyectos SDD

## 🎯 Arquitectura Implementada:
1. Stack Tecnológico:
Backend: Python 3.12 + FastAPI + Uvicorn
Base de datos: Amazon DynamoDB (NoSQL nativo)
IA: Google Gemini API (gemini-2.5-flash)
Integraciones: SendGrid (emails), Cloudflare (seguridad)
Frontend: React + Vite + Proxy inverso
Seguridad: RBAC con roles (leader, tester, guest)

2. Esquema DynamoDB Implementado:
PK/SK con GSIs para consultas optimizadas
Entidades: Usuarios, Épicas, Historias, Tareas, PRs, ADRs, Logs
Transacciones atómicas para operaciones complejas
Índices secundarios globales para consultas por relaciones

→ Endpoints API Implementados:
✓ Gestión del Estado del Proyecto:
GET /api/project/state - Estado completo con métricas
POST /api/planning - Descomposición de briefs con Gemini
POST /api/semantic-memory - Chat con memoria semántica

✓ Control de Pull Requests:
POST /api/pull-requests/analyze - Análisis SAST con Gemini
POST /api/pull-requests/{id}/merge - Fusión con RBAC (solo leader)

✓ Configuración y Seguridad:
PUT /api/cloudflare/config - Configuración perimetral (solo leader)
POST /api/project/bootstrap - Inicialización de proyecto (solo leader)

✓ Monitoreo:
GET /api/health - Health check con verificación de servicios

## 🔐 Sistema de Seguridad RBAC:
Middleware de autenticación con verificación de roles
Roles: leader (acceso completo), tester (análisis), guest (solo lectura)

Protección por endpoint con decoradores
Headers: X-User-Role para desarrollo

## 🤖 Agentes Inteligentes Implementados:
1. Planning Agent (gemini.py):
Descompone briefs en épicas/historias/tareas
Formato JSON estructurado con Pydantic
Mock data para desarrollo sin API keys

2. Semantic Memory Agent (gemini.py):
Chat con contexto de proyecto
Procesamiento de intenciones naturales
Acciones propuestas: CREATE_TASK, UPDATE_TASK_STATUS, etc.
Restricción de dominio estricta

3. PR Arbiter Agent (gemini.py):
Análisis SAST de código con Gemini
Revisión automática en markdown
Puntuación de cumplimiento (0-100)

4. Project Service (project_service.py):
Lógica de negocio centralizada
Gestión de transacciones DynamoDB
Procesamiento de acciones semánticas
Métricas y logging automático

## 🔧 Integraciones Externas:
1. SendGrid Integration (sendgrid.py):
Notificaciones de PR fusionadas
Confirmación de bootstrap de proyecto
Templates HTML profesionales
Fallback a modo mock

2. Cloudflare Integration (cloudflare.py):
Configuración de seguridad DNS/CDN
Habilitación de WAF
Analytics de tráfico
Fallback a modo mock

3. DynamoDB Client (database.py):
Creación automática de tablas
Patrón PK/SK con GSIs
Operaciones transaccionales
Soporte para local y producción

## ⚙️ Configuración y Orquestación:
1. Variables de Entorno (.env.example):
AWS, Gemini, SendGrid, Cloudflare
Configuración de puertos y CORS
Seguridad JWT y roles

2. Scripts de Desarrollo (package.json):
npm run dev - Full-stack unificado
npm run dev:backend - Solo backend
npm run dev:frontend - Solo frontend + proxy
npm run install:all - Instalación completa

3. Proxy Inverso (server.ts):
Redirección transparente /api/* → backend
Inyección de headers RBAC
Fallback elegante si backend no está disponible
