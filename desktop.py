"""Run Orbit CRM as an always-on-top desktop panel.

    python desktop.py

Opens a native window docked to the right edge of your screen, one third
of the screen wide and full height, pinned on top of every other window -
so you can glance at new leads without switching apps. Maximizing the
window un-pins it (so it behaves like a normal full-screen app); restoring
it back down re-pins it.

This is an alternative to `python app.py`, not an addition to it - it
runs the same Flask app internally, just inside a native window instead
of your regular browser. If you also want the WhatsApp/Messenger webhook
reachable via ngrok, point ngrok at port 5000 exactly as described in the
README; it works the same whichever way you started the app.
"""

import socket
import threading
import time

import webview

from crm import create_app

HOST = "127.0.0.1"
PORT = 5000


def _panel_geometry():
    """Return (width, height, x, y) for a right-docked panel one third
    of the screen wide. Uses the Windows work area (screen minus the
    taskbar) when available, otherwise falls back to a 1920x1080 guess."""
    try:
        import ctypes
        from ctypes import wintypes

        rect = wintypes.RECT()
        SPI_GETWORKAREA = 0x0030
        if not ctypes.windll.user32.SystemParametersInfoW(SPI_GETWORKAREA, 0, ctypes.byref(rect), 0):
            raise OSError("SystemParametersInfoW failed")
        left, top = rect.left, rect.top
        screen_width = rect.right - rect.left
        screen_height = rect.bottom - rect.top
    except Exception:
        # Not on Windows, or the call failed - reasonable default so the
        # window still opens somewhere sensible instead of crashing.
        left, top = 0, 0
        screen_width, screen_height = 1920, 1080

    width = screen_width // 3
    height = screen_height
    x = left + screen_width - width
    y = top
    return width, height, x, y


def _wait_for_server(timeout=10):
    """Block until the Flask dev server is accepting connections, so the
    webview doesn't try to load the page before it's ready."""
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        try:
            with socket.create_connection((HOST, PORT), timeout=0.5):
                return True
        except OSError:
            time.sleep(0.1)
    return False


def _run_flask(app):
    # debug=False / use_reloader=False: the reloader spawns a subprocess
    # that re-imports this whole module, which would open a second window.
    app.run(host=HOST, port=PORT, debug=False, use_reloader=False)


def _pin_unless_maximized(window):
    """Keep the window always-on-top, except while it's maximized (a
    maximized always-on-top window would block every other app)."""

    def unpin():
        window.on_top = False

    def pin():
        window.on_top = True

    window.events.maximized += unpin
    window.events.restored += pin


def main():
    app = create_app()
    threading.Thread(target=_run_flask, args=(app,), daemon=True).start()
    _wait_for_server()

    width, height, x, y = _panel_geometry()
    window = webview.create_window(
        "Orbit CRM",
        f"http://{HOST}:{PORT}",
        width=width,
        height=height,
        x=x,
        y=y,
        on_top=True,
        resizable=True,
    )
    webview.start(_pin_unless_maximized, window)


if __name__ == "__main__":
    main()
