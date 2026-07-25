export const SYSTEM_SPECIFICATION_MD = `# Especificación del Sistema: PmoPilot Core (Cockpit de Orquestación Semántica)

PmoPilot es un **Cockpit de Orquestación Semántica y PMO Cognitivo** diseñado para abstraer la complejidad técnica del desarrollo de software (Git, GitHub Actions, CI/CD, YAML, PRs, configuraciones) mediante inteligencia artificial impulsada por Gemini. Permite a fundadores no técnicos y líderes de ingeniería gobernar el ciclo de vida de un proyecto mediante lenguaje natural, convirtiendo intenciones humanas en acciones estructuradas de ingeniería bajo la metodología **SDD (Specification-Driven Development)**.

---

## 1. Resumen Ejecutivo & Propósito Metamodelo

El usuario no necesita conocer Git, pipelines ni sintaxis de comandos. Frases sencillas como *"quiero guardar"*, *"actualiza el proyecto"* o *"listo, terminé por hoy"* son interpretadas por el motor cognitivo de Gemini para ejecutar la batería de pruebas, guardar líneas base, actualizar el tablero Kanban, actualizar la documentación del sistema, generar la auditoría de PRs y enviar notificaciones de estado sin intervención manual.

---

## 2. Requerimientos Funcionales (FR)

### FR-1: Orquestación Semántica y Conversacional
- **FR-1.1**: El sistema debe procesar instrucciones en lenguaje natural mediante el SDK oficial \`@google/genai\` (Gemini 2.5/1.5) y generar acciones pre-estructuradas (\`CREATE_TASK\`, \`AUDIT_PR\`, \`UPDATE_DOCS\`, \`SYNC_BASELINE\`).
- **FR-1.2**: El copilot debe reconocer frases de intención cotidiana (ej. *"listo, terminé por hoy"*) y activar automáticamente el flujo de guardado, actualización de avances y sincronización de estado.

### FR-2: Descomposición de Productos (Product Brief -> SDD Backlog)
- **FR-2.1**: Extracción automática de Épicas, Historias de Usuario y Tareas técnicas a partir de un Product Brief en texto plano.
- **FR-2.2**: Generación y mantenimiento de Documentos de Arquitectura (System Specification, ADRs, SDD Guides) tipados en Markdown y JSON.

### FR-3: Gobernanza RBAC y Arbitraje de PRs
- **FR-3.1**: Control de acceso estricto basado en roles (\`leader\` Carlos, \`tester\` Ana, \`guest\` David).
- **FR-3.2**: Auditoría automática de Pull Requests mediante IA para verificar coherencia de código, cumplimiento de guías y análisis de seguridad antes del merge.

---

## 3. Requerimientos No Funcionales (NFR)

- **NFR-1 (Persistencia Nativa en AWS)**: El backend en Python (FastAPI) utiliza únicamente Amazon DynamoDB como motor de almacenamiento NoSQL para evitar duplicidad de dominios y múltiples puntos de falla.
- **NFR-2 (Privacidad de Credenciales)**: Toda API Key (Gemini, SendGrid, Cloudflare, GitHub Tokens) se almacena y resguarda exclusivamente en el servidor backend.
- **NFR-3 (Baja Latencia y Asincronía)**: La consulta y actualización del estado del proyecto (\`/api/project/state\`) debe responder en menos de 500ms mediante lecturas optimizadas en DynamoDB.

---

## 4. Actores Clave y Flujo Crítico

1. **Líder / Fundador**: Dicta la visión y comandos en lenguaje natural (*"Crea el módulo de usuarios"*).
2. **PMO Semántico (Gemini Engine)**: Evalúa la intención, genera la especificación SDD y asigna tareas a los agentes.
3. **Agente de Código (Kiro / Claude / Antigravity)**: Ejecuta el código backend/frontend basándose en las especificaciones.
`;

export const ADR_FOUNDATION_MD = `# ADR-001: Elección de Amazon DynamoDB como Persistencia Nativa para Despliegue en AWS

## Estado
**APROBADO**

## Contexto
El desarrollo del backend de PmoPilot está diseñado para su despliegue en infraestructura nativa de **AWS** (Python + FastAPI + DynamoDB). Usar dos dominios de persistencia distintos o combinar una base relacional con una NoSQL aumentaría la complejidad operativa, requeriría puertos diferentes, obligaría a realizar cruces de datos inter-base de datos entre el frontend y el backend, y crearía dos puntos de falla críticos en el sistema.

Evaluamos el uso de bases de datos relacionales tradicionales frente al desarrollo nativo en Amazon DynamoDB.

## Decisión
Adoptar **Amazon DynamoDB** como el único dominio de persistencia nativa de la aplicación PmoPilot.

### Justificación de la Arquitectura:
- **Despliegue Nativo e Inmediato en AWS**: Desarrollar en DynamoDB desde el primer día mediante Python y \`boto3\` garantiza compatibilidad directa con AWS Lambda/ECS/EC2 sin necesidad de refactorizar la lógica de acceso a datos posteriormente.
- **Unificación de Dominio de Datos**: Al contar con una sola base de datos NoSQL distribuida, eliminamos la necesidad de consultar múltiples bases de datos para cruzar datos entre el backend y el frontend, reduciendo los puertos y los puntos de falla.
- **Alta Disponibilidad y Baja Latencia**: Ofrece rendimiento de milisegundos de un solo dígito a cualquier escala con réplicas gestionadas de forma transparente por AWS.
- **Acceso por Claves y GSI (Global Secondary Indexes)**: Estructuración con patrones de acceso \`PK\` y \`SK\` o índices secundarios para consultar velozmente usuarios, épicas, historias, tareas, pull requests y logs de auditoría.

## Consecuencias
- **Ventajas**:
  - Un único punto de conexión y único dominio de almacenamiento.
  - Escalabilidad sin fricción ni administración de parches de servidor.
  - Cero necesidad de reescribir la capa de persistencia al pasar a producción en AWS.
- **Desventajas**:
  - Requiere diseñar cuidadosamente los patrones de acceso mediante PK, SK e Índices Secundarios Globales (GSI).
`;

export const SDD_GUIDE_MD = `# Manual de Metodología SDD y Orquestación Semántica en PmoPilot

Este manual técnico especifica cómo PmoPilot abstrae las operaciones complejas de desarrollo de software (Git, CI/CD, Pull Requests, Tareas) traduciendo instrucciones cotidianas en lenguaje natural mediante el motor cognitivo de Gemini.

---

## 1. Principio Fundamental: Abstracción Completa de la Complejidad

Los usuarios de PmoPilot no necesitan aprender sintaxis de Git, YAML de GitHub Actions, ni comandos de consola. El PMO Semántico entiende el contexto del proyecto y traduce expresiones humanas en la secuencia correcta de operaciones técnicas:

1. **"Quiero guardar"** → Genera commit con mensaje convencional semántico + Crea/actualiza rama activa.
2. **"Actualiza el avance del proyecto"** → Sincroniza tareas del Kanban + Recalcula métricas del tablero + Actualiza especificación.
3. **"Listo, terminé por hoy"** → Ejecuta suite de pruebas + Guarda línea base + Genera resumen ejecutivo + Despacha notificación SendGrid + Actualiza log de auditoría.

---

## 2. Diagrama del Flujo de Interpretación Semántica

\`\`\`text
  [ Usuario escribe: "Terminé el módulo de login" ]
                        ↓
  [ Copiloto Semántico (Gemini API) ] → Reconoce intención y estado del contexto
                        ↓
  [ Generador de Acciones SDD ]        → Genera payload { type: "AUDIT_PR", task_id: "TASK-102" }
                        ↓
  [ Backend (Python + FastAPI) ]      → Persiste en DynamoDB + Despacha Webhook a GitHub/Actions
                        ↓
  [ Frontend Cockpit ]                → Actualiza UI en tiempo real (Kanban, Logs, Dashboard)
\`\`\`

---

## 3. Ejemplo de Contrato de API Semántica (Payload)

Al enviar una frase cotidiana como *"Listo, terminé por hoy"*, la API REST de PmoPilot en \`/api/semantic-memory\` responde con una evaluación semántica y una acción pre-estructurada lista para confirmación:

\`\`\`json
{
  "reply": "Entendido. He analizado el progreso de hoy: se completó la tarea TASK-102 ('Autenticación RBAC'). He preparado el guardado de línea base, el log de auditoría y la notificación por SendGrid para el equipo.",
  "intent": "CLOSE_DAY_BASELINE",
  "proposedAction": {
    "type": "AUDIT_PR",
    "data": {
      "pr_id": "PR-004",
      "branch": "feature/rbac-auth",
      "commit_message": "docs & feat: baseline complete for RBAC auth module",
      "run_tests": true,
      "send_notification": true
    }
  }
}
\`\`\`
`;

export const BACKEND_CONTRACT_MD = `# Contrato de API y Especificación del Backend: PmoPilot Core (MVP)

Este documento contiene la especificación completa de modelos de datos, endpoints REST, esquemas de base de datos NoSQL (DynamoDB) y flujos de integración con servicios perimetrales (Cloudflare), mensajería (SendGrid) e Inteligencia Artificial (Gemini SDK) para que el agente **Kiro** construya el backend correspondiente al frontend de PmoPilot.

---

## 1. Arquitectura General y Stack Tecnológico

El backend se construirá utilizando:
- **Runtime & Lenguaje**: Python 3.11+ (con Pydantic v2 para validación estricta de esquemas).
- **Framework Web**: FastAPI (Uvicorn / ASGI con middleware de CORS y middleware de seguridad RBAC).
- **Base de Datos / Persistencia**: Amazon DynamoDB (SDK nativo \`boto3\` o \`aioboto3\` para I/O asíncrono).
- **Integraciones de API**:
  - SDK de Gemini para Python (\`google-genai\` / \`@google/genai\`) para la orquestación semántica.
  - SendGrid SDK para Python / SMTP Relay para el despacho de alertas.
  - API REST de Cloudflare v4 para la gobernanza perimetral.

---

## 2. Modelos de Datos (Objetos del Sistema)

Para garantizar consistencia y tipado estático completo, el esquema de Amazon DynamoDB debe reflejar los siguientes objetos clave (estructurados con PK y SK):

### 2.1. Usuario y Roles (RBAC)
\`\`\`typescript
interface User {
  id: string;          // uuid
  email: string;       // unique string
  passwordHash: string; // bcrypt hash
  role: 'leader' | 'tester' | 'guest'; // Roles del sistema
  createdAt: Date;
}
\`\`\`

### 2.2. Épicas (Epics)
\`\`\`typescript
interface Epic {
  id: string;          // pk (p. ej., "epic-1")
  title: string;       // varchar(255)
  description: string; // text
  status: 'todo' | 'in_progress' | 'done';
}
\`\`\`

### 2.3. Historias de Usuario (Stories)
\`\`\`typescript
interface Story {
  id: string;          // pk (p. ej., "story-1")
  title: string;       // varchar(255)
  description: string; // text
  epicId: string;      // fk -> Epic.id
  status: 'todo' | 'in_progress' | 'done';
}
\`\`\`

### 2.4. Tareas (Tasks)
\`\`\`typescript
interface Task {
  id: string;          // pk (p. ej., "task-1")
  title: string;       // varchar(255)
  description: string; // text
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  epicId?: string;     // fk -> Epic.id
  storyId?: string;    // fk -> Story.id
  assignedTo?: string; // varchar(255) (p. ej., "David (Backend Dev)")
}
\`\`\`

### 2.5. Registro Arquitectónico (ADR)
\`\`\`typescript
interface Adr {
  id: string;          // pk (p. ej., "ADR-001")
  title: string;       // varchar(255)
  status: 'accepted' | 'rejected' | 'draft';
  date: string;        // varchar(10) (YYYY-MM-DD)
  author: string;      // varchar(255)
  context: string;     // text
  decision: string;    // text
  consequences: string;// text
}
\`\`\`

### 2.6. Pull Requests (PRs)
\`\`\`typescript
interface PullRequest {
  id: string;          // pk
  number: number;      // int
  title: string;       // varchar(255)
  branch: string;      // varchar(255)
  author: string;      // varchar(255)
  status: 'open' | 'merged' | 'closed';
  codeChanges: string; // text (contiene el diff o código)
  aiReview?: string;   // text (análisis retornado por Gemini)
  checks?: {           // jsonb
    name: string;
    status: 'success' | 'failed' | 'pending';
  }[];
}
\`\`\`

### 2.7. Logs de Eventos de Observabilidad
\`\`\`typescript
interface Log {
  id: string;          // uuid
  time: string;        // timestamp
  agent: string;       // varchar(100) (p. ej., "Git Guardian", "SendGrid")
  text: string;        // text
  type: 'info' | 'success' | 'warning' | 'error';
}
\`\`\`

### 2.8. Notificaciones de Correo SendGrid
\`\`\`typescript
interface SendGridNotification {
  id: string;          // pk
  subject: string;     // varchar(255)
  to: string;          // varchar(255)
  time: string;        // varchar(50)
  status: 'sent' | 'failed';
  body: string;        // text
  templateId: string;  // varchar(100)
}
\`\`\`

---

## 3. Especificación de Endpoints REST (Contrato de API)

Todos los endpoints deben consumir y retornar datos en formato \`application/json\` y usar códigos de estado HTTP semánticos.

### 3.1. Gestión de Backlog & Planning (Kanban)

#### \`GET /api/project/state\`
- **Propósito**: Retorna la foto completa del proyecto actual (épicas, historias, tareas, miembros).
- **Respuesta (200 OK)**:
  \`\`\`json
  {
    "id": "proj-1",
    "name": "PmoPilot Core",
    "description": "Plataforma de orquestación de equipos SDD con IA.",
    "status": "active",
    "epics": [],
    "stories": [],
    "tasks": [],
    "members": []
  }
  \`\`\`

#### \`POST /api/planning\`
- **Propósito**: Consulta el SDK de Gemini (\`@google/genai\`) para descomponer un Product Brief textual en épicas, historias y tareas estructuradas con prioridades y descripciones detalladas de ingeniería.
- **Cuerpo de la Petición**:
  \`\`\`json
  {
    "brief": "Cadena de texto con las instrucciones del producto...",
    "stack": "React & Express"
  }
  \`\`\`
- **Respuesta (200 OK)**: Retorna un objeto JSON estructurado con las nuevas épicas, historias y tareas sugeridas.

### 3.2. Asistente y Memoria Semántica

#### \`POST /api/semantic-memory\`
- **Propósito**: Chat interactivo con el Orquestador Central. Envía el mensaje del usuario junto al historial de chat y el contexto del proyecto actual. El backend utiliza Gemini para retornar una respuesta explicativa y, opcionalmente, proponer acciones semánticas directas (por ejemplo: \`CREATE_TASK\`, \`ADD_MEMBER\`, \`UPDATE_TASK_STATUS\`, \`BOOTSTRAP_PROJECT\`).
- **Cuerpo de la Petición**:
  \`\`\`json
  {
    "message": "Crea una tarea para diseñar el modelo de datos asignada a David",
    "history": [],
    "projectContext": { "name": "PmoPilot Core", "epicsCount": 3, "tasksCount": 5 }
  }
  \`\`\`
- **Respuesta (200 OK)**:
  \`\`\`json
  {
    "response": "¡Entendido! He programado la creación de una tarea técnica...",
    "proposedAction": {
      "type": "CREATE_TASK",
      "data": {
        "title": "Diseñar esquema de claves e índices en DynamoDB",
        "description": "Definir claves PK, SK e índices GSI para tablas nativas en DynamoDB.",
        "priority": "high",
        "assignedTo": "David (Backend Dev)"
      }
    }
  }
  \`\`\`

### 3.3. Git Guardian & Arbitraje de PRs

#### \`POST /api/pull-requests/:id/audit\`
- **Propósito**: Envía los cambios de código (\`codeChanges\`) de una PR al SDK de Gemini para realizar un análisis estático de seguridad (SAST), calidad, y apego a las directrices de SDD y el ADR del proyecto. Genera revisiones con markdown detallado.
- **Respuesta (200 OK)**: Retorna la PR con la propiedad \`aiReview\` poblada y un conjunto de checks validados.

#### \`POST /api/pull-requests/:id/merge\`
- **Propósito**: Ejecuta el pipeline de integración continua virtual. Al fusionar la rama:
  1. Cambia el estado de la PR a \`"merged"\`.
  2. Identifica y actualiza automáticamente el estado de la tarea vinculada a \`"done"\`.
  3. Despacha una notificación transaccional SMTP SendGrid al correo del Lead Dev.
  4. Agrega un log de éxito en el historial de eventos de observabilidad.
- **Respuesta (200 OK)**:
  \`\`\`json
  { "success": true, "message": "PR fusionada y tarea cerrada exitosamente." }
  \`\`\`

### 3.4. Notificaciones & Gateway de SendGrid

#### \`POST /api/notifications/sendgrid\`
- **Propósito**: Recibe el borrador del correo (asunto, destinatario, cuerpo, plantilla) y gatilla el despacho transaccional real a través del cliente de SendGrid SDK. Los eventos exitosos se registran en la base de datos de observabilidad para auditoría de entrega.
- **Cuerpo de la Petición**:
  \`\`\`json
  {
    "to": "fundador@startup.com",
    "subject": "Alerta de Conflicto en rama feature/billing-refund",
    "body": "Hola Carlos, el módulo Git Guardian ha detectado un conflicto...",
    "templateId": "d-sg-conflict-alert"
  }
  \`\`\`
- **Respuesta (200 OK)**: Retorna el correo con su ID de entrega de SendGrid y estado \`"sent"\`.

### 3.5. Configuración de Seguridad de Cloudflare (RBAC)

#### \`PUT /api/cloudflare/config\`
- **Propósito**: Actualiza los parámetros del proxy perimetral SSL y el escudo DDOS de Cloudflare. **Requiere verificación estricta de rol**. Solo los usuarios autenticados con rol \`'leader'\` (Carlos) tienen autorización para realizar esta mutación. Si un tester o invitado lo intenta, el servidor retorna \`403 Forbidden\`.
- **Cabeceras**: \`Authorization: Bearer <token_jwt>\` (con Claims de rol del usuario).
- **Cuerpo de la Petición**:
  \`\`\`json
  {
    "underAttackMode": true,
    "rateLimiting": true
  }
  \`\`\`
- **Respuesta (200 OK)**: Configuración actualizada.

---

## 4. Estructura de Claves y Atributos en Amazon DynamoDB

\`\`\`json
{
  "UsersTable": {
    "PK": "USER#<id>",
    "attributes": { "email": "string", "password_hash": "string", "role": "leader|tester|guest", "created_at": "ISO-8601" }
  },
  "EpicsTable": {
    "PK": "EPIC#<id>",
    "attributes": { "title": "string", "description": "string", "status": "todo|in_progress|done" }
  },
  "StoriesTable": {
    "PK": "STORY#<id>",
    "GSI1_PK": "EPIC#<epic_id>",
    "attributes": { "title": "string", "description": "string", "epic_id": "string", "status": "todo|in_progress|done" }
  },
  "TasksTable": {
    "PK": "TASK#<id>",
    "GSI1_PK": "EPIC#<epic_id>",
    "GSI2_PK": "STORY#<story_id>",
    "attributes": { "title": "string", "description": "string", "status": "todo|in_progress|done", "priority": "low|medium|high", "assigned_to": "string" }
  }
}
\`\`\`
`;

