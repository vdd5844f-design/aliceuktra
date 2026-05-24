#!/usr/bin/env python
"""
Final Verification and Quick-Start Script
Run this to verify everything is working before deployment
"""

import os
import sys

def verify_structure():
    """Verify project structure is complete"""
    print("\n📁 Verifying Project Structure...")
    print("=" * 60)
    
    required_dirs = [
        "core", "ui", "engine", "ai", "voice", "config", 
        "assets/alice", "data", "data/logs"
    ]
    
    required_files = [
        "main.py", "requirements.txt",
        "core/app.py", "core/state.py", "core/memory.py", "core/logger.py",
        "ui/main_window.py", "ui/pet_window.py", "ui/chat_panel.py",
        "ui/tray.py", "ui/settings_dialog.py", "ui/workers.py",
        "engine/sprite_animator.py", "engine/emotion_engine.py",
        "ai/ollama_client.py", "ai/ollama_worker.py",
        "voice/voicevox_tts.py", "voice/piper_tts.py",
        "config/config_manager.py", "config/settings.json",
        "alice_pet.spec", "build_windows.py",
        "README.md", "SETUP_WINDOWS.md", "IMPLEMENTATION_COMPLETE.md"
    ]
    
    # Check directories
    missing_dirs = []
    for d in required_dirs:
        if not os.path.isdir(d):
            missing_dirs.append(d)
        else:
            print(f"  ✓ {d}/")
    
    # Check files
    missing_files = []
    for f in required_files:
        if not os.path.isfile(f):
            missing_files.append(f)
        else:
            print(f"  ✓ {f}")
    
    print("\n" + "=" * 60)
    
    if missing_dirs or missing_files:
        print("❌ Missing files/directories:")
        for d in missing_dirs:
            print(f"  ✗ {d}/")
        for f in missing_files:
            print(f"  ✗ {f}")
        return False
    
    print("✅ All files present!")
    return True

def verify_sprites():
    """Verify sprite assets exist"""
    print("\n🎨 Verifying Sprite Assets...")
    print("=" * 60)
    
    emotions = ["idle", "talk", "happy", "angry", "sleep", "move"]
    all_ok = True
    
    for emotion in emotions:
        emotion_dir = f"assets/alice/{emotion}"
        if os.path.isdir(emotion_dir):
            frames = [f for f in os.listdir(emotion_dir) if f.endswith('.png')]
            if frames:
                print(f"  ✓ {emotion}: {len(frames)} frames")
            else:
                print(f"  ✗ {emotion}: no frames found")
                all_ok = False
        else:
            print(f"  ✗ {emotion}: directory not found")
            all_ok = False
    
    return all_ok

def verify_dependencies():
    """Verify required Python packages"""
    print("\n📦 Verifying Dependencies...")
    print("=" * 60)
    
    required_packages = [
        "PySide6", "PIL", "requests", "pygame", 
        "sounddevice", "soundfile", "numpy"
    ]
    
    all_ok = True
    for package in required_packages:
        try:
            __import__(package.lower() if package not in ["PIL"] else "PIL")
            print(f"  ✓ {package}")
        except ImportError:
            print(f"  ✗ {package} (install: pip install {package})")
            all_ok = False
    
    return all_ok

def main():
    print("\n" + "=" * 60)
    print("  ALICE AI ULTRA - FINAL VERIFICATION")
    print("=" * 60)
    
    results = {}
    
    results["Structure"] = verify_structure()
    results["Sprites"] = verify_sprites()
    results["Dependencies"] = verify_dependencies()
    
    print("\n" + "=" * 60)
    print("  VERIFICATION RESULTS")
    print("=" * 60)
    
    for check, result in results.items():
        status = "✅" if result else "⚠️"
        print(f"{status} {check}")
    
    all_pass = all(results.values())
    
    print("\n" + "=" * 60)
    if all_pass:
        print("✅ ALL VERIFICATIONS PASSED!")
        print("\n🚀 Ready to launch:")
        print("   python main.py")
        print("\n📋 Required services:")
        print("   1. Ollama: ollama serve")
        print("   2. VoiceVox: docker run -p 50021:50021 voicevox/voicevox")
        print("   3. Or Piper: pip install piper-tts")
        print("\n📦 To build Windows EXE:")
        print("   python build_windows.py")
    else:
        print("⚠️  Some checks failed. Install missing packages:")
        print("   pip install -r requirements.txt")
    
    print("=" * 60 + "\n")
    
    return 0 if all_pass else 1

if __name__ == "__main__":
    sys.exit(main())
