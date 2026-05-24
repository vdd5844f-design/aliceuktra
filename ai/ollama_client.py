import requests
from core.logger import Logger

class OllamaClient:
    def __init__(self, base_url="http://127.0.0.1:11434", model="qwen2.5:3b"):
        self.base_url = base_url
        self.model = model
        self.logger = Logger(__name__)
    
    def chat(self, message, system_prompt="", timeout=120):
        """Send chat message to Ollama and get response"""
        try:
            payload = {
                "model": self.model,
                "stream": False,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message}
                ]
            }
            
            self.logger.debug(f"Sending to Ollama: {message[:50]}...")
            
            r = requests.post(
                f"{self.base_url}/api/chat",
                json=payload,
                timeout=timeout
            )
            r.raise_for_status()
            
            response = r.json()["message"]["content"]
            self.logger.debug(f"Ollama response: {response[:50]}...")
            
            return response
        
        except requests.exceptions.ConnectionError as e:
            self.logger.error(f"Ollama connection failed: {e}")
            return "Ollama sunucusuna bağlanamıyorum. Lütfen Ollama'nın çalışıyor olduğundan emin olun."
        
        except Exception as e:
            self.logger.error(f"Ollama chat error: {e}")
            return f"Hata oluştu: {str(e)}"
    
    def check_connection(self):
        """Check if Ollama is running"""
        try:
            r = requests.get(f"{self.base_url}/api/tags", timeout=5)
            return r.status_code == 200
        except:
            return False
