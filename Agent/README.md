# SecKnight Vision Desktop Agent (Python)

A from-scratch, open-source desktop monitoring agent for SecKnight Vision,
built because the only previously-available agent (`QT/`) was a closed
compiled binary with no published source (see
[upstream issue #62](https://github.com/EmpCloud/emp-monitor/issues/62)).

This agent talks to the real, current backend API — not a legacy
compatibility shim — read directly from the backend source:

- Login: `POST {auth_base_url}/api/v3/auth/authenticate`
  (`Backend/desktop/src/routes/v3/auth/`)
- Activity: `POST {data_base_url}/api/v1/desktop/add-activity-log`
  (`Backend/store-logs-api/src/modules/v1/desktop/`)
- Screenshots: `POST {data_base_url}/api/v1/desktop/upload-screenshots`
- Screen recordings: `POST {data_base_url}/api/v1/desktop/upload-screen-records`
- Live Screen Cast + remote control: WebSocket to `remote_socket`
  (`Backend/remote_socket/`), protocol matched against
  `Frontend/.../ScreenCastTab.jsx`

## Features

- Login popup + system tray icon with live status
- Activity tracking: keystrokes, clicks, mouse movement, per-app/window
  usage — batched and uploaded every `activity_interval_seconds`
- Idle/away detection (no input for `idle_threshold_seconds` gets reported
  as break time instead of active time)
- Periodic screenshots (multi-monitor aware)
- Live Screen Cast: streams your screen to the admin dashboard's
  Employee Profile > Screen Cast tab when an admin clicks Connect
- Remote control: mouse, keyboard, and the shortcut buttons (Windows key,
  File Explorer, Run, Copy, Paste, Lock, Restart, Shutdown)

## Known limitations (v1)

- Windows-only for window tracking and remote control (uses `pywin32`).
  Activity/screenshot/login features are cross-platform capable but
  untested on macOS/Linux.
- `url` is not populated for browser tabs yet (App History works, Web
  History will show blank URLs) — browser URL extraction needs
  browser-specific accessibility APIs, left for a follow-up.
- Screen recording upload is implemented in the API client but not yet
  wired into a capture loop in `main.py`.

## Setup (development)

```bash
cd Agent
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt

copy config.example.json config.json
# edit config.json: set auth_base_url, data_base_url, socket_url to your
# server's address/ports, and crypto_password to match EXACTLY the
# CRYPTO_PASSWORD value in your server's Backend/desktop/.env and
# Backend/store-logs-api/.env (both must already match each other).

python run_agent.py
```

## Building a standalone .exe

Only step you need to run yourself (this repo's build environment can't
compile a Windows executable):

```bash
pip install -r requirements.txt
pyinstaller build.spec
```

Output: `dist/SecKnightVisionAgent/SecKnightVisionAgent.exe`. Copy your
filled-in `config.json` into that same `dist/SecKnightVisionAgent/` folder
before distributing/running it — the agent looks for `config.json` next to
the executable.

## Config reference (`config.json`)

| Field                         | Description                                                              |
|--------------------------------|---------------------------------------------------------------------------|
| `auth_base_url`                | `desktop` service base URL (login)                                       |
| `data_base_url`                | `store-logs-api` service base URL (activity/screenshots/recordings)      |
| `socket_url`                   | `remote_socket` service WebSocket URL (`ws://...`, live Screen Cast)     |
| `crypto_password`              | Must match server's `CRYPTO_PASSWORD` exactly (32 ASCII characters)      |
| `activity_interval_seconds`    | How often to batch-upload activity (default 180)                        |
| `screenshot_interval_seconds`  | How often to capture a screenshot (default 300)                         |
| `idle_threshold_seconds`       | No-input gap before counting time as break/idle (default 300)           |
| `screenshots_enabled`          | Toggle screenshot capture on/off                                        |
| `idle_detection_enabled`       | Toggle idle detection on/off                                            |
| `remote_control_enabled`       | Toggle live Screen Cast + remote control on/off                         |

## Project layout

```
Agent/
├── run_agent.py           entry point
├── build.spec              PyInstaller spec
├── requirements.txt
├── config.example.json     copy to config.json and fill in
└── agent/
    ├── main.py              orchestrator
    ├── config.py            config.json loader
    ├── crypto_utils.py      AES-256-CBC matching the backend exactly
    ├── api_client.py        login / activity / screenshot / recording HTTP calls
    ├── tracker.py           per-second activity tracking + batching
    ├── window_info.py       active window/app detection (Windows/macOS/Linux)
    ├── screenshot.py        multi-monitor screenshot capture
    ├── remote_control.py    live Screen Cast + remote-control WebSocket client
    └── tray_ui.py           system tray icon + login popup
```
