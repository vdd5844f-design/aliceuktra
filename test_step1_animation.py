#!/usr/bin/env python
"""
Test sprite animation system
"""
import sys
import os

# Test sprite animator without UI
from engine.sprite_animator import SpriteAnimator
from core.state import AliceState
from core.logger import Logger

def test_sprite_animation():
    print("=" * 60)
    print("TESTING: Sprite Animation System (Step 1)")
    print("=" * 60)
    
    logger = Logger("TEST")
    
    try:
        # Create state
        state = AliceState()
        print("\n✓ AliceState created")
        
        # Create animator
        animator = SpriteAnimator("assets/alice", state)
        print("✓ SpriteAnimator initialized")
        
        # Test frame loading for each emotion
        emotions = ["idle", "talk", "happy", "angry", "sleep"]
        for emotion in emotions:
            frames = animator.load_frames(emotion)
            if frames:
                print(f"✓ Loaded {emotion}: {len(frames)} frames")
            else:
                print(f"✗ Failed to load {emotion}")
                return False
        
        # Test animation state changes
        print("\n--- Testing State Changes ---")
        state.emotion = "idle"
        frame = animator.next_frame()
        print(f"✓ Idle frame: {os.path.basename(frame)}")
        
        state.emotion = "happy"
        frame = animator.next_frame()
        print(f"✓ Happy frame: {os.path.basename(frame)}")
        
        state.is_talking = True
        frame = animator.next_frame()
        print(f"✓ Talk frame (is_talking=True): {os.path.basename(frame)}")
        
        state.is_talking = False
        state.emotion = "idle"
        
        # Test animation sequence
        print("\n--- Testing Frame Sequence ---")
        frame_count = animator.get_frame_count()
        print(f"✓ Frame count for idle: {frame_count}")
        
        for i in range(frame_count * 2):
            frame = animator.next_frame()
            print(f"  Frame {i+1}: {os.path.basename(frame)}")
        
        print("\n" + "=" * 60)
        print("✓ ALL TESTS PASSED - Sprite Animation Working!")
        print("=" * 60)
        return True
    
    except Exception as e:
        print(f"\n✗ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_sprite_animation()
    sys.exit(0 if success else 1)
