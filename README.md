# OLEP Calculator

Desktop calculator for quarter in-force dates and OLEP weight formulas, backed by an active Excel workbook.

![OLEP Calculator UI](docs/images/olep-calculator-ui-preview.png)

## Important Notes

- The original app was developed in 2022.
- The core calculation algorithm has been verified extensively in production use.
- There is a known minor issue for 6-month policies that span a leap year: the calculation can show slight rounding variance because the logic does not account for 366-day years.
- This build keeps the same core calculation behavior while refactoring the app into a more modernized UI.

## Overview

This project wraps the existing Excel-based calculation workflow in a desktop app built with:

- Python for workbook inspection and calculation logic
- FastAPI for the local app API
- React + Vite for the user interface
- PyWebView for the desktop window shell

The app reads the currently active workbook, sheet, and selected cell from Microsoft Excel, then calculates:

- effective date ranges
- in-force dates for a selected quarter
- quarter weight formulas
- clipboard-ready formula output

## Requirements

- Windows
- Python 3.13
- Node.js
- Microsoft Excel installed
- An active, saved Excel workbook open in Excel

## Setup

### Python

```powershell
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

If `.venv` does not exist yet:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

### Frontend

```powershell
cd frontend
npm install
npm run build
cd ..
```

`main.py` serves the built frontend from `frontend/dist`, so the build step is required before launching the desktop app.

## Run

1. Open Microsoft Excel.
2. Open the target workbook and save it if it has not been saved yet.
3. Go to the target worksheet and select the date header cell.
4. Start the app:

```powershell
.\.venv\Scripts\Activate.ps1
python main.py
```

## Project Layout

```text
backend/              FastAPI app, Excel session access, and calculation logic
frontend/             React/Vite UI source and build output
docs/images/          README assets
main.py               Desktop entrypoint that starts the local server and PyWebView window
requirements.txt      Python dependencies
README.md             Project documentation
```

## Notes

- The app version is defined in `backend/version.py`.
- The desktop icon and favicon are stored at `frontend/public/favicon.ico`.
- If the UI says the frontend build is missing, run `npm install` and `npm run build` inside `frontend`.
