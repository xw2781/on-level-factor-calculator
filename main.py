from __future__ import annotations

import argparse
import os
import shutil
import socket
import subprocess
import sys
import threading
import time
from pathlib import Path

import uvicorn
import webview

from backend.app import app


BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = BASE_DIR / "frontend"
ICON_PATH = BASE_DIR / "frontend" / "public" / "favicon.ico"
FRONTEND_DEV_HOST = "127.0.0.1"
FRONTEND_DEV_PORT = 4173


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


def _resolve_node_executable() -> str:
    node_candidates = [
        os.environ.get("NODE_EXE"),
        shutil.which("node.exe"),
        shutil.which("node"),
        str(BASE_DIR / "node-portable" / "node.exe"),
        str(FRONTEND_DIR / "node-portable" / "node.exe"),
        str(Path.home() / "Documents" / "Web UI" / "node-portable" / "node.exe"),
    ]

    for candidate in node_candidates:
        if candidate and Path(candidate).exists():
            return candidate

    raise RuntimeError(
        "Could not find node.exe for the Vite dev server. Set NODE_EXE to a Node binary, "
        "add Node to PATH, or place a portable copy at 'node-portable\\node.exe'."
    )


def _resolve_frontend_dev_command() -> list[str]:
    vite_entry = FRONTEND_DIR / "node_modules" / "vite" / "bin" / "vite.js"
    if vite_entry.exists():
        return [_resolve_node_executable(), str(vite_entry), "--host", FRONTEND_DEV_HOST]

    npm_command = shutil.which("npm.cmd") or shutil.which("npm")
    if npm_command:
        return [npm_command, "run", "dev", "--", "--host", FRONTEND_DEV_HOST]

    raise RuntimeError(
        "Could not find the Vite dev entrypoint. Install frontend dependencies with "
        "'npm install' inside 'frontend', then retry 'python main.py --dev'."
    )


def _start_frontend_dev_server(api_target: str) -> subprocess.Popen[bytes]:
    env = os.environ.copy()
    env["OLEP_API_PROXY_TARGET"] = api_target

    creationflags = subprocess.CREATE_NEW_PROCESS_GROUP if os.name == "nt" else 0
    process = subprocess.Popen(
        _resolve_frontend_dev_command(),
        cwd=FRONTEND_DIR,
        env=env,
        creationflags=creationflags,
    )

    try:
        _wait_for_server(FRONTEND_DEV_HOST, FRONTEND_DEV_PORT, timeout_seconds=20.0)
    except Exception:
        _terminate_process_tree(process)
        raise

    return process


def _terminate_process_tree(process: subprocess.Popen[bytes]) -> None:
    if process.poll() is not None:
        return

    if os.name == "nt":
        subprocess.run(
            ["taskkill", "/PID", str(process.pid), "/T", "/F"],
            check=False,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        return

    process.terminate()
    try:
        process.wait(timeout=5)
    except subprocess.TimeoutExpired:
        process.kill()
        process.wait(timeout=5)


def _parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Launch the OLEP Calculator desktop app.")
    parser.add_argument(
        "--dev",
        action="store_true",
        help="Run the frontend with the Vite dev server and hot reload.",
    )
    return parser.parse_args(argv)


def main() -> None:
    args = _parse_args(sys.argv[1:])
    host = "127.0.0.1"
    port = _find_open_port()
    server = uvicorn.Server(
        uvicorn.Config(app, host=host, port=port, log_level="warning", access_log=False)
    )

    server_thread = threading.Thread(target=server.run, daemon=True, name="olep-calculator-api")
    server_thread.start()
    _wait_for_server(host, port)

    app_url = f"http://{host}:{port}"
    frontend_process: subprocess.Popen[bytes] | None = None
    if args.dev:
        frontend_process = _start_frontend_dev_server(app_url)
        app_url = f"http://{FRONTEND_DEV_HOST}:{FRONTEND_DEV_PORT}"

    webview.create_window(
        title="OLEP Calculator",
        url=app_url,
        width=1440,
        height=980,
        min_size=(1100, 760),
    )

    try:
        webview.start(icon=str(ICON_PATH) if ICON_PATH.exists() else None)
    finally:
        if frontend_process is not None:
            _terminate_process_tree(frontend_process)
        server.should_exit = True
        server_thread.join(timeout=5)


if __name__ == "__main__":
    main()
