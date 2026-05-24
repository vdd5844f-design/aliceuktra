import subprocess
from core.logger import Logger

class DesktopControl:
    """Control desktop environment"""
    
    def __init__(self):
        self.logger = Logger(__name__)
    
    def open_application(self, app_name):
        """Open an application"""
        try:
            self.logger.debug(f"Opening application: {app_name}")
            subprocess.Popen(app_name)
            return True
        except Exception as e:
            self.logger.error(f"Failed to open application: {e}")
            return False
    
    def open_url(self, url):
        """Open URL in default browser"""
        try:
            self.logger.debug(f"Opening URL: {url}")
            subprocess.Popen(f"start {url}", shell=True)
            return True
        except Exception as e:
            self.logger.error(f"Failed to open URL: {e}")
            return False
