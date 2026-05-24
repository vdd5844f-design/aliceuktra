#!/usr/bin/env python3
"""Quick import test"""

try:
    from core.app import AlicePetApp
    print("✓ AlicePetApp imported successfully")
    
    # Try instantiating
    app = AlicePetApp()
    print("✓ AlicePetApp instantiated successfully")
    
except Exception as e:
    import traceback
    print("✗ Import/instantiation failed:")
    traceback.print_exc()
