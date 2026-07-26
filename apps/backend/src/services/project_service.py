from typing import Dict, List, Any, Optional
from datetime import datetime
import uuid
from ..models.planning import ProjectState, Epic, Story, Task, TaskStatus
from ..persistence.database import DynamoDBClient
from ..integrations.gemini import GeminiIntegration
from ..integrations.sendgrid import SendGridIntegration
from ..core.demo_data import DemoData


class ProjectService:
    """Servicio para gestión del estado del proyecto."""
    
    def __init__(self):
        self.db = DynamoDBClient()
        self.gemini = GeminiIntegration.get_instance()
        self.sendgrid = SendGridIntegration.get_instance()
    
    async def get_project_state(self, project_id: str = "default", demo_mode: bool = True) -> ProjectState:
        """Obtiene el estado completo del proyecto desde DynamoDB o demo."""
        try:
            if demo_mode:
                # Modo demo: usar datos preconfigurados
                demo_project = DemoData.get_demo_project(project_id)
                demo_metrics = DemoData.get_demo_metrics()
                
                return ProjectState(
                    epics=demo_project["epics"],
                    stories=demo_project["stories"],
                    tasks=demo_project["tasks"],
                    team_members=demo_project["team_members"],
                    pull_requests=demo_project["pull_requests"],
                    adrs=demo_project["adrs"],
                    metrics=demo_metrics,
                    last_updated=datetime.now().isoformat()
                )
            
            # Modo producción: consultar DynamoDB
            epics = self._query_entities("EPIC")
            
            # Consultar todas las historias
            stories = self._query_entities("STORY")
            
            # Consultar todas las tareas
            tasks = self._query_entities("TASK")
            
            # Consultar miembros del equipo
            team_members = self._query_entities("USER")
            
            # Consultar Pull Requests
            pull_requests = self._query_entities("PR")
            
            # Consultar ADRs
            adrs = self._query_entities("ADR")
            
            # Calcular métricas
            metrics = self._calculate_metrics(tasks)
            
            return ProjectState(
                epics=[Epic(**epic) for epic in epics],
                stories=[Story(**story) for story in stories],
                tasks=[Task(**task) for task in tasks],
                team_members=team_members,
                pull_requests=pull_requests,
                adrs=adrs,
                metrics=metrics,
                last_updated=datetime.now().isoformat()
            )
            
        except Exception as e:
            print(f"Error obteniendo estado del proyecto: {e}")
            # Fallback a modo demo en caso de error
            print("Fallback a modo demo...")
            return await self.get_project_state(project_id, demo_mode=True)
    
    async def create_planning(self, brief: str, stack: str = "React & Node") -> Dict[str, Any]:
        """Crea planificación a partir de un brief usando Gemini."""
        try:
            # Usar Gemini para descomponer el brief
            planning_response = await self.gemini.decompose_brief(brief, stack)
            
            # Guardar en DynamoDB usando transacción
            transact_items = []
            
            for epic in planning_response.epics:
                pk, sk = self.db.generate_pk_sk("EPIC", epic.id)
                item = {
                    "PK": pk,
                    "SK": sk,
                    "entity_type": "EPIC",
                    "entity_id": epic.id,
                    **epic.dict()
                }
                transact_items.append({
                    "Put": {
                        "TableName": self.db.dynamodb_table_name,
                        "Item": {k: {"S": str(v)} for k, v in item.items()}
                    }
                })
            
            for story in planning_response.stories:
                pk, sk = self.db.generate_pk_sk("STORY", story.id)
                gsi1_pk, gsi1_sk = self.db.generate_gsi_keys("EPIC", story.epic_id, story.id)
                
                item = {
                    "PK": pk,
                    "SK": sk,
                    "GSI1_PK": gsi1_pk,
                    "GSI1_SK": gsi1_sk,
                    "entity_type": "STORY",
                    "entity_id": story.id,
                    **story.dict()
                }
                transact_items.append({
                    "Put": {
                        "TableName": self.db.dynamodb_table_name,
                        "Item": {k: {"S": str(v)} for k, v in item.items()}
                    }
                })
            
            for task in planning_response.tasks:
                pk, sk = self.db.generate_pk_sk("TASK", task.id)
                gsi1_pk, gsi1_sk = self.db.generate_gsi_keys("EPIC", task.epic_id, task.id)
                gsi2_pk, gsi2_sk = self.db.generate_gsi_keys("STORY", task.story_id, task.id)
                
                item = {
                    "PK": pk,
                    "SK": sk,
                    "GSI1_PK": gsi1_pk,
                    "GSI1_SK": gsi1_sk,
                    "GSI2_PK": gsi2_pk,
                    "GSI2_SK": gsi2_sk,
                    "entity_type": "TASK",
                    "entity_id": task.id,
                    **task.dict()
                }
                transact_items.append({
                    "Put": {
                        "TableName": self.db.dynamodb_table_name,
                        "Item": {k: {"S": str(v)} for k, v in item.items()}
                    }
                })
            
            # Ejecutar transacción
            if transact_items:
                self.db.transact_write_items(transact_items)
            
            # Registrar en logs
            self._create_log_entry(
                log_type="PLANNING_CREATED",
                message=f"Planificación creada para brief: {brief[:100]}...",
                details={
                    "epics_count": len(planning_response.epics),
                    "stories_count": len(planning_response.stories),
                    "tasks_count": len(planning_response.tasks)
                }
            )
            
            return {
                "success": True,
                "planning": planning_response.dict(),
                "items_created": len(transact_items),
                "is_mock": planning_response.is_mock
            }
            
        except Exception as e:
            print(f"Error en create_planning: {e}")
            return {
                "success": False,
                "error": str(e),
                "is_mock": True
            }
    
    async def process_semantic_chat(
        self,
        message: str,
        history: List[Dict[str, str]],
        project_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Procesa chat semántico y propone acciones."""
        try:
            # Usar Gemini para procesar el mensaje
            chat_response = await self.gemini.semantic_memory_chat(
                message, history, project_context
            )
            
            # Si hay acción propuesta, procesarla
            if chat_response.proposed_action:
                action_result = await self._process_proposed_action(
                    chat_response.proposed_action
                )
                chat_response.response += f"\n\n**Acción procesada**: {action_result.get('message', '')}"
            
            # Registrar en logs
            self._create_log_entry(
                log_type="SEMANTIC_CHAT",
                message=f"Chat semántico procesado: {message[:100]}...",
                details={
                    "has_action": chat_response.proposed_action is not None,
                    "response_length": len(chat_response.response)
                }
            )
            
            return {
                "success": True,
                "response": chat_response.dict(),
                "is_mock": chat_response.is_mock
            }
            
        except Exception as e:
            print(f"Error en process_semantic_chat: {e}")
            return {
                "success": False,
                "error": str(e),
                "is_mock": True
            }
    
    async def analyze_pr_code(
        self,
        pr_title: str,
        pr_branch: str,
        code_changes: str,
        task_spec: Optional[str] = None
    ) -> Dict[str, Any]:
        """Analiza cambios de código de una PR."""
        try:
            # Usar Gemini para análisis de código
            analysis_result = await self.gemini.analyze_code_changes(
                pr_title, pr_branch, code_changes, task_spec
            )
            
            # Crear registro de PR
            pr_id = f"pr-{int(datetime.now().timestamp())}"
            pk, sk = self.db.generate_pk_sk("PR", pr_id)
            
            pr_item = {
                "PK": pk,
                "SK": sk,
                "entity_type": "PR",
                "entity_id": pr_id,
                "title": pr_title,
                "branch": pr_branch,
                "status": "under_review",
                "analysis_result": analysis_result,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            
            self.db.put_item(pr_item)
            
            # Registrar en logs
            self._create_log_entry(
                log_type="PR_ANALYZED",
                message=f"PR analizada: {pr_title}",
                details={
                    "pr_id": pr_id,
                    "decision": analysis_result.get("decision", "unknown"),
                    "compliance_score": analysis_result.get("compliance_score", 0)
                }
            )
            
            return {
                "success": analysis_result.get("success", False),
                "pr_id": pr_id,
                "analysis": analysis_result,
                "is_mock": analysis_result.get("is_mock", True)
            }
            
        except Exception as e:
            print(f"Error en analyze_pr_code: {e}")
            return {
                "success": False,
                "error": str(e),
                "is_mock": True
            }
    
    async def merge_pr(
        self,
        pr_id: str,
        merged_by: str,
        task_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Fusiona una Pull Request y actualiza estados."""
        try:
            # Obtener información de la PR
            pk, sk = self.db.generate_pk_sk("PR", pr_id)
            pr_item = self.db.get_item(pk, sk)
            
            if not pr_item:
                return {
                    "success": False,
                    "error": f"PR {pr_id} no encontrada"
                }
            
            # Actualizar estado de la PR
            pr_item["status"] = "merged"
            pr_item["merged_by"] = merged_by
            pr_item["merged_at"] = datetime.now().isoformat()
            pr_item["updated_at"] = datetime.now().isoformat()
            
            self.db.put_item(pr_item)
            
            # Actualizar tarea asociada si se proporciona
            task_updated = False
            if task_id:
                task_pk, task_sk = self.db.generate_pk_sk("TASK", task_id)
                task_item = self.db.get_item(task_pk, task_sk)
                
                if task_item:
                    task_item["status"] = "done"
                    task_item["completed_at"] = datetime.now().isoformat()
                    task_item["updated_at"] = datetime.now().isoformat()
                    
                    self.db.put_item(task_item)
                    task_updated = True
            
            # Enviar notificación por email
            email_sent = False
            if self.sendgrid.is_configured():
                # Obtener emails del equipo (en una implementación real, esto vendría de la BD)
                team_emails = ["team@example.com"]
                
                email_result = await self.sendgrid.send_pr_merged_notification(
                    pr_title=pr_item.get("title", "Unknown PR"),
                    pr_number=pr_id.replace("pr-", ""),
                    pr_url=f"https://github.com/example/repo/pull/{pr_id.replace('pr-', '')}",
                    merged_by=merged_by,
                    to_emails=team_emails
                )
                
                email_sent = email_result.get("success", False)
            
            # Registrar en logs
            self._create_log_entry(
                log_type="PR_MERGED",
                message=f"PR {pr_id} fusionada por {merged_by}",
                details={
                    "pr_id": pr_id,
                    "merged_by": merged_by,
                    "task_updated": task_updated,
                    "email_sent": email_sent
                }
            )
            
            return {
                "success": True,
                "pr_id": pr_id,
                "new_status": "merged",
                "task_updated": task_updated,
                "email_sent": email_sent,
                "log_created": True
            }
            
        except Exception as e:
            print(f"Error en merge_pr: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def bootstrap_project(
        self,
        project_name: str,
        framework: str,
        branch_protection: bool,
        team_members: List[str]
    ) -> Dict[str, Any]:
        """Inicializa un nuevo proyecto."""
        try:
            # Guardar configuración del proyecto
            config_id = "CONFIG"
            pk, sk = self.db.generate_pk_sk("PROJECT", config_id)
            
            config_item = {
                "PK": pk,
                "SK": sk,
                "entity_type": "PROJECT_CONFIG",
                "entity_id": config_id,
                "project_name": project_name,
                "framework": framework,
                "branch_protection": branch_protection,
                "team_members": team_members,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            
            self.db.put_item(config_item)
            
            # Enviar notificación por email
            email_sent = False
            if self.sendgrid.is_configured():
                # Convertir nombres de equipo a emails (en implementación real)
                team_emails = [f"{member.lower().replace(' ', '.')}@example.com" for member in team_members]
                
                email_result = await self.sendgrid.send_project_bootstrap_notification(
                    project_name=project_name,
                    project_url="https://github.com/example/project",
                    to_emails=team_emails,
                    created_by="PMOPilot System",
                    framework=framework
                )
                
                email_sent = email_result.get("success", False)
            
            # Registrar en logs
            self._create_log_entry(
                log_type="PROJECT_BOOTSTRAPPED",
                message=f"Proyecto {project_name} inicializado",
                details={
                    "project_name": project_name,
                    "framework": framework,
                    "branch_protection": branch_protection,
                    "team_size": len(team_members),
                    "email_sent": email_sent
                }
            )
            
            return {
                "success": True,
                "project_name": project_name,
                "config_saved": True,
                "email_sent": email_sent,
                "log_created": True
            }
            
        except Exception as e:
            print(f"Error en bootstrap_project: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def _query_entities(self, entity_type: str) -> List[Dict[str, Any]]:
        """Consulta entidades de un tipo específico."""
        try:
            items = self.db.query_items(
                key_condition_expression="PK = :pk",
                expression_attribute_values={":pk": f"{entity_type}#"},
                limit=100
            )
            
            # Filtrar por tipo de entidad y convertir a dict limpio
            entities = []
            for item in items:
                if item.get("entity_type") == entity_type:
                    # Convertir DynamoDB types a Python types
                    clean_item = {}
                    for key, value in item.items():
                        if isinstance(value, dict):
                            # DynamoDB almacena valores en dicts con tipo como clave
                            for v in value.values():
                                clean_item[key] = v
                        else:
                            clean_item[key] = value
                    entities.append(clean_item)
            
            return entities
            
        except Exception as e:
            print(f"Error consultando entidades {entity_type}: {e}")
            return []
    
    def _calculate_metrics(self, tasks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calcula métricas del proyecto basadas en tareas."""
        total_tasks = len(tasks)
        completed_tasks = len([t for t in tasks if t.get("status") == "done"])
        
        completion_rate = 0.0
        if total_tasks > 0:
            completion_rate = round(completed_tasks / total_tasks * 100, 2)
        
        # Calcular distribución por prioridad
        priority_dist = {
            "high": len([t for t in tasks if t.get("priority") == "high"]),
            "medium": len([t for t in tasks if t.get("priority") == "medium"]),
            "low": len([t for t in tasks if t.get("priority") == "low"])
        }
        
        return {
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "completion_rate": completion_rate,
            "priority_distribution": priority_dist,
            "in_progress_tasks": len([t for t in tasks if t.get("status") == "in_progress"]),
            "pending_tasks": len([t for t in tasks if t.get("status") == "todo"])
        }
    
    async def _process_proposed_action(self, action) -> Dict[str, Any]:
        """Procesa una acción propuesta por el asistente."""
        try:
            if action.type == "CREATE_TASK":
                return await self._create_task_from_action(action.data)
            elif action.type == "UPDATE_TASK_STATUS":
                return await self._update_task_status_from_action(action.data)
            elif action.type == "ADD_MEMBER":
                return await self._add_member_from_action(action.data)
            elif action.type == "BOOTSTRAP_PROJECT":
                return await self._bootstrap_from_action(action.data)
            else:
                return {
                    "success": False,
                    "message": f"Tipo de acción no soportado: {action.type}"
                }
                
        except Exception as e:
            print(f"Error procesando acción propuesta: {e}")
            return {
                "success": False,
                "message": f"Error procesando acción: {str(e)}"
            }
    
    async def _create_task_from_action(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Crea una tarea a partir de datos de acción."""
        try:
            task_id = f"task-{int(datetime.now().timestamp())}"
            pk, sk = self.db.generate_pk_sk("TASK", task_id)
            
            # Valores por defecto
            epic_id = data.get("epicId", "epic-general")
            story_id = data.get("storyId", "story-general")
            
            task_item = {
                "PK": pk,
                "SK": sk,
                "entity_type": "TASK",
                "entity_id": task_id,
                "title": data.get("title", "Nueva tarea"),
                "description": data.get("description", ""),
                "status": "todo",
                "priority": data.get("priority", "medium"),
                "epic_id": epic_id,
                "story_id": story_id,
                "assigned_to": data.get("assignedTo"),
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            
            self.db.put_item(task_item)
            
            return {
                "success": True,
                "message": f"Tarea '{data.get('title')}' creada exitosamente",
                "task_id": task_id
            }
            
        except Exception as e:
            return {
                "success": False,
                "message": f"Error creando tarea: {str(e)}"
            }
    
    async def _update_task_status_from_action(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Actualiza el estado de una tarea."""
        try:
            task_id = data.get("taskId")
            if not task_id:
                return {
                    "success": False,
                    "message": "Se requiere taskId"
                }
            
            pk, sk = self.db.generate_pk_sk("TASK", task_id)
            task_item = self.db.get_item(pk, sk)
            
            if not task_item:
                return {
                    "success": False,
                    "message": f"Tarea {task_id} no encontrada"
                }
            
            new_status = data.get("status", "todo")
            task_item["status"] = new_status
            task_item["updated_at"] = datetime.now().isoformat()
            
            if new_status == "done":
                task_item["completed_at"] = datetime.now().isoformat()
            
            self.db.put_item(task_item)
            
            return {
                "success": True,
                "message": f"Estado de tarea {task_id} actualizado a {new_status}"
            }
            
        except Exception as e:
            return {
                "success": False,
                "message": f"Error actualizando estado: {str(e)}"
            }
    
    async def _add_member_from_action(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Añade un miembro al equipo."""
        try:
            member_id = f"user-{int(datetime.now().timestamp())}"
            pk, sk = self.db.generate_pk_sk("USER", member_id)
            
            member_item = {
                "PK": pk,
                "SK": sk,
                "entity_type": "USER",
                "entity_id": member_id,
                "name": data.get("name", "Nuevo miembro"),
                "role": data.get("role", "developer"),
                "avatar": data.get("avatar", ""),
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            
            self.db.put_item(member_item)
            
            return {
                "success": True,
                "message": f"Miembro '{data.get('name')}' añadido al equipo",
                "member_id": member_id
            }
            
        except Exception as e:
            return {
                "success": False,
                "message": f"Error añadiendo miembro: {str(e)}"
            }
    
    async def _bootstrap_from_action(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Realiza bootstrap del proyecto."""
        try:
            result = await self.bootstrap_project(
                project_name=data.get("projectName", "Nuevo Proyecto"),
                framework=data.get("framework", "React (Vite)"),
                branch_protection=data.get("branchProtection", True),
                team_members=data.get("teamMembers", ["PMOPilot Admin"])
            )
            
            if result.get("success"):
                return {
                    "success": True,
                    "message": f"Proyecto '{data.get('projectName')}' inicializado exitosamente"
                }
            else:
                return {
                    "success": False,
                    "message": result.get("error", "Error desconocido")
                }
                
        except Exception as e:
            return {
                "success": False,
                "message": f"Error en bootstrap: {str(e)}"
            }
    
    def _create_log_entry(self, log_type: str, message: str, details: Dict[str, Any] = None):
        """Crea una entrada de log."""
        try:
            log_id = f"log-{int(datetime.now().timestamp())}"
            pk, sk = self.db.generate_pk_sk("LOG", log_id)
            
            log_item = {
                "PK": pk,
                "SK": sk,
                "entity_type": "LOG",
                "entity_id": log_id,
                "log_type": log_type,
                "message": message,
                "details": details or {},
                "timestamp": datetime.now().isoformat(),
                "created_at": datetime.now().isoformat()
            }
            
            self.db.put_item(log_item)
            
        except Exception as e:
            print(f"Error creando log entry: {e}")