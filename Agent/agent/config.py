"""
Loads config.json sitting next to the running executable/script.

config.json fields:
  auth_base_url        e.g. "http://192.168.1.68:3004"   (desktop service - login)
  data_base_url        e.g. "http://192.168.1.68:3001"   (store-logs-api - activity/screenshots)
  socket_url           e.g. "ws://192.168.1.68:3006"     (Backend/realtime - live Screen
                       Cast/remote-control/webcam AND notifications share this one service
                       and port - this is what the Frontend's ScreenCastTab.jsx actually
                       connects to via apiService.SOCKET_BASE_URL/VITE_SOCKET_URL.
                       Backend/remote_socket implements a near-identical but SEPARATE
                       protocol on its own port (3002 by default) that nothing in the
                       Frontend actually talks to - connecting the agent there instead
                       will authenticate fine but the admin UI will never see it as
                       online. Confirm the real port with
                       `grep PORT Backend/realtime/.env` on the server.)
  crypto_password      must byte-for-byte match CRYPTO_PASSWORD in the
                        server's Backend/desktop/.env and
                        Backend/store-logs-api/.env (32 ASCII chars)
  activity_interval_seconds   how often to batch-send activity (default 180)
  screenshot_interval_seconds how often to capture a screenshot (default 300)
  idle_threshold_seconds      no-input gap before marking the user idle (default 300)
  screen_record_enabled          capture+upload periodic screen recordings (default false -
                                  see agent/screen_record.py docstring: the backend currently
                                  requires a cloud storage provider to accept these)
  screen_record_interval_seconds how often to start a new recording (default 600)
  screen_record_duration_seconds length of each recording, server hard-caps at 300 (default 60)
  screen_record_fps              capture frame rate (default 4)
  usb_detection_enabled          log USB drive connect/disconnect events - feeds the admin
                                  Frontend's DLP > USB Detection tab (default true)
  clipboard_monitoring_enabled   log clipboard copy events (text only) - feeds the admin
                                  Frontend's DLP > Clipboard Logs tab (default true - this is
                                  the most privacy-sensitive of the DLP features since it can
                                  capture anything a user copies, consider disabling per your
                                  org's data-handling policy if that's a concern)
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
    "usb_detection_enabled": True,
    "clipboard_monitoring_enabled": True,
    "screen_record_enabled": False,
    "screen_record_interval_seconds": 600,
    "screen_record_duration_seconds": 60,
    "screen_record_fps": 4,
}


class Config:
    def __init__(self, path: str = None):
        self.path = path or os.path.join(_base_dir(), "config.json")
        if not os.path.exists(self.path):
            self._run_first_time_setup()
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

    def _run_first_time_setup(self):
        """
        No config.json next to the exe yet - this is a first run on a fresh
        machine. Rather than requiring a per-deployment config.json baked in
        before building/distributing the .exe (which meant a separate build
        for every customer, and no way for an installer to fix a typo'd
        server address afterwards without editing raw JSON), prompt for the
        server address once via a GUI dialog and persist the result here.
        One generic .exe build now works against any SecKnight Vision
        deployment.
        """
        # Local import - tkinter/pystray shouldn't be a hard dependency of
        # every Config() construction, only the first-run path that needs it.
        from .tray_ui import prompt_server_setup

        error = None
        while True:
            answers = prompt_server_setup(error_message=error)
            if not answers:
                # User closed the setup dialog - nothing to run against.
                sys.exit(0)
            data = {**DEFAULTS, **answers}
            try:
                with open(self.path, "w") as f:
                    json.dump(data, f, indent=2)
                return
            except OSError as exc:
                error = f"Couldn't save config.json: {exc}"
