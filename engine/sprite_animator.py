"""
SpriteAnimator - real PNG frame loader with discovered asset fallback.
"""

from pathlib import Path
import re
from typing import Dict, List, Optional, Tuple

from PySide6.QtGui import QPixmap

from core.logger import Logger
from engine.asset_scanner import EMOTIONS, get_default_scanner, normalize_emotion, normalize_id


class SpriteAnimator:
    """Loads sprite frames from AssetScanner and plays them as paths or QPixmaps."""

    STATIC_EXPRESSION = "static_expression"
    FRAME_ANIMATION = "frame_animation"

    def __init__(self, character_id: str = "alice", state=None, outfit_manager=None):
        self.logger = Logger(__name__)
        self.scanner = get_default_scanner()
        self.state = None
        self.outfit_manager = None

        if hasattr(character_id, "emotion") and hasattr(character_id, "is_talking"):
            self.state = character_id
            self.outfit_manager = state
            self.character_id = normalize_id(
                getattr(self.outfit_manager, "character_id", None) or "alice"
            )
        else:
            raw_character = str(character_id or "alice")
            path_candidate = Path(raw_character)
            if path_candidate.parts and (path_candidate.exists() or "/" in raw_character or "\\" in raw_character):
                self.character_id = normalize_id(path_candidate.name)
            else:
                self.character_id = normalize_id(raw_character)
            self.state = state
            self.outfit_manager = outfit_manager

        self.current_emotion = None
        self.current_outfit = None
        self.frame_index = 0
        self.frame_count = 0
        self.frame_paths_cache: Dict[Tuple[str, str, str, bool], Tuple[List[Path], str, str]] = {}
        self.pixmap_cache: Dict[Path, QPixmap] = {}
        self.last_sprite_path = ""
        self.last_fallback_info = ""
        self.last_resolved_outfit = ""
        self.last_frame_files: List[Path] = []
        self.animation_mode = "auto"
        self.last_animation_mode = self.STATIC_EXPRESSION

    def set_character(self, character_id: str):
        self.character_id = normalize_id(character_id)
        self.clear_cache()
        self.logger.info(f"Character changed to: {self.character_id}")

    def reload_assets(self):
        self.scanner.reload()
        self.clear_cache()

    def load_frames(self, emotion: str = "idle", outfit: str = None) -> List[str]:
        """Return frame file paths for legacy callers."""
        frames, _ = self._resolve_frame_paths(emotion, outfit)
        return [str(frame) for frame in frames]

    def load_frame_pixmaps(self, emotion: str, outfit: str = "default") -> List[QPixmap]:
        frames, _ = self._resolve_frame_paths(emotion, outfit)
        pixmaps: List[QPixmap] = []
        for frame in frames:
            pixmap = self.pixmap_cache.get(frame)
            if pixmap is None:
                pixmap = QPixmap(str(frame))
                if pixmap.isNull():
                    self.logger.warning(f"Failed to load pixmap: {frame}")
                    continue
                self.pixmap_cache[frame] = pixmap
            pixmaps.append(pixmap)
        return pixmaps

    def _resolve_frame_paths(self, emotion: str = "idle", outfit: str = None) -> Tuple[List[Path], str]:
        emotion = normalize_emotion(emotion)
        outfit = outfit or self._current_outfit()
        talking = self._is_talking() and emotion == "talk"
        cache_key = (self.character_id, outfit, emotion, talking)

        if cache_key in self.frame_paths_cache:
            frames, resolved_outfit, fallback_info = self.frame_paths_cache[cache_key]
            self.last_frame_files = frames
            self.last_resolved_outfit = resolved_outfit
            self.last_fallback_info = fallback_info
            return frames, resolved_outfit

        frames, resolved_outfit, fallback_info = self.scanner.resolve_frames(
            self.character_id,
            outfit,
            emotion,
        )
        mode = self._resolve_animation_mode(frames, emotion)
        self.last_animation_mode = mode
        if talking and frames:
            frames = self._select_talk_lip_frames(frames)
            mode = self.FRAME_ANIMATION if len(frames) > 1 else self.STATIC_EXPRESSION
            self.last_animation_mode = mode
        elif mode == self.STATIC_EXPRESSION and frames:
            frames = [self._select_best_frame(frames, emotion)]
        self.frame_paths_cache[cache_key] = (frames, resolved_outfit, fallback_info)
        self.last_frame_files = frames
        self.last_resolved_outfit = resolved_outfit
        self.last_fallback_info = fallback_info
        return frames, resolved_outfit

    def next_frame(self) -> Optional[str]:
        emotion = "talk" if self._is_talking() else self._current_emotion()
        outfit = self._current_outfit()

        if emotion != self.current_emotion or outfit != self.current_outfit:
            self.frame_index = 0
            self.current_emotion = emotion
            self.current_outfit = outfit

        frames, _ = self._resolve_frame_paths(emotion, outfit)
        if not frames:
            self.last_sprite_path = ""
            return None

        frame = frames[self.frame_index % len(frames)]
        self.frame_index += 1
        self.frame_count += 1
        self.last_sprite_path = str(frame)
        return str(frame)

    def get_next_frame(
        self,
        emotion: str = "idle",
        outfit: str = "default",
        force_reset: bool = False,
    ) -> Optional[QPixmap]:
        if emotion != self.current_emotion or outfit != self.current_outfit:
            force_reset = True
            self.current_emotion = emotion
            self.current_outfit = outfit

        frames, _ = self._resolve_frame_paths(emotion, outfit)
        if not frames:
            self.last_sprite_path = ""
            return None

        if force_reset:
            self.frame_index = 0

        frame = frames[self.frame_index % len(frames)]
        self.frame_index += 1
        self.frame_count += 1
        self.last_sprite_path = str(frame)
        return self._pixmap_for_path(frame)

    def get_current_frame(self, emotion: str = "idle", outfit: str = "default") -> Optional[QPixmap]:
        frames, _ = self._resolve_frame_paths(emotion, outfit)
        if not frames:
            self.last_sprite_path = ""
            return None
        frame = frames[self.frame_index % len(frames)]
        self.last_sprite_path = str(frame)
        return self._pixmap_for_path(frame)

    def _pixmap_for_path(self, frame: Path) -> Optional[QPixmap]:
        pixmap = self.pixmap_cache.get(frame)
        if pixmap is None:
            pixmap = QPixmap(str(frame))
            if pixmap.isNull():
                self.logger.warning(f"Failed to load pixmap: {frame}")
                return None
            self.pixmap_cache[frame] = pixmap
        return pixmap

    def reset_animation(self):
        self.frame_index = 0
        self.frame_count = 0

    def set_animation_mode(self, mode: str):
        if mode not in {self.STATIC_EXPRESSION, self.FRAME_ANIMATION, "auto"}:
            raise ValueError(f"Invalid animation mode: {mode}")
        self.animation_mode = mode
        self.clear_cache()

    def clear_cache(self):
        self.frame_paths_cache.clear()
        self.pixmap_cache.clear()
        self.last_frame_files = []
        self.logger.info("Frame cache cleared")

    def get_frame_count(self) -> int:
        emotion = "talk" if self._is_talking() else self._current_emotion()
        frames, _ = self._resolve_frame_paths(emotion, self._current_outfit())
        return len(frames)

    def get_current_frame_count(self, emotion: str = None, outfit: str = None) -> int:
        frames, _ = self._resolve_frame_paths(emotion or self._current_emotion(), outfit)
        return len(frames)

    def _current_emotion(self) -> str:
        if self.state and getattr(self.state, "emotion", None):
            return normalize_emotion(self.state.emotion)
        return normalize_emotion(self.current_emotion or "idle")

    def _current_outfit(self) -> str:
        if self.state and getattr(self.state, "current_outfit", None):
            return self.state.current_outfit
        if self.outfit_manager and hasattr(self.outfit_manager, "current_outfit"):
            return self.outfit_manager.current_outfit()
        return self.current_outfit or "default"

    def _is_talking(self) -> bool:
        return bool(self.state and getattr(self.state, "is_talking", False))

    def _resolve_animation_mode(self, frames: List[Path], emotion: str) -> str:
        if self.animation_mode in {self.STATIC_EXPRESSION, self.FRAME_ANIMATION}:
            return self.animation_mode

        if len(frames) <= 1:
            return self.STATIC_EXPRESSION

        emotion = normalize_emotion(emotion)
        frame_pattern = re.compile(r"^frame_\d+$", re.IGNORECASE)
        if all(frame.parent.name.lower() == emotion and frame_pattern.match(frame.stem) for frame in frames):
            return self.FRAME_ANIMATION
        return self.STATIC_EXPRESSION

    def _select_best_frame(self, frames: List[Path], emotion: str) -> Path:
        emotion = normalize_emotion(emotion)
        preferences = {
            "idle": ["closed_smile", "eyesclosed_smile", "smile"],
            "talk": ["closed_open", "mouthopen", "open"],
            "happy": ["smile_blush", "smile", "blush"],
            "angry": ["frown_blush", "frown", "angry", "mad"],
            "sleep": ["eyesclosed_smile", "eyesclosed", "closed", "sleep"],
            "move": ["smile", "open"],
        }

        scored = []
        for index, frame in enumerate(frames):
            stem = self._normalize_name(frame.stem)
            compact = re.sub(r"[^a-z0-9]+", "", stem)
            score = self._preference_score(stem, compact, emotion, preferences)
            if "_blush" in stem and emotion not in {"happy", "angry"}:
                score -= 2
            if "cat" in stem:
                score -= 1
            scored.append((score, -index, frame))

        return max(scored, key=lambda item: (item[0], item[1]))[2]

    def _select_talk_lip_frames(self, frames: List[Path]) -> List[Path]:
        open_frames = []
        closed_open_frames = []
        for frame in frames:
            stem = self._normalize_name(frame.stem)
            compact = re.sub(r"[^a-z0-9]+", "", stem)
            if (
                "closed_open" in stem
                or "eyesclosed_open" in stem
                or "closedopen" in compact
                or "eyesclosedopen" in compact
            ):
                closed_open_frames.append(frame)
            elif re.search(r"(^|_)open($|_)", stem) or "mouthopen" in compact:
                open_frames.append(frame)

        open_frame = self._select_preferred(open_frames, "open")
        closed_frame = self._select_preferred(closed_open_frames, "closed_open")
        if open_frame and closed_frame:
            return [open_frame, closed_frame]
        if open_frame:
            return [open_frame]
        return [self._select_best_frame(frames, "talk")]

    def _select_preferred(self, frames: List[Path], emotion: str) -> Optional[Path]:
        if not frames:
            return None
        return self._select_best_frame(frames, "talk" if emotion in {"open", "closed_open"} else emotion)

    def _preference_score(self, stem: str, compact: str, emotion: str, preferences: Dict[str, List[str]]) -> int:
        if emotion == "idle":
            if "closed_smile" in stem and "eyesclosed_smile" not in stem:
                return 100
            if "eyesclosed_smile" in stem or "eyesclosedsmile" in compact:
                return 90
            if "smile" in stem:
                return 80
            return 0

        if emotion == "talk":
            if re.search(r"(^|_)open($|_)", stem) and "closed_open" not in stem and "eyesclosed_open" not in stem:
                return 100
            if "closed_open" in stem or "eyesclosed_open" in stem or "closedopen" in compact or "eyesclosedopen" in compact:
                return 90
            if "open" in stem or "mouthopen" in compact:
                return 80
            return 0

        score = 0
        for rank, term in enumerate(preferences.get(emotion, [])):
            term_norm = self._normalize_name(term)
            term_compact = re.sub(r"[^a-z0-9]+", "", term_norm)
            if term_norm in stem or term_compact in compact:
                score = max(score, 100 - rank * 10)
        return score

    @staticmethod
    def _normalize_name(value: str) -> str:
        return re.sub(r"[\s\-]+", "_", value.lower())


__all__ = ["SpriteAnimator", "EMOTIONS"]
