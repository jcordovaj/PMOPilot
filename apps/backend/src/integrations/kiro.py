"""
Integración nativa con Kiro - Simbiosis PMOPilot ↔ Kiro

PMOPilot (Gobierno) ↔ Kiro (Construcción)
     ↓                       ↓
Especificaciones →    Generación de código
     ↑                       ↑
  Validación ←      Implementación
"""
from typing import Dict, List, Any, Optional
import httpx
import logging
from ..models.planning import Epic, Task
from ..core.config import settings

logger = logging.getLogger(__name__)


class KiroIntegration:
    """Integración con Kiro para generación de código asistida por IA."""
    
    _instance = None
    
    def __init__(self):
        """Inicializa la integración con Kiro."""
        # En una implementación real, esto se configuraría con credenciales
        # Por ahora usamos modo simulado
        self.base_url = "https://api.kiro.dev"  # URL ejemplo
        self.mode = "simulated"  # simulated, api, webhook
        
        logger.info("KiroIntegration inicializado (modo simulado)")
    
    @classmethod
    def get_instance(cls):
        """Obtiene la instancia singleton de la integración."""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
    
    async def create_spec_from_task(self, task: Task, epic: Optional[Epic] = None) -> Dict[str, Any]:
        """
        Crea una especificación SDD detallada para Kiro a partir de una tarea.
        
        Args:
            task: Objeto Task con la descripción SDD
            epic: Épica padre (opcional para contexto)
            
        Returns:
            Especificación estructurada para Kiro
        """
        spec = {
            "type": "sdd_specification",
            "task_id": task.id,
            "task_title": task.title,
            "task_description": task.description,
            "priority": task.priority,
            "status": task.status,
            "epic_context": epic.description if epic else None,
            "specification": self._enhance_sdd_spec(task.description),
            "acceptance_criteria": self._generate_acceptance_criteria(task),
            "technical_requirements": self._extract_technical_requirements(task),
            "kiro_context": {
                "framework_hint": "react-node" if "react" in task.description.lower() else "default",
                "complexity_level": "high" if task.priority == "high" else "medium",
                "ai_assistance_level": "full"  # full, partial, validation_only
            }
        }
        
        logger.info(f"Especificación SDD creada para tarea: {task.id}")
        
        # En modo simulado, guardamos localmente
        if self.mode == "simulated":
            return {
                "success": True,
                "spec_id": f"spec-{task.id}",
                "specification": spec,
                "kiro_response": {
                    "estimated_completion_time": "2-4 hours",
                    "suggested_approach": "Implement with React hooks and TypeScript",
                    "potential_challenges": ["State management", "Error handling"],
                    "ai_readiness_score": 85
                },
                "is_simulated": True
            }
        
        # En modo real, enviar a API de Kiro
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/v1/specs/create",
                    json=spec,
                    headers={"Authorization": f"Bearer {settings.kiro_api_key}"}
                )
                
                if response.status_code == 200:
                    return {
                        "success": True,
                        "spec_id": response.json().get("spec_id"),
                        **response.json()
                    }
                else:
                    logger.error(f"Error API Kiro: {response.status_code}")
                    return {
                        "success": False,
                        "error": f"API Kiro error: {response.status_code}"
                    }
                    
        except Exception as e:
            logger.error(f"Error conectando con Kiro: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def generate_code_from_spec(self, spec_id: str, task: Task) -> Dict[str, Any]:
        """
        Solicita a Kiro que genere código basado en una especificación.
        
        Args:
            spec_id: ID de la especificación
            task: Tarea asociada
            
        Returns:
            Código generado y metadatos
        """
        if self.mode == "simulated":
            # Generar código simulado basado en la tarea
            code_samples = self._generate_mock_code(task)
            
            return {
                "success": True,
                "spec_id": spec_id,
                "task_id": task.id,
                "generated_files": code_samples,
                "quality_metrics": {
                    "completeness": 88,
                    "readability": 92,
                    "test_coverage": 75,
                    "best_practices": 90
                },
                "review_comments": [
                    "✅ Componente modular bien estructurado",
                    "⚠️ Considerar añadir más comentarios JSDoc",
                    "✅ TypeScript types correctamente aplicados"
                ],
                "is_simulated": True
            }
        
        # En modo real, llamar a API de Kiro
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.base_url}/v1/code/generate",
                    json={
                        "spec_id": spec_id,
                        "task_context": {
                            "id": task.id,
                            "title": task.title,
                            "description": task.description
                        }
                    },
                    headers={"Authorization": f"Bearer {settings.kiro_api_key}"}
                )
                
                return response.json()
                
        except Exception as e:
            logger.error(f"Error generando código con Kiro: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def track_implementation_progress(self, task_id: str, changes: Dict[str, Any]) -> Dict[str, Any]:
        """
        Reporta progreso de implementación a Kiro para sincronización.
        
        Args:
            task_id: ID de la tarea
            changes: Cambios realizados (archivos modificados, tests, etc.)
            
        Returns:
            Confirmación y feedback de Kiro
        """
        if self.mode == "simulated":
            logger.info(f"Progreso trackeado para tarea {task_id}: {len(changes.get('files', []))} archivos")
            
            return {
                "success": True,
                "task_id": task_id,
                "kiro_feedback": {
                    "suggestions": [
                        "Considerar añadir tests unitarios para edge cases",
                        "El código sigue buenas prácticas de React"
                    ],
                    "next_steps": [
                        "Ejecutar linter",
                        "Correr pruebas existentes",
                        "Actualizar documentación"
                    ]
                },
                "is_simulated": True
            }
        
        # En modo real
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/v1/progress/track",
                    json={
                        "task_id": task_id,
                        "changes": changes,
                        "timestamp": datetime.now().isoformat()
                    },
                    headers={"Authorization": f"Bearer {settings.kiro_api_key}"}
                )
                
                return response.json()
                
        except Exception as e:
            logger.error(f"Error trackeando progreso con Kiro: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def validate_code_against_spec(self, code: str, spec_id: str) -> Dict[str, Any]:
        """
        Valida código implementado contra especificación original.
        
        Args:
            code: Código a validar
            spec_id: ID de la especificación
            
        Returns:
            Resultado de validación y sugerencias
        """
        if self.mode == "simulated":
            # Validación simulada
            issues = []
            if len(code) < 100:
                issues.append("Código demasiado corto, posible implementación incompleta")
            if "TODO" in code or "FIXME" in code:
                issues.append("Se encontraron comentarios TODO/FIXME")
            
            return {
                "success": True,
                "spec_id": spec_id,
                "validation_result": {
                    "passed": len(issues) == 0,
                    "issues": issues,
                    "compliance_score": 85 if len(issues) == 0 else 70 - (len(issues) * 10),
                    "suggestions": [
                        "Añadir más comentarios explicativos",
                        "Considerar casos edge en validaciones"
                    ]
                },
                "is_simulated": True
            }
        
        # En modo real
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/v1/validation/check",
                    json={
                        "spec_id": spec_id,
                        "code": code,
                        "language": self._detect_language(code)
                    },
                    headers={"Authorization": f"Bearer {settings.kiro_api_key}"}
                )
                
                return response.json()
                
        except Exception as e:
            logger.error(f"Error validando código con Kiro: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def _enhance_sdd_spec(self, description: str) -> str:
        """Mejora una descripción SDD básica para Kiro."""
        enhanced = f"""# Especificación SDD para Kiro

## Descripción Original
{description}

## Requerimientos Detallados para IA
1. **Entrada/Salida**: Especificar formatos exactos de datos
2. **Validaciones**: Reglas de validación específicas
3. **Manejo de Errores**: Casos de error y respuestas
4. **Performance**: Requisitos de rendimiento si aplican
5. **Seguridad**: Consideraciones de seguridad

## Criterios de Éxito
- [ ] Código compila sin errores
- [ ] Tests unitarios pasan
- [ ] Cumple con convenciones del proyecto
- [ ] Documentación adecuada
"""
        return enhanced
    
    def _generate_acceptance_criteria(self, task: Task) -> List[str]:
        """Genera criterios de aceptación basados en la tarea."""
        criteria = [
            f"La funcionalidad cumple con: {task.title}",
            "Código pasa linter sin errores",
            "Tests unitarios con cobertura >80%",
            "Documentación actualizada",
            "Revisión de pares aprobada"
        ]
        
        if task.priority == "high":
            criteria.append("Implementado con mejores prácticas de seguridad")
            criteria.append("Performance optimizada")
        
        return criteria
    
    def _extract_technical_requirements(self, task: Task) -> Dict[str, Any]:
        """Extrae requisitos técnicos de la descripción SDD."""
        desc_lower = task.description.lower()
        
        requirements = {
            "frontend": any(keyword in desc_lower for keyword in ["react", "vue", "angular", "frontend", "ui"]),
            "backend": any(keyword in desc_lower for keyword in ["api", "backend", "server", "database", "endpoint"]),
            "database": any(keyword in desc_lower for keyword in ["db", "database", "query", "table", "schema"]),
            "security": any(keyword in desc_lower for keyword in ["auth", "security", "encrypt", "jwt", "oauth"]),
            "testing": any(keyword in desc_lower for keyword in ["test", "unit", "integration", "coverage"]),
            "performance": any(keyword in desc_lower for keyword in ["performance", "optimize", "cache", "fast"])
        }
        
        return requirements
    
    def _generate_mock_code(self, task: Task) -> List[Dict[str, str]]:
        """Genera código mock basado en el tipo de tarea."""
        desc_lower = task.description.lower()
        
        if any(keyword in desc_lower for keyword in ["react", "component", "frontend"]):
            return [
                {
                    "path": "src/components/ExampleComponent.tsx",
                    "content": """import React, { useState, useEffect } from 'react';
import './ExampleComponent.css';

interface ExampleComponentProps {
  title: string;
  initialCount?: number;
}

const ExampleComponent: React.FC<ExampleComponentProps> = ({ 
  title, 
  initialCount = 0 
}) => {
  const [count, setCount] = useState(initialCount);
  
  useEffect(() => {
    console.log('Component mounted or count changed:', count);
  }, [count]);
  
  const handleIncrement = () => {
    setCount(prev => prev + 1);
  };
  
  const handleReset = () => {
    setCount(initialCount);
  };
  
  return (
    <div className="example-component">
      <h2>{title}</h2>
      <div className="counter-display">
        Current count: <strong>{count}</strong>
      </div>
      <div className="controls">
        <button onClick={handleIncrement} className="btn-primary">
          Increment
        </button>
        <button onClick={handleReset} className="btn-secondary">
          Reset
        </button>
      </div>
    </div>
  );
};

export default ExampleComponent;"""
                },
                {
                    "path": "src/components/ExampleComponent.css",
                    "content": """.example-component {
  padding: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background-color: #f7fafc;
}

.example-component h2 {
  margin-top: 0;
  color: #2d3748;
}

.counter-display {
  font-size: 18px;
  margin: 15px 0;
  padding: 10px;
  background-color: white;
  border-radius: 4px;
}

.controls {
  display: flex;
  gap: 10px;
}

.btn-primary {
  background-color: #4299e1;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-primary:hover {
  background-color: #3182ce;
}

.btn-secondary {
  background-color: #e2e8f0;
  color: #4a5568;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-secondary:hover {
  background-color: #cbd5e0;
}"""
                }
            ]
        elif any(keyword in desc_lower for keyword in ["api", "endpoint", "backend"]):
            return [
                {
                    "path": "src/api/example.py",
                    "content": """from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/example", tags=["example"])

# Models
class ExampleRequest(BaseModel):
    name: str
    value: Optional[int] = None
    
class ExampleResponse(BaseModel):
    id: str
    name: str
    processed_value: int
    success: bool
    message: str

# Endpoints
@router.get("/")
async def get_example():
    """Get example data."""
    return {
        "message": "Example API is working",
        "version": "1.0.0",
        "endpoints": ["/api/example/", "/api/example/process"]
    }

@router.post("/process", response_model=ExampleResponse)
async def process_example(request: ExampleRequest):
    """Process example data."""
    try:
        # Simulate processing
        processed_value = request.value * 2 if request.value else 100
        
        return ExampleResponse(
            id="example-123",
            name=request.name,
            processed_value=processed_value,
            success=True,
            message=f"Processed {request.name} successfully"
        )
        
    except Exception as e:
        logger.error(f"Error processing example: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error processing request"
        )

@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "example-api",
        "timestamp": "2024-01-01T00:00:00Z"
    }"""
                }
            ]
        else:
            return [
                {
                    "path": "README.md",
                    "content": f"""# {task.title}

## Descripción
{task.description}

## Implementación
Esta es una implementación de ejemplo generada por PMOPilot + Kiro.

## Cómo usar
1. Instalar dependencias
2. Ejecutar tests
3. Iniciar la aplicación

## Criterios de Aceptación
- [ ] Funcionalidad completa
- [ ] Tests pasando
- [ ] Documentación actualizada"""
                }
            ]
    
    def _detect_language(self, code: str) -> str:
        """Detecta el lenguaje de programación del código."""
        if "import React" in code or "React.FC" in code:
            return "typescript"
        elif "from fastapi" in code or "@router" in code:
            return "python"
        elif "def " in code and "import " in code:
            return "python"
        elif "function " in code or "const " in code:
            return "javascript"
        else:
            return "unknown"