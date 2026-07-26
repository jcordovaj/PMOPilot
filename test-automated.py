#!/usr/bin/env python3
"""
Script de pruebas automáticas para PMOPilot.
Ejecuta un flujo completo de pruebas end-to-end.
"""
import asyncio
import aiohttp
import json
import time
import sys
from datetime import datetime

# Configuración
BASE_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:3000"
TIMEOUT = 30

class PMOPilotTester:
    def __init__(self):
        self.session = None
        self.results = []
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def log_result(self, test_name, success, message="", data=None):
        """Registra resultado de prueba."""
        result = {
            "test": test_name,
            "success": success,
            "timestamp": datetime.now().isoformat(),
            "message": message,
            "data": data
        }
        self.results.append(result)
        
        icon = "✅" if success else "❌"
        print(f"{icon} {test_name}: {message}")
        return success
    
    async def test_health_check(self):
        """Prueba endpoint de health check."""
        try:
            async with self.session.get(f"{BASE_URL}/api/health", timeout=TIMEOUT) as response:
                if response.status == 200:
                    data = await response.json()
                    return self.log_result(
                        "Health Check",
                        True,
                        f"Status: {data.get('status', 'unknown')}",
                        data
                    )
                else:
                    return self.log_result(
                        "Health Check",
                        False,
                        f"Status code: {response.status}"
                    )
        except Exception as e:
            return self.log_result(
                "Health Check",
                False,
                f"Error: {str(e)}"
            )
    
    async def test_project_state_demo(self):
        """Prueba estado del proyecto en modo demo."""
        try:
            async with self.session.get(
                f"{BASE_URL}/api/project/state?demo=true", 
                timeout=TIMEOUT
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    # Verificar estructura básica
                    required_keys = ["epics", "stories", "tasks", "team_members", "metrics"]
                    missing_keys = [key for key in required_keys if key not in data]
                    
                    if missing_keys:
                        return self.log_result(
                            "Project State (Demo)",
                            False,
                            f"Faltan keys: {missing_keys}"
                        )
                    
                    # Verificar que hay datos demo
                    epics_count = len(data.get("epics", []))
                    tasks_count = len(data.get("tasks", []))
                    
                    return self.log_result(
                        "Project State (Demo)",
                        True,
                        f"Datos demo: {epics_count} épicas, {tasks_count} tareas",
                        {"epics": epics_count, "tasks": tasks_count}
                    )
                else:
                    return self.log_result(
                        "Project State (Demo)",
                        False,
                        f"Status code: {response.status}"
                    )
        except Exception as e:
            return self.log_result(
                "Project State (Demo)",
                False,
                f"Error: {str(e)}"
            )
    
    async def test_project_state_production(self):
        """Prueba estado del proyecto en modo producción."""
        try:
            async with self.session.get(
                f"{BASE_URL}/api/project/state?demo=false", 
                timeout=TIMEOUT
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    # En producción, puede estar vacío pero la estructura debe ser válida
                    if not isinstance(data, dict):
                        return self.log_result(
                            "Project State (Production)",
                            False,
                            "Respuesta no es JSON válido"
                        )
                    
                    return self.log_result(
                        "Project State (Production)",
                        True,
                        "Estructura de respuesta válida",
                        {"keys": list(data.keys())}
                    )
                else:
                    return self.log_result(
                        "Project State (Production)",
                        False,
                        f"Status code: {response.status}"
                    )
        except Exception as e:
            return self.log_result(
                "Project State (Production)",
                False,
                f"Error: {str(e)}"
            )
    
    async def test_semantic_memory(self):
        """Prueba chat semántico con creación de tarea."""
        try:
            payload = {
                "message": "Hola PMOPilot, crea una tarea para optimizar las consultas de la base de datos DynamoDB",
                "history": [],
                "project_context": {}
            }
            
            async with self.session.post(
                f"{BASE_URL}/api/semantic-memory",
                json=payload,
                timeout=TIMEOUT
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    # Verificar respuesta básica
                    if "response" not in data:
                        return self.log_result(
                            "Semantic Memory",
                            False,
                            "Falta campo 'response'"
                        )
                    
                    has_action = data.get("proposed_action") is not None
                    response_preview = data["response"][:100] + "..." if len(data["response"]) > 100 else data["response"]
                    
                    return self.log_result(
                        "Semantic Memory",
                        True,
                        f"Respuesta: {response_preview} | Acción propuesta: {has_action}",
                        {"has_action": has_action, "response_length": len(data["response"])}
                    )
                else:
                    return self.log_result(
                        "Semantic Memory",
                        False,
                        f"Status code: {response.status}"
                    )
        except Exception as e:
            return self.log_result(
                "Semantic Memory",
                False,
                f"Error: {str(e)}"
            )
    
    async def test_planning_agent(self):
        """Prueba descomposición de brief con Planning Agent."""
        try:
            payload = {
                "brief": "Sistema de gestión de tareas para equipos de desarrollo con notificaciones en tiempo real",
                "stack": "React & Node.js"
            }
            
            async with self.session.post(
                f"{BASE_URL}/api/planning",
                json=payload,
                timeout=TIMEOUT
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    # Verificar estructura de planificación
                    required_keys = ["epics", "stories", "tasks"]
                    missing_keys = [key for key in required_keys if key not in data]
                    
                    if missing_keys:
                        return self.log_result(
                            "Planning Agent",
                            False,
                            f"Faltan keys: {missing_keys}"
                        )
                    
                    epics = len(data.get("epics", []))
                    stories = len(data.get("stories", []))
                    tasks = len(data.get("tasks", []))
                    
                    return self.log_result(
                        "Planning Agent",
                        True,
                        f"Planificación generada: {epics} épicas, {stories} historias, {tasks} tareas",
                        {"epics": epics, "stories": stories, "tasks": tasks}
                    )
                else:
                    return self.log_result(
                        "Planning Agent",
                        False,
                        f"Status code: {response.status}"
                    )
        except Exception as e:
            return self.log_result(
                "Planning Agent",
                False,
                f"Error: {str(e)}"
            )
    
    async def test_frontend_proxy(self):
        """Prueba que el proxy frontend funciona."""
        try:
            async with self.session.get(
                f"{FRONTEND_URL}/api/health",
                timeout=TIMEOUT
            ) as response:
                # El proxy puede devolver diferentes códigos dependiendo del estado del backend
                data = await response.json()
                
                return self.log_result(
                    "Frontend Proxy",
                    True,
                    f"Proxy respondiendo: {data.get('status', 'unknown')}",
                    data
                )
        except Exception as e:
            return self.log_result(
                "Frontend Proxy",
                False,
                f"Error: {str(e)}"
            )
    
    async def test_pr_analysis(self):
        """Prueba análisis de código de PR."""
        try:
            payload = {
                "pr_title": "Fix login validation issues",
                "pr_branch": "feature/login-fix",
                "code_changes": """function validateEmail(email) {
    const regex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    return regex.test(email);
}

function validatePassword(password) {
    return password.length >= 8;
}""",
                "task_spec": "Implementar validación de email y contraseña en formulario de login"
            }
            
            async with self.session.post(
                f"{BASE_URL}/api/pull-requests/analyze",
                json=payload,
                timeout=TIMEOUT
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    # Verificar respuesta de análisis
                    if "review" not in data or "decision" not in data:
                        return self.log_result(
                            "PR Analysis",
                            False,
                            "Faltan campos requeridos en respuesta"
                        )
                    
                    decision = data.get("decision", "unknown")
                    score = data.get("compliance_score", 0)
                    
                    return self.log_result(
                        "PR Analysis",
                        True,
                        f"Análisis completado: {decision} (score: {score})",
                        {"decision": decision, "score": score}
                    )
                else:
                    return self.log_result(
                        "PR Analysis",
                        False,
                        f"Status code: {response.status}"
                    )
        except Exception as e:
            return self.log_result(
                "PR Analysis",
                False,
                f"Error: {str(e)}"
            )
    
    async def run_all_tests(self):
        """Ejecuta todas las pruebas."""
        print("🚀 Iniciando pruebas automatizadas de PMOPilot")
        print("=" * 60)
        
        start_time = time.time()
        
        # Ejecutar pruebas en orden
        tests = [
            self.test_health_check,
            self.test_project_state_demo,
            self.test_project_state_production,
            self.test_semantic_memory,
            self.test_planning_agent,
            self.test_pr_analysis,
            self.test_frontend_proxy
        ]
        
        for test in tests:
            await test()
            await asyncio.sleep(1)  # Pequeña pausa entre pruebas
        
        # Calcular estadísticas
        end_time = time.time()
        duration = end_time - start_time
        
        passed = sum(1 for r in self.results if r["success"])
        total = len(self.results)
        
        print("\n" + "=" * 60)
        print("📊 RESUMEN DE PRUEBAS")
        print("=" * 60)
        
        for result in self.results:
            icon = "✅" if result["success"] else "❌"
            print(f"{icon} {result['test']}: {result['message']}")
        
        print("\n" + "=" * 60)
        print(f"✅ Pasadas: {passed}/{total} ({passed/total*100:.1f}%)")
        print(f"⏱️  Duración: {duration:.2f} segundos")
        print(f"📅 Fecha: {datetime.now().isoformat()}")
        
        # Guardar resultados en archivo
        report = {
            "summary": {
                "passed": passed,
                "total": total,
                "success_rate": passed/total*100,
                "duration_seconds": duration,
                "timestamp": datetime.now().isoformat()
            },
            "results": self.results
        }
        
        with open("test-results.json", "w") as f:
            json.dump(report, f, indent=2)
        
        print(f"📄 Reporte guardado en: test-results.json")
        
        return passed == total

async def main():
    """Función principal."""
    print("🔍 Verificando que los servicios estén disponibles...")
    
    # Esperar un momento para que los servicios se inicien
    print("⏳ Esperando 5 segundos para que los servicios se estabilicen...")
    await asyncio.sleep(5)
    
    try:
        async with PMOPilotTester() as tester:
            success = await tester.run_all_tests()
            
            if success:
                print("\n🎉 ¡TODAS LAS PRUEBAS PASARON EXITOSAMENTE!")
                print("El entorno PMOPilot está listo para usar.")
                print("\n📌 URLs disponibles:")
                print(f"• Frontend: {FRONTEND_URL}")
                print(f"• Backend API: {BASE_URL}")
                print(f"• API Docs: {BASE_URL}/api/docs")
                print(f"• Health Check: {BASE_URL}/api/health")
                return 0
            else:
                print("\n⚠️ ALGUNAS PRUEBAS FALLARON")
                print("Revisa los logs arriba para ver qué falló.")
                return 1
                
    except Exception as e:
        print(f"\n❌ ERROR CRÍTICO: {str(e)}")
        print("Asegúrate de que los servicios estén ejecutándose.")
        print("Usa: ./pmopilot-local.sh start")
        return 2

if __name__ == "__main__":
    # Verificar que estamos en el entorno correcto
    print("🧪 PMOPilot Automated Test Suite")
    print("=" * 60)
    
    try:
        exit_code = asyncio.run(main())
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n⏹️ Pruebas interrumpidas por el usuario")
        sys.exit(130)