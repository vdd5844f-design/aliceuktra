"""Audio playback through pygame for VoiceVox WAV bytes."""

import tempfile
import time
from pathlib import Path
from typing import Callable, Optional

from core.logger import Logger

try:
    import pygame

    AUDIO_AVAILABLE = True
except ImportError:
    pygame = None
    AUDIO_AVAILABLE = False


class AudioPlayer:
    """Play WAV bytes using pygame.mixer."""

    def __init__(self):
        self.logger = Logger(__name__)
        self.is_playing = False
        self.on_finish = None
        self.volume = 1.0
        self._initialized = False
        self._current_file: Optional[Path] = None

    def _ensure_initialized(self):
        if not AUDIO_AVAILABLE:
            raise RuntimeError("pygame is not installed; audio playback is unavailable.")
        if not self._initialized:
            pygame.mixer.init()
            self._initialized = True

    def play(self, audio_bytes: bytes, callback: Optional[Callable] = None, volume: float = None) -> bool:
        if not audio_bytes:
            return False

        self._ensure_initialized()
        self.stop()
        self.on_finish = callback
        if volume is not None:
            self.volume = max(0.0, min(1.0, float(volume)))

        cache_dir = Path("data/audio_cache")
        cache_dir.mkdir(parents=True, exist_ok=True)
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".wav", dir=str(cache_dir))
        tmp.write(audio_bytes)
        tmp.close()
        self._current_file = Path(tmp.name)

        pygame.mixer.music.load(str(self._current_file))
        pygame.mixer.music.set_volume(self.volume)
        pygame.mixer.music.play()
        self.is_playing = True
        return True

    def wait_for_finish(self) -> bool:
        if not AUDIO_AVAILABLE or not self._initialized:
            return False

        try:
            while pygame.mixer.music.get_busy():
                time.sleep(0.05)
            self.is_playing = False
            if self.on_finish:
                self.on_finish()
            self._cleanup_current_file()
            return True
        except Exception as exc:
            self.logger.error(f"Audio wait error: {exc}")
            self.is_playing = False
            return False

    def stop(self):
        if AUDIO_AVAILABLE and self._initialized:
            try:
                pygame.mixer.music.stop()
            except Exception as exc:
                self.logger.error(f"Stop playback error: {exc}")
        self.is_playing = False

    def is_playing_audio(self) -> bool:
        if AUDIO_AVAILABLE and self._initialized:
            self.is_playing = bool(pygame.mixer.music.get_busy())
        return self.is_playing

    def _cleanup_current_file(self):
        if self._current_file and self._current_file.exists():
            try:
                self._current_file.unlink()
            except Exception:
                pass
        self._current_file = None
