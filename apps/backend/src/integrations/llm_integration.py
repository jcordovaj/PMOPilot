from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional
import json
import re
from datetime import datetime

from ..core.config import settings
from ..models.planning import Epic, Story, Task, PlanningResponse
from ..models.semantic_memory import SemanticMemoryResponse, ProposedAction

class LLMProvider(ABC):
    """Interfaz abstracta para cualquier proveedor LLM."""
    
    @abstractmethod
    def is_configured(self) -> bool:
        """Verifica si el proveedor está configurado."""
        pass
    
    @abstractmethod
    async def decompose_brief(self, brief: str, stack: str) -> PlanningResponse:
        """Descompone un brief en estructura SDD."""
        pass
    
    @abstractmethod
    async def semantic_memory_chat(self, message: str, history: List[Dict[str, str]], 
                                project_context: Dict[str, Any]) -> SemanticMemoryResponse:
        """Chat semántico con memoria."""
        pass
    
    @abstractmethod
    async def analyze_code_changes(self, pr_title: str, pr_branch: str, 
                                code_changes: str, task_spec: Optional[str] = None) -> Dict[str, Any]:
        """Analiza cambios de código."""
        pass

class MockLLMProvider(LLMProvider):
    """Proveedor mock para desarrollo/testing."""
    
    def is_configured(self) -> bool:
        return True
    
    async def decompose_brief(self, brief: str, stack: str) -> PlanningResponse:
        timestamp = int(datetime.now().timestamp())
        
        epics = [
            Epic(id=f"epic-{timestamp}-1", title=f"Implementación {stack}", status="todo"),
            Epic(id=f"epic-{timestamp}-2", title="Testing y Calidad", status="todo")
        ]
        
        stories = [
            Story(id=f"story-{timestamp}-1", title="Autenticación", epic_id=epics[0].id, status="todo"),
            Story(id=f"story-{timestamp}-2", title="Pruebas automáticas", epic_id=epics[1].id, status="todo")
        ]
        
        tasks = [
            Task(id=f"task-{timestamp}-1", title="Diseñar autenticación", priority="high", 
                 epic_id=epics[0].id, story_id=stories[0].id, status="todo"),
            Task(id=f"task-{timestamp}-2", title="Implementar API login", priority="high",
                 epic_id=epics[0].id, story_id=stories[0].id, status="todo")
        ]
        
        return PlanningResponse(epics=epics, stories=stories, tasks=tasks, is_mock=True)
    
    async def semantic_memory_chat(self, message: str, history: List[Dict[str, str]], 
                                   project_context: Dict[str, Any]) -> SemanticMemoryResponse:
        lower_msg = message.lower()
        
        if "crear tarea" in lower_msg:
            return SemanticMemoryResponse(
                response="✓ Voy a crear una nueva tarea.",
                proposed_action=ProposedAction(
                    type="CREATE_TASK",
                    data={"title": "Nueva tarea", "priority": "medium"}
                ),
                is_mock=True
            )
        
        return SemanticMemoryResponse(
            response="🤖 PMOPilot Assistant: ¿En qué puedo ayudarte?",
            proposed_action=None,
            is_mock=True
        )
    
    async def analyze_code_changes(self, pr_title: str, pr_branch: str, 
                                   code_changes: str, task_spec: Optional[str] = None) -> Dict[str, Any]:
        return {
            "success": True,
            "review": f"### Revisión Mock
PR: {pr_title}",
            "decision": "provisionally_approved",
            "suggestions": ["Mejorar documentación"],
            "compliance_score": 85,
            "is_mock": True
        }

class LLMIntegration:
    """Fachada desacoplada para integraciones LLM."""
    
    _instance = None
    
    def __init__(self):
        self.providers = {"mock": MockLLMProvider()}
        self.active_provider = "mock"
    
    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
    
    def get_provider(self) -> LLMProvider:
        return self.providers[self.active_provider]
    
    def is_configured(self) -> bool:
        return self.get_provider().is_configured()
    
    async def decompose_brief(self, brief: str, stack: str) -> PlanningResponse:
        return await self.get_provider().decompose_brief(brief, stack)
    
    async def semantic_memory_chat(self, message: str, history: List[Dict[str, str]], 
                                   project_context: Dict[str, Any]) -> SemanticMemoryResponse:
        return await self.get_provider().semantic_memory_chat(message, history, project_context)
    
    async def analyze_code_changes(self, pr_title: str, pr_branch: str, 
                                   code_changes: str, task_spec: Optional[str] = None) -> Dict[str, Any]:
        return await self.get_provider().analyze_code_changes(pr_title, pr_branch, code_changes, task_spec)

LLMIntegrationInstance = LLMIntegration.get_instance