from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uuid
import datetime

from src.core.config import settings
from src.core.security import verify_role, User
from src.integrations.gemini import GeminiClient
from src.integrations.sendgrid import SendGridClient
from src.integrations.cloudflare import CloudflareClient

app = FastAPI(
    title="PMOPilot Backend API",
    description="REST API for Spec-Driven Development (SDD) PMO Orquestación, serving frontend integration.",
    version="1.0.0"
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Integration Clients
gemini_client = GeminiClient()
sendgrid_client = SendGridClient()
cloudflare_client = CloudflareClient()


# ==========================================
# Schema Definitions (Pydantic v2)
# ==========================================

class BriefInput(BaseModel):
    brief: str
    stack: Optional[str] = "React & Node"

class SemanticMessageInput(BaseModel):
    message: str
    history: List[Dict[str, Any]]
    projectContext: Dict[str, Any]

class SendEmailInput(BaseModel):
    to: str
    subject: str
    body: str
    templateId: Optional[str] = None

class CloudflareConfigInput(BaseModel):
    underAttackMode: bool
    rateLimiting: bool

class BootstrapInput(BaseModel):
    projectName: str
    framework: Optional[str] = "React (Vite)"
    branchProtection: Optional[bool] = True
    teamMembers: Optional[List[str]] = []


# ==========================================
# API Router / Endpoints
# ==========================================

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "geminiConfigured": gemini_client.client is not None,
        "region": settings.AWS_REGION,
        "tablePrefix": settings.DYNAMODB_TABLE_PREFIX
    }

@app.get("/api/project/state")
async def get_project_state():
    """
    Retorna la foto completa del proyecto actual (épicas, historias, tareas, miembros).
    KIRO implementará la consulta optimizada a DynamoDB.
    """
    # Stub Mock data matching initial frontend spec
    return {
        "id": "proj-1",
        "name": "PmoPilot Core",
        "description": "Plataforma de orquestación de equipos SDD con IA.",
        "status": "active",
        "epics": [
            { "id": "epic-1", "title": "Autenticación y Perfiles", "description": "Implementar un sistema seguro de login, registro y CODEOWNERS.", "status": "todo" },
            { "id": "epic-2", "title": "Panel del Desarrollador (Dashboard)", "description": "Crear el centro de control interactivo para ver ramas y PRs.", "status": "todo" }
        ],
        "stories": [
            { "id": "story-1", "title": "Como usuario, quiero iniciar sesión con email y contraseña", "epicId": "epic-1", "status": "todo" },
            { "id": "story-2", "title": "Como desarrollador, quiero ver el estado de compilación de las ramas", "epicId": "epic-2", "status": "todo" }
        ],
        "tasks": [
            { "id": "task-1", "title": "Diseñar esquema de base de datos de usuarios", "description": "Crear tabla de usuarios con contraseñas cifradas con bcrypt.", "status": "todo", "priority": "high", "epicId": "epic-1", "storyId": "story-1" },
            { "id": "task-2", "title": "Implementar API de login en el backend", "description": "Crear ruta POST /api/login que emita un token JWT firmado.", "status": "todo", "priority": "high", "epicId": "epic-1", "storyId": "story-1" },
            { "id": "task-3", "title": "Maquetar la vista principal del Dashboard con Tailwind", "description": "Diseñar la grilla de métricas con un esquema de color claro y tipografía legible.", "status": "todo", "priority": "medium", "epicId": "epic-2", "storyId": "story-2" }
        ],
        "members": [
            { "name": "Carlos (Lead Dev)", "role": "leader" },
            { "name": "Ana (Frontend Dev)", "role": "tester" },
            { "name": "David (Backend Dev)", "role": "guest" }
        ]
    }

@app.post("/api/planning")
async def planning_agent(payload: BriefInput):
    """
    Descompone un Product Brief textual en épicas, historias y tareas sugeridas.
    Utiliza el SDK de Gemini.
    """
    if not payload.brief:
        raise HTTPException(status_code=400, detail="Product brief is required.")
    
    # Stub Mock response format
    mock_epics = [
        { "id": "epic-1", "title": "Autenticación y Perfiles", "description": "Implementar un sistema seguro de login, registro y CODEOWNERS.", "status": "todo" },
        { "id": "epic-2", "title": "Panel del Desarrollador (Dashboard)", "description": "Crear el centro de control interactivo para ver ramas y PRs.", "status": "todo" }
    ]
    mock_stories = [
        { "id": "story-1", "title": "Como usuario, quiero iniciar sesión con email y contraseña", "epicId": "epic-1", "status": "todo" },
        { "id": "story-2", "title": "Como desarrollador, quiero ver el estado de compilación de las ramas", "epicId": "epic-2", "status": "todo" }
    ]
    mock_tasks = [
        { "id": "task-1", "title": "Diseñar esquema de base de datos de usuarios", "description": "Crear tabla de usuarios con contraseñas cifradas con bcrypt.", "status": "todo", "priority": "high", "epicId": "epic-1", "storyId": "story-1" },
        { "id": "task-2", "title": "Implementar API de login en el backend", "description": "Crear ruta POST /api/login que emita un token JWT firmado.", "status": "todo", "priority": "high", "epicId": "epic-1", "storyId": "story-1" },
        { "id": "task-3", "title": "Maquetar la vista principal del Dashboard con Tailwind", "description": "Diseñar la grilla de métricas con un esquema de color claro y tipografía legible.", "status": "todo", "priority": "medium", "epicId": "epic-2", "storyId": "story-2" }
    ]
    return {
        "epics": mock_epics,
        "stories": mock_stories,
        "tasks": mock_tasks,
        "isMock": True
    }

@app.post("/api/semantic-memory")
async def semantic_memory_agent(payload: SemanticMessageInput):
    """
    Asistente conversacional. Evalúa el intent para proponer acciones semánticas estructuradas.
    """
    message_lower = payload.message.lower().strip()
    
    # Restricción de dominio
    out_of_domain_keywords = ["sopa", "receta", "cocina", "comida", "chiste", "clima", "horóscopo", "fútbol", "viaje"]
    if any(kw in message_lower for kw in out_of_domain_keywords):
        return {
            "response": "⚠️ **Dominio Restringido**: Como PMO Semántica (PmoPilot), mi conocimiento está limitado a la orquestación del proyecto, arquitectura (ADRs), especificaciones SDD y control de calidad. No puedo responder consultas fuera de este dominio.",
            "proposedAction": None,
            "isMock": True
        }

    # Proponer acciones según intenciones básicas
    proposed_action = None
    reply = "He procesado tu comando semántico. ¿Deseas aplicar los cambios sugeridos?"
    
    if "tarea" in message_lower:
        reply = "¡Entendido! Propongo la creación de una nueva tarea en el backlog técnico del proyecto basada en especificación SDD."
        proposed_action = {
            "type": "CREATE_TASK",
            "data": {
                "title": "Optimización técnica y refactor SDD",
                "description": "Especificación SDD preliminar: Validar los parámetros de entrada y verificar cumplimiento de criterios de aceptación de QA.",
                "priority": "medium",
                "assignedTo": "Ana (Frontend Dev)"
            }
        }
    elif "desarrollador" in message_lower or "miembro" in message_lower:
        reply = "He identificado que deseas expandir tu equipo de desarrollo de SDD. Propongo registrar al nuevo miembro."
        proposed_action = {
            "type": "ADD_MEMBER",
            "data": {
                "name": "Pedro Sánchez",
                "role": "Backend & Integraciones",
                "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
            }
        }
        
    return {
        "response": reply,
        "proposedAction": proposed_action,
        "isMock": True
    }

@app.post("/api/pull-requests/{id}/audit")
async def audit_pr(id: str, pr_payload: Dict[str, Any]):
    """
    Analiza cambios de código de la Pull Request y retorna la auditoría IA y los checks de calidad.
    """
    mock_review = """### 🤖 PmoPilot PR Arbiter Review

**Resultado**: ✅ COMPLIANT (Aprobado provisionalmente)

#### Análisis de Spec-Driven Development (SDD):
- **Alineación**: Implementa los campos requeridos en la especificación.
- **Calidad**: Componente modular que respeta clases Tailwind CSS.
"""
    return {
        "success": True,
        "review": mock_review,
        "checks": [
            { "id": "chk-1", "name": "Compilación & Bundling", "status": "success", "message": "Build exitoso" },
            { "id": "chk-2", "name": "Linter (ESLint / TSC)", "status": "success", "message": "0 errores" },
            { "id": "chk-3", "name": "Pruebas Unitarias", "status": "success", "message": "Pruebas exitosas" },
            { "id": "chk-4", "name": "Análisis de Seguridad (SAST)", "status": "success", "message": "Cero secrets expuestos" }
        ],
        "isMock": True
    }

@app.post("/api/pull-requests/{id}/merge")
async def merge_pr(id: str, current_user: User = Depends(verify_role("leader"))):
    """
    Fusión de la rama, actualiza tareas vinculadas en DynamoDB, notifica vía SendGrid y registra logs.
    Requiere que el rol del usuario sea 'leader'.
    """
    # Enviar correo de notificación (Simulación)
    await sendgrid_client.send_email(
        to_email="carlos@pmopilot.com",
        subject="PR Merge exitosa",
        body=f"La Pull Request PR-{id} ha sido fusionada por {current_user.email}."
    )
    return {
        "success": True,
        "message": f"PR {id} fusionada y tareas cerradas exitosamente por el líder."
    }

@app.post("/api/notifications/sendgrid")
async def send_notification(payload: SendEmailInput):
    """
    Gateway de despacho de correos SendGrid. Registra el estado del envío.
    """
    success = await sendgrid_client.send_email(
        to_email=payload.to,
        subject=payload.subject,
        body=payload.body,
        template_id=payload.templateId
    )
    return {
        "id": str(uuid.uuid4()),
        "status": "sent" if success else "failed",
        "recipient": payload.to
    }

@app.put("/api/cloudflare/config")
async def update_cloudflare_config(
    payload: CloudflareConfigInput,
    current_user: User = Depends(verify_role("leader"))
):
    """
    Actualiza la gobernanza perimetral en Cloudflare. Requiere rol 'leader'.
    """
    success = await cloudflare_client.update_security_config(
        under_attack=payload.underAttackMode,
        rate_limiting=payload.rateLimiting
    )
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update Cloudflare configurations.")
    return {
        "success": True,
        "message": f"Cloudflare configuration updated by leader {current_user.email}."
    }

@app.post("/api/project/bootstrap")
async def bootstrap_project(payload: BootstrapInput):
    """
    Inicializa el proyecto con repositorios, webhooks y credenciales de AWS/Gemini.
    """
    # KIRO guardará esto en la tabla DynamoDB en el ítem PROJECT#CONFIG
    return {
        "projectName": payload.projectName,
        "files": [
            { "path": "CODEOWNERS", "content": "Codeowners setup" },
            { "path": ".github/workflows/dev-flow.yml", "content": "DevFlow workflow setup" }
        ],
        "settingsSummary": {
            "branchProtection": "Activada" if payload.branchProtection else "Básica",
            "continuousIntegration": "GitHub Actions activa"
        }
    }
