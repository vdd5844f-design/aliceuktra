import requests
import tempfile
import os
from voice.tts_base import TTSBase
from core.logger import Logger

class VoiceVoxTTS(TTSBase):
    def __init__(self, base_url="http://127.0.0.1:50021", speaker=47):
        super().__init__("VoiceVox")
        self.base_url = base_url
        self.speaker = speaker
        self.logger = Logger(__name__)
    
    def synthesize(self, text, timeout=60):
        """
        Synthesize text using VoiceVox.
        Returns path to WAV file.
        """
        try:
            self.logger.debug(f"Synthesizing with VoiceVox: {text[:30]}...")
            
            # Audio query
            query_response = requests.post(
                f"{self.base_url}/audio_query",
                params={"text": text, "speaker": self.speaker},
                timeout=30
            )
            query_response.raise_for_status()
            
            # Synthesis
            audio_response = requests.post(
                f"{self.base_url}/synthesis",
                params={"speaker": self.speaker},
                json=query_response.json(),
                timeout=timeout
            )
            audio_response.raise_for_status()
            
            # Save to temp file
            temp_dir = os.path.join("data", "audio_cache")
            os.makedirs(temp_dir, exist_ok=True)
            
            path = tempfile.NamedTemporaryFile(
                delete=False,
                suffix=".wav",
                dir=temp_dir
            ).name
            
            with open(path, "wb") as f:
                f.write(audio_response.content)
            
            self.logger.debug(f"Audio saved to {path}")
            return path
        
        except requests.exceptions.ConnectionError:
            self.logger.error("VoiceVox connection failed")
            return None
        except Exception as e:
            self.logger.error(f"VoiceVox synthesis error: {e}")
            return None
    
    def check_connection(self):
        """Check if VoiceVox is running"""
        try:
            r = requests.get(f"{self.base_url}/version", timeout=5)
            return r.status_code == 200
        except:
            return False
