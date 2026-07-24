; SecKnight Vision Desktop Agent - Windows installer
;
; Produces a real "Next > Install > Finish" installer (not just the raw
; PyInstaller dist/ folder), with a Start Menu entry, uninstaller, and an
; optional auto-start-at-login shortcut - so the agent doesn't need to be
; manually opened (and re-logged into) by the employee every day.
;
; Build with Inno Setup (https://jrsoftware.org/isinfo.php), on Windows:
;   1. pip install -r requirements.txt
;   2. pyinstaller build.spec
;      -> must produce dist\SecKnightVisionAgent\SecKnightVisionAgent.exe
;   3. Open this file in the Inno Setup Compiler (or right-click it in
;      Explorer > "Compile") and click Compile / press F9.
;   -> Output\SecKnightVisionAgentSetup.exe
;
; This repo's Linux build environment can't run Inno Setup - this script
; only compiles on Windows, same constraint as the .exe itself.
;
; Per-user install (no admin/UAC prompt) - matches where config.json/
; session.json/agent.log already live (next to the exe, see config.py's
; _base_dir()), so nothing about the app's runtime file handling needs to
; change for this to work correctly on a standard (non-admin) employee
; Windows account.

#define MyAppName "SecKnight Vision Agent"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "SecKnight"
#define MyAppExeName "SecKnightVisionAgent.exe"

[Setup]
AppId={{B6E1B4B0-9C2A-4B8E-9F3D-8E2B1A6C4D7F}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\SecKnightVisionAgent
PrivilegesRequired=lowest
DefaultGroupName=SecKnight Vision Agent
DisableProgramGroupPage=yes
OutputDir=Output
OutputBaseFilename=SecKnightVisionAgentSetup
Compression=lzma
SolidCompression=yes
WizardStyle=modern
UninstallDisplayIcon={app}\{#MyAppExeName}
; If an older version's agent.exe is already running (it's a tray app,
; usually always running), close it before overwriting files on upgrade.
CloseApplications=yes
RestartApplications=no

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "autostart"; Description: "Start {#MyAppName} automatically when Windows starts (recommended)"; GroupDescription: "Startup:"

[Files]
Source: "dist\SecKnightVisionAgent\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\Uninstall {#MyAppName}"; Filename: "{uninstallexe}"
; This is the auto-start mechanism: a shortcut in the current Windows
; user's own Startup folder. Windows launches everything in this folder
; automatically at login - no registry Run-key or scheduled task needed,
; and no admin rights required (matches PrivilegesRequired=lowest above).
Name: "{userstartup}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: autostart

[Run]
; Standard "Finish" screen offer to launch right away, so the person
; running setup gets the full Next > Install > Finish experience and sees
; the app working immediately instead of having to find it themselves.
Filename: "{app}\{#MyAppExeName}"; Description: "Launch {#MyAppName} now"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
; config.json / session.json / agent.log are created at runtime (not part
; of [Files] above), so Inno Setup wouldn't remove them on uninstall by
; default - do it explicitly so a saved crypto_password/session token
; doesn't linger on disk after the app is uninstalled.
Type: filesandordirs; Name: "{app}"
