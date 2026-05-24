import json
import os
from datetime import datetime
from core.logger import Logger

class Memory:
    def __init__(self, memory_file="data/memory.json"):
        self.memory_file = memory_file
        self.logger = Logger(__name__)
        os.makedirs(os.path.dirname(memory_file), exist_ok=True)
        self.data = self._load()
    
    def _load(self):
        if os.path.exists(self.memory_file):
            try:
                with open(self.memory_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                self.logger.error(f"Failed to load memory: {e}")
                return self._default_memory()
        return self._default_memory()
    
    def _default_memory(self):
        return {
            "conversations": [],
            "user_info": {},
            "preferences": {},
            "last_session": None,
        }
    
    def save(self):
        try:
            os.makedirs(os.path.dirname(self.memory_file), exist_ok=True)
            with open(self.memory_file, 'w', encoding='utf-8') as f:
                json.dump(self.data, f, indent=2, ensure_ascii=False)
            self.logger.debug("Memory saved successfully")
        except Exception as e:
            self.logger.error(f"Failed to save memory: {e}")
    
    def add_conversation(self, user_msg, assistant_msg):
        self.data["conversations"].append({
            "timestamp": datetime.now().isoformat(),
            "user": user_msg,
            "assistant": assistant_msg
        })
        self.save()
    
    def get_recent_conversations(self, count=10):
        return self.data["conversations"][-count:]
    
    def set_user_info(self, key, value):
        self.data["user_info"][key] = value
        self.save()
    
    def get_user_info(self, key, default=None):
        return self.data["user_info"].get(key, default)
    
    def set_preference(self, key, value):
        self.data["preferences"][key] = value
        self.save()
    
    def get_preference(self, key, default=None):
        return self.data["preferences"].get(key, default)
