# Alice AI Ultra Pet - Windows Setup Instructions

## System Requirements
- Windows 10 or later
- 4GB RAM minimum
- 500MB disk space

## Installation Options

### Option 1: Run from Source (Development)
1. Install Python 3.9+
2. Clone or download the project
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run:
   ```bash
   python main.py
   ```

### Option 2: Build Windows EXE
1. Install Python 3.9+
2. Run build script:
   ```bash
   python build_windows.py
   ```
   Or on Windows CMD:
   ```bash
   build_windows.bat
   ```
3. Find executable in `dist/AliceAIPet.exe`

## Configuration

### Required Services
Alice requires these services to be running:

1. **Ollama** (AI Model Server)
   - Download: https://ollama.ai
   - Start: `ollama serve`
   - Or use Docker: `docker run -d -p 11434:11434 ollama/ollama`

2. **VoiceVox** (Text-to-Speech)
   - Download: https://voicevox.hiroshiba.jp
   - Or use Docker: `docker run -d -p 50021:50021 voicevox/voicevox`
   - Alternative: Use offline Piper TTS

3. **Piper TTS** (Optional - Offline Alternative)
   - Install: `pip install piper-tts`
   - Download voice: `piper.download_voices`

### Configuration File
Edit `config/settings.json`:
```json
{
  "ai": {
    "ollama_url": "http://127.0.0.1:11434",
    "model": "qwen2.5:3b"
  },
  "voice": {
    "tts_engine": "voicevox",
    "voicevox_url": "http://127.0.0.1:50021"
  }
}
```

## First Launch

1. Ensure Ollama is running with a model:
   ```bash
   ollama pull qwen2.5:3b
   ollama serve
   ```

2. (Optional) Ensure VoiceVox is running:
   ```bash
   # Windows: Run voicevox.exe
   # Or Docker: docker run -d -p 50021:50021 voicevox/voicevox
   ```

3. Launch Alice:
   ```bash
   # From source
   python main.py
   
   # Or from exe
   AliceAIPet.exe
   ```

## Troubleshooting

### "Timers cannot be stopped from another thread" Error
**Solution**: Already handled in code with proper threading. Make sure PySide6 is installed.

### Ollama Connection Failed
- Check if `ollama serve` is running
- Verify URL in settings.json matches
- Try: `curl http://127.0.0.1:11434/api/tags`

### VoiceVox Connection Failed
- Check if VoiceVox is running
- Verify URL in settings.json
- Try: `curl http://127.0.0.1:50021/version`

### No Audio
- Check if voice is enabled in settings
- Verify TTS engine (VoiceVox or Piper)
- Check system volume

### Sprites Not Loading
- Verify `assets/alice/` directories exist
- Check file permissions
- Regenerate sprites: `python generate_sprites.py`

## Development

### Running Tests
```bash
# Test sprite animation
python test_step1_animation.py

# Test chat + Ollama
python test_steps_2_3_chat_ollama.py

# Test advanced features
python test_steps_4_7_advanced.py
```

### Project Structure
```
alice-ai-ultra-pet/
├── main.py              # Entry point
├── requirements.txt     # Dependencies
├── core/                # Core application logic
├── ui/                  # User interface
├── engine/              # Animation, emotions, actions
├── ai/                  # Ollama integration
├── voice/               # TTS and STT
├── config/              # Configuration
├── assets/              # Sprites and resources
└── data/                # Logs and memory
```

## Support
For issues and questions, check the logs in `data/logs/`

---
Made with ❤️ using Python, PySide6, and Ollama
