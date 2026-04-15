import type { WeightResponse } from '../lib/types';

type WeightsPanelProps = {
  result: WeightResponse | null;
};

export function WeightsPanel({ result }: WeightsPanelProps) {
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Weights</p>
          <h2>Quarter formula breakdown</h2>
        </div>
      </div>

      {result ? (
        <>
          <div className="weight-summary">
            <div className="summary-card">
              <span>Selection</span>
              <strong>{result.selection_label}</strong>
            </div>
            <div className="summary-card">
              <span>Quarter Weight</span>
              <strong>{result.quarter_weight_formula}</strong>
              <small>{result.quarter_weight_value.toFixed(6)}</small>
            </div>
            <div className="summary-card">
              <span>Clipboard</span>
              <strong>{result.copied_to_clipboard ? 'Copied' : 'Not copied'}</strong>
              <small>{result.formula_lines.length} formulas</small>
            </div>
          </div>

          <div className="formula-list">
            {result.formula_lines.map((line) => (
              <article key={line.index} className="formula-card">
                <header>
                  <span>#{line.index}</span>
                  <strong>{line.numeric_value.toFixed(6)}</strong>
                </header>
                <code>{line.formula}</code>
              </article>
            ))}
          </div>
        </>
      ) : (
        <p className="placeholder-text">Run “Calc Weights” to generate the copied formulas and the numeric weight breakdown.</p>
      )}
    </section>
  );
}
