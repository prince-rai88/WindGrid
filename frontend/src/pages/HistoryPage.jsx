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
import { Calendar, Target, Activity, Compass } from 'lucide-react';

export const HistoryPage = ({ data, onSelectDate }) => {
  if (!data) return null;

  const agg = data.aggregateMetrics || {};
  const isNetOver = agg.bias !== null && agg.bias > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
      {/* Header */}
      <div className="page-intro">
        <div className="page-title-wrap">
          <h1>January 2026 Evaluation</h1>
          <p>
            Historical forecasting analysis across all 31 purchasing decision dates made in January 2026.
          </p>
        </div>

        <div className="jewel-pill-row">
          <div className="jewel-pill">
            <Calendar size={13} color="#0284c7" />
            <span>Decisions:</span>
            <strong>31 Days Evaluated</strong>
          </div>
          <div className="jewel-pill">
            <span style={{ color: '#059669' }}>●</span>
            <span>Cutoff:</span>
            <strong>{data.decisionCutoff || '11:00 London'}</strong>
          </div>
        </div>
      </div>

      {/* 3 Metric Cards with Jewel Accents */}
      <div className="metric-grid-rich">
        <div className="metric-card-rich">
          <div className="card-top-icon icon-cyan">
            <Target size={18} strokeWidth={2.4} />
          </div>
          <div className="card-label-rich">Month-Wide Mean Absolute Error</div>
          <div className="card-value-row">
            <span className="card-number-rich tabular" style={{ color: '#0284c7' }}>
              {agg.mae !== null ? agg.mae.toLocaleString() : '—'}
            </span>
            <span className="card-unit-rich">MW</span>
          </div>
          <div className="card-sub-rich">Average daily forecast uncertainty magnitude</div>
        </div>

        <div className="metric-card-rich">
          <div className="card-top-icon icon-indigo">
            <Activity size={18} strokeWidth={2.4} />
          </div>
          <div className="card-label-rich">Month-Wide Root Mean Squared Error</div>
          <div className="card-value-row">
            <span className="card-number-rich tabular" style={{ color: '#4f46e5' }}>
              {agg.rmse !== null ? agg.rmse.toLocaleString() : '—'}
            </span>
            <span className="card-unit-rich">MW</span>
          </div>
          <div className="card-sub-rich">Reflects frequency of large forecast excursions</div>
        </div>

        <div className="metric-card-rich">
          <div className="card-top-icon icon-amber">
            <Compass size={18} strokeWidth={2.4} />
          </div>
          <div className="card-label-rich">Systemic Forecast Bias</div>
          <div className="card-value-row">
            <span
              className="card-number-rich tabular"
              style={{ color: isNetOver ? '#d97706' : '#0284c7' }}
            >
              {agg.bias !== null ? (agg.bias > 0 ? `+${agg.bias}` : agg.bias) : '—'}
            </span>
            <span className="card-unit-rich">MW</span>
          </div>
          <div>
            <span className={`badge-jewel ${isNetOver ? 'badge-over' : 'badge-under'}`}>
              {isNetOver ? '▲ Net Overforecast' : '▼ Net Underforecast'}
            </span>
          </div>
        </div>
      </div>

      {/* Dual Charts */}
      <div className="dual-chart-grid">
        {/* Daily MAE Trend */}
        <div className="glass-panel-rich">
          <div className="glass-panel-header">
            <div className="panel-heading-rich">
              <h2>Daily Error Magnitudes (MAE & RMSE)</h2>
              <p>Day-ahead accuracy day-by-day across January 2026</p>
            </div>

            <div className="legend-rich-row">
              <span style={{ color: '#0284c7' }}>
                <span className="legend-dot-rich" style={{ background: '#0284c7' }} />
                MAE (MW)
              </span>
              <span style={{ color: '#4f46e5' }}>
                <span className="legend-dot-rich" style={{ background: '#4f46e5' }} />
                RMSE (MW)
              </span>
            </div>
          </div>

          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.dailyResults} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                <XAxis
                  dataKey="decisionDate"
                  stroke="#94a3b8"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickFormatter={(val) => val.slice(8)} // show day
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(203, 213, 225, 0.6)' }}
                />
                <YAxis
                  stroke="#94a3b8"
                  tick={{ fill: '#64748b', fontSize: 11 }}
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
                            {d.decisionDate} → {d.deliveryDate}
                          </div>
                          <div className="tooltip-val-row">
                            <span style={{ color: '#0284c7' }}>MAE:</span>
                            <strong className="tabular">{d.mae} MW</strong>
                          </div>
                          <div className="tooltip-val-row">
                            <span style={{ color: '#4f46e5' }}>RMSE:</span>
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
                  stroke="#0284c7"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#0284c7' }}
                  name="MAE"
                />
                <Line
                  type="monotone"
                  dataKey="rmse"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  dot={{ r: 2.5, fill: '#4f46e5' }}
                  name="RMSE"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Signed Bias */}
        <div className="glass-panel-rich">
          <div className="glass-panel-header">
            <div className="panel-heading-rich">
              <h2>Daily Signed Bias across January 2026</h2>
              <p>Vivid Amber = Overforecast (+MW), Electric Sky = Underforecast (-MW)</p>
            </div>

            <div className="legend-rich-row">
              <span style={{ color: '#d97706' }}>
                <span className="legend-dot-rich" style={{ background: '#f59e0b' }} />
                Over
              </span>
              <span style={{ color: '#0284c7' }}>
                <span className="legend-dot-rich" style={{ background: '#0ea5e9' }} />
                Under
              </span>
            </div>
          </div>

          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.dailyResults} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                <XAxis
                  dataKey="decisionDate"
                  stroke="#94a3b8"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickFormatter={(val) => val.slice(8)}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(203, 213, 225, 0.6)' }}
                />
                <YAxis
                  stroke="#94a3b8"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickFormatter={(val) => `${val > 0 ? `+${val}` : val}`}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(203, 213, 225, 0.6)' }}
                />
                <ReferenceLine y={0} stroke="rgba(148, 163, 184, 0.5)" strokeWidth={1} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="glass-tooltip-rich">
                          <div className="tooltip-time-rich">
                            {d.decisionDate} → {d.deliveryDate}
                          </div>
                          <div className="tooltip-val-row">
                            <span style={{ color: d.bias > 0 ? '#d97706' : '#0284c7', fontWeight: 600 }}>
                              Bias:
                            </span>
                            <strong className="tabular">
                              {d.bias > 0 ? `+${d.bias}` : d.bias} MW
                            </strong>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="bias" radius={[4, 4, 0, 0]}>
                  {data.dailyResults.map((entry, index) => (
                    <Cell
                      key={`cell-bias-rich-${index}`}
                      fill={
                        entry.bias !== null
                          ? entry.bias > 0
                            ? '#f59e0b'
                            : '#0ea5e9'
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
      <div className="table-panel-rich">
        <div className="table-header-glass">
          <h3>January 2026 Daily Decision Log (31 Decisions)</h3>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
            Click "Inspect" to view half-hourly delivery profiles
          </span>
        </div>

        <div className="table-scroll-rich">
          <table className="rich-table">
            <thead>
              <tr>
                <th>Decision Date</th>
                <th>Delivery Date</th>
                <th style={{ textAlign: 'right' }}>MAE</th>
                <th style={{ textAlign: 'right' }}>RMSE</th>
                <th style={{ textAlign: 'right' }}>Signed Bias</th>
                <th style={{ textAlign: 'right' }}>Mean Forecast</th>
                <th style={{ textAlign: 'right' }}>Mean Actual</th>
                <th style={{ textAlign: 'center' }}>Matched</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.dailyResults.map((row) => {
                const isOver = row.bias !== null && row.bias > 0;
                return (
                  <tr key={row.decisionDate}>
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>
                      {row.decisionDate}
                    </td>
                    <td>{row.deliveryDate}</td>
                    <td className="tabular" style={{ textAlign: 'right', color: '#0284c7', fontWeight: 600 }}>
                      {row.mae !== null ? `${row.mae} MW` : '—'}
                    </td>
                    <td className="tabular" style={{ textAlign: 'right', color: '#4f46e5' }}>
                      {row.rmse !== null ? `${row.rmse} MW` : '—'}
                    </td>
                    <td
                      className="tabular"
                      style={{
                        textAlign: 'right',
                        fontWeight: 700,
                        color: isOver ? '#d97706' : '#0284c7',
                      }}
                    >
                      {row.bias !== null ? `${row.bias > 0 ? `+${row.bias}` : row.bias} MW` : '—'}
                    </td>
                    <td className="tabular" style={{ textAlign: 'right' }}>
                      {row.meanForecast !== null ? `${row.meanForecast.toLocaleString()} MW` : '—'}
                    </td>
                    <td className="tabular" style={{ textAlign: 'right', fontWeight: 600, color: '#059669' }}>
                      {row.meanActual !== null ? `${row.meanActual.toLocaleString()} MW` : '—'}
                    </td>
                    <td className="tabular" style={{ textAlign: 'center', color: '#64748b' }}>
                      {row.matchedPeriods}/48
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn-action-jewel"
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
