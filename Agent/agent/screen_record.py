"""
Periodic screen-recording capture, named to match the backend's required
convention exactly (Backend/store-logs-api/.../utils/file.utils.ts
videoFileFilter): "HH-YYYY-MM-DD HH-mm-ss.mp4" (named for the recording's
start time). Server-side hard cap is 300 seconds
(Backend/store-logs-api/.../constants.ts videoConditions.maxDuration) -
record_screen() refuses to exceed that.

Note: the backend's ScreenRecordService uploads to whichever storage
provider is configured for the organization (Google Drive/S3/FTP/etc., or
the local-disk provider - see screen-record.service.ts's `providers` Map
and utils/local-storage.utils.ts's LocalStorageUtils, short code "LC"). The
local-disk provider works for both screenshots and screen recordings, so no
external cloud provider is required as long as the org's storage provider
is set to LC in the DB. Off by default in config.json
(screen_record_enabled) since continuous video capture is more resource-
intensive than screenshots - enable explicitly once you've confirmed a
storage provider is configured.
"""

import os
import platform
import tempfile
import time
from datetime import datetime


def _open_writer(path: str, fps: int, width: int, height: int):
    """Opens a cv2.VideoWriter, preferring codecs browsers can actually play.

    opencv-python's pip-distributed build uses FFmpeg for its default
    (CAP_FFMPEG) backend, and that bundled FFmpeg does NOT include libx264
    (GPL licensing) - so requesting the 'avc1'/'H264' fourcc through the
    default backend silently fails to open. On Windows, the CAP_MSMF
    (Media Foundation) backend has its own OS-level H.264 encoder and does
    not depend on FFmpeg/libx264 at all, so try that first. 'mp4v' (MPEG-4
    Part 2) is kept as a last-resort fallback so recording still works even
    if no H.264 path is available - but note browsers cannot play mp4v
    files (they'll show a black thumbnail and refuse to play), only
    desktop players like VLC can. This was the actual cause of the Screen
    Recording tab showing black thumbnails / blank playback: the file was
    valid, just encoded in a codec no browser decodes.
    """
    import cv2

    candidates = []
    if platform.system() == "Windows":
        candidates.append((cv2.CAP_MSMF, "avc1"))
        candidates.append((cv2.CAP_MSMF, "H264"))
    candidates.append((cv2.CAP_ANY, "avc1"))
    candidates.append((cv2.CAP_ANY, "mp4v"))  # last resort, not browser-playable

    for backend, fourcc_str in candidates:
        fourcc = cv2.VideoWriter_fourcc(*fourcc_str)
        writer = cv2.VideoWriter(path, backend, fourcc, fps, (width, height))
        if writer.isOpened():
            if fourcc_str == "mp4v":
                print(
                    "[screen_record] WARNING: falling back to mp4v codec - "
                    "this file will NOT play in a browser, only in a desktop "
                    "player like VLC. H.264 (avc1/H264) was unavailable via "
                    "both Media Foundation and the default backend."
                )
            else:
                print(f"[screen_record] recording with backend={backend} fourcc={fourcc_str}")
            return writer
        writer.release()
    return None


def record_screen(duration_seconds: int, fps: int = 4, tmp_dir: str = None) -> str:
    """Records the primary monitor for duration_seconds at the given fps and
    writes an .mp4 to a temp file. Returns the file path (caller deletes it
    after upload). Raises RuntimeError if opencv-python / mss aren't usable."""
    import mss
    import numpy as np

    duration_seconds = min(duration_seconds, 290)  # stay under the server's 300s cap
    tmp_dir = tmp_dir or tempfile.gettempdir()

    start = datetime.now()
    filename = f"{start.strftime('%H')}-{start.strftime('%Y-%m-%d')} {start.strftime('%H-%M-%S')}.mp4"
    path = os.path.join(tmp_dir, filename)

    with mss.mss() as sct:
        monitor = sct.monitors[1] if len(sct.monitors) > 1 else sct.monitors[0]
        width, height = monitor["width"], monitor["height"]

        writer = _open_writer(path, fps, width, height)
        if writer is None:
            raise RuntimeError("Could not open video writer (no usable codec found)")

        try:
            frame_interval = 1.0 / fps
            next_frame_at = time.monotonic()
            end_at = time.monotonic() + duration_seconds
            while time.monotonic() < end_at:
                # drop alpha (BGRA->BGR, which is what cv2 expects) and force
                # a contiguous copy - the plain slice view keeps the BGRA
                # strides, which some cv2/VideoWriter builds write out
                # incorrectly (corrupted/blank-looking frames).
                frame = np.ascontiguousarray(np.array(sct.grab(monitor))[:, :, :3])
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
