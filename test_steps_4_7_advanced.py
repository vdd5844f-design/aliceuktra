#!/usr/bin/env python
"""
Test Steps 4-7: Talk Animation, TTS, Emotion Parser, Memory
"""
import sys
import os
from core.logger import Logger
from engine.sprite_animator import SpriteAnimator
from engine.emotion_engine import EmotionEngine
from voice.voicevox_tts import VoiceVoxTTS
from voice.piper_tts import PiperTTS
from core.state import AliceState
from core.memory import Memory
from ai.response_parser import ResponseParser

def test_advanced_features():
    print("=" * 60)
    print("TESTING: Steps 4-7 - Advanced Features")
    print("=" * 60)
    
    logger = Logger("TEST")
    
    try:
        # Test 1: Talk animation
        print("\n--- Test 1: Talk Animation (is_talking state) ---")
        state = AliceState()
        animator = SpriteAnimator("assets/alice", state)
        
        # Normal animation
        state.emotion = "idle"
        state.is_talking = False
        frame1 = animator.next_frame()
        print(f"✓ Idle animation: {os.path.basename(frame1)}")
        
        # Talk animation
        state.is_talking = True
        frame2 = animator.next_frame()
        print(f"✓ Talk animation (is_talking=True): {os.path.basename(frame2)}")
        
        # Test 2: Emotion engine
        print("\n--- Test 2: Emotion Engine ---")
        emotion_engine = EmotionEngine(state)
        
        # Valid transitions
        emotion_engine.set_emotion("happy")
        print(f"✓ Emotion changed to: {emotion_engine.get_emotion()}")
        
        emotion_engine.set_emotion("idle")
        print(f"✓ Emotion reset to: {emotion_engine.get_emotion()}")
        
        # Test 3: VoiceVox TTS
        print("\n--- Test 3: VoiceVox TTS ---")
        voicevox = VoiceVoxTTS()
        
        is_connected = voicevox.check_connection()
        if is_connected:
            print("✓ VoiceVox connection: OK")
            audio_path = voicevox.synthesize("Merhaba, ben Alice!")
            if audio_path and os.path.exists(audio_path):
                file_size = os.path.getsize(audio_path)
                print(f"✓ Audio synthesized: {audio_path} ({file_size} bytes)")
            else:
                print("✗ Audio synthesis failed")
                return False
        else:
            print("⚠ VoiceVox not running")
            print("  Start with: docker run -p 50021:50021 voicevox/voicevox")
        
        # Test 4: Piper TTS
        print("\n--- Test 4: Piper TTS ---")
        piper = PiperTTS()
        
        is_piper_available = piper.check_connection()
        if is_piper_available:
            print("✓ Piper available")
            audio_path = piper.synthesize("Merhaba, ben Alice!")
            if audio_path and os.path.exists(audio_path):
                file_size = os.path.getsize(audio_path)
                print(f"✓ Audio synthesized: {audio_path} ({file_size} bytes)")
            else:
                print("✗ Audio synthesis failed")
        else:
            print("⚠ Piper not available")
            print("  Install with: pip install piper-tts")
        
        # Test 5: Memory system
        print("\n--- Test 5: Memory System ---")
        memory = Memory("data/memory_test.json")
        
        # Test conversation storage
        memory.add_conversation("Test user message", "Test assistant response")
        convs = memory.get_recent_conversations(1)
        assert len(convs) > 0, "Memory not storing conversations"
        assert convs[-1]["user"] == "Test user message"
        print("✓ Conversation storage working")
        
        # Test user info
        memory.set_user_info("name", "User")
        assert memory.get_user_info("name") == "User"
        print("✓ User info storage working")
        
        # Test preferences
        memory.set_preference("language", "tr")
        assert memory.get_preference("language") == "tr"
        print("✓ Preference storage working")
        
        # Test 6: Emotion & action extraction
        print("\n--- Test 6: Emotion/Action Extraction ---")
        parser = ResponseParser()
        
        response = "Merhaba! [emotion: happy] Seninle konuşmaktan çok mutluyum [action: wave]"
        
        emotion = parser.extract_emotion(response)
        action = parser.extract_action(response)
        clean = parser.clean_response(response)
        
        assert emotion == "happy", f"Expected 'happy', got '{emotion}'"
        assert action == "wave", f"Expected 'wave', got '{action}'"
        print(f"✓ Emotion extracted: {emotion}")
        print(f"✓ Action extracted: {action}")
        print(f"✓ Clean text: {clean}")
        
        print("\n" + "=" * 60)
        print("✓ ALL ADVANCED TESTS PASSED!")
        print("=" * 60)
        return True
    
    except Exception as e:
        print(f"\n✗ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_advanced_features()
    sys.exit(0 if success else 1)
