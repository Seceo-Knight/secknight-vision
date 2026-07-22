"""
Entrypoint. Wires together: config -> login (tray + tkinter popup) ->
activity tracker -> periodic activity/screenshot upload -> remote control
websocket client. Runs until the tray "Quit" item is used.
"""

import platform
import sys
import threading
import time
import uuid

from . import screenshot as screenshot_mod
from .api_client import ApiClient, ApiError
from .config import Config
from .remote_control import RemoteControlClient
from .tracker import ActivityTracker
from .tray_ui import TrayApp, prompt_login


def _get_mac_id() -> str:
    return f"{uuid.getnode():012x}"


class Agent:
    def __init__(self):
        self.config = Config()
        self.client = ApiClient(self.config)
        self.tray = TrayApp(on_quit=self._quit)
        self.tracker = ActivityTracker(self.config, on_batch_ready=self._on_batch_ready)
        self.remote_control = RemoteControlClient(self.config, get_access_token=lambda: self.client.access_token)
        self._running = False
        self._screenshot_thread = None

    # --------------------------------------------------------------- login
    def login(self):
        error = None
        while True:
            credentials = prompt_login(error_message=error)
            if not credentials:
                sys.exit(0)
            email, password = credentials
            try:
                self.client.login(email, password, mac_id=_get_mac_id())
                return
            except ApiError as exc:
                error = str(exc)

    # ------------------------------------------------------------- batches
    def _on_batch_ready(self, item: dict):
        sign = f"{item['dataId']}_{self.client.employee_name or 'agent'}"
        try:
            self.client.send_activity(sign, [item])
            self.tray.set_status(f"Active — last sync {time.strftime('%H:%M:%S')}")
        except ApiError:
            self.tray.set_status("Sync failed — will retry")

    # ----------------------------------------------------------- screenshots
    def _screenshot_loop(self):
        interval = self.config.screenshot_interval_seconds
        while self._running:
            time.sleep(interval)
            if not self.config.screenshots_enabled or not self._running:
                continue
            paths = []
            try:
                paths = screenshot_mod.capture_all_screens()
                self.client.upload_screenshots(paths)
            except Exception:
                pass
            finally:
                screenshot_mod.cleanup(paths)

    # ----------------------------------------------------------------- run
    def run(self):
        self.tray.start()
        self.tray.set_status("Logging in...")
        self.login()

        self.tray.set_status("Active")
        self._running = True

        self.tracker.start()
        self.remote_control.start()

        if self.config.screenshots_enabled:
            self._screenshot_thread = threading.Thread(target=self._screenshot_loop, daemon=True)
            self._screenshot_thread.start()

        try:
            while self._running:
                time.sleep(1)
        except KeyboardInterrupt:
            self._quit()

    def _quit(self):
        self._running = False
        self.tracker.stop()
        self.remote_control.stop()
        self.tray.stop()
        sys.exit(0)


def main():
    if platform.system() != "Windows":
        print(
            "Warning: remote-control and some window-tracking features are "
            "Windows-only in this build; running with reduced functionality."
        )
    Agent().run()


if __name__ == "__main__":
    main()
