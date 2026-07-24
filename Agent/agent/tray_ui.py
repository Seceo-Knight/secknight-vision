"""
System tray icon + login popup, matching the original exe's UX (login
window on start, tray icon showing status while running).
"""

import threading
import tkinter as tk
from tkinter import messagebox

import pystray
from PIL import Image, ImageDraw


def _make_icon_image(color=(37, 99, 235)) -> Image.Image:
    img = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.ellipse((4, 4, 60, 60), fill=color)
    return img


class LoginWindow:
    """Blocking tkinter login dialog. Returns (email, password) or None if
    cancelled."""

    def __init__(self, app_title="SecKnight Vision Agent", error_message=None):
        self.result = None
        self.root = tk.Tk()
        self.root.title(app_title)
        self.root.geometry("340x220")
        self.root.resizable(False, False)

        tk.Label(self.root, text=app_title, font=("Segoe UI", 13, "bold")).pack(pady=(18, 4))
        tk.Label(self.root, text="Sign in with your employee account").pack(pady=(0, 12))

        if error_message:
            tk.Label(self.root, text=error_message, fg="red", wraplength=300).pack(pady=(0, 8))

        form = tk.Frame(self.root)
        form.pack(padx=24, fill="x")

        tk.Label(form, text="Email").grid(row=0, column=0, sticky="w")
        self.email_entry = tk.Entry(form, width=30)
        self.email_entry.grid(row=1, column=0, pady=(0, 10))

        tk.Label(form, text="Password").grid(row=2, column=0, sticky="w")
        self.password_entry = tk.Entry(form, width=30, show="*")
        self.password_entry.grid(row=3, column=0, pady=(0, 14))

        btn = tk.Button(self.root, text="Login", width=14, command=self._on_login)
        btn.pack()
        self.root.bind("<Return>", lambda _e: self._on_login())
        self.email_entry.focus()

    def _on_login(self):
        email = self.email_entry.get().strip()
        password = self.password_entry.get()
        if not email or not password:
            messagebox.showerror("Missing info", "Enter both email and password.")
            return
        self.result = (email, password)
        self.root.destroy()

    def run(self):
        self.root.mainloop()
        return self.result


def prompt_login(error_message=None):
    return LoginWindow(error_message=error_message).run()


class ServerSetupWindow:
    """
    Blocking tkinter dialog shown once, on first launch, when no config.json
    exists next to the executable yet. Lets whoever is installing the agent
    (IT admin, not the end employee) type the server address instead of
    needing a pre-baked config.json per customer/deployment - the same
    packaged .exe can be handed to any SecKnight Vision deployment this way.

    Returns a dict of config fields (auth_base_url/data_base_url/socket_url/
    crypto_password) built from the fixed port convention every deploy.sh
    install uses (desktop=3004, store-logs-api=3001, realtime=3006 - see
    deploy_service() calls in deploy.sh), or None if cancelled.
    """

    def __init__(self, app_title="SecKnight Vision Agent - Setup", error_message=None):
        self.result = None
        self.root = tk.Tk()
        self.root.title(app_title)
        self.root.geometry("380x330")
        self.root.resizable(False, False)

        tk.Label(self.root, text="Connect to your SecKnight Vision server", font=("Segoe UI", 12, "bold")).pack(pady=(18, 4))
        tk.Label(self.root, text="One-time setup - ask your admin if unsure", fg="#666").pack(pady=(0, 10))

        if error_message:
            tk.Label(self.root, text=error_message, fg="red", wraplength=330).pack(pady=(0, 8))

        form = tk.Frame(self.root)
        form.pack(padx=24, fill="x")

        tk.Label(form, text="Server address (IP or domain)").grid(row=0, column=0, sticky="w")
        self.server_entry = tk.Entry(form, width=34)
        self.server_entry.grid(row=1, column=0, pady=(0, 10))
        self.server_entry.insert(0, "e.g. 192.168.1.68")
        self.server_entry.config(fg="grey")
        self.server_entry.bind("<FocusIn>", self._clear_placeholder)

        self.use_https = tk.BooleanVar(value=False)
        tk.Checkbutton(form, text="Use HTTPS (server has an SSL certificate)", variable=self.use_https).grid(
            row=2, column=0, sticky="w", pady=(0, 10)
        )

        tk.Label(form, text="Crypto password (from your server admin)").grid(row=3, column=0, sticky="w")
        self.crypto_entry = tk.Entry(form, width=34, show="*")
        self.crypto_entry.grid(row=4, column=0, pady=(0, 14))

        btn = tk.Button(self.root, text="Connect", width=14, command=self._on_submit)
        btn.pack()
        self.root.bind("<Return>", lambda _e: self._on_submit())
        self.server_entry.focus()

    def _clear_placeholder(self, _event):
        if self.server_entry.get() == "e.g. 192.168.1.68":
            self.server_entry.delete(0, tk.END)
            self.server_entry.config(fg="black")

    def _on_submit(self):
        server = self.server_entry.get().strip()
        crypto_password = self.crypto_entry.get().strip()
        if not server or server == "e.g. 192.168.1.68":
            messagebox.showerror("Missing info", "Enter your server's address (IP or domain).")
            return
        if not crypto_password:
            messagebox.showerror("Missing info", "Enter the crypto password provided by your server admin.")
            return
        # Strip any protocol/port the user might have pasted in by habit -
        # we derive both from the fixed port convention below.
        server = server.replace("https://", "").replace("http://", "").split("/")[0].split(":")[0]
        protocol = "https" if self.use_https.get() else "http"
        ws_protocol = "wss" if self.use_https.get() else "ws"
        self.result = {
            "auth_base_url": f"{protocol}://{server}:3004",
            "data_base_url": f"{protocol}://{server}:3001",
            "socket_url": f"{ws_protocol}://{server}:3006",
            "crypto_password": crypto_password,
        }
        self.root.destroy()

    def run(self):
        self.root.mainloop()
        return self.result


def prompt_server_setup(error_message=None):
    return ServerSetupWindow(error_message=error_message).run()


class TrayApp:
    """Wraps pystray in its own thread so it doesn't block the tracker."""

    def __init__(self, on_quit):
        self._on_quit = on_quit
        self._icon = None
        self._status_text = "Starting..."

    def _build_menu(self):
        return pystray.Menu(
            pystray.MenuItem(lambda item: self._status_text, None, enabled=False),
            pystray.MenuItem("Quit", self._quit),
        )

    def _quit(self, icon, item):
        icon.stop()
        self._on_quit()

    def set_status(self, text: str):
        self._status_text = text
        if self._icon:
            # update_menu() alone is unreliable for refreshing an already-
            # open/cached menu on Windows - the dropdown item text can get
            # stuck showing a stale value (e.g. a one-off "Sync failed"
            # that never visually updates back to "Active" even though
            # later syncs are actually succeeding). Also set the icon's
            # hover tooltip (title), which Windows always redraws
            # immediately and independently of the dropdown menu, so the
            # real current status is visible either way.
            try:
                self._icon.title = f"SecKnight Vision Agent — {text}"
            except Exception:
                pass
            self._icon.menu = self._build_menu()
            self._icon.update_menu()

    def start(self):
        self._icon = pystray.Icon(
            "secknight-agent", _make_icon_image(), "SecKnight Vision Agent", self._build_menu()
        )
        thread = threading.Thread(target=self._icon.run, daemon=True)
        thread.start()

    def stop(self):
        if self._icon:
            self._icon.stop()
