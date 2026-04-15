from __future__ import annotations

from dataclasses import dataclass

import pythoncom
from win32com.client import Dispatch


@dataclass(slots=True)
class ActiveExcelSelection:
    workbook_path: str
    sheet_name: str
    active_row: int
    active_column: int


class ExcelSessionError(RuntimeError):
    """Raised when the current Excel selection cannot be resolved."""


class ExcelSessionService:
    def get_active_selection(self) -> ActiveExcelSelection:
        try:
            pythoncom.CoInitialize()
            excel = Dispatch("Excel.Application")

            workbook = excel.ActiveWorkbook
            worksheet = excel.ActiveSheet
            active_cell = excel.ActiveCell

            if workbook is None or worksheet is None or active_cell is None:
                raise ExcelSessionError("Open Excel, select a date header cell, and try again.")

            workbook_path = workbook.FullName
            if not workbook_path:
                raise ExcelSessionError("The active workbook must be saved before it can be read.")

            return ActiveExcelSelection(
                workbook_path=workbook_path,
                sheet_name=worksheet.Name,
                active_row=active_cell.Row,
                active_column=active_cell.Column,
            )
        except ExcelSessionError:
            raise
        except Exception as error:
            raise ExcelSessionError(
                "Open Excel, activate the target workbook and sheet, select the date header cell, and try again."
            ) from error
