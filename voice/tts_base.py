from abc import ABC, abstractmethod
from core.logger import Logger

class TTSBase(ABC):
    """Base class for Text-to-Speech implementations"""
    
    def __init__(self, name):
        self.name = name
        self.logger = Logger(__name__)
    
    @abstractmethod
    def synthesize(self, text):
        """
        Synthesize text to speech.
        Should return path to audio file.
        """
        pass
    
    @abstractmethod
    def check_connection(self):
        """Check if TTS service is available"""
        pass
