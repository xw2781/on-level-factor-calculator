import { useEffect, useMemo, useState } from 'react';
import type { AppOptionsResponse, QuarterRequest } from '../lib/types';

type ControlPanelProps = {
  options: AppOptionsResponse | null;
  selection: QuarterRequest;
  isBusy: boolean;
  onSelectionChange: (nextSelection: QuarterRequest) => void;
  onInspect: (selection: QuarterRequest) => void;
  onInforce: (selection: QuarterRequest) => void;
  onWeights: (selection: QuarterRequest) => void;
  onTogglePlot: () => void;
  hasPlot: boolean;
};

type FieldKey = 'year' | 'quarter' | 'policy_term_months';

type DraftState = Record<FieldKey, string>;
type ErrorState = Record<FieldKey, string | null>;

type Suggestion = {
  value: string;
};

type ValidationResult<T extends number> =
  | { ok: true; value: T; display: string }
  | { ok: false; error: string };

const emptyErrors: ErrorState = {
  year: null,
  quarter: null,
  policy_term_months: null,
};

function draftStateFromSelection(selection: QuarterRequest): DraftState {
  return {
    year: String(selection.year),
    quarter: `Q${selection.quarter}`,
    policy_term_months: `${selection.policy_term_months} months`,
  };
}

function normalizeFilterValue(value: string): string {
  return value.trim().toLowerCase();
}

function validateYear(value: string): ValidationResult<number> {
  const trimmedValue = value.trim();
  if (!/^\d{4}$/.test(trimmedValue)) {
    return { ok: false, error: 'Enter a 4-digit year between 2000 and 2100.' };
  }

  const year = Number(trimmedValue);
  if (year < 2000 || year > 2100) {
    return { ok: false, error: 'Year must stay between 2000 and 2100.' };
  }

  return { ok: true, value: year, display: trimmedValue };
}

function validateQuarter(value: string): ValidationResult<1 | 2 | 3 | 4> {
  const normalizedValue = value.trim().toUpperCase().replace(/\s+/g, '');
  if (!/^Q?[1-4]$/.test(normalizedValue)) {
    return { ok: false, error: 'Use Q1, Q2, Q3, Q4 or the numbers 1-4.' };
  }

  const quarter = Number(normalizedValue.replace('Q', '')) as 1 | 2 | 3 | 4;
  return { ok: true, value: quarter, display: `Q${quarter}` };
}

function validatePolicyTerm(value: string): ValidationResult<6 | 12> {
  const normalizedValue = value.trim().toLowerCase().replace(/\./g, '');
  const match = normalizedValue.match(/^(\d+)(?:\s*(?:mo|mon|mons|month|months|policy)?)?$/);
  if (!match) {
    return { ok: false, error: 'Use 6 or 12 months.' };
  }

  const policyTermMonths = Number(match[1]);
  if (policyTermMonths !== 6 && policyTermMonths !== 12) {
    return { ok: false, error: 'Policy term must be 6 or 12 months.' };
  }

  return {
    ok: true,
    value: policyTermMonths,
    display: `${policyTermMonths} months`,
  };
}

function buildSelection(
  yearResult: ValidationResult<number>,
  quarterResult: ValidationResult<1 | 2 | 3 | 4>,
  policyTermResult: ValidationResult<6 | 12>,
): QuarterRequest | null {
  if (!yearResult.ok || !quarterResult.ok || !policyTermResult.ok) {
    return null;
  }

  return {
    year: yearResult.value,
    quarter: quarterResult.value,
    policy_term_months: policyTermResult.value,
  };
}

function filterSuggestions(suggestions: Suggestion[], draftValue: string): Suggestion[] {
  const normalizedDraft = normalizeFilterValue(draftValue);
  if (!normalizedDraft) {
    return suggestions;
  }

  return suggestions.filter((suggestion) => {
    const normalizedValue = normalizeFilterValue(suggestion.value);
    return normalizedValue.includes(normalizedDraft);
  });
}

type EditableComboFieldProps = {
  label: string;
  value: string;
  error: string | null;
  isOpen: boolean;
  suggestions: Suggestion[];
  placeholder: string;
  editable?: boolean;
  onChange: (nextValue: string) => void;
  onCommit: () => void;
  onOpen: () => void;
  onClose: () => void;
  onSelectSuggestion: (nextValue: string) => void;
};

function EditableComboField({
  label,
  value,
  error,
  isOpen,
  suggestions,
  placeholder,
  editable = true,
  onChange,
  onCommit,
  onOpen,
  onClose,
  onSelectSuggestion,
}: EditableComboFieldProps) {
  return (
    <label className={`field combo-field ${error ? 'field-invalid' : ''}`}>
      <span>{label}</span>
      <div
        className={`combo-shell ${isOpen ? 'combo-shell-open' : ''}`}
        onBlur={(event) => {
          const nextTarget = event.relatedTarget;
          if (!nextTarget || !event.currentTarget.contains(nextTarget)) {
            onCommit();
            onClose();
          }
        }}
      >
        {editable ? (
          <input
            className="combo-input"
            type="text"
            value={value}
            placeholder={placeholder}
            aria-invalid={Boolean(error)}
            aria-expanded={isOpen}
            onFocus={onOpen}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                onCommit();
                onClose();
              }

              if (event.key === 'Escape') {
                event.preventDefault();
                onClose();
              }
            }}
          />
        ) : (
          <button
            className="combo-display"
            type="button"
            aria-invalid={Boolean(error)}
            aria-expanded={isOpen}
            onClick={onOpen}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault();
                onClose();
              }
            }}
          >
            {value || placeholder}
          </button>
        )}
        <button
          className="combo-toggle"
          type="button"
          aria-label={`Toggle ${label} suggestions`}
          onClick={() => {
            if (isOpen) {
              onClose();
            } else {
              onOpen();
            }
          }}
        >
          <span className="combo-toggle-chevron" />
        </button>

        {isOpen ? (
          <div className="combo-menu">
            {suggestions.length ? (
              suggestions.map((suggestion) => (
                <button
                  key={`${label}-${suggestion.value}`}
                  className="combo-option"
                  type="button"
                  onClick={() => onSelectSuggestion(suggestion.value)}
                >
                  <strong>{suggestion.value}</strong>
                </button>
              ))
            ) : (
              <div className="combo-empty">No preset match. Custom values are still allowed.</div>
            )}
          </div>
        ) : null}
      </div>
      {error ? <small className="field-error">{error}</small> : null}
    </label>
  );
}

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
  const [drafts, setDrafts] = useState<DraftState>(() => draftStateFromSelection(selection));
  const [errors, setErrors] = useState<ErrorState>(emptyErrors);
  const [openField, setOpenField] = useState<FieldKey | null>(null);

  useEffect(() => {
    setDrafts(draftStateFromSelection(selection));
    setErrors(emptyErrors);
  }, [selection]);

  const yearSuggestions = useMemo<Suggestion[]>(
    () =>
      (options?.years ?? [])
        .slice(0, 5)
        .map((year) => ({ value: String(year) })),
    [options],
  );
  const quarterSuggestions = useMemo<Suggestion[]>(
    () =>
      (options?.quarters ?? []).map((quarter) => ({
        value: quarter.label,
      })),
    [options],
  );
  const policyTermSuggestions = useMemo<Suggestion[]>(
    () =>
      (options?.policy_terms ?? []).map((term) => ({
        value: `${term.value} months`,
      })),
    [options],
  );

  function updateDraft(field: FieldKey, nextValue: string) {
    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [field]: nextValue,
    }));
    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: null,
    }));
  }

  function commitField(field: FieldKey, draftOverride?: string): QuarterRequest | null {
    const fieldDraftValue = draftOverride ?? drafts[field];
    const yearResult =
      field === 'year' ? validateYear(fieldDraftValue) : validateYear(String(selection.year));
    const quarterResult =
      field === 'quarter'
        ? validateQuarter(fieldDraftValue)
        : validateQuarter(`Q${selection.quarter}`);
    const policyTermResult =
      field === 'policy_term_months'
        ? validatePolicyTerm(fieldDraftValue)
        : validatePolicyTerm(String(selection.policy_term_months));

    const fieldError =
      field === 'year'
        ? yearResult.ok
          ? null
          : yearResult.error
        : field === 'quarter'
          ? quarterResult.ok
            ? null
            : quarterResult.error
          : policyTermResult.ok
            ? null
            : policyTermResult.error;

    if (fieldError) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        [field]: fieldError,
      }));
      return null;
    }

    const nextSelection = buildSelection(yearResult, quarterResult, policyTermResult);
    if (!nextSelection || !yearResult.ok || !quarterResult.ok || !policyTermResult.ok) {
      return null;
    }

    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      year: field === 'year' ? yearResult.display : currentDrafts.year,
      quarter: field === 'quarter' ? quarterResult.display : currentDrafts.quarter,
      policy_term_months:
        field === 'policy_term_months' ? policyTermResult.display : currentDrafts.policy_term_months,
    }));
    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: null,
    }));

    if (
      nextSelection.year !== selection.year ||
      nextSelection.quarter !== selection.quarter ||
      nextSelection.policy_term_months !== selection.policy_term_months
    ) {
      onSelectionChange(nextSelection);
    }

    return nextSelection;
  }

  function commitAllFields(): QuarterRequest | null {
    const yearResult = validateYear(drafts.year);
    const quarterResult = validateQuarter(drafts.quarter);
    const policyTermResult = validatePolicyTerm(drafts.policy_term_months);

    const nextErrors: ErrorState = {
      year: yearResult.ok ? null : yearResult.error,
      quarter: quarterResult.ok ? null : quarterResult.error,
      policy_term_months: policyTermResult.ok ? null : policyTermResult.error,
    };

    setErrors(nextErrors);

    const nextSelection = buildSelection(yearResult, quarterResult, policyTermResult);
    if (!nextSelection || !yearResult.ok || !quarterResult.ok || !policyTermResult.ok) {
      return null;
    }

    setDrafts({
      year: yearResult.display,
      quarter: quarterResult.display,
      policy_term_months: policyTermResult.display,
    });

    if (
      nextSelection.year !== selection.year ||
      nextSelection.quarter !== selection.quarter ||
      nextSelection.policy_term_months !== selection.policy_term_months
    ) {
      onSelectionChange(nextSelection);
    }

    return nextSelection;
  }

  function runValidatedAction(action: (nextSelection: QuarterRequest) => void) {
    const nextSelection = commitAllFields();
    if (!nextSelection) {
      return;
    }

    action(nextSelection);
  }

  return (
    <section className="panel controls-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Controls</p>
          <h2>Select the quarter and policy term for evaluation: </h2>
        </div>
      </div>

      <div className="control-grid">
        <EditableComboField
          label="Year"
          value={drafts.year}
          error={errors.year}
          isOpen={openField === 'year'}
          suggestions={yearSuggestions}
          placeholder="2026"
          onChange={(nextValue) => updateDraft('year', nextValue)}
          onCommit={() => {
            commitField('year');
          }}
          onOpen={() => setOpenField('year')}
          onClose={() => setOpenField((currentField) => (currentField === 'year' ? null : currentField))}
          onSelectSuggestion={(nextValue) => {
            updateDraft('year', nextValue);
            setOpenField(null);
            commitField('year', nextValue);
          }}
        />

        <EditableComboField
          label="Quarter"
          value={drafts.quarter}
          error={errors.quarter}
          isOpen={openField === 'quarter'}
          suggestions={quarterSuggestions}
          placeholder="Q1"
          editable={false}
          onChange={(nextValue) => updateDraft('quarter', nextValue)}
          onCommit={() => {
            commitField('quarter');
          }}
          onOpen={() => setOpenField('quarter')}
          onClose={() =>
            setOpenField((currentField) => (currentField === 'quarter' ? null : currentField))
          }
          onSelectSuggestion={(nextValue) => {
            updateDraft('quarter', nextValue);
            setOpenField(null);
            commitField('quarter', nextValue);
          }}
        />

        <EditableComboField
          label="Policy Term"
          value={drafts.policy_term_months}
          error={errors.policy_term_months}
          isOpen={openField === 'policy_term_months'}
          suggestions={policyTermSuggestions}
          placeholder="12 months"
          editable={false}
          onChange={(nextValue) => updateDraft('policy_term_months', nextValue)}
          onCommit={() => {
            commitField('policy_term_months');
          }}
          onOpen={() => setOpenField('policy_term_months')}
          onClose={() =>
            setOpenField((currentField) =>
              currentField === 'policy_term_months' ? null : currentField,
            )
          }
          onSelectSuggestion={(nextValue) => {
            updateDraft('policy_term_months', nextValue);
            setOpenField(null);
            commitField('policy_term_months', nextValue);
          }}
        />
      </div>

      <div className="button-row">
        <button
          className="primary-button"
          type="button"
          disabled={isBusy}
          onClick={() => runValidatedAction(onInspect)}
        >
          Load Sheet
        </button>
        <button
          className="secondary-button"
          type="button"
          disabled={isBusy}
          onClick={() => runValidatedAction(onInforce)}
        >
          Calc Dates
        </button>
        <button
          className="secondary-button"
          type="button"
          disabled={isBusy}
          onClick={() => runValidatedAction(onWeights)}
        >
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
