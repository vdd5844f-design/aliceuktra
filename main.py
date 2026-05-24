import sys
from PySide6.QtWidgets import QApplication
from core.app import AlicePetApp

if __name__ == "__main__":
    # Create Qt application
    qt_app = QApplication(sys.argv)
    
    # Create Alice app
    alice = AlicePetApp()
    alice.start()
    
    # Run event loop
    sys.exit(qt_app.exec())
