"""
OpenRouter AI Provider - Universal LLM Router
"""

import requests
import json
from typing import List, Generator
from ai.base import AIProvider, Message
from core.logger import Logger


class OpenRouterProvider(AIProvider):
    """OpenRouter provider - routes to various models"""
    
    def __init__(self, config: dict):
        super().__init__(config)
        self.logger = Logger(__name__)
        # Default OpenRouter API
        if not self.base_url:
            self.base_url = "https://openrouter.ai/api/v1"
    
    def chat(self, messages: List[Message], system_prompt: str = None) -> str:
        """Sync chat via OpenRouter"""
        try:
            formatted = self.format_messages(messages, system_prompt)
            
            payload = {
                "model": self.model,
                "messages": formatted,
                "temperature": self.temperature,
                "max_tokens": self.max_tokens,
            }
            
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}",
                "HTTP-Referer": "https://alice-ai-ultra.local",
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
            self.logger.error(f"OpenRouter request error: {e}")
            raise
    
    def stream_chat(self, messages: List[Message], system_prompt: str = None) -> Generator[str, None, None]:
        """Stream chat via OpenRouter"""
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
                "Authorization": f"Bearer {self.api_key}",
                "HTTP-Referer": "https://alice-ai-ultra.local",
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
            self.logger.error(f"OpenRouter stream error: {e}")
            raise
    
    def health_check(self) -> bool:
        """Check API key and connection"""
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "HTTP-Referer": "https://alice-ai-ultra.local",
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
        """Popular models available on OpenRouter"""
        return [
            "openai/gpt-4-turbo",
            "openai/gpt-4o-mini",
            "anthropic/claude-3.5-sonnet",
            "anthropic/claude-3-opus",
            "meta-llama/llama-2-70b-chat",
            "mistralai/mistral-7b-instruct",
        ]
