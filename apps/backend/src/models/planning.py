from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum


class TaskStatus(str, Enum):
    """Estado de una tarea."""
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"


class TaskPriority(str, Enum):
    """Prioridad de una tarea."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class Epic(BaseModel):
    """Modelo para una Épica."""
    id: str = Field(..., description="ID único de la épica")
    title: str = Field(..., description="Título de la épica")
    description: str = Field(..., description="Descripción detallada de la épica")
    status: TaskStatus = Field(default=TaskStatus.TODO, description="Estado de la épica")
    created_at: Optional[str] = Field(default_factory=lambda: datetime.now().isoformat(), description="Fecha de creación")
    updated_at: Optional[str] = Field(default=None, description="Fecha de última actualización")
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "epic-1",
                "title": "Autenticación y Perfiles",
                "description": "Implementar un sistema seguro de login, registro y CODEOWNERS.",
                "status": "todo"
            }
        }


class Story(BaseModel):
    """Modelo para una Historia de Usuario."""
    id: str = Field(..., description="ID único de la historia")
    title: str = Field(..., description="Título de la historia")
    description: str = Field(..., description="Descripción detallada de la historia")
    epic_id: str = Field(..., description="ID de la épica a la que pertenece")
    status: TaskStatus = Field(default=TaskStatus.TODO, description="Estado de la historia")
    created_at: Optional[str] = Field(default_factory=lambda: datetime.now().isoformat(), description="Fecha de creación")
    updated_at: Optional[str] = Field(default=None, description="Fecha de última actualización")
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "story-1",
                "title": "Como usuario, quiero iniciar sesión con email y contraseña",
                "description": "Sistema de autenticación básico con validación de credenciales",
                "epic_id": "epic-1",
                "status": "todo"
            }
        }


class Task(BaseModel):
    """Modelo para una Tarea de Desarrollo."""
    id: str = Field(..., description="ID único de la tarea")
    title: str = Field(..., description="Título de la tarea")
    description: str = Field(..., description="Descripción detallada y especificación SDD")
    status: TaskStatus = Field(default=TaskStatus.TODO, description="Estado de la tarea")
    priority: TaskPriority = Field(..., description="Prioridad de la tarea")
    epic_id: str = Field(..., description="ID de la épica a la que pertenece")
    story_id: str = Field(..., description="ID de la historia a la que pertenece")
    assigned_to: Optional[str] = Field(default=None, description="Persona asignada a la tarea")
    created_at: Optional[str] = Field(default_factory=lambda: datetime.now().isoformat(), description="Fecha de creación")
    updated_at: Optional[str] = Field(default=None, description="Fecha de última actualización")
    completed_at: Optional[str] = Field(default=None, description="Fecha de completado")
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "task-1",
                "title": "Diseñar esquema de base de datos de usuarios",
                "description": "Crear tabla de usuarios con contraseñas cifradas con bcrypt.",
                "status": "todo",
                "priority": "high",
                "epic_id": "epic-1",
                "story_id": "story-1"
            }
        }


class PlanningRequest(BaseModel):
    """Modelo para la solicitud de planificación."""
    brief: str = Field(..., description="Brief del producto/proyecto")
    stack: Optional[str] = Field(default="React & Node", description="Stack tecnológico a utilizar")
    
    class Config:
        json_schema_extra = {
            "example": {
                "brief": "Sistema de gestión de proyectos para equipos de desarrollo",
                "stack": "React & Node.js"
            }
        }


class PlanningResponse(BaseModel):
    """Modelo para la respuesta de planificación."""
    epics: List[Epic] = Field(..., description="Lista de épicas generadas")
    stories: List[Story] = Field(..., description="Lista de historias generadas")
    tasks: List[Task] = Field(..., description="Lista de tareas generadas")
    is_mock: bool = Field(default=False, description="Indica si se usaron datos mock")
    
    class Config:
        json_schema_extra = {
            "example": {
                "epics": [Epic.Config.json_schema_extra["example"]],
                "stories": [Story.Config.json_schema_extra["example"]],
                "tasks": [Task.Config.json_schema_extra["example"]],
                "is_mock": False
            }
        }


class ProjectState(BaseModel):
    """Modelo para el estado completo del proyecto."""
    epics: List[Epic] = Field(default_factory=list, description="Épicas del proyecto")
    stories: List[Story] = Field(default_factory=list, description="Historias del proyecto")
    tasks: List[Task] = Field(default_factory=list, description="Tareas del proyecto")
    team_members: List[dict] = Field(default_factory=list, description="Miembros del equipo")
    pull_requests: List[dict] = Field(default_factory=list, description="Pull requests activas")
    adrs: List[dict] = Field(default_factory=list, description="Architectural Decision Records")
    metrics: dict = Field(default_factory=dict, description="Métricas del proyecto")
    last_updated: str = Field(default_factory=lambda: datetime.now().isoformat(), description="Última actualización")
    
    class Config:
        json_schema_extra = {
            "example": {
                "epics": [],
                "stories": [],
                "tasks": [],
                "team_members": [],
                "pull_requests": [],
                "adrs": [],
                "metrics": {
                    "total_tasks": 0,
                    "completed_tasks": 0,
                    "completion_rate": 0.0
                },
                "last_updated": "2024-01-01T00:00:00Z"
            }
        }