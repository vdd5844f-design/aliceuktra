"""Thread worker for AI chat requests."""

from typing import List

from PySide6.QtCore import QObject, Signal, Slot

from ai.base import Message
from ai.provider_registry import ProviderRegistry
from core.logger import Logger


class AIWorker(QObject):
    """Runs one AI request inside a QThread."""

    started = Signal()
    partial_response = Signal(str)
    response_received = Signal(str)
    error = Signal(str)
    finished = Signal()

    response_ready = Signal(str)
    response_chunk = Signal(str)
    error_occurred = Signal(str)

    def __init__(
        self,
        provider_type: str = "",
        config: dict = None,
        messages: List[Message] = None,
        system_prompt: str = "",
        use_streaming: bool = False,
    ):
        super().__init__()
        self.logger = Logger(__name__)
        self.provider_type = provider_type
        self.config = config or {}
        self.messages = messages or []
        self.system_prompt = system_prompt or ""
        self.use_streaming = use_streaming
        self.current_provider = None

    def set_provider(self, provider_type: str, config: dict):
        self.provider_type = provider_type
        self.config = config or {}
        self.current_provider = ProviderRegistry.create(provider_type, self.config)
        self.logger.info(f"Provider set: {provider_type}")

    def configure(
        self,
        messages: List[Message],
        system_prompt: str = "",
        use_streaming: bool = False,
    ):
        self.messages = messages
        self.system_prompt = system_prompt or ""
        self.use_streaming = use_streaming

    @Slot()
    def run(self):
        self.started.emit()
        try:
            if not self.current_provider:
                if not self.provider_type:
                    raise RuntimeError("No AI provider configured.")
                self.current_provider = ProviderRegistry.create(self.provider_type, self.config)

            if self.use_streaming:
                full_response = ""
                for chunk in self.current_provider.stream_chat(self.messages, self.system_prompt):
                    full_response += chunk
                    self.partial_response.emit(chunk)
                    self.response_chunk.emit(chunk)
                response = full_response
            else:
                response = self.current_provider.chat(self.messages, self.system_prompt)

            self.response_received.emit(response)
            self.response_ready.emit(response)
        except Exception as exc:
            message = str(exc)
            self.logger.error(f"AI worker error: {message}")
            self.error.emit(message)
            self.error_occurred.emit(message)
        finally:
            self.finished.emit()

    def chat(self, messages: List[Message], system_prompt: str = "", use_streaming: bool = False):
        """Compatibility method for direct synchronous use."""
        self.configure(messages, system_prompt, use_streaming)
        self.run()
