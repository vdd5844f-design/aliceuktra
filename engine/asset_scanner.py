"""
Asset scanner for the real assets/ tree.

The scanner does not require manifests or a fixed folder layout. It discovers
characters, outfits/packages, nested variants, and emotion frame groups from
PNG files that already exist under assets/.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
import re
from typing import Dict, Iterable, List, Optional, Tuple

from core.logger import Logger


EMOTIONS = ["idle", "talk", "happy", "angry", "sleep", "move"]
EMOTION_DIRS = set(EMOTIONS)


@dataclass
class OutfitAsset:
    id: str
    name: str
    path: Path
    source: str
    priority: int = 100
    frames_by_emotion: Dict[str, List[Path]] = field(
        default_factory=lambda: {emotion: [] for emotion in EMOTIONS}
    )
    all_frames: List[Path] = field(default_factory=list)

    def add_frames(self, frames: Iterable[Path]) -> None:
        for frame in frames:
            if frame not in self.all_frames:
                self.all_frames.append(frame)

            for emotion in classify_emotions(frame):
                bucket = self.frames_by_emotion.setdefault(emotion, [])
                if frame not in bucket:
                    bucket.append(frame)

    def finalize(self) -> None:
        self.all_frames = natural_sort_paths(self.all_frames)
        for emotion in EMOTIONS:
            self.frames_by_emotion[emotion] = natural_sort_paths(
                self.frames_by_emotion.get(emotion, [])
            )


@dataclass
class CharacterAsset:
    id: str
    name: str
    path: Path
    outfits: Dict[str, OutfitAsset] = field(default_factory=dict)

    @property
    def png_count(self) -> int:
        return sum(len(outfit.all_frames) for outfit in self.outfits.values())


class AssetScanner:
    """Recursive, cached discovery of PNG character assets."""

    def __init__(self, assets_root: Path | str = "assets"):
        self.assets_root = Path(assets_root)
        self.logger = Logger(__name__)
        self.characters: Dict[str, CharacterAsset] = {}
        self.png_files: List[Path] = []
        self._scanned = False
        self.last_fallback_info = ""

    def scan(self, force: bool = False) -> Dict[str, CharacterAsset]:
        if self._scanned and not force:
            return self.characters

        self.characters = {}
        self.last_fallback_info = ""
        self.png_files = self._find_png_files()

        if not self.assets_root.exists():
            self.logger.warning(f"Assets root not found: {self.assets_root}")
            self._scanned = True
            return self.characters

        for child in sorted(self.assets_root.iterdir(), key=lambda p: p.name.lower()):
            if not child.is_dir() or child.name == "__pycache__":
                continue
            if child.name.lower() == "characters":
                self._scan_characters_folder(child)
            else:
                self._scan_character_root(child, source="assets-root", priority=10)

        for character in self.characters.values():
            for outfit in character.outfits.values():
                outfit.finalize()

        self._scanned = True
        self.logger.info(
            f"Scanned {len(self.png_files)} PNG assets, "
            f"{len(self.characters)} characters"
        )
        return self.characters

    def reload(self) -> Dict[str, CharacterAsset]:
        self._scanned = False
        return self.scan(force=True)

    def _find_png_files(self) -> List[Path]:
        if not self.assets_root.exists():
            return []
        try:
            return natural_sort_paths(self.assets_root.rglob("*.png"))
        except Exception as exc:
            self.logger.error(f"PNG scan failed under {self.assets_root}: {exc}")
            return []

    def _scan_characters_folder(self, characters_dir: Path) -> None:
        for char_dir in sorted(characters_dir.iterdir(), key=lambda p: p.name.lower()):
            if not char_dir.is_dir():
                continue

            character = self._ensure_character(
                char_dir.name,
                display_name(char_dir.name),
                char_dir,
            )

            outfits_dir = char_dir / "outfits"
            if outfits_dir.exists():
                for outfit_dir in sorted(outfits_dir.iterdir(), key=lambda p: p.name.lower()):
                    if not outfit_dir.is_dir():
                        continue
                    frames = natural_sort_paths(outfit_dir.rglob("*.png"))
                    if frames:
                        self._add_outfit(
                            character,
                            outfit_dir.name,
                            display_name(outfit_dir.name),
                            outfit_dir,
                            frames,
                            source="assets-characters",
                            priority=60,
                        )
            else:
                self._scan_character_root(char_dir, source="assets-characters", priority=60)

    def _scan_character_root(self, char_dir: Path, source: str, priority: int) -> None:
        character = self._ensure_character(
            char_dir.name,
            display_name(char_dir.name),
            char_dir,
        )

        default_frames: List[Path] = []
        direct_frames = natural_sort_paths(char_dir.glob("*.png"))
        default_frames.extend(direct_frames)

        for child in sorted(char_dir.iterdir(), key=lambda p: p.name.lower()):
            if not child.is_dir():
                continue

            child_name = child.name
            child_lower = child_name.lower()

            if child_lower == "outfits":
                self._scan_structured_outfits(character, child, source, priority + 20)
                continue

            child_frames = natural_sort_paths(child.rglob("*.png"))
            if not child_frames:
                continue

            if child_lower in EMOTION_DIRS:
                default_frames.extend(child_frames)
                continue

            self._add_outfit(
                character,
                child_name,
                child_name,
                child,
                child_frames,
                source=source,
                priority=priority,
            )
            self._add_nested_variants(character, child, source, priority + 5)

        if default_frames:
            self._add_outfit(
                character,
                "default",
                "default",
                char_dir,
                default_frames,
                source=source,
                priority=0,
            )

    def _scan_structured_outfits(
        self,
        character: CharacterAsset,
        outfits_dir: Path,
        source: str,
        priority: int,
    ) -> None:
        for outfit_dir in sorted(outfits_dir.iterdir(), key=lambda p: p.name.lower()):
            if not outfit_dir.is_dir():
                continue
            frames = natural_sort_paths(outfit_dir.rglob("*.png"))
            if frames:
                self._add_outfit(
                    character,
                    outfit_dir.name,
                    display_name(outfit_dir.name),
                    outfit_dir,
                    frames,
                    source=source,
                    priority=priority,
                )

    def _add_nested_variants(
        self,
        character: CharacterAsset,
        package_dir: Path,
        source: str,
        priority: int,
    ) -> None:
        for nested_dir in sorted(package_dir.rglob("*"), key=lambda p: str(p).lower()):
            if not nested_dir.is_dir():
                continue
            frames = natural_sort_paths(nested_dir.rglob("*.png"))
            if not frames:
                continue
            rel = nested_dir.relative_to(package_dir)
            if not rel.parts:
                continue
            outfit_id = f"{package_dir.name} / {' / '.join(rel.parts)}"
            self._add_outfit(
                character,
                outfit_id,
                outfit_id,
                nested_dir,
                frames,
                source=source,
                priority=priority,
            )

    def _ensure_character(self, raw_id: str, name: str, path: Path) -> CharacterAsset:
        char_id = normalize_id(raw_id)
        if char_id not in self.characters:
            self.characters[char_id] = CharacterAsset(char_id, name, path)
        else:
            existing = self.characters[char_id]
            if existing.path.parts and "characters" in existing.path.parts and "characters" not in path.parts:
                existing.path = path
            if not existing.name:
                existing.name = name
        return self.characters[char_id]

    def _add_outfit(
        self,
        character: CharacterAsset,
        outfit_id: str,
        name: str,
        path: Path,
        frames: Iterable[Path],
        source: str,
        priority: int,
    ) -> OutfitAsset:
        outfit_key = outfit_id
        if outfit_key not in character.outfits:
            character.outfits[outfit_key] = OutfitAsset(
                id=outfit_key,
                name=name,
                path=path,
                source=source,
                priority=priority,
            )
        else:
            outfit = character.outfits[outfit_key]
            if priority < outfit.priority:
                outfit.path = path
                outfit.source = source
                outfit.priority = priority

        character.outfits[outfit_key].add_frames(frames)
        return character.outfits[outfit_key]

    def get_characters(self) -> Dict[str, Dict]:
        self.scan()
        return {
            char_id: {
                "id": char.id,
                "name": char.name,
                "path": str(char.path),
                "default_outfit": self.get_default_outfit(char_id),
                "available_outfits": self.get_outfit_ids(char_id),
                "png_count": char.png_count,
            }
            for char_id, char in self.characters.items()
        }

    def get_character(self, char_id: str) -> Optional[CharacterAsset]:
        self.scan()
        return self.characters.get(normalize_id(char_id))

    def get_outfit_ids(self, char_id: str) -> List[str]:
        character = self.get_character(char_id)
        if not character:
            return []
        outfits = sorted(
            character.outfits.values(),
            key=lambda outfit: (outfit.priority, outfit.name.lower()),
        )
        return [outfit.id for outfit in outfits]

    def get_default_outfit(self, char_id: str) -> str:
        outfits = self.get_outfit_ids(char_id)
        if "default" in outfits:
            return "default"
        return outfits[0] if outfits else "default"

    def get_outfit(self, char_id: str, outfit_id: Optional[str]) -> Optional[OutfitAsset]:
        character = self.get_character(char_id)
        if not character:
            return None
        if outfit_id in character.outfits:
            return character.outfits[outfit_id]
        default_id = self.get_default_outfit(char_id)
        return character.outfits.get(default_id)

    def resolve_frames(
        self,
        char_id: str,
        outfit_id: Optional[str],
        emotion: str,
    ) -> Tuple[List[Path], str, str]:
        """Return frames, resolved outfit id, and fallback information."""
        self.scan()
        if not self.png_files:
            self.last_fallback_info = "No PNG assets found under assets/"
            return [], outfit_id or "default", self.last_fallback_info

        requested_char = normalize_id(char_id)
        character = self.characters.get(requested_char)
        fallback_parts: List[str] = []
        if not character:
            character = next(iter(self.characters.values()), None)
            fallback_parts.append(f"character fallback: {char_id} -> {character.id if character else 'none'}")

        if not character:
            self.last_fallback_info = "No character assets available"
            return [], outfit_id or "default", self.last_fallback_info

        outfit = character.outfits.get(outfit_id or "")
        if not outfit:
            default_id = self.get_default_outfit(character.id)
            outfit = character.outfits.get(default_id)
            fallback_parts.append(f"outfit fallback: {outfit_id or 'none'} -> {default_id}")

        if not outfit and character.outfits:
            outfit = next(iter(character.outfits.values()))
            fallback_parts.append(f"outfit fallback: first available -> {outfit.id}")

        if not outfit:
            global_frame = self.png_files[0]
            self.last_fallback_info = "global PNG fallback"
            return [global_frame], "global", self.last_fallback_info

        requested_emotion = normalize_emotion(emotion)
        frames = outfit.frames_by_emotion.get(requested_emotion, [])
        if not frames and requested_emotion != "idle":
            idle_frames = outfit.frames_by_emotion.get("idle", [])
            if idle_frames:
                frames = idle_frames
                fallback_parts.append(f"emotion fallback: {requested_emotion} -> idle")

        if not frames:
            frames = outfit.all_frames
            if frames:
                fallback_parts.append(f"emotion fallback: {requested_emotion} -> any PNG in outfit")

        self.last_fallback_info = "; ".join(fallback_parts) if fallback_parts else "none"
        return frames, outfit.id, self.last_fallback_info

    def get_debug_summary(self, char_id: Optional[str] = None, outfit_id: Optional[str] = None) -> Dict:
        self.scan()
        selected_char = self.get_character(char_id or "")
        selected_outfit = self.get_outfit(char_id or "", outfit_id) if char_id else None
        return {
            "assets_root": str(self.assets_root.resolve()),
            "png_count": len(self.png_files),
            "character_count": len(self.characters),
            "outfit_count": sum(len(char.outfits) for char in self.characters.values()),
            "selected_outfit_frames": [
                str(path) for path in (selected_outfit.all_frames if selected_outfit else [])
            ],
            "selected_character": selected_char.id if selected_char else "",
            "selected_outfit": selected_outfit.id if selected_outfit else "",
            "last_fallback_info": self.last_fallback_info,
        }


def normalize_id(value: str) -> str:
    return str(value or "").strip().lower()


def normalize_emotion(value: str) -> str:
    value = normalize_id(value)
    return value if value in EMOTIONS else "idle"


def display_name(value: str) -> str:
    clean = str(value or "").replace("_", " ").replace("-", " ").strip()
    return clean.title() if clean else "Unknown"


def natural_sort_paths(paths: Iterable[Path]) -> List[Path]:
    return sorted(paths, key=lambda path: natural_key(str(path)))


def natural_key(value: str) -> List[object]:
    return [int(part) if part.isdigit() else part.lower() for part in re.split(r"(\d+)", value)]


def _text_variants(path: Path) -> Tuple[str, str]:
    text = path.stem.lower()
    text = re.sub(r"[\s\-]+", "_", text)
    compact = re.sub(r"[^a-z0-9]+", "", text)
    return text, compact


def _contains(text: str, compact: str, term: str) -> bool:
    normalized = term.lower().replace(" ", "_").replace("-", "_")
    compact_term = re.sub(r"[^a-z0-9]+", "", normalized)
    return normalized in text or compact_term in compact


def classify_emotions(path: Path) -> List[str]:
    text, compact = _text_variants(path)
    emotions: List[str] = []

    path_emotions = {part.lower() for part in path.parts if part.lower() in EMOTION_DIRS}
    for emotion in EMOTIONS:
        if emotion in path_emotions:
            emotions.append(emotion)

    if any(_contains(text, compact, term) for term in ["smile", "closed_smile", "eyesclosed_smile", "normal", "default", "neutral"]):
        emotions.append("idle")

    if any(_contains(text, compact, term) for term in ["mouthopen", "_open", "closed_open", "open"]):
        emotions.append("talk")

    negative_face = any(_contains(text, compact, term) for term in ["frown", "angry", "mad"])
    if (
        any(_contains(text, compact, term) for term in ["smile", "happy"])
        or (_contains(text, compact, "blush") and not negative_face)
    ):
        emotions.append("happy")

    if any(_contains(text, compact, term) for term in ["frown", "angry", "mad"]):
        emotions.append("angry")

    if any(_contains(text, compact, term) for term in ["eyesclosed", "closed", "sleep"]):
        emotions.append("sleep")

    if any(_contains(text, compact, term) for term in ["smile", "open"]):
        emotions.append("move")

    if not emotions:
        emotions.append("idle")

    unique: List[str] = []
    for emotion in emotions:
        if emotion in EMOTIONS and emotion not in unique:
            unique.append(emotion)
    return unique


_DEFAULT_SCANNER: Optional[AssetScanner] = None


def get_default_scanner() -> AssetScanner:
    global _DEFAULT_SCANNER
    if _DEFAULT_SCANNER is None:
        _DEFAULT_SCANNER = AssetScanner()
    return _DEFAULT_SCANNER
