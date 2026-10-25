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
      {/* Header */}
      <div className="page-header">
        <div className="page-header-text">
          <h1>January 2026 Evaluation</h1>
          <p>
            Historical performance across all 31 purchasing decision dates made in January 2026 (delivering 2 Jan – 1 Feb).
          </p>
        </div>

        <div className="meta-pill-group">
          <div className="meta-pill">
            <span>Decisions:</span>
            <strong>31 Days Evaluated</strong>
          </div>
          <div className="meta-pill">
            <span>Cutoff:</span>
            <strong>{data.decisionCutoff || '11:00 London'}</strong>
          </div>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="stat-strip">
        <div className="stat-card">
          <div className="stat-label">Month-Wide Mean Absolute Error</div>
          <div className="stat-value-group">
            <span className="stat-number tabular">
              {agg.mae !== null ? agg.mae.toLocaleString() : '—'}
            </span>
            <span className="stat-unit">MW</span>
          </div>
          <div className="stat-subtext">Overall average forecasting error magnitude</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Month-Wide Root Mean Squared Error</div>
          <div className="stat-value-group">
            <span className="stat-number tabular">
              {agg.rmse !== null ? agg.rmse.toLocaleString() : '—'}
            </span>
            <span className="stat-unit">MW</span>
          </div>
          <div className="stat-subtext">Reflects frequency and impact of large error spikes</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Systemic Forecast Bias</div>
          <div className="stat-value-group">
            <span
              className="stat-number tabular"
              style={{ color: isNetOver ? '#c2410c' : '#0f766e' }}
            >
              {agg.bias !== null ? (agg.bias > 0 ? `+${agg.bias}` : agg.bias) : '—'}
            </span>
            <span className="stat-unit">MW</span>
          </div>
          <div>
            <span className={`stat-badge ${isNetOver ? 'badge-over' : 'badge-under'}`}>
              {isNetOver ? 'Systemic Overforecast' : 'Systemic Underforecast'}
            </span>
          </div>
        </div>
      </div>

      {/* Dual Charts */}
      <div className="dual-grid">
        {/* Daily MAE Trend */}
        <div className="chart-panel">
          <div className="chart-panel-header">
            <div className="chart-panel-title">
              <h2>Daily Error Magnitudes (MAE & RMSE)</h2>
              <p>Tracking day-ahead forecasting accuracy day-by-day across January 2026</p>
            </div>

            <div className="chart-legend">
              <span>
                <span className="legend-dot" style={{ background: '#2d6a4f' }} />
                MAE (MW)
              </span>
              <span>
                <span className="legend-dot" style={{ background: '#94a3b8' }} />
                RMSE (MW)
              </span>
            </div>
          </div>

          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.dailyResults} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 0, 0, 0.04)" />
                <XAxis
                  dataKey="decisionDate"
                  stroke="#94a3b8"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickFormatter={(val) => val.slice(8)} // show day of month
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(0, 0, 0, 0.08)' }}
                />
                <YAxis
                  stroke="#94a3b8"
                  tick={{ fill: '#64748b', fontSize: 11 }}
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
                            {d.decisionDate} → {d.deliveryDate}
                          </div>
                          <div className="tooltip-row">
                            <span>MAE:</span>
                            <strong className="tabular">{d.mae} MW</strong>
                          </div>
                          <div className="tooltip-row">
                            <span>RMSE:</span>
                            <strong className="tabular">{d.rmse} MW</strong>
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
                  stroke="#2d6a4f"
                  strokeWidth={2.2}
                  dot={{ r: 2.5, fill: '#2d6a4f' }}
                  name="MAE"
                />
                <Line
                  type="monotone"
                  dataKey="rmse"
                  stroke="#94a3b8"
                  strokeWidth={1.8}
                  dot={false}
                  name="RMSE"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Signed Bias */}
        <div className="chart-panel">
          <div className="chart-panel-header">
            <div className="chart-panel-title">
              <h2>Daily Signed Bias</h2>
              <p>Positive (Terracotta) = Overforecast, Negative (Teal) = Underforecast</p>
            </div>

            <div className="chart-legend">
              <span style={{ color: '#c2410c' }}>
                <span className="legend-dot" style={{ background: '#c2410c' }} />
                Over
              </span>
              <span style={{ color: '#0f766e' }}>
                <span className="legend-dot" style={{ background: '#0f766e' }} />
                Under
              </span>
            </div>
          </div>

          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.dailyResults} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 0, 0, 0.04)" />
                <XAxis
                  dataKey="decisionDate"
                  stroke="#94a3b8"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickFormatter={(val) => val.slice(8)}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(0, 0, 0, 0.08)' }}
                />
                <YAxis
                  stroke="#94a3b8"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickFormatter={(val) => `${val > 0 ? `+${val}` : val}`}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(0, 0, 0, 0.08)' }}
                />
                <ReferenceLine y={0} stroke="rgba(0, 0, 0, 0.15)" strokeWidth={1} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="apple-tooltip">
                          <div className="tooltip-title">
                            {d.decisionDate} → {d.deliveryDate}
                          </div>
                          <div className="tooltip-row">
                            <span>Signed Bias:</span>
                            <strong
                              className="tabular"
                              style={{ color: d.bias > 0 ? '#c2410c' : '#0f766e' }}
                            >
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
                      key={`cell-bias-${index}`}
                      fill={
                        entry.bias !== null
                          ? entry.bias > 0
                            ? '#c2410c'
                            : '#0f766e'
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
      <div className="table-panel">
        <div className="table-panel-header">
          <span className="table-panel-title">
            January 2026 Daily Decision Log (31 Decisions)
          </span>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
            Select any date to inspect half-hourly delivery profiles
          </span>
        </div>

        <div className="table-scroll">
          <table className="apple-table">
            <thead>
              <tr>
                <th>Decision Date</th>
                <th>Delivery Date</th>
                <th style={{ textAlign: 'right' }}>MAE</th>
                <th style={{ textAlign: 'right' }}>RMSE</th>
                <th style={{ textAlign: 'right' }}>Signed Bias</th>
                <th style={{ textAlign: 'right' }}>Mean Forecast</th>
                <th style={{ textAlign: 'right' }}>Mean Actual</th>
                <th style={{ textAlign: 'center' }}>Periods</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.dailyResults.map((row) => {
                const isOver = row.bias !== null && row.bias > 0;
                return (
                  <tr key={row.decisionDate}>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>
                      {row.decisionDate}
                    </td>
                    <td>{row.deliveryDate}</td>
                    <td className="tabular" style={{ textAlign: 'right' }}>
                      {row.mae !== null ? `${row.mae} MW` : '—'}
                    </td>
                    <td className="tabular" style={{ textAlign: 'right', color: '#64748b' }}>
                      {row.rmse !== null ? `${row.rmse} MW` : '—'}
                    </td>
                    <td
                      className="tabular"
                      style={{
                        textAlign: 'right',
                        fontWeight: 600,
                        color: isOver ? '#c2410c' : '#0f766e',
                      }}
                    >
                      {row.bias !== null ? `${row.bias > 0 ? `+${row.bias}` : row.bias} MW` : '—'}
                    </td>
                    <td className="tabular" style={{ textAlign: 'right' }}>
                      {row.meanForecast !== null ? `${row.meanForecast.toLocaleString()} MW` : '—'}
                    </td>
                    <td className="tabular" style={{ textAlign: 'right', fontWeight: 500, color: '#2d6a4f' }}>
                      {row.meanActual !== null ? `${row.meanActual.toLocaleString()} MW` : '—'}
                    </td>
                    <td className="tabular" style={{ textAlign: 'center', color: '#64748b' }}>
                      {row.matchedPeriods}/48
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="apple-action-btn"
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
