from typing import Dict, List, Any, Optional
import httpx
import logging
from ..core.config import settings

logger = logging.getLogger(__name__)


class CloudflareIntegration:
    """Integración con Cloudflare API para configuración de seguridad y DNS."""
    
    _instance = None
    
    def __init__(self):
        """Inicializa el cliente de Cloudflare."""
        if not settings.cloudflare_configured:
            self.client = None
            print("⚠️ Cloudflare no configurado. Usando modo mock.")
            return
        
        try:
            self.base_url = "https://api.cloudflare.com/client/v4"
            self.headers = {
                "Authorization": f"Bearer {settings.cloudflare_api_token}",
                "Content-Type": "application/json"
            }
            self.client = httpx.AsyncClient(headers=self.headers, timeout=30.0)
            print("✓ Cloudflare configurado exitosamente")
        except Exception as e:
            print(f"✗ Error configurando Cloudflare: {e}")
            self.client = None
    
    @classmethod
    def get_instance(cls):
        """Obtiene la instancia singleton de la integración."""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
    
    def is_configured(self) -> bool:
        """Verifica si Cloudflare está configurado."""
        return self.client is not None and settings.cloudflare_configured
    
    async def get_zone_details(self) -> Dict[str, Any]:
        """Obtiene detalles de la zona Cloudflare."""
        
        if not self.is_configured():
            # Modo mock para desarrollo
            return self._generate_mock_zone_details()
        
        try:
            url = f"{self.base_url}/zones/{settings.cloudflare_zone_id}"
            response = await self.client.get(url)
            response.raise_for_status()
            
            data = response.json()
            
            if data.get("success"):
                return {
                    "success": True,
                    "zone": data.get("result", {}),
                    "is_mock": False
                }
            else:
                return {
                    "success": False,
                    "errors": data.get("errors", []),
                    "is_mock": False
                }
                
        except Exception as e:
            logger.error(f"Error obteniendo detalles de zona: {e}")
            return {
                "success": False,
                "error": str(e),
                "is_mock": False
            }
    
    async def update_security_settings(
        self,
        security_level: str = "medium",
        browser_check: bool = True,
        challenge_ttl: int = 1800,
        waf_enabled: bool = True
    ) -> Dict[str, Any]:
        """Actualiza configuración de seguridad de Cloudflare."""
        
        if not self.is_configured():
            # Modo mock para desarrollo
            return self._generate_mock_security_update(security_level, browser_check, waf_enabled)
        
        try:
            url = f"{self.base_url}/zones/{settings.cloudflare_zone_id}/settings"
            
            # Configuración de seguridad
            settings_payload = [
                {
                    "id": "security_level",
                    "value": security_level  # off, essentially_off, low, medium, high, under_attack
                },
                {
                    "id": "browser_check",
                    "value": "on" if browser_check else "off"
                },
                {
                    "id": "challenge_ttl",
                    "value": challenge_ttl
                }
            ]
            
            response = await self.client.patch(url, json=settings_payload)
            response.raise_for_status()
            
            data = response.json()
            
            # Configurar WAF si está habilitado
            waf_result = None
            if waf_enabled:
                waf_result = await self._enable_waf()
            
            return {
                "success": data.get("success", False),
                "settings": data.get("result", []),
                "waf_enabled": waf_result.get("success", False) if waf_result else False,
                "is_mock": False
            }
            
        except Exception as e:
            logger.error(f"Error actualizando configuración de seguridad: {e}")
            return {
                "success": False,
                "error": str(e),
                "is_mock": False
            }
    
    async def update_dns_record(
        self,
        record_id: Optional[str] = None,
        record_type: str = "A",
        name: str = "api",
        content: str = "127.0.0.1",
        ttl: int = 300,
        proxied: bool = True
    ) -> Dict[str, Any]:
        """Crea o actualiza un registro DNS en Cloudflare."""
        
        if not self.is_configured():
            # Modo mock para desarrollo
            return self._generate_mock_dns_update(name, record_type, content, proxied)
        
        try:
            if record_id:
                # Actualizar registro existente
                url = f"{self.base_url}/zones/{settings.cloudflare_zone_id}/dns_records/{record_id}"
                method = "PUT"
            else:
                # Crear nuevo registro
                url = f"{self.base_url}/zones/{settings.cloudflare_zone_id}/dns_records"
                method = "POST"
            
            payload = {
                "type": record_type,
                "name": name,
                "content": content,
                "ttl": ttl,
                "proxied": proxied
            }
            
            if method == "PUT":
                response = await self.client.put(url, json=payload)
            else:
                response = await self.client.post(url, json=payload)
            
            response.raise_for_status()
            
            data = response.json()
            
            return {
                "success": data.get("success", False),
                "record": data.get("result", {}),
                "is_mock": False
            }
            
        except Exception as e:
            logger.error(f"Error actualizando registro DNS: {e}")
            return {
                "success": False,
                "error": str(e),
                "is_mock": False
            }
    
    async def configure_cdn_settings(
        self,
        cache_level: str = "aggressive",
        browser_cache_ttl: int = 14400,
        development_mode: bool = False,
        rocket_loader: bool = False
    ) -> Dict[str, Any]:
        """Configura ajustes de CDN y caché."""
        
        if not self.is_configured():
            # Modo mock para desarrollo
            return self._generate_mock_cdn_config(cache_level, development_mode)
        
        try:
            url = f"{self.base_url}/zones/{settings.cloudflare_zone_id}/settings"
            
            cdn_settings = [
                {
                    "id": "cache_level",
                    "value": cache_level  # aggressive, basic, simplified
                },
                {
                    "id": "browser_cache_ttl",
                    "value": browser_cache_ttl
                },
                {
                    "id": "development_mode",
                    "value": "on" if development_mode else "off"
                },
                {
                    "id": "rocket_loader",
                    "value": "on" if rocket_loader else "off"
                }
            ]
            
            response = await self.client.patch(url, json=cdn_settings)
            response.raise_for_status()
            
            data = response.json()
            
            return {
                "success": data.get("success", False),
                "settings": data.get("result", []),
                "is_mock": False
            }
            
        except Exception as e:
            logger.error(f"Error configurando CDN: {e}")
            return {
                "success": False,
                "error": str(e),
                "is_mock": False
            }
    
    async def get_analytics(self, timeframe: str = "last_7d") -> Dict[str, Any]:
        """Obtiene analytics de tráfico y seguridad."""
        
        if not self.is_configured():
            # Modo mock para desarrollo
            return self._generate_mock_analytics(timeframe)
        
        try:
            # Analytics de tráfico
            traffic_url = f"{self.base_url}/zones/{settings.cloudflare_zone_id}/analytics/dashboard"
            
            params = {
                "since": timeframe,
                "metrics": "requests,bandwidth,threats,pageviews,uniques"
            }
            
            response = await self.client.get(traffic_url, params=params)
            response.raise_for_status()
            
            data = response.json()
            
            return {
                "success": data.get("success", False),
                "analytics": data.get("result", {}),
                "timeframe": timeframe,
                "is_mock": False
            }
            
        except Exception as e:
            logger.error(f"Error obteniendo analytics: {e}")
            return {
                "success": False,
                "error": str(e),
                "is_mock": False
            }
    
    async def _enable_waf(self) -> Dict[str, Any]:
        """Habilita Web Application Firewall (WAF)."""
        try:
            # Primero verificar si el WAF está disponible
            packages_url = f"{self.base_url}/zones/{settings.cloudflare_zone_id}/firewall/waf/packages"
            response = await self.client.get(packages_url)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("result"):
                    # Habilitar el primer paquete WAF encontrado
                    package_id = data["result"][0]["id"]
                    
                    enable_url = f"{self.base_url}/zones/{settings.cloudflare_zone_id}/firewall/waf/packages/{package_id}"
                    enable_payload = {
                        "sensitivity": "medium",
                        "action_mode": "challenge"
                    }
                    
                    enable_response = await self.client.patch(enable_url, json=enable_payload)
                    enable_response.raise_for_status()
                    
                    enable_data = enable_response.json()
                    
                    return {
                        "success": enable_data.get("success", False),
                        "package": enable_data.get("result", {})
                    }
            
            return {"success": False, "error": "WAF packages not available"}
            
        except Exception as e:
            logger.error(f"Error habilitando WAF: {e}")
            return {"success": False, "error": str(e)}
    
    def _generate_mock_zone_details(self) -> Dict[str, Any]:
        """Genera detalles mock de zona."""
        return {
            "success": True,
            "zone": {
                "id": "mock-zone-id",
                "name": "pmopilot.dev",
                "status": "active",
                "paused": False,
                "type": "full",
                "development_mode": 0,
                "name_servers": ["ns1.cloudflare.com", "ns2.cloudflare.com"],
                "original_name_servers": ["ns1.original.com", "ns2.original.com"],
                "original_registrar": "Registrar Inc.",
                "original_dnshost": "DNS Host Inc.",
                "activated_on": "2024-01-01T00:00:00Z",
                "created_on": "2024-01-01T00:00:00Z",
                "modified_on": "2024-01-01T00:00:00Z",
                "permissions": ["#zone:read", "#zone:edit"]
            },
            "is_mock": True
        }
    
    def _generate_mock_security_update(
        self,
        security_level: str,
        browser_check: bool,
        waf_enabled: bool
    ) -> Dict[str, Any]:
        """Genera respuesta mock para actualización de seguridad."""
        logger.info(f"[MOCK] Configuración de seguridad actualizada: level={security_level}, browser_check={browser_check}, waf={waf_enabled}")
        return {
            "success": True,
            "settings": [
                {"id": "security_level", "value": security_level, "modified_on": "2024-01-01T00:00:00Z"},
                {"id": "browser_check", "value": "on" if browser_check else "off", "modified_on": "2024-01-01T00:00:00Z"},
                {"id": "challenge_ttl", "value": 1800, "modified_on": "2024-01-01T00:00:00Z"}
            ],
            "waf_enabled": waf_enabled,
            "is_mock": True
        }
    
    def _generate_mock_dns_update(
        self,
        name: str,
        record_type: str,
        content: str,
        proxied: bool
    ) -> Dict[str, Any]:
        """Genera respuesta mock para actualización DNS."""
        logger.info(f"[MOCK] Registro DNS actualizado: {name} {record_type} -> {content} (proxied={proxied})")
        return {
            "success": True,
            "record": {
                "id": f"mock-dns-id-{name}",
                "type": record_type,
                "name": name,
                "content": content,
                "proxiable": True,
                "proxied": proxied,
                "ttl": 300,
                "locked": False,
                "zone_id": "mock-zone-id",
                "zone_name": "pmopilot.dev",
                "created_on": "2024-01-01T00:00:00Z",
                "modified_on": "2024-01-01T00:00:00Z"
            },
            "is_mock": True
        }
    
    def _generate_mock_cdn_config(
        self,
        cache_level: str,
        development_mode: bool
    ) -> Dict[str, Any]:
        """Genera respuesta mock para configuración CDN."""
        logger.info(f"[MOCK] Configuración CDN actualizada: cache_level={cache_level}, dev_mode={development_mode}")
        return {
            "success": True,
            "settings": [
                {"id": "cache_level", "value": cache_level, "modified_on": "2024-01-01T00:00:00Z"},
                {"id": "browser_cache_ttl", "value": 14400, "modified_on": "2024-01-01T00:00:00Z"},
                {"id": "development_mode", "value": "on" if development_mode else "off", "modified_on": "2024-01-01T00:00:00Z"},
                {"id": "rocket_loader", "value": "off", "modified_on": "2024-01-01T00:00:00Z"}
            ],
            "is_mock": True
        }
    
    def _generate_mock_analytics(self, timeframe: str) -> Dict[str, Any]:
        """Genera analytics mock."""
        return {
            "success": True,
            "analytics": {
                "totals": {
                    "requests": {"all": 123456, "cached": 98765, "uncached": 24691},
                    "bandwidth": {"all": 1024768, "cached": 512384, "uncached": 512384},
                    "threats": {"all": 42, "country": {"US": 15, "CN": 12, "RU": 8, "OTHER": 7}},
                    "pageviews": {"all": 87654},
                    "uniques": {"all": 23456}
                },
                "timeseries": [
                    {
                        "timestamp": "2024-01-01T00:00:00Z",
                        "requests": {"all": 1000},
                        "bandwidth": {"all": 8192},
                        "threats": {"all": 1}
                    }
                ]
            },
            "timeframe": timeframe,
            "is_mock": True
        }
    
    async def close(self):
        """Cierra el cliente HTTP."""
        if self.client:
            await self.client.aclose()
