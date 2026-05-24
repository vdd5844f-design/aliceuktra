"""Microsoft Edge TTS voice engine for Alice."""

import asyncio
import tempfile
import time
from pathlib import Path

from core.logger import Logger

try:
    import edge_tts
except ImportError:
    edge_tts = None

try:
    import pygame
except ImportError:
    pygame = None


class EdgeTTSVoice:
    """Generate MP3 with edge-tts and play it with pygame."""

    def __init__(self, config: dict = None):
        self.config = config or {}
        self.logger = Logger(__name__)
        self.voice = self.config.get("voice", "tr-TR-EmelNeural")
        self.rate = self.config.get("rate", "-10%")
        self.pitch = self.config.get("pitch", "+6Hz")
        self.volume = self.config.get("volume", "+8%")
        self.enabled = self.config.get("enabled", True)
        self._pygame_ready = False

    def is_available(self) -> bool:
        return edge_tts is not None and pygame is not None

    def speak(self, text: str) -> bool:
        if not self.enabled:
            raise RuntimeError("Edge TTS kapalı.")
        if not text.strip():
            raise RuntimeError("Konuşma metni boş.")
        if edge_tts is None:
            raise RuntimeError("edge-tts kurulu değil. Komut: pip install edge-tts")
        if pygame is None:
            raise RuntimeError("pygame kurulu değil. Komut: pip install pygame")

        output = self._make_output_path()
        try:
            asyncio.run(self._generate_mp3(text, output))
            if not output.exists() or output.stat().st_size == 0:
                raise RuntimeError("Edge TTS MP3 dosyası oluşturamadı.")
            self._play_mp3(output)
            return True
        finally:
            try:
                output.unlink(missing_ok=True)
            except Exception:
                pass

    async def _generate_mp3(self, text: str, output: Path):
        communicate = edge_tts.Communicate(
            text=text,
            voice=self.voice,
            rate=self.rate,
            pitch=self.pitch,
            volume=self.volume,
        )
        await communicate.save(str(output))

    def _play_mp3(self, path: Path):
        self._ensure_pygame()
        try:
            pygame.mixer.music.load(str(path))
            pygame.mixer.music.play()
            while pygame.mixer.music.get_busy():
                time.sleep(0.03)
        except Exception as exc:
            raise RuntimeError(f"pygame playback hatası: {exc}") from exc
        finally:
            try:
                pygame.mixer.music.unload()
            except Exception:
                pass

    def stop(self):
        if pygame is not None and self._pygame_ready:
            pygame.mixer.music.stop()

    def _ensure_pygame(self):
        if self._pygame_ready:
            return
        try:
            pygame.mixer.init()
            self._pygame_ready = True
        except Exception as exc:
            raise RuntimeError(f"pygame ses çıkışı başlatılamadı: {exc}") from exc

    def _make_output_path(self) -> Path:
        cache_dir = Path("data/audio_cache")
        cache_dir.mkdir(parents=True, exist_ok=True)
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".mp3", dir=str(cache_dir))
        tmp.close()
        return Path(tmp.name)
