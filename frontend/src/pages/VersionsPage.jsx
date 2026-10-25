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
  '#38bdf8', // Luminous Cyan
  '#60a5fa', // Cobalt Sky
  '#fbbf24', // Amber
  '#818cf8', // Indigo
  '#f43f5e', // Rose
  '#94a3b8', // Slate
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

  const preCutoffCount = runs.filter(
    (r) =>
      r.publishTimeUtc.includes('T02:') ||
      r.publishTimeUtc.includes('T04:') ||
      r.publishTimeUtc.includes('T07:') ||
      r.publishTimeUtc.includes('T09:') ||
      r.publishTimeUtc.includes('T10:')
  ).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Editorial Header */}
      <div className="editorial-header-block motion-blur-in delay-1">
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

      {/* 3 Metric Cards */}
      <div className="editorial-kpi-grid">
        <div className="kpi-glass-card motion-blur-in delay-2">
          <div className="kpi-card-top">
            <span className="kpi-title" style={{ color: '#34d399' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px #34d399', display: 'inline-block' }} />
              Total Logged Runs
            </span>
            <span className="kpi-tag-code">BMRS_ARCHIVE</span>
          </div>
          <div className="kpi-val-row">
            <span className="kpi-hero-number tabular">
              {data.publicationRunsCount}
            </span>
            <span className="kpi-unit-label">RUNS</span>
          </div>
          <div className="kpi-footer-text">Chronological WINDFOR model forecast batches captured for this delivery date</div>
        </div>

        <div className="kpi-glass-card motion-blur-in delay-3">
          <div className="kpi-card-top">
            <span className="kpi-title" style={{ color: '#60a5fa' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#60a5fa', boxShadow: '0 0 6px #60a5fa', display: 'inline-block' }} />
              Auction Eligible Runs
            </span>
            <span className="kpi-tag-code">PRE_11:00_AM</span>
          </div>
          <div className="kpi-val-row">
            <span className="kpi-hero-number tabular">
              {preCutoffCount}
            </span>
            <span className="kpi-unit-label">ELIGIBLE</span>
          </div>
          <div className="kpi-footer-text">Forecast versions published strictly before the 11:00 AM London Day-Ahead gate closure</div>
        </div>

        <div className="kpi-glass-card motion-blur-in delay-4">
          <div className="kpi-card-top">
            <span className="kpi-title" style={{ color: '#9eb4c5' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#9eb4c5', boxShadow: '0 0 6px #9eb4c5', display: 'inline-block' }} />
              Active Horizons Selected
            </span>
            <span className="kpi-tag-code">MULTI_TRACE</span>
          </div>
          <div className="kpi-val-row">
            <span className="kpi-hero-number tabular">
              {selectedRuns.length}
            </span>
            <span className="kpi-unit-label">/ {runs.length}</span>
          </div>
          <div className="kpi-footer-text">Interactive multi-run trajectories plotted simultaneously against actual outturn</div>
        </div>
      </div>

      {/* Main Glass Chart Card */}
      <div className="chart-glass-card motion-blur-in delay-5">
        <div className="chart-card-header">
          <div>
            <h3 className="chart-heading-title">Multi-Run Horizon vs Actual Outturn</h3>
            <p className="chart-heading-sub">Comparing forecast version updates against delivered generation (MW)</p>
          </div>

          <div className="chart-legend-editorial">
            <span>
              <span className="legend-indicator" style={{ background: '#2dd4bf', boxShadow: '0 0 8px #2dd4bf' }} />
              Actual Output
            </span>
          </div>
        </div>

        {/* Toggle Pills */}
        <div className="motion-blur-in delay-6" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94a3b8', alignSelf: 'center', marginRight: '6px' }}>
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
                  background: isSelected ? 'rgba(30, 58, 138, 0.45)' : 'rgba(15, 28, 52, 0.45)',
                  border: isSelected ? `2px solid ${color}` : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '9999px',
                  padding: '4px 12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-helvetica)',
                  color: isSelected ? color : '#94a3b8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? `0 0 12px ${color}33` : 'none',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: isSelected ? color : '#64748b',
                  }}
                />
                <span className="mono">{r.publishTimeUtc.slice(11, 16)} UTC</span>
                {isPreCutoff && (
                  <span style={{ fontSize: '9px', color: '#2dd4bf', fontWeight: 800 }}>
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
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.07)" />
              <XAxis
                dataKey="localTime"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'var(--font-helvetica)' }}
                interval={3}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255, 255, 255, 0.12)' }}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'var(--font-helvetica)' }}
                tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255, 255, 255, 0.12)' }}
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
                          <span style={{ color: '#2dd4bf', fontWeight: 600 }}>Actual Output:</span>
                          <strong className="tabular">{d.actualGeneration?.toLocaleString() ?? '—'} MW</strong>
                        </div>
                        {selectedRuns.map((pubUtc) => {
                          const val = d[pubUtc];
                          const runIdx = runs.findIndex((r) => r.publishTimeUtc === pubUtc);
                          const color = RUN_PALETTE[runIdx % RUN_PALETTE.length];
                          return (
                            <div key={pubUtc} className="tooltip-row-item" style={{ fontSize: '11px' }}>
                              <span style={{ color }}>Run {pubUtc.slice(11, 16)} UTC:</span>
                              <span className="tabular" style={{ color: '#ffffff' }}>{val !== null ? `${val.toLocaleString()} MW` : '—'}</span>
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
                stroke="#2dd4bf"
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
