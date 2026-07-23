"""
Live Screen Cast + remote-control client.

Protocol reverse-engineered from the REAL backend/frontend source (no
guessing needed - we control both ends):
  - Backend/remote_socket/server.js + source/handler/{service,datahandler}.js
    (plain `ws` WebSocket server, JSON message envelopes)
  - Backend/remote_socket/source/auth/agentValidation.js (auth handshake)
  - Frontend/src/page/protected/admin/employee-profile/ScreenCastTab.jsx
    (the admin-side client this agent talks to)

Flow:
  1. Connect to socket_url, send {"type": "agent_auth", "token": accessToken}
  2. Idle until either:
       - the literal string "Start sending image - user is waiting" arrives
         -> begin streaming frames
       - the literal string "...please stop sending images" arrives
         -> stop streaming
       - a JSON {"type": "control", "event": ..., "data": ...} arrives
         -> perform the remote-control action
  3. While streaming, repeatedly send:
       {"type": "start_image_stream", "image0": <base64 png>,
        "screenData0": {"aspectRatio0": .., "height0": .., "width0": ..}, ...}
     one image<N>/screenData<N> pair per monitor.
"""

import base64
import io
import json
import platform
import subprocess
import threading
import time
import traceback

import mss
import pyautogui
import websocket

pyautogui.FAILSAFE = False

_SYSTEM = platform.system()

# Mirrors CUSTOM_BUTTON_DATA in ScreenCastTab.jsx exactly.
CUSTOM_BUTTON_ACTIONS = {
    "Windows": lambda: pyautogui.press("win"),
    "File Explorer": lambda: _open_explorer(),
    "Windows Run": lambda: pyautogui.hotkey("win", "r"),
    "Copy": lambda: pyautogui.hotkey("ctrl", "c"),
    "Paste": lambda: pyautogui.hotkey("ctrl", "v"),
    "Lock": lambda: _lock_workstation(),
    "Restart": lambda: _restart(),
    "Shutdown": lambda: _shutdown(),
}


def _open_explorer():
    if _SYSTEM == "Windows":
        subprocess.Popen("explorer.exe")


def _lock_workstation():
    if _SYSTEM == "Windows":
        import ctypes

        ctypes.windll.user32.LockWorkStation()


def _restart():
    if _SYSTEM == "Windows":
        subprocess.Popen(["shutdown", "/r", "/t", "0"])


def _shutdown():
    if _SYSTEM == "Windows":
        subprocess.Popen(["shutdown", "/s", "/t", "0"])


class RemoteControlClient:
    FRAME_RATE = 5  # matches FRAME_RATE in ScreenCastTab.jsx

    def __init__(self, config, get_access_token):
        self.config = config
        self.get_access_token = get_access_token
        self._ws = None
        self._streaming = False
        self._running = False
        self._thread = None
        self._stream_thread = None

    def start(self):
        if not self.config.remote_control_enabled or not getattr(self.config, "socket_url", None):
            print(
                "[remote_control] NOT starting - remote_control_enabled="
                f"{self.config.remote_control_enabled!r}, "
                f"socket_url={getattr(self.config, 'socket_url', None)!r}. "
                "Check config.json if this looks wrong."
            )
            return
        print(f"[remote_control] starting, will connect to {self.config.socket_url}")
        self._running = True
        self._thread = threading.Thread(target=self._run_forever, daemon=True)
        self._thread.start()

    def stop(self):
        self._running = False
        self._streaming = False
        if self._ws:
            try:
                self._ws.close()
            except Exception:
                pass

    # ------------------------------------------------------------- internal
    def _run_forever(self):
        while self._running:
            try:
                self._connect_and_listen()
            except Exception as exc:
                print(f"[remote_control] connection attempt failed: {exc!r}")
                traceback.print_exc()
            if self._running:
                time.sleep(10)  # reconnect backoff

    def _connect_and_listen(self):
        token = self.get_access_token()
        if not token:
            print("[remote_control] no access token yet - not logged in, skipping this attempt")
            return
        print(f"[remote_control] connecting to {self.config.socket_url} ...")

        # timeout=10 here only bounds the initial TCP/TLS handshake. The
        # websocket-client library applies that same timeout to the
        # underlying socket for its whole lifetime unless cleared - so
        # without the settimeout(None) below, ws.recv() below would raise a
        # spurious timeout after any 10s gap with no server messages (the
        # server here is push-only: it stays silent between Screen Cast
        # sessions), causing an endless connect/timeout/reconnect loop that
        # made the dashboard flap between "online" and "offline".
        ws = websocket.create_connection(self.config.socket_url, timeout=10)
        ws.settimeout(None)
        self._ws = ws
        ws.send(json.dumps({"type": "agent_auth", "token": token}))
        print("[remote_control] connected and sent agent_auth, waiting for messages")

        while self._running:
            try:
                message = ws.recv()
            except Exception as exc:
                print(f"[remote_control] recv() failed, reconnecting: {exc!r}")
                break
            if not message:
                print("[remote_control] server closed the connection (empty recv), reconnecting")
                break
            self._handle_message(message)

        self._streaming = False
        try:
            ws.close()
        except Exception:
            pass

    def _handle_message(self, message: str):
        if message == "Start sending image - user is waiting":
            self._start_streaming()
            return
        if "please stop sending images" in message or "disconnected" in message.lower():
            self._streaming = False
            return
        if message in ("Agent authenticated successfully",):
            return

        try:
            parsed = json.loads(message)
        except (ValueError, TypeError):
            return

        if parsed.get("type") == "control":
            self._handle_control(parsed)

    def _handle_control(self, msg: dict):
        event = msg.get("event")
        data = msg.get("data")
        try:
            if event == "mouse_click":
                x = data.get("originalEndX")
                y = data.get("originalEndY")
                button_map = {"Left": "left", "Right": "right", "Middle": "middle"}
                button = button_map.get(data.get("button"), "left")
                pyautogui.click(x=int(x), y=int(y), button=button)
            elif event == "scroll":
                pyautogui.scroll(120 if data == "Scrolled Up" else -120)
            elif event == "key_press":
                pyautogui.typewrite(str(data), interval=0)
            elif event == "key_press_start":
                key = _map_special_key(data)
                if key:
                    pyautogui.keyDown(key)
            elif event == "key_press_end":
                key = _map_special_key(data)
                if key:
                    pyautogui.keyUp(key)
            elif event == "key_press_custom":
                action = CUSTOM_BUTTON_ACTIONS.get(data)
                if action:
                    action()
                else:
                    print(f"[remote_control] unknown custom button: {data!r}")
        except Exception as exc:
            print(f"[remote_control] control action {event!r} failed: {exc!r}")

    def _start_streaming(self):
        if self._streaming:
            return
        self._streaming = True
        self._stream_thread = threading.Thread(target=self._stream_loop, daemon=True)
        self._stream_thread.start()

    def _stream_loop(self):
        interval = 1.0 / self.FRAME_RATE
        with mss.mss() as sct:
            monitors = sct.monitors[1:] if len(sct.monitors) > 1 else sct.monitors
            while self._streaming and self._running:
                payload = {"type": "start_image_stream"}
                for idx, monitor in enumerate(monitors):
                    shot = sct.grab(monitor)
                    png_bytes = _to_png_bytes(shot)
                    payload[f"image{idx}"] = base64.b64encode(png_bytes).decode("ascii")
                    payload[f"screenData{idx}"] = {
                        f"aspectRatio{idx}": shot.width / shot.height if shot.height else 1.78,
                        f"height{idx}": shot.height,
                        f"width{idx}": shot.width,
                    }
                try:
                    self._ws.send(json.dumps(payload))
                except Exception:
                    self._streaming = False
                    break
                time.sleep(interval)


def _to_png_bytes(shot) -> bytes:
    buf = io.BytesIO()
    mss.tools.to_png(shot.rgb, shot.size, output=buf)
    return buf.getvalue()


_SPECIAL_KEY_MAP = {
    "Control": "ctrl",
    "Alt": "alt",
    "Shift": "shift",
    "Escape": "esc",
    "Tab": "tab",
    "Insert": "insert",
    "Home": "home",
    "PageUp": "pageup",
    "Delete": "delete",
    "End": "end",
    "PageDown": "pagedown",
    "Backspace": "backspace",
    "ArrowUp": "up",
    "ArrowDown": "down",
    "ArrowLeft": "left",
    "ArrowRight": "right",
    "Enter": "enter",
    "Meta": "win",
}


def _map_special_key(key_name):
    return _SPECIAL_KEY_MAP.get(key_name)
