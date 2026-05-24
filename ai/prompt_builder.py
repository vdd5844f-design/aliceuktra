from core.logger import Logger

class PromptBuilder:
    """Build system prompts for Alice"""
    
    def __init__(self, persona_file="config/persona.tr.txt"):
        self.logger = Logger(__name__)
        self.persona = self._load_persona(persona_file)
    
    def _load_persona(self, persona_file):
        """Load persona from file"""
        try:
            with open(persona_file, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            self.logger.error(f"Failed to load persona: {e}")
            return "You are Alice, a helpful desktop assistant."
    
    def build_system_prompt(self, context=None):
        """Build system prompt with optional context"""
        prompt = self.persona
        
        if context:
            prompt += f"\n\n### Bağlam:\n{context}"
        
        return prompt
    
    def build_with_memory(self, recent_conversations=None):
        """Build prompt with recent conversation history"""
        prompt = self.persona
        
        if recent_conversations:
            prompt += "\n\n### Son Konuşmalar:\n"
            for conv in recent_conversations[-3:]:  # Last 3 conversations
                prompt += f"- Kullanıcı: {conv['user']}\n"
                prompt += f"- Alice: {conv['assistant']}\n"
        
        return prompt
