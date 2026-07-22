"""
Loads config.json sitting next to the running executable/script.

config.json fields:
  auth_base_url        e.g. "http://192.168.1.68:3004"   (desktop service - login)
  data_base_url        e.g. "http://192.168.1.68:3001"   (store-logs-api - activity/screenshots)
  socket_url           e.g. "ws://192.168.1.68:5001"     (remote_socket - live screen cast)
  crypto_password      must byte-for-byte match CRYPTO_PASSWORD in the
                        server's Backend/desktop/.env and
                        Backend/store-logs-api/.env (32 ASCII chars)
  activity_interval_seconds   how often to batch-send activity (default 180)
  screenshot_interval_seconds how often to capture a screenshot (default 300)
  idle_threshold_seconds      no-input gap before marking the user idle (default 300)
"""

import json
import os
import sys


def _base_dir() -> str:
    # PyInstaller onefile: sys._MEIPASS is the temp extraction dir, but the
    # config file should live next to the actual .exe, not inside the
    # temp bundle - use sys.executable's directory when frozen.
    if getattr(sys, "frozen", False):
        return os.path.dirname(sys.executable)
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


DEFAULTS = {
    "activity_interval_seconds": 180,
    "screenshot_interval_seconds": 300,
    "idle_threshold_seconds": 300,
    "screenshots_enabled": True,
    "idle_detection_enabled": True,
    "remote_control_enabled": True,
}


class Config:
    def __init__(self, path: str = None):
        self.path = path or os.path.join(_base_dir(), "config.json")
        if not os.path.exists(self.path):
            raise FileNotFoundError(
                f"config.json not found at {self.path}. Copy config.example.json to "
                f"config.json next to the executable and fill in your server URLs."
            )
        with open(self.path, "r") as f:
            data = json.load(f)

        merged = {**DEFAULTS, **data}
        for key, value in merged.items():
            setattr(self, key, value)

        for required in ("auth_base_url", "data_base_url", "crypto_password"):
            if not getattr(self, required, None):
                raise ValueError(f"config.json is missing required field: {required}")

        self.auth_base_url = self.auth_base_url.rstrip("/")
        self.data_base_url = self.data_base_url.rstrip("/")
        if getattr(self, "socket_url", None):
            self.socket_url = self.socket_url.rstrip("/")
