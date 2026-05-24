"""
OpenAI-Compatible AI Provider
Supports OpenAI, OpenAI-compatible servers, local LLM proxies, etc.
"""

import requests
import json
from typing import List, Generator
from ai.base import AIProvider, Message
from core.logger import Logger


class OpenAICompatibleProvider(AIProvider):
    """OpenAI-compatible provider"""
    
    def __init__(self, config: dict):
        super().__init__(config)
        self.logger = Logger(__name__)
        # Default to OpenAI
        if not self.base_url:
            self.base_url = "https://api.openai.com/v1"
    
    def chat(self, messages: List[Message], system_prompt: str = None) -> str:
        """Sync chat"""
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
            self.logger.error(f"OpenAI request error: {e}")
            raise
    
    def stream_chat(self, messages: List[Message], system_prompt: str = None) -> Generator[str, None, None]:
        """Stream chat"""
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
                        
                        # Handle both 'delta' and 'content' fields
                        if "delta" in choice:
                            content = choice["delta"].get("content", "")
                        else:
                            content = choice.get("text", "")
                        
                        if content:
                            yield content
                    except (json.JSONDecodeError, KeyError, IndexError):
                        continue
        
        except requests.exceptions.RequestException as e:
            self.logger.error(f"OpenAI stream error: {e}")
            raise
    
    def health_check(self) -> bool:
        """Check connection and API key validity"""
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}"
            }
            
            response = requests.get(
                f"{self.base_url}/models",
                headers=headers,
                timeout=5
            )
            
            if response.status_code == 401:
                self.logger.error("Invalid API key")
                return False
            
            if response.status_code != 200:
                self.logger.error(f"Health check failed: {response.status_code}")
                return False
            
            return True
        
        except Exception as e:
            self.logger.error(f"Health check error: {e}")
            return False
    
    def get_available_models(self) -> List[str]:
        """Get available models (OpenAI only)"""
        if "openai.com" not in self.base_url:
            return []
        
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}"
            }
            
            response = requests.get(
                f"{self.base_url}/models",
                headers=headers,
                timeout=5
            )
            response.raise_for_status()
            
            data = response.json()
            models = [m["id"] for m in data.get("data", [])]
            return models
        
        except Exception as e:
            self.logger.error(f"Failed to get models: {e}")
            return []
