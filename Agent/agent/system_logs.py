"""
USB device detection + clipboard monitoring, both feeding the same generic
"system events" ingestion endpoint the backend's DLP tabs (USB Detection,
Clipboard Logs) read from:

  POST {data_base_url}/api/v1/desktop/add-system-log
  Backend/store-logs-api/.../desktop.controller.ts + dto/system-logs.dto.ts

Each event is {dataId, title, type, description, computer}. The `type`
field is a numeric code (sent as a string) the backend/Frontend key off:
system-logs.service.ts treats type in [2,3,4,5] as USB events (and fires
an optional admin alert - see USB_ALERT_ADMIN), and the Frontend's USB
Detection tab queries type=2,3,4,5 (Frontend/.../usb-detection/service.js).
Clipboard Logs queries type=10 (Frontend/.../system-logs/service.js). This
agent only ever sends 2 (connected), 3 (disconnected), and 10 (clipboard
copy) - 4/5 are reserved for a "blocked" concept this agent doesn't
implement (that would need a filter driver / registry policy, not just
detection).
"""

import platform
import threading
import time
from datetime import datetime, timezone

_SYSTEM = platform.system()
_COMPUTER_NAME = platform.node()

TYPE_USB_CONNECTED = "2"
TYPE_USB_DISCONNECTED = "3"
TYPE_CLIPBOARD_COPY = "10"

# Cap how much clipboard text gets sent per event - this is meant to be an
# audit trail ("what did they copy"), not an excuse to ship unbounded
# amounts of whatever a user copied through here.
_CLIPBOARD_MAX_CHARS = 2000


def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _make_event(title: str, type_code: str, description: str) -> dict:
    return {
        "dataId": _now_iso(),
        "title": title,
        "type": type_code,
        "description": description,
        "computer": _COMPUTER_NAME,
    }


class UsbMonitor:
    """Watches for USB mass-storage arrival/removal via the
    Win32_VolumeChangeEvent WMI class - the standard way to detect a drive
    letter appearing/disappearing (fires for USB drives, SD card readers,
    etc, which is exactly what "USB Detection" in this kind of monitoring
    tool conventionally covers). Uses only win32com/pythoncom, already
    part of pywin32."""

    def __init__(self, on_event):
        self.on_event = on_event
        self._running = False
        self._thread = None

    def start(self):
        if _SYSTEM != "Windows" or self._running:
            return
        self._running = True
        self._thread = threading.Thread(target=self._run, daemon=True)
        self._thread.start()

    def stop(self):
        self._running = False

    def _run(self):
        try:
            import pythoncom
            import pywintypes
            import win32com.client
        except Exception as exc:
            print(f"[system_logs] USB monitor unavailable: {exc!r}")
            return

        pythoncom.CoInitialize()
        try:
            wmi = win32com.client.GetObject("winmgmts:")
            watcher = wmi.ExecNotificationQuery(
                "SELECT * FROM Win32_VolumeChangeEvent WHERE EventType = 2 OR EventType = 3"
            )
            while self._running:
                try:
                    # 1000ms poll timeout so we re-check self._running
                    # periodically instead of blocking forever on shutdown.
                    event = watcher.NextEvent(1000)
                except pywintypes.com_error:
                    continue  # just the poll timeout, not a real error
                except Exception as exc:
                    print(f"[system_logs] USB event wait failed: {exc!r}")
                    time.sleep(2)
                    continue

                try:
                    drive = event.Properties_("DriveName").Value
                    event_type = event.Properties_("EventType").Value
                except Exception:
                    continue

                if event_type == 2:
                    label = self._volume_label(drive)
                    description = (
                        f"USB drive connected: {drive} ({label})" if label else f"USB drive connected: {drive}"
                    )
                    self.on_event(_make_event("USB Connected", TYPE_USB_CONNECTED, description))
                elif event_type == 3:
                    self.on_event(
                        _make_event("USB Disconnected", TYPE_USB_DISCONNECTED, f"USB drive disconnected: {drive}")
                    )
        except Exception as exc:
            print(f"[system_logs] USB monitor stopped unexpectedly: {exc!r}")
        finally:
            pythoncom.CoUninitialize()

    @staticmethod
    def _volume_label(drive):
        try:
            import win32api

            label = win32api.GetVolumeInformation(drive + "\\")[0]
            return label or None
        except Exception:
            return None


class ClipboardMonitor:
    """Polls the Windows clipboard sequence number (one cheap user32 call)
    and reads the text contents whenever it changes. Polling instead of
    AddClipboardFormatListener avoids needing a hidden window + Windows
    message pump just for this."""

    def __init__(self, on_event, poll_interval: float = 1.0):
        self.on_event = on_event
        self.poll_interval = poll_interval
        self._running = False
        self._thread = None

    def start(self):
        if _SYSTEM != "Windows" or self._running:
            return
        self._running = True
        self._thread = threading.Thread(target=self._run, daemon=True)
        self._thread.start()

    def stop(self):
        self._running = False

    def _run(self):
        try:
            import ctypes

            import win32clipboard
        except Exception as exc:
            print(f"[system_logs] Clipboard monitor unavailable: {exc!r}")
            return

        last_seq = None
        while self._running:
            try:
                seq = ctypes.windll.user32.GetClipboardSequenceNumber()
                if seq != last_seq:
                    last_seq = seq
                    text = self._read_text(win32clipboard)
                    if text:
                        truncated = text[:_CLIPBOARD_MAX_CHARS]
                        suffix = "... (truncated)" if len(text) > _CLIPBOARD_MAX_CHARS else ""
                        self.on_event(_make_event("Clipboard Copy", TYPE_CLIPBOARD_COPY, truncated + suffix))
            except Exception as exc:
                print(f"[system_logs] clipboard poll failed: {exc!r}")
            time.sleep(self.poll_interval)

    @staticmethod
    def _read_text(win32clipboard_mod):
        try:
            win32clipboard_mod.OpenClipboard()
        except Exception:
            return None
        try:
            if win32clipboard_mod.IsClipboardFormatAvailable(win32clipboard_mod.CF_UNICODETEXT):
                data = win32clipboard_mod.GetClipboardData(win32clipboard_mod.CF_UNICODETEXT)
                return (data or "").strip() or None
            return None
        except Exception:
            return None
        finally:
            try:
                win32clipboard_mod.CloseClipboard()
            except Exception:
                pass
