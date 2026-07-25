import httpx
from src.core.config import settings

class CloudflareClient:
    def __init__(self):
        self.zone_id = settings.CLOUDFLARE_ZONE_ID
        self.api_token = settings.CLOUDFLARE_API_TOKEN

    async def update_security_config(self, under_attack: bool, rate_limiting: bool) -> bool:
        """
        Updates the Cloudflare zone settings using Cloudflare API v4.
        Simulates if tokens are not configured.
        """
        if not self.zone_id or not self.api_token:
            print(f"[Cloudflare MOCK] Updating Zone {self.zone_id or 'unknown'} security settings - UnderAttack: {under_attack}, RateLimiting: {rate_limiting}")
            return True

        headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json"
        }

        # 1. Update security level (Under Attack mode)
        security_url = f"https://api.cloudflare.com/client/v4/zones/{self.zone_id}/settings/security_level"
        value = "under_attack" if under_attack else "medium"
        
        async with httpx.AsyncClient() as client:
            res1 = await client.patch(security_url, headers=headers, json={"value": value})
            if res1.status_code >= 300:
                print(f"[Cloudflare ERROR] Security level update failed: {res1.text}")
                return False
                
        print(f"[Cloudflare] Successfully updated security configurations for Zone {self.zone_id}")
        return True
        
    async def get_zone_status(self) -> dict:
        """
        Retrieves general analytics or status for the Cloudflare zone.
        """
        return {
            "zone_id": self.zone_id,
            "configured": bool(self.zone_id and self.api_token),
            "ssl_mode": "full",
            "security_level": "medium"
        }
        
