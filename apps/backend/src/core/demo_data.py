"""
Datos demo para PMOPilot - Basados en el frontend existente.
Permite demo instantáneo sin necesidad de poblado manual.
"""
from datetime import datetime, timedelta
from ..models.planning import Epic, Story, Task, TaskStatus, TaskPriority


class DemoData:
    """Datos demo preconfigurados para demostración rápida."""
    
    @staticmethod
    def get_demo_project(project_id: str = "demo-ecommerce"):
        """Obtiene un proyecto demo completo."""
        # Fechas realistas
        now = datetime.now()
        week_ago = now - timedelta(days=7)
        two_days_ago = now - timedelta(days=2)
        
        # Épicas del proyecto demo (basadas en frontend)
        epics = [
            Epic(
                id="epic-auth",
                title="Autenticación y Gestión de Usuarios",
                description="Sistema completo de login, registro, perfiles y permisos con JWT y OAuth2.",
                status=TaskStatus.IN_PROGRESS,
                created_at=week_ago.isoformat(),
                updated_at=two_days_ago.isoformat()
            ),
            Epic(
                id="epic-dashboard",
                title="Panel de Control del Desarrollador",
                description="Dashboard interactivo con métricas en tiempo real, estado de CI/CD y actividad del equipo.",
                status=TaskStatus.IN_PROGRESS,
                created_at=week_ago.isoformat(),
                updated_at=now.isoformat()
            ),
            Epic(
                id="epic-payments",
                title="Sistema de Pagos y Facturación",
                description="Integración con Stripe/PayPal para suscripciones y facturación automática.",
                status=TaskStatus.TODO,
                created_at=week_ago.isoformat(),
                updated_at=week_ago.isoformat()
            ),
            Epic(
                id="epic-api",
                title="API Gateway y Microservicios",
                description="Arquitectura de microservicios con API Gateway, service discovery y load balancing.",
                status=TaskStatus.DONE,
                created_at=week_ago.isoformat(),
                updated_at=(now - timedelta(days=1)).isoformat(),
                completed_at=(now - timedelta(days=1)).isoformat()
            )
        ]
        
        # Historias de usuario
        stories = [
            Story(
                id="story-login",
                title="Como usuario, quiero iniciar sesión con email y contraseña",
                description="Login seguro con validación, captcha opcional y recuperación de contraseña.",
                epic_id="epic-auth",
                status=TaskStatus.DONE,
                created_at=week_ago.isoformat(),
                updated_at=(now - timedelta(days=3)).isoformat()
            ),
            Story(
                id="story-2fa",
                title="Como usuario, quiero autenticación de dos factores",
                description="2FA con Google Authenticator o SMS para mayor seguridad.",
                epic_id="epic-auth",
                status=TaskStatus.IN_PROGRESS,
                created_at=(now - timedelta(days=5)).isoformat(),
                updated_at=now.isoformat()
            ),
            Story(
                id="story-metrics",
                title="Como desarrollador, quiero ver métricas de rendimiento",
                description="Dashboard con gráficos de CPU, memoria, latencia y errores por servicio.",
                epic_id="epic-dashboard",
                status=TaskStatus.IN_PROGRESS,
                created_at=(now - timedelta(days=4)).isoformat(),
                updated_at=now.isoformat()
            ),
            Story(
                id="story-ci-status",
                title="Como líder técnico, quiero ver estado de CI/CD",
                description="Visualización de pipelines, tests y deployments por rama/entorno.",
                epic_id="epic-dashboard",
                status=TaskStatus.TODO,
                created_at=(now - timedelta(days=3)).isoformat(),
                updated_at=(now - timedelta(days=3)).isoformat()
            ),
            Story(
                id="story-stripe",
                title="Como negocio, quiero procesar pagos con Stripe",
                description="Integración completa con Stripe: cards, subscriptions, invoices, webhooks.",
                epic_id="epic-payments",
                status=TaskStatus.TODO,
                created_at=week_ago.isoformat(),
                updated_at=week_ago.isoformat()
            )
        ]
        
        # Tareas técnicas SDD
        tasks = [
            Task(
                id="task-auth-schema",
                title="Diseñar esquema DynamoDB para usuarios",
                description="Tabla de usuarios con: email (PK), password_hash, roles, metadata, timestamps. Índices para búsqueda por email y rol.",
                status=TaskStatus.DONE,
                priority=TaskPriority.HIGH,
                epic_id="epic-auth",
                story_id="story-login",
                assigned_to="Carlos (Backend Lead)",
                created_at=week_ago.isoformat(),
                updated_at=(now - timedelta(days=4)).isoformat(),
                completed_at=(now - timedelta(days=4)).isoformat()
            ),
            Task(
                id="task-jwt-implementation",
                title="Implementar middleware JWT en FastAPI",
                description="Middleware que valida tokens JWT, extrae user claims y maneja expiration/refresh. Incluir rate limiting.",
                status=TaskStatus.DONE,
                priority=TaskPriority.HIGH,
                epic_id="epic-auth",
                story_id="story-login",
                assigned_to="Ana (Security Engineer)",
                created_at=week_ago.isoformat(),
                updated_at=(now - timedelta(days=3)).isoformat(),
                completed_at=(now - timedelta(days=3)).isoformat()
            ),
            Task(
                id="task-2fa-backend",
                title="Backend para 2FA: generar/validar códigos TOTP",
                description="API endpoints: /api/2fa/setup (QR code), /api/2fa/verify. Usar pyotp library.",
                status=TaskStatus.IN_PROGRESS,
                priority=TaskPriority.MEDIUM,
                epic_id="epic-auth",
                story_id="story-2fa",
                assigned_to="Ana (Security Engineer)",
                created_at=(now - timedelta(days=2)).isoformat(),
                updated_at=now.isoformat()
            ),
            Task(
                id="task-dashboard-layout",
                title="Maquetar dashboard principal con Tailwind CSS",
                description="Grid responsive: sidebar nav, header con user menu, cards para métricas, tabla de actividades recientes.",
                status=TaskStatus.IN_PROGRESS,
                priority=TaskPriority.MEDIUM,
                epic_id="epic-dashboard",
                story_id="story-metrics",
                assigned_to="María (Frontend Dev)",
                created_at=(now - timedelta(days=3)).isoformat(),
                updated_at=now.isoformat()
            ),
            Task(
                id="task-metrics-api",
                title="API para métricas: CPU, memoria, requests/seg",
                description="Endpoint /api/metrics que agrega datos de CloudWatch/Prometheus y retorna JSON para gráficos.",
                status=TaskStatus.TODO,
                priority=TaskPriority.HIGH,
                epic_id="epic-dashboard",
                story_id="story-metrics",
                assigned_to="Carlos (Backend Lead)",
                created_at=(now - timedelta(days=2)).isoformat(),
                updated_at=(now - timedelta(days=2)).isoformat()
            ),
            Task(
                id="task-stripe-webhooks",
                title="Configurar webhooks de Stripe y handlers",
                description="Handlers para: payment_intent.succeeded, invoice.paid, customer.subscription.updated. Verificar firma Stripe-Signature.",
                status=TaskStatus.TODO,
                priority=TaskPriority.MEDIUM,
                epic_id="epic-payments",
                story_id="story-stripe",
                assigned_to="Pedro (Payments Specialist)",
                created_at=week_ago.isoformat(),
                updated_at=week_ago.isoformat()
            ),
            Task(
                id="task-api-gateway",
                title="Implementar API Gateway con rate limiting",
                description="FastAPI app que routea a microservicios. Middleware para rate limiting por IP/user. Logging structured.",
                status=TaskStatus.DONE,
                priority=TaskPriority.HIGH,
                epic_id="epic-api",
                story_id=None,  # Tarea directa de épica
                assigned_to="Carlos (Backend Lead)",
                created_at=week_ago.isoformat(),
                updated_at=(now - timedelta(days=2)).isoformat(),
                completed_at=(now - timedelta(days=2)).isoformat()
            )
        ]
        
        # Miembros del equipo demo
        team_members = [
            {
                "id": "user-carlos",
                "name": "Carlos Rodríguez",
                "email": "carlos@pmopilot.dev",
                "role": "Backend Lead & Architecture",
                "avatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
                "joined_at": (now - timedelta(days=30)).isoformat()
            },
            {
                "id": "user-ana",
                "name": "Ana Martínez",
                "email": "ana@pmopilot.dev",
                "role": "Security Engineer",
                "avatar": "https://images.unsplash.com/photo-1494790108755-2616b786d4d1?w=150&auto=format&fit=crop&q=80",
                "joined_at": (now - timedelta(days=25)).isoformat()
            },
            {
                "id": "user-maria",
                "name": "María González",
                "email": "maria@pmopilot.dev",
                "role": "Frontend Developer",
                "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
                "joined_at": (now - timedelta(days=20)).isoformat()
            },
            {
                "id": "user-pedro",
                "name": "Pedro Sánchez",
                "email": "pedro@pmopilot.dev",
                "role": "Payments & Integrations",
                "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
                "joined_at": (now - timedelta(days=15)).isoformat()
            }
        ]
        
        # Pull requests demo activas
        pull_requests = [
            {
                "id": "pr-42",
                "title": "feat: Add 2FA backend implementation",
                "number": 42,
                "branch": "feature/2fa-backend",
                "status": "under_review",
                "author": "Ana Martínez",
                "created_at": (now - timedelta(hours=6)).isoformat(),
                "url": "https://github.com/pmopilot-demo/ecommerce-suite/pull/42",
                "checks": [
                    {"name": "Build", "status": "success", "duration": "1m 23s"},
                    {"name": "Tests", "status": "success", "duration": "2m 45s"},
                    {"name": "Lint", "status": "success", "duration": "45s"}
                ]
            },
            {
                "id": "pr-41",
                "title": "fix: Dashboard responsive layout on mobile",
                "number": 41,
                "branch": "fix/dashboard-mobile",
                "status": "merged",
                "author": "María González",
                "created_at": (now - timedelta(days=1)).isoformat(),
                "merged_at": (now - timedelta(hours=3)).isoformat(),
                "url": "https://github.com/pmopilot-demo/ecommerce-suite/pull/41",
                "checks": [
                    {"name": "Build", "status": "success", "duration": "1m 15s"},
                    {"name": "Tests", "status": "success", "duration": "2m 30s"}
                ]
            }
        ]
        
        # ADRs (Architectural Decision Records)
        adrs = [
            {
                "id": "adr-001",
                "title": "Use Amazon DynamoDB as primary datastore",
                "status": "accepted",
                "decision": "We chose DynamoDB over PostgreSQL for its serverless nature, automatic scaling, and native AWS integration.",
                "context": "Need a database that scales automatically with usage and integrates seamlessly with AWS Lambda.",
                "consequences": "Simpler scalability, no connection pooling needed, but more complex query patterns.",
                "created_by": "Carlos Rodríguez",
                "created_at": (now - timedelta(days=10)).isoformat()
            },
            {
                "id": "adr-002",
                "title": "Implement JWT for authentication instead of sessions",
                "status": "accepted",
                "decision": "Use stateless JWT tokens for API authentication to enable horizontal scaling.",
                "context": "Microservices architecture requires stateless authentication mechanism.",
                "consequences": "No server-side session storage, tokens must be short-lived with refresh mechanism.",
                "created_by": "Ana Martínez",
                "created_at": (now - timedelta(days=8)).isoformat()
            },
            {
                "id": "adr-003",
                "title": "Use Spec-Driven Development (SDD) methodology",
                "status": "accepted",
                "decision": "All features must be fully specified before implementation begins.",
                "context": "Need to reduce bugs and improve collaboration between humans and AI coding assistants.",
                "consequences": "Longer planning phase but faster, higher-quality implementation.",
                "created_by": "Carlos Rodríguez",
                "created_at": (now - timedelta(days=5)).isoformat()
            }
        ]
        
        return {
            "project_id": project_id,
            "name": "E-Commerce Suite Demo",
            "description": "Proyecto demo completo para PMOPilot - Sistema de e-commerce con microservicios",
            "demo_mode": True,
            "created_at": week_ago.isoformat(),
            "updated_at": now.isoformat(),
            "epics": epics,
            "stories": stories,
            "tasks": tasks,
            "team_members": team_members,
            "pull_requests": pull_requests,
            "adrs": adrs,
            "github_repo": "https://github.com/pmopilot-demo/ecommerce-suite",
            "readonly": True  # Modo demo no modifica repos reales
        }
    
    @staticmethod
    def get_demo_metrics():
        """Métricas demo realistas."""
        now = datetime.now()
        
        return {
            "total_tasks": 7,
            "completed_tasks": 3,
            "completion_rate": 42.86,
            "priority_distribution": {
                "high": 3,
                "medium": 3,
                "low": 1
            },
            "in_progress_tasks": 2,
            "pending_tasks": 2,
            "avg_cycle_time": "2.5 days",
            "bug_count": 2,
            "pr_merged_this_week": 3,
            "team_velocity": "8 story points/week",
            "last_updated": now.isoformat()
        }
    
    @staticmethod
    def get_demo_project_context():
        """Contexto completo para Semantic Memory Agent."""
        project = DemoData.get_demo_project()
        metrics = DemoData.get_demo_metrics()
        
        return {
            "project": {
                "name": project["name"],
                "description": project["description"],
                "demo_mode": project["demo_mode"],
                "github_repo": project["github_repo"]
            },
            "stats": {
                "team_size": len(project["team_members"]),
                "active_prs": len([pr for pr in project["pull_requests"] if pr["status"] == "under_review"]),
                "open_tasks": metrics["pending_tasks"] + metrics["in_progress_tasks"]
            },
            "recent_activity": [
                {
                    "type": "pr_merged",
                    "message": "PR #41 merged: Dashboard mobile fixes",
                    "author": "María González",
                    "timestamp": (datetime.now() - timedelta(hours=3)).isoformat()
                },
                {
                    "type": "task_completed",
                    "message": "Task completed: API Gateway implementation",
                    "author": "Carlos Rodríguez",
                    "timestamp": (datetime.now() - timedelta(days=2)).isoformat()
                },
                {
                    "type": "adr_created",
                    "message": "ADR-003 created: SDD methodology adoption",
                    "author": "Carlos Rodríguez",
                    "timestamp": (datetime.now() - timedelta(days=5)).isoformat()
                }
            ],
            "active_discussions": [
                {
                    "topic": "2FA implementation approach",
                    "participants": ["Ana Martínez", "Carlos Rodríguez"],
                    "last_updated": (datetime.now() - timedelta(hours=2)).isoformat()
                },
                {
                    "topic": "Stripe vs PayPal for payments",
                    "participants": ["Pedro Sánchez", "Ana Martínez"],
                    "last_updated": (datetime.now() - timedelta(days=1)).isoformat()
                }
            ]
        }