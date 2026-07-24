"""
All HTTP calls to the SecKnight Vision / EmpMonitor backend, using the real,
current (non-legacy) API contract read directly from the backend source:

  POST {auth_base_url}/api/v3/auth/authenticate
      Backend/desktop/src/routes/v3/auth/services/auth.service.js

  POST {data_base_url}/api/v1/desktop/add-activity-log
      Backend/store-logs-api/.../desktop.controller.ts + dto/usage-activity-data.dto.ts

  POST {data_base_url}/api/v1/desktop/upload-screenshots   (multipart, field "screenshots")
  POST {data_base_url}/api/v1/desktop/upload-screen-records (multipart, field "screenRecords")
      Backend/store-logs-api/.../desktop.controller.ts + dto/screenshot.dto.ts / screen-record.dto.ts

  POST {data_base_url}/api/v1/desktop/add-system-log
      Backend/store-logs-api/.../desktop.controller.ts + dto/system-logs.dto.ts
      Feeds the admin Frontend's DLP tabs (USB Detection, Clipboard Logs) -
      see agent/system_logs.py for the event-type codes.

Auth header on every authenticated call: "Authorization: Bearer <accessToken>"
(Backend/store-logs-api/src/modules/v1/auth/auth.middleware.ts splits on
a single space and takes the second token).
"""

import json
import os

import requests

from . import crypto_utils


class ApiError(Exception):
    def __init__(self, message: str, status_code: int = None):
        super().__init__(message)
        self.status_code = status_code

    @property
    def is_auth_error(self) -> bool:
        # store-logs-api's auth middleware throws NestJS ForbiddenException
        # (403) for an invalid/expired token; treat 401 as auth failure too
        # in case any endpoint uses that instead.
        return self.status_code in (401, 403)


class ApiClient:
    def __init__(self, config):
        self.config = config
        self.access_token = None
        self.settings = None
        self.room_id = None
        self.employee_name = None

    # --------------------------------------------------------------- session
    # Persists just the accessToken (+ a couple of display fields) to a local
    # file so the agent doesn't need to re-prompt for the employee's email
    # and password on every restart - only when the token actually expires
    # or is otherwise rejected. Never persists the password itself.
    def save_session(self, path: str):
        try:
            with open(path, "w") as f:
                json.dump(
                    {
                        "access_token": self.access_token,
                        "employee_name": self.employee_name,
                        "room_id": self.room_id,
                    },
                    f,
                )
        except OSError:
            pass

    def load_session(self, path: str) -> bool:
        if not os.path.exists(path):
            return False
        try:
            with open(path) as f:
                data = json.load(f)
        except (OSError, ValueError):
            return False
        if not data.get("access_token"):
            return False
        self.access_token = data["access_token"]
        self.employee_name = data.get("employee_name")
        self.room_id = data.get("room_id")
        return True

    def clear_session(self, path: str):
        self.access_token = None
        try:
            os.remove(path)
        except OSError:
            pass

    # ------------------------------------------------------------------ auth
    def login(self, email: str, password: str, mac_id: str = None) -> dict:
        encrypted_password = crypto_utils.encrypt(password, self.config.crypto_password)
        body = {"email": email, "password": encrypted_password, "testing": 0}
        if mac_id:
            body["macId"] = mac_id

        resp = requests.post(
            f"{self.config.auth_base_url}/api/v3/auth/authenticate",
            json=body,
            timeout=30,
        )
        data = resp.json() if resp.content else {}

        if resp.status_code != 200 or not data.get("success"):
            message = data.get("message") or data.get("error") or f"Login failed (HTTP {resp.status_code})"
            raise ApiError(message, resp.status_code)

        self.access_token = data["accessToken"]
        self.settings = data.get("settings", {})
        self.room_id = data.get("roomId")
        self.employee_name = data.get("name")
        return data

    def _auth_headers(self) -> dict:
        if not self.access_token:
            raise ApiError("Not logged in")
        return {"Authorization": f"Bearer {self.access_token}"}

    # -------------------------------------------------------------- activity
    def send_activity(self, sign: str, data_items: list) -> dict:
        resp = requests.post(
            f"{self.config.data_base_url}/api/v1/desktop/add-activity-log",
            json={"sign": sign, "data": data_items},
            headers=self._auth_headers(),
            timeout=30,
        )
        payload = resp.json() if resp.content else {}
        if resp.status_code != 200:
            raise ApiError(payload.get("message", f"Activity upload failed (HTTP {resp.status_code})"), resp.status_code)
        return payload

    # ------------------------------------------------------------ system logs
    def send_system_events(self, events: list) -> dict:
        resp = requests.post(
            f"{self.config.data_base_url}/api/v1/desktop/add-system-log",
            json={"events": events},
            headers=self._auth_headers(),
            timeout=30,
        )
        payload = resp.json() if resp.content else {}
        if resp.status_code != 200:
            raise ApiError(payload.get("message", f"System log upload failed (HTTP {resp.status_code})"), resp.status_code)
        return payload

    # ------------------------------------------------------------ screenshots
    def upload_screenshots(self, file_paths: list, project_id: int = 0, task_id: int = 0) -> dict:
        files = [
            ("screenshots", (fp.split("/")[-1].split("\\")[-1], open(fp, "rb"), "image/png"))
            for fp in file_paths
        ]
        try:
            resp = requests.post(
                f"{self.config.data_base_url}/api/v1/desktop/upload-screenshots",
                files=files,
                data={"projectId": project_id, "taskId": task_id},
                headers=self._auth_headers(),
                timeout=60,
            )
        finally:
            for _, (_, fh, _) in files:
                fh.close()
        payload = resp.json() if resp.content else {}
        if resp.status_code != 200:
            raise ApiError(payload.get("message", f"Screenshot upload failed (HTTP {resp.status_code})"), resp.status_code)
        return payload

    # ---------------------------------------------------------- screen record
    def upload_screen_record(self, file_path: str, project_id: int = 0, task_id: int = 0, must_compress: bool = False) -> dict:
        filename = file_path.split("/")[-1].split("\\")[-1]
        with open(file_path, "rb") as fh:
            files = [("screenRecords", (filename, fh, "video/mp4"))]
            resp = requests.post(
                f"{self.config.data_base_url}/api/v1/desktop/upload-screen-records",
                files=files,
                data={"projectId": project_id, "taskId": task_id, "mustCompressed": str(must_compress).lower()},
                headers=self._auth_headers(),
                timeout=120,
            )
        payload = resp.json() if resp.content else {}
        if resp.status_code != 200:
            raise ApiError(payload.get("message", f"Screen record upload failed (HTTP {resp.status_code})"), resp.status_code)
        return payload
