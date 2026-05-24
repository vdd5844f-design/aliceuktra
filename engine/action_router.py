from core.logger import Logger

class ActionRouter:
    """Route actions to appropriate handlers"""
    
    def __init__(self):
        self.logger = Logger(__name__)
        self.handlers = {}
    
    def register_handler(self, action, handler):
        """Register action handler"""
        self.handlers[action] = handler
        self.logger.debug(f"Handler registered for action: {action}")
    
    def route_action(self, action, *args, **kwargs):
        """Route action to appropriate handler"""
        if action not in self.handlers:
            self.logger.warning(f"No handler for action: {action}")
            return None
        
        try:
            self.logger.debug(f"Routing action: {action}")
            return self.handlers[action](*args, **kwargs)
        except Exception as e:
            self.logger.error(f"Error handling action {action}: {e}")
            return None
