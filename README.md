# Alice AI Ultra - Desktop Pet

**Alice AI Ultra** is a sophisticated desktop pet application powered by AI, featuring smooth animations, voice interaction, and intelligent responses.

## 🎯 Features

- **Smart AI Assistant**: Powered by Ollama with customizable models
- **Natural Speech**: VoiceVox or Piper text-to-speech
- **Smooth Animation**: Sprite-based animations with emotion states
- **Memory System**: Remembers conversations and user preferences
- **Configurable**: Easy settings for models, voices, and behaviors
- **System Tray Integration**: Minimize to tray, easy access
- **Threading**: Proper async handling - no UI freezes

## 🏗️ Architecture

```
Core Components:
- AliceState: Thread-safe state management with Qt signals
- SpriteAnimator: Frame-based animation on main thread
- OllamaWorker: AI responses in separate thread (no blocking)
- TTSWorker: Speech synthesis in separate thread
- AudioPlayerWorker: Audio playback in separate thread

Key Pattern:
✓ Main Thread: UI, timers, animations (never blocking)
✓ Worker Threads: Ollama, TTS, Audio playback (safe signals)
```

## 📋 Implementation Steps (Completed)

1. ✅ **Sprite Animation** - Multi-state sprite system with smooth transitions
2. ✅ **Chat Panel** - User input/output display
3. ✅ **Ollama Integration** - AI responses via separate worker thread
4. ✅ **Talk Animation** - `is_talking` state triggers talk frames
5. ✅ **VoiceVox/Piper TTS** - Speech synthesis in worker thread
6. ✅ **Emotion Parser** - Extract emotion/action hints from responses
7. ✅ **Memory System** - Persistent conversation and preference storage
8. ✅ **Tray Menu + Settings** - System tray with configurable settings
9. ✅ **Windows EXE** - PyInstaller packaging for distribution

## 🚀 Quick Start

### Development Mode
```bash
# Install dependencies
pip install -r requirements.txt

# Generate test sprites
python generate_sprites.py

# Run tests
python test_step1_animation.py
python test_steps_2_3_chat_ollama.py
python test_steps_4_7_advanced.py

# Launch application
python main.py
```

### Windows Distribution
```bash
# Build executable
python build_windows.py

# Run exe
dist/AliceAIPet.exe
```

## 🔧 Configuration

### settings.json
```json
{
  "ai": {
    "ollama_url": "http://127.0.0.1:11434",
    "model": "qwen2.5:3b",
    "timeout": 120
  },
  "voice": {
    "tts_engine": "voicevox",
    "voicevox_url": "http://127.0.0.1:50021",
    "voicevox_speaker": 47
  }
}
```

### persona.tr.txt
Turkish personality/system prompt. Customize for different behaviors.

## 📦 Dependencies

- **PySide6**: Cross-platform GUI
- **Pillow**: Image handling
- **Requests**: HTTP client for Ollama/VoiceVox
- **SoundDevice/SoundFile**: Audio playback
- **NumPy**: Numerical operations

## 🧪 Testing

All core functionality is tested:
- Sprite animation system
- Chat panel UI
- Ollama integration
- Emotion extraction
- Memory persistence
- TTS synthesis

## ⚙️ Threading Model

**Critical**: Maintains proper threading to avoid "Timers cannot be stopped from another thread" error.

```
┌─────────────────────────────────────┐
│         Main Thread (UI)            │
├─────────────────────────────────────┤
│ ✓ Animation timer (every 90ms)      │
│ ✓ Frame updates                     │
│ ✓ Chat panel display                │
│ ✓ Signal/slot connections           │
└─────────────────────────────────────┘
              │
       ┌──────┴──────┬──────────────┐
       ▼             ▼              ▼
   [Worker 1]   [Worker 2]    [Worker 3]
   OllamaWorker TTSWorker    AudioPlayer
   (AI Logic)   (Speech)     (Playback)
```

## 📂 Project Structure

```
alice-ai-ultra-pet/
├── main.py                 # Entry point
├── requirements.txt        # Dependencies
│
├── core/                   # Core logic
│   ├── app.py             # Application class
│   ├── state.py           # Thread-safe state (Qt signals)
│   ├── memory.py          # Persistent memory
│   ├── logger.py          # Logging system
│   └── events.py          # Event bus
│
├── ui/                     # User interface
│   ├── main_window.py     # Main window (chat + pet)
│   ├── pet_window.py      # Pet display
│   ├── chat_panel.py      # Chat UI
│   ├── tray.py            # System tray
│   ├── settings_dialog.py # Settings window
│   └── workers.py         # Worker threads
│
├── engine/                 # Game engine
│   ├── sprite_animator.py # Animation system
│   ├── emotion_engine.py  # Emotion state machine
│   ├── action_router.py   # Action dispatcher
│   └── desktop_control.py # Desktop automation
│
├── ai/                     # AI integration
│   ├── ollama_client.py   # Ollama API
│   ├── ollama_worker.py   # Async Ollama worker
│   ├── prompt_builder.py  # Prompt templates
│   └── response_parser.py # Parse/extract from responses
│
├── voice/                  # Audio
│   ├── tts_base.py        # Base class
│   ├── voicevox_tts.py    # VoiceVox TTS
│   ├── piper_tts.py       # Piper TTS (offline)
│   └── stt.py             # Speech recognition
│
├── config/                 # Configuration
│   ├── config_manager.py  # Config loader/saver
│   ├── settings.json      # App settings
│   └── persona.tr.txt     # AI personality
│
├── assets/                 # Resources
│   └── alice/
│       ├── idle/          # Idle animation frames
│       ├── talk/          # Talk animation frames
│       ├── happy/         # Happy emotion
│       ├── angry/         # Angry emotion
│       ├── sleep/         # Sleep state
│       └── move/          # Movement animation
│
├── data/                   # Runtime data
│   ├── memory.json        # Conversation memory
│   ├── audio_cache/       # TTS output cache
│   └── logs/              # Application logs
│
└── build_*.* / *.spec     # Build configuration
```

## 🎨 Sprite States

- **idle**: Default resting state
- **talk**: Active speaking (triggered by is_talking)
- **happy**: Positive emotion
- **angry**: Negative emotion
- **sleep**: Dormant state
- **move**: Movement/idle variation

## 🔌 External Services

### Ollama (Required)
```bash
# Install
https://ollama.ai/download

# Run
ollama pull qwen2.5:3b
ollama serve
```

### VoiceVox (Optional TTS)
```bash
# Docker
docker run -d -p 50021:50021 voicevox/voicevox

# Native (Windows)
Download from https://voicevox.hiroshiba.jp
```

### Piper TTS (Offline Alternative)
```bash
pip install piper-tts
piper.download_voices
```

## 🐛 Known Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Timer cannot be stopped" | ✓ Already handled with QThread workers |
| Ollama 404 error | Check model exists: `ollama list` |
| No audio output | Verify TTS engine running, check volume |
| Slow responses | Check Ollama model size, consider smaller model |
| Memory leak | Memory is properly managed, temp files cleaned |

## 🚀 Performance

- **Animation FPS**: 11 FPS (90ms per frame, smooth visually)
- **Memory Usage**: ~200-300MB typical
- **CPU Usage**: <10% idle, depends on model during chat
- **Response Time**: 1-30 seconds depending on model/complexity

## 🔐 Security

- Local operation (no cloud data)
- Configurable memory storage (local JSON)
- No telemetry
- Config file for credentials/URLs

## 📝 Customization

### Change AI Model
Edit `config/settings.json`:
```json
"model": "llama2"  // Available via ollama pull
```

### Change Voice
Edit `config/settings.json`:
```json
"tts_engine": "piper",
"piper_voice": "en_US-grayson-medium"
```

### Change Personality
Edit `config/persona.tr.txt` with custom system prompt

## 🔄 Development Workflow

1. **Make Changes**: Edit source files
2. **Test**: Run test files
3. **Debug**: Check logs in `data/logs/`
4. **Build**: `python build_windows.py`
5. **Release**: Copy `dist/AliceAIPet.exe`

## 📊 Logging

Application logs are saved to `data/logs/`. Each run creates a new timestamped log file with DEBUG level information.

```bash
# View latest logs
dir data/logs/
type data/logs/alice_*.log
```

## 🎓 Learning Resources

- **Threading**: Study `ui/workers.py` for QThread pattern
- **Qt State Management**: Study `core/state.py` for signals
- **Animation**: Study `engine/sprite_animator.py`
- **Integration**: Study `ui/main_window.py` for component coordination

## 📄 License

Open source - feel free to modify and distribute.

## ✨ Credits

Built with:
- **Python 3.9+**
- **PySide6** - Qt for Python
- **Ollama** - Open-source LLM
- **VoiceVox** - Text-to-speech
- **PyInstaller** - Windows packaging

---

**Status**: ✅ All 9 implementation steps completed and tested

For support or questions, check `SETUP_WINDOWS.md` for detailed setup instructions.
