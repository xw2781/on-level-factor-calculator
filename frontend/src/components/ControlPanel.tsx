import type { AppOptionsResponse, QuarterRequest } from '../lib/types';

type ControlPanelProps = {
  options: AppOptionsResponse | null;
  selection: QuarterRequest;
  isBusy: boolean;
  onSelectionChange: (nextSelection: QuarterRequest) => void;
  onInspect: () => void;
  onInforce: () => void;
  onWeights: () => void;
  onTogglePlot: () => void;
  hasPlot: boolean;
};

export function ControlPanel({
  options,
  selection,
  isBusy,
  onSelectionChange,
  onInspect,
  onInforce,
  onWeights,
  onTogglePlot,
  hasPlot,
}: ControlPanelProps) {
  return (
    <section className="panel controls-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Controls</p>
          <h2>Excel-driven quarter analysis</h2>
        </div>
      </div>

      <div className="control-grid">
        <label className="field">
          <span>Year</span>
          <select
            value={selection.year}
            onChange={(event) =>
              onSelectionChange({
                ...selection,
                year: Number(event.target.value),
              })
            }
          >
            {options?.years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Quarter</span>
          <select
            value={selection.quarter}
            onChange={(event) =>
              onSelectionChange({
                ...selection,
                quarter: Number(event.target.value),
              })
            }
          >
            {options?.quarters.map((quarter) => (
              <option key={quarter.value} value={quarter.value}>
                {quarter.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Policy Term</span>
          <select
            value={selection.policy_term_months}
            onChange={(event) =>
              onSelectionChange({
                ...selection,
                policy_term_months: Number(event.target.value) as 6 | 12,
              })
            }
          >
            {options?.policy_terms.map((term) => (
              <option key={term.value} value={term.value}>
                {term.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="button-row">
        <button className="primary-button" type="button" disabled={isBusy} onClick={onInspect}>
          Load Sheet
        </button>
        <button className="secondary-button" type="button" disabled={isBusy} onClick={onInforce}>
          Calc Dates
        </button>
        <button className="secondary-button" type="button" disabled={isBusy} onClick={onWeights}>
          Calc Weights
        </button>
        <button
          className="ghost-button"
          type="button"
          disabled={!hasPlot}
          onClick={onTogglePlot}
        >
          Show Plot
        </button>
      </div>
    </section>
  );
}
