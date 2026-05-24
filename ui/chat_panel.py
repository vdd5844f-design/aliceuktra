from PySide6.QtCore import Signal
from PySide6.QtWidgets import QHBoxLayout, QLabel, QPushButton, QTextEdit, QVBoxLayout, QWidget

from core.logger import Logger


class ChatPanel(QWidget):
    """Türkçe sohbet paneli."""

    message_sent = Signal(str)

    def __init__(self):
        super().__init__()
        self.logger = Logger(__name__)
        self.setup_ui()

    def setup_ui(self):
        layout = QVBoxLayout()
        title = QLabel("Alice ile Sohbet")
        title.setStyleSheet("font-weight: bold; font-size: 14px;")
        layout.addWidget(title)

        self.display = QTextEdit()
        self.display.setReadOnly(True)
        self.display.setMaximumHeight(200)
        layout.addWidget(self.display)

        input_layout = QHBoxLayout()
        self.input_field = QTextEdit()
        self.input_field.setMaximumHeight(80)
        self.input_field.setPlaceholderText("Mesajını yaz...")

        send_btn = QPushButton("Gönder")
        send_btn.clicked.connect(self.send_message)
        input_layout.addWidget(self.input_field)
        input_layout.addWidget(send_btn)
        layout.addLayout(input_layout)

        self.setLayout(layout)
        self.logger.debug("Sohbet paneli oluşturuldu")

    def send_message(self):
        text = self.input_field.toPlainText().strip()
        if text:
            self.add_user_message(text)
            self.message_sent.emit(text)
            self.input_field.clear()

    def add_user_message(self, text):
        self.display.append(f"<b>Sen:</b> {text}")

    def add_assistant_message(self, text):
        self.display.append(f"<b>Alice:</b> {text}")

    def clear(self):
        self.display.clear()
