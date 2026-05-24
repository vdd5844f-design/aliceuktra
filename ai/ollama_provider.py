"""Ollama AI Provider - local, LAN, and tunnel support."""

import json
from typing import Generator, List

import requests

from ai.base import AIProvider, Message
from core.logger import Logger


class OllamaProvider(AIProvider):
    """Ollama local LLM provider"""
    
    def __init__(self, config: dict):
        super().__init__(config)
        self.logger = Logger(__name__)
        self.base_url = (self.base_url or "http://127.0.0.1:11434").rstrip("/")
        self.model = self.model or "qwen2.5:3b"
        self.timeout = int(config.get("timeout", 120))
    
    def chat(self, messages: List[Message], system_prompt: str = None) -> str:
        """Sync chat with Ollama"""
        try:
            payload = {
                "model": self.model,
                "stream": False,
                "messages": self.format_messages(messages, system_prompt),
                "options": {
                    "temperature": self.temperature,
                    "num_predict": self.max_tokens,
                },
            }

            response = requests.post(
                f"{self.base_url}/api/chat",
                json=payload,
                timeout=self.timeout,
            )
            response.raise_for_status()

            data = response.json()
            content = data.get("message", {}).get("content", "")
            if not content:
                raise RuntimeError("Ollama returned an empty response. Check model name and server logs.")
            return content

        except requests.exceptions.RequestException as exc:
            detail = self._format_request_error(exc)
            self.logger.error(detail)
            raise RuntimeError(detail) from exc
        except (KeyError, ValueError, TypeError) as exc:
            detail = f"Invalid Ollama response from {self.base_url}: {exc}"
            self.logger.error(detail)
            raise RuntimeError(detail) from exc

    def stream_chat(self, messages: List[Message], system_prompt: str = None) -> Generator[str, None, None]:
        """Stream chat with Ollama."""
        try:
            payload = {
                "model": self.model,
                "stream": True,
                "messages": self.format_messages(messages, system_prompt),
                "options": {
                    "temperature": self.temperature,
                    "num_predict": self.max_tokens,
                },
            }

            response = requests.post(
                f"{self.base_url}/api/chat",
                json=payload,
                timeout=self.timeout,
                stream=True,
            )
            response.raise_for_status()

            for line in response.iter_lines():
                if line:
                    try:
                        data = json.loads(line)
                        content = data.get("message", {}).get("content", "")
                        if content:
                            yield content
                    except json.JSONDecodeError:
                        continue

        except requests.exceptions.RequestException as exc:
            detail = self._format_request_error(exc)
            self.logger.error(detail)
            raise RuntimeError(detail) from exc

    def health_check(self) -> bool:
        """Check if Ollama is running and model is available."""
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=10)
            if response.status_code != 200:
                return False

            data = response.json()
            models = [m.get("name", "") for m in data.get("models", [])]
            model_base = self.model.split(":")[0] if ":" in self.model else self.model
            return any(self.model in model or model_base in model for model in models)

        except Exception as exc:
            self.logger.error(f"Ollama health check failed: {exc}")
            return False

    def test_connection(self) -> str:
        """Run /api/tags and a short /api/chat request. Returns a success message."""
        tags_response = requests.get(f"{self.base_url}/api/tags", timeout=15)
        tags_response.raise_for_status()

        prompt = [Message("user", "Kısa bağlantı testi: sadece tamam yaz.")]
        content = self.chat(prompt, "Sadece bağlantı testi için tek kelime cevap ver.")
        return f"{self.base_url} adresine {self.model} modeliyle bağlanıldı. Test yanıtı: {content[:120]}"

    def get_available_models(self) -> List[str]:
        """Get list of installed models."""
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=10)
            response.raise_for_status()

            data = response.json()
            return [m.get("name", "") for m in data.get("models", [])]

        except Exception as exc:
            self.logger.error(f"Failed to get Ollama models: {exc}")
            return []

    def _format_request_error(self, exc: requests.exceptions.RequestException) -> str:
        response = getattr(exc, "response", None)
        status = f" HTTP {response.status_code}" if response is not None else ""
        body = ""
        if response is not None:
            try:
                body = f" Response: {response.text[:500]}"
            except Exception:
                body = ""
        return (
            f"Ollama request failed{status}. "
            f"Endpoint: {self.base_url}/api/chat. "
            f"Model: {self.model}. "
            f"Check base_url, Cloudflare tunnel availability, and model name. "
            f"Details: {exc}.{body}"
        )
