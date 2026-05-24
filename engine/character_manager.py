"""
Character manager backed by recursive assets/ discovery.
"""

from pathlib import Path
from typing import Dict, List, Optional

from core.logger import Logger
from engine.asset_scanner import get_default_scanner, normalize_id


class CharacterManager:
    """Character discovery and active character selection."""

    ASSETS_ROOT = Path("assets")
    CHARACTERS_PATH = ASSETS_ROOT / "characters"

    def __init__(self):
        self.logger = Logger(__name__)
        self.scanner = get_default_scanner()
        self.characters = self._load_characters()
        self.active_character = self._find_active_character()
        self.logger.info(f"CharacterManager initialized with {len(self.characters)} characters")

    def _load_characters(self) -> Dict[str, Dict]:
        characters = self.scanner.get_characters()
        for char_id in characters:
            self.logger.info(f"Loaded character: {char_id}")
        return characters

    def _find_active_character(self) -> Optional[str]:
        if "alice" in self.characters:
            return "alice"
        if self.characters:
            return sorted(self.characters.keys())[0]
        return None

    def get_character(self, char_id: str) -> Optional[Dict]:
        return self.characters.get(normalize_id(char_id))

    def get_all_characters(self) -> List[Dict]:
        return [self.characters[key] for key in sorted(self.characters.keys())]

    def get_character_path(self, char_id: str) -> Path:
        character = self.get_character(char_id)
        if character and character.get("path"):
            return Path(character["path"])
        return self.ASSETS_ROOT / normalize_id(char_id)

    def get_character_outfits(self, char_id: str) -> List[str]:
        outfits = self.scanner.get_outfit_ids(char_id)
        return outfits if outfits else ["default"]

    def get_default_outfit(self, char_id: str) -> str:
        return self.scanner.get_default_outfit(char_id)

    def set_active_character(self, char_id: str) -> bool:
        char_id = normalize_id(char_id)
        if char_id not in self.characters:
            self.logger.error(f"Character not found: {char_id}")
            return False

        self.active_character = char_id
        self.logger.info(f"Active character changed to: {char_id}")
        return True

    def reload_characters(self):
        self.scanner.reload()
        self.characters = self._load_characters()
        if self.active_character not in self.characters:
            self.active_character = self._find_active_character()
        self.logger.info("Characters reloaded")
