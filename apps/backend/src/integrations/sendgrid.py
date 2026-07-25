import httpx
from src.core.config import settings

class SendGridClient:
    def __init__(self):
        self.api_key = settings.SENDGRID_API_KEY
        self.sender_email = settings.SENDGRID_SENDER_EMAIL

    async def send_email(self, to_email: str, subject: str, body: str, template_id: str = None) -> bool:
        """
        Sends transactional email via SendGrid Web API.
        Fails gracefully or simulates send if credentials are not configured.
        """
        if not self.api_key or self.api_key.startswith("SG.your"):
            print(f"[SendGrid MOCK] Sending mail to {to_email} - Subject: {subject}")
            return True

        url = "https://api.sendgrid.com/v3/mail/send"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "personalizations": [{"to": [{"email": to_email}]}],
            "from": {"email": self.sender_email},
            "subject": subject,
            "content": [{"type": "text/html", "value": body}]
        }

        if template_id:
            payload["template_id"] = template_id

        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, json=payload)
            if response.status_code >= 300:
                print(f"[SendGrid ERROR] HTTP status {response.status_code}: {response.text}")
                return False
            return True
        return False
