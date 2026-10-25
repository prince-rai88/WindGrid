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
  '#2d6a4f', // Forest green (Day-Ahead locked run)
  '#0284c7', // Sky blue
  '#7c3aed', // Purple
  '#d97706', // Amber
  '#db2777', // Rose
  '#475569', // Slate
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
      {/* Header */}
      <div className="page-header">
        <div className="page-header-text">
          <h1>Intraday Forecast Runs</h1>
          <p>
            Retrospective analysis comparing how National Grid ESO forecast versions evolved prior to and following the 11:00 auction cutoff.
          </p>
        </div>

        <div className="meta-pill-group">
          <div className="meta-pill">
            <span>Runs Logged:</span>
            <strong>{data.publicationRunsCount} Runs</strong>
          </div>
          <div className="meta-pill">
            <span>Delivery:</span>
            <strong>{data.deliveryDate}</strong>
          </div>
        </div>
      </div>

      {/* Spacious Multi-Line Chart Panel */}
      <div className="chart-panel">
        <div className="chart-panel-header">
          <div className="chart-panel-title">
            <h2>Multi-Run Horizon Evolution vs Actual Outturn</h2>
            <p>Comparing forecast updates across publication horizons against delivered wind generation</p>
          </div>

          <div className="chart-legend">
            <span>
              <span className="legend-dot" style={{ background: '#0f172a' }} />
              Actual Outturn
            </span>
          </div>
        </div>

        {/* Minimal Run Toggle Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <span style={{ fontSize: '12px', color: '#64748b', alignSelf: 'center', marginRight: '4px' }}>
            Visible Runs:
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
                  background: isSelected ? 'rgba(0, 0, 0, 0.05)' : '#ffffff',
                  border: isSelected ? `1.5px solid ${color}` : '1px solid rgba(0, 0, 0, 0.08)',
                  borderRadius: '9999px',
                  padding: '4px 12px',
                  fontSize: '12px',
                  fontWeight: isSelected ? 600 : 400,
                  color: isSelected ? '#0f172a' : '#64748b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: isSelected ? color : '#cbd5e1',
                  }}
                />
                <span>{r.publishTimeUtc.slice(11, 16)} UTC</span>
                {isPreCutoff && (
                  <span style={{ fontSize: '10px', color: '#2d6a4f', fontWeight: 600 }}>
                    [Day-Ahead]
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div style={{ width: '100%', height: 340 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 0, 0, 0.04)" />
              <XAxis
                dataKey="localTime"
                stroke="#94a3b8"
                tick={{ fill: '#64748b', fontSize: 11 }}
                interval={3}
                tickLine={false}
                axisLine={{ stroke: 'rgba(0, 0, 0, 0.08)' }}
              />
              <YAxis
                stroke="#94a3b8"
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                tickLine={false}
                axisLine={{ stroke: 'rgba(0, 0, 0, 0.08)' }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="apple-tooltip">
                        <div className="tooltip-title">
                          SP {d.settlementPeriod} • {d.localTimeDisplay}
                        </div>
                        <div className="tooltip-row">
                          <span style={{ color: '#0f172a', fontWeight: 600 }}>Actual Outturn:</span>
                          <strong className="tabular">{d.actualGeneration?.toLocaleString() ?? '—'} MW</strong>
                        </div>
                        {selectedRuns.map((pubUtc) => {
                          const val = d[pubUtc];
                          const runIdx = runs.findIndex((r) => r.publishTimeUtc === pubUtc);
                          const color = RUN_PALETTE[runIdx % RUN_PALETTE.length];
                          return (
                            <div key={pubUtc} className="tooltip-row" style={{ fontSize: '11px' }}>
                              <span style={{ color }}>{pubUtc.slice(11, 16)} UTC:</span>
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
              {/* Actual Outturn Line */}
              <Line
                type="monotone"
                dataKey="actualGeneration"
                stroke="#0f172a"
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
