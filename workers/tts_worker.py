"""Threaded text-to-speech worker."""

from PySide6.QtCore import QObject, Signal, Slot

from core.logger import Logger
from voice.edge_tts_voice import EdgeTTSVoice
from voice.voice_manager import VoiceManager


class TTSWorker(QObject):
    """Generate and play speech in a worker thread."""

    started = Signal()
    playback_started = Signal()
    playback_finished = Signal()
    finished = Signal()
    error = Signal(str)
    error_occurred = Signal(str)

    def __init__(self, text: str = "", voice_config: dict = None):
        super().__init__()
        self.logger = Logger(__name__)
        self.text = text
        self.voice_config = voice_config or {}
        self.engine = None

    @Slot()
    def run(self):
        self.started.emit()
        try:
            if not self.text.strip():
                raise RuntimeError("TTS metni boş.")
            if not self.voice_config.get("enabled", True):
                self.logger.info("TTS kapalı; oynatma atlandı.")
                return

            engine_name = self.voice_config.get("engine", "edge_tts")
            if engine_name == "edge_tts":
                self.engine = EdgeTTSVoice(self.voice_config)
                self.playback_started.emit()
                self.engine.speak(self.text)
                self.playback_finished.emit()
            elif engine_name == "voicevox":
                manager = VoiceManager(self.voice_config)
                if not manager.synthesizer:
                    raise RuntimeError("VoiceVox bağlı değil veya ses sentezi kapalı.")
                self.playback_started.emit()
                if not manager.speak(self.text):
                    raise RuntimeError("VoiceVox oynatma başlatılamadı.")
                manager.player.wait_for_finish()
                self.playback_finished.emit()
            else:
                raise RuntimeError(f"Bilinmeyen ses motoru: {engine_name}")
        except Exception as exc:
            message = self._turkish_error(str(exc))
            self.logger.error(f"TTS error: {message}")
            self.error.emit(message)
            self.error_occurred.emit(message)
        finally:
            self.finished.emit()

    def stop(self):
        if self.engine and hasattr(self.engine, "stop"):
            self.engine.stop()

    def _turkish_error(self, message: str) -> str:
        lowered = message.lower()
        if "edge-tts" in lowered or "edge tts" in lowered:
            return message
        if "pygame" in lowered or "mixer" in lowered or "audio" in lowered:
            return f"Ses oynatma hatası: {message}"
        if "connect" in lowered or "network" in lowered or "internet" in lowered:
            return f"Edge TTS bağlantı hatası: internet bağlantısını kontrol et. Detay: {message}"
        return message
