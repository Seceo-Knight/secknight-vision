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

Encoding: this used to go through cv2.VideoWriter, but that turned out to
be unreliable for producing a browser-playable file:
  - opencv-python's pip wheel bundles FFmpeg WITHOUT libx264 (GPL
    licensing), so requesting the 'avc1'/'H264' fourcc through cv2's
    default backend silently fails, or falls through to Cisco's separately
    distributed openh264 DLL, which cv2 expects to find at an exact
    version (e.g. "openh264-1.8.0-win64.dll") on disk/PATH - it usually
    isn't there, so that fails too.
  - Falling back to 'mp4v' (MPEG-4 Part 2) makes recording "work", but
    browsers cannot decode mp4v in a <video> tag at all - this was the
    actual cause of the Screen Recording tab showing a black thumbnail and
    refusing to play a file that was, on disk, perfectly valid.
  - The Windows Media Foundation (CAP_MSMF) backend was tried as another
    H.264 path, but isn't guaranteed to be available/enabled on every
    Windows machine either (silently fails to open with no error message).

Instead, this module pipes raw captured frames directly into a real,
complete ffmpeg binary (bundled via the `imageio-ffmpeg` pip package - no
manual codec downloads, no missing-DLL version pinning, works the same on
every Windows machine `pip install`s it on) and lets ffmpeg's own libx264
encode a proper H.264 .mp4, which every modern browser can play.
"""

import os
import subprocess
import tempfile
import time
from datetime import datetime


def _get_ffmpeg_exe() -> str:
    from imageio_ffmpeg import get_ffmpeg_exe

    return get_ffmpeg_exe()


def record_screen(duration_seconds: int, fps: int = 4, tmp_dir: str = None) -> str:
    """Records the primary monitor for duration_seconds at the given fps and
    writes a browser-playable H.264 .mp4 to a temp file, by piping raw
    frames into ffmpeg. Returns the file path (caller deletes it after
    upload). Raises RuntimeError if mss/imageio-ffmpeg aren't usable or
    ffmpeg exits with an error."""
    import mss

    duration_seconds = min(duration_seconds, 290)  # stay under the server's 300s cap
    tmp_dir = tmp_dir or tempfile.gettempdir()

    start = datetime.now()
    filename = f"{start.strftime('%H')}-{start.strftime('%Y-%m-%d')} {start.strftime('%H-%M-%S')}.mp4"
    path = os.path.join(tmp_dir, filename)

    ffmpeg_exe = _get_ffmpeg_exe()

    with mss.mss() as sct:
        monitor = sct.monitors[1] if len(sct.monitors) > 1 else sct.monitors[0]
        width, height = monitor["width"], monitor["height"]

        cmd = [
            ffmpeg_exe,
            "-y",
            "-f", "rawvideo",
            "-pix_fmt", "bgra",  # mss's raw capture buffer is already BGRA - no conversion needed
            "-s", f"{width}x{height}",
            "-r", str(fps),
            "-i", "-",
            "-an",
            "-c:v", "libx264",
            "-preset", "ultrafast",
            "-pix_fmt", "yuv420p",  # required for broad browser/player compatibility
            "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2",  # libx264+yuv420p needs even dimensions
            "-movflags", "+faststart",  # lets the file start playing before it's fully downloaded
            path,
        ]
        proc = subprocess.Popen(
            cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
        )

        try:
            frame_interval = 1.0 / fps
            next_frame_at = time.monotonic()
            end_at = time.monotonic() + duration_seconds
            while time.monotonic() < end_at:
                shot = sct.grab(monitor)
                try:
                    proc.stdin.write(shot.bgra)
                except (BrokenPipeError, OSError):
                    break  # ffmpeg died mid-recording - stop feeding it, report below
                next_frame_at += frame_interval
                sleep_for = next_frame_at - time.monotonic()
                if sleep_for > 0:
                    time.sleep(sleep_for)
        finally:
            try:
                proc.stdin.close()
            except Exception:
                pass
            _, stderr = proc.communicate(timeout=30)

        if proc.returncode != 0:
            raise RuntimeError(
                f"ffmpeg exited with code {proc.returncode}: "
                f"{stderr.decode(errors='replace')[-2000:]}"
            )

    return path


def cleanup(path: str):
    if not path:
        return
    try:
        os.remove(path)
    except OSError:
        pass
