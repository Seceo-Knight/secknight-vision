"""
PyInstaller entry point. Run directly with `python run_agent.py` during
development, or build a standalone .exe with:

    pyinstaller build.spec

See README.md for full setup and build instructions.
"""

from agent.main import main

if __name__ == "__main__":
    main()
