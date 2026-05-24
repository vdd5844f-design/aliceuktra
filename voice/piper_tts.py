import subprocess
import tempfile
import os
from voice.tts_base import TTSBase
from core.logger import Logger

class PiperTTS(TTSBase):
    """Text-to-Speech using Piper (local/offline)"""
    
    def __init__(self, voice="tr_TR-kbvcorpus-medium"):
        super().__init__("Piper")
        self.voice = voice
        self.logger = Logger(__name__)
    
    def synthesize(self, text):
        """
        Synthesize text using Piper.
        Requires piper-tts to be installed and in PATH.
        """
        try:
            self.logger.debug(f"Synthesizing with Piper: {text[:30]}...")
            
            temp_dir = os.path.join("data", "audio_cache")
            os.makedirs(temp_dir, exist_ok=True)
            
            output_path = tempfile.NamedTemporaryFile(
                delete=False,
                suffix=".wav",
                dir=temp_dir
            ).name
            
            # Run piper command
            process = subprocess.Popen(
                [
                    "piper",
                    "--model", self.voice,
                    "--output_file", output_path
                ],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            stdout, stderr = process.communicate(input=text, timeout=30)
            
            if process.returncode != 0:
                self.logger.error(f"Piper error: {stderr}")
                return None
            
            self.logger.debug(f"Audio saved to {output_path}")
            return output_path
        
        except subprocess.TimeoutExpired:
            self.logger.error("Piper synthesis timeout")
            return None
        except Exception as e:
            self.logger.error(f"Piper synthesis error: {e}")
            return None
    
    def check_connection(self):
        """Check if piper is available"""
        try:
            subprocess.run(["piper", "--version"], capture_output=True, timeout=5)
            return True
        except:
            return False
