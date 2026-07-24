"""
PyInstaller entry point. Run directly with `python run_agent.py` during
development, or build a standalone .exe with:

    pyinstaller build.spec

See README.md for full setup and build instructions.
"""

import os
import sys
from datetime import datetime


def _setup_frozen_logging():
    """
    The packaged .exe builds windowed (console=False in build.spec) so end
    users never see a black terminal window - but that also means stdout/
    stderr have no console attached, and every print() used throughout this
    codebase for diagnostics (e.g. window_info.py's URL-extraction logs,
    which were essential for debugging Web History earlier) would silently
    vanish with nowhere to go. Redirect them to agent.log next to the exe so
    a real support issue can still be diagnosed after the fact. Only kicks
    in when actually frozen by PyInstaller - `python run_agent.py` during
    development keeps using the real console untouched.
    """
    if not getattr(sys, "frozen", False):
        return
    base_dir = os.path.dirname(sys.executable)
    log_path = os.path.join(base_dir, "agent.log")
    try:
        # Cap runaway growth - keep the last ~5MB instead of an unbounded log.
        if os.path.exists(log_path) and os.path.getsize(log_path) > 5 * 1024 * 1024:
            with open(log_path, "rb") as f:
                f.seek(-2 * 1024 * 1024, os.SEEK_END)
                tail = f.read()
            with open(log_path, "wb") as f:
                f.write(tail)
    except Exception:
        pass
    log_file = open(log_path, "a", buffering=1, encoding="utf-8")
    sys.stdout = log_file
    sys.stderr = log_file
    print(f"\n=== Agent started {datetime.now().isoformat()} ===")


_setup_frozen_logging()

from agent.main import main

if __name__ == "__main__":
    main()
