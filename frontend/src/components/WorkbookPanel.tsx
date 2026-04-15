import type { WorkbookSnapshotResponse } from '../lib/types';

type WorkbookPanelProps = {
  workbook: WorkbookSnapshotResponse | null;
};

export function WorkbookPanel({ workbook }: WorkbookPanelProps) {
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Workbook</p>
          <h2>Active Excel context</h2>
        </div>
      </div>

      {workbook ? (
        <>
          <dl className="meta-grid">
            <div>
              <dt>Workbook</dt>
              <dd>{workbook.workbook_path}</dd>
            </div>
            <div>
              <dt>Sheet</dt>
              <dd>{workbook.sheet_name}</dd>
            </div>
            <div>
              <dt>Anchor Cell</dt>
              <dd>{workbook.anchor_cell}</dd>
            </div>
          </dl>

          <div className="table-shell">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Policy Start</th>
                  <th>Policy End</th>
                </tr>
              </thead>
              <tbody>
                {workbook.effective_date_ranges.map((range) => (
                  <tr key={`${range.index}-${range.start_date}`}>
                    <td>{String(range.index).padStart(2, '0')}</td>
                    <td>{range.start_date}</td>
                    <td>{range.end_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="placeholder-text">Open Excel, select the header column, then load the active sheet.</p>
      )}
    </section>
  );
}
