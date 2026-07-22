# PyInstaller spec for the SecKnight Vision desktop agent.
# Build with:  pyinstaller build.spec
# Output:      dist/SecKnightVisionAgent/SecKnightVisionAgent.exe
#
# After building, copy config.example.json to
# dist/SecKnightVisionAgent/config.json, fill in your server details, and
# distribute the whole dist/SecKnightVisionAgent/ folder.

# -*- mode: python ; coding: utf-8 -*-

a = Analysis(
    ['run_agent.py'],
    pathex=[],
    binaries=[],
    datas=[],
    hiddenimports=[
        'win32timezone',
        'pystray._win32',
        'PIL._tkinter_finder',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='SecKnightVisionAgent',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='SecKnightVisionAgent',
)
