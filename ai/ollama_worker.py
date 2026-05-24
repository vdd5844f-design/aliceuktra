from PySide6.QtCore import QThread, Signal
from ai.ollama_client import OllamaClient
from ai.prompt_builder import PromptBuilder
from ai.response_parser import ResponseParser
from core.logger import Logger

class OllamaWorker(QThread):
    """
    Worker thread for Ollama chat processing.
    Keeps main thread free for animation timers.
    """
    response_ready = Signal(str)  # Emits complete response
    error_occurred = Signal(str)  # Emits error message
    
    def __init__(self, message, system_prompt, model="qwen2.5:3b"):
        super().__init__()
        self.message = message
        self.system_prompt = system_prompt
        self.model = model
        self.logger = Logger(__name__)
        
        self.ollama = OllamaClient(model=model)
        self.parser = ResponseParser()
    
    def run(self):
        """Run Ollama chat in worker thread"""
        try:
            self.logger.info(f"Ollama Worker: Processing message in thread")
            
            # Get response from Ollama
            response = self.ollama.chat(
                self.message,
                system_prompt=self.system_prompt,
                timeout=120
            )
            
            if response:
                # Clean response and emit via signal (thread-safe)
                clean_response = self.parser.clean_response(response)
                self.response_ready.emit(clean_response)
                self.logger.debug(f"Response sent to main thread")
            else:
                self.error_occurred.emit("Ollama yanıt veremedi")
        
        except Exception as e:
            self.logger.error(f"Worker error: {e}")
            self.error_occurred.emit(str(e))
