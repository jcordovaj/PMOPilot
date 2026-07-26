from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


class ChatMessage(BaseModel):
    """Modelo para un mensaje en el historial de chat."""
    sender: str = Field(..., description="Remitente del mensaje (user o assistant)")
    text: str = Field(..., description="Texto del mensaje")
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat(), description="Timestamp del mensaje")
    
    class Config:
        json_schema_extra = {
            "example": {
                "sender": "user",
                "text": "Hola, necesito crear una nueva tarea",
                "timestamp": "2024-01-01T00:00:00Z"
            }
        }


class ProposedActionData(BaseModel):
    """Datos específicos para una acción propuesta."""
    
    class Config:
        extra = "allow"  # Permite campos adicionales dinámicos


class ProposedAction(BaseModel):
    """Modelo para una acción propuesta por el asistente."""
    type: str = Field(..., description="Tipo de acción (CREATE_TASK, ADD_MEMBER, etc.)")
    data: Dict[str, Any] = Field(..., description="Datos específicos de la acción")
    
    class Config:
        json_schema_extra = {
            "example": {
                "type": "CREATE_TASK",
                "data": {
                    "title": "Optimizar base de datos",
                    "description": "Implementar índices y optimizar consultas",
                    "priority": "high",
                    "assignedTo": "Ana (Backend Dev)"
                }
            }
        }


class SemanticMemoryRequest(BaseModel):
    """Modelo para la solicitud de memoria semántica."""
    message: str = Field(..., description="Mensaje del usuario")
    history: Optional[List[ChatMessage]] = Field(default_factory=list, description="Historial de conversación")
    project_context: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Contexto del proyecto")
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "Crea una tarea para optimizar la base de datos",
                "history": [],
                "project_context": {}
            }
        }


class SemanticMemoryResponse(BaseModel):
    """Modelo para la respuesta de memoria semántica."""
    response: str = Field(..., description="Respuesta del asistente en markdown")
    proposed_action: Optional[ProposedAction] = Field(default=None, description="Acción propuesta (si aplica)")
    is_mock: bool = Field(default=False, description="Indica si se usaron datos mock")
    
    class Config:
        json_schema_extra = {
            "example": {
                "response": "¡Entendido! He interpretado tu intención semántica como la creación de una nueva tarea...",
                "proposed_action": ProposedAction.Config.json_schema_extra["example"],
                "is_mock": False
            }
        }


class CodeAnalysisRequest(BaseModel):
    """Modelo para la solicitud de análisis de código."""
    pr_title: str = Field(..., description="Título de la Pull Request")
    pr_branch: str = Field(..., description="Rama de origen de la PR")
    code_changes: str = Field(..., description="Cambios de código a analizar")
    task_spec: Optional[str] = Field(default=None, description="Especificación de la tarea original")
    
    class Config:
        json_schema_extra = {
            "example": {
                "pr_title": "Fix login validation",
                "pr_branch": "feature/login-fix",
                "code_changes": "// Código TypeScript aquí",
                "task_spec": "Implementar validación de email y contraseña"
            }
        }


class CodeAnalysisResponse(BaseModel):
    """Modelo para la respuesta de análisis de código."""
    success: bool = Field(..., description="Indica si el análisis fue exitoso")
    review: str = Field(..., description="Revisión en formato markdown")
    decision: str = Field(..., description="Decisión: approved, provisionally_approved, rejected")
    suggestions: List[str] = Field(default_factory=list, description="Sugerencias de mejora")
    compliance_score: int = Field(..., ge=0, le=100, description="Puntuación de cumplimiento (0-100)")
    checks: Optional[List[Dict[str, Any]]] = Field(default_factory=list, description="Checks ejecutados")
    is_mock: bool = Field(default=False, description="Indica si se usaron datos mock")
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "review": "### 🤖 PMOPilot PR Arbiter Review\n\n**Resultado**: ✅ COMPLIANT...",
                "decision": "provisionally_approved",
                "suggestions": ["Agregar pruebas unitarias", "Mejorar documentación"],
                "compliance_score": 92,
                "checks": [
                    {"name": "Compilación", "status": "success"},
                    {"name": "Pruebas", "status": "success"}
                ],
                "is_mock": False
            }
        }


class MergeRequest(BaseModel):
    """Modelo para la solicitud de fusión de PR."""
    pr_id: str = Field(..., description="ID de la Pull Request")
    merged_by: str = Field(..., description="Persona que realiza la fusión")
    task_id: Optional[str] = Field(default=None, description="ID de la tarea asociada")
    
    class Config:
        json_schema_extra = {
            "example": {
                "pr_id": "pr-123",
                "merged_by": "Carlos (Lead Dev)",
                "task_id": "task-456"
            }
        }


class MergeResponse(BaseModel):
    """Modelo para la respuesta de fusión de PR."""
    success: bool = Field(..., description="Indica si la fusión fue exitosa")
    pr_id: str = Field(..., description="ID de la Pull Request")
    new_status: str = Field(..., description="Nuevo estado de la PR")
    task_updated: Optional[bool] = Field(default=None, description="Indica si se actualizó la tarea")
    email_sent: Optional[bool] = Field(default=None, description="Indica si se envió notificación")
    log_created: bool = Field(default=True, description="Indica si se creó registro en logs")
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "pr_id": "pr-123",
                "new_status": "merged",
                "task_updated": True,
                "email_sent": True,
                "log_created": True
            }
        }