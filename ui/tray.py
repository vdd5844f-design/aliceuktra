from PySide6.QtWidgets import QSystemTrayIcon, QMenu
from PySide6.QtGui import QIcon, QAction
from core.logger import Logger

def create_tray(window):
    """Create system tray icon and menu"""
    logger = Logger(__name__)
    
    tray = QSystemTrayIcon(window)
    
    # Create menu
    menu = QMenu(window)
    
    # Show/Hide
    show_action = QAction("Göster", window)
    show_action.triggered.connect(window.show)
    menu.addAction(show_action)
    
    hide_action = QAction("Gizle", window)
    hide_action.triggered.connect(window.hide)
    menu.addAction(hide_action)
    
    menu.addSeparator()
    
    # Settings
    settings_action = QAction("Ayarlar", window)
    settings_action.triggered.connect(lambda: open_settings(window))
    menu.addAction(settings_action)
    
    menu.addSeparator()
    
    # Exit
    exit_action = QAction("Çık", window)
    exit_action.triggered.connect(window.close)
    menu.addAction(exit_action)
    
    tray.setContextMenu(menu)
    
    # Try to set icon
    try:
        tray.setIcon(QIcon("assets/alice/idle/frame_0.png"))
    except:
        logger.debug("Could not load tray icon")
    
    tray.show()
    logger.info("System tray created")
    
    return tray

def open_settings(parent_window):
    """Open settings dialog"""
    if hasattr(parent_window, "_open_settings"):
        parent_window._open_settings()
