"""Load split QSS theme files."""

from pathlib import Path


def get_stylesheet():
    base = Path(__file__).parent / "qss"
    parts = []
    for name in ("base.qss", "widgets.qss"):
        path = base / name
        if path.exists():
            parts.append(path.read_text(encoding="utf-8"))
    return "\n".join(parts)
