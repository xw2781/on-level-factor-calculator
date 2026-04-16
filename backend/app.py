from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles

from backend.models import AppOptionsResponse, InforceResponse, QuarterRequest, WeightResponse, WorkbookSnapshotResponse
from backend.runtime import get_app_base_dir
from backend.services.calculator import CalculatorError, CalculatorService
from backend.services.excel_session import ExcelSessionError
from backend.version import __version__


BASE_DIR = get_app_base_dir()
FRONTEND_DIST_DIR = BASE_DIR / "frontend" / "dist"

app = FastAPI(title="OLEP Calculator", version=__version__)
calculator_service = CalculatorService()


@app.get("/api/options", response_model=AppOptionsResponse)
def read_app_options() -> AppOptionsResponse:
    options = calculator_service.app_options()
    return AppOptionsResponse(**options, version=__version__)


@app.post("/api/workbook/inspect", response_model=WorkbookSnapshotResponse)
def inspect_workbook(request: QuarterRequest) -> WorkbookSnapshotResponse:
    try:
        return calculator_service.inspect_active_workbook(request.policy_term_months)
    except (CalculatorError, ExcelSessionError) as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@app.post("/api/inforce", response_model=InforceResponse)
def calculate_inforce(request: QuarterRequest) -> InforceResponse:
    try:
        return calculator_service.calculate_inforce_dates(request)
    except (CalculatorError, ExcelSessionError) as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@app.post("/api/weights", response_model=WeightResponse)
def calculate_weights(request: QuarterRequest) -> WeightResponse:
    try:
        return calculator_service.calculate_weights(request)
    except (CalculatorError, ExcelSessionError) as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@app.get("/api/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


if FRONTEND_DIST_DIR.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST_DIR / "assets"), name="assets")


@app.get("/{full_path:path}", response_model=None)
def serve_frontend(full_path: str):
    if FRONTEND_DIST_DIR.exists():
        candidate = FRONTEND_DIST_DIR / full_path
        if full_path and candidate.exists() and candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(FRONTEND_DIST_DIR / "index.html")

    return HTMLResponse(
        """
        <html>
          <head>
            <title>OLEP Calculator</title>
            <style>
              body { font-family: Segoe UI, sans-serif; padding: 32px; background: #0b1320; color: #f6f7fb; }
              code { background: rgba(255,255,255,0.12); padding: 2px 6px; border-radius: 4px; }
            </style>
          </head>
          <body>
            <h1>Frontend build not found</h1>
            <p>Run <code>npm install</code> and <code>npm run build</code> inside <code>frontend</code>.</p>
          </body>
        </html>
        """
    )
