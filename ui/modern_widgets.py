"""Reusable premium UI widgets and outline icons."""

from PySide6.QtCore import QPointF, QSize, Qt
from PySide6.QtGui import QColor, QIcon, QPainter, QPen, QPixmap
from PySide6.QtWidgets import QFrame, QGraphicsDropShadowEffect, QPushButton


def make_icon(name: str, color: str = "#00e5ff", size: int = 22) -> QIcon:
    pixmap = QPixmap(size, size)
    pixmap.fill(Qt.transparent)
    painter = QPainter(pixmap)
    painter.setRenderHint(QPainter.Antialiasing)
    pen = QPen(QColor(color), 1.8)
    pen.setCapStyle(Qt.RoundCap)
    pen.setJoinStyle(Qt.RoundJoin)
    painter.setPen(pen)
    m = size * 0.22
    w = size - m * 2
    cx = size / 2
    cy = size / 2

    if name == "send":
        painter.drawLine(QPointF(m, m), QPointF(size - m, cy))
        painter.drawLine(QPointF(size - m, cy), QPointF(m, size - m))
        painter.drawLine(QPointF(size - m, cy), QPointF(m + 3, cy))
    elif name == "pet":
        painter.drawEllipse(QPointF(cx, cy), w * 0.34, w * 0.34)
        painter.drawLine(QPointF(cx - 4, cy + 8), QPointF(cx - 8, size - m))
        painter.drawLine(QPointF(cx + 4, cy + 8), QPointF(cx + 8, size - m))
    elif name == "settings":
        painter.drawEllipse(QPointF(cx, cy), w * 0.25, w * 0.25)
        for dx, dy in [(0, -1), (1, 0), (0, 1), (-1, 0)]:
            painter.drawLine(QPointF(cx + dx * 5, cy + dy * 5), QPointF(cx + dx * 8, cy + dy * 8))
    elif name == "close":
        painter.drawLine(QPointF(m, m), QPointF(size - m, size - m))
        painter.drawLine(QPointF(size - m, m), QPointF(m, size - m))
    elif name == "minimize":
        painter.drawLine(QPointF(m, cy), QPointF(size - m, cy))
    elif name == "refresh":
        painter.drawArc(int(m), int(m), int(w), int(w), 30 * 16, 290 * 16)
        painter.drawLine(QPointF(size - m - 2, m + 3), QPointF(size - m, m + 9))
    elif name == "voice":
        painter.drawRect(int(m), int(cy - 4), 5, 8)
        painter.drawLine(QPointF(m + 6, cy - 6), QPointF(cx, cy - 10))
        painter.drawLine(QPointF(m + 6, cy + 6), QPointF(cx, cy + 10))
        painter.drawArc(int(cx - 1), int(cy - 8), 12, 16, -45 * 16, 90 * 16)
    elif name == "spark":
        painter.drawLine(QPointF(cx, m), QPointF(cx, size - m))
        painter.drawLine(QPointF(m, cy), QPointF(size - m, cy))
        painter.drawLine(QPointF(cx - 5, cy - 5), QPointF(cx + 5, cy + 5))
        painter.drawLine(QPointF(cx + 5, cy - 5), QPointF(cx - 5, cy + 5))
    else:
        painter.drawEllipse(QPointF(cx, cy), w * 0.32, w * 0.32)

    painter.end()
    return QIcon(pixmap)


class ModernButton(QPushButton):
    def __init__(self, text: str, icon_name: str = "", variant: str = "primary"):
        super().__init__(text)
        self.setProperty("variant", variant)
        self.setCursor(Qt.PointingHandCursor)
        self.setMinimumHeight(42)
        if icon_name:
            self.setIcon(make_icon(icon_name))
            self.setIconSize(QSize(20, 20))


class IconButton(QPushButton):
    def __init__(self, icon_name: str, tooltip: str = ""):
        super().__init__("")
        self.setProperty("variant", "icon")
        self.setCursor(Qt.PointingHandCursor)
        self.setFixedSize(42, 42)
        self.setIcon(make_icon(icon_name))
        self.setIconSize(QSize(21, 21))
        if tooltip:
            self.setToolTip(tooltip)


class GlassPanel(QFrame):
    def __init__(self, panel_type: str = "panel"):
        super().__init__()
        self.setObjectName(panel_type)
        self.setProperty("glass", True)
        shadow = QGraphicsDropShadowEffect(self)
        shadow.setBlurRadius(42)
        shadow.setOffset(0, 18)
        shadow.setColor(QColor(124, 58, 237, 34))
        self.setGraphicsEffect(shadow)
