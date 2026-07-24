"""
Entrypoint. Wires together: config -> login (tray + tkinter popup) ->
activity tracker -> periodic activity/screenshot upload -> remote control
websocket client. Runs until the tray "Quit" item is used.
"""

import os
import platform
import sys
import threading
import time
import uuid

import psutil

from . import screenshot as screenshot_mod
from . import screen_record as screen_record_mod
from .api_client import ApiClient, ApiError
from .config import Config
from .remote_control import RemoteControlClient
from .system_logs import ClipboardMonitor, UsbMonitor
from .tracker import ActivityTracker
from .tray_ui import TrayApp, prompt_login


def _get_mac_id() -> str:
    return f"{uuid.getnode():012x}"


def _lock_file_path() -> str:
    # Same "next to the exe/script" convention as config.py's _base_dir(),
    # kept independent (not imported from there) so the single-instance
    # check can run before Config() does any of its own first-run-wizard
    # work.
    if getattr(sys, "frozen", False):
        base = os.path.dirname(sys.executable)
    else:
        base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(base, "agent.lock")


def _acquire_single_instance_lock() -> bool:
    """
    Returns True if this is the only copy of the agent running and it's
    safe to continue, False if another copy is already running (caller
    should exit immediately without doing anything else).

    Nothing previously stopped this agent from running more than once at
    a time - e.g. Windows Startup auto-launching it AND someone also
    double-clicking the exe by hand, or several leftover copies from
    testing - which was observed producing several duplicate tray icons
    all separately (and uselessly) retrying sync at the same time, each
    logged in under its own session.

    Uses a PID file next to the exe rather than an OS-level lock so the
    same approach works cross-platform: on startup, check whether the PID
    recorded in agent.lock is (a) still running and (b) actually looks
    like this agent (not some unrelated process that happened to reuse
    that PID after a crash/force-kill left a stale lock file behind).
    """
    path = _lock_file_path()
    try:
        if os.path.exists(path):
            with open(path) as f:
                old_pid_str = f.read().strip()
            if old_pid_str.isdigit():
                old_pid = int(old_pid_str)
                if psutil.pid_exists(old_pid):
                    try:
                        name = psutil.Process(old_pid).name().lower()
                    except psutil.Error:
                        name = ""
                    if "secknight" in name or "python" in name:
                        return False
        with open(path, "w") as f:
            f.write(str(os.getpid()))
        return True
    except OSError:
        # Don't block startup just because the lock file itself couldn't
        # be read/written - worst case, no duplicate-instance protection
        # this run.
        return True


def _release_single_instance_lock():
    try:
        os.remove(_lock_file_path())
    except OSError:
        pass


class Agent:
    def __init__(self):
        self.config = Config()
        self.client = ApiClient(self.config)
        self.tray = TrayApp(on_quit=self._quit)
        self.tracker = ActivityTracker(self.config, on_batch_ready=self._on_batch_ready)
        self.remote_control = RemoteControlClient(self.config, get_access_token=lambda: self.client.access_token)
        self.usb_monitor = UsbMonitor(on_event=self._on_system_event)
        self.clipboard_monitor = ClipboardMonitor(on_event=self._on_system_event)
        self._running = False
        self._screenshot_thread = None
        self._screen_record_thread = None
        self._needs_relogin = False
        # Lives next to config.json, not inside it, so it's easy to delete
        # by hand to force a fresh login without touching server settings.
        self.session_path = os.path.join(os.path.dirname(self.config.path), "session.json")

    # --------------------------------------------------------------- login
    def login(self, force_prompt: bool = False):
        # Reuse a saved accessToken across restarts instead of re-prompting
        # for email/password every time - only re-prompt if there's no
        # saved session, or the caller explicitly needs a fresh one (e.g.
        # the saved token was rejected by the server as expired/invalid).
        if not force_prompt and self.client.load_session(self.session_path):
            return

        error = None
        while True:
            credentials = prompt_login(error_message=error)
            if not credentials:
                sys.exit(0)
            email, password = credentials
            try:
                self.client.login(email, password, mac_id=_get_mac_id())
                self.client.save_session(self.session_path)
                return
            except ApiError as exc:
                error = str(exc)

    # ------------------------------------------------------------- batches
    def _on_batch_ready(self, item: dict):
        sign = f"{item['dataId']}_{self.client.employee_name or 'agent'}"
        try:
            self.client.send_activity(sign, [item])
            self.tray.set_status(f"Active — last sync {time.strftime('%H:%M:%S')}")
        except ApiError as exc:
            print(f"[activity] send_activity failed: {exc} (status={exc.status_code})")
            if exc.is_auth_error:
                self.client.clear_session(self.session_path)
                self._needs_relogin = True
                self.tray.set_status("Session expired — signing in again")
            else:
                self.tray.set_status("Sync failed — will retry")
        except Exception as exc:
            # Anything else (connection refused, timeout, DNS failure, etc.)
            # is NOT an ApiError - it used to fall through uncaught here and
            # get silently swallowed by tracker.py's _flush_batch(), which
            # left the tray stuck showing whatever status was set last
            # (e.g. a stale "Sync failed") instead of ever reflecting what's
            # actually happening right now. Log it and update the tray so a
            # real, ongoing problem is visible instead of an ambiguous
            # frozen label.
            print(f"[activity] unexpected error sending activity: {exc!r}")
            self.tray.set_status("Sync failed — will retry")

    # ------------------------------------------------------------ system logs
    def _on_system_event(self, event: dict):
        # USB/clipboard events arrive one at a time from their own
        # background threads (not batched like activity), so just fire
        # each one off individually - infrequent enough that this isn't a
        # meaningful volume of extra requests.
        try:
            self.client.send_system_events([event])
        except ApiError as exc:
            if exc.is_auth_error:
                self.client.clear_session(self.session_path)
                self._needs_relogin = True
        except Exception:
            pass

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
            except ApiError as exc:
                if exc.is_auth_error:
                    self.client.clear_session(self.session_path)
                    self._needs_relogin = True
            except Exception:
                pass
            finally:
                screenshot_mod.cleanup(paths)

    # ------------------------------------------------------------ screen record
    def _screen_record_loop(self):
        interval = self.config.screen_record_interval_seconds
        duration = self.config.screen_record_duration_seconds
        fps = self.config.screen_record_fps
        while self._running:
            time.sleep(interval)
            if not self.config.screen_record_enabled or not self._running:
                continue
            path = None
            try:
                path = screen_record_mod.record_screen(duration, fps=fps)
                self.client.upload_screen_record(path)
            except ApiError as exc:
                if exc.is_auth_error:
                    self.client.clear_session(self.session_path)
                    self._needs_relogin = True
            except Exception:
                pass
            finally:
                screen_record_mod.cleanup(path)

    # ----------------------------------------------------------------- run
    def run(self):
        self.tray.start()
        self.tray.set_status("Logging in...")
        self.login()

        self.tray.set_status("Active")
        self._running = True

        self.tracker.start()
        self.remote_control.start()

        if self.config.usb_detection_enabled:
            self.usb_monitor.start()

        if self.config.clipboard_monitoring_enabled:
            self.clipboard_monitor.start()

        if self.config.screenshots_enabled:
            self._screenshot_thread = threading.Thread(target=self._screenshot_loop, daemon=True)
            self._screenshot_thread.start()

        if self.config.screen_record_enabled:
            self._screen_record_thread = threading.Thread(target=self._screen_record_loop, daemon=True)
            self._screen_record_thread.start()

        try:
            while self._running:
                if self._needs_relogin:
                    # Runs on the main thread deliberately - tkinter (used
                    # by the login popup) isn't safe to drive from the
                    # background tracker/screenshot threads that detect an
                    # expired session.
                    self._needs_relogin = False
                    self.tray.set_status("Session expired — please sign in again")
                    self.login(force_prompt=True)
                    self.tray.set_status("Active")
                time.sleep(1)
        except KeyboardInterrupt:
            self._quit()

    def _quit(self):
        self._running = False
        self.tracker.stop()
        self.remote_control.stop()
        self.usb_monitor.stop()
        self.clipboard_monitor.stop()
        self.tray.stop()
        sys.exit(0)


def main():
    if not _acquire_single_instance_lock():
        print("SecKnight Vision Agent is already running - exiting this duplicate instance.")
        return

    try:
        if platform.system() != "Windows":
            print(
                "Warning: remote-control and some window-tracking features are "
                "Windows-only in this build; running with reduced functionality."
            )
        Agent().run()
    finally:
        _release_single_instance_lock()


if __name__ == "__main__":
    main()
