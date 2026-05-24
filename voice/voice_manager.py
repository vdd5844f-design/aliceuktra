"""
Voice Manager - Unified voice system management
"""

from typing import Optional
from voice.base import VoiceSynthesizer
from voice.voicevox import VoiceVoxSynthesizer
from voice.audio_player import AudioPlayer
from core.logger import Logger


class VoiceManager:
    """Manage voice synthesis and playback"""
    
    def __init__(self, config: dict = None):
        """
        Args:
            config: {
                'synthesizer': 'voicevox' or 'piper',
                'voicevox': {...},  # voicevox specific config
                'piper': {...},     # piper specific config
                'auto_speak': bool,
                'volume': float (0.0-1.0),
            }
        """
        self.logger = Logger(__name__)
        self.config = config or {}
        
        self.player = AudioPlayer()
        self.synthesizer = self._init_synthesizer()
        self.auto_speak = config.get('auto_speak', True) if config else True
        self.volume = float(config.get('volume', 1.0)) if config else 1.0
    
    def _init_synthesizer(self) -> Optional[VoiceSynthesizer]:
        """Initialize voice synthesizer"""
        if not self.config:
            return None
        
        synth_type = self.config.get('synthesizer', 'voicevox')
        
        if synth_type == 'voicevox':
            try:
                voicevox_config = self.config.get('voicevox', {})
                synth = VoiceVoxSynthesizer(voicevox_config)
                
                if synth.health_check():
                    self.logger.info("VoiceVox synthesizer initialized")
                    return synth
                else:
                    self.logger.warning("VoiceVox health check failed")
                    return None
            except Exception as e:
                self.logger.error(f"Failed to initialize VoiceVox: {e}")
                return None
        
        self.logger.warning(f"Unknown synthesizer: {synth_type}")
        return None
    
    def speak(self, text: str) -> bool:
        """
        Synthesize and play text
        
        Args:
            text: Text to speak
        
        Returns:
            True if playback started
        """
        if not self.synthesizer or not self.synthesizer.is_enabled():
            return False
        
        try:
            # Synthesize
            audio_bytes = self.synthesizer.synthesize(text)
            if not audio_bytes:
                return False
            
            # Play
            return self.player.play(audio_bytes, volume=self.volume)
        
        except Exception as e:
            self.logger.error(f"Speak error: {e}")
            return False
    
    def stop_speaking(self):
        """Stop current speech"""
        self.player.stop()
    
    def is_speaking(self) -> bool:
        """Check if currently speaking"""
        return self.player.is_playing_audio()
    
    def health_check(self) -> bool:
        """Check if voice system is working"""
        if not self.synthesizer:
            return False
        
        return self.synthesizer.health_check()
    
    def set_synthesizer_speaker(self, speaker_id: int) -> bool:
        """Change speaker voice"""
        if not self.synthesizer:
            return False
        
        self.synthesizer.speaker = speaker_id
        return True
    
    def get_speakers(self) -> list:
        """Get available speakers"""
        if not self.synthesizer:
            return []
        
        return self.synthesizer.get_available_speakers()
