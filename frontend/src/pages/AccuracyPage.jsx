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

const CustomAccuracyTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isOver = data.error !== null && data.error > 0;
    const isUnder = data.error !== null && data.error < 0;

    return (
      <div className="apple-tooltip">
        <div className="tooltip-title">
          SP {data.settlementPeriod} • {data.localTimeDisplay}
        </div>
        <div className="tooltip-row">
          <span>Forecast:</span>
          <strong className="tabular" style={{ color: '#2d6a4f' }}>
            {data.forecastGeneration !== null ? `${data.forecastGeneration.toLocaleString()} MW` : '—'}
          </strong>
        </div>
        <div className="tooltip-row">
          <span>Actual Outturn:</span>
          <strong className="tabular" style={{ color: '#0f172a' }}>
            {data.actualGeneration !== null ? `${data.actualGeneration.toLocaleString()} MW` : '—'}
          </strong>
        </div>
        {data.error !== null && (
          <div
            className="tooltip-row"
            style={{
              marginTop: '6px',
              borderTop: '1px solid rgba(0, 0, 0, 0.06)',
              paddingTop: '4px',
            }}
          >
            <span style={{ color: isOver ? '#c2410c' : isUnder ? '#0f766e' : '#64748b' }}>
              Signed Error:
            </span>
            <strong
              className="tabular"
              style={{ color: isOver ? '#c2410c' : isUnder ? '#0f766e' : '#0f172a' }}
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
      <div className="state-box">
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>
          Data Unavailable for {data.deliveryDate}
        </h2>
        <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '440px' }}>
          Either forecast or actual generation data from Elexon BMRS is missing for this delivery date. In accordance with strict auditing standards, no fabricated values are substituted.
        </p>
      </div>
    );
  }

  const isOver = data.bias !== null && data.bias > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header Context */}
      <div className="page-header">
        <div className="page-header-text">
          <h1>Forecast Accuracy Analysis</h1>
          <p>
            Quantitative error evaluation of day-ahead forecasts against actual outturn wind generation for delivery on{' '}
            <strong>{data.deliveryDate}</strong>.
          </p>
        </div>

        <div className="meta-pill-group">
          <div className="meta-pill">
            <span>Evaluated:</span>
            <strong>{data.matchedPeriods} / {data.totalPeriods} periods ({data.coveragePercent}%)</strong>
          </div>
          <div className="meta-pill">
            <span>Cutoff:</span>
            <strong>{data.decisionCutoffDisplay || '11:00 London'}</strong>
          </div>
        </div>
      </div>

      {/* 3 Core Metric Cards */}
      <div className="stat-strip">
        <div className="stat-card">
          <div className="stat-label">Mean Absolute Error (MAE)</div>
          <div className="stat-value-group">
            <span className="stat-number tabular">
              {data.mae !== null ? data.mae.toLocaleString() : '—'}
            </span>
            <span className="stat-unit">MW</span>
          </div>
          <div className="stat-subtext">Average magnitude of forecast error</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Root Mean Squared Error (RMSE)</div>
          <div className="stat-value-group">
            <span className="stat-number tabular">
              {data.rmse !== null ? data.rmse.toLocaleString() : '—'}
            </span>
            <span className="stat-unit">MW</span>
          </div>
          <div className="stat-subtext">Penalizes large forecast excursions</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Forecast Bias (Mean Signed Error)</div>
          <div className="stat-value-group">
            <span
              className="stat-number tabular"
              style={{ color: isOver ? '#c2410c' : '#0f766e' }}
            >
              {data.bias !== null ? (data.bias > 0 ? `+${data.bias}` : data.bias) : '—'}
            </span>
            <span className="stat-unit">MW</span>
          </div>
          <div>
            <span className={`stat-badge ${isOver ? 'badge-over' : 'badge-under'}`}>
              {isOver ? 'Net Overforecast' : 'Net Underforecast'}
            </span>
          </div>
        </div>
      </div>

      {/* Dual Charts Grid */}
      <div className="dual-grid">
        {/* Chart 1: Curve Comparison */}
        <div className="chart-panel">
          <div className="chart-panel-header">
            <div className="chart-panel-title">
              <h2>Forecast vs Outturn Generation</h2>
              <p>Day-ahead forecast compared with actual delivered generation (MW)</p>
            </div>

            <div className="chart-legend">
              <span>
                <span className="legend-dot" style={{ background: '#2d6a4f' }} />
                Forecast
              </span>
              <span>
                <span className="legend-dot" style={{ background: '#0f172a' }} />
                Actual Outturn
              </span>
            </div>
          </div>

          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.records} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
                <Tooltip content={<CustomAccuracyTooltip />} />
                <Area
                  type="monotone"
                  dataKey="forecastGeneration"
                  fill="rgba(45, 106, 79, 0.08)"
                  stroke="#2d6a4f"
                  strokeWidth={2}
                  name="Forecast"
                />
                <Line
                  type="monotone"
                  dataKey="actualGeneration"
                  stroke="#0f172a"
                  strokeWidth={2.2}
                  dot={false}
                  name="Actual"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Signed Error Distribution */}
        <div className="chart-panel">
          <div className="chart-panel-header">
            <div className="chart-panel-title">
              <h2>Half-Hourly Signed Error</h2>
              <p>Error = Forecast - Actual (Terracotta = Over, Teal = Under)</p>
            </div>

            <div className="chart-legend">
              <span style={{ color: '#c2410c' }}>
                <span className="legend-dot" style={{ background: '#c2410c' }} />
                Over (+MW)
              </span>
              <span style={{ color: '#0f766e' }}>
                <span className="legend-dot" style={{ background: '#0f766e' }} />
                Under (-MW)
              </span>
            </div>
          </div>

          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.records} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
                  tickFormatter={(val) => `${val > 0 ? `+${val}` : val}`}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(0, 0, 0, 0.08)' }}
                />
                <ReferenceLine y={0} stroke="rgba(0, 0, 0, 0.15)" strokeWidth={1} />
                <Tooltip content={<CustomAccuracyTooltip />} />
                <Bar dataKey="error" radius={[3, 3, 0, 0]}>
                  {data.records.map((entry, index) => (
                    <Cell
                      key={`cell-acc-${index}`}
                      fill={
                        entry.error !== null
                          ? entry.error > 0
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

      {/* Half-Hourly Comparison Table */}
      <div className="table-panel">
        <div className="table-panel-header">
          <span className="table-panel-title">
            Half-Hourly Accuracy Comparison (48 Settlement Periods)
          </span>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
            Signed Error Formula: <code style={{ color: '#2d6a4f' }}>Forecast - Actual</code>
          </span>
        </div>

        <div className="table-scroll">
          <table className="apple-table">
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
                    <td style={{ fontWeight: 600, color: '#2d6a4f' }}>
                      #{row.settlementPeriod}
                    </td>
                    <td>{row.localTimeDisplay}</td>
                    <td className="tabular" style={{ textAlign: 'right', color: '#0f172a' }}>
                      {row.forecastGeneration !== null
                        ? `${row.forecastGeneration.toLocaleString()} MW`
                        : '—'}
                    </td>
                    <td
                      className="tabular"
                      style={{ textAlign: 'right', fontWeight: 600, color: '#0f172a' }}
                    >
                      {row.actualGeneration !== null
                        ? `${row.actualGeneration.toLocaleString()} MW`
                        : '—'}
                    </td>
                    <td
                      className="tabular"
                      style={{
                        textAlign: 'right',
                        fontWeight: 600,
                        color: isOver ? '#c2410c' : isUnder ? '#0f766e' : '#64748b',
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
                          <span className="stat-badge badge-over">Overforecast</span>
                        ) : isUnder ? (
                          <span className="stat-badge badge-under">Underforecast</span>
                        ) : (
                          <span className="stat-badge badge-neutral">Balanced</span>
                        )
                      ) : (
                        <span className="stat-badge badge-neutral">{row.status}</span>
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
