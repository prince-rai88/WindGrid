import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from 'recharts';
import { Target, Activity, Compass } from 'lucide-react';

const CustomAccuracyTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isOver = data.error !== null && data.error > 0;
    const isUnder = data.error !== null && data.error < 0;

    return (
      <div className="glass-tooltip-rich">
        <div className="tooltip-time-rich">
          SP {data.settlementPeriod} • {data.localTimeDisplay} London
        </div>
        <div className="tooltip-val-row">
          <span style={{ color: '#0284c7', fontWeight: 600 }}>Forecast:</span>
          <strong className="tabular" style={{ color: '#0284c7' }}>
            {data.forecastGeneration !== null ? `${data.forecastGeneration.toLocaleString()} MW` : '—'}
          </strong>
        </div>
        <div className="tooltip-val-row">
          <span style={{ color: '#059669', fontWeight: 600 }}>Actual Outturn:</span>
          <strong className="tabular" style={{ color: '#059669' }}>
            {data.actualGeneration !== null ? `${data.actualGeneration.toLocaleString()} MW` : '—'}
          </strong>
        </div>
        {data.error !== null && (
          <div
            className="tooltip-val-row"
            style={{
              marginTop: '6px',
              borderTop: '1px solid rgba(0, 0, 0, 0.08)',
              paddingTop: '4px',
            }}
          >
            <span style={{ color: isOver ? '#d97706' : isUnder ? '#0284c7' : '#64748b', fontWeight: 600 }}>
              Signed Error:
            </span>
            <strong
              className="tabular"
              style={{ color: isOver ? '#d97706' : isUnder ? '#0284c7' : '#0f172a' }}
            >
              {data.error > 0 ? `+${data.error.toLocaleString()}` : data.error.toLocaleString()} MW
            </strong>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export const AccuracyPage = ({ data }) => {
  if (!data) return null;

  if (!data.isAvailable) {
    return (
      <div className="glass-panel-rich" style={{ textAlign: 'center', padding: '60px 24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
          Data Unavailable for {data.deliveryDate}
        </h2>
        <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '440px', margin: '8px auto 0' }}>
          Either forecast or actual generation data from Elexon BMRS is missing for this delivery date. In accordance with strict auditing standards, no fabricated values are substituted.
        </p>
      </div>
    );
  }

  const isOver = data.bias !== null && data.bias > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
      {/* Header Context */}
      <div className="page-intro">
        <div className="page-title-wrap">
          <h1>Forecast Accuracy Analysis</h1>
          <p>
            Quantitative evaluation comparing day-ahead forecasts against actual outturn wind generation for delivery on{' '}
            <strong>{data.deliveryDate}</strong>.
          </p>
        </div>

        <div className="jewel-pill-row">
          <div className="jewel-pill">
            <span style={{ color: '#059669' }}>●</span>
            <span>Matched Coverage:</span>
            <strong>{data.matchedPeriods} / {data.totalPeriods} periods ({data.coveragePercent}%)</strong>
          </div>
          <div className="jewel-pill">
            <span style={{ color: '#0284c7' }}>●</span>
            <span>Cutoff:</span>
            <strong>{data.decisionCutoffDisplay || '11:00 London'}</strong>
          </div>
        </div>
      </div>

      {/* 3 Core Metric Cards with Jewel Accents */}
      <div className="metric-grid-rich">
        <div className="metric-card-rich">
          <div className="card-top-icon icon-cyan">
            <Target size={18} strokeWidth={2.4} />
          </div>
          <div className="card-label-rich">Mean Absolute Error (MAE)</div>
          <div className="card-value-row">
            <span className="card-number-rich tabular" style={{ color: '#0284c7' }}>
              {data.mae !== null ? data.mae.toLocaleString() : '—'}
            </span>
            <span className="card-unit-rich">MW</span>
          </div>
          <div className="card-sub-rich">Average absolute error magnitude</div>
        </div>

        <div className="metric-card-rich">
          <div className="card-top-icon icon-indigo">
            <Activity size={18} strokeWidth={2.4} />
          </div>
          <div className="card-label-rich">Root Mean Squared Error (RMSE)</div>
          <div className="card-value-row">
            <span className="card-number-rich tabular" style={{ color: '#4f46e5' }}>
              {data.rmse !== null ? data.rmse.toLocaleString() : '—'}
            </span>
            <span className="card-unit-rich">MW</span>
          </div>
          <div className="card-sub-rich">Penalizes large forecast excursions</div>
        </div>

        <div className="metric-card-rich">
          <div className="card-top-icon icon-amber">
            <Compass size={18} strokeWidth={2.4} />
          </div>
          <div className="card-label-rich">Forecast Bias (Mean Signed Error)</div>
          <div className="card-value-row">
            <span
              className="card-number-rich tabular"
              style={{ color: isOver ? '#d97706' : '#0284c7' }}
            >
              {data.bias !== null ? (data.bias > 0 ? `+${data.bias}` : data.bias) : '—'}
            </span>
            <span className="card-unit-rich">MW</span>
          </div>
          <div>
            <span className={`badge-jewel ${isOver ? 'badge-over' : 'badge-under'}`}>
              {isOver ? '▲ Net Overforecast' : '▼ Net Underforecast'}
            </span>
          </div>
        </div>
      </div>

      {/* Dual Charts Grid with Rich Colors */}
      <div className="dual-chart-grid">
        {/* Chart 1: Curve Comparison */}
        <div className="glass-panel-rich">
          <div className="glass-panel-header">
            <div className="panel-heading-rich">
              <h2>Forecast vs Outturn Generation Curve</h2>
              <p>Day-ahead forecast vs actual generation across delivery day (MW)</p>
            </div>

            <div className="legend-rich-row">
              <span style={{ color: '#0284c7' }}>
                <span className="legend-dot-rich" style={{ background: '#0284c7' }} />
                Forecast
              </span>
              <span style={{ color: '#059669' }}>
                <span className="legend-dot-rich" style={{ background: '#059669' }} />
                Actual Outturn
              </span>
            </div>
          </div>

          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.records} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="accCyanFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
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
                <Tooltip content={<CustomAccuracyTooltip />} />
                <Area
                  type="monotone"
                  dataKey="forecastGeneration"
                  fill="url(#accCyanFill)"
                  stroke="#0284c7"
                  strokeWidth={2.4}
                  name="Forecast"
                />
                <Line
                  type="monotone"
                  dataKey="actualGeneration"
                  stroke="#059669"
                  strokeWidth={2.8}
                  dot={false}
                  name="Actual"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Signed Error Distribution */}
        <div className="glass-panel-rich">
          <div className="glass-panel-header">
            <div className="panel-heading-rich">
              <h2>Half-Hourly Signed Error (Forecast - Actual)</h2>
              <p>Vivid Amber = Overforecast (+MW), Electric Sky = Underforecast (-MW)</p>
            </div>

            <div className="legend-rich-row">
              <span style={{ color: '#d97706' }}>
                <span className="legend-dot-rich" style={{ background: '#f59e0b' }} />
                Over (+MW)
              </span>
              <span style={{ color: '#0284c7' }}>
                <span className="legend-dot-rich" style={{ background: '#0ea5e9' }} />
                Under (-MW)
              </span>
            </div>
          </div>

          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.records} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
                  tickFormatter={(val) => `${val > 0 ? `+${val}` : val}`}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(203, 213, 225, 0.6)' }}
                />
                <ReferenceLine y={0} stroke="rgba(148, 163, 184, 0.5)" strokeWidth={1} />
                <Tooltip content={<CustomAccuracyTooltip />} />
                <Bar dataKey="error" radius={[4, 4, 0, 0]}>
                  {data.records.map((entry, index) => (
                    <Cell
                      key={`cell-acc-rich-${index}`}
                      fill={
                        entry.error !== null
                          ? entry.error > 0
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

      {/* Accuracy Comparison Table */}
      <div className="table-panel-rich">
        <div className="table-header-glass">
          <h3>Half-Hourly Accuracy Comparison (48 Settlement Periods)</h3>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
            Formula: <code style={{ color: '#0284c7', fontWeight: 600 }}>Forecast - Actual</code>
          </span>
        </div>

        <div className="table-scroll-rich">
          <table className="rich-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>SP</th>
                <th>London Window</th>
                <th style={{ textAlign: 'right' }}>Forecast</th>
                <th style={{ textAlign: 'right' }}>Actual Outturn</th>
                <th style={{ textAlign: 'right' }}>Signed Error</th>
                <th style={{ textAlign: 'right' }}>|Error|</th>
                <th style={{ textAlign: 'center' }}>Classification</th>
              </tr>
            </thead>
            <tbody>
              {data.records.map((row) => {
                const isOver = row.error !== null && row.error > 0.01;
                const isUnder = row.error !== null && row.error < -0.01;

                return (
                  <tr key={row.settlementPeriod}>
                    <td style={{ fontWeight: 700, color: '#0284c7' }}>
                      #{row.settlementPeriod}
                    </td>
                    <td style={{ fontWeight: 500 }}>{row.localTimeDisplay}</td>
                    <td className="tabular" style={{ textAlign: 'right', color: '#0284c7', fontWeight: 600 }}>
                      {row.forecastGeneration !== null
                        ? `${row.forecastGeneration.toLocaleString()} MW`
                        : '—'}
                    </td>
                    <td
                      className="tabular"
                      style={{ textAlign: 'right', fontWeight: 700, color: '#059669' }}
                    >
                      {row.actualGeneration !== null
                        ? `${row.actualGeneration.toLocaleString()} MW`
                        : '—'}
                    </td>
                    <td
                      className="tabular"
                      style={{
                        textAlign: 'right',
                        fontWeight: 700,
                        color: isOver ? '#d97706' : isUnder ? '#0284c7' : '#64748b',
                      }}
                    >
                      {row.error !== null
                        ? `${row.error > 0 ? `+${row.error.toLocaleString()}` : row.error.toLocaleString()} MW`
                        : '—'}
                    </td>
                    <td className="tabular" style={{ textAlign: 'right', color: '#64748b' }}>
                      {row.absError !== null ? `${row.absError.toLocaleString()} MW` : '—'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {row.status === 'MATCHED' ? (
                        isOver ? (
                          <span className="badge-jewel badge-over">Overforecast</span>
                        ) : isUnder ? (
                          <span className="badge-jewel badge-under">Underforecast</span>
                        ) : (
                          <span className="badge-jewel badge-emerald">Balanced</span>
                        )
                      ) : (
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>{row.status}</span>
                      )}
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
