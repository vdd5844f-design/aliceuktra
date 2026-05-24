"""
VoiceVox - Japanese TTS synthesis
"""

import requests
from typing import Optional, List
from voice.base import VoiceSynthesizer
from core.logger import Logger


class VoiceVoxSynthesizer(VoiceSynthesizer):
    """VoiceVox voice synthesizer"""
    
    def __init__(self, config: dict):
        super().__init__(config)
        if not self.base_url:
            self.base_url = "http://127.0.0.1:50021"
        if not self.speaker:
            self.speaker = 47
    
    def synthesize(self, text: str) -> Optional[bytes]:
        """Synthesize text to speech using VoiceVox"""
        if not self.enabled:
            return None
        
        try:
            # Step 1: Create audio query
            audio_query_resp = requests.post(
                f"{self.base_url}/audio_query",
                params={
                    "text": text,
                    "speaker": self.speaker,
                },
                timeout=120
            )
            audio_query_resp.raise_for_status()
            audio_query = audio_query_resp.json()
            
            # Adjust speed
            if self.speed and self.speed != 1.0:
                audio_query["speedScale"] = self.speed
            
            # Step 2: Synthesize audio
            synthesis_resp = requests.post(
                f"{self.base_url}/synthesis",
                json=audio_query,
                params={"speaker": self.speaker},
                timeout=120
            )
            synthesis_resp.raise_for_status()
            
            return synthesis_resp.content
        
        except requests.exceptions.RequestException as e:
            detail = (
                f"VoiceVox synthesis failed. Endpoint: {self.base_url}. "
                f"Speaker: {self.speaker}. Details: {e}"
            )
            self.logger.error(detail)
            raise RuntimeError(detail) from e
    
    def health_check(self) -> bool:
        """Check if VoiceVox is running"""
        try:
            response = requests.get(
                f"{self.base_url}/version",
                timeout=5
            )
            return response.status_code == 200
        except Exception as e:
            self.logger.error(f"VoiceVox health check failed: {e}")
            return False
    
    def get_available_speakers(self) -> List[dict]:
        """Get available speaker voices"""
        try:
            response = requests.get(
                f"{self.base_url}/speakers",
                timeout=10
            )
            response.raise_for_status()
            
            speakers = response.json()
            
            # Flatten speaker list
            result = []
            for speaker_group in speakers:
                name = speaker_group.get("name", "")
                for style in speaker_group.get("styles", []):
                    result.append({
                        "id": style.get("id"),
                        "name": f"{name} - {style.get('name')}",
                        "style_id": style.get("id")
                    })
            
            return result
        
        except Exception as e:
            self.logger.error(f"Failed to get speakers: {e}")
            return []
