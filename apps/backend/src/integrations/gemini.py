import json
from typing import Dict, List, Any, Optional
from ..core.config import settings
from ..models.planning import Epic, Story, Task, PlanningResponse
from ..models.semantic_memory import SemanticMemoryResponse, ProposedAction
from google import genai
from google.genai import types

class GeminiIntegration:
    """Integración con Google Gemini API."""

    _instance = None
    
    def __init__(self):
        """Inicializa el cliente de Gemini."""
        if not settings.gemini_configured:
            self.client = None
            self.model  = None
            print("⚠️ Gemini no configurado. Usando modo mock.")
            return
        
        try:
            client = genai.Client(api_key=settings.gemini_api_key)
            self.client = client
            # model_name is the string identifier of the Gemini model to use
            self.model_name = settings.gemini_model
            self.model = client  # keep client object for API calls
            print(f"✓ Gemini configurado con modelo: {self.model_name}")
        except Exception as e:
            print(f"✗ Error configurando Gemini: {e}")
            self.client = None
            self.model = None
    
    @classmethod
    def get_instance(cls):
        """Obtiene la instancia singleton de la integración."""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
    
    def is_configured(self) -> bool:
        """Verifica si Gemini está configurado."""
        return self.model is not None and settings.gemini_configured
    
    async def decompose_brief(
        self, 
        brief: str, 
        stack: str = "React & Node"
    ) -> PlanningResponse:
        """Descompone un brief en épicas, historias y tareas usando Gemini."""
        
        if not self.is_configured():
            # Modo mock para desarrollo
            return self._generate_mock_planning(brief, stack)
        
        try:
            prompt = f"""Actúa como un Arquitecto de Software Principal y Semantic PMO de PMOPilot.
Analiza la siguiente especificación de producto para un proyecto utilizando el stack "{stack}":
"{brief}"

Decompón este requerimiento de forma profesional utilizando la metodología Spec-Driven Development (SDD).
Genera exactamente:
1. De 2 a 3 Épicas (Epics) principales.
2. De 2 a 3 Historias de Usuario (Stories) asignadas a esas Épicas.
3. De 4 a 6 Tareas (Tasks) de desarrollo detalladas con prioridades y descripciones orientadas a herramientas de generación de código (como Claude/Cursor). Cada tarea debe pertenecer a una historia y a una épica.

Formato de respuesta JSON requerido:"""
            
            # Use the client to generate content with the configured model
            response = self.client.generate_content(
                model=self.model_name,
                prompt=prompt,
                generation_config={
                    "temperature": 0.2,
                    "response_mime_type": "application/json",
                }
            )
            
            # Parsear la respuesta JSON
            response_text = response.text.strip()
            
            # Limpiar la respuesta si tiene markdown
            if response_text.startswith("```json"):
                response_text = response_text[7:-3].strip()
            elif response_text.startswith("```"):
                response_text = response_text[3:-3].strip()
            
            data = json.loads(response_text)
            
            # Convertir a modelos Pydantic
            epics = [Epic(**epic) for epic in data.get("epics", [])]
            stories = [Story(**story) for story in data.get("stories", [])]
            tasks = [Task(**task) for task in data.get("tasks", [])]
            
            return PlanningResponse(
                epics=epics,
                stories=stories,
                tasks=tasks,
                is_mock=False
            )
            
        except Exception as e:
            print(f"Error en decompose_brief: {e}")
            # Fallback a modo mock
            return self._generate_mock_planning(brief, stack)
    
    async def semantic_memory_chat(
        self,
        message: str,
        history: List[Dict[str, str]],
        project_context: Dict[str, Any]
    ) -> SemanticMemoryResponse:
        """Procesa mensajes de chat con memoria semántica y propone acciones."""
        
        if not self.is_configured():
            # Modo mock para desarrollo
            return self._generate_mock_semantic_memory(message, history, project_context)
        
        try:
            # Formatear historial
            formatted_history = []
            for msg in history:
                role = "user" if msg.get("sender") == "user" else "model"
                formatted_history.append({
                    "role": role,
                    "parts": [{"text": msg.get("text", "")}]
                })
            
            system_instruction = f"""Eres PMOPilot Assistant, la Semantic PMO inteligente de este equipo de desarrollo.
Tu rol es actuar como el copiloto de gestión, orquestación, arquitectura y memoria técnica para un equipo que usa Spec-Driven Development (SDD).

REGLAS DE DOMINIO:
1. Tu conocimiento y dominio está estrictamente limitado a la ingeniería de software, arquitectura de sistemas (ADRs), especificaciones de producto, planificación de tareas, calidad de código y control ágil (Kanban).
2. Si el usuario realiza una consulta ajena a este dominio (como recetas de cocina, horóscopos, preguntas de entretenimiento, etc.), debes responder educadamente explicando la restricción de dominio de la PMO Semántica, y configurar "proposedAction": null.

CAPACIDAD AGÉNTICA / ACCIONES SEMÁNTICAS:
Eres capaz de entender las intenciones naturales del usuario y proponer acciones reales sobre el estado del proyecto. Debes analizar el mensaje del usuario y, si solicita realizar una acción, generar la acción estructurada correspondiente.

Acciones que puedes proponer (proposedAction):
- "CREATE_TASK": Si el usuario pide crear, añadir, o registrar una tarea.
  Estructura data: {{ "title": "Título corto y claro", "description": "Especificación SDD con criterios de aceptación", "priority": "low" | "medium" | "high", "assignedTo": "Nombre de miembro o vacio" }}
- "ADD_MEMBER": Si pide añadir un desarrollador o miembro de equipo.
  Estructura data: {{ "name": "Nombre completo", "role": "Rol técnico", "avatar": "URL de foto genérica o vacía" }}
- "UPDATE_TASK_STATUS": Si pide cambiar de estado o mover una tarea (ej: task-1).
  Estructura data: {{ "taskId": "task-x", "status": "todo" | "in_progress" | "done" }}
- "BOOTSTRAP_PROJECT": Si pide inicializar un nuevo proyecto o hacer bootstrap.
  Estructura data: {{ "projectName": "Nombre del proyecto", "framework": "React (Vite)" o similar, "branchProtection": true, "teamMembers": ["Lista de nombres"] }}

Si el mensaje del usuario es una simple consulta teórica, explicativa o de preguntas frecuentes (FAQ) sobre el proyecto, ADRs o SDD, responde normalmente en "response" y pon "proposedAction": null.

ESTADO ACTUAL DEL PROYECTO (Usa esto para responder de forma precisa):
{json.dumps(project_context, indent=2)}

FORMATO DE RESPUESTA:
Debes responder ÚNICAMENTE con un objeto JSON válido que cumpla con este formato exacto:
{{
  "response": "Tu explicación o respuesta amigable en markdown para el desarrollador, describiendo qué hiciste o respondiendo su pregunta.",
  "proposedAction": null o {{ "type": "CREATE_TASK" | "ADD_MEMBER" | "UPDATE_TASK_STATUS" | "BOOTSTRAP_PROJECT", "data": {{ ... }} }}
}}

No incluyas markdown adicional (como ```json) fuera del JSON propiamente. Asegúrate de retornar un JSON perfectamente formateado."""
            
            # Crear mensaje con instrucción del sistema
            
            # Start a chat session using the client and model name
            chat = self.client.start_chat(model=self.model_name, history=formatted_history)

            response = chat.send_message(
                message,
                generation_config={
                    "temperature": 0.2,
                    "response_mime_type": "application/json",
                },
                system_instruction=system_instruction
            )
            
            # Parsear la respuesta JSON
            response_text = response.text.strip()
            
            # Limpiar la respuesta si tiene markdown
            if response_text.startswith("```json"):
                response_text = response_text[7:-3].strip()
            elif response_text.startswith("```"):
                response_text = response_text[3:-3].strip()
            
            data = json.loads(response_text)
            
            # Convertir a modelo Pydantic
            proposed_action = None
            if data.get("proposedAction"):
                action_data = data["proposedAction"]
                if isinstance(action_data, dict) and "type" in action_data:
                    proposed_action = ProposedAction(**action_data)
            
            return SemanticMemoryResponse(
                response=data.get("response", ""),
                proposed_action=proposed_action,
                is_mock=False
            )
            
        except Exception as e:
            print(f"Error en semantic_memory_chat: {e}")
            # Fallback a modo mock
            return self._generate_mock_semantic_memory(message, history, project_context)
    
    async def analyze_code_changes(
        self,
        pr_title: str,
        pr_branch: str,
        code_changes: str,
        task_spec: Optional[str] = None
    ) -> Dict[str, Any]:
        """Analiza cambios de código para revisión de PR."""
        
        if not self.is_configured():
            # Modo mock para desarrollo
            return self._generate_mock_code_analysis(pr_title, pr_branch, code_changes, task_spec)
        
        try:
            prompt = f"""Actúa como el PR Arbiter de PMOPilot. Tu tarea es arbitrar una Pull Request y verificar si cumple estrictamente con la especificación de desarrollo (SDD) definida para la tarea.

INFORMACIÓN DE LA PR:
- Título: "{pr_title}"
- Rama de Origen: "{pr_branch}"
- Cambios de Código en Revisión:
```typescript
{code_changes}
```

ESPECIFICACIÓN ORIGINAL DE LA TAREA (SDD):
"{task_spec or 'No especificado explícitamente'}"

Genera una revisión de PR exhaustiva en Markdown que contenga:
1. Una decisión de fusión (Aprobado, Aprobado provisionalmente o Rechazado).
2. Un análisis comparativo detallado: ¿El código implementa todo lo definido en la especificación de la tarea? ¿Hay desviaciones?
3. Análisis de mejores prácticas de codificación (modularidad, Tailwind CSS, etc.).
4. Lista ordenada de correcciones sugeridas.

Sé directo, constructivo y con tono de Arquitecto Líder.

Responde en formato JSON con los siguientes campos:
- "review": "Contenido markdown de la revisión"
- "decision": "approved" | "provisionally_approved" | "rejected"
- "suggestions": ["lista de sugerencias"]
- "compliance_score": 0-100"""
            
            response = self.model.client.models.generate_content(
                prompt,
                generation_config={
                    "temperature": 0.1,
                    "response_mime_type": "application/json",
                }
            )
            
            # Parsear la respuesta JSON
            response_text = response.text.strip()
            
            # Limpiar la respuesta si tiene markdown
            if response_text.startswith("```json"):
                response_text = response_text[7:-3].strip()
            elif response_text.startswith("```"):
                response_text = response_text[3:-3].strip()
            
            data = json.loads(response_text)
            
            return {
                "success": True,
                "review": data.get("review", ""),
                "decision": data.get("decision", "provisionally_approved"),
                "suggestions": data.get("suggestions", []),
                "compliance_score": data.get("compliance_score", 80),
                "is_mock": False
            }
            
        except Exception as e:
            print(f"Error en analyze_code_changes: {e}")
            # Fallback a modo mock
            return self._generate_mock_code_analysis(pr_title, pr_branch, code_changes, task_spec)
    
    def _generate_mock_planning(self, brief: str, stack: str) -> PlanningResponse:
        """Genera datos mock para planificación."""
        from datetime import datetime
        
        # Crear IDs únicos
        timestamp = int(datetime.now().timestamp())
        
        epics = [
            Epic(
                id=f"epic-{timestamp}-1",
                title="Autenticación y Perfiles",
                description="Implementar un sistema seguro de login, registro y CODEOWNERS.",
                status="todo",
                created_at=datetime.now().isoformat()
            ),
            Epic(
                id=f"epic-{timestamp}-2",
                title="Panel del Desarrollador (Dashboard)",
                description="Crear el centro de control interactivo para ver ramas y PRs.",
                status="todo",
                created_at=datetime.now().isoformat()
            )
        ]
        
        stories = [
            Story(
                id=f"story-{timestamp}-1",
                title="Como usuario, quiero iniciar sesión con email y contraseña",
                description="Sistema de autenticación básico con validación de credenciales",
                epic_id=epics[0].id,
                status="todo",
                created_at=datetime.now().isoformat()
            ),
            Story(
                id=f"story-{timestamp}-2",
                title="Como desarrollador, quiero ver el estado de compilación de las ramas",
                description="Dashboard con métricas de CI/CD y estado de builds",
                epic_id=epics[1].id,
                status="todo",
                created_at=datetime.now().isoformat()
            )
        ]
        
        tasks = [
            Task(
                id=f"task-{timestamp}-1",
                title="Diseñar esquema de base de datos de usuarios",
                description="Crear tabla de usuarios con contraseñas cifradas con bcrypt.",
                status="todo",
                priority="high",
                epic_id=epics[0].id,
                story_id=stories[0].id,
                created_at=datetime.now().isoformat()
            ),
            Task(
                id=f"task-{timestamp}-2",
                title="Implementar API de login en el backend",
                description="Crear ruta POST /api/login que emita un token JWT firmado.",
                status="todo",
                priority="high",
                epic_id=epics[0].id,
                story_id=stories[0].id,
                created_at=datetime.now().isoformat()
            ),
            Task(
                id=f"task-{timestamp}-3",
                title="Maquetar la vista principal del Dashboard con Tailwind",
                description="Diseñar la grilla de métricas con un esquema de color claro y tipografía legible.",
                status="todo",
                priority="medium",
                epic_id=epics[1].id,
                story_id=stories[1].id,
                created_at=datetime.now().isoformat()
            )
        ]
        
        return PlanningResponse(
            epics=epics,
            stories=stories,
            tasks=tasks,
            is_mock=True
        )
    
    def _generate_mock_semantic_memory(
        self,
        message: str,
        history: List[Dict[str, str]],
        project_context: Dict[str, Any]
    ) -> SemanticMemoryResponse:
        """Genera datos mock para memoria semántica."""
        import re
        
        lower_msg = message.lower().strip()
        
        # 1. Verificar dominio restringido
        out_of_domain_keywords = [
            "sopa", "receta", "cocina", "comida", "onion", "soup", "onion soup", 
            "chiste", "joke", "clima", "weather", "fútbol", "futbol", "soccer", 
            "horóscopo", "horoscope", "amor", "love", "viaje", "travel"
        ]
        
        if any(keyword in lower_msg for keyword in out_of_domain_keywords):
            return SemanticMemoryResponse(
                response="⚠️ **Dominio Restringido**: Como PMO Semántica (PMOPilot), mi conocimiento y funciones están estrictamente limitados a la orquestación de tu proyecto, arquitectura (ADRs), especificaciones bajo la metodología Spec-Driven Development (SDD) y control de calidad. No puedo asistirte con consultas externas o recreativas.",
                proposed_action=None,
                is_mock=True
            )
        
        # 2. Procesar acciones semánticas
        proposed_action = None
        response = ""
        
        if "crear tarea" in lower_msg or "añadir tarea" in lower_msg or "agregar tarea" in lower_msg:
            # Extraer título de la tarea
            task_title = "Optimización técnica y refactor SDD"
            if "para" in lower_msg:
                match = re.search(r'para\s+(.+?)(?:$|\.|\?)', lower_msg)
                if match:
                    task_title = match.group(1).strip().capitalize()
            elif "tarea" in lower_msg:
                match = re.search(r'tarea\s+(.+?)(?:$|\.|\?)', lower_msg)
                if match:
                    task_title = match.group(1).strip().capitalize()
            
            response = f"¡Entendido! He interpretado tu intención semántica como la creación de una nueva tarea en el backlog técnico del proyecto. He extraído las especificaciones preliminares bajo la metodología SDD."
            
            proposed_action = ProposedAction(
                type="CREATE_TASK",
                data={
                    "title": task_title,
                    "description": "Especificación SDD preliminar generada por el asistente: Validar la entrada y verificar cumplimiento de criterios de aceptación de QA.",
                    "priority": "high" if "alta" in lower_msg or "urgente" in lower_msg else "medium",
                    "assignedTo": "Ana (Frontend Dev)"
                }
            )
        
        elif "agregar desarrollador" in lower_msg or "añadir desarrollador" in lower_msg:
            # Extraer nombre del desarrollador
            member_name = "Pedro Sánchez"
            match = re.search(r'(?:desarrollador|miembro)\s+(.+?)(?:$|\.|\?)', lower_msg)
            if match:
                member_name = match.group(1).strip().title()
            
            response = f"He identificado que deseas expandir tu equipo de desarrollo de SDD. Propongo la incorporación de un nuevo desarrollador sénior a la gobernanza del proyecto."
            
            proposed_action = ProposedAction(
                type="ADD_MEMBER",
                data={
                    "name": member_name,
                    "role": "Backend & Integraciones",
                    "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
                }
            )
        
        elif "mover tarea" in lower_msg or "completar tarea" in lower_msg:
            # Extraer ID de tarea y estado
            task_id = "task-1"
            status = "done"
            
            id_match = re.search(r'task-(\d+)', lower_msg)
            if id_match:
                task_id = f"task-{id_match.group(1)}"
            
            if "por hacer" in lower_msg or "todo" in lower_msg:
                status = "todo"
            elif "en curso" in lower_msg or "progreso" in lower_msg:
                status = "in_progress"
            
            response = f"He entendido tu instrucción semántica para reubicar la tarea en el flujo Kanban. He programado la transición de estado correspondiente."
            
            proposed_action = ProposedAction(
                type="UPDATE_TASK_STATUS",
                data={
                    "taskId": task_id,
                    "status": status
                }
            )
        
        elif "bootstrap" in lower_msg or "crear proyecto" in lower_msg:
            # Extraer nombre del proyecto
            project_name = "E-Commerce Suite"
            match = re.search(r'proyecto\s+(.+?)(?:$|\.|\?)', lower_msg)
            if match:
                project_name = match.group(1).strip().title()
            
            response = f"Entendido. He interpretado la intención de inicializar una estructura limpia de microservicios con gobernanza y control de PRs automático para el nuevo proyecto."
            
            proposed_action = ProposedAction(
                type="BOOTSTRAP_PROJECT",
                data={
                    "projectName": project_name,
                    "framework": "React (Vite)",
                    "branchProtection": True,
                    "teamMembers": ["Carlos (Lead Dev)", "Ana (Frontend Dev)", "PMOPilot Arbiter"]
                }
            )
        
        elif "dynamodb" in lower_msg or "base de datos" in lower_msg:
            response = "De acuerdo a la memoria técnica del proyecto (ADR-001), elegimos la persistencia en Amazon DynamoDB para contar con un desarrollo nativo en AWS desde el día uno. Tomamos esta decisión para mantener un único dominio de persistencia, eliminar múltiples puertos y evitar puntos de falla por bases de datos duales al cruzar datos entre el frontend y el backend."
        
        elif "sdd" in lower_msg or "metodologia" in lower_msg:
            response = "El Spec-Driven Development (SDD) es la metodología central de PMOPilot. Consiste en definir de manera exacta y sin ambigüedades los requerimientos ('What') antes de escribir cualquier línea de código, permitiendo que agentes autónomos de programación (Cursor, Claude Code, Copilot) codifiquen de forma óptima con un 98% menos de bugs."
        
        else:
            response = "¡Hola! He recibido tu consulta en la PMO Semántica. Puedes pedirme acciones específicas como 'Crea una tarea para optimizar la base de datos', 'Agrega un desarrollador llamado Marcos', 'Mueve la tarea task-1 a completada' o consultarme sobre decisiones de arquitectura tomadas en los registros ADR."
        
        return SemanticMemoryResponse(
            response=response,
            proposed_action=proposed_action,
            is_mock=True
        )
    
    def _generate_mock_code_analysis(
        self,
        pr_title: str,
        pr_branch: str,
        code_changes: str,
        task_spec: Optional[str] = None
    ) -> Dict[str, Any]:
        """Genera análisis de código mock."""
        mock_review = f"""### 🤖 PMOPilot PR Arbiter Review

**Resultado**: ✅ COMPLIANT (Aprobado provisionalmente)

#### Análisis de Spec-Driven Development (SDD):
- **Alineación con Tarea**: Se detecta que los cambios implementan correctamente los campos de entrada de login requeridos en la especificación.
- **Calidad de Código**: El componente es modular y respeta las clases de Tailwind CSS sin duplicados.
- **Sugerencias de Mejora**:
  - Podrías agregar una prueba unitaria específica para validar formatos de email incorrectos (ej. \`invalid-email@\`).
  - Asegurar que el loader visual deshabilite el botón durante llamadas asíncronas para evitar clics duplicados.

**Métricas**:
- Pruebas Unitarias: 🟢 4/4 pasadas
- Compilación: 🟢 Exitosa (0 warnings)
- Cobertura de Código: 📊 92.5%"""
        
        return {
            "success": True,
            "review": mock_review,
            "decision": "provisionally_approved",
            "suggestions": [
                "Agregar prueba unitaria para validar formatos de email incorrectos",
                "Asegurar que el loader visual deshabilite el botón durante llamadas asíncronas"
            ],
            "compliance_score": 92,
            "is_mock": True
        }
