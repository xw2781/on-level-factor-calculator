from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, field_validator


PolicyTermMonths = Literal[6, 12]


class QuarterRequest(BaseModel):
    year: int = Field(ge=2000, le=2100)
    quarter: int = Field(ge=1, le=4)
    policy_term_months: PolicyTermMonths

    @field_validator("policy_term_months")
    @classmethod
    def validate_policy_term_months(cls, value: int) -> int:
        if value not in {6, 12}:
            raise ValueError("policy_term_months must be either 6 or 12")
        return value


class AppOptionsResponse(BaseModel):
    years: list[int]
    quarters: list[dict[str, str | int]]
    policy_terms: list[dict[str, str | int]]
    version: str


class EffectiveDateRange(BaseModel):
    index: int
    start_date: str
    end_date: str


class WorkbookSnapshotResponse(BaseModel):
    workbook_path: str
    sheet_name: str
    anchor_cell: str
    effective_date_ranges: list[EffectiveDateRange]


class InforceDateItem(BaseModel):
    index: int
    label: str
    iso_date: str | None = None


class InforceResponse(BaseModel):
    selection_label: str
    inforce_dates: list[InforceDateItem]


class FormulaLine(BaseModel):
    index: int
    formula: str
    numeric_value: float


class PlotPayload(BaseModel):
    year: int
    quarter: int
    policy_term_months: PolicyTermMonths
    inforce_start_dates: list[str]
    weight_values: list[float]


class WeightResponse(BaseModel):
    selection_label: str
    quarter_weight_formula: str
    quarter_weight_value: float
    formula_lines: list[FormulaLine]
    clipboard_text: str
    copied_to_clipboard: bool
    plot: PlotPayload
