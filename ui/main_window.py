"""Modern Turkish Studio UI for Alice AI Ultra."""

import html
from datetime import datetime

from PySide6.QtCore import Qt, QTimer, Signal
from PySide6.QtGui import QPixmap, QTextCursor
from PySide6.QtWidgets import (
    QCheckBox,
    QComboBox,
    QDialog,
    QDoubleSpinBox,
    QGridLayout,
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QMainWindow,
    QMenu,
    QMessageBox,
    QSpinBox,
    QTabWidget,
    QTextEdit,
    QVBoxLayout,
    QWidget,
)

from ai.ollama_provider import OllamaProvider
from core.logger import Logger
from engine.asset_scanner import EMOTIONS
from engine.character_manager import CharacterManager
from engine.outfit_manager import OutfitManager
from engine.sprite_animator import SpriteAnimator
from ui.modern_widgets import GlassPanel, IconButton, ModernButton
from ui.theme import get_stylesheet


EMOTION_LABELS = {
    "idle": "Sakin",
    "talk": "Konuşma",
    "happy": "Mutlu",
    "angry": "Kızgın",
    "sleep": "Uyku",
    "move": "Hareket",
}


class ChatInput(QTextEdit):
    send_requested = Signal()

    def __init__(self):
        super().__init__()
        self.setObjectName("messageInput")
        self.setAcceptRichText(False)
        self.setPlaceholderText("Alice’e mesaj yaz...")
        self.setMinimumHeight(72)
        self.setMaximumHeight(110)

    def keyPressEvent(self, event):
        if event.key() in (Qt.Key_Return, Qt.Key_Enter) and not (event.modifiers() & Qt.ShiftModifier):
            self.send_requested.emit()
            event.accept()
            return
        super().keyPressEvent(event)


class SpriteDisplayWidget(QWidget):
    metadata_changed = Signal(str, int, str)

    def __init__(self):
        super().__init__()
        self.logger = Logger(__name__)
        self.animator = None
        self.current_emotion = "idle"
        self.current_outfit = "default"

        self.sprite_label = QLabel()
        self.sprite_label.setAlignment(Qt.AlignCenter)
        self.sprite_label.setMinimumSize(420, 520)

        self.error_label = QLabel()
        self.error_label.setWordWrap(True)
        self.error_label.setStyleSheet("color: #ff6b6b;")
        self.error_label.setVisible(False)

        layout = QVBoxLayout()
        layout.setContentsMargins(18, 18, 18, 18)
        layout.addStretch()
        layout.addWidget(self.sprite_label, 0, Qt.AlignCenter)
        layout.addWidget(self.error_label)
        layout.addStretch()
        self.setLayout(layout)

        self.animation_timer = QTimer()
        self.animation_timer.timeout.connect(self._update_frame)
        self.animation_timer.start(100)

    def set_animator(self, animator: SpriteAnimator):
        self.animator = animator

    def show_sprite(self, emotion: str = "idle", outfit: str = "default"):
        if not self.animator:
            self._show_error("Animasyon sistemi başlatılamadı.")
            return

        self.current_emotion = emotion or "idle"
        self.current_outfit = outfit or "default"
        pixmap = self.animator.get_next_frame(self.current_emotion, self.current_outfit)
        if pixmap and not pixmap.isNull():
            scaled = pixmap.scaled(520, 620, Qt.KeepAspectRatio, Qt.SmoothTransformation)
            self.sprite_label.setPixmap(scaled)
            self.error_label.setVisible(False)
            self.metadata_changed.emit(
                self.animator.last_sprite_path,
                self.animator.get_current_frame_count(self.current_emotion, self.current_outfit),
                self.animator.last_fallback_info,
            )
            return
        self._show_error(self.animator.last_fallback_info or "Yüklenebilir görsel bulunamadı.")

    def _update_frame(self):
        if self.animator:
            self.show_sprite(self.current_emotion, self.current_outfit)

    def _show_error(self, message: str):
        self.sprite_label.setPixmap(QPixmap())
        self.error_label.setText(message)
        self.error_label.setVisible(True)


class SettingsDialog(QDialog):
    settings_changed = Signal()

    def __init__(self, parent=None, app=None):
        super().__init__(parent)
        self.app = app
        self.parent_window = parent
        self.logger = Logger(__name__)
        self.setWindowTitle("Ayarlar")
        self.setMinimumSize(920, 650)
        self.setStyleSheet(get_stylesheet())

        self.tabs = QTabWidget()
        self.tabs.setTabPosition(QTabWidget.West)
        self._create_general_tab()
        self._create_character_tab()
        self._create_outfit_tab()
        self._create_ai_tab()
        self._create_voice_tab()
        self._create_animation_tab()
        self._create_memory_tab()
        self._create_developer_tab()
        self._load_saved_settings()
        self._refresh_developer_info()

        save_btn = ModernButton("Kaydet ve Kapat", "spark")
        save_btn.clicked.connect(self._save_settings)
        cancel_btn = ModernButton("Vazgeç", "close", "ghost")
        cancel_btn.clicked.connect(self.close)

        buttons = QHBoxLayout()
        buttons.addStretch()
        buttons.addWidget(cancel_btn)
        buttons.addWidget(save_btn)

        layout = QVBoxLayout()
        layout.setContentsMargins(18, 18, 18, 18)
        layout.addWidget(self.tabs)
        layout.addLayout(buttons)
        self.setLayout(layout)

    def _card(self, title: str):
        panel = GlassPanel("commandCard")
        layout = QVBoxLayout()
        layout.setContentsMargins(18, 18, 18, 18)
        heading = QLabel(title)
        heading.setStyleSheet("font-size: 18px; font-weight: 800; color: #00e5ff;")
        layout.addWidget(heading)
        panel.setLayout(layout)
        return panel, layout

    def _create_general_tab(self):
        widget = QWidget()
        root = QVBoxLayout()
        panel, layout = self._card("Genel")
        layout.addWidget(QLabel("Alice AI Ultra çalışma ayarları yerel olarak saklanır."))
        if self.app and hasattr(self.app, "SETTINGS_PATH"):
            path = QLineEdit(str(self.app.SETTINGS_PATH))
            path.setReadOnly(True)
            layout.addWidget(QLabel("Yerel ayar dosyası"))
            layout.addWidget(path)
        root.addWidget(panel)
        root.addStretch()
        widget.setLayout(root)
        self.tabs.addTab(widget, "Genel")

    def _create_character_tab(self):
        widget = QWidget()
        root = QVBoxLayout()
        panel, layout = self._card("Karakter")
        self.char_combo = QComboBox()
        self.char_combo.currentIndexChanged.connect(self._on_character_changed)
        reload_btn = ModernButton("Varlıkları Yenile", "refresh", "ghost")
        reload_btn.clicked.connect(self._reload_characters)
        self.char_info = QTextEdit()
        self.char_info.setReadOnly(True)
        layout.addWidget(QLabel("Aktif karakter"))
        layout.addWidget(self.char_combo)
        layout.addWidget(reload_btn)
        layout.addWidget(self.char_info)
        root.addWidget(panel)
        widget.setLayout(root)
        self.tabs.addTab(widget, "Karakter")
        self._reload_characters()

    def _create_outfit_tab(self):
        widget = QWidget()
        root = QVBoxLayout()
        panel, layout = self._card("Kıyafet")
        self.outfit_combo = QComboBox()
        self.outfit_combo.currentIndexChanged.connect(self._on_outfit_changed)
        self.random_daily_cb = QCheckBox("Günlük rastgele kıyafet")
        random_btn = ModernButton("Şimdi Rastgele Seç", "spark", "ghost")
        random_btn.clicked.connect(self._random_outfit_now)
        self.current_outfit_label = QLabel("default")
        layout.addWidget(QLabel("Kıyafet seçimi"))
        layout.addWidget(self.outfit_combo)
        layout.addWidget(self.random_daily_cb)
        layout.addWidget(random_btn)
        layout.addWidget(QLabel("Geçerli kıyafet"))
        layout.addWidget(self.current_outfit_label)
        root.addWidget(panel)
        root.addStretch()
        widget.setLayout(root)
        self.tabs.addTab(widget, "Kıyafet")
        self._reload_outfits()

    def _create_ai_tab(self):
        widget = QWidget()
        root = QVBoxLayout()
        panel, layout = self._card("Yapay Zekâ")
        self.provider_combo = QComboBox()
        for label, value in [
            ("Ollama", "ollama"),
            ("OpenAI uyumlu", "openai"),
            ("Anthropic", "anthropic"),
            ("Gemini", "gemini"),
            ("OpenRouter", "openrouter"),
        ]:
            self.provider_combo.addItem(label, value)
        self.base_url_edit = QLineEdit("http://127.0.0.1:11434")
        self.api_key_edit = QLineEdit()
        self.api_key_edit.setEchoMode(QLineEdit.Password)
        self.model_edit = QLineEdit("qwen2.5:3b")
        self.temp_spinbox = QDoubleSpinBox()
        self.temp_spinbox.setRange(0.0, 2.0)
        self.temp_spinbox.setSingleStep(0.1)
        self.temp_spinbox.setValue(0.7)
        self.tokens_spinbox = QSpinBox()
        self.tokens_spinbox.setRange(1, 32000)
        self.tokens_spinbox.setValue(2048)
        for label, item in [
            ("Sağlayıcı", self.provider_combo),
            ("API adresi", self.base_url_edit),
            ("API anahtarı", self.api_key_edit),
            ("Model", self.model_edit),
            ("Sıcaklık", self.temp_spinbox),
            ("Maksimum token", self.tokens_spinbox),
        ]:
            layout.addWidget(QLabel(label))
            layout.addWidget(item)
        test_btn = ModernButton("Bağlantıyı Test Et", "refresh")
        test_btn.clicked.connect(self._test_ai_connection)
        self.test_result = QLabel("")
        self.test_result.setWordWrap(True)
        layout.addWidget(test_btn)
        layout.addWidget(self.test_result)
        root.addWidget(panel)
        widget.setLayout(root)
        self.tabs.addTab(widget, "Yapay Zekâ")

    def _create_voice_tab(self):
        widget = QWidget()
        root = QVBoxLayout()
        panel, layout = self._card("Ses")
        self.voice_engine_combo = QComboBox()
        self.voice_engine_combo.addItem("Edge TTS", "edge_tts")
        self.voice_engine_combo.addItem("VoiceVox", "voicevox")
        self.voice_enabled_cb = QCheckBox("Ses etkin")
        self.auto_speak_cb = QCheckBox("Otomatik konuş")
        self.edge_voice_edit = QLineEdit("tr-TR-EmelNeural")
        self.edge_rate_edit = QLineEdit("-10%")
        self.edge_pitch_edit = QLineEdit("+6Hz")
        self.edge_volume_edit = QLineEdit("+8%")
        self.voicevox_url_edit = QLineEdit("http://127.0.0.1:50021")
        self.speaker_spinbox = QSpinBox()
        self.speaker_spinbox.setRange(0, 999)
        self.speaker_spinbox.setValue(47)
        self.voice_volume_spinbox = QDoubleSpinBox()
        self.voice_volume_spinbox.setRange(0.0, 1.0)
        self.voice_volume_spinbox.setSingleStep(0.05)
        self.voice_volume_spinbox.setValue(1.0)
        layout.addWidget(self.voice_enabled_cb)
        layout.addWidget(self.auto_speak_cb)
        for label, item in [
            ("Ses motoru", self.voice_engine_combo),
            ("Ses", self.edge_voice_edit),
            ("Konuşma hızı", self.edge_rate_edit),
            ("Pitch", self.edge_pitch_edit),
            ("Ses seviyesi", self.edge_volume_edit),
            ("VoiceVox adresi", self.voicevox_url_edit),
            ("Konuşmacı ID", self.speaker_spinbox),
            ("VoiceVox ses seviyesi", self.voice_volume_spinbox),
        ]:
            layout.addWidget(QLabel(label))
            layout.addWidget(item)
        test_btn = ModernButton("Test Sesi", "voice")
        test_btn.clicked.connect(self._test_voice)
        layout.addWidget(test_btn)
        root.addWidget(panel)
        widget.setLayout(root)
        self.tabs.addTab(widget, "Ses")

    def _create_animation_tab(self):
        widget = QWidget()
        root = QVBoxLayout()
        panel, layout = self._card("Animasyon")
        self.animation_mode_combo = QComboBox()
        self.animation_mode_combo.addItem("Otomatik", "auto")
        self.animation_mode_combo.addItem("Sabit ifade", "static_expression")
        self.animation_mode_combo.addItem("Kare animasyonu", "frame_animation")
        layout.addWidget(QLabel("Animasyon modu"))
        layout.addWidget(self.animation_mode_combo)
        layout.addWidget(QLabel("Kare klasörleri animasyon oynatır; ifade paketleri sabit görsel seçer."))
        root.addWidget(panel)
        root.addStretch()
        widget.setLayout(root)
        self.tabs.addTab(widget, "Animasyon")

    def _create_memory_tab(self):
        widget = QWidget()
        root = QVBoxLayout()
        panel, layout = self._card("Hafıza")
        self.memory_view = QTextEdit()
        self.memory_view.setReadOnly(True)
        if self.app and getattr(self.app, "memory_store", None):
            memories = self.app.memory_store.list_memories()
            self.memory_view.setText("\n".join(f"{m.get('key')}: {m.get('value')}" for m in memories))
        layout.addWidget(self.memory_view)
        root.addWidget(panel)
        widget.setLayout(root)
        self.tabs.addTab(widget, "Hafıza")

    def _create_developer_tab(self):
        widget = QWidget()
        root = QVBoxLayout()
        panel, layout = self._card("Geliştirici")
        self.assets_root_label = QLineEdit()
        self.assets_root_label.setReadOnly(True)
        self.asset_counts_label = QLabel("")
        self.last_sprite_path_label = QLineEdit()
        self.last_sprite_path_label.setReadOnly(True)
        self.fallback_info_label = QLabel("")
        self.fallback_info_label.setWordWrap(True)
        self.selected_frame_list = QTextEdit()
        self.selected_frame_list.setReadOnly(True)
        for label, item in [
            ("Varlık kök yolu", self.assets_root_label),
            ("Son yüklenen görsel", self.last_sprite_path_label),
        ]:
            layout.addWidget(QLabel(label))
            layout.addWidget(item)
        layout.addWidget(QLabel("Sayaçlar"))
        layout.addWidget(self.asset_counts_label)
        layout.addWidget(QLabel("Fallback bilgisi"))
        layout.addWidget(self.fallback_info_label)
        layout.addWidget(QLabel("Seçili kıyafet kare listesi"))
        layout.addWidget(self.selected_frame_list)
        refresh_btn = ModernButton("Bilgileri Yenile", "refresh", "ghost")
        refresh_btn.clicked.connect(self._refresh_developer_info)
        clear_btn = ModernButton("Görsel Önbelleğini Temizle", "refresh", "ghost")
        clear_btn.clicked.connect(self._clear_sprite_cache)
        layout.addWidget(refresh_btn)
        layout.addWidget(clear_btn)
        root.addWidget(panel)
        widget.setLayout(root)
        self.tabs.addTab(widget, "Geliştirici")

    def _on_character_changed(self):
        char_id = self.char_combo.currentData()
        if not self.app or not char_id:
            return
        char_info = self.app.character_manager.get_character(char_id)
        if char_info:
            outfits = self.app.character_manager.get_character_outfits(char_id)
            self.char_info.setText(
                f"Ad: {char_info.get('name', char_id)}\n"
                f"Kimlik: {char_id}\n"
                f"Yol: {char_info.get('path', '')}\n"
                f"Varsayılan kıyafet: {char_info.get('default_outfit', 'default')}\n"
                f"PNG sayısı: {char_info.get('png_count', 0)}\n"
                f"Kıyafetler ({len(outfits)}): {', '.join(outfits)}"
            )
        self._reload_outfits(char_id)
        self._refresh_developer_info()

    def _on_outfit_changed(self):
        self.current_outfit_label.setText(self.outfit_combo.currentText())
        self._refresh_developer_info()

    def _reload_characters(self):
        if not self.app:
            return
        self.app.character_manager.reload_characters()
        self.char_combo.blockSignals(True)
        self.char_combo.clear()
        for char_id, char_info in sorted(self.app.character_manager.characters.items()):
            self.char_combo.addItem(char_info.get("name", char_id.title()), char_id)
        active = self.app.character_manager.active_character
        if active:
            idx = self.char_combo.findData(active)
            if idx >= 0:
                self.char_combo.setCurrentIndex(idx)
        self.char_combo.blockSignals(False)
        self._on_character_changed()

    def _reload_outfits(self, char_id: str = None):
        if not self.app:
            return
        char_id = char_id or self.app.character_manager.active_character
        outfits = self.app.character_manager.get_character_outfits(char_id)
        self.outfit_combo.blockSignals(True)
        self.outfit_combo.clear()
        self.outfit_combo.addItems(outfits)
        self.outfit_combo.blockSignals(False)
        if outfits:
            self.current_outfit_label.setText(outfits[0])

    def _random_outfit_now(self):
        if not self.app:
            return
        outfit = OutfitManager(self.app.character_manager.active_character or "alice").pick_daily_outfit()
        self.current_outfit_label.setText(outfit)
        index = self.outfit_combo.findText(outfit)
        if index >= 0:
            self.outfit_combo.setCurrentIndex(index)

    def _test_ai_connection(self):
        self.test_result.setText("Bağlantı test ediliyor...")
        self.test_result.setStyleSheet("color: #94a3b8;")
        try:
            client = OllamaProvider(
                {
                    "base_url": self.base_url_edit.text().rstrip("/"),
                    "model": self.model_edit.text().strip() or "qwen2.5:3b",
                    "temperature": self.temp_spinbox.value(),
                    "max_tokens": min(self.tokens_spinbox.value(), 128),
                    "timeout": 120,
                }
            )
            self.test_result.setText(client.test_connection())
            self.test_result.setStyleSheet("color: #00ff99;")
            if hasattr(self.parent_window, "ai_status_label"):
                self.parent_window.ai_status_label.setText("Yapay zekâ: bağlı")
        except Exception as exc:
            self.test_result.setText(f"Bağlantı hatası: {exc}")
            self.test_result.setStyleSheet("color: #ff6b6b;")
            if hasattr(self.parent_window, "ai_status_label"):
                self.parent_window.ai_status_label.setText("Yapay zekâ: hata")

    def _test_voice(self):
        if not self.app or not hasattr(self.app, "speak_text"):
            QMessageBox.warning(self, "Ses", "Ses sistemi hazır değil.")
            return
        self._save_voice_config_only()
        self.app.speak_text("Merhaba Ertu, ben Alice. Bugün ne yapmak istiyorsun?")

    def _save_voice_config_only(self):
        if hasattr(self.app, "save_voice_config"):
            self.app.save_voice_config(
                {
                    "engine": self.voice_engine_combo.currentData() or "edge_tts",
                    "enabled": self.voice_enabled_cb.isChecked(),
                    "auto_speak": self.auto_speak_cb.isChecked(),
                    "voice": self.edge_voice_edit.text().strip() or "tr-TR-EmelNeural",
                    "rate": self.edge_rate_edit.text().strip() or "-10%",
                    "pitch": self.edge_pitch_edit.text().strip() or "+6Hz",
                    "volume": self.edge_volume_edit.text().strip() or "+8%",
                    "base_url": self.voicevox_url_edit.text(),
                    "speaker": self.speaker_spinbox.value(),
                    "speed": 1.0,
                }
            )

    def _clear_sprite_cache(self):
        animator = getattr(self.parent_window, "sprite_animator", None)
        if animator:
            animator.clear_cache()
        self._refresh_developer_info()

    def _save_settings(self):
        if not self.app:
            self.close()
            return
        if hasattr(self.app, "save_ai_config"):
            self.app.save_ai_config(
                {
                    "provider": self.provider_combo.currentData() or "ollama",
                    "base_url": self.base_url_edit.text(),
                    "api_key": self.api_key_edit.text(),
                    "model": self.model_edit.text(),
                    "temperature": self.temp_spinbox.value(),
                    "max_tokens": self.tokens_spinbox.value(),
                }
            )
        self._save_voice_config_only()
        animator = getattr(self.parent_window, "sprite_animator", None)
        if animator:
            animator.set_animation_mode(self.animation_mode_combo.currentData() or "auto")
        self.settings_changed.emit()
        self.close()

    def _load_saved_settings(self):
        if not self.app:
            return
        ai_config = self.app.get_ai_config() if hasattr(self.app, "get_ai_config") else {}
        if ai_config:
            index = self.provider_combo.findData(ai_config.get("provider", "ollama"))
            if index >= 0:
                self.provider_combo.setCurrentIndex(index)
            self.base_url_edit.setText(ai_config.get("base_url", "http://127.0.0.1:11434"))
            self.api_key_edit.setText(ai_config.get("api_key", ""))
            self.model_edit.setText(ai_config.get("model", "qwen2.5:3b"))
            self.temp_spinbox.setValue(ai_config.get("temperature", 0.7))
            self.tokens_spinbox.setValue(ai_config.get("max_tokens", 2048))
        voice_config = self.app._get_voice_config() if hasattr(self.app, "_get_voice_config") else {}
        if voice_config:
            voicevox = voice_config.get("voicevox", {})
            engine_index = self.voice_engine_combo.findData(voice_config.get("engine", "edge_tts"))
            if engine_index >= 0:
                self.voice_engine_combo.setCurrentIndex(engine_index)
            self.voice_enabled_cb.setChecked(voice_config.get("enabled", voicevox.get("enabled", True)))
            self.auto_speak_cb.setChecked(voice_config.get("auto_speak", True))
            self.edge_voice_edit.setText(voice_config.get("voice", "tr-TR-EmelNeural"))
            self.edge_rate_edit.setText(voice_config.get("rate", "-10%"))
            self.edge_pitch_edit.setText(voice_config.get("pitch", "+6Hz"))
            self.edge_volume_edit.setText(str(voice_config.get("volume", "+8%")))
            self.voicevox_url_edit.setText(voicevox.get("base_url", "http://127.0.0.1:50021"))
            self.speaker_spinbox.setValue(int(voicevox.get("speaker", 47)))
            self.voice_volume_spinbox.setValue(float(voicevox.get("volume", 1.0)))

    def _refresh_developer_info(self):
        scanner = getattr(getattr(self.app, "character_manager", None), "scanner", None)
        if not scanner:
            return
        char_id = self.char_combo.currentData() if hasattr(self, "char_combo") else None
        outfit_id = self.outfit_combo.currentText() if hasattr(self, "outfit_combo") else None
        debug = scanner.get_debug_summary(char_id, outfit_id)
        self.assets_root_label.setText(debug["assets_root"])
        self.asset_counts_label.setText(
            f"PNG: {debug['png_count']} | Karakter: {debug['character_count']} | Kıyafet: {debug['outfit_count']}"
        )
        animator = getattr(self.parent_window, "sprite_animator", None)
        self.last_sprite_path_label.setText(getattr(animator, "last_sprite_path", ""))
        self.fallback_info_label.setText(getattr(animator, "last_fallback_info", "") or debug["last_fallback_info"])
        self.selected_frame_list.setText("\n".join(debug["selected_outfit_frames"]))


class AliceMainWindow(QMainWindow):
    def __init__(self, state, app):
        super().__init__()
        self.state = state
        self.app = app
        self.logger = Logger(__name__)
        self.current_emotion = "idle"
        self.streaming_response_active = False
        self.streaming_response_text = ""

        self.setWindowTitle("Alice AI Ultra")
        self.setMinimumSize(1180, 760)
        self.setStyleSheet(get_stylesheet())

        self.character_manager = getattr(app, "character_manager", None) or CharacterManager()
        active_char = self.character_manager.active_character or "alice"
        self.outfit_manager = OutfitManager(active_char)
        if self.app:
            self.app.character_manager = self.character_manager
            self.app.outfit_manager = self.outfit_manager

        self.sprite_animator = SpriteAnimator(active_char, self.state, self.outfit_manager)
        if self.app:
            self.app.sprite_animator = self.sprite_animator

        self._build_ui()
        self._build_status_bar()
        self._load_characters()

        self.status_timer = QTimer()
        self.status_timer.timeout.connect(self.refresh_status)
        self.status_timer.start(1000)

        self.setContextMenuPolicy(Qt.CustomContextMenu)
        self.customContextMenuRequested.connect(self._show_context_menu)

    def _build_ui(self):
        root = QWidget()
        outer = QVBoxLayout()
        outer.setContentsMargins(20, 18, 20, 18)
        outer.setSpacing(16)

        outer.addWidget(self._build_topbar())

        body = QHBoxLayout()
        body.setSpacing(16)

        preview = GlassPanel("previewPanel")
        preview_layout = QVBoxLayout()
        preview_layout.setContentsMargins(18, 18, 18, 18)
        preview_header = QHBoxLayout()
        title = QLabel("Karakter Vitrini")
        title.setStyleSheet("font-size: 20px; font-weight: 800;")
        self.sprite_path_compact = QLabel("")
        self.sprite_path_compact.setProperty("muted", True)
        preview_header.addWidget(title)
        preview_header.addStretch()
        preview_header.addWidget(self.sprite_path_compact)
        self.sprite_display = SpriteDisplayWidget()
        self.sprite_display.set_animator(self.sprite_animator)
        self.sprite_display.metadata_changed.connect(self._on_sprite_metadata)
        preview_layout.addLayout(preview_header)
        preview_layout.addWidget(self.sprite_display, 1)
        preview.setLayout(preview_layout)
        body.addWidget(preview, 5)

        chat = GlassPanel("chatPanel")
        chat_layout = QVBoxLayout()
        chat_layout.setContentsMargins(18, 18, 18, 18)
        chat_layout.setSpacing(14)
        chat_header = QHBoxLayout()
        chat_title = QLabel("Sohbet")
        chat_title.setStyleSheet("font-size: 20px; font-weight: 800;")
        self.connection_badge = QLabel("Bağlantı bekliyor")
        self.connection_badge.setObjectName("badge")
        chat_header.addWidget(chat_title)
        chat_header.addStretch()
        chat_header.addWidget(self.connection_badge)
        self.chat_display = QTextEdit()
        self.chat_display.setObjectName("chatView")
        self.chat_display.setReadOnly(True)
        self.chat_input = ChatInput()
        self.chat_input.send_requested.connect(self._send_chat)
        self.send_btn = ModernButton("Gönder", "send")
        self.send_btn.clicked.connect(self._send_chat)
        input_row = QHBoxLayout()
        input_row.setSpacing(10)
        input_row.addWidget(self.chat_input, 1)
        input_row.addWidget(self.send_btn)
        chat_layout.addLayout(chat_header)
        chat_layout.addWidget(self.chat_display, 1)
        chat_layout.addLayout(input_row)
        chat.setLayout(chat_layout)
        body.addWidget(chat, 6)
        outer.addLayout(body, 1)

        outer.addWidget(self._build_quickbar())
        root.setLayout(outer)
        self.setCentralWidget(root)

    def _build_topbar(self):
        bar = GlassPanel("topBar")
        layout = QHBoxLayout()
        layout.setContentsMargins(18, 12, 18, 12)
        layout.setSpacing(12)
        logo = QLabel("Alice AI Ultra")
        logo.setObjectName("logoTitle")
        self.active_character_badge = QLabel("Karakter: -")
        self.active_character_badge.setObjectName("badge")
        self.active_outfit_badge = QLabel("Kıyafet: -")
        self.active_outfit_badge.setObjectName("badge")
        self.provider_badge = QLabel("Sağlayıcı: -")
        self.provider_badge.setObjectName("badge")
        self.model_badge = QLabel("Model: -")
        self.model_badge.setObjectName("badge")
        self.ai_status_badge = QLabel("Yapay zekâ: beklemede")
        self.ai_status_badge.setObjectName("badge")
        pet_btn = ModernButton("Pet Modu", "pet", "ghost")
        pet_btn.clicked.connect(self._switch_to_pet_mode)
        settings_btn = IconButton("settings", "Ayarlar")
        settings_btn.clicked.connect(self._open_settings)
        minimize_btn = IconButton("minimize", "Küçült")
        minimize_btn.clicked.connect(self.showMinimized)
        close_btn = IconButton("close", "Kapat")
        close_btn.clicked.connect(self.close)
        layout.addWidget(logo)
        layout.addWidget(self.active_character_badge)
        layout.addWidget(self.active_outfit_badge)
        layout.addStretch()
        layout.addWidget(self.provider_badge)
        layout.addWidget(self.model_badge)
        layout.addWidget(self.ai_status_badge)
        layout.addStretch()
        layout.addWidget(pet_btn)
        layout.addWidget(settings_btn)
        layout.addWidget(minimize_btn)
        layout.addWidget(close_btn)
        bar.setLayout(layout)
        return bar

    def _build_quickbar(self):
        bar = GlassPanel("quickBar")
        layout = QGridLayout()
        layout.setContentsMargins(16, 14, 16, 14)
        layout.setHorizontalSpacing(12)
        layout.setVerticalSpacing(8)
        self.emotion_combo = QComboBox()
        for emotion in EMOTIONS:
            self.emotion_combo.addItem(EMOTION_LABELS.get(emotion, emotion), emotion)
        self.emotion_combo.currentIndexChanged.connect(self._on_emotion_changed)
        self.char_combo = QComboBox()
        self.char_combo.currentIndexChanged.connect(self._on_character_changed)
        self.outfit_combo = QComboBox()
        self.outfit_combo.currentIndexChanged.connect(self._on_outfit_changed)
        self.voice_toggle = QCheckBox("Ses")
        self.voice_toggle.setChecked(True)
        self.voice_toggle.stateChanged.connect(self._toggle_voice_from_bar)
        random_btn = ModernButton("Rastgele Kıyafet", "spark", "ghost")
        random_btn.clicked.connect(self._random_outfit)
        voice_test_btn = ModernButton("Ses Testi", "voice", "ghost")
        voice_test_btn.clicked.connect(self._test_voice)
        ai_test_btn = ModernButton("Yapay Zekâ Testi", "refresh", "ghost")
        ai_test_btn.clicked.connect(self._test_ai)
        reload_btn = ModernButton("Yenile", "refresh", "ghost")
        reload_btn.clicked.connect(self._reload_assets)
        for col, (label, widget) in enumerate(
            [
                ("Duygu", self.emotion_combo),
                ("Karakter", self.char_combo),
                ("Kıyafet", self.outfit_combo),
            ]
        ):
            label_widget = QLabel(label)
            label_widget.setProperty("muted", True)
            layout.addWidget(label_widget, 0, col)
            layout.addWidget(widget, 1, col)
        layout.addWidget(self.voice_toggle, 1, 3)
        layout.addWidget(random_btn, 1, 4)
        layout.addWidget(voice_test_btn, 1, 5)
        layout.addWidget(ai_test_btn, 1, 6)
        layout.addWidget(reload_btn, 1, 7)
        bar.setLayout(layout)
        return bar

    def _build_status_bar(self):
        self.ai_status_label = QLabel("Yapay zekâ: beklemede")
        self.voice_status_label = QLabel("Ses: beklemede")
        self.character_status_label = QLabel("Karakter: -")
        self.outfit_status_label = QLabel("Kıyafet: -")
        self.emotion_status_label = QLabel("Duygu: sakin")
        self.fps_status_label = QLabel("FPS: 10")
        self.provider_status_label = QLabel("Sağlayıcı: -")
        self.model_status_label = QLabel("Model: -")
        for widget in [
            self.ai_status_label,
            self.voice_status_label,
            self.character_status_label,
            self.outfit_status_label,
            self.emotion_status_label,
            self.fps_status_label,
            self.provider_status_label,
            self.model_status_label,
        ]:
            self.statusBar().addPermanentWidget(widget)
        self.refresh_status()

    def _load_characters(self):
        self.char_combo.blockSignals(True)
        self.char_combo.clear()
        for char_id, char_info in sorted(self.character_manager.characters.items()):
            self.char_combo.addItem(char_info.get("name", char_id.title()), char_id)
        active = self.character_manager.active_character
        if active:
            index = self.char_combo.findData(active)
            if index >= 0:
                self.char_combo.setCurrentIndex(index)
        self.char_combo.blockSignals(False)
        self._load_outfits()

    def _load_outfits(self):
        char_id = self.char_combo.currentData() or self.character_manager.active_character or "alice"
        outfits = self.character_manager.get_character_outfits(char_id)
        current = self.outfit_manager.current_outfit() if self.outfit_manager.character_id == char_id else None
        self.outfit_combo.blockSignals(True)
        self.outfit_combo.clear()
        self.outfit_combo.addItems(outfits)
        if current in outfits:
            self.outfit_combo.setCurrentText(current)
        elif outfits:
            self.outfit_combo.setCurrentIndex(0)
        self.outfit_combo.blockSignals(False)
        self._show_current_sprite()
        self.refresh_status()

    def _on_character_changed(self):
        char_id = self.char_combo.currentData()
        if not char_id:
            return
        self.character_manager.set_active_character(char_id)
        self.outfit_manager = OutfitManager(char_id)
        self.sprite_animator.outfit_manager = self.outfit_manager
        self.sprite_animator.set_character(char_id)
        if self.app:
            self.app.outfit_manager = self.outfit_manager
        self._load_outfits()

    def _on_outfit_changed(self):
        outfit = self.outfit_combo.currentText()
        if outfit:
            selected = self.outfit_manager.set_outfit(outfit)
            self.state.current_outfit = selected
            self._show_current_sprite()
            self.refresh_status()

    def _on_emotion_changed(self):
        emotion = self.emotion_combo.currentData() or "idle"
        self.current_emotion = emotion
        self.state.emotion = emotion
        self._show_current_sprite()
        self.refresh_status()

    def _set_emotion(self, emotion: str):
        index = self.emotion_combo.findData(emotion)
        if index >= 0:
            self.emotion_combo.setCurrentIndex(index)
        else:
            self.current_emotion = emotion
            self.state.emotion = emotion
            self._show_current_sprite()

    def _show_current_sprite(self):
        self.sprite_display.show_sprite(self.current_emotion, self.outfit_combo.currentText() or self.outfit_manager.current_outfit())

    def _on_sprite_metadata(self, path: str, frame_count: int, fallback_info: str):
        self.sprite_path_compact.setText(path.split("\\")[-1] if path else "")
        self.current_sprite_path = path
        self.current_frame_count = frame_count
        self.current_fallback = fallback_info

    def _send_chat(self):
        message = self.chat_input.toPlainText().strip()
        if not message:
            return
        self._append_bubble("user", message)
        self.chat_input.clear()
        self.chat_input.setEnabled(False)
        self.send_btn.setEnabled(False)
        self._append_bubble("alice", "Alice düşünüyor...")
        if self.app and hasattr(self.app, "chat"):
            self.app.chat(message)

    def on_ai_started(self):
        self.chat_input.setEnabled(False)
        self.send_btn.setEnabled(False)
        self.streaming_response_active = False
        self.streaming_response_text = ""

    def on_ai_partial_response(self, chunk: str):
        if not self.streaming_response_active:
            self.streaming_response_active = True
            self.streaming_response_text = ""
            self.chat_display.append(self._bubble_open("alice"))
        self.streaming_response_text += chunk
        self.chat_display.moveCursor(QTextCursor.End)
        self.chat_display.insertHtml(html.escape(chunk).replace("\n", "<br>"))
        self.chat_display.verticalScrollBar().setValue(self.chat_display.verticalScrollBar().maximum())

    def on_ai_response(self, response: str, emotion: str = "idle"):
        if self.streaming_response_active:
            self.chat_display.insertHtml("</div></div>")
            self.streaming_response_active = False
        else:
            self._append_bubble("alice", response)
        self._set_emotion(emotion if emotion in EMOTIONS else "idle")
        self.chat_input.setEnabled(True)
        self.send_btn.setEnabled(True)

    def on_ai_error(self, error_message: str):
        self._append_bubble("error", error_message)
        self.chat_input.setEnabled(True)
        self.send_btn.setEnabled(True)
        self.ai_status_badge.setText("Yapay zekâ: hata")

    def on_ai_finished(self):
        self.chat_input.setEnabled(True)
        self.send_btn.setEnabled(True)

    def _bubble_open(self, role: str):
        align = "right" if role == "user" else "left"
        bg = "rgba(0,229,255,0.16)" if role == "user" else "rgba(124,58,237,0.16)"
        border = "rgba(0,229,255,0.36)" if role == "user" else "rgba(124,58,237,0.36)"
        name = "Sen" if role == "user" else "Alice"
        timestamp = datetime.now().strftime("%H:%M")
        return (
            f"<div align='{align}'><div style='display:inline-block; max-width:74%; padding:12px 16px; "
            f"margin:8px; border-radius:20px; background:{bg}; border:1px solid {border};'>"
            f"<span style='color:#00e5ff; font-weight:700'>{name}</span> "
            f"<span style='color:#94a3b8; font-size:10px'>{timestamp}</span><br>"
        )

    def _append_bubble(self, role: str, text: str):
        if role == "error":
            opening = (
                "<div align='left'><div style='display:inline-block; max-width:74%; padding:12px 16px; "
                "margin:8px; border-radius:20px; background:rgba(255,107,107,0.14); "
                "border:1px solid rgba(255,107,107,0.36);'>"
                "<span style='color:#ff6b6b; font-weight:700'>Sistem</span><br>"
            )
        else:
            opening = self._bubble_open(role)
        escaped = html.escape(text).replace("\n", "<br>").replace("```", "")
        self.chat_display.append(f"{opening}{escaped}</div></div>")
        self.chat_display.verticalScrollBar().setValue(self.chat_display.verticalScrollBar().maximum())

    def focus_chat(self):
        self.show()
        self.raise_()
        self.activateWindow()
        self.chat_input.setFocus()

    def _switch_to_pet_mode(self):
        if self.app and hasattr(self.app, "open_pet_mode"):
            self.app.open_pet_mode()

    def _test_ai(self):
        if not self.app or not hasattr(self.app, "get_ai_config"):
            QMessageBox.warning(self, "Yapay Zekâ", "Yapay zekâ ayarı bulunamadı.")
            return
        config = self.app.get_ai_config()
        try:
            client = OllamaProvider(
                {
                    "base_url": config.get("base_url", ""),
                    "model": config.get("model", "qwen2.5:3b"),
                    "temperature": config.get("temperature", 0.7),
                    "max_tokens": 128,
                    "timeout": 120,
                }
            )
            QMessageBox.information(self, "Bağlantı Başarılı", client.test_connection())
            self.ai_status_badge.setText("Yapay zekâ: bağlı")
        except Exception as exc:
            QMessageBox.warning(self, "Bağlantı Hatası", str(exc))
            self.ai_status_badge.setText("Yapay zekâ: hata")

    def _test_voice(self):
        if self.app and hasattr(self.app, "speak_text"):
            self.app.speak_text("Merhaba Ertu, ben Alice. Bugün ne yapmak istiyorsun?")

    def _toggle_voice_from_bar(self):
        if not self.app or not hasattr(self.app, "save_voice_config"):
            return
        voice = self.app.local_settings.setdefault("voice", {})
        voice["enabled"] = self.voice_toggle.isChecked()
        self.app.save_voice_config(voice)
        self.refresh_status()

    def _random_outfit(self):
        outfits = self.character_manager.get_character_outfits(self.char_combo.currentData() or "alice")
        if outfits:
            import random
            self.outfit_combo.setCurrentText(random.choice(outfits))

    def _reload_assets(self):
        self.character_manager.reload_characters()
        self.sprite_animator.reload_assets()
        active = self.character_manager.active_character or self.char_combo.currentData() or "alice"
        self.outfit_manager = OutfitManager(active)
        self.sprite_animator.outfit_manager = self.outfit_manager
        if self.app:
            self.app.outfit_manager = self.outfit_manager
        self._load_characters()

    def _open_settings(self):
        dialog = SettingsDialog(self, self.app)
        dialog.settings_changed.connect(self._on_settings_changed)
        dialog.exec()

    def _on_settings_changed(self):
        self._reload_assets()
        self.refresh_status()

    def refresh_status(self):
        char_id = self.char_combo.currentData() if hasattr(self, "char_combo") else "-"
        outfit = self.outfit_combo.currentText() if hasattr(self, "outfit_combo") else "-"
        emotion = self.state.emotion if hasattr(self, "state") else "idle"
        config = self.app.get_ai_config() if self.app and hasattr(self.app, "get_ai_config") else {}
        voice_config = self.app._get_voice_config() if self.app and hasattr(self.app, "_get_voice_config") else {}
        voice_enabled = bool(voice_config.get("enabled", True))
        voice_engine = voice_config.get("engine", "edge_tts")
        voice_name = voice_config.get("voice", "tr-TR-EmelNeural") if voice_engine == "edge_tts" else f"VoiceVox {voice_config.get('voicevox', {}).get('speaker', 47)}"
        voice_status = "Konuşuyor..." if getattr(self.state, "is_talking", False) else ("Ses: Aktif" if voice_enabled else "Ses: Kapalı")
        if hasattr(self, "voice_toggle"):
            self.voice_toggle.blockSignals(True)
            self.voice_toggle.setChecked(voice_enabled)
            self.voice_toggle.blockSignals(False)
        self.active_character_badge.setText(f"Karakter: {char_id or '-'}")
        self.active_outfit_badge.setText(f"Kıyafet: {outfit or '-'}")
        self.provider_badge.setText(f"Sağlayıcı: {config.get('provider', '-')}")
        self.model_badge.setText(f"Model: {config.get('model', '-')}")
        self.connection_badge.setText(self.ai_status_badge.text())
        self.ai_status_label.setText(self.ai_status_badge.text())
        engine_label = "Edge TTS hazır" if voice_engine == "edge_tts" else "VoiceVox hazır"
        self.voice_status_label.setText(f"{voice_status} | {engine_label} | Ses: {voice_name}")
        self.character_status_label.setText(f"Karakter: {char_id or '-'}")
        self.outfit_status_label.setText(f"Kıyafet: {outfit or '-'}")
        self.emotion_status_label.setText(f"Duygu: {EMOTION_LABELS.get(emotion, emotion)}")
        self.provider_status_label.setText(f"Sağlayıcı: {config.get('provider', '-')}")
        self.model_status_label.setText(f"Model: {config.get('model', '-')}")

    def set_voice_status(self, connected: bool, detail: str = ""):
        self.voice_status_label.setText("Ses: bağlı" if connected else f"Ses: {detail or 'kapalı'}")

    def _show_context_menu(self, position):
        menu = QMenu(self)
        char_menu = menu.addMenu("Karakter")
        for char_id, char_info in sorted(self.character_manager.characters.items()):
            action = char_menu.addAction(char_info.get("name", char_id.title()))
            action.triggered.connect(lambda checked=False, c=char_id: self._set_character(c))
        outfit_menu = menu.addMenu("Kıyafet")
        for outfit in self.character_manager.get_character_outfits(self.char_combo.currentData() or "alice"):
            action = outfit_menu.addAction(outfit)
            action.triggered.connect(lambda checked=False, o=outfit: self._set_outfit(o))
        emotion_menu = menu.addMenu("Duygu")
        for emotion in EMOTIONS:
            action = emotion_menu.addAction(EMOTION_LABELS.get(emotion, emotion))
            action.triggered.connect(lambda checked=False, e=emotion: self._set_emotion(e))
        menu.addSeparator()
        menu.addAction("Varlıkları Yenile", self._reload_assets)
        menu.addAction("Pet Modu", self._switch_to_pet_mode)
        menu.addAction("Ayarlar", self._open_settings)
        menu.addSeparator()
        menu.addAction("Çıkış", self.close)
        menu.popup(self.mapToGlobal(position))

    def _set_character(self, char_id: str):
        index = self.char_combo.findData(char_id)
        if index >= 0:
            self.char_combo.setCurrentIndex(index)

    def _set_outfit(self, outfit: str):
        index = self.outfit_combo.findText(outfit)
        if index >= 0:
            self.outfit_combo.setCurrentIndex(index)

    def closeEvent(self, event):
        if hasattr(self, "sprite_display"):
            self.sprite_display.animation_timer.stop()
        if hasattr(self, "status_timer"):
            self.status_timer.stop()
        if self.app:
            try:
                self.app.shutdown()
            except Exception as exc:
                self.logger.warning(f"Kapanış hatası: {exc}")
        event.accept()
