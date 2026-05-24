"""
Voice System - Base voice synthesis interface
"""

from abc import ABC, abstractmethod
from typing import Optional
from core.logger import Logger


class VoiceSynthesizer(ABC):
    """Base voice synthesizer interface"""
    
    def __init__(self, config: dict):
        """
        Args:
            config: {
                'base_url': str,
                'speaker': int or str,
                'speed': float (default 1.0),
                'volume': float (default 1.0),
                'enabled': bool,
            }
        """
        self.base_url = config.get('base_url', '').rstrip("/") if config.get('base_url', '') else ''
        self.speaker = config.get('speaker', 0)
        self.speed = config.get('speed', 1.0)
        self.volume = config.get('volume', 1.0)
        self.enabled = config.get('enabled', True)
        self.logger = Logger(__name__)
    
    @abstractmethod
    def synthesize(self, text: str) -> Optional[bytes]:
        """
        Synthesize text to speech
        
        Args:
            text: Text to synthesize
        
        Returns:
            WAV audio bytes or None if failed
        """
        pass
    
    @abstractmethod
    def health_check(self) -> bool:
        """Check if voice synthesizer is working"""
        pass
    
    @abstractmethod
    def get_available_speakers(self) -> list:
        """Get available speaker voices"""
        pass
    
    def is_enabled(self) -> bool:
        """Check if voice synthesis is enabled"""
        return self.enabled
