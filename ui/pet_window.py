"""Transparent desktop pet window."""

from PySide6.QtCore import QPoint, Qt, QTimer
from PySide6.QtGui import QAction, QPixmap
from PySide6.QtWidgets import QLabel, QMenu, QWidget

from core.logger import Logger
from engine.asset_scanner import EMOTIONS
from engine.character_manager import CharacterManager
from engine.outfit_manager import OutfitManager
from engine.sprite_animator import SpriteAnimator


class PetWindow(QWidget):
    SCALE_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0]

    def __init__(self, state, app=None):
        super().__init__()
        self.state = state
        self.app = app
        self.logger = Logger(__name__)
        self.old_pos = QPoint()

        self.character_manager = getattr(app, "character_manager", None) or CharacterManager()
        active_character = self.character_manager.active_character or "alice"
        self.outfit_manager = getattr(app, "outfit_manager", None) or OutfitManager(active_character)
        self.animator = SpriteAnimator(active_character, self.state, self.outfit_manager)

        pet_settings = getattr(app, "local_settings", {}).get("pet", {}) if app else {}
        self.scale_factor = float(pet_settings.get("scale", 1.0))
        self.always_on_top = bool(pet_settings.get("always_on_top", True))

        self.label = QLabel(self)
        self.label.setAlignment(Qt.AlignCenter)
        self.label.setAttribute(Qt.WA_TranslucentBackground)
        self.label.setStyleSheet("background: transparent;")

        self._apply_window_flags()
        self.setAttribute(Qt.WA_TranslucentBackground)
        self.setWindowTitle("Alice AI Ultra Pet")

        self.timer = QTimer()
        self.timer.timeout.connect(self.update_frame)
        self.timer.start(100)

        self.move(1200, 600)
        self.update_frame()
        self.logger.info("PetWindow initialized")

    def _apply_window_flags(self):
        flags = Qt.FramelessWindowHint | Qt.Tool
        if self.always_on_top:
            flags |= Qt.WindowStaysOnTopHint
        self.setWindowFlags(flags)

    def update_frame(self):
        frame = self.animator.next_frame()
        if not frame:
            self.logger.warning(self.animator.last_fallback_info or "Yüklenebilir görsel bulunamadı.")
            return

        pixmap = QPixmap(frame)
        if pixmap.isNull():
            self.logger.warning(f"Pixmap load failed: {frame}")
            return

        pulse = 1.025 if getattr(self.state, "is_talking", False) else 1.0
        width = max(1, int(pixmap.width() * self.scale_factor * pulse))
        height = max(1, int(pixmap.height() * self.scale_factor * pulse))
        scaled = pixmap.scaled(width, height, Qt.KeepAspectRatio, Qt.SmoothTransformation)
        self.label.setPixmap(scaled)
        self.label.resize(scaled.size())
        self.resize(scaled.size())

    def mousePressEvent(self, event):
        if event.button() == Qt.RightButton:
            self.show_context_menu(event.globalPosition().toPoint())
        else:
            self.select_emotion("happy")
            self.old_pos = event.globalPosition().toPoint()

    def mouseMoveEvent(self, event):
        if event.buttons() & Qt.LeftButton:
            delta = event.globalPosition().toPoint() - self.old_pos
            self.move(self.x() + delta.x(), self.y() + delta.y())
            self.old_pos = event.globalPosition().toPoint()

    def mouseDoubleClickEvent(self, event):
        if self.app:
            self.app.open_chat()
        event.accept()

    def enterEvent(self, event):
        self.select_emotion("happy")
        event.accept()

    def leaveEvent(self, event):
        if self.state.emotion == "happy":
            self.select_emotion("idle")
        event.accept()

    def wheelEvent(self, event):
        direction = 1 if event.angleDelta().y() > 0 else -1
        current = min(range(len(self.SCALE_OPTIONS)), key=lambda i: abs(self.SCALE_OPTIONS[i] - self.scale_factor))
        next_index = max(0, min(len(self.SCALE_OPTIONS) - 1, current + direction))
        self.set_scale(self.SCALE_OPTIONS[next_index])
        event.accept()

    def show_context_menu(self, pos):
        menu = QMenu(self)

        open_chat = QAction("Sohbeti Aç", menu)
        open_chat.triggered.connect(lambda: self.app.open_chat() if self.app else None)
        menu.addAction(open_chat)

        open_studio = QAction("Stüdyo Modu", menu)
        open_studio.triggered.connect(lambda: self.app.open_studio() if self.app else None)
        menu.addAction(open_studio)

        menu.addSeparator()

        char_menu = menu.addMenu("Karakter Değiştir")
        for char_id, char_info in sorted(self.character_manager.characters.items()):
            action = QAction(char_info.get("name", char_id.title()), char_menu)
            action.triggered.connect(lambda checked=False, c=char_id: self.select_character(c))
            char_menu.addAction(action)

        outfit_menu = menu.addMenu("Kıyafet Değiştir")
        for outfit in self.outfit_manager.all_outfits():
            action = QAction(outfit["name"], outfit_menu)
            action.triggered.connect(lambda checked=False, oid=outfit["id"]: self.select_outfit(oid))
            outfit_menu.addAction(action)

        emotion_menu = menu.addMenu("Duygu")
        for emotion in EMOTIONS:
            action = QAction(emotion, emotion_menu)
            action.triggered.connect(lambda checked=False, e=emotion: self.select_emotion(e))
            emotion_menu.addAction(action)

        scale_menu = menu.addMenu("Ölçek")
        for scale in self.SCALE_OPTIONS:
            action = QAction(f"{scale:g}x", scale_menu)
            action.setCheckable(True)
            action.setChecked(abs(scale - self.scale_factor) < 0.01)
            action.triggered.connect(lambda checked=False, s=scale: self.set_scale(s))
            scale_menu.addAction(action)

        menu.addSeparator()
        voice_action = QAction("Sesi Aç/Kapat", menu)
        voice_action.setCheckable(True)
        voice_enabled = bool(getattr(self.app, "local_settings", {}).get("voice", {}).get("enabled", True)) if self.app else True
        voice_action.setChecked(voice_enabled)
        voice_action.triggered.connect(self.toggle_voice)
        menu.addAction(voice_action)

        sleep_action = QAction("Uyku Modu", menu)
        sleep_action.triggered.connect(lambda: self.select_emotion("sleep"))
        menu.addAction(sleep_action)

        always_action = QAction("Her Zaman Üstte", menu)
        always_action.setCheckable(True)
        always_action.setChecked(self.always_on_top)
        always_action.triggered.connect(self.toggle_always_on_top)
        menu.addAction(always_action)

        quit_action = QAction("Çıkış", menu)
        quit_action.triggered.connect(lambda: self.app.quit_application() if self.app else self.close())
        menu.addAction(quit_action)
        menu.exec(pos)

    def select_character(self, character_id):
        if not self.character_manager.set_active_character(character_id):
            return
        self.outfit_manager = OutfitManager(character_id)
        self.animator.outfit_manager = self.outfit_manager
        self.animator.set_character(character_id)
        self.state.current_outfit = self.outfit_manager.current_outfit()
        if self.app:
            self.app.outfit_manager = self.outfit_manager
            if self.app.window:
                self.app.window._set_character(character_id)

    def select_outfit(self, outfit_id):
        selected = self.outfit_manager.set_outfit(outfit_id)
        self.state.current_outfit = selected
        self.animator.clear_cache()
        if self.app and self.app.window:
            self.app.window._set_outfit(selected)
        self.update_frame()

    def select_emotion(self, emotion):
        self.state.emotion = emotion
        self.animator.reset_animation()
        if self.app and self.app.window:
            self.app.window._set_emotion(emotion)
        self.update_frame()

    def set_scale(self, scale):
        self.scale_factor = float(scale)
        if self.app:
            self.app.local_settings.setdefault("pet", {})["scale"] = self.scale_factor
            self.app.save_local_settings()
        self.update_frame()

    def toggle_always_on_top(self):
        self.always_on_top = not self.always_on_top
        if self.app:
            self.app.local_settings.setdefault("pet", {})["always_on_top"] = self.always_on_top
            self.app.save_local_settings()
        self._apply_window_flags()
        self.show()

    def toggle_voice(self):
        if not self.app:
            return
        voice = self.app.local_settings.setdefault("voice", {})
        voice["enabled"] = not bool(voice.get("enabled", True))
        self.app.save_voice_config(voice)

    def reload_assets(self):
        self.character_manager.reload_characters()
        self.animator.reload_assets()
        self.outfit_manager.reload()
        self.update_frame()

    def closeEvent(self, event):
        self.timer.stop()
        self.logger.info("PetWindow closed")
        event.accept()
