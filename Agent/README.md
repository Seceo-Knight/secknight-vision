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

- Periodic screen recordings (off by default — see limitation below)

## Known limitations (v1)

- Windows-only for window tracking and remote control (uses `pywin32`).
  Activity/screenshot/login features are cross-platform capable but
  untested on macOS/Linux.
- `url` is not populated for browser tabs yet (App History works, Web
  History will show blank URLs) — browser URL extraction needs
  browser-specific accessibility APIs, left for a follow-up.
- Screen recording (`screen_record_enabled`) captures and uploads
  `.mp4` files, but the backend's `ScreenRecordService` currently only
  accepts uploads for organizations with a cloud storage provider
  configured (Google Drive/S3/FTP/etc. — see
  `Backend/store-logs-api/.../screen-record.service.ts`). There's no
  local-storage ("LC") branch for screen records yet, unlike
  screenshots (that LC work is tracked separately, still in progress
  server-side), so recordings will fail to upload with a 400 until
  either a real provider is configured or that LC branch is added. Left
  disabled by default for this reason.
- The Key Strokes tab needs no separate agent/backend work: it's read
  from the same `employee_activities` Mongo collection that the
  Productivity/App/Web History tabs already use (populated by
  `Backend/productivity_report`'s `insertActivity`), keyed off the
  `keystrokes` field this agent's `tracker.py` already sends per
  app-usage segment. It was previously suspected this needed a new
  MySQL table — traced the actual read path
  (`Backend/admin/.../employee/Employee.controller.js`'s
  `getKeyStrokes`) and confirmed it reads Mongo, not MySQL, so no
  backend change was needed there.

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
#
# socket_url's port is whatever PORT= is set to in the server's
# Backend/remote_socket/.env - the code's built-in default (5001) is NOT
# reliable, since deployments commonly override it (this one runs on 3002).
# Confirm with: grep PORT Backend/remote_socket/.env on the server, or
# `pm2 logs remote-socket --lines 5 --nostream` and read the
# "Server listening on port ..." line.

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
| `screen_record_enabled`        | Toggle periodic screen recording on/off (default false, see limitations)|
| `screen_record_interval_seconds`| How often to start a new recording (default 600)                       |
| `screen_record_duration_seconds`| Length of each recording, server caps at 300s (default 60)             |
| `screen_record_fps`            | Capture frame rate for recordings (default 4)                           |

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
    ├── screen_record.py      periodic screen recording capture (mp4)
    ├── remote_control.py    live Screen Cast + remote-control WebSocket client
    └── tray_ui.py           system tray icon + login popup
```
