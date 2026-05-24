import sounddevice as sd
import numpy as np
from core.logger import Logger

class STT:
    """Speech-to-Text using sounddevice"""
    
    def __init__(self, sample_rate=16000, duration=5):
        self.sample_rate = sample_rate
        self.duration = duration
        self.logger = Logger(__name__)
    
    def record(self):
        """
        Record audio from microphone.
        Returns numpy array of audio data.
        """
        try:
            self.logger.debug(f"Recording for {self.duration} seconds...")
            
            audio = sd.rec(
                int(self.sample_rate * self.duration),
                samplerate=self.sample_rate,
                channels=1,
                dtype=np.float32
            )
            
            sd.wait()
            self.logger.debug("Recording finished")
            
            return audio.flatten()
        
        except Exception as e:
            self.logger.error(f"Recording error: {e}")
            return None
