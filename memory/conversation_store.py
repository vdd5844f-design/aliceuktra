"""
Memory Store - SQLite-based conversation and memory storage
"""

from datetime import datetime
from typing import List, Dict, Optional
from core.database import Database
from core.logger import Logger


class ConversationStore:
    """Manage conversations in SQLite"""
    
    def __init__(self, db: Database = None):
        self.db = db or Database()
        self.logger = Logger(__name__)
        self.current_conversation_id = None
    
    def create_conversation(self, session_id: str, character: str = "alice",
                           outfit: str = "default", provider: str = "ollama") -> int:
        """Create new conversation"""
        conversation_id = self.db.create_conversation(
            session_id=session_id,
            character=character,
            outfit=outfit,
            provider=provider
        )
        self.current_conversation_id = conversation_id
        self.logger.info(f"Conversation created: {conversation_id}")
        return conversation_id
    
    def add_message(self, role: str, content: str, emotion: str = "idle") -> int:
        """Add message to current conversation"""
        if not self.current_conversation_id:
            self.logger.warning("No active conversation")
            return -1
        
        now = datetime.now().isoformat()
        cur = self.db.conn.execute(
            """INSERT INTO messages
               (conversation_id, role, content, emotion, timestamp)
               VALUES (?, ?, ?, ?, ?)""",
            (self.current_conversation_id, role, content, emotion, now)
        )
        self.db.conn.commit()
        
        message_id = cur.lastrowid
        self.logger.debug(f"Message added: {message_id}")
        return message_id
    
    def get_conversation_history(self, conversation_id: int = None, limit: int = 20) -> List[Dict]:
        """Get conversation history"""
        if conversation_id is None:
            conversation_id = self.current_conversation_id
        
        if not conversation_id:
            return []
        
        rows = self.db.conn.execute(
            """SELECT role, content, emotion, timestamp FROM messages
               WHERE conversation_id = ?
               ORDER BY timestamp DESC
               LIMIT ?""",
            (conversation_id, limit)
        ).fetchall()
        
        # Reverse to chronological order
        return [dict(row) for row in reversed(rows)]
    
    def close_conversation(self, conversation_id: int = None):
        """Close conversation"""
        if conversation_id is None:
            conversation_id = self.current_conversation_id
        
        if conversation_id:
            self.db.close_conversation(conversation_id)
            self.logger.info(f"Conversation closed: {conversation_id}")
    
    def search_messages(self, query: str) -> List[Dict]:
        """Search messages by content"""
        rows = self.db.conn.execute(
            """SELECT * FROM messages WHERE content LIKE ?
               ORDER BY timestamp DESC LIMIT 50""",
            (f"%{query}%",)
        ).fetchall()
        
        return [dict(row) for row in rows]


class MemoryStore:
    """Manage persistent memories"""
    
    def __init__(self, db: Database = None):
        self.db = db or Database()
        self.logger = Logger(__name__)
    
    def save_memory(self, key: str, value: str, category: str = "general") -> bool:
        """Save or update a memory"""
        try:
            now = datetime.now().isoformat()
            
            # Check if exists
            existing = self.db.conn.execute(
                "SELECT id FROM memories WHERE key=?", (key,)
            ).fetchone()
            
            if existing:
                # Update
                self.db.conn.execute(
                    """UPDATE memories SET value=?, updated_at=?, access_count=access_count+1
                       WHERE key=?""",
                    (value, now, key)
                )
            else:
                # Insert
                self.db.conn.execute(
                    """INSERT INTO memories
                       (key, value, category, created_at, updated_at)
                       VALUES (?, ?, ?, ?, ?)""",
                    (key, value, category, now, now)
                )
            
            self.db.conn.commit()
            self.logger.debug(f"Memory saved: {key}")
            return True
        
        except Exception as e:
            self.logger.error(f"Failed to save memory: {e}")
            return False
    
    def get_memory(self, key: str) -> Optional[str]:
        """Get memory by key"""
        row = self.db.conn.execute(
            "SELECT value FROM memories WHERE key=?", (key,)
        ).fetchone()
        
        return row[0] if row else None
    
    def list_memories(self, category: str = None, pinned_only: bool = False) -> List[Dict]:
        """List all memories"""
        if category:
            query = "SELECT * FROM memories WHERE category=?"
            params = (category,)
        elif pinned_only:
            query = "SELECT * FROM memories WHERE pinned=1"
            params = ()
        else:
            query = "SELECT * FROM memories"
            params = ()
        
        rows = self.db.conn.execute(
            query + " ORDER BY pinned DESC, updated_at DESC",
            params
        ).fetchall()
        
        return [dict(row) for row in rows]
    
    def delete_memory(self, key: str) -> bool:
        """Delete a memory"""
        try:
            self.db.conn.execute("DELETE FROM memories WHERE key=?", (key,))
            self.db.conn.commit()
            self.logger.info(f"Memory deleted: {key}")
            return True
        except Exception as e:
            self.logger.error(f"Failed to delete memory: {e}")
            return False
    
    def pin_memory(self, key: str, pinned: bool = True) -> bool:
        """Pin/unpin a memory"""
        try:
            self.db.conn.execute(
                "UPDATE memories SET pinned=? WHERE key=?",
                (1 if pinned else 0, key)
            )
            self.db.conn.commit()
            return True
        except Exception as e:
            self.logger.error(f"Failed to pin memory: {e}")
            return False
