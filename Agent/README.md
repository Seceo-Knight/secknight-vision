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
- USB/clipboard (DLP) events: `POST {data_base_url}/api/v1/desktop/add-system-log`
- Live Screen Cast + remote control: WebSocket to `Backend/realtime`
  (NOT `Backend/remote_socket` - that's a separate, unused-by-the-Frontend
  service implementing a near-identical protocol on its own port; confirmed
  by checking what `apiService.SOCKET_BASE_URL` / `VITE_SOCKET_URL` actually
  points ScreenCastTab.jsx at), protocol matched against
  `Frontend/.../ScreenCastTab.jsx`

## Features

- Login popup + system tray icon with live status. Login is remembered
  across restarts (saved to `session.json` next to `config.json`) - you
  only see the popup again once the saved session actually expires or is
  rejected by the server. Delete `session.json` to force a fresh login.
- Activity tracking: keystrokes, clicks, mouse movement, per-app/window
  usage — batched and uploaded every `activity_interval_seconds`
- Idle/away detection (no input for `idle_threshold_seconds` gets reported
  as break time instead of active time)
- Periodic screenshots (multi-monitor aware)
- Live Screen Cast: streams your screen to the admin dashboard's
  Employee Profile > Screen Cast tab when an admin clicks Connect
- Remote control: mouse, keyboard, and the shortcut buttons (Windows key,
  File Explorer, Run, Copy, Paste, Lock, Restart, Shutdown)
- USB detection: logs drive connect/disconnect events (Windows only, via
  WMI) to the admin Frontend's DLP > USB Detection tab
- Clipboard monitoring: logs clipboard copy events, text only, capped at
  2000 characters per event (Windows only) to DLP > Clipboard Logs — the
  most privacy-sensitive feature here, see `clipboard_monitoring_enabled`
  in the config reference below before enabling for a real org
- Periodic screen recordings (off by default — see limitation below)

## Installing on an employee's Windows PC (no coding needed)

Most people don't need to build anything - just download the ready-made
installer and run it:

1. Go to the [Releases page](https://github.com/Seceo-Knight/secknight-vision/releases)
   and find the latest release starting with `agent-` (e.g. `agent-v1.0.0`).
2. Under **Assets**, click `SecKnightVisionAgentSetup.exe` to download it.
3. Run the downloaded file. Click through the installer:
   **Next > Next > Install > Finish**. Leave **"Start SecKnight Vision
   Agent automatically when Windows starts"** checked on the Tasks page -
   this is what makes it launch on its own every day without anyone having
   to open or log into it manually.
4. On first launch, a small **"Connect to your SecKnight Vision server"**
   window appears, asking for:
   - **Server address** - the IP or domain of your SecKnight Vision
     server (ask whoever manages it, e.g. `192.168.1.68`)
   - **Crypto password** - see below for how to get this
5. After that, it asks for a normal **email + password** login - use the
   employee's SecKnight Vision account. Once logged in, the agent runs
   quietly in the system tray from then on - no popup on future logins
   unless that saved session actually expires.

### Where to get the crypto password

This is a secret value set once when the SecKnight Vision **server** was
deployed - it's the same for every employee on that server, so ask your
server admin for it if you don't have server access yourself.

If you *do* have SSH/terminal access to the server, get it directly by
running this on the server:

```bash
grep CRYPTO_PASSWORD ~/secknight-vision/Backend/desktop/.env
```

This prints a line like `CRYPTO_PASSWORD=abcdEXAMPLE1234567890xyz`. Copy
only the part **after** the `=` sign (no quotes, no spaces) - that's what
goes into the "Crypto password" field in step 4 above. It must match
exactly, or login will fail.

---

Everything below this point is only needed if you're changing the agent's
source code and need to rebuild/repackage it - most people installing this
on an employee's PC only need the section above.

## Known limitations (v1)

- Windows-only for window tracking and remote control (uses `pywin32`).
  Activity/screenshot/login features are cross-platform capable but
  untested on macOS/Linux.
- Web History (current-tab URL) is Windows-only, and only for Chromium
  browsers (Chrome/Edge/Brave/Vivaldi/Opera) and Firefox — read directly
  from the address bar via Windows UI Automation (`uiautomation` package,
  see `agent/window_info.py`'s `get_browser_url()`), no browser extension
  needed. Best-effort: if the address bar control can't be located (theme
  differences, fullscreen mode, an unsupported/exotic browser), that
  segment just has no `url`, same as before — App History still works.
- Screen recording (`screen_record_enabled`) captures and uploads
  `.mp4` files. The backend's `ScreenRecordService` uploads to whichever
  storage provider is configured for the organization — a real cloud
  provider (Google Drive/S3/FTP/etc.) or the local-disk provider (short
  code `LC`, see `Backend/store-logs-api/.../utils/local-storage.utils.ts`),
  which works the same way it does for screenshots. Left disabled by
  default because continuous video capture is more resource-intensive
  than screenshots, not because of a missing backend feature — enable it
  once a storage provider (LC or otherwise) is confirmed configured for
  the org.
- USB Detection and Clipboard Logs (DLP tabs) are Windows-only. USB
  detection only covers connect/disconnect events (drive letter
  arrival/removal via WMI) - it does not enumerate individual file
  transfers, and there's no blocking/prevention capability (that would
  need a filter driver). Clipboard monitoring only captures plain text
  (not copied files/images), and only detects a change happened - not
  which application the copy came from.
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

python run_agent.py
```

No `config.json` yet? The agent shows a one-time "Connect to your SecKnight
Vision server" setup dialog on first launch instead of failing - enter the
server's address (IP or domain) and the crypto password, and it writes
`config.json` next to itself from there (`auth_base_url`/`data_base_url`/
`socket_url` are derived automatically using the fixed ports every
`deploy.sh` install uses: desktop=3004, store-logs-api=3001, realtime=3006).
Delete `config.json` any time to redo this.

If you'd rather skip the dialog (e.g. scripting a dev setup), you can still
`copy config.example.json config.json` and fill it in by hand before running
- see the field reference below. Same caveat as always: `crypto_password`
must byte-for-byte match `CRYPTO_PASSWORD` in the server's
`Backend/desktop/.env` and `Backend/store-logs-api/.env`, and `socket_url`
must point at `Backend/realtime` (NOT `Backend/remote_socket` - that service
is unused by the current Frontend, despite implementing an almost identical
protocol; the agent will authenticate fine against it but the admin UI will
never show it as online).

## Updating this folder on a machine where `git pull` doesn't work

If you're building on a separate Windows machine that isn't set up with git
push/pull access to this repo (only the server usually is), don't try to
hand-copy just the one or two files you think changed - it's easy to miss
one and end up with a confusing mix of old and new code (e.g. a rebuilt
`.exe` that still crashes with an old error even though you meant to fix
it). Instead, every time there's an update:

1. On GitHub, click **Code > Download ZIP** and extract it fresh.
2. Copy the **entire** `Agent` folder out of the extracted ZIP and use it
   as your whole working folder from now on (rename it to whatever you
   were calling it before, e.g. `SecKnightVisionAgent`) - don't merge
   individual files into an old folder.
3. Rebuild: `pip install -r requirements.txt` then `pyinstaller build.spec`.
4. **Test the raw exe first**, before touching the installer:
   double-click `dist/SecKnightVisionAgent/SecKnightVisionAgent.exe`
   directly and confirm it behaves as expected (e.g. shows the setup
   wizard, logs in, etc.) - much faster feedback than rebuilding the
   Inno Setup installer too and finding out something's still broken.
5. Check `agent.log` (written next to the exe, see "Building a standalone
   .exe" below) to confirm it's actually working - look for a login
   success and activity/remote-control being sent, with no traceback.
   This is more reliable than checking the admin dashboard, since
   Attendance/status indicators there only refresh periodically and can
   look stale for a few minutes even when the agent is working fine.
6. Only once step 4-5 look right, rebuild the installer
   (`installer.iss` in Inno Setup) and test that.

## Building a standalone .exe

Only step you need to run yourself (this repo's build environment can't
compile a Windows executable):

```bash
pip install -r requirements.txt
pyinstaller build.spec
```

Output: `dist/SecKnightVisionAgent/SecKnightVisionAgent.exe`. This is now a
single generic build - it does NOT need a pre-filled `config.json` baked in
before distributing. Hand the whole `dist/SecKnightVisionAgent/` folder to
any machine on any SecKnight Vision deployment; the first launch shows the
server-setup dialog described above and writes its own `config.json`. (You
can still pre-drop a filled-in `config.json` into that folder before
distributing if you want a silent, no-prompt install for a specific
deployment - the dialog only appears when the file is missing.)

That raw `dist/` folder is fine for testing, but it's not something you'd
hand an employee - no Start Menu entry, no uninstaller, and nothing makes
it start automatically. For real deployment, build the real installer below
instead.

## Building a real installer (recommended for actual deployment)

The raw `dist/SecKnightVisionAgent/` folder above is a portable app, not an
installer - double-clicking the `.exe` inside it just runs the agent, it
doesn't "install" anything. For handing this to an employee's machine, build
a proper installer with [Inno Setup](https://jrsoftware.org/isinfo.php)
(free) using the included `installer.iss` script:

```bash
pip install -r requirements.txt
pyinstaller build.spec              # must succeed first - installer.iss packages its output
```

Then, in Inno Setup on Windows: open `installer.iss` and press **Compile**
(or right-click the file in Explorer > Compile). Output:
`Output/SecKnightVisionAgentSetup.exe`.

Running that gives a real **Next > Install > Finish** wizard:

- Installs to the current Windows user's own Program Files folder - no
  admin/UAC prompt needed, works on a standard employee account
- Adds a Start Menu entry and a proper uninstaller (Control Panel/Settings
  > Apps)
- **"Start automatically when Windows starts" is checked by default** on
  the Tasks page - this is what makes the agent not need to be manually
  opened every day. Mechanically it's just a shortcut placed in that
  user's Startup folder (`shell:startup`), which Windows launches
  automatically at every login, no registry/scheduled-task setup needed
- Offers to launch the agent immediately once install finishes

Login itself already survives restarts on top of this - `session.json`
(saved next to `config.json`) is checked before the login popup ever shows,
so once someone signs in once, the daily flow becomes fully hands-off:
Windows starts -> Startup shortcut launches the agent -> saved session is
reused -> tray icon goes "Active" with no popup at all. The login popup
only reappears if that saved session actually expires or is rejected by
the server.

For pushing this to many machines at once (vs. one employee running the
installer by hand), Inno Setup's output already supports silent installs
out of the box: `SecKnightVisionAgentSetup.exe /VERYSILENT` installs with
no UI at all (auto-start task stays checked by default), which a script or
RMM/deployment tool can call per machine.

## Config reference (`config.json`)

| Field                         | Description                                                              |
|--------------------------------|---------------------------------------------------------------------------|
| `auth_base_url`                | `desktop` service base URL (login)                                       |
| `data_base_url`                | `store-logs-api` service base URL (activity/screenshots/recordings)      |
| `socket_url`                   | `Backend/realtime` service WebSocket URL (`ws://...`, live Screen Cast)  |
| `crypto_password`              | Must match server's `CRYPTO_PASSWORD` exactly (32 ASCII characters)      |
| `activity_interval_seconds`    | How often to batch-upload activity (default 180)                        |
| `screenshot_interval_seconds`  | How often to capture a screenshot (default 300)                         |
| `idle_threshold_seconds`       | No-input gap before counting time as break/idle (default 300)           |
| `screenshots_enabled`          | Toggle screenshot capture on/off                                        |
| `idle_detection_enabled`       | Toggle idle detection on/off                                            |
| `remote_control_enabled`       | Toggle live Screen Cast + remote control on/off                         |
| `usb_detection_enabled`        | Toggle USB drive connect/disconnect logging on/off (default true)       |
| `clipboard_monitoring_enabled` | Toggle clipboard-copy logging on/off (default true - most privacy-sensitive DLP feature, review before enabling for a real org) |
| `screen_record_enabled`        | Toggle periodic screen recording on/off (default false, see limitations)|
| `screen_record_interval_seconds`| How often to start a new recording (default 600)                       |
| `screen_record_duration_seconds`| Length of each recording, server caps at 300s (default 60)             |
| `screen_record_fps`            | Capture frame rate for recordings (default 4)                           |

## Project layout

```
Agent/
├── run_agent.py           entry point
├── build.spec              PyInstaller spec
├── installer.iss           Inno Setup script - builds the real installer (auto-start included)
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
    ├── system_logs.py       USB detection + clipboard monitoring (DLP tabs)
    └── tray_ui.py           system tray icon + login popup
```
