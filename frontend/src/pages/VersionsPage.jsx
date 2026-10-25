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

const RUN_JEWEL_PALETTE = [
  '#0284c7', // Electric Cyan (Day-Ahead locked run)
  '#059669', // Emerald
  '#d97706', // Amber
  '#7c3aed', // Purple
  '#db2777', // Magenta
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
      {/* Header */}
      <div className="page-intro">
        <div className="page-title-wrap">
          <h1>Intraday Forecast Runs</h1>
          <p>
            Retrospective analysis comparing how National Grid ESO forecast versions evolved prior to and following the 11:00 auction cutoff.
          </p>
        </div>

        <div className="jewel-pill-row">
          <div className="jewel-pill">
            <span style={{ color: '#0284c7' }}>●</span>
            <span>Runs Logged:</span>
            <strong>{data.publicationRunsCount} Runs</strong>
          </div>
          <div className="jewel-pill">
            <span style={{ color: '#059669' }}>●</span>
            <span>Delivery:</span>
            <strong>{data.deliveryDate}</strong>
          </div>
        </div>
      </div>

      {/* Spacious Multi-Line Chart Panel */}
      <div className="glass-panel-rich">
        <div className="glass-panel-header">
          <div className="panel-heading-rich">
            <h2>Multi-Run Horizon Evolution vs Actual Outturn</h2>
            <p>Comparing forecast updates across publication horizons against delivered wind generation (MW)</p>
          </div>

          <div className="legend-rich-row">
            <span style={{ color: '#0f172a' }}>
              <span className="legend-dot-rich" style={{ background: '#0f172a' }} />
              Actual Outturn (FUELHH)
            </span>
          </div>
        </div>

        {/* Minimal Run Toggle Pills with Jewel Accents */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '22px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', alignSelf: 'center', marginRight: '6px' }}>
            Toggle Horizon Runs:
          </span>
          {runs.map((r, idx) => {
            const isSelected = selectedRuns.includes(r.publishTimeUtc);
            const color = RUN_JEWEL_PALETTE[idx % RUN_JEWEL_PALETTE.length];
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
                  background: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
                  border: isSelected ? `2px solid ${color}` : '1px solid rgba(203, 213, 225, 0.7)',
                  borderRadius: '9999px',
                  padding: '5px 14px',
                  fontSize: '12px',
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected ? color : '#64748b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: isSelected ? `0 4px 12px ${color}22` : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: isSelected ? color : '#cbd5e1',
                  }}
                />
                <span>{r.publishTimeUtc.slice(11, 16)} UTC</span>
                {isPreCutoff && (
                  <span style={{ fontSize: '10px', color: '#059669', fontWeight: 700 }}>
                    [Day-Ahead]
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div style={{ width: '100%', height: 350 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
              <XAxis
                dataKey="localTime"
                stroke="#94a3b8"
                tick={{ fill: '#64748b', fontSize: 11 }}
                interval={3}
                tickLine={false}
                axisLine={{ stroke: 'rgba(203, 213, 225, 0.6)' }}
              />
              <YAxis
                stroke="#94a3b8"
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                tickLine={false}
                axisLine={{ stroke: 'rgba(203, 213, 225, 0.6)' }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="glass-tooltip-rich">
                        <div className="tooltip-time-rich">
                          SP {d.settlementPeriod} • {d.localTimeDisplay} London
                        </div>
                        <div className="tooltip-val-row">
                          <span style={{ color: '#0f172a', fontWeight: 700 }}>Actual Outturn:</span>
                          <strong className="tabular">{d.actualGeneration?.toLocaleString() ?? '—'} MW</strong>
                        </div>
                        {selectedRuns.map((pubUtc) => {
                          const val = d[pubUtc];
                          const runIdx = runs.findIndex((r) => r.publishTimeUtc === pubUtc);
                          const color = RUN_JEWEL_PALETTE[runIdx % RUN_JEWEL_PALETTE.length];
                          return (
                            <div key={pubUtc} className="tooltip-val-row" style={{ fontSize: '11px' }}>
                              <span style={{ color, fontWeight: 600 }}>{pubUtc.slice(11, 16)} UTC:</span>
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
                strokeWidth={2.8}
                dot={false}
                name="Actual"
              />

              {/* Version Lines */}
              {selectedRuns.map((pubUtc) => {
                const runIdx = runs.findIndex((r) => r.publishTimeUtc === pubUtc);
                const color = RUN_JEWEL_PALETTE[runIdx % RUN_JEWEL_PALETTE.length];
                return (
                  <Line
                    key={pubUtc}
                    type="monotone"
                    dataKey={pubUtc}
                    stroke={color}
                    strokeWidth={2}
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
