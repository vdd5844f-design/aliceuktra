import re
from core.logger import Logger

class ResponseParser:
    """Parse and process responses from Ollama"""
    
    def __init__(self):
        self.logger = Logger(__name__)
    
    def parse(self, response):
        """Parse response text"""
        return response.strip()
    
    def extract_emotion(self, response):
        """Extract emotion hint from response if present"""
        # Look for patterns like [emotion: happy] or (emotion: sad)
        emotion_pattern = r'\[emotion:\s*(\w+)\]|\(emotion:\s*(\w+)\)'
        match = re.search(emotion_pattern, response, re.IGNORECASE)
        
        if match:
            emotion = match.group(1) or match.group(2)
            return emotion.lower()
        
        return None
    
    def extract_action(self, response):
        """Extract action from response if present"""
        # Look for patterns like [action: move] or (action: sleep)
        action_pattern = r'\[action:\s*(\w+)\]|\(action:\s*(\w+)\)'
        match = re.search(action_pattern, response, re.IGNORECASE)
        
        if match:
            action = match.group(1) or match.group(2)
            return action.lower()
        
        return None
    
    def clean_response(self, response):
        """Remove action/emotion markers from response"""
        # Remove [emotion: ...] and (emotion: ...)
        response = re.sub(r'\[emotion:\s*\w+\]|\(emotion:\s*\w+\)', '', response, flags=re.IGNORECASE)
        # Remove [action: ...] and (action: ...)
        response = re.sub(r'\[action:\s*\w+\]|\(action:\s*\w+\)', '', response, flags=re.IGNORECASE)
        return response.strip()
