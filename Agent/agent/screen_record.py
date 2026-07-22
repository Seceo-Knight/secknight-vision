"""
Periodic screen-recording capture, named to match the backend's required
convention exactly (Backend/store-logs-api/.../utils/file.utils.ts
videoFileFilter): "HH-YYYY-MM-DD HH-mm-ss.mp4" (named for the recording's
start time). Server-side hard cap is 300 seconds
(Backend/store-logs-api/.../constants.ts videoConditions.maxDuration) -
record_screen() refuses to exceed that.

Note: even once uploaded, the backend's ScreenRecordService currently only
accepts the file if the organization has a supported cloud storage provider
configured (Google Drive/S3/FTP/etc.) - see screen-record.service.ts's
`providers` Map. There is no local-storage ("LC") branch for screen records
yet (only screenshots have one, still in progress server-side), so uploads
will get a 400 "provider is not supported" / "cloud provider name is not
setup" response until that's added. This module still captures + attempts
the upload so it starts working the moment that's fixed, and so the failure
is visible/logged rather than silently never-attempted.
"""

import os
import tempfile
import time
from datetime import datetime


def record_screen(duration_seconds: int, fps: int = 4, tmp_dir: str = None) -> str:
    """Records the primary monitor for duration_seconds at the given fps and
    writes an .mp4 to a temp file. Returns the file path (caller deletes it
    after upload). Raises RuntimeError if opencv-python / mss aren't usable."""
    import mss
    import numpy as np
    import cv2

    duration_seconds = min(duration_seconds, 290)  # stay under the server's 300s cap
    tmp_dir = tmp_dir or tempfile.gettempdir()

    start = datetime.now()
    filename = f"{start.strftime('%H')}-{start.strftime('%Y-%m-%d')} {start.strftime('%H-%M-%S')}.mp4"
    path = os.path.join(tmp_dir, filename)

    with mss.mss() as sct:
        monitor = sct.monitors[1] if len(sct.monitors) > 1 else sct.monitors[0]
        width, height = monitor["width"], monitor["height"]

        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        writer = cv2.VideoWriter(path, fourcc, fps, (width, height))
        if not writer.isOpened():
            raise RuntimeError("Could not open video writer (mp4v codec unavailable)")

        try:
            frame_interval = 1.0 / fps
            next_frame_at = time.monotonic()
            end_at = time.monotonic() + duration_seconds
            while time.monotonic() < end_at:
                frame = np.array(sct.grab(monitor))[:, :, :3]  # drop alpha, BGRA->BGR-ish order cv2 expects
                writer.write(frame)
                next_frame_at += frame_interval
                sleep_for = next_frame_at - time.monotonic()
                if sleep_for > 0:
                    time.sleep(sleep_for)
        finally:
            writer.release()

    return path


def cleanup(path: str):
    if not path:
        return
    try:
        os.remove(path)
    except OSError:
        pass
