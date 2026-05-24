from enum import Enum

class EventType(Enum):
    # UI Events
    WINDOW_MOVED = "window_moved"
    WINDOW_CLOSED = "window_closed"
    CHAT_INPUT = "chat_input"
    
    # AI Events
    RESPONSE_RECEIVED = "response_received"
    EMOTION_CHANGED = "emotion_changed"
    
    # Voice Events
    SPEECH_STARTED = "speech_started"
    SPEECH_ENDED = "speech_ended"
    
    # State Events
    STATE_CHANGED = "state_changed"
    ANIMATION_STARTED = "animation_started"
    ANIMATION_ENDED = "animation_ended"

class EventBus:
    def __init__(self):
        self.listeners = {}
    
    def subscribe(self, event_type, callback):
        if event_type not in self.listeners:
            self.listeners[event_type] = []
        self.listeners[event_type].append(callback)
    
    def emit(self, event_type, data=None):
        if event_type in self.listeners:
            for callback in self.listeners[event_type]:
                callback(data)
    
    def unsubscribe(self, event_type, callback):
        if event_type in self.listeners:
            self.listeners[event_type].remove(callback)
