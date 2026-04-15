import type { InforceResponse } from '../lib/types';

type InforcePanelProps = {
  result: InforceResponse | null;
};

export function InforcePanel({ result }: InforcePanelProps) {
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Dates</p>
          <h2>In-force effective dates</h2>
        </div>
      </div>

      {result ? (
        <>
          <p className="selection-pill">{result.selection_label}</p>
          <ol className="list-panel">
            {result.inforce_dates.map((item) => (
              <li key={`${item.index}-${item.label}`}>
                <span className="list-index">{String(item.index).padStart(2, '0')}</span>
                <span>{item.label}</span>
              </li>
            ))}
          </ol>
        </>
      ) : (
        <p className="placeholder-text">Run “Calc Dates” to review the in-force date window for the selected quarter.</p>
      )}
    </section>
  );
}
