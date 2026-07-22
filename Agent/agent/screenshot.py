"""
Periodic screenshot capture, named to match the backend's required
convention exactly (Backend/store-logs-api/.../utils/file.utils.ts
imageFileFilter): "HH-YYYY-MM-DD HH-mm-ss-sc<N>.png"
"""

import os
import tempfile
from datetime import datetime


def capture_all_screens(tmp_dir: str = None) -> list:
    """Captures every connected monitor to a temp PNG file each, returns the
    list of file paths (caller is responsible for deleting them after
    upload)."""
    import mss

    tmp_dir = tmp_dir or tempfile.gettempdir()
    now = datetime.now()
    hour = now.strftime("%H")
    date_part = now.strftime("%Y-%m-%d")
    time_part = now.strftime("%H-%M-%S")

    paths = []
    with mss.mss() as sct:
        # monitors[0] is the "all monitors combined" virtual screen; skip it
        # and capture each real monitor individually.
        monitors = sct.monitors[1:] if len(sct.monitors) > 1 else sct.monitors
        for idx, monitor in enumerate(monitors):
            filename = f"{hour}-{date_part} {time_part}-sc{idx}.png"
            path = os.path.join(tmp_dir, filename)
            shot = sct.grab(monitor)
            mss.tools.to_png(shot.rgb, shot.size, output=path)
            paths.append(path)
    return paths


def cleanup(paths: list):
    for p in paths:
        try:
            os.remove(p)
        except OSError:
            pass
