from __future__ import annotations

import socket
import threading
import time
from pathlib import Path

import uvicorn
import webview

from backend.app import app


BASE_DIR = Path(__file__).resolve().parent
ICON_PATH = BASE_DIR / "frontend" / "public" / "favicon.ico"


def _find_open_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as probe:
        probe.bind(("127.0.0.1", 0))
        return probe.getsockname()[1]


def _wait_for_server(host: str, port: int, timeout_seconds: float = 10.0) -> None:
    deadline = time.time() + timeout_seconds
    while time.time() < deadline:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as probe:
            probe.settimeout(0.5)
            if probe.connect_ex((host, port)) == 0:
                return
        time.sleep(0.1)
    raise RuntimeError(f"Timed out waiting for the local server at http://{host}:{port}")


def main() -> None:
    host = "127.0.0.1"
    port = _find_open_port()
    server = uvicorn.Server(
        uvicorn.Config(app, host=host, port=port, log_level="warning", access_log=False)
    )

    server_thread = threading.Thread(target=server.run, daemon=True, name="olep-calculator-api")
    server_thread.start()
    _wait_for_server(host, port)

    webview.create_window(
        title="OLEP Calculator",
        url=f"http://{host}:{port}",
        width=1440,
        height=980,
        min_size=(1100, 760),
    )

    try:
        webview.start(icon=str(ICON_PATH) if ICON_PATH.exists() else None)
    finally:
        server.should_exit = True
        server_thread.join(timeout=5)


if __name__ == "__main__":
    main()
