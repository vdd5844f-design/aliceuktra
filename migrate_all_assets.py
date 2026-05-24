#!/usr/bin/env python3
"""
Migrate all character assets to new structure
assets/{char_id}/{outfit_folder}/ -> assets/characters/{char_id}/outfits/{outfit}/

This script:
1. Scans assets/ for character folders
2. Creates new structure under assets/characters/
3. Creates manifest.json for each character
4. Normalizes emotion folders
"""

import os
import json
import shutil
from pathlib import Path

# Character list (based on assets folder)
CHARACTERS = [
    "drift",
    "eve", 
    "ichiko",
    "miho",
    "natsumi",
    "sumi"
]

# Emotion folders to create (default structure)
EMOTIONS = ["idle", "talk", "happy", "angry", "sleep", "move"]

def normalize_emotion_name(folder_name):
    """Normalize emotion folder names to standard list"""
    folder_lower = folder_name.lower().strip()
    
    # Check if folder matches any standard emotion
    for emotion in EMOTIONS:
        if emotion in folder_lower:
            return emotion
    
    # Default mapping for common names
    mappings = {
        "default": "idle",
        "neutral": "idle",
        "greeting": "talk",
        "speaking": "talk",
        "cheerful": "happy",
        "joyful": "happy",
        "sad": "angry",
        "frustrated": "angry",
        "tired": "sleep",
        "walking": "move",
        "running": "move",
    }
    
    for key, emotion in mappings.items():
        if key in folder_lower:
            return emotion
    
    return folder_lower  # Return as-is if no match


def create_manifest(char_id, outfits):
    """Create manifest.json for character"""
    return {
        "name": char_id.title(),
        "id": char_id,
        "version": "2.0",
        "description": f"Character: {char_id}",
        "outfits": {outfit: f"outfits/{outfit}" for outfit in outfits}
    }


def migrate_character(char_id):
    """Migrate single character to new structure"""
    old_base = Path(f"assets/{char_id}")
    new_base = Path(f"assets/characters/{char_id}")
    
    if not old_base.exists():
        print(f"⚠ {char_id}: Old assets not found")
        return False
    
    # Create new character directory
    new_base.mkdir(parents=True, exist_ok=True)
    outfits_dir = new_base / "outfits"
    outfits_dir.mkdir(exist_ok=True)
    
    outfits = []
    
    # Scan old folder for outfit directories
    for item in old_base.iterdir():
        if not item.is_dir() or item.name.startswith('_'):
            continue
        
        outfit_name = item.name.lower().replace(" ", "_")
        outfit_dir = outfits_dir / outfit_name
        outfit_dir.mkdir(exist_ok=True)
        outfits.append(outfit_name)
        
        # Create emotion directories
        has_frames = False
        for emotion_folder in item.iterdir():
            if not emotion_folder.is_dir():
                continue
            
            emotion_name = normalize_emotion_name(emotion_folder.name)
            emotion_dir = outfit_dir / emotion_name
            emotion_dir.mkdir(exist_ok=True)
            
            # Copy PNG frames
            frame_count = 0
            for png_file in emotion_folder.glob("*.png"):
                dest_file = emotion_dir / png_file.name
                if not dest_file.exists():
                    shutil.copy2(png_file, dest_file)
                    frame_count += 1
                    has_frames = True
            
            if frame_count > 0:
                print(f"  ├─ {outfit_name}/{emotion_name}: {frame_count} frames")
        
        if not has_frames:
            print(f"  ├─ {outfit_name}: No frames found (copy error or empty)")
    
    # Create manifest
    manifest_path = new_base / "manifest.json"
    if not manifest_path.exists():
        with open(manifest_path, 'w') as f:
            json.dump(create_manifest(char_id, outfits), f, indent=2)
    
    print(f"✓ {char_id}: {len(outfits)} outfits migrated")
    return True


def main():
    """Migrate all characters"""
    print("=" * 60)
    print("Alice AI Ultra Pet - Asset Migration Script")
    print("=" * 60)
    
    successful = 0
    failed = 0
    
    for char_id in CHARACTERS:
        try:
            if migrate_character(char_id):
                successful += 1
            else:
                failed += 1
        except Exception as e:
            print(f"✗ {char_id}: {e}")
            failed += 1
    
    print("=" * 60)
    print(f"Summary: {successful} success, {failed} failed")
    print("=" * 60)
    
    # List all migrated characters
    characters_dir = Path("assets/characters")
    if characters_dir.exists():
        chars = [d.name for d in characters_dir.iterdir() if d.is_dir()]
        print(f"\nAvailable characters: {', '.join(sorted(chars))}")


if __name__ == "__main__":
    main()
