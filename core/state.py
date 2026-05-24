from PySide6.QtCore import QObject, Signal

class AliceState(QObject):
    """
    Singleton state management for Alice.
    Uses Qt signals for thread-safe updates.
    """
    # Signals
    emotion_changed = Signal(str)
    talking_changed = Signal(bool)
    text_changed = Signal(str)
    outfit_changed = Signal(str)
    
    def __init__(self):
        super().__init__()
        self._emotion = "idle"
        self._is_talking = False
        self._current_text = ""
        self._model = "qwen2.5:3b"
        self._voice_engine = "voicevox"
        self._current_outfit = "default"
    
    @property
    def emotion(self):
        return self._emotion
    
    @emotion.setter
    def emotion(self, value):
        if self._emotion != value:
            self._emotion = value
            self.emotion_changed.emit(value)
    
    @property
    def is_talking(self):
        return self._is_talking
    
    @is_talking.setter
    def is_talking(self, value):
        if self._is_talking != value:
            self._is_talking = value
            self.talking_changed.emit(value)
    
    @property
    def current_text(self):
        return self._current_text
    
    @current_text.setter
    def current_text(self, value):
        if self._current_text != value:
            self._current_text = value
            self.text_changed.emit(value)
    
    @property
    def model(self):
        return self._model
    
    @model.setter
    def model(self, value):
        self._model = value
    
    @property
    def voice_engine(self):
        return self._voice_engine
    
    @voice_engine.setter
    def voice_engine(self, value):
        self._voice_engine = value
    
    @property
    def current_outfit(self):
        return self._current_outfit
    
    @current_outfit.setter
    def current_outfit(self, value):
        if self._current_outfit != value:
            self._current_outfit = value
            self.outfit_changed.emit(value)
