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
