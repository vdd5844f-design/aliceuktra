"""
AI Provider Registry - Pluggable provider system
Dinamik provider oluşturma ve yönetimi
"""

from typing import Dict, Type, Optional
from ai.base import AIProvider
from core.logger import Logger


class ProviderRegistry:
    """Tüm provider'ları yönet"""
    
    _providers: Dict[str, Type[AIProvider]] = {}
    _logger = Logger(__name__)
    
    @classmethod
    def register(cls, name: str, provider_class: Type[AIProvider]):
        """Provider sınıfını kaydet"""
        cls._providers[name] = provider_class
        cls._logger.info(f"Provider registered: {name}")
    
    @classmethod
    def get(cls, name: str) -> Optional[Type[AIProvider]]:
        """Provider sınıfını al"""
        return cls._providers.get(name)
    
    @classmethod
    def list_providers(cls) -> list:
        """Kayıtlı tüm provider'ları listele"""
        return list(cls._providers.keys())
    
    @classmethod
    def create(cls, provider_type: str, config: Dict) -> AIProvider:
        """
        Provider instance oluştur
        
        Args:
            provider_type: 'ollama', 'openai', 'claude', 'gemini', 'openrouter'
            config: Provider configuration
        
        Returns:
            AIProvider instance
        
        Raises:
            ValueError: Unknown provider type
        """
        provider_class = cls.get(provider_type)
        if not provider_class:
            raise ValueError(f"Unknown provider: {provider_type}")
        
        return provider_class(config)


# Register builtin providers
def register_builtin_providers():
    """Register all builtin providers"""
    try:
        from ai.ollama_provider import OllamaProvider
        ProviderRegistry.register('ollama', OllamaProvider)
    except ImportError:
        Logger(__name__).warning("OllamaProvider not available")
    
    try:
        from ai.openai_compatible_provider import OpenAICompatibleProvider
        ProviderRegistry.register('openai', OpenAICompatibleProvider)
        ProviderRegistry.register('openai-compatible', OpenAICompatibleProvider)
    except ImportError:
        Logger(__name__).warning("OpenAICompatibleProvider not available")
    
    try:
        from ai.anthropic_provider import AnthropicProvider
        ProviderRegistry.register('anthropic', AnthropicProvider)
        ProviderRegistry.register('claude', AnthropicProvider)
    except ImportError:
        Logger(__name__).warning("AnthropicProvider not available")
    
    try:
        from ai.gemini_provider import GeminiProvider
        ProviderRegistry.register('gemini', GeminiProvider)
    except ImportError:
        Logger(__name__).warning("GeminiProvider not available")
    
    try:
        from ai.openrouter_provider import OpenRouterProvider
        ProviderRegistry.register('openrouter', OpenRouterProvider)
    except ImportError:
        Logger(__name__).warning("OpenRouterProvider not available")


# Auto-register on import
register_builtin_providers()
