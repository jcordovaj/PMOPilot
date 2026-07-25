from typing import Dict, List, Any, Optional
import logging
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content, HtmlContent
from ..core.config import settings

logger = logging.getLogger(__name__)


class SendGridIntegration:
    """Integración con SendGrid API para envío de emails."""
    
    _instance = None
    
    def __init__(self):
        """Inicializa el cliente de SendGrid."""
        if not settings.sendgrid_configured:
            self.client = None
            print("⚠️ SendGrid no configurado. Usando modo mock.")
            return
        
        try:
            self.client = SendGridAPIClient(settings.sendgrid_api_key)
            print("✓ SendGrid configurado exitosamente")
        except Exception as e:
            print(f"✗ Error configurando SendGrid: {e}")
            self.client = None
    
    @classmethod
    def get_instance(cls):
        """Obtiene la instancia singleton de la integración."""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
    
    def is_configured(self) -> bool:
        """Verifica si SendGrid está configurado."""
        return self.client is not None and settings.sendgrid_configured
    
    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        plain_text_content: Optional[str] = None,
        from_email: Optional[str] = None,
        cc_emails: Optional[List[str]] = None,
        bcc_emails: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Envía un email usando SendGrid."""
        
        if not self.is_configured():
            # Modo mock para desarrollo
            return self._generate_mock_response(to_email, subject)
        
        try:
            from_email = from_email or settings.sendgrid_from_email
            
            # Crear objeto Mail
            mail = Mail(
                from_email=Email(from_email),
                to_emails=To(to_email),
                subject=subject,
                html_content=HtmlContent(html_content)
            )
            
            # Añadir contenido de texto plano si se proporciona
            if plain_text_content:
                mail.content = Content("text/plain", plain_text_content)
            
            # Añadir CC si se especifica
            if cc_emails:
                for cc_email in cc_emails:
                    mail.personalizations[0].add_cc(Email(cc_email))
            
            # Añadir BCC si se especifica
            if bcc_emails:
                for bcc_email in bcc_emails:
                    mail.personalizations[0].add_bcc(Email(bcc_email))
            
            # Enviar email
            response = self.client.send(mail)
            
            logger.info(f"Email enviado a {to_email}: {response.status_code}")
            
            return {
                "success": True,
                "status_code": response.status_code,
                "message_id": response.headers.get("X-Message-Id", ""),
                "is_mock": False
            }
            
        except Exception as e:
            logger.error(f"Error enviando email: {e}")
            return {
                "success": False,
                "error": str(e),
                "is_mock": False
            }
    
    async def send_pr_merged_notification(
        self,
        pr_title: str,
        pr_number: int,
        pr_url: str,
        merged_by: str,
        to_emails: List[str],
        project_name: str = "PMOPilot Project"
    ) -> Dict[str, Any]:
        """Envía notificación de PR fusionada."""
        
        subject = f"✅ PR #{pr_number} fusionado: {pr_title}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>PR Fusionado</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #2d3748; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ background-color: #f7fafc; padding: 30px; border-radius: 0 0 8px 8px; }}
                .success-badge {{ background-color: #48bb78; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; }}
                .details {{ background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0; }}
                .footer {{ text-align: center; margin-top: 30px; color: #718096; font-size: 14px; }}
                a {{ color: #4299e1; text-decoration: none; }}
                a:hover {{ text-decoration: underline; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🚀 PMOPilot - PR Fusionado</h1>
                <p>{project_name}</p>
            </div>
            <div class="content">
                <div class="success-badge">✅ PR FUSIONADO EXITOSAMENTE</div>
                
                <div class="details">
                    <h2>📋 Detalles de la Pull Request</h2>
                    <p><strong>Título:</strong> {pr_title}</p>
                    <p><strong>Número:</strong> #{pr_number}</p>
                    <p><strong>Fusionado por:</strong> {merged_by}</p>
                    <p><strong>Estado:</strong> ✅ Aprobado y fusionado</p>
                    
                    <p style="margin-top: 20px;">
                        <a href="{pr_url}" style="background-color: #4299e1; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none;">
                            📖 Ver Pull Request
                        </a>
                    </p>
                </div>
                
                <h3>🎯 Próximos pasos automáticos</h3>
                <ul>
                    <li>El código ha sido integrado a la rama principal</li>
                    <li>Se ha actualizado el estado de la tarea asociada a "done"</li>
                    <li>Se ha registrado el evento en los logs de observabilidad</li>
                    <li>Se ha actualizado el dashboard del proyecto</li>
                </ul>
                
                <div class="footer">
                    <p>Este es un correo automático generado por PMOPilot - Semantic PMO for SDD</p>
                    <p>📧 No responder a este mensaje</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        plain_text_content = f"""
        PR #{pr_number} fusionado: {pr_title}
        
        Proyecto: {project_name}
        Fusionado por: {merged_by}
        URL: {pr_url}
        
        ✅ PR fusionado exitosamente
        
        Detalles:
        - Título: {pr_title}
        - Número: #{pr_number}
        - Fusionado por: {merged_by}
        - Estado: Aprobado y fusionado
        
        Próximos pasos automáticos:
        * El código ha sido integrado a la rama principal
        * Se ha actualizado el estado de la tarea asociada a "done"
        * Se ha registrado el evento en los logs de observabilidad
        * Se ha actualizado el dashboard del proyecto
        
        ---
        Este es un correo automático generado por PMOPilot - Semantic PMO for SDD
        No responder a este mensaje
        """
        
        # Enviar a cada destinatario
        results = []
        for email in to_emails:
            result = await self.send_email(
                to_email=email,
                subject=subject,
                html_content=html_content,
                plain_text_content=plain_text_content
            )
            results.append({"email": email, **result})
        
        return {
            "success": all(r.get("success", False) for r in results),
            "results": results,
            "total_sent": len([r for r in results if r.get("success", False)]),
            "total_failed": len([r for r in results if not r.get("success", False)]),
            "is_mock": not self.is_configured()
        }
    
    async def send_project_bootstrap_notification(
        self,
        project_name: str,
        project_url: str,
        to_emails: List[str],
        created_by: str,
        framework: str = "React (Vite)"
    ) -> Dict[str, Any]:
        """Envía notificación de proyecto inicializado."""
        
        subject = f"🚀 Nuevo proyecto creado: {project_name}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Proyecto Creado</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #4c51bf; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ background-color: #f7fafc; padding: 30px; border-radius: 0 0 8px 8px; }}
                .badge {{ background-color: #ed8936; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; }}
                .details {{ background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0; }}
                .footer {{ text-align: center; margin-top: 30px; color: #718096; font-size: 14px; }}
                a {{ color: #4299e1; text-decoration: none; }}
                a:hover {{ text-decoration: underline; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🚀 PMOPilot - Nuevo Proyecto</h1>
                <p>Spec-Driven Development Platform</p>
            </div>
            <div class="content">
                <div class="badge">📦 PROYECTO INICIALIZADO</div>
                
                <div class="details">
                    <h2>🎯 Detalles del Proyecto</h2>
                    <p><strong>Nombre:</strong> {project_name}</p>
                    <p><strong>Creado por:</strong> {created_by}</p>
                    <p><strong>Framework:</strong> {framework}</p>
                    <p><strong>Metodología:</strong> Spec-Driven Development (SDD)</p>
                    
                    <p style="margin-top: 20px;">
                        <a href="{project_url}" style="background-color: #4299e1; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none;">
                            🚀 Acceder al Proyecto
                        </a>
                    </p>
                </div>
                
                <h3>🛠️ Configuración Automática Incluida</h3>
                <ul>
                    <li>✅ Repositorio GitHub configurado</li>
                    <li>✅ README con documentación inicial</li>
                    <li>✅ CODEOWNERS para gobernanza técnica</li>
                    <li>✅ Protección de ramas principales</li>
                    <li>✅ GitHub Actions para CI/CD</li>
                    <li>✅ Dashboard de PMOPilot activo</li>
                    <li>✅ Sistema de memoria semántica (ADR)</li>
                </ul>
                
                <h3>🎯 Próximos pasos recomendados</h3>
                <ol>
                    <li>Revisar las especificaciones iniciales en el dashboard</li>
                    <li>Invitar a los miembros del equipo al proyecto</li>
                    <li>Crear tu primera especificación usando el Planning Agent</li>
                    <li>Iniciar el desarrollo asistido por IA</li>
                </ol>
                
                <div class="footer">
                    <p>Este es un correo automático generado por PMOPilot - Semantic PMO for SDD</p>
                    <p>📧 No responder a este mensaje</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        plain_text_content = f"""
        Nuevo proyecto creado: {project_name}
        
        Creado por: {created_by}
        Framework: {framework}
        URL: {project_url}
        
        📦 PROYECTO INICIALIZADO
        
        Detalles:
        - Nombre: {project_name}
        - Creado por: {created_by}
        - Framework: {framework}
        - Metodología: Spec-Driven Development (SDD)
        
        Configuración automática incluida:
        * Repositorio GitHub configurado
        * README con documentación inicial
        * CODEOWNERS para gobernanza técnica
        * Protección de ramas principales
        * GitHub Actions para CI/CD
        * Dashboard de PMOPilot activo
        * Sistema de memoria semántica (ADR)
        
        Próximos pasos recomendados:
        1. Revisar las especificaciones iniciales en el dashboard
        2. Invitar a los miembros del equipo al proyecto
        3. Crear tu primera especificación usando el Planning Agent
        4. Iniciar el desarrollo asistido por IA
        
        ---
        Este es un correo automático generado por PMOPilot - Semantic PMO for SDD
        No responder a este mensaje
        """
        
        # Enviar a cada destinatario
        results = []
        for email in to_emails:
            result = await self.send_email(
                to_email=email,
                subject=subject,
                html_content=html_content,
                plain_text_content=plain_text_content
            )
            results.append({"email": email, **result})
        
        return {
            "success": all(r.get("success", False) for r in results),
            "results": results,
            "total_sent": len([r for r in results if r.get("success", False)]),
            "total_failed": len([r for r in results if not r.get("success", False)]),
            "is_mock": not self.is_configured()
        }
    
    def _generate_mock_response(self, to_email: str, subject: str) -> Dict[str, Any]:
        """Genera respuesta mock para desarrollo."""
        logger.info(f"[MOCK] Email enviado a {to_email}: {subject}")
        return {
            "success": True,
            "status_code": 202,
            "message_id": f"mock-{to_email}-{subject[:20]}",
            "is_mock": True
        }