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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Editorial Header */}
      <div className="editorial-header-block">
        <div className="editorial-header-left">
          <span className="editorial-index-label">03 // January 2026 Archive</span>
          <h2 className="editorial-title">Monthly Performance Log</h2>
          <p className="editorial-sub">
            Continuous audit across all 31 purchasing decision dates in January 2026 (delivering 2 January to 1 February 2026).
          </p>
        </div>

        <div className="editorial-meta-box">
          <span>SAMPLE: <strong>31 Operating Days</strong></span>
          <span>•</span>
          <span>CUTOFF: <strong>{data.decisionCutoff || '11:00 AM London'}</strong></span>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="editorial-kpi-grid">
        <div className="kpi-glass-card">
          <div className="kpi-card-top">
            <span className="kpi-title">Monthly Average Error</span>
            <span className="kpi-tag-code">[MONTH_MAE]</span>
          </div>
          <div className="kpi-val-row">
            <span className="kpi-hero-number tabular">
              {agg.mae !== null ? agg.mae.toLocaleString() : '—'}
            </span>
            <span className="kpi-unit-label">MW</span>
          </div>
          <div className="kpi-footer-text">Average day-ahead wind forecast deviation across all 31 January days</div>
        </div>

        <div className="kpi-glass-card">
          <div className="kpi-card-top">
            <span className="kpi-title">Monthly Volatility Risk</span>
            <span className="kpi-tag-code">[MONTH_RMSE]</span>
          </div>
          <div className="kpi-val-row">
            <span className="kpi-hero-number tabular">
              {agg.rmse !== null ? agg.rmse.toLocaleString() : '—'}
            </span>
            <span className="kpi-unit-label">MW</span>
          </div>
          <div className="kpi-footer-text">Aggregate root mean square measure across 744 hourly benchmarks</div>
        </div>

        <div className="kpi-glass-card">
          <div className="kpi-card-top">
            <span className="kpi-title">Monthly Directional Bias</span>
            <span className="kpi-tag-code">[MONTH_BIAS]</span>
          </div>
          <div className="kpi-val-row">
            <span
              className="kpi-hero-number tabular"
              style={{ color: isNetOver ? '#b45309' : '#0284c7' }}
            >
              {agg.bias !== null ? (agg.bias > 0 ? `+${agg.bias}` : agg.bias) : '—'}
            </span>
            <span className="kpi-unit-label">MW</span>
          </div>
          <div>
            <span className={`status-pill ${isNetOver ? 'pill-amber' : 'pill-blue'}`}>
              {isNetOver ? 'Systemic Overforecast' : 'Systemic Underforecast'}
            </span>
          </div>
        </div>
      </div>

      {/* Dual Charts Grid */}
      <div className="editorial-dual-grid">
        {/* Daily Error Trend */}
        <div className="chart-glass-card">
          <div className="chart-card-header">
            <div>
              <h3 className="chart-heading-title">Daily Forecast Error (MAE & RMSE)</h3>
              <p className="chart-heading-sub">Chronological day-by-day accuracy trajectory across January</p>
            </div>

            <div className="chart-legend-editorial">
              <span>
                <span className="legend-indicator" style={{ background: '#111418' }} />
                MAE (MW)
              </span>
              <span>
                <span className="legend-indicator" style={{ background: '#64748b' }} />
                RMSE (MW)
              </span>
            </div>
          </div>

          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.dailyResults} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15, 23, 42, 0.06)" />
                <XAxis
                  dataKey="decisionDate"
                  stroke="#9ca3af"
                  tick={{ fill: '#4b5563', fontSize: 11, fontFamily: 'var(--font-helvetica)' }}
                  tickFormatter={(val) => val.slice(8)}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(15, 23, 42, 0.12)' }}
                />
                <YAxis
                  stroke="#9ca3af"
                  tick={{ fill: '#4b5563', fontSize: 11, fontFamily: 'var(--font-helvetica)' }}
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
                            {d.decisionDate} → {d.deliveryDate}
                          </div>
                          <div className="tooltip-row-item">
                            <span>MAE:</span>
                            <strong>{d.mae} MW</strong>
                          </div>
                          <div className="tooltip-row-item">
                            <span>RMSE:</span>
                            <strong>{d.rmse} MW</strong>
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
                  stroke="#111418"
                  strokeWidth={2.4}
                  dot={{ r: 2, fill: '#111418' }}
                  name="MAE"
                />
                <Line
                  type="monotone"
                  dataKey="rmse"
                  stroke="#64748b"
                  strokeWidth={1.8}
                  dot={false}
                  name="RMSE"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Signed Bias */}
        <div className="chart-glass-card">
          <div className="chart-card-header">
            <div>
              <h3 className="chart-heading-title">Daily Forecast Bias</h3>
              <p className="chart-heading-sub">Directional bias: Amber = Over (+MW), Blue = Under (-MW)</p>
            </div>

            <div className="chart-legend-editorial">
              <span style={{ color: '#b45309' }}>
                <span className="legend-indicator" style={{ background: '#b45309' }} />
                Over
              </span>
              <span style={{ color: '#0284c7' }}>
                <span className="legend-indicator" style={{ background: '#0284c7' }} />
                Under
              </span>
            </div>
          </div>

          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.dailyResults} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15, 23, 42, 0.06)" />
                <XAxis
                  dataKey="decisionDate"
                  stroke="#9ca3af"
                  tick={{ fill: '#4b5563', fontSize: 11, fontFamily: 'var(--font-helvetica)' }}
                  tickFormatter={(val) => val.slice(8)}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(15, 23, 42, 0.12)' }}
                />
                <YAxis
                  stroke="#9ca3af"
                  tick={{ fill: '#4b5563', fontSize: 11, fontFamily: 'var(--font-helvetica)' }}
                  tickFormatter={(val) => `${val > 0 ? `+${val}` : val}`}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(15, 23, 42, 0.12)' }}
                />
                <ReferenceLine y={0} stroke="rgba(15, 23, 42, 0.2)" strokeWidth={1} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="glass-editorial-tooltip">
                          <div className="tooltip-top-label">
                            {d.decisionDate} → {d.deliveryDate}
                          </div>
                          <div className="tooltip-row-item">
                            <span>Bias:</span>
                            <strong style={{ color: d.bias > 0 ? '#b45309' : '#0284c7' }}>
                              {d.bias > 0 ? `+${d.bias}` : d.bias} MW
                            </strong>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="bias" radius={[3, 3, 0, 0]}>
                  {data.dailyResults.map((entry, index) => (
                    <Cell
                      key={`cell-bias-swiss-${index}`}
                      fill={
                        entry.bias !== null
                          ? entry.bias > 0
                            ? '#b45309'
                            : '#0284c7'
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

      {/* 31-Day Table */}
      <div className="table-glass-card">
        <div className="table-card-header">
          <div>
            <h3 className="table-card-title">January 2026 Procurement Decision Archive (31 Days)</h3>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>
              Click "Inspect" to load half-hourly delivery intervals for that operational date
            </span>
          </div>
        </div>

        <div className="table-scroll-container">
          <table className="editorial-table">
            <thead>
              <tr>
                <th>Decision Date</th>
                <th>Delivery Date</th>
                <th style={{ textAlign: 'right' }}>MAE</th>
                <th style={{ textAlign: 'right' }}>RMSE</th>
                <th style={{ textAlign: 'right' }}>Signed Bias</th>
                <th style={{ textAlign: 'right' }}>Mean Forecast</th>
                <th style={{ textAlign: 'right' }}>Mean Actual</th>
                <th style={{ textAlign: 'center' }}>Valid Horizon</th>
                <th style={{ textAlign: 'center' }}>Inspect</th>
              </tr>
            </thead>
            <tbody>
              {data.dailyResults.map((row) => {
                const isOver = row.bias !== null && row.bias > 0;
                return (
                  <tr key={row.decisionDate}>
                    <td style={{ fontWeight: 700, color: '#111418' }}>
                      {row.decisionDate}
                    </td>
                    <td>{row.deliveryDate}</td>
                    <td className="tabular" style={{ textAlign: 'right', color: '#111418', fontWeight: 600 }}>
                      {row.mae !== null ? `${row.mae} MW` : '—'}
                    </td>
                    <td className="tabular" style={{ textAlign: 'right', color: '#64748b' }}>
                      {row.rmse !== null ? `${row.rmse} MW` : '—'}
                    </td>
                    <td
                      className="tabular"
                      style={{
                        textAlign: 'right',
                        fontWeight: 700,
                        color: isOver ? '#b45309' : '#0284c7',
                      }}
                    >
                      {row.bias !== null ? `${row.bias > 0 ? `+${row.bias}` : row.bias} MW` : '—'}
                    </td>
                    <td className="tabular" style={{ textAlign: 'right' }}>
                      {row.meanForecast !== null ? `${row.meanForecast.toLocaleString()} MW` : '—'}
                    </td>
                    <td className="tabular" style={{ textAlign: 'right', fontWeight: 600, color: '#0f766e' }}>
                      {row.meanActual !== null ? `${row.meanActual.toLocaleString()} MW` : '—'}
                    </td>
                    <td className="tabular" style={{ textAlign: 'center', color: '#6b7280' }}>
                      {row.matchedPeriods}/48
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn-editorial-inspect"
                        onClick={() => onSelectDate(row.decisionDate)}
                      >
                        Inspect
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
