from typing import List, Optional
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
import logging
from .config import settings

logger = logging.getLogger(__name__)
security = HTTPBearer()


class RBACMiddleware:
    """Middleware para control de acceso basado en roles (RBAC)."""
    
    def __init__(self, app: FastAPI):
        self.app = app
        
    async def __call__(self, request: Request, call_next):
        # Verificar si la ruta requiere autenticación
        if self._requires_auth(request):
            try:
                # Extraer credenciales del header
                auth_header = request.headers.get("Authorization")
                
                if not auth_header:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Missing authorization header"
                    )
                
                # En una implementación real, aquí validaríamos el token JWT
                # y extraeríamos el rol del usuario
                # Por ahora, simulamos la extracción del rol desde un header personalizado
                user_role = request.headers.get("X-User-Role", settings.default_user_role)
                
                # Verificar si el rol está permitido
                if user_role not in settings.allowed_roles:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"Role '{user_role}' not allowed"
                    )
                
                # Verificar permisos específicos de ruta
                if self._requires_leader_role(request) and user_role != "leader":
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Leader role required for this operation"
                    )
                
                # Almacenar el rol en el estado de la request para uso posterior
                request.state.user_role = user_role
                
            except HTTPException as e:
                raise e
            except Exception as e:
                logger.error(f"Authentication error: {e}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Internal authentication error"
                )
        
        response = await call_next(request)
        return response
    
    def _requires_auth(self, request: Request) -> bool:
        """Determina si la ruta requiere autenticación."""
        path = request.url.path
        
        # Rutas públicas
        public_paths = [
            "/api/health",
            "/api/docs",
            "/api/redoc",
            "/api/openapi.json",
        ]
        
        # Verificar si la ruta comienza con alguna ruta pública
        if any(path.startswith(public_path) for public_path in public_paths):
            return False
        
        # Todas las demás rutas bajo /api requieren autenticación
        return path.startswith("/api")
    
    def _requires_leader_role(self, request: Request) -> bool:
        """Determina si la ruta requiere rol de líder."""
        path = request.url.path
        method = request.method
        
        # Rutas que requieren rol de líder
        leader_paths = [
            ("PUT", "/api/cloudflare/config"),
            ("POST", "/api/pull-requests/.*/merge"),
            ("POST", "/api/project/bootstrap"),
        ]
        
        # Verificar coincidencia con rutas de líder
        for leader_method, leader_path in leader_paths:
            if method == leader_method and self._path_matches_pattern(path, leader_path):
                return True
        
        return False
    
    def _path_matches_pattern(self, path: str, pattern: str) -> bool:
        """Verifica si una ruta coincide con un patrón (con soporte para wildcards)."""
        if ".*" in pattern:
            # Patrón con wildcard
            pattern_parts = pattern.split(".*")
            return all(part in path for part in pattern_parts if part)
        else:
            # Coincidencia exacta
            return path == pattern


def verify_role(required_role: str):
    """Decorador para verificar el rol del usuario en endpoints específicos."""
    def role_verifier(request: Request):
        user_role = getattr(request.state, "user_role", settings.default_user_role)
        
        if user_role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"{required_role} role required"
            )
        return request
    
    return role_verifier


def setup_cors(app: FastAPI):
    """Configuración de CORS para la aplicación."""
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


def setup_security(app: FastAPI):
    """Configura toda la seguridad de la aplicación."""
    # Configurar CORS
    setup_cors(app)
    
    # Añadir middleware RBAC
    app.add_middleware(RBACMiddleware)
    
    logger.info("Security middleware configured successfully")