"""Alice AI Ultra Pet application coordinator."""

import json
import uuid
from pathlib import Path

from PySide6.QtCore import QObject, QThread, QTimer, Signal
from PySide6.QtWidgets import QApplication

from ai.base import Message
from config.config_manager import ConfigManager
from core.database import Database
from core.logger import Logger
from core.state import AliceState
from engine.character_manager import CharacterManager
from engine.emotion_engine import EmotionEngine
from engine.outfit_manager import OutfitManager
from memory.conversation_store import ConversationStore, MemoryStore
from ui.main_window import AliceMainWindow
from ui.tray import create_tray
from voice.voice_manager import VoiceManager
from workers.ai_worker import AIWorker
from workers.tts_worker import TTSWorker


class AlicePetApp(QObject):
    """Main application class."""

    character_changed = Signal(str)
    outfit_changed = Signal(str)
    emotion_changed = Signal(str)
    provider_changed = Signal(str)

    SETTINGS_PATH = Path("data/settings.local.json")

    def __init__(self):
        super().__init__()
        self.logger = Logger(__name__)

        self.db = Database()
        self.config = ConfigManager()
        self.local_settings = self._load_local_settings()
        self.state = AliceState()

        self.character_manager = CharacterManager()
        self.emotion_engine = EmotionEngine(self.state)
        active_char = self.character_manager.active_character or "alice"
        self.outfit_manager = OutfitManager(active_char)

        voice_config = self._get_voice_config()
        self.voice_manager = VoiceManager(voice_config) if voice_config.get("engine") == "voicevox" else None
        self.conversation_store = ConversationStore(self.db)
        self.memory_store = MemoryStore(self.db)

        self.window = None
        self.pet_window = None
        self.tray = None
        self.active_ai_thread = None
        self.active_ai_worker = None
        self.active_tts_thread = None
        self.active_tts_worker = None
        self.previous_emotion = "idle"

        self.session_id = str(uuid.uuid4())
        self.conversation_id = None
        self.logger.info("AlicePetApp initialized")

    def _default_local_settings(self) -> dict:
        return {
            "ai": {
                "provider": "ollama",
                "base_url": "http://127.0.0.1:11434",
                "model": "qwen2.5:3b",
                "api_key": "",
                "temperature": 0.7,
                "max_tokens": 2048,
            },
            "pet": {
                "scale": 1.0,
                "always_on_top": True,
            },
            "voice": {
                "engine": "edge_tts",
                "enabled": True,
                "auto_speak": True,
                "voice": "tr-TR-EmelNeural",
                "rate": "-10%",
                "pitch": "+6Hz",
                "volume": "+8%",
                "base_url": "http://127.0.0.1:50021",
                "speaker": 47,
                "speed": 1.0,
            },
        }

    def _load_local_settings(self) -> dict:
        settings = self._default_local_settings()
        if not self.SETTINGS_PATH.exists():
            return settings
        try:
            loaded = json.loads(self.SETTINGS_PATH.read_text(encoding="utf-8"))
            self._merge_dict(settings, loaded)
            return settings
        except Exception as exc:
            self.logger.warning(f"Could not load local settings: {exc}")
            return settings

    def _merge_dict(self, base: dict, incoming: dict):
        for key, value in incoming.items():
            if isinstance(value, dict) and isinstance(base.get(key), dict):
                self._merge_dict(base[key], value)
            else:
                base[key] = value

    def save_local_settings(self):
        self.SETTINGS_PATH.parent.mkdir(parents=True, exist_ok=True)
        self.SETTINGS_PATH.write_text(
            json.dumps(self.local_settings, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

    def get_ai_config(self) -> dict:
        ai_config = dict(self.local_settings.get("ai", {}))
        legacy = self.db.get_memory("active_provider") if self.db else None
        if legacy and not self.SETTINGS_PATH.exists():
            try:
                old = json.loads(legacy)
                ai_config.update(
                    {
                        "provider": old.get("type", old.get("provider", ai_config.get("provider"))),
                        "base_url": old.get("base_url", ai_config.get("base_url")),
                        "api_key": old.get("api_key", ""),
                        "model": "qwen2.5:3b" if old.get("model") == "mistral" else old.get("model", ai_config.get("model")),
                        "temperature": old.get("temperature", ai_config.get("temperature", 0.7)),
                        "max_tokens": old.get("max_tokens", ai_config.get("max_tokens", 2048)),
                    }
                )
            except Exception:
                pass
        return ai_config

    def save_ai_config(self, ai_config: dict):
        normalized = {
            "provider": ai_config.get("provider") or ai_config.get("type") or "ollama",
            "base_url": ai_config.get("base_url", "http://127.0.0.1:11434").rstrip("/"),
            "model": ai_config.get("model", "qwen2.5:3b"),
            "api_key": ai_config.get("api_key", ""),
            "temperature": float(ai_config.get("temperature", 0.7)),
            "max_tokens": int(ai_config.get("max_tokens", 2048)),
        }
        self.local_settings["ai"] = normalized
        self.save_local_settings()
        if self.db:
            self.db.set_memory("active_provider", json.dumps({"type": normalized["provider"], **normalized}))

    def _get_voice_config(self) -> dict:
        voice = self.local_settings.get("voice", {})
        config = self.db.get_memory("voice_config")
        if config and not self.SETTINGS_PATH.exists():
            old = json.loads(config)
            voicevox = old.get("voicevox", {})
            voice.update(
                {
                    "enabled": voicevox.get("enabled", voice.get("enabled", True)),
                    "auto_speak": old.get("auto_speak", voice.get("auto_speak", True)),
                    "base_url": voicevox.get("base_url", voice.get("base_url", "http://127.0.0.1:50021")),
                    "speaker": voicevox.get("speaker", voice.get("speaker", 47)),
                    "speed": voicevox.get("speed", voice.get("speed", 1.0)),
                    "volume": old.get("volume", voice.get("volume", 1.0)),
                }
            )
        engine = voice.get("engine", "edge_tts")
        config = {
            "engine": engine,
            "enabled": bool(voice.get("enabled", True)),
            "auto_speak": bool(voice.get("auto_speak", True)),
            "voice": voice.get("voice", "tr-TR-EmelNeural"),
            "rate": voice.get("rate", "-10%"),
            "pitch": voice.get("pitch", "+6Hz"),
            "volume": voice.get("volume", "+8%"),
            "voicevox": {
                "base_url": voice.get("base_url", "http://127.0.0.1:50021"),
                "speaker": int(voice.get("speaker", 47)),
                "enabled": bool(voice.get("enabled", True)),
                "speed": float(voice.get("speed", 1.0)),
                "volume": self._numeric_volume(voice.get("volume", "+8%")),
            },
        }
        if engine == "voicevox":
            config["synthesizer"] = "voicevox"
            config["volume"] = self._numeric_volume(voice.get("volume", 1.0))
        return config

    def save_voice_config(self, voice_config: dict):
        self.local_settings["voice"] = {
            "engine": voice_config.get("engine", "edge_tts"),
            "enabled": bool(voice_config.get("enabled", True)),
            "auto_speak": bool(voice_config.get("auto_speak", True)),
            "voice": voice_config.get("voice", "tr-TR-EmelNeural"),
            "rate": voice_config.get("rate", "-10%"),
            "pitch": voice_config.get("pitch", "+6Hz"),
            "volume": voice_config.get("volume", "+8%"),
            "base_url": voice_config.get("base_url", "http://127.0.0.1:50021").rstrip("/"),
            "speaker": int(voice_config.get("speaker", 47)),
            "speed": float(voice_config.get("speed", 1.0)),
        }
        self.save_local_settings()
        normalized = self._get_voice_config()
        if self.db:
            self.db.set_memory("voice_config", json.dumps(normalized))
        self.voice_manager = VoiceManager(normalized) if normalized.get("engine") == "voicevox" else None

    def _numeric_volume(self, value) -> float:
        if isinstance(value, str) and value.endswith("%"):
            try:
                return max(0.0, min(1.0, 1.0 + float(value[:-1]) / 100.0))
            except ValueError:
                return 1.0
        try:
            return max(0.0, min(1.0, float(value)))
        except (TypeError, ValueError):
            return 1.0

    def _get_persona(self) -> str:
        persona_path = Path("config/persona.tr.txt")
        if persona_path.exists():
            return persona_path.read_text(encoding="utf-8", errors="replace")
        return "Sen Alice AI Ultra adlı kısa ve net konuşan masaüstü asistanısın."

    def start(self):
        self.conversation_id = self.conversation_store.create_conversation(
            session_id=self.session_id,
            character=self.character_manager.active_character or "alice",
            outfit=self.outfit_manager.current_outfit(),
            provider=self.get_ai_config().get("provider", "ollama"),
        )

        self.window = AliceMainWindow(self.state, self)
        self.window.show()
        self.tray = create_tray(self.window)
        self.logger.info("Application started in Studio Mode")

    def chat(self, user_message: str, use_streaming: bool = True):
        if not user_message.strip():
            return
        if self.active_ai_thread and self.active_ai_thread.isRunning():
            self._on_ai_error("AI request is already running. Please wait for the current response.")
            return

        try:
            if self.conversation_id:
                self.conversation_store.add_message("user", user_message, "idle")

            ai_config = self.get_ai_config()
            provider_type = ai_config.get("provider", "ollama")
            provider_config = {
                "base_url": ai_config.get("base_url", ""),
                "api_key": ai_config.get("api_key", ""),
                "model": ai_config.get("model", "qwen2.5:3b"),
                "temperature": ai_config.get("temperature", 0.7),
                "max_tokens": ai_config.get("max_tokens", 2048),
                "timeout": 120,
            }

            messages = [Message("user", user_message)]
            self.active_ai_thread = QThread()
            self.active_ai_worker = AIWorker(
                provider_type=provider_type,
                config=provider_config,
                messages=messages,
                system_prompt=self._get_persona(),
                use_streaming=use_streaming,
            )
            self.active_ai_worker.moveToThread(self.active_ai_thread)
            self.active_ai_thread.started.connect(self.active_ai_worker.run)
            self.active_ai_worker.started.connect(self._on_ai_started)
            self.active_ai_worker.partial_response.connect(self._on_ai_partial_response)
            self.active_ai_worker.response_received.connect(self._on_ai_response)
            self.active_ai_worker.error.connect(self._on_ai_error)
            self.active_ai_worker.finished.connect(self.active_ai_thread.quit)
            self.active_ai_worker.finished.connect(self.active_ai_worker.deleteLater)
            self.active_ai_thread.finished.connect(self._clear_ai_request)
            self.active_ai_thread.finished.connect(self.active_ai_thread.deleteLater)
            self.active_ai_thread.start()
        except Exception as exc:
            self._on_ai_error(str(exc))

    def _on_ai_started(self):
        self.state.is_talking = False
        if self.window and hasattr(self.window, "on_ai_started"):
            self.window.on_ai_started()

    def _on_ai_partial_response(self, chunk: str):
        if self.window and hasattr(self.window, "on_ai_partial_response"):
            self.window.on_ai_partial_response(chunk)

    def _on_ai_response(self, response: str):
        try:
            emotion = self.emotion_engine.detect_emotion(response)
            if self.conversation_id:
                self.conversation_store.add_message("assistant", response, emotion)

            self.state.emotion = emotion
            self.emotion_engine.set_emotion(emotion)

            if self.window:
                self.window.on_ai_response(response, emotion)

            voice_config = self._get_voice_config()
            if voice_config.get("enabled", True) and voice_config.get("auto_speak", True):
                self.speak_text(response)
            else:
                self.state.is_talking = False

            self.logger.debug(f"AI response processed (emotion: {emotion})")
        except Exception as exc:
            self.logger.error(f"Response processing error: {exc}")
            self._on_ai_error(str(exc))

    def _stop_talking(self):
        self.state.is_talking = False
        self.state.emotion = self.previous_emotion or "idle"

    def speak_text(self, text: str):
        voice_config = self._get_voice_config()
        if not voice_config.get("enabled", True):
            if self.window and hasattr(self.window, "refresh_status"):
                self.window.refresh_status()
            return
        if self.active_tts_thread and self.active_tts_thread.isRunning():
            return

        self.previous_emotion = self.state.emotion or "idle"
        self.active_tts_thread = QThread()
        self.active_tts_worker = TTSWorker(text=text, voice_config=voice_config)
        self.active_tts_worker.moveToThread(self.active_tts_thread)
        self.active_tts_thread.started.connect(self.active_tts_worker.run)
        self.active_tts_worker.playback_started.connect(self._on_tts_playback_started)
        self.active_tts_worker.error.connect(self._on_tts_error)
        self.active_tts_worker.finished.connect(self.active_tts_thread.quit)
        self.active_tts_worker.finished.connect(self.active_tts_worker.deleteLater)
        self.active_tts_thread.finished.connect(self._clear_tts_request)
        self.active_tts_thread.finished.connect(self.active_tts_thread.deleteLater)
        self.active_tts_thread.start()

    def _on_tts_playback_started(self):
        self.previous_emotion = self.state.emotion or "idle"
        self.state.emotion = "talk"
        self.state.is_talking = True
        if self.window and hasattr(self.window, "_set_emotion"):
            self.window._set_emotion("talk")

    def _on_tts_error(self, error_message: str):
        self.logger.error(f"TTS error: {error_message}")
        self._stop_talking()
        if self.window and hasattr(self.window, "set_voice_status"):
            self.window.set_voice_status(False, error_message)

    def _clear_tts_request(self):
        self._stop_talking()
        if self.window and hasattr(self.window, "_set_emotion"):
            self.window._set_emotion(self.state.emotion)
        self.active_tts_thread = None
        self.active_tts_worker = None
        if self.window and hasattr(self.window, "refresh_status"):
            self.window.refresh_status()

    def _on_ai_error(self, error_message: str):
        self.state.is_talking = False
        self.logger.error(f"AI error: {error_message}")
        if self.window:
            self.window.on_ai_error(error_message)

    def _clear_ai_request(self):
        self.active_ai_thread = None
        self.active_ai_worker = None
        if self.window and hasattr(self.window, "on_ai_finished"):
            self.window.on_ai_finished()

    def open_pet_mode(self):
        if self.pet_window is None:
            from ui.pet_window import PetWindow

            self.pet_window = PetWindow(self.state, self)
        self.pet_window.show()
        self.pet_window.raise_()
        if self.window:
            self.window.hide()

    def open_studio(self):
        if self.window:
            self.window.show()
            self.window.raise_()
            self.window.activateWindow()

    def open_chat(self):
        self.open_studio()
        if self.window and hasattr(self.window, "focus_chat"):
            self.window.focus_chat()

    def quit_application(self):
        if self.pet_window:
            self.pet_window.close()
        if self.window:
            self.window.close()
        self.shutdown()
        QApplication.quit()

    def shutdown(self):
        if self.conversation_id:
            try:
                self.conversation_store.close_conversation()
            except Exception:
                pass
            self.conversation_id = None

        if self.active_ai_thread and self.active_ai_thread.isRunning():
            self.active_ai_thread.quit()
            self.active_ai_thread.wait(5000)

        if self.active_tts_thread and self.active_tts_thread.isRunning():
            self.active_tts_thread.quit()
            self.active_tts_thread.wait(5000)

        if self.db:
            self.db.close()

        self.logger.info("Application shutdown")
