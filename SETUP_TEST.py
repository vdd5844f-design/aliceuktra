"""
Quick setup and test for Alice AI Ultra Pet
"""

import sys
import json
from pathlib import Path

print("=" * 60)
print("Alice AI Ultra Pet - Setup & Test")
print("=" * 60)

# Test 1: Imports
print("\n[1] Testing imports...")
try:
    from core.app import AlicePetApp
    from ai.provider_registry import ProviderRegistry
    from engine.character_manager import CharacterManager
    from engine.emotion_engine import EmotionEngine
    from core.database import Database
    print("✓ All core imports successful")
except Exception as e:
    print(f"✗ Import failed: {e}")
    sys.exit(1)

# Test 2: Database
print("\n[2] Testing database...")
try:
    db = Database()
    stats = db.stats() if hasattr(db, 'stats') else "DB initialized"
    print(f"✓ Database initialized: {stats}")
except Exception as e:
    print(f"✗ Database failed: {e}")

# Test 3: Character Manager
print("\n[3] Testing character manager...")
try:
    char_mgr = CharacterManager()
    chars = char_mgr.get_all_characters()
    if chars:
        for char in chars:
            print(f"  ✓ Found character: {char.get('name', 'unknown')}")
    else:
        print("  ⚠ No characters found")
except Exception as e:
    print(f"✗ Character manager failed: {e}")

# Test 4: Emotion Engine
print("\n[4] Testing emotion engine...")
try:
    emotion_engine = EmotionEngine()
    
    # Test emotion detection
    test_responses = [
        ("Harika, çok güzel!", "happy"),
        ("Hata var, çalışmıyor", "angry"),
        ("Üzgünüm, bilmiyorum", "sad"),
        ("Confusing, ne demek", "confused"),
    ]
    
    for response, expected in test_responses:
        detected = emotion_engine.detect_emotion(response)
        status = "✓" if detected == expected else "≈"
        print(f"  {status} '{response}' -> {detected}")
    
except Exception as e:
    print(f"✗ Emotion engine failed: {e}")

# Test 5: AI Providers
print("\n[5] Testing AI provider registry...")
try:
    available = ProviderRegistry.list_providers()
    print(f"  Available providers: {', '.join(available)}")
    
    for provider_name in available:
        try:
            provider_class = ProviderRegistry.get(provider_name)
            print(f"  ✓ {provider_name}: {provider_class.__name__}")
        except Exception as e:
            print(f"  ✗ {provider_name}: {e}")
    
except Exception as e:
    print(f"✗ Provider registry failed: {e}")

# Test 6: Configuration
print("\n[6] Testing configuration...")
try:
    from config.config_manager import ConfigManager
    cfg = ConfigManager()
    
    model = cfg.get("model", "ai")
    voicevox_url = cfg.get("voicevox_url", "voice")
    
    print(f"  ✓ Model: {model}")
    print(f"  ✓ VoiceVox URL: {voicevox_url}")
    
except Exception as e:
    print(f"✗ Configuration failed: {e}")

print("\n" + "=" * 60)
print("Setup test completed!")
print("=" * 60)

print("""
NEXT STEPS:
1. Configure AI Provider:
   - Set OLLAMA_URL or OpenAI API key
   - Test connection in Settings dialog
   
2. Configure Voice (Optional):
   - Start VoiceVox service
   - Test voice in Settings dialog
   
3. Run Application:
   python main.py
   
4. Chat Features:
   - Type message in chat panel
   - Select character/outfit
   - Voice will play if configured
""")
