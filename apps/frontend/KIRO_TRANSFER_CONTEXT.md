# Documento de Transferencia de Contexto de Ingeniería
**Proyecto**: PmoPilot Core (MVP)
**De**: Carlos (Arquitecto de Solución & Lead Dev)
**Para**: Kiro (Backend Developer Agent)
**Fecha**: 2026-07-24
**Estado del Frontend**: Listo para Integración (React v18 + Vite + Tailwind CSS)

---

## 1. Propósito de PmoPilot
PmoPilot es un **Cockpit de Orquestación Semántica** para equipos de desarrollo que siguen la metodología **SDD (Specification-Driven Development)**. Permite a fundadores no técnicos y líderes de ingeniería gobernar el ciclo de vida de un proyecto de software mediante comandos de lenguaje natural, manteniendo alineados en tiempo real los documentos de arquitectura (System Specifications, ADRs), el tablero Kanban, las auditorías de Pull Requests y la infraestructura perimetral.

---

## 2. Roles del Sistema (Gobernanza RBAC)
El sistema opera bajo un control de acceso basado en roles (RBAC) estricto que debes implementar y validar en cada petición del backend:
1. **Líder / Arquitecto (`leader`)**: Representado por **Carlos**. Tiene control total del sistema. Es el único autorizado para fusionar PRs críticas en ramas protegidas y modificar parámetros de seguridad en Cloudflare.
2. **Tester / Ingeniero de QA (`tester`)**: Representada por **Ana**. Puede abrir incidencias, auditar tareas de ingeniería y proponer PRs de regresión, pero tiene bloqueado el acceso de escritura a la infraestructura de red.
3. **Invitado (`guest`)**: Representado por **David** (u otros colaboradores externos). Cuenta con acceso de solo lectura en las consolas de observabilidad e historial del proyecto.

---

## 3. Arquitectura del Backend & Persistencia en Amazon DynamoDB
**Stack Tecnológico del Backend (Kiro)**: **Python 3.11+ (FastAPI + Pydantic + Uvicorn)** + **Amazon DynamoDB (boto3 / pynamodb)**.
*Nota de Entorno*: La vista previa interactiva en AI Studio utiliza un puente liviano en Node/Express para servir el frontend SPA y simular proxies, pero la implementación oficial del backend en `apps/backend` para producción en AWS debe ser 100% nativa en **Python (FastAPI) y DynamoDB via `boto3`**.

Debes aprovisionar las tablas o diseño Single-Table en **Amazon DynamoDB** (utilizando `boto3` / `pydantic_settings` en Python) con la estructura de atributos definida a continuación para garantizar una arquitectura nativa en AWS sin duplicidad de dominios ni bases de datos secundarias:

### 3.1. Esquema de Tablas e Claves Primarias (PK/SK)
- **Usuarios (`users` / PK: `USER#<id>`)**: Manejo de credenciales e identidad RBAC.
- **Épicas (`epics` / PK: `EPIC#<id>`)**: Los grandes bloques arquitectónicos extraídos por Gemini.
- **Historias de Usuario (`stories` / PK: `STORY#<id>`)**: Descomposición de las épicas con `epic_id` para consultas de índice secundario.
- **Tareas (`tasks` / PK: `TASK#<id>`)**: Tareas de ingeniería atómicas con `epic_id`, `story_id` y `assigned_to` para asignación de ingenieros.
- **ADRs (`adrs` / PK: `ADR#<id>`)**: Registro de Decisiones de Arquitectura. Control de estados (`accepted`, `rejected`, `draft`).
- **Pull Requests (`pull_requests` / PK: `PR#<id>`)**: Registro de ramas, cambios de código y diagnósticos de auditoría de IA.
- **Logs (`logs` / PK: `LOG#<id>`)**: El stream de auditoría de observabilidad unificado.
- **Notificaciones (`notifications` / PK: `NOTIF#<id>`)**: Registro histórico de alertas despachadas vía SendGrid.

---

## 4. Endpoints del Backend y Contrato de API (REST JSON)
El frontend de PmoPilot espera consumir un API unificado en `/api/*` bajo los siguientes lineamientos:

### 4.1. Gestión de Estado de Proyecto (`GET /api/project/state`)
- **Frontend espera**: Un payload que consolide de forma reactiva las épicas, historias, tareas, miembros del equipo y estado de inicialización del proyecto.
- **Tu tarea**: Ejecutar lecturas eficientes (BatchGetItem o Queries por índices) en DynamoDB para retornar el estado actual en una sola petición de carga inicial.

### 4.2. Descomposición de Épicas de Producto (`POST /api/planning`)
- **Frontend envía**: Un Product Brief en texto plano junto con el stack tecnológico de destino.
- **Tu tarea**: Instanciar el SDK oficial `@google/genai` (Gemini 2.5/1.5) utilizando `process.env.GEMINI_API_KEY` de forma segura en el servidor. El prompt debe exigir una respuesta en un formato JSON estructurado estricto que contenga arreglos de `epics`, `stories` y `tasks` técnicos listos para insertarse en DynamoDB de manera atómica (TransactWriteItems).

### 4.3. Copiloto de Conversación Semántica (`POST /api/semantic-memory`)
- **Frontend envía**: El mensaje del usuario, el historial del chat y el contexto del proyecto actual.
- **Tu tarea**: Usar Gemini con Function Calling o prompts estructurados para diagnosticar si la instrucción de lenguaje natural del usuario implica una mutación del estado del proyecto. Debe retornar una respuesta conversacional fluida junto con un objeto opcional `proposedAction` (ej: `CREATE_TASK`, `ADD_MEMBER`, `UPDATE_TASK_STATUS`, `BOOTSTRAP_PROJECT`) con los datos ya pre-estructurados por la IA para que el cliente los aplique con un solo clic.

### 4.4. Automatización Git & Arbitraje de PRs (`POST /api/pull-requests/:id/audit` y `merge`)
- **Petición de Auditoría (`audit`)**: Debes tomar los cambios de código de la Pull Request y pasarlos por Gemini para evaluar la coherencia de los cambios de backend, el cumplimiento de las guías de diseño y la detección de vulnerabilidades SAST. Retorna la PR con el markdown detallado en `aiReview` y los checks automáticos marcados como `success` o `failed`.
- **Petición de Fusión (`merge`)**:
  - Verifica que el rol del usuario que realiza la petición sea `'leader'`.
  - Actualiza el estado de la PR a `"merged"`.
  - Actualiza automáticamente las tareas vinculadas en DynamoDB a estado `"done"`.
  - Registra un evento de éxito en la tabla de observabilidad (`logs`).
  - Llama al Gateway de SendGrid para enviar un correo resumen transaccional.

### 4.5. Gateway Transaccional de Correo SendGrid (`POST /api/notifications/sendgrid`)
- **Frontend envía**: Destinatario, asunto, cuerpo en texto o HTML, y opcionalmente el identificador de la plantilla.
- **Tu tarea**: Usar el SDK oficial de SendGrid para despachar el correo electrónico real a través de tu API Key del servidor. Registra el éxito o fallo del envío en la tabla `notifications`.

### 4.6. Seguridad de Infraestructura Cloudflare (`PUT /api/cloudflare/config`)
- **Frontend envía**: Nuevos flags de mitigación de red (ej. activar "Bajo Ataque DDOS" o "Rate Limiting").
- **Tu tarea**: Implementar una comprobación de rol de seguridad implacable. Si el usuario logueado en la sesión no es Carlos (`role !== "leader"`), debes bloquear la petición retornando inmediatamente un código HTTP `403 Forbidden` para cumplir con las directivas RBAC reflejadas en la UI. Si es válido, realiza el llamado a las APIs de Cloudflare correspondientes usando las variables de entorno.

### 4.7. Provisionamiento, Vinculación de Repositorio & Servicios Accesorios (`POST /api/project/bootstrap`)
- **Problema resuelto**: En el flujo inicial (Bootstrap Wizard), el usuario declara y vincula las credenciales e integraciones de su proyecto sin guardarlas en código duro.
- **Frontend envía**:
  - **Repositorio Git / CI/CD**: `github_repo_url` (ej: `https://github.com/org/pmopilot-core`), `github_token` / Webhook Secret, rama principal (`main`).
  - **Servicios Accesorios**: `sendgrid_api_key`, `sendgrid_sender_email`, `jira_domain`/`jira_token` (opcional), `cloudflare_zone_id`.
  - **IA & AWS**: `aws_region`, `dynamodb_table_prefix`, `gemini_api_key`.
- **Tu tarea**:
  - Validar y almacenar la configuración del proyecto en DynamoDB (en el ítem `PROJECT#CONFIG`).
  - Configurar las variables de entorno activas o secrets vault en tiempo de ejecución.
  - Inicializar los hooks de integración (GitHub Actions webhook receiver en `/api/webhooks/github` para escuchar la apertura de PRs, pushes y ejecuciones de test).

---

## 5. Directrices de Sincronización del Frontend
1. **Consumo de Variables de Entorno**: El frontend no almacena API Keys. El backend debe resguardar en su propio entorno `.env` los secretos de `GEMINI_API_KEY`, `SENDGRID_API_KEY` y `CLOUDFLARE_API_TOKEN`.
2. **Formato de Respuestas**: Asegura que los IDs de base de datos coincidan con las convenciones usadas en el cliente (p. ej., prefijos `"task-"`, `"epic-"`, `"ADR-"`).
3. **Flujo de Observabilidad**: Cada acción de impacto del backend (fusión de PR, despacho de correo, modificación de red) debe insertar inmediatamente un registro detallado en la tabla `logs` para que el simulador de Grafana y la consola de eventos muestren actividad fidedigna de producción.

Este documento de contexto garantiza que ambos sistemas se acoplen con precisión milimétrica, ofreciendo un flujo SDD robusto, auditado e impulsado por IA.
