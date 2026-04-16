from __future__ import annotations

import sys
from pathlib import Path


def get_app_base_dir() -> Path:
    if getattr(sys, "frozen", False):
        return Path(getattr(sys, "_MEIPASS"))

    return Path(__file__).resolve().parent.parent


def get_resource_path(*parts: str) -> Path:
    return get_app_base_dir().joinpath(*parts)
