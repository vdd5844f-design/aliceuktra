"""
Base AI Provider Interface - Alice AI Ultra Pet
Tüm AI provider'lar bu interface'i implement edecek
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Generator, Optional
import json


class Message(dict):
    """Chat message modeli"""
    def __init__(self, role: str, content: str):
        super().__init__(role=role, content=content)


class AIProvider(ABC):
    """Tüm AI provider'ların base class'ı"""
    
    def __init__(self, config: Dict):
        """
        Args:
            config: {
                'base_url': str,
                'api_key': str (optional),
                'model': str,
                'temperature': float (default 0.7),
                'max_tokens': int (default 512),
            }
        """
        self.base_url = config.get('base_url', '')
        self.api_key = config.get('api_key', '')
        self.model = config.get('model', '')
        self.temperature = config.get('temperature', 0.7)
        self.max_tokens = config.get('max_tokens', 512)
    
    @abstractmethod
    def chat(self, messages: List[Message], system_prompt: str = None) -> str:
        """
        Synchronous chat - returns complete response
        
        Args:
            messages: List of Message objects
            system_prompt: System prompt/persona
        
        Returns:
            AI response text
        """
        pass
    
    @abstractmethod
    def stream_chat(self, messages: List[Message], system_prompt: str = None) -> Generator[str, None, None]:
        """
        Streaming chat - yields text chunks
        
        Args:
            messages: List of Message objects
            system_prompt: System prompt/persona
        
        Yields:
            Text chunks of response
        """
        pass
    
    @abstractmethod
    def health_check(self) -> bool:
        """Check if provider is accessible and configured correctly"""
        pass
    
    @abstractmethod
    def get_available_models(self) -> List[str]:
        """Get list of available models (if provider supports it)"""
        pass
    
    def format_messages(self, messages: List[Message], system_prompt: str = None) -> List[Dict]:
        """Standard message formatting"""
        formatted = []
        
        if system_prompt:
            formatted.append({"role": "system", "content": system_prompt})
        
        for msg in messages:
            formatted.append(dict(msg))
        
        return formatted
