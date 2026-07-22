"""
Best-effort active-window (app name + title) detection, per platform.
Only Windows is fully implemented (matches the primary build target); macOS
and Linux fall back to a generic "Unknown" app so the rest of the pipeline
still runs during development on those platforms.
"""

import platform
import sys

_SYSTEM = platform.system()


def get_active_window():
    """Returns (app_name, window_title) for the currently focused window."""
    if _SYSTEM == "Windows":
        return _get_active_window_windows()
    if _SYSTEM == "Darwin":
        return _get_active_window_macos()
    return _get_active_window_linux()


def _get_active_window_windows():
    try:
        import win32gui
        import win32process
        import psutil

        hwnd = win32gui.GetForegroundWindow()
        if not hwnd:
            return ("Unknown", "")
        title = win32gui.GetWindowText(hwnd)
        _, pid = win32process.GetWindowThreadProcessId(hwnd)
        try:
            proc = psutil.Process(pid)
            app_name = proc.name()
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            app_name = "Unknown"
        return (app_name, title)
    except Exception:
        return ("Unknown", "")


def _get_active_window_macos():
    try:
        from AppKit import NSWorkspace

        active_app = NSWorkspace.sharedWorkspace().activeApplication()
        app_name = active_app.get("NSApplicationName", "Unknown") if active_app else "Unknown"
        return (app_name, app_name)
    except Exception:
        return ("Unknown", "")


def _get_active_window_linux():
    try:
        import subprocess

        window_id = subprocess.check_output(["xdotool", "getactivewindow"]).strip()
        title = subprocess.check_output(["xdotool", "getwindowname", window_id]).decode().strip()
        return ("Unknown", title)
    except Exception:
        return ("Unknown", "")
