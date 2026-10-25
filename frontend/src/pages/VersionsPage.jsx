import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { History, Eye, ShieldCheck, AlertCircle } from 'lucide-react';

const RUN_COLORS = [
  '#0ea5e9', // Day-ahead / early
  '#f59e0b', // Afternoon
  '#a855f7', // Evening
  '#ec4899', // Late night
  '#06b6d4',
  '#84cc16',
];

export const VersionsPage = ({ data, actualRecords = [] }) => {
  if (!data) return null;

  const runs = data.runs || [];
  const [selectedRuns, setSelectedRuns] = useState(() =>
    runs.slice(0, 4).map((r) => r.publishTimeUtc)
  );

  const toggleRun = (pubUtc) => {
    setSelectedRuns((prev) =>
      prev.includes(pubUtc)
        ? prev.filter((p) => p !== pubUtc)
        : [...prev, pubUtc]
    );
  };

  // Build combined dataset for chart: 48 intervals
  const chartData = actualRecords.map((rec) => {
    const pt = {
      settlementPeriod: rec.settlementPeriod,
      localTime: rec.localTime,
      localTimeDisplay: rec.localTimeDisplay,
      startTime: rec.startTime,
      actualGeneration: rec.actualGeneration,
    };
    runs.forEach((r) => {
      pt[r.publishTimeUtc] = r.forecasts[rec.startTime] ?? null;
    });
    return pt;
  });

  return (
    <div>
      {/* Banner */}
      <div className="context-banner">
        <div className="context-banner-left">
          <div className="context-banner-icon">
            <History size={20} />
          </div>
          <div className="context-banner-text">
            <h3>Retrospective Intraday Forecast Version Comparison</h3>
            <p>
              Inspect how wind forecasts evolved across different publication runs issued on decision date {data.decisionDate} for delivery on {data.deliveryDate}.
            </p>
          </div>
        </div>

        <div className="context-pills">
          <div className="pill">
            <ShieldCheck size={13} color="#10b981" />
            <span>Runs Published:</span>
            <strong className="mono">{data.publicationRunsCount} Runs</strong>
          </div>
        </div>
      </div>

      {/* Notice */}
      <div className="notice-box" style={{ marginBottom: '20px' }}>
        <strong>Strict Anti-Look-Ahead Rule:</strong> Forecast runs published after the 11:00 London gate closure cutoff are displayed here strictly for retrospective evaluation. They are NEVER used to evaluate day-ahead auction performance.
      </div>

      {/* Run Selector Chips */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <span style={{ fontSize: '0.78rem', color: '#94a3b8', alignSelf: 'center' }}>
          Select Runs to Display:
        </span>
        {runs.map((r, idx) => {
          const isSelected = selectedRuns.includes(r.publishTimeUtc);
          const color = RUN_COLORS[idx % RUN_COLORS.length];
          const isPreCutoff = r.publishTimeUtc.includes('T02:') || r.publishTimeUtc.includes('T04:') || r.publishTimeUtc.includes('T07:') || r.publishTimeUtc.includes('T09:');

          return (
            <button
              key={r.publishTimeUtc}
              onClick={() => toggleRun(r.publishTimeUtc)}
              className="quick-date-btn"
              style={{
                borderColor: isSelected ? color : 'var(--border-subtle)',
                background: isSelected ? `${color}22` : 'var(--bg-surface-elevated)',
                color: isSelected ? color : 'var(--text-secondary)',
                fontWeight: isSelected ? 600 : 400,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: isSelected ? color : '#64748b',
                }}
              />
              <span>{r.publishTimeUtc.slice(11, 16)} UTC</span>
              {isPreCutoff && (
                <span style={{ fontSize: '0.65rem', background: 'rgba(16,185,129,0.2)', color: '#10b981', padding: '1px 4px', borderRadius: '3px' }}>
                  Day-Ahead
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Multi-Line Chart */}
      <div className="chart-card">
        <div className="chart-card-header">
          <div className="chart-title-area">
            <h2>Forecast Evolution vs Final Actual Generation</h2>
            <p>Comparing multi-version publication runs against actual delivered wind generation.</p>
          </div>

          <div className="chart-legend-custom">
            <div className="legend-item">
              <span className="legend-color-dot" style={{ background: '#10b981' }} />
              <span>Actual Generation (FUELHH)</span>
            </div>
          </div>
        </div>

        <div style={{ width: '100%', height: 360 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" />
              <XAxis
                dataKey="localTime"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                interval={3}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="custom-tooltip">
                        <div className="tooltip-time">
                          SP {d.settlementPeriod} • {d.localTimeDisplay}
                        </div>
                        <div className="tooltip-row">
                          <span style={{ color: '#10b981' }}>Actual Generation:</span>
                          <strong className="mono">{d.actualGeneration?.toLocaleString() ?? '—'} MW</strong>
                        </div>
                        {selectedRuns.map((pubUtc, idx) => {
                          const val = d[pubUtc];
                          const color = RUN_COLORS[runs.findIndex((r) => r.publishTimeUtc === pubUtc) % RUN_COLORS.length];
                          return (
                            <div key={pubUtc} className="tooltip-row" style={{ fontSize: '0.75rem' }}>
                              <span style={{ color }}>Run {pubUtc.slice(11, 16)} UTC:</span>
                              <span className="mono">{val !== null ? `${val.toLocaleString()} MW` : '—'}</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {/* Actual Generation Line */}
              <Line
                type="monotone"
                dataKey="actualGeneration"
                stroke="#10b981"
                strokeWidth={3}
                dot={false}
                name="Actual"
              />

              {/* Version Lines */}
              {selectedRuns.map((pubUtc) => {
                const runIdx = runs.findIndex((r) => r.publishTimeUtc === pubUtc);
                const color = RUN_COLORS[runIdx % RUN_COLORS.length];
                return (
                  <Line
                    key={pubUtc}
                    type="monotone"
                    dataKey={pubUtc}
                    stroke={color}
                    strokeWidth={1.8}
                    dot={false}
                    name={`Run ${pubUtc.slice(11, 16)} UTC`}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
