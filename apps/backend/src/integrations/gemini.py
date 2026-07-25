import os
from google import genai
from src.core.config import settings

class GeminiClient:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self._client = None

    @property
    def client(self):
        if self._client is None:
            if not self.api_key or self.api_key == "MY_GEMINI_API_KEY":
                # Returns None or mock indicator if API Key is not set
                return None
            self._client = genai.Client(api_key=self.api_key)
        return self._client

    def generate_json(self, prompt: str, response_schema: dict) -> dict:
        """
        Helper method to generate structured JSON using Gemini API
        """
        if not self.client:
            raise ValueError("Gemini API Key is not properly configured.")
            
        response = self._client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config={
                'response_mime_type': 'application/json',
                'response_schema': response_schema
            }
        )
        return response.text
