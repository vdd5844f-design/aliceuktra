"""
Anthropic Claude AI Provider
"""

import requests
import json
from typing import List, Generator
from ai.base import AIProvider, Message
from core.logger import Logger


class AnthropicProvider(AIProvider):
    """Anthropic Claude provider"""
    
    def __init__(self, config: dict):
        super().__init__(config)
        self.logger = Logger(__name__)
        # Default Anthropic API
        if not self.base_url:
            self.base_url = "https://api.anthropic.com/v1"
    
    def chat(self, messages: List[Message], system_prompt: str = None) -> str:
        """Sync chat with Claude"""
        try:
            # Extract messages without system prompt (Anthropic uses separate field)
            messages_only = [dict(m) for m in messages]
            
            payload = {
                "model": self.model,
                "messages": messages_only,
                "max_tokens": self.max_tokens,
                "temperature": self.temperature,
            }
            
            if system_prompt:
                payload["system"] = system_prompt
            
            headers = {
                "Content-Type": "application/json",
                "x-api-key": self.api_key,
                "anthropic-version": "2023-06-01"
            }
            
            response = requests.post(
                f"{self.base_url}/messages",
                json=payload,
                headers=headers,
                timeout=60
            )
            response.raise_for_status()
            
            data = response.json()
            content = data["content"][0].get("text", "")
            return content
        
        except requests.exceptions.RequestException as e:
            self.logger.error(f"Anthropic request error: {e}")
            raise
    
    def stream_chat(self, messages: List[Message], system_prompt: str = None) -> Generator[str, None, None]:
        """Stream chat with Claude"""
        try:
            messages_only = [dict(m) for m in messages]
            
            payload = {
                "model": self.model,
                "messages": messages_only,
                "max_tokens": self.max_tokens,
                "temperature": self.temperature,
                "stream": True,
            }
            
            if system_prompt:
                payload["system"] = system_prompt
            
            headers = {
                "Content-Type": "application/json",
                "x-api-key": self.api_key,
                "anthropic-version": "2023-06-01"
            }
            
            response = requests.post(
                f"{self.base_url}/messages",
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
                    
                    try:
                        data = json.loads(line_str)
                        
                        # Claude streaming uses delta events
                        if data.get("type") == "content_block_delta":
                            delta = data.get("delta", {})
                            if delta.get("type") == "text_delta":
                                content = delta.get("text", "")
                                if content:
                                    yield content
                    except (json.JSONDecodeError, KeyError):
                        continue
        
        except requests.exceptions.RequestException as e:
            self.logger.error(f"Anthropic stream error: {e}")
            raise
    
    def health_check(self) -> bool:
        """Check API key and connection"""
        try:
            # Simple test with create message
            headers = {
                "Content-Type": "application/json",
                "x-api-key": self.api_key,
                "anthropic-version": "2023-06-01"
            }
            
            # Just check basic connectivity
            response = requests.post(
                f"{self.base_url}/messages",
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
        """Anthropic doesn't expose model list, return known models"""
        return [
            "claude-3-5-sonnet-20241022",
            "claude-3-opus-20250219",
            "claude-3-sonnet-20240229",
            "claude-3-haiku-20240307",
        ]
