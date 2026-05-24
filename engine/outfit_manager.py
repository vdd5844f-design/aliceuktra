"""
Outfit manager backed by recursive assets/ discovery.
"""

import json
import random
from datetime import date
from pathlib import Path

from core.logger import Logger
from engine.asset_scanner import get_default_scanner, normalize_id


class OutfitManager:
    """Manages outfit selection for a discovered character."""

    def __init__(self, character_id: str = "alice"):
        self.character_id = normalize_id(character_id or "alice")
        self.state_path = Path("data/outfit_state.json")
        self.logger = Logger(__name__)
        self.scanner = get_default_scanner()
        self.manifest = self.load_manifest()
        self.state = self.load_state()

    def load_manifest(self) -> dict:
        outfits = self.get_available_outfits()
        return {
            "id": self.character_id,
            "name": self.character_id.title(),
            "default_outfit": self.scanner.get_default_outfit(self.character_id),
            "available_outfits": outfits,
            "outfits": self.all_outfits(),
            "random_daily_outfit": False,
            "version": "discovered",
        }

    def load_state(self) -> dict:
        if not self.state_path.exists():
            return {}
        try:
            return json.loads(self.state_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            return {}

    def save_state(self):
        self.state_path.parent.mkdir(parents=True, exist_ok=True)
        self.state_path.write_text(
            json.dumps(self.state, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

    def reload(self):
        self.scanner.reload()
        self.manifest = self.load_manifest()
        if self.current_outfit() not in self.get_available_outfits():
            self.set_outfit(self.scanner.get_default_outfit(self.character_id))

    def get_available_outfits(self) -> list:
        outfits = self.scanner.get_outfit_ids(self.character_id)
        return outfits if outfits else ["default"]

    def all_outfits(self) -> list:
        character = self.scanner.get_character(self.character_id)
        if not character:
            return []

        outfits = []
        for outfit_id in self.scanner.get_outfit_ids(self.character_id):
            outfit = character.outfits.get(outfit_id)
            if not outfit:
                continue
            outfits.append(
                {
                    "id": outfit.id,
                    "name": outfit.name,
                    "path": str(outfit.path),
                    "enabled": True,
                    "frame_count": len(outfit.all_frames),
                    "source": outfit.source,
                }
            )
        return outfits

    def enabled_outfits(self) -> list:
        return self.all_outfits()

    def get_today_key(self) -> str:
        return date.today().isoformat()

    def pick_daily_outfit(self) -> str:
        today = self.get_today_key()
        if (
            self.state.get("character") == self.character_id
            and self.state.get("date") == today
            and self.state.get("outfit") in self.get_available_outfits()
        ):
            return self.state["outfit"]

        outfit_id = random.choice(self.get_available_outfits())
        self.state = {
            "character": self.character_id,
            "date": today,
            "outfit": outfit_id,
            "manual": False,
        }
        self.save_state()
        return outfit_id

    def set_outfit(self, outfit_id: str) -> str:
        valid_ids = self.get_available_outfits()
        if outfit_id not in valid_ids:
            fallback = self.scanner.get_default_outfit(self.character_id)
            self.logger.warning(f"Invalid outfit ID: {outfit_id}, using {fallback}")
            outfit_id = fallback

        self.state = {
            "character": self.character_id,
            "date": self.get_today_key(),
            "outfit": outfit_id,
            "manual": True,
        }
        self.save_state()
        return outfit_id

    def current_outfit(self) -> str:
        valid_ids = self.get_available_outfits()
        state_outfit = self.state.get("outfit")
        if self.state.get("character") == self.character_id and state_outfit in valid_ids:
            return state_outfit
        return self.scanner.get_default_outfit(self.character_id)

    def get_outfit_path(self, outfit_id: str = None) -> Path:
        outfit_id = outfit_id or self.current_outfit()
        outfit = self.scanner.get_outfit(self.character_id, outfit_id)
        if outfit:
            return outfit.path
        return Path("assets") / self.character_id

    def get_outfit_info(self, outfit_id: str = None) -> dict:
        outfit_id = outfit_id or self.current_outfit()
        for outfit in self.all_outfits():
            if outfit["id"] == outfit_id:
                return outfit
        return {}

    def outfit_exists(self, outfit_id: str) -> bool:
        return outfit_id in self.get_available_outfits()

    def enable_outfit(self, outfit_id: str, enabled: bool = True):
        return outfit_id in self.get_available_outfits()


if __name__ == "__main__":
    manager = OutfitManager()
    print(f"Character: {manager.character_id}")
    print(f"Current outfit: {manager.current_outfit()}")
    print(f"Outfit path: {manager.get_outfit_path()}")
    print(f"Enabled outfits: {[o['id'] for o in manager.enabled_outfits()]}")
