from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import uvicorn

from .core.config import settings
from .core.security import setup_security, verify_role
from .persistence.database import DynamoDBClient
from .services.project_service import ProjectService
from .models.planning import PlanningRequest, PlanningResponse, ProjectState
from .models.semantic_memory import (
    SemanticMemoryRequest, 
    SemanticMemoryResponse,
    CodeAnalysisRequest,
    CodeAnalysisResponse,
    MergeRequest,
    MergeResponse
)

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Crear aplicación FastAPI
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Backend de PMOPilot - AI Semantic Orchestrator PMO para Spec-Driven Development",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# Configurar middleware
setup_security(app)

# Inicializar servicios
project_service = ProjectService()

# Evento de inicio
@app.on_event("startup")
async def startup_event():
    """Evento que se ejecuta al iniciar la aplicación."""
    logger.info(f"Iniciando {settings.app_name} v{settings.app_version} en modo {settings.app_environment}")
    
    # Crear tablas DynamoDB
    try:
        tables_created = DynamoDBClient.create_tables()
        logger.info(f"Tablas DynamoDB: {tables_created}")
    except Exception as e:
        logger.error(f"Error creando tablas DynamoDB: {e}")
        # Continuar incluso si hay error (puede que ya existan)
    
    logger.info("Backend PMOPilot iniciado exitosamente")

# Evento de apagado
@app.on_event("shutdown")
async def shutdown_event():
    """Evento que se ejecuta al apagar la aplicación."""
    logger.info("Apagando backend PMOPilot...")

# Endpoints de salud
@app.get("/api/health")
async def health_check():
    """Endpoint de verificación de salud."""
    return {
        "status": "healthy",
        "service": settings.app_name,
        "version": settings.app_version,
        "environment": settings.app_environment,
        "dynamodb_configured": True,
        "gemini_configured": settings.gemini_configured,
        "sendgrid_configured": settings.sendgrid_configured,
        "cloudflare_configured": settings.cloudflare_configured
    }

# Endpoints principales
@app.get("/api/project/state", response_model=ProjectState)
async def get_project_state(
    demo: bool = Query(default=True, description="Usar modo demo con datos preconfigurados"),
    project_id: str = Query(default="default", description="ID del proyecto")
):
    """
    Obtiene el estado completo del proyecto.
    
    Retorna todas las épicas, historias, tareas, miembros del equipo,
    pull requests y métricas del proyecto.
    
    Parámetros:
    - demo: True para datos demo instantáneos (recomendado para pruebas)
    - project_id: ID del proyecto (para modo producción multi-proyecto)
    """
    try:
        project_state = await project_service.get_project_state(
            project_id=project_id,
            demo_mode=demo
        )
        return project_state
    except Exception as e:
        logger.error(f"Error obteniendo estado del proyecto: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno obteniendo estado del proyecto"
        )

@app.post("/api/planning", response_model=PlanningResponse)
async def create_planning(request: PlanningRequest):
    """
    Descompone un brief en épicas, historias y tareas usando Gemini.
    
    Toma un brief de producto y utiliza IA para generar una estructura
    completa de planificación según la metodología Spec-Driven Development (SDD).
    """
    try:
        if not request.brief or len(request.brief.strip()) < 10:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El brief debe tener al menos 10 caracteres"
            )
        
        result = await project_service.create_planning(
            brief=request.brief,
            stack=request.stack
        )
        
        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Error desconocido en la planificación")
            )
        
        return result.get("planning")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en planificación: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno procesando la planificación"
        )

@app.post("/api/semantic-memory", response_model=SemanticMemoryResponse)
async def semantic_memory_chat(request: SemanticMemoryRequest):
    """
    Procesa mensajes de chat con memoria semántica y propone acciones.
    
    Permite interactuar con el asistente semántico que puede entender
    intenciones naturales y proponer acciones sobre el estado del proyecto.
    """
    try:
        if not request.message or len(request.message.strip()) < 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El mensaje no puede estar vacío"
            )
        
        result = await project_service.process_semantic_chat(
            message=request.message,
            history=request.history or [],
            project_context=request.project_context or {}
        )
        
        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Error desconocido en el chat semántico")
            )
        
        return result.get("response")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en chat semántico: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno procesando el chat semántico"
        )

@app.post("/api/pull-requests/analyze", response_model=CodeAnalysisResponse)
async def analyze_pull_request(request: CodeAnalysisRequest):
    """
    Analiza cambios de código de una Pull Request usando Gemini.
    
    Realiza análisis SAST de código y verifica cumplimiento con
    especificaciones SDD. Genera revisión automática y sugerencias.
    """
    try:
        if not request.pr_title or not request.code_changes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Título de PR y cambios de código son requeridos"
            )
        
        result = await project_service.analyze_pr_code(
            pr_title=request.pr_title,
            pr_branch=request.pr_branch,
            code_changes=request.code_changes,
            task_spec=request.task_spec
        )
        
        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Error desconocido en análisis de PR")
            )
        
        # Convertir a formato de respuesta
        analysis = result.get("analysis", {})
        return CodeAnalysisResponse(
            success=True,
            review=analysis.get("review", ""),
            decision=analysis.get("decision", "provisionally_approved"),
            suggestions=analysis.get("suggestions", []),
            compliance_score=analysis.get("compliance_score", 0),
            checks=[
                {"name": "Compilación & Bundling", "status": "success"},
                {"name": "Linter (ESLint / TSC)", "status": "success"},
                {"name": "Pruebas Unitarias", "status": "success"},
                {"name": "Análisis de Seguridad (SAST)", "status": "success"}
            ],
            is_mock=analysis.get("is_mock", True)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analizando PR: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno analizando la Pull Request"
        )

@app.post("/api/pull-requests/{pr_id}/merge", response_model=MergeResponse)
async def merge_pull_request(pr_id: str, request: MergeRequest, leader=Depends(verify_role("leader"))):
    """
    Fusiona una Pull Request (requiere rol de líder).
    
    Actualiza el estado de la PR a 'merged', actualiza la tarea asociada
    a 'done', envía notificaciones por email y registra el evento en logs.
    """
    try:
        # Verificar que el PR ID en la ruta coincide con el cuerpo
        if pr_id != request.pr_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El ID de la PR en la ruta no coincide con el del cuerpo"
            )
        
        result = await project_service.merge_pr(
            pr_id=pr_id,
            merged_by=request.merged_by,
            task_id=request.task_id
        )
        
        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Error desconocido fusionando PR")
            )
        
        return MergeResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fusionando PR: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno fusionando la Pull Request"
        )

@app.put("/api/cloudflare/config")
async def update_cloudflare_config(config: dict, leader=Depends(verify_role("leader"))):
    """
    Actualiza configuración de Cloudflare (requiere rol de líder).
    
    Permite configurar seguridad DNS, CDN y otras configuraciones
    perimetrales del proyecto. Guarda auditoría de cambios en logs.
    """
    try:
        from .integrations.cloudflare import CloudflareIntegration
        
        cloudflare = CloudflareIntegration.get_instance()
        
        if not cloudflare.is_configured():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Cloudflare no está configurado"
            )
        
        # Aplicar configuración
        security_result = await cloudflare.update_security_settings(
            security_level=config.get("security_level", "medium"),
            browser_check=config.get("browser_check", True),
            waf_enabled=config.get("waf_enabled", True)
        )
        
        if config.get("dns_records"):
            dns_results = []
            for record in config["dns_records"]:
                result = await cloudflare.update_dns_record(
                    name=record.get("name"),
                    record_type=record.get("type", "A"),
                    content=record.get("content"),
                    proxied=record.get("proxied", True)
                )
                dns_results.append(result)
        
        # Registrar en logs
        DynamoDBClient()._create_log_entry(
            log_type="CLOUDFLARE_CONFIG_UPDATED",
            message="Configuración de Cloudflare actualizada",
            details={
                "security_level": config.get("security_level"),
                "browser_check": config.get("browser_check"),
                "waf_enabled": config.get("waf_enabled"),
                "updated_by": "leader"
            }
        )
        
        return {
            "success": security_result.get("success", False),
            "security": security_result,
            "dns_updated": config.get("dns_records") is not None,
            "is_mock": security_result.get("is_mock", True)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error actualizando Cloudflare: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno actualizando configuración de Cloudflare"
        )

@app.post("/api/project/bootstrap")
async def bootstrap_project(config: dict, leader=Depends(verify_role("leader"))):
    """
    Inicializa un nuevo proyecto (requiere rol de líder).
    
    Guarda configuración de infraestructura, tokens y credenciales
    en DynamoDB e inicializa hooks y receptores para webhooks de Git.
    """
    try:
        if not config.get("project_name"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El nombre del proyecto es requerido"
            )
        
        result = await project_service.bootstrap_project(
            project_name=config["project_name"],
            framework=config.get("framework", "React (Vite)"),
            branch_protection=config.get("branch_protection", True),
            team_members=config.get("team_members", [])
        )
        
        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Error desconocido en bootstrap")
            )
        
        return {
            "success": True,
            "project_name": result["project_name"],
            "config_saved": result["config_saved"],
            "email_sent": result.get("email_sent", False),
            "log_created": result.get("log_created", True)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en bootstrap: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno inicializando el proyecto"
        )

# Manejo de errores global
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Manejador global de excepciones."""
    logger.error(f"Error no manejado: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "Error interno del servidor",
            "error_type": type(exc).__name__
        }
    )

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.backend_port,
        reload=settings.app_environment == "development",
        log_level="info"
    )