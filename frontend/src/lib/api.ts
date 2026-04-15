import type {
  AppOptionsResponse,
  InforceResponse,
  QuarterRequest,
  WeightResponse,
  WorkbookSnapshotResponse,
} from './types';

async function requestJson<T>(url: string, payload?: QuarterRequest): Promise<T> {
  const response = await fetch(url, {
    method: payload ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    body: payload ? JSON.stringify(payload) : undefined,
  });

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new Error(errorPayload?.detail ?? `Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export const api = {
  getOptions: () => requestJson<AppOptionsResponse>('/api/options'),
  inspectWorkbook: (payload: QuarterRequest) =>
    requestJson<WorkbookSnapshotResponse>('/api/workbook/inspect', payload),
  getInforceDates: (payload: QuarterRequest) => requestJson<InforceResponse>('/api/inforce', payload),
  getWeights: (payload: QuarterRequest) => requestJson<WeightResponse>('/api/weights', payload),
};
