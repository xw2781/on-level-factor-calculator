# -*- mode: python ; coding: utf-8 -*-

from pathlib import Path

from PyInstaller.utils.hooks import collect_data_files, collect_dynamic_libs, collect_submodules


project_dir = Path.cwd()
icon_path = project_dir / "frontend" / "public" / "favicon.ico"

datas = [
    (str(project_dir / "frontend" / "dist"), "frontend/dist"),
    (str(project_dir / "frontend" / "public" / "favicon.ico"), "frontend/public"),
]
datas += collect_data_files("webview")
datas += collect_data_files("pythonnet")

binaries = []
binaries += collect_dynamic_libs("pythonnet")

hiddenimports = []
hiddenimports += collect_submodules("webview")
hiddenimports += collect_submodules("pythonnet")


a = Analysis(
    ["main.py"],
    pathex=[],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name="OLEP Calculator",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=str(icon_path),
)

coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name="OLEP Calculator",
)
