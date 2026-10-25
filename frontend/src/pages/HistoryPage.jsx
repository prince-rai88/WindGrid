import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from 'recharts';

export const HistoryPage = ({ data, onSelectDate }) => {
  if (!data) return null;

  const agg = data.aggregateMetrics || {};
  const isNetOver = agg.bias !== null && agg.bias > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Ticker Strip */}
      <div className="trading-ticker">
        <div className="ticker-group">
          <div className="ticker-item">
            <span className="ticker-label">SCOPE:</span>
            <span className="ticker-val">JANUARY 2026 PURCHASING DECISIONS (31 DAYS)</span>
          </div>
          <div className="ticker-item">
            <span className="ticker-label">CUTOFF:</span>
            <span className="ticker-val">{data.decisionCutoff}</span>
          </div>
        </div>

        <div className="ticker-group">
          <div className="ticker-item">
            <span className="ticker-label">MONTH MAE:</span>
            <span className="ticker-val tabular accent-blue">
              {agg.mae !== null ? `${agg.mae.toLocaleString()} MW` : '—'}
            </span>
          </div>
          <div className="ticker-item">
            <span className="ticker-label">MONTH RMSE:</span>
            <span className="ticker-val tabular">
              {agg.rmse !== null ? `${agg.rmse.toLocaleString()} MW` : '—'}
            </span>
          </div>
          <div className="ticker-item">
            <span className="ticker-label">SYSTEMIC BIAS:</span>
            <span
              className={`ticker-val tabular ${isNetOver ? 'accent-amber' : 'accent-cyan'}`}
            >
              {agg.bias !== null ? (agg.bias > 0 ? `+${agg.bias}` : agg.bias) : '—'} MW
              {isNetOver ? ' [OVERFORECAST SKEW]' : ' [UNDERFORECAST SKEW]'}
            </span>
          </div>
          <div className="ticker-item">
            <span className="ticker-label">EVALUATED SP:</span>
            <span className="ticker-val tabular">
              {agg.totalMatchedHalfHours ? `${agg.totalMatchedHalfHours.toLocaleString()} SP` : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: 2 Charts */}
      <div className="grid-2col">
        {/* Daily Error Magnitude Trend */}
        <div className="trading-panel">
          <div className="trading-panel-header">
            <span className="panel-title">DAILY FORECAST ERROR MAGNITUDES (MAE & RMSE)</span>
            <div className="panel-tools">
              <span style={{ color: '#58a6ff', fontWeight: 600 }}>● MAE (MW)</span>
              <span style={{ color: '#f85149', fontWeight: 600 }}>● RMSE (MW)</span>
            </div>
          </div>

          <div className="chart-body" style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.dailyResults} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                <XAxis
                  dataKey="decisionDate"
                  stroke="#484f58"
                  tick={{ fill: '#8b949e', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                  tickFormatter={(val) => val.slice(8)} // show day
                />
                <YAxis
                  stroke="#484f58"
                  tick={{ fill: '#8b949e', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                  tickFormatter={(val) => `${val}`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="terminal-tooltip">
                          <div className="tooltip-header">
                            DECISION: {d.decisionDate} → DELIVERY: {d.deliveryDate}
                          </div>
                          <div className="tooltip-entry">
                            <span style={{ color: '#58a6ff' }}>MAE:</span>
                            <span className="tabular">{d.mae} MW</span>
                          </div>
                          <div className="tooltip-entry">
                            <span style={{ color: '#f85149' }}>RMSE:</span>
                            <span className="tabular">{d.rmse} MW</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="mae"
                  stroke="#388bfd"
                  strokeWidth={2}
                  dot={{ r: 2, fill: '#388bfd' }}
                  name="MAE"
                />
                <Line
                  type="monotone"
                  dataKey="rmse"
                  stroke="#f85149"
                  strokeWidth={2}
                  dot={{ r: 2, fill: '#f85149' }}
                  name="RMSE"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Signed Bias */}
        <div className="trading-panel">
          <div className="trading-panel-header">
            <span className="panel-title">DAILY SYSTEMIC BIAS (AMBER = OVER, CYAN = UNDER)</span>
            <div className="panel-tools">
              <span style={{ color: '#d29922', fontWeight: 600 }}>■ OVER (+MW)</span>
              <span style={{ color: '#38bdf8', fontWeight: 600 }}>■ UNDER (-MW)</span>
            </div>
          </div>

          <div className="chart-body" style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.dailyResults} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                <XAxis
                  dataKey="decisionDate"
                  stroke="#484f58"
                  tick={{ fill: '#8b949e', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                  tickFormatter={(val) => val.slice(8)}
                />
                <YAxis
                  stroke="#484f58"
                  tick={{ fill: '#8b949e', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                  tickFormatter={(val) => `${val > 0 ? `+${val}` : val}`}
                />
                <ReferenceLine y={0} stroke="#484f58" strokeWidth={1} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="terminal-tooltip">
                          <div className="tooltip-header">
                            DECISION: {d.decisionDate} → DELIVERY: {d.deliveryDate}
                          </div>
                          <div className="tooltip-entry">
                            <span style={{ color: d.bias > 0 ? '#d29922' : '#38bdf8' }}>
                              BIAS:
                            </span>
                            <span className="tabular">
                              {d.bias > 0 ? `+${d.bias}` : d.bias} MW
                            </span>
                          </div>
                          <div className="tooltip-entry">
                            <span>PERIODS:</span>
                            <span>{d.overforecastCount} Over / {d.underforecastCount} Under</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="bias">
                  {data.dailyResults.map((entry, index) => (
                    <Cell
                      key={`bar-bias-${index}`}
                      fill={
                        entry.bias !== null
                          ? entry.bias > 0
                            ? '#d29922'
                            : '#38bdf8'
                          : 'transparent'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 31-Day Financial Breakdown Table */}
      <div className="trading-panel">
        <div className="trading-panel-header">
          <span className="panel-title">
            JANUARY 2026 DAILY DECISION LOG (31 DECISION DATES)
          </span>
          <span style={{ color: '#8b949e', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
            CLICK "INSPECT" TO LOAD HALF-HOURLY INTRADAY DATA
          </span>
        </div>

        <div className="table-scroll">
          <table className="terminal-table">
            <thead>
              <tr>
                <th>DECISION DATE</th>
                <th>DELIVERY DATE</th>
                <th style={{ textAlign: 'right' }}>MAE (MW)</th>
                <th style={{ textAlign: 'right' }}>RMSE (MW)</th>
                <th style={{ textAlign: 'right' }}>SIGNED BIAS (MW)</th>
                <th style={{ textAlign: 'right' }}>MEAN FC (MW)</th>
                <th style={{ textAlign: 'right' }}>MEAN ACT (MW)</th>
                <th style={{ textAlign: 'center' }}>MATCHED</th>
                <th style={{ textAlign: 'center' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {data.dailyResults.map((row) => {
                const isOver = row.bias !== null && row.bias > 0;
                return (
                  <tr key={row.decisionDate}>
                    <td style={{ color: '#58a6ff', fontWeight: 600 }}>{row.decisionDate}</td>
                    <td>{row.deliveryDate}</td>
                    <td className="tabular" style={{ textAlign: 'right' }}>
                      {row.mae !== null ? `${row.mae} MW` : '—'}
                    </td>
                    <td className="tabular" style={{ textAlign: 'right' }}>
                      {row.rmse !== null ? `${row.rmse} MW` : '—'}
                    </td>
                    <td
                      className="tabular"
                      style={{
                        textAlign: 'right',
                        fontWeight: 600,
                        color: isOver ? '#d29922' : '#38bdf8',
                      }}
                    >
                      {row.bias !== null ? `${row.bias > 0 ? `+${row.bias}` : row.bias} MW` : '—'}
                    </td>
                    <td className="tabular" style={{ textAlign: 'right' }}>
                      {row.meanForecast !== null ? `${row.meanForecast.toLocaleString()} MW` : '—'}
                    </td>
                    <td className="tabular" style={{ textAlign: 'right', color: '#3fb950' }}>
                      {row.meanActual !== null ? `${row.meanActual.toLocaleString()} MW` : '—'}
                    </td>
                    <td className="tabular" style={{ textAlign: 'center' }}>
                      {row.matchedPeriods}/48
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="quick-btn"
                        onClick={() => onSelectDate(row.decisionDate)}
                        style={{ padding: '2px 8px', color: '#58a6ff' }}
                      >
                        INSPECT →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
