#!/usr/bin/env python
# Quick test of OutfitManager

from engine.outfit_manager import OutfitManager

try:
    om = OutfitManager('alice')
    print('✓ OutfitManager loaded successfully')
    print(f'  Current outfit: {om.current_outfit()}')
    print(f'  Enabled: {[o["id"] for o in om.enabled_outfits()]}')
    print(f'  All: {[o["id"] for o in om.all_outfits()]}')
    print(f'  Outfit path: {om.get_outfit_path()}')
except Exception as e:
    print(f'✗ Error: {e}')
    import traceback
    traceback.print_exc()
