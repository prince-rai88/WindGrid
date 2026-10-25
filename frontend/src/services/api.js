/**
 * API client service for WindGrid backend.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || (
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:8000/api'
    : '/api'
);

async function handleResponse(res) {
  if (!res.ok) {
    let errorMsg = `API Error ${res.status}: ${res.statusText}`;
    try {
      const errorJson = await res.json();
      if (errorJson.error) {
        errorMsg = errorJson.error;
      }
    } catch {
      // Keep default error text
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export const api = {
  async getOverview(decisionDate, cutoffTime = '11:00') {
    const url = `${API_BASE}/overview/?decision_date=${encodeURIComponent(decisionDate)}&cutoff_time=${encodeURIComponent(cutoffTime)}`;
    const res = await fetch(url);
    return handleResponse(res);
  },

  async getAccuracy(decisionDate, cutoffTime = '11:00') {
    const url = `${API_BASE}/accuracy/?decision_date=${encodeURIComponent(decisionDate)}&cutoff_time=${encodeURIComponent(cutoffTime)}`;
    const res = await fetch(url);
    return handleResponse(res);
  },

  async getHistory(startDate = '2026-01-01', endDate = '2026-01-31', cutoffTime = '11:00') {
    const url = `${API_BASE}/history/?start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}&cutoff_time=${encodeURIComponent(cutoffTime)}`;
    const res = await fetch(url);
    return handleResponse(res);
  },

  async getForecastVersions(decisionDate) {
    const url = `${API_BASE}/forecast-versions/?decision_date=${encodeURIComponent(decisionDate)}`;
    const res = await fetch(url);
    return handleResponse(res);
  },
};
