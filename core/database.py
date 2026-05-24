"""
SQLite veritabanı yöneticisi - Alice AI Ultra Pet
Tüm kalıcı veriyi yönetir: konuşmalar, hafıza, ayarlar, provider yapılandırmaları
"""

import sqlite3
import json
import os
from datetime import datetime
from pathlib import Path


class Database:
    """SQLite tabanlı veritabanı yöneticisi"""

    DB_PATH = Path("data/alice.db")

    def __init__(self, db_path: str = None):
        self.db_path = Path(db_path) if db_path else self.DB_PATH
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._conn: sqlite3.Connection = None
        self._init_db()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.db_path), check_same_thread=False)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA foreign_keys=ON")
        return conn

    @property
    def conn(self) -> sqlite3.Connection:
        if self._conn is None:
            self._conn = self._connect()
        return self._conn

    def _init_db(self):
        """Şemayı oluştur (yoksa)"""
        with self._connect() as conn:
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS conversations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT NOT NULL,
                    started_at TEXT NOT NULL,
                    ended_at TEXT,
                    character TEXT DEFAULT 'alice',
                    outfit TEXT DEFAULT 'default',
                    provider TEXT DEFAULT 'ollama',
                    model TEXT DEFAULT '',
                    message_count INTEGER DEFAULT 0
                );

                CREATE TABLE IF NOT EXISTS messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    conversation_id INTEGER NOT NULL REFERENCES conversations(id),
                    role TEXT NOT NULL CHECK(role IN ('user','assistant','system')),
                    content TEXT NOT NULL,
                    emotion TEXT DEFAULT 'idle',
                    timestamp TEXT NOT NULL,
                    tokens INTEGER DEFAULT 0
                );

                CREATE TABLE IF NOT EXISTS memories (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    key TEXT NOT NULL UNIQUE,
                    value TEXT NOT NULL,
                    category TEXT DEFAULT 'general',
                    pinned INTEGER DEFAULT 0,
                    importance INTEGER DEFAULT 1,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    access_count INTEGER DEFAULT 0
                );

                CREATE TABLE IF NOT EXISTS provider_configs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL UNIQUE,
                    provider_type TEXT NOT NULL,
                    base_url TEXT NOT NULL,
                    api_key_encrypted TEXT DEFAULT '',
                    model TEXT NOT NULL,
                    temperature REAL DEFAULT 0.7,
                    max_tokens INTEGER DEFAULT 512,
                    enabled INTEGER DEFAULT 1,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS characters (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    description TEXT DEFAULT '',
                    voice_profile TEXT DEFAULT '',
                    personality_file TEXT DEFAULT '',
                    default_outfit TEXT DEFAULT 'default',
                    active INTEGER DEFAULT 0,
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS outfit_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    character_id TEXT NOT NULL,
                    outfit_id TEXT NOT NULL,
                    date TEXT NOT NULL,
                    manual INTEGER DEFAULT 0,
                    applied_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    event_type TEXT NOT NULL,
                    payload TEXT DEFAULT '{}',
                    created_at TEXT NOT NULL
                );

                CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id);
                CREATE INDEX IF NOT EXISTS idx_messages_ts ON messages(timestamp);
                CREATE INDEX IF NOT EXISTS idx_memories_key ON memories(key);
                CREATE INDEX IF NOT EXISTS idx_memories_pinned ON memories(pinned);
                CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
            """)
        self._conn = self._connect()

    # ──────────── Conversations ────────────

    def create_conversation(self, session_id: str, character: str = "alice",
                             outfit: str = "default", provider: str = "ollama",
                             model: str = "") -> int:
        now = datetime.now().isoformat()
        cur = self.conn.execute(
            """INSERT INTO conversations
               (session_id, started_at, character, outfit, provider, model)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (session_id, now, character, outfit, provider, model)
        )
        self.conn.commit()
        return cur.lastrowid

    def close_conversation(self, conversation_id: int):
        self.conn.execute(
            "UPDATE conversations SET ended_at=? WHERE id=?",
            (datetime.now().isoformat(), conversation_id)
        )
        self.conn.commit()

    def get_conversation(self, conversation_id: int) -> dict:
        row = self.conn.execute(
            "SELECT * FROM conversations WHERE id=?", (conversation_id,)
        ).fetchone()
        return dict(row) if row else {}

    def get_recent_conversations(self, limit: int = 20) -> list:
        rows = self.conn.execute(
            "SELECT * FROM conversations ORDER BY started_at DESC LIMIT ?", (limit,)
        ).fetchall()
        return [dict(r) for r in rows]

    # ──────────── Messages ────────────

    def add_message(self, conversation_id: int, role: str, content: str,
                    emotion: str = "idle", tokens: int = 0) -> int:
        now = datetime.now().isoformat()
        cur = self.conn.execute(
            """INSERT INTO messages
               (conversation_id, role, content, emotion, timestamp, tokens)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (conversation_id, role, content, emotion, now, tokens)
        )
        self.conn.execute(
            "UPDATE conversations SET message_count = message_count + 1 WHERE id=?",
            (conversation_id,)
        )
        self.conn.commit()
        return cur.lastrowid

    def get_messages(self, conversation_id: int, limit: int = 50) -> list:
        rows = self.conn.execute(
            """SELECT * FROM messages WHERE conversation_id=?
               ORDER BY timestamp ASC LIMIT ?""",
            (conversation_id, limit)
        ).fetchall()
        return [dict(r) for r in rows]

    def get_recent_messages(self, limit: int = 20) -> list:
        """Son N mesajı tüm konuşmalardan getir"""
        rows = self.conn.execute(
            """SELECT m.*, c.session_id FROM messages m
               JOIN conversations c ON m.conversation_id = c.id
               ORDER BY m.timestamp DESC LIMIT ?""",
            (limit,)
        ).fetchall()
        return [dict(r) for r in rows]

    def search_messages(self, query: str, limit: int = 20) -> list:
        rows = self.conn.execute(
            """SELECT * FROM messages WHERE content LIKE ?
               ORDER BY timestamp DESC LIMIT ?""",
            (f"%{query}%", limit)
        ).fetchall()
        return [dict(r) for r in rows]

    # ──────────── Memories ────────────

    def set_memory(self, key: str, value: str, category: str = "general",
                   importance: int = 1) -> int:
        now = datetime.now().isoformat()
        cur = self.conn.execute(
            """INSERT INTO memories (key, value, category, importance, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?)
               ON CONFLICT(key) DO UPDATE SET
                 value=excluded.value,
                 category=excluded.category,
                 importance=excluded.importance,
                 updated_at=excluded.updated_at,
                 access_count=access_count+1""",
            (key, value, category, importance, now, now)
        )
        self.conn.commit()
        return cur.lastrowid

    def get_memory(self, key: str) -> str | None:
        row = self.conn.execute(
            "SELECT value FROM memories WHERE key=?", (key,)
        ).fetchone()
        if row:
            self.conn.execute(
                "UPDATE memories SET access_count=access_count+1 WHERE key=?", (key,)
            )
            self.conn.commit()
            return row["value"]
        return None

    def get_all_memories(self, category: str = None, pinned_only: bool = False) -> list:
        if pinned_only:
            rows = self.conn.execute(
                "SELECT * FROM memories WHERE pinned=1 ORDER BY importance DESC, updated_at DESC"
            ).fetchall()
        elif category:
            rows = self.conn.execute(
                "SELECT * FROM memories WHERE category=? ORDER BY importance DESC, updated_at DESC",
                (category,)
            ).fetchall()
        else:
            rows = self.conn.execute(
                "SELECT * FROM memories ORDER BY pinned DESC, importance DESC, updated_at DESC"
            ).fetchall()
        return [dict(r) for r in rows]

    def pin_memory(self, key: str, pinned: bool = True):
        self.conn.execute(
            "UPDATE memories SET pinned=? WHERE key=?", (1 if pinned else 0, key)
        )
        self.conn.commit()

    def delete_memory(self, key: str):
        self.conn.execute("DELETE FROM memories WHERE key=?", (key,))
        self.conn.commit()

    def clear_memories(self, category: str = None):
        if category:
            self.conn.execute("DELETE FROM memories WHERE category=? AND pinned=0", (category,))
        else:
            self.conn.execute("DELETE FROM memories WHERE pinned=0")
        self.conn.commit()

    def search_memories(self, query: str) -> list:
        rows = self.conn.execute(
            """SELECT * FROM memories WHERE key LIKE ? OR value LIKE ?
               ORDER BY importance DESC""",
            (f"%{query}%", f"%{query}%")
        ).fetchall()
        return [dict(r) for r in rows]

    # ──────────── Provider Configs ────────────

    def save_provider(self, name: str, provider_type: str, base_url: str,
                      model: str, api_key: str = "", temperature: float = 0.7,
                      max_tokens: int = 512, enabled: bool = True) -> int:
        now = datetime.now().isoformat()
        cur = self.conn.execute(
            """INSERT INTO provider_configs
               (name, provider_type, base_url, api_key_encrypted, model,
                temperature, max_tokens, enabled, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
               ON CONFLICT(name) DO UPDATE SET
                 provider_type=excluded.provider_type,
                 base_url=excluded.base_url,
                 api_key_encrypted=excluded.api_key_encrypted,
                 model=excluded.model,
                 temperature=excluded.temperature,
                 max_tokens=excluded.max_tokens,
                 enabled=excluded.enabled,
                 updated_at=excluded.updated_at""",
            (name, provider_type, base_url, api_key, model,
             temperature, max_tokens, 1 if enabled else 0, now, now)
        )
        self.conn.commit()
        return cur.lastrowid

    def get_provider(self, name: str) -> dict:
        row = self.conn.execute(
            "SELECT * FROM provider_configs WHERE name=?", (name,)
        ).fetchone()
        return dict(row) if row else {}

    def get_all_providers(self) -> list:
        rows = self.conn.execute(
            "SELECT * FROM provider_configs ORDER BY name ASC"
        ).fetchall()
        return [dict(r) for r in rows]

    def delete_provider(self, name: str):
        self.conn.execute("DELETE FROM provider_configs WHERE name=?", (name,))
        self.conn.commit()

    # ──────────── Events ────────────

    def log_event(self, event_type: str, payload: dict = None):
        self.conn.execute(
            "INSERT INTO events (event_type, payload, created_at) VALUES (?, ?, ?)",
            (event_type, json.dumps(payload or {}), datetime.now().isoformat())
        )
        self.conn.commit()

    def get_events(self, event_type: str = None, limit: int = 100) -> list:
        if event_type:
            rows = self.conn.execute(
                "SELECT * FROM events WHERE event_type=? ORDER BY created_at DESC LIMIT ?",
                (event_type, limit)
            ).fetchall()
        else:
            rows = self.conn.execute(
                "SELECT * FROM events ORDER BY created_at DESC LIMIT ?", (limit,)
            ).fetchall()
        return [dict(r) for r in rows]

    # ──────────── Genel ────────────

    def close(self):
        if self._conn:
            self._conn.close()
            self._conn = None

    def vacuum(self):
        """Veritabanını optimize et"""
        self.conn.execute("VACUUM")

    def get_stats(self) -> dict:
        """İstatistikleri getir"""
        stats = {}
        for table in ["conversations", "messages", "memories", "provider_configs", "events"]:
            row = self.conn.execute(f"SELECT COUNT(*) as cnt FROM {table}").fetchone()
            stats[table] = row["cnt"]
        return stats
