"""
Emotion Engine - AI cevaplarından emotion çıkart ve yönet
"""

import re
from typing import Tuple
from core.logger import Logger


class EmotionEngine:
    """
    Emotion management and detection
    - Emotion state transitions
    - AI response analysis
    - Sentiment detection
    """
    
    # Valid emotions
    VALID_EMOTIONS = ["idle", "talk", "happy", "angry", "sad", "confused", "sleep", "worried", "move"]
    
    # Valid transitions
    EMOTION_TRANSITIONS = {
        "idle": ["talk", "happy", "angry", "sleep", "confused", "sad", "worried", "move"],
        "talk": ["idle", "happy", "angry", "confused"],
        "happy": ["idle", "angry", "talk", "confused"],
        "angry": ["idle", "happy", "talk", "worried"],
        "sad": ["idle", "happy", "talk", "confused"],
        "confused": ["idle", "talk", "happy"],
        "worried": ["idle", "talk", "happy"],
        "sleep": ["idle", "talk"],
        "move": ["idle", "talk", "happy"]
    }
    
    # Emotion detection keywords
    EMOTION_KEYWORDS = {
        "happy": [
            "teşekkür", "harika", "güzel", "mükemmel", "süper",
            "awesome", "excellent", "wonderful", "great", "amazing",
            "love", "thanks", "thank you", "tebrik", "bravo"
        ],
        "angry": [
            "kızgın", "sinir", "nefret", "bozuk", "çalışmıyor",
            "angry", "hate", "furious", "damn", "frustrated"
        ],
        "sad": [
            "üzgün", "mutsuz", "melankolik", "ölü", "kayıp",
            "sad", "unhappy", "tragic", "lost", "sorry"
        ],
        "confused": [
            "karmaşık", "anlamadım", "bilinmiyor", "garip",
            "confused", "unclear", "not sure", "what", "huh"
        ],
        "sleep": [
            "uykulu", "yorgun", "sabah", "gece", "zzz",
            "sleepy", "tired", "exhausted", "yawn"
        ],
        "worried": [
            "endişe", "kaygı", "risk", "tehlike", "uyar",
            "worried", "concerned", "warning", "danger", "risky"
        ]
    }
    
    def __init__(self, state=None):
        self.state = state
        self.logger = Logger(__name__)
        self.current_emotion = "idle"
    
    def set_emotion(self, emotion: str) -> bool:
        """Set emotion if valid transition"""
        if emotion not in self.VALID_EMOTIONS:
            self.logger.warning(f"Invalid emotion: {emotion}")
            return False
        
        valid_next = self.EMOTION_TRANSITIONS.get(self.current_emotion, [])
        if emotion not in valid_next:
            self.logger.warning(f"Invalid transition: {self.current_emotion} -> {emotion}")
            return False
        
        self.current_emotion = emotion
        if self.state:
            self.state.emotion = emotion
        
        self.logger.debug(f"Emotion changed to: {emotion}")
        return True
    
    def get_emotion(self) -> str:
        """Get current emotion"""
        return self.current_emotion
    
    def reset_emotion(self) -> bool:
        """Reset to idle"""
        return self.set_emotion("idle")
    
    def detect_emotion(self, response: str, user_message: str = "") -> str:
        """
        Detect emotion from AI response
        
        Args:
            response: AI's text response
            user_message: User's message for context
        
        Returns:
            Detected emotion name
        """
        text = f"{response} {user_message}".lower()
        emotion_scores = {}
        
        for emotion, keywords in self.EMOTION_KEYWORDS.items():
            score = 0
            for keyword in keywords:
                # Word boundary matching
                pattern = r'\b' + re.escape(keyword) + r'\b'
                matches = len(re.findall(pattern, text))
                score += matches
            
            if score > 0:
                emotion_scores[emotion] = score
        
        # Return highest score or idle
        if emotion_scores:
            best_emotion = max(emotion_scores, key=emotion_scores.get)
            self.logger.debug(f"Detected emotion: {best_emotion}")
            return best_emotion
        
        return "idle"
    
    def get_transition_time(self, from_emotion: str, to_emotion: str) -> int:
        """
        Get emotion transition time in ms
        
        Args:
            from_emotion: Current emotion
            to_emotion: Target emotion
        
        Returns:
            Transition time in milliseconds
        """
        if from_emotion == to_emotion:
            return 0
        
        if from_emotion == "sleep":
            return 200  # Fast wake up
        
        if to_emotion == "idle":
            return 100  # Fast to idle
        
        return 300  # Default smooth transition
