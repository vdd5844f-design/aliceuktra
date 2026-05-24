#!/usr/bin/env python3
"""
Fix Eve and Ichiko characters by organizing sprites into emotion folders
"""

import os
import shutil
from pathlib import Path

def organize_eve():
    """Organize Eve sprites into emotion folders"""
    eve_base = Path("assets/characters/eve/outfits/eve-sprite")
    
    # Create emotion mapping from Eve sprite names
    emotion_mapping = {
        "idle": ["character_neutral.png"],
        "talk": ["character_neutral.png"],
        "happy": ["character_happy.png"],
        "angry": ["character_mad.png", "character_frightened.png"],
        "sleep": ["character_closedEyes.png"],
        "move": ["character_dark.png"],
    }
    
    # Get source files
    old_eve = Path("assets/eve/Eve-Sprite")
    
    for emotion, files in emotion_mapping.items():
        emotion_dir = eve_base / emotion
        emotion_dir.mkdir(parents=True, exist_ok=True)
        
        for src_file in files:
            src_path = old_eve / src_file
            if src_path.exists():
                # Copy with frame_0.png naming
                dest_file = emotion_dir / "frame_0.png"
                if not dest_file.exists():
                    shutil.copy2(src_path, dest_file)
                    print(f"  {emotion}: {src_file} → frame_0.png")


def organize_ichiko():
    """Organize Ichiko sprites into emotion folders"""
    ichiko_base = Path("assets/characters/ichiko/outfits/ichiko_casual")
    
    # Map Ichiko sprite names to emotions
    emotion_mapping = {
        "idle": ["Ichiko_Casual_Pout.png"],
        "talk": ["Ichiko_Casual_Shout.png"],
        "happy": ["Ichiko_Casual_Smile.png"],
        "angry": ["Ichiko_Casual_Frown.png"],
        "sleep": ["Ichiko_Casual_Closed_Pout.png"],
        "move": ["Ichiko_Casual_Smile_Blush.png"],
    }
    
    # Get source files
    old_ichiko = Path("assets/ichiko/Ichiko Casual")
    
    for emotion, files in emotion_mapping.items():
        emotion_dir = ichiko_base / emotion
        emotion_dir.mkdir(parents=True, exist_ok=True)
        
        for src_file in files:
            src_path = old_ichiko / src_file
            if src_path.exists():
                # Copy with frame_0.png naming
                dest_file = emotion_dir / "frame_0.png"
                if not dest_file.exists():
                    shutil.copy2(src_path, dest_file)
                    print(f"  {emotion}: {src_file} → frame_0.png")


def main():
    print("=" * 60)
    print("Fixing Eve and Ichiko Character Sprites")
    print("=" * 60)
    
    print("\nOrganizing Eve...")
    try:
        organize_eve()
        print("✓ Eve organized")
    except Exception as e:
        print(f"✗ Eve error: {e}")
    
    print("\nOrganizing Ichiko...")
    try:
        organize_ichiko()
        print("✓ Ichiko organized")
    except Exception as e:
        print(f"✗ Ichiko error: {e}")
    
    print("\n" + "=" * 60)
    print("Done!")


if __name__ == "__main__":
    main()
