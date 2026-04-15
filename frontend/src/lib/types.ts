export type QuarterRequest = {
  year: number;
  quarter: number;
  policy_term_months: 6 | 12;
};

export type AppOptionsResponse = {
  years: number[];
  quarters: Array<{ value: number; label: string }>;
  policy_terms: Array<{ value: number; label: string }>;
  version: string;
};

export type WorkbookSnapshotResponse = {
  workbook_path: string;
  sheet_name: string;
  anchor_cell: string;
  effective_date_ranges: Array<{
    index: number;
    start_date: string;
    end_date: string;
  }>;
};

export type InforceResponse = {
  selection_label: string;
  inforce_dates: Array<{
    index: number;
    label: string;
    iso_date: string | null;
  }>;
};

export type WeightResponse = {
  selection_label: string;
  quarter_weight_formula: string;
  quarter_weight_value: number;
  formula_lines: Array<{
    index: number;
    formula: string;
    numeric_value: number;
  }>;
  clipboard_text: string;
  copied_to_clipboard: boolean;
  plot: {
    year: number;
    quarter: number;
    policy_term_months: 6 | 12;
    inforce_start_dates: string[];
    weight_values: number[];
  };
};
