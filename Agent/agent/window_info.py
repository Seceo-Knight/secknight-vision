"""
Best-effort active-window (app name + title) detection, per platform.
Only Windows is fully implemented (matches the primary build target); macOS
and Linux fall back to a generic "Unknown" app so the rest of the pipeline
still runs during development on those platforms.

Also provides get_browser_url() - reads the CURRENT TAB'S URL straight out
of the address bar via Windows UI Automation when the focused window is a
known browser. No browser extension or --remote-debugging-port setup
needed on the target machine; this is what feeds the backend's Web History
tab (Backend/productivity_report/.../insert.function.js's upsertAppWeb()
only sets domain_id - and therefore only makes an activity segment show up
in Web History at all - when appUsage[].url is non-empty).
"""

import platform

_SYSTEM = platform.system()

# Chromium-family browsers all expose their address bar as an EditControl
# with this exact class name, regardless of branding (Chrome/Edge/Brave/
# Vivaldi/Opera are all Chromium under the hood).
_CHROMIUM_OMNIBOX_CLASS_NAME = "Chrome_OmniboxView"

# Firefox's address bar AutomationId - has been stable across recent
# releases but Mozilla doesn't guarantee it, so this is best-effort only.
_FIREFOX_URLBAR_AUTOMATION_ID = "urlbar-input"

_BROWSER_PROCESSES = {
    "chrome.exe",
    "msedge.exe",
    "brave.exe",
    "vivaldi.exe",
    "opera.exe",
    "operagx.exe",
    "firefox.exe",
    "iexplore.exe",
}


def get_active_window():
    """Returns (app_name, window_title, hwnd) for the currently focused
    window. hwnd is a raw Windows handle (only non-None on Windows) - keep
    it around and pass it straight to get_browser_url() rather than doing a
    second GetForegroundWindow() lookup, which could race with the user
    switching windows between the two calls."""
    if _SYSTEM == "Windows":
        return _get_active_window_windows()
    if _SYSTEM == "Darwin":
        return _get_active_window_macos()
    return _get_active_window_linux()


def get_browser_url(app_name, hwnd):
    """Best-effort current-tab URL for a known browser's foreground window.
    Returns None for non-browser apps, non-Windows platforms, or whenever
    the address bar control can't be located (browser UI theme/version
    differences, fullscreen mode hiding the address bar, etc.) - callers
    already treat a None url as "not web activity", which is the correct
    fallback here."""
    if _SYSTEM != "Windows" or hwnd is None:
        return None
    if (app_name or "").lower() not in _BROWSER_PROCESSES:
        return None

    try:
        import uiautomation as auto

        window = auto.ControlFromHandle(hwnd)
        if not window:
            return None

        edit = window.EditControl(ClassName=_CHROMIUM_OMNIBOX_CLASS_NAME, searchDepth=12)
        if not edit.Exists(0, 0):
            edit = window.EditControl(AutomationId=_FIREFOX_URLBAR_AUTOMATION_ID, searchDepth=15)
        if not edit.Exists(0, 0):
            return None

        value = edit.GetValuePattern().Value
        value = (value or "").strip()
        return value or None
    except Exception:
        return None


def _get_active_window_windows():
    try:
        import win32gui
        import win32process
        import psutil

        hwnd = win32gui.GetForegroundWindow()
        if not hwnd:
            return ("Unknown", "", None)
        title = win32gui.GetWindowText(hwnd)
        _, pid = win32process.GetWindowThreadProcessId(hwnd)
        try:
            proc = psutil.Process(pid)
            app_name = proc.name()
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            app_name = "Unknown"
        return (app_name, title, hwnd)
    except Exception:
        return ("Unknown", "", None)


def _get_active_window_macos():
    try:
        from AppKit import NSWorkspace

        active_app = NSWorkspace.sharedWorkspace().activeApplication()
        app_name = active_app.get("NSApplicationName", "Unknown") if active_app else "Unknown"
        return (app_name, app_name, None)
    except Exception:
        return ("Unknown", "", None)


def _get_active_window_linux():
    try:
        import subprocess

        window_id = subprocess.check_output(["xdotool", "getactivewindow"]).strip()
        title = subprocess.check_output(["xdotool", "getwindowname", window_id]).decode().strip()
        return ("Unknown", title, None)
    except Exception:
        return ("Unknown", "", None)
