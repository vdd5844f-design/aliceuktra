import json
import os
from core.logger import Logger

class ConfigManager:
    """Manage application configuration"""
    
    DEFAULT_CONFIG = {
        "window": {
            "width": 1200,
            "height": 600,
            "x": 100,
            "y": 100,
            "always_on_top": True
        },
        "animation": {
            "fps": 11,
            "frame_delay_ms": 90
        },
        "ai": {
            "ollama_url": "http://127.0.0.1:11434",
            "model": "qwen2.5:3b",
            "timeout": 120
        },
        "voice": {
            "tts_engine": "voicevox",  # voicevox or piper
            "voicevox_url": "http://127.0.0.1:50021",
            "voicevox_speaker": 47,
            "piper_voice": "tr_TR-kbvcorpus-medium",
            "volume": 1.0,
            "enabled": True
        },
        "language": "tr_TR",
        "debug": False,
        "auto_start": False
    }
    
    def __init__(self, config_file="config/settings.json"):
        self.config_file = config_file
        self.logger = Logger(__name__)
        self.config = self._load()
    
    def _load(self):
        """Load configuration from file"""
        if os.path.exists(self.config_file):
            try:
                with open(self.config_file, 'r', encoding='utf-8') as f:
                    loaded_config = json.load(f)
                    # Merge with defaults to ensure all keys exist
                    self._merge_config(self.DEFAULT_CONFIG, loaded_config)
                    return loaded_config
            except Exception as e:
                self.logger.error(f"Failed to load config: {e}")
                return self.DEFAULT_CONFIG.copy()
        
        return self.DEFAULT_CONFIG.copy()
    
    def _merge_config(self, defaults, loaded):
        """Merge loaded config with defaults"""
        for key, value in defaults.items():
            if key not in loaded:
                loaded[key] = value
            elif isinstance(value, dict):
                self._merge_config(value, loaded[key])
    
    def save(self):
        """Save configuration to file"""
        try:
            os.makedirs(os.path.dirname(self.config_file), exist_ok=True)
            with open(self.config_file, 'w', encoding='utf-8') as f:
                json.dump(self.config, f, indent=2, ensure_ascii=False)
            self.logger.debug("Config saved successfully")
        except Exception as e:
            self.logger.error(f"Failed to save config: {e}")
    
    def get(self, key, section=None, default=None):
        """Get configuration value"""
        if section:
            return self.config.get(section, {}).get(key, default)
        return self.config.get(key, default)
    
    def set(self, key, value, section=None):
        """Set configuration value"""
        if section:
            if section not in self.config:
                self.config[section] = {}
            self.config[section][key] = value
        else:
            self.config[key] = value
        self.save()
    
    def reset_to_defaults(self):
        """Reset configuration to defaults"""
        self.config = self.DEFAULT_CONFIG.copy()
        self.save()
        self.logger.info("Config reset to defaults")
