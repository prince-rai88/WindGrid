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

const RUN_COLORS = [
  '#388bfd', // Blue
  '#d29922', // Amber
  '#a371f7', // Purple
  '#f778ba', // Pink
  '#38bdf8', // Cyan
  '#7ee787', // Light green
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Ticker */}
      <div className="trading-ticker">
        <div className="ticker-group">
          <div className="ticker-item">
            <span className="ticker-label">DECISION DATE:</span>
            <span className="ticker-val">{data.decisionDate}</span>
          </div>
          <div className="ticker-item">
            <span className="ticker-label">DELIVERY DATE:</span>
            <span className="ticker-val accent-blue">{data.deliveryDate}</span>
          </div>
          <div className="ticker-item">
            <span className="ticker-label">PUBLICATION RUNS LOGGED:</span>
            <span className="ticker-val tabular">{data.publicationRunsCount} RUNS</span>
          </div>
        </div>

        <div className="ticker-group">
          <span style={{ color: '#8b949e', fontSize: '10px' }}>
            NOTE: RUNS AFTER 11:00 LONDON DISPLAYED EXCLUSIVELY FOR RETROSPECTIVE UNCERTAINTY ANALYSIS
          </span>
        </div>
      </div>

      {/* Main Panel */}
      <div className="trading-panel">
        <div className="trading-panel-header">
          <span className="panel-title">
            INTRADAY FORECAST RUN HORIZON EVOLUTION VS OUTTURN ACTUAL (MW)
          </span>
          <div className="panel-tools">
            <span style={{ color: '#3fb950', fontWeight: 600 }}>● OUTTURN ACTUAL</span>
            <span style={{ color: '#6e7681' }}>|</span>
            <span style={{ color: '#8b949e', fontSize: '10px' }}>SELECT RUNS BELOW</span>
          </div>
        </div>

        {/* Run Selector Chips */}
        <div style={{ padding: '8px 12px', background: '#11151c', borderBottom: '1px solid #21262d', display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ color: '#6e7681', fontSize: '10px', textTransform: 'uppercase', marginRight: '4px' }}>
            TOGGLE RUN:
          </span>
          {runs.map((r, idx) => {
            const isSelected = selectedRuns.includes(r.publishTimeUtc);
            const color = RUN_COLORS[idx % RUN_COLORS.length];
            const isPreCutoff = r.publishTimeUtc.includes('T02:') || r.publishTimeUtc.includes('T04:') || r.publishTimeUtc.includes('T07:') || r.publishTimeUtc.includes('T09:');

            return (
              <button
                key={r.publishTimeUtc}
                onClick={() => toggleRun(r.publishTimeUtc)}
                className="quick-btn"
                style={{
                  borderColor: isSelected ? color : '#30363d',
                  background: isSelected ? `${color}22` : '#161b22',
                  color: isSelected ? color : '#8b949e',
                  fontWeight: isSelected ? 600 : 400,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '3px 8px',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: isSelected ? color : '#6e7681',
                  }}
                />
                <span>{r.publishTimeUtc.slice(11, 16)} UTC</span>
                {isPreCutoff && (
                  <span style={{ fontSize: '9px', color: '#58a6ff', opacity: 0.9 }}>
                    [DA]
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="chart-body" style={{ height: 340 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
              <XAxis
                dataKey="localTime"
                stroke="#484f58"
                tick={{ fill: '#8b949e', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                interval={3}
              />
              <YAxis
                stroke="#484f58"
                tick={{ fill: '#8b949e', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="terminal-tooltip">
                        <div className="tooltip-header">
                          SP {d.settlementPeriod} • {d.localTimeDisplay} London
                        </div>
                        <div className="tooltip-entry">
                          <span style={{ color: '#3fb950' }}>ACTUAL:</span>
                          <strong className="tabular" style={{ color: '#3fb950' }}>
                            {d.actualGeneration?.toLocaleString() ?? '—'} MW
                          </strong>
                        </div>
                        {selectedRuns.map((pubUtc) => {
                          const val = d[pubUtc];
                          const runIdx = runs.findIndex((r) => r.publishTimeUtc === pubUtc);
                          const color = RUN_COLORS[runIdx % RUN_COLORS.length];
                          return (
                            <div key={pubUtc} className="tooltip-entry" style={{ fontSize: '10px' }}>
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
              {/* Actual Line */}
              <Line
                type="monotone"
                dataKey="actualGeneration"
                stroke="#2ea043"
                strokeWidth={2.5}
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
                    strokeWidth={1.5}
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
