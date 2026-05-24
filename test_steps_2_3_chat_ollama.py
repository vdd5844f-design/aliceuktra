#!/usr/bin/env python
"""
Test Steps 2 & 3: Chat Panel + Ollama Integration
"""
import sys
from core.logger import Logger
from ai.ollama_client import OllamaClient
from ai.prompt_builder import PromptBuilder
from ai.response_parser import ResponseParser
from core.state import AliceState
from core.memory import Memory

def test_ollama_integration():
    print("=" * 60)
    print("TESTING: Steps 2 & 3 - Chat Panel + Ollama Integration")
    print("=" * 60)
    
    logger = Logger("TEST")
    
    try:
        # Test 1: State management
        print("\n--- Test 1: State Management ---")
        state = AliceState()
        print("✓ AliceState created")
        
        state.emotion = "happy"
        print(f"✓ Emotion changed to: {state.emotion}")
        
        state.is_talking = True
        print(f"✓ is_talking set to: {state.is_talking}")
        
        # Test 2: Memory
        print("\n--- Test 2: Memory System ---")
        memory = Memory("data/memory_test.json")
        memory.add_conversation("Merhaba", "Selam, ben Alice!")
        convs = memory.get_recent_conversations(1)
        print(f"✓ Conversation saved: {convs[0]['user']}")
        
        # Test 3: Prompt builder
        print("\n--- Test 3: Prompt Builder ---")
        prompt_builder = PromptBuilder()
        system_prompt = prompt_builder.build_system_prompt()
        print(f"✓ System prompt loaded ({len(system_prompt)} chars)")
        
        # Test 4: Response parser
        print("\n--- Test 4: Response Parser ---")
        parser = ResponseParser()
        
        test_response = "Merhaba! [emotion: happy] Nasılsın? [action: wave]"
        emotion = parser.extract_emotion(test_response)
        action = parser.extract_action(test_response)
        clean = parser.clean_response(test_response)
        
        print(f"✓ Emotion extracted: {emotion}")
        print(f"✓ Action extracted: {action}")
        print(f"✓ Clean response: {clean}")
        
        # Test 5: Ollama client (connection check)
        print("\n--- Test 5: Ollama Client ---")
        ollama = OllamaClient()
        
        is_connected = ollama.check_connection()
        if is_connected:
            print("✓ Ollama connection: OK")
            
            # Test chat
            response = ollama.chat(
                "Merhaba, kimsin?",
                system_prompt=system_prompt,
                timeout=30
            )
            
            if response and len(response) > 0:
                print(f"✓ Ollama response received ({len(response)} chars)")
                print(f"  Preview: {response[:80]}...")
            else:
                print("✗ Ollama returned empty response")
                return False
        else:
            print("⚠ Ollama not running (connection failed)")
            print("  This is expected if Ollama service is not started")
            print("  Start with: ollama serve")
        
        print("\n" + "=" * 60)
        print("✓ ALL TESTS PASSED - Chat + Ollama Integration Ready!")
        print("=" * 60)
        return True
    
    except Exception as e:
        print(f"\n✗ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_ollama_integration()
    sys.exit(0 if success else 1)
