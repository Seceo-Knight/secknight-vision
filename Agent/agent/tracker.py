"""
Core activity tracking engine.

Runs a 1-second-resolution background tick that:
  - records per-second counts of mouse clicks, mouse movement events, and
    keystrokes (feeding activityPerSecond.buttonClicks/mouseMovements/keystrokes)
  - tracks which application/window is focused each second, closing out an
    appUsage segment whenever the focused window changes
  - detects idle time (no keyboard/mouse input for idle_threshold_seconds)
    and accumulates it into breakInSeconds instead of counting it as active

Every activity_interval_seconds it hands a complete, DTO-shaped batch to the
on_batch_ready callback (Backend/store-logs-api's UsageActivityDataDTO -
see dto/usage-activity-data.dto.ts and validation/user-activity.validation.ts).
"""

import threading
import time
from datetime import datetime, timezone

from pynput import mouse, keyboard

from .window_info import get_active_window, get_browser_url


class ActivityTracker:
    def __init__(self, config, on_batch_ready):
        self.config = config
        self.on_batch_ready = on_batch_ready

        self._lock = threading.Lock()
        self._running = False
        self._tick_thread = None
        self._mouse_listener = None
        self._keyboard_listener = None

        self._reset_batch()
        self._last_input_time = time.monotonic()

        # live per-second counters, reset every tick
        self._click_count = 0
        self._move_count = 0
        self._key_count = 0
        self._key_chars_this_second = []

        self._current_app = None
        self._current_title = None
        self._current_url = None
        self._segment_start_sec = 0
        self._segment_keystrokes = []

    # ---------------------------------------------------------------- setup
    def _reset_batch(self):
        self._batch_start_utc = datetime.now(timezone.utc)
        self._second_index = 0
        self._button_clicks = []
        self._mouse_movements = []
        self._keystrokes_per_sec = []
        self._fake_activities = []
        self._app_usage = []
        self._break_seconds = 0

    # --------------------------------------------------------------- public
    def start(self):
        if self._running:
            return
        self._running = True

        self._mouse_listener = mouse.Listener(
            on_click=self._on_click, on_move=self._on_move, on_scroll=self._on_move
        )
        self._keyboard_listener = keyboard.Listener(on_press=self._on_key)
        self._mouse_listener.start()
        self._keyboard_listener.start()

        self._tick_thread = threading.Thread(target=self._tick_loop, daemon=True)
        self._tick_thread.start()

    def stop(self):
        self._running = False
        if self._mouse_listener:
            self._mouse_listener.stop()
        if self._keyboard_listener:
            self._keyboard_listener.stop()

    # --------------------------------------------------------- input events
    def _on_click(self, x, y, button, pressed):
        if pressed:
            with self._lock:
                self._click_count += 1
                self._last_input_time = time.monotonic()

    def _on_move(self, *args):
        with self._lock:
            self._move_count += 1
            self._last_input_time = time.monotonic()

    def _on_key(self, key):
        with self._lock:
            self._key_count += 1
            self._last_input_time = time.monotonic()
            try:
                char = key.char if hasattr(key, "char") and key.char else f"[{key.name}]"
            except Exception:
                char = "[key]"
            self._key_chars_this_second.append(char)

    # -------------------------------------------------------------- ticking
    def _tick_loop(self):
        while self._running:
            time.sleep(1)
            try:
                self._tick()
            except Exception:
                # never let a single bad tick kill the tracker
                pass

    def _is_idle(self) -> bool:
        return (time.monotonic() - self._last_input_time) >= self.config.idle_threshold_seconds

    def _tick(self):
        with self._lock:
            clicks = self._click_count
            moves = self._move_count
            keys = self._key_count
            key_chars = self._key_chars_this_second
            self._click_count = 0
            self._move_count = 0
            self._key_count = 0
            self._key_chars_this_second = []

        idle = self._is_idle()
        if idle:
            self._break_seconds += 1

        self._button_clicks.append(clicks)
        self._mouse_movements.append(moves)
        self._keystrokes_per_sec.append(keys)
        self._fake_activities.append(0)
        self._segment_keystrokes.extend(key_chars)

        app_name, title, hwnd = get_active_window()
        if app_name != self._current_app or title != self._current_title:
            self._close_segment(end_sec=self._second_index)
            self._current_app = app_name
            self._current_title = title
            # Only hit UI Automation (relatively expensive) on an actual
            # window/tab change, not every single tick - reuses the hwnd
            # already captured this tick instead of a second foreground-
            # window lookup.
            self._current_url = get_browser_url(app_name, hwnd)
            self._segment_start_sec = self._second_index
            self._segment_keystrokes = list(key_chars)

        self._second_index += 1

        if self._second_index >= self.config.activity_interval_seconds:
            self._flush_batch()

    def _close_segment(self, end_sec: int):
        if self._current_app is None:
            return
        self._app_usage.append(
            {
                "ageOfData": -1,
                "app": self._current_app or "Unknown",
                "title": self._current_title or "",
                "url": self._current_url,
                "start": self._segment_start_sec,
                "end": max(end_sec, self._segment_start_sec),
                "keystrokes": "".join(self._segment_keystrokes),
            }
        )

    def _flush_batch(self):
        self._close_segment(end_sec=self._second_index)

        if not self._app_usage:
            # nothing was focused the whole interval (e.g. screen locked) -
            # still send a minimal segment so appUsage is never empty
            self._app_usage.append(
                {
                    "ageOfData": -1,
                    "app": "Unknown",
                    "title": "",
                    "url": None,
                    "start": 0,
                    "end": self._second_index,
                    "keystrokes": "",
                }
            )

        item = {
            "dataId": self._batch_start_utc.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "systemTimeUtc": self._batch_start_utc.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "projectId": 0,
            "taskId": 0,
            "taskNote": "",
            "breakInSeconds": self._break_seconds,
            "clicksCount": sum(self._button_clicks),
            "fakeActivitiesCount": sum(self._fake_activities),
            "keysCount": sum(self._keystrokes_per_sec),
            "movementsCount": sum(self._mouse_movements),
            "activityPerSecond": {
                "buttonClicks": self._button_clicks,
                "fakeActivities": self._fake_activities,
                "keystrokes": self._keystrokes_per_sec,
                "mouseMovements": self._mouse_movements,
            },
            "mode": {
                "name": "computer",
                "start": 0,
                "end": self._second_index,
            },
            "appUsage": self._app_usage,
        }

        self._reset_batch()
        # re-open a segment for whatever's focused right now so the next
        # batch doesn't start with a gap
        self._current_app = None
        self._current_title = None
        self._current_url = None

        try:
            self.on_batch_ready(item)
        except Exception:
            pass
