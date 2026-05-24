#!/usr/bin/env python3
"""
Quick verification that app starts without errors
"""

import sys
from pathlib import Path

print("Testing application startup...")
print("=" * 60)

try:
    # This simulates what main.py does
    from PySide6.QtWidgets import QApplication
    from core.app import AlicePetApp
    
    print("✓ PySide6 QApplication imported")
    print("✓ AlicePetApp imported")
    
    # Create Qt application (required for AlicePetApp)
    qt_app = QApplication.instance() or QApplication(sys.argv)
    print("✓ Qt application created")
    
    # Create Alice app
    alice = AlicePetApp()
    print("✓ AlicePetApp instantiated")
    
    print("\n✅ Application ready to start!")
    print("\nTo run the full GUI application:")
    print("  python main.py")
    
except Exception as e:
    import traceback
    print(f"\n❌ Error during startup:")
    traceback.print_exc()
    sys.exit(1)
