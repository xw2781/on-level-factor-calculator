import { useEffect, useState } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { InforcePanel } from './components/InforcePanel';
import { PlotPanel } from './components/PlotPanel';
import { WeightsPanel } from './components/WeightsPanel';
import { WorkbookPanel } from './components/WorkbookPanel';
import { api } from './lib/api';
import type {
  AppOptionsResponse,
  InforceResponse,
  QuarterRequest,
  WeightResponse,
  WorkbookSnapshotResponse,
} from './lib/types';

const defaultSelection: QuarterRequest = {
  year: new Date().getFullYear(),
  quarter: 1,
  policy_term_months: 12,
};

export default function App() {
  const [options, setOptions] = useState<AppOptionsResponse | null>(null);
  const [selection, setSelection] = useState<QuarterRequest>(defaultSelection);
  const [workbook, setWorkbook] = useState<WorkbookSnapshotResponse | null>(null);
  const [inforceResult, setInforceResult] = useState<InforceResponse | null>(null);
  const [weightResult, setWeightResult] = useState<WeightResponse | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('Connect to an active Excel workbook to begin.');
  const [showPlot, setShowPlot] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const payload = await api.getOptions();
        setOptions(payload);
        setSelection((currentSelection) => ({
          ...currentSelection,
          year: payload.years[0] ?? currentSelection.year,
        }));
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load app options.');
      }
    })();
  }, []);

  async function runRequest(action: () => Promise<void>) {
    setIsBusy(true);
    setErrorMessage(null);
    try {
      await action();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'The request failed.');
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="app-shell">
      <div className="page-chrome" />
      <header className="hero">
        <div>
          <p className="eyebrow">OLEP Calculator</p>
          <h1>Modern desktop UI, same Excel calculation core.</h1>
          <p className="hero-copy">
            This build keeps the original quarter-weight logic in Python while moving the desktop
            experience into a lighter React interface.
          </p>
        </div>
        <div className="hero-status">
          <span className="status-label">Status</span>
          <strong>{isBusy ? 'Working…' : 'Ready'}</strong>
          <p>{statusMessage}</p>
        </div>
      </header>

      <ControlPanel
        options={options}
        selection={selection}
        isBusy={isBusy}
        onSelectionChange={setSelection}
        onInspect={() =>
          void runRequest(async () => {
            const payload = await api.inspectWorkbook(selection);
            setWorkbook(payload);
            setStatusMessage(`Loaded ${payload.sheet_name} from the active Excel workbook.`);
          })
        }
        onInforce={() =>
          void runRequest(async () => {
            const payload = await api.getInforceDates(selection);
            setInforceResult(payload);
            setStatusMessage(`Calculated in-force dates for ${payload.selection_label}.`);
          })
        }
        onWeights={() =>
          void runRequest(async () => {
            const payload = await api.getWeights(selection);
            setWeightResult(payload);
            setShowPlot(true);
            setStatusMessage(
              payload.copied_to_clipboard
                ? 'Calculated quarter formulas and copied them to the clipboard.'
                : 'Calculated quarter formulas.'
            );
          })
        }
        onTogglePlot={() => setShowPlot((currentValue) => !currentValue)}
        hasPlot={Boolean(weightResult)}
      />

      {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}

      <main className="content-grid">
        <WorkbookPanel workbook={workbook} />
        <InforcePanel result={inforceResult} />
        <WeightsPanel result={weightResult} />
        <PlotPanel result={weightResult} visible={showPlot} />
      </main>
    </div>
  );
}
