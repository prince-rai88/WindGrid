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

    return (
      <div className="glass-editorial-tooltip">
        <div className="tooltip-top-label">
          SP {data.settlementPeriod} • {data.localTimeDisplay}
        </div>
        <div className="tooltip-row-item">
          <span>Forecast Wind:</span>
          <strong>
            {data.forecastGeneration !== null ? `${data.forecastGeneration.toLocaleString()} MW` : '—'}
          </strong>
        </div>
        <div className="tooltip-row-item">
          <span>Actual Delivered:</span>
          <strong>
            {data.actualGeneration !== null ? `${data.actualGeneration.toLocaleString()} MW` : '—'}
          </strong>
        </div>
        {data.error !== null && (
          <div
            className="tooltip-row-item"
            style={{
              marginTop: '6px',
              borderTop: '1px solid rgba(15, 23, 42, 0.08)',
              paddingTop: '6px',
            }}
          >
            <span style={{ color: isOver ? '#b45309' : '#0284c7', fontWeight: 600 }}>
              Signed Error:
            </span>
            <strong style={{ color: isOver ? '#b45309' : '#0284c7' }}>
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
      <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, textTransform: 'uppercase', color: '#111418' }}>
          Data Unavailable for {data.deliveryDate}
        </h3>
        <p style={{ color: '#4b5563', fontSize: '13px', maxWidth: '440px', margin: '8px auto 0' }}>
          Either forecast or actual generation data from Elexon BMRS is missing for this delivery date. In accordance with strict auditing standards, no fabricated values are substituted.
        </p>
      </div>
    );
  }

  const isOver = data.bias !== null && data.bias > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Editorial Header */}
      <div className="editorial-header-block motion-blur-in delay-1">
        <div className="editorial-header-left">
          <span className="editorial-index-label">02 // Quantitative Evaluation</span>
          <h2 className="editorial-title">Forecast Accuracy Benchmark</h2>
          <p className="editorial-sub">
            Comparing day-ahead National Grid ESO forecast with official Elexon FUELHH actual outturn for delivery on <strong>{data.deliveryDate}</strong>.
          </p>
        </div>

        <div className="editorial-meta-box">
          <span>EVALUATED: <strong>{data.matchedPeriods} of {data.totalPeriods} periods ({data.coveragePercent}%)</strong></span>
          <span>•</span>
          <span>CUTOFF: <strong>{data.decisionCutoffDisplay || '11:00 AM London'}</strong></span>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="editorial-kpi-grid">
        <div className="kpi-glass-card motion-blur-in delay-2">
          <div className="kpi-card-top">
            <span className="kpi-title" style={{ color: '#60a5fa' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#60a5fa', boxShadow: '0 0 6px #60a5fa', display: 'inline-block' }} />
              Mean Absolute Error
            </span>
            <span className="kpi-tag-code">MAE_MW</span>
          </div>
          <div className="kpi-val-row">
            <span className="kpi-hero-number tabular">
              {data.mae !== null ? data.mae.toLocaleString() : '—'}
            </span>
            <span className="kpi-unit-label">MW</span>
          </div>
          <div className="kpi-footer-text">Average magnitude of difference between forecast and real generation</div>
        </div>

        <div className="kpi-glass-card motion-blur-in delay-3">
          <div className="kpi-card-top">
            <span className="kpi-title" style={{ color: '#818cf8' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#818cf8', boxShadow: '0 0 6px #818cf8', display: 'inline-block' }} />
              Root Mean Squared Error
            </span>
            <span className="kpi-tag-code">RMSE_MW</span>
          </div>
          <div className="kpi-val-row">
            <span className="kpi-hero-number tabular">
              {data.rmse !== null ? data.rmse.toLocaleString() : '—'}
            </span>
            <span className="kpi-unit-label">MW</span>
          </div>
          <div className="kpi-footer-text">Penalizes large swings to quantify grid imbalance risk</div>
        </div>

        <div className="kpi-glass-card motion-blur-in delay-4">
          <div className="kpi-card-top">
            <span className="kpi-title" style={{ color: isOver ? '#fcd34d' : '#34d399' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: isOver ? '#fcd34d' : '#34d399', boxShadow: isOver ? '0 0 6px #fcd34d' : '0 0 6px #34d399', display: 'inline-block' }} />
              Forecast Bias (Signed Error)
            </span>
            <span className="kpi-tag-code">BIAS_DIR</span>
          </div>
          <div className="kpi-val-row">
            <span
              className="kpi-hero-number tabular"
              style={{ color: isOver ? '#b45309' : '#0284c7' }}
            >
              {data.bias !== null ? (data.bias > 0 ? `+${data.bias}` : data.bias) : '—'}
            </span>
            <span className="kpi-unit-label">MW</span>
          </div>
          <div>
            <span className={`status-pill ${isOver ? 'pill-amber' : 'pill-blue'}`}>
              {isOver ? 'Overforecasting (+MW)' : 'Underforecasting (-MW)'}
            </span>
          </div>
        </div>
      </div>

      {/* Dual Charts Grid */}
      <div className="editorial-dual-grid">
        {/* Chart 1: Forecast vs Actual */}
        <div className="chart-glass-card motion-blur-in delay-5">
          <div className="chart-card-header">
            <div>
              <h3 className="chart-heading-title">Forecast vs Actual Outturn</h3>
              <p className="chart-heading-sub">Comparing day-ahead forecast with delivered generation (MW)</p>
            </div>

            <div className="chart-legend-editorial">
              <span>
                <span className="legend-indicator" style={{ background: '#ffffff', boxShadow: '0 0 8px rgba(255, 255, 255, 0.6)' }} />
                Forecast
              </span>
              <span>
                <span className="legend-indicator" style={{ background: '#7dd3fc', boxShadow: '0 0 8px #7dd3fc' }} />
                Actual
              </span>
            </div>
          </div>

          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.records} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.12)" />
                <XAxis
                  dataKey="localTime"
                  stroke="rgba(255, 255, 255, 0.3)"
                  tick={{ fill: '#cbd5e1', fontSize: 11, fontFamily: 'var(--font-helvetica)' }}
                  interval={3}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255, 255, 255, 0.2)' }}
                />
                <YAxis
                  stroke="rgba(255, 255, 255, 0.3)"
                  tick={{ fill: '#cbd5e1', fontSize: 11, fontFamily: 'var(--font-helvetica)' }}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255, 255, 255, 0.2)' }}
                />
                <Tooltip content={<CustomAccuracyTooltip />} />
                <Area
                  type="monotone"
                  dataKey="forecastGeneration"
                  fill="rgba(255, 255, 255, 0.16)"
                  stroke="#ffffff"
                  strokeWidth={2}
                  name="Forecast"
                />
                <Line
                  type="monotone"
                  dataKey="actualGeneration"
                  stroke="#7dd3fc"
                  strokeWidth={2.4}
                  dot={false}
                  name="Actual"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Signed Error Distribution */}
        <div className="chart-glass-card motion-blur-in delay-5">
          <div className="chart-card-header">
            <div>
              <h3 className="chart-heading-title">Half-Hourly Signed Error</h3>
              <p className="chart-heading-sub">Formula: Forecast - Actual (Amber = Over, Glacial Ice = Under)</p>
            </div>

            <div className="chart-legend-editorial">
              <span style={{ color: '#fde047' }}>
                <span className="legend-indicator" style={{ background: '#fde047', boxShadow: '0 0 8px #fde047' }} />
                Over (+MW)
              </span>
              <span style={{ color: '#bae6fd' }}>
                <span className="legend-indicator" style={{ background: '#bae6fd', boxShadow: '0 0 8px #bae6fd' }} />
                Under (-MW)
              </span>
            </div>
          </div>

          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.records} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.12)" />
                <XAxis
                  dataKey="localTime"
                  stroke="rgba(255, 255, 255, 0.3)"
                  tick={{ fill: '#cbd5e1', fontSize: 11, fontFamily: 'var(--font-helvetica)' }}
                  interval={3}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255, 255, 255, 0.2)' }}
                />
                <YAxis
                  stroke="rgba(255, 255, 255, 0.3)"
                  tick={{ fill: '#cbd5e1', fontSize: 11, fontFamily: 'var(--font-helvetica)' }}
                  tickFormatter={(val) => `${val > 0 ? `+${val}` : val}`}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255, 255, 255, 0.2)' }}
                />
                <ReferenceLine y={0} stroke="rgba(255, 255, 255, 0.3)" strokeWidth={1} />
                <Tooltip content={<CustomAccuracyTooltip />} />
                <Bar dataKey="error" radius={[3, 3, 0, 0]}>
                  {data.records.map((entry, index) => (
                    <Cell
                      key={`cell-acc-swiss-${index}`}
                      fill={
                        entry.error !== null
                          ? entry.error > 0
                            ? '#fde047'
                            : '#bae6fd'
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

      {/* Half-Hourly Table */}
      <div className="table-glass-card motion-blur-in delay-6">
        <div className="table-card-header">
          <div>
            <h3 className="table-card-title">Half-Hourly Error Evaluation Log (48 Periods)</h3>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>
              Formula: <code className="mono">Signed Error = Forecast - Actual</code>
            </span>
          </div>
        </div>

        <div className="table-scroll-container">
          <table className="editorial-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>SP</th>
                <th>Delivery Time</th>
                <th style={{ textAlign: 'right' }}>Forecast</th>
                <th style={{ textAlign: 'right' }}>Actual Output</th>
                <th style={{ textAlign: 'right' }}>Signed Error</th>
                <th style={{ textAlign: 'right' }}>Absolute Error</th>
                <th style={{ textAlign: 'center' }}>Classification</th>
              </tr>
            </thead>
            <tbody>
              {data.records.map((row) => {
                const isRowOver = row.error !== null && row.error > 0.01;
                const isRowUnder = row.error !== null && row.error < -0.01;

                return (
                  <tr key={row.settlementPeriod}>
                    <td style={{ fontWeight: 700, color: '#38bdf8' }}>
                      #{row.settlementPeriod}
                    </td>
                    <td>{row.localTimeDisplay}</td>
                    <td className="tabular" style={{ textAlign: 'right', color: '#ffffff', fontWeight: 600 }}>
                      {row.forecastGeneration !== null
                        ? `${row.forecastGeneration.toLocaleString()} MW`
                        : '—'}
                    </td>
                    <td
                      className="tabular"
                      style={{ textAlign: 'right', fontWeight: 600, color: '#2dd4bf' }}
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
                        color: isRowOver ? '#fbbf24' : isRowUnder ? '#38bdf8' : '#94a3b8',
                      }}
                    >
                      {row.error !== null
                        ? `${row.error > 0 ? `+${row.error.toLocaleString()}` : row.error.toLocaleString()} MW`
                        : '—'}
                    </td>
                    <td className="tabular" style={{ textAlign: 'right', color: '#94a3b8' }}>
                      {row.absError !== null ? `${row.absError.toLocaleString()} MW` : '—'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {row.status === 'MATCHED' ? (
                        isRowOver ? (
                          <span className="status-pill pill-amber">Overforecast</span>
                        ) : isRowUnder ? (
                          <span className="status-pill pill-blue">Underforecast</span>
                        ) : (
                          <span className="status-pill pill-teal">Balanced</span>
                        )
                      ) : (
                        <span style={{ fontSize: '11px', color: '#9ca3af' }}>{row.status}</span>
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
