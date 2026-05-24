from PySide6.QtCore import QThread, Signal
import sounddevice as sd
import soundfile as sf
from core.logger import Logger
from ai.ollama_worker import OllamaWorker  # re-export for ui imports

class TTSWorker(QThread):
    """
    Worker thread for Text-to-Speech synthesis.
    Keeps main thread free for animation timers.
    """
    audio_ready = Signal(str)  # Emits path to audio file
    error_occurred = Signal(str)  # Emits error message
    
    def __init__(self, text, tts_engine):
        super().__init__()
        self.text = text
        self.tts_engine = tts_engine
        self.logger = Logger(__name__)
    
    def run(self):
        """Run TTS synthesis in worker thread"""
        try:
            self.logger.debug(f"TTS Worker: Synthesizing '{self.text[:30]}...'")
            
            audio_path = self.tts_engine.synthesize(self.text)
            
            if audio_path:
                self.audio_ready.emit(audio_path)
                self.logger.debug(f"Audio ready: {audio_path}")
            else:
                self.error_occurred.emit("Ses sentezi başarısız")
        
        except Exception as e:
            self.logger.error(f"TTS Worker error: {e}")
            self.error_occurred.emit(str(e))

class AudioPlayerWorker(QThread):
    """
    Worker thread for audio playback.
    Keeps main thread free for animation timers.
    """
    playback_started = Signal()
    playback_finished = Signal()
    error_occurred = Signal(str)
    
    def __init__(self, audio_path):
        super().__init__()
        self.audio_path = audio_path
        self.logger = Logger(__name__)
    
    def run(self):
        """Play audio in worker thread"""
        try:
            self.logger.debug(f"Playing audio: {self.audio_path}")
            self.playback_started.emit()
            
            # Load and play audio
            audio_data, sample_rate = sf.read(self.audio_path)
            sd.play(audio_data, sample_rate)
            sd.wait()
            
            self.playback_finished.emit()
            self.logger.debug("Audio playback finished")
        
        except Exception as e:
            self.logger.error(f"Audio player error: {e}")
            self.error_occurred.emit(str(e))
