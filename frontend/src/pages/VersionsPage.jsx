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

const RUN_PALETTE = [
  '#111418', // Matte black
  '#0f766e', // Teal
  '#b45309', // Amber
  '#4338ca', // Indigo
  '#be123c', // Crimson
  '#64748b', // Slate
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Editorial Header */}
      <div className="editorial-header-block">
        <div className="editorial-header-left">
          <span className="editorial-index-label">04 // Intraday Run Evolution</span>
          <h2 className="editorial-title">Forecast Version Progression</h2>
          <p className="editorial-sub">
            Tracking how National Grid ESO forecast versions updated chronologically relative to the 11:00 AM auction cutoff.
          </p>
        </div>

        <div className="editorial-meta-box">
          <span>LOGGED: <strong>{data.publicationRunsCount} Runs</strong></span>
          <span>•</span>
          <span>DELIVERY: <strong>{data.deliveryDate}</strong></span>
        </div>
      </div>

      {/* Main Glass Chart Card */}
      <div className="chart-glass-card">
        <div className="chart-card-header">
          <div>
            <h3 className="chart-heading-title">Multi-Run Horizon vs Actual Outturn</h3>
            <p className="chart-heading-sub">Comparing forecast version updates against delivered generation (MW)</p>
          </div>

          <div className="chart-legend-editorial">
            <span>
              <span className="legend-indicator" style={{ background: '#0f766e' }} />
              Actual Output
            </span>
          </div>
        </div>

        {/* Toggle Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7280', alignSelf: 'center', marginRight: '6px' }}>
            Toggle Runs:
          </span>
          {runs.map((r, idx) => {
            const isSelected = selectedRuns.includes(r.publishTimeUtc);
            const color = RUN_PALETTE[idx % RUN_PALETTE.length];
            const isPreCutoff =
              r.publishTimeUtc.includes('T02:') ||
              r.publishTimeUtc.includes('T04:') ||
              r.publishTimeUtc.includes('T07:') ||
              r.publishTimeUtc.includes('T09:');

            return (
              <button
                key={r.publishTimeUtc}
                onClick={() => toggleRun(r.publishTimeUtc)}
                style={{
                  background: isSelected ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.35)',
                  border: isSelected ? `2px solid ${color}` : '1px solid rgba(255, 255, 255, 0.65)',
                  borderRadius: '9999px',
                  padding: '4px 12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-helvetica)',
                  color: isSelected ? color : '#6b7280',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: isSelected ? color : '#9ca3af',
                  }}
                />
                <span className="mono">{r.publishTimeUtc.slice(11, 16)} UTC</span>
                {isPreCutoff && (
                  <span style={{ fontSize: '9px', color: '#0f766e', fontWeight: 800 }}>
                    [D-1]
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div style={{ width: '100%', height: 340 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(15, 23, 42, 0.06)" />
              <XAxis
                dataKey="localTime"
                stroke="#9ca3af"
                tick={{ fill: '#4b5563', fontSize: 11, fontFamily: 'var(--font-helvetica)' }}
                interval={3}
                tickLine={false}
                axisLine={{ stroke: 'rgba(15, 23, 42, 0.12)' }}
              />
              <YAxis
                stroke="#9ca3af"
                tick={{ fill: '#4b5563', fontSize: 11, fontFamily: 'var(--font-helvetica)' }}
                tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                tickLine={false}
                axisLine={{ stroke: 'rgba(15, 23, 42, 0.12)' }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="glass-editorial-tooltip">
                        <div className="tooltip-top-label">
                          SP {d.settlementPeriod} • {d.localTimeDisplay}
                        </div>
                        <div className="tooltip-row-item">
                          <span style={{ color: '#0f766e', fontWeight: 600 }}>Actual Output:</span>
                          <strong className="tabular">{d.actualGeneration?.toLocaleString() ?? '—'} MW</strong>
                        </div>
                        {selectedRuns.map((pubUtc) => {
                          const val = d[pubUtc];
                          const runIdx = runs.findIndex((r) => r.publishTimeUtc === pubUtc);
                          const color = RUN_PALETTE[runIdx % RUN_PALETTE.length];
                          return (
                            <div key={pubUtc} className="tooltip-row-item" style={{ fontSize: '11px' }}>
                              <span style={{ color }}>Run {pubUtc.slice(11, 16)} UTC:</span>
                              <span className="tabular">{val !== null ? `${val.toLocaleString()} MW` : '—'}</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {/* Actual Output Line */}
              <Line
                type="monotone"
                dataKey="actualGeneration"
                stroke="#0f766e"
                strokeWidth={2.4}
                dot={false}
                name="Actual"
              />

              {/* Version Lines */}
              {selectedRuns.map((pubUtc) => {
                const runIdx = runs.findIndex((r) => r.publishTimeUtc === pubUtc);
                const color = RUN_PALETTE[runIdx % RUN_PALETTE.length];
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
