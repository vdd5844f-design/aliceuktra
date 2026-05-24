"""
Google Gemini AI Provider
"""

import requests
import json
from typing import List, Generator
from ai.base import AIProvider, Message
from core.logger import Logger


class GeminiProvider(AIProvider):
    """Google Gemini provider"""
    
    def __init__(self, config: dict):
        super().__init__(config)
        self.logger = Logger(__name__)
        # Default Google Generative AI endpoint
        if not self.base_url:
            self.base_url = "https://generativelanguage.googleapis.com/v1beta/openai"
    
    def chat(self, messages: List[Message], system_prompt: str = None) -> str:
        """Sync chat with Gemini"""
        try:
            formatted = self.format_messages(messages, system_prompt)
            
            payload = {
                "model": self.model,
                "messages": formatted,
                "temperature": self.temperature,
                "max_tokens": self.max_tokens,
            }
            
            # Gemini uses OpenAI-compatible endpoint
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}"
            }
            
            response = requests.post(
                f"{self.base_url}/chat/completions",
                json=payload,
                headers=headers,
                timeout=60
            )
            response.raise_for_status()
            
            data = response.json()
            return data["choices"][0]["message"]["content"]
        
        except requests.exceptions.RequestException as e:
            self.logger.error(f"Gemini request error: {e}")
            raise
    
    def stream_chat(self, messages: List[Message], system_prompt: str = None) -> Generator[str, None, None]:
        """Stream chat with Gemini"""
        try:
            formatted = self.format_messages(messages, system_prompt)
            
            payload = {
                "model": self.model,
                "messages": formatted,
                "temperature": self.temperature,
                "max_tokens": self.max_tokens,
                "stream": True,
            }
            
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}"
            }
            
            response = requests.post(
                f"{self.base_url}/chat/completions",
                json=payload,
                headers=headers,
                timeout=60,
                stream=True
            )
            response.raise_for_status()
            
            for line in response.iter_lines():
                if line:
                    line_str = line.decode('utf-8') if isinstance(line, bytes) else line
                    
                    if line_str.startswith("data: "):
                        line_str = line_str[6:]
                    
                    if line_str.strip() == "[DONE]":
                        break
                    
                    try:
                        data = json.loads(line_str)
                        choice = data["choices"][0]
                        
                        if "delta" in choice:
                            content = choice["delta"].get("content", "")
                        else:
                            content = choice.get("text", "")
                        
                        if content:
                            yield content
                    except (json.JSONDecodeError, KeyError, IndexError):
                        continue
        
        except requests.exceptions.RequestException as e:
            self.logger.error(f"Gemini stream error: {e}")
            raise
    
    def health_check(self) -> bool:
        """Check API key and connection"""
        try:
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}"
            }
            
            response = requests.post(
                f"{self.base_url}/chat/completions",
                json={
                    "model": self.model,
                    "messages": [{"role": "user", "content": "Hi"}],
                    "max_tokens": 10,
                },
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 401:
                self.logger.error("Invalid API key")
                return False
            
            return response.status_code == 200
        
        except Exception as e:
            self.logger.error(f"Health check error: {e}")
            return False
    
    def get_available_models(self) -> List[str]:
        """Google Gemini available models"""
        return [
            "gemini-2.0-flash",
            "gemini-1.5-pro",
            "gemini-1.5-flash",
        ]
