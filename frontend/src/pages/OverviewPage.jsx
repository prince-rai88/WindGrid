import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

const CustomOverviewTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="apple-tooltip">
        <div className="tooltip-title">
          SP {data.settlementPeriod} • {data.localTimeDisplay}
        </div>
        <div className="tooltip-row">
          <span>Forecast:</span>
          <strong className="tabular">
            {data.forecastGeneration !== null ? `${data.forecastGeneration.toLocaleString()} MW` : 'Unavailable'}
          </strong>
        </div>
        <div className="tooltip-row" style={{ fontSize: '11px', color: '#94a3b8' }}>
          <span>Published:</span>
          <span>{data.publishTime ? data.publishTime.slice(11, 16) + ' UTC' : '—'}</span>
        </div>
      </div>
    );
  }
  return null;
};

export const OverviewPage = ({ data }) => {
  if (!data) return null;

  const validSeries = data.series.filter((s) => s.forecastGeneration !== null);
  const genValues = validSeries.map((s) => s.forecastGeneration);

  const peakGen = genValues.length > 0 ? Math.max(...genValues) : null;
  const peakItem = validSeries.find((s) => s.forecastGeneration === peakGen);
  const avgGen =
    genValues.length > 0
      ? Math.round(genValues.reduce((a, b) => a + b, 0) / genValues.length)
      : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header Context */}
      <div className="page-header">
        <div className="page-header-text">
          <h1>Day-Ahead Wind Forecast</h1>
          <p>
            National renewable generation forecast available at decision cutoff for delivery on{' '}
            <strong>{data.deliveryDate}</strong>.
          </p>
        </div>

        <div className="meta-pill-group">
          <div className="meta-pill">
            <span>Decision:</span>
            <strong>{data.decisionDate}</strong>
          </div>
          <div className="meta-pill">
            <span>Cutoff:</span>
            <strong>{data.decisionCutoffDisplay || '11:00 London'}</strong>
          </div>
          <div className="meta-pill">
            <span>Latest Run:</span>
            <strong>{data.latestForecastPublicationDisplay || '—'}</strong>
          </div>
        </div>
      </div>

      {/* 3 Core Metric Cards */}
      <div className="stat-strip">
        <div className="stat-card">
          <div className="stat-label">Expected Daily Mean</div>
          <div className="stat-value-group">
            <span className="stat-number tabular">
              {avgGen ? avgGen.toLocaleString() : '—'}
            </span>
            <span className="stat-unit">MW</span>
          </div>
          <div className="stat-subtext">Day-ahead average expected generation</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Peak Forecast Output</div>
          <div className="stat-value-group">
            <span className="stat-number tabular">
              {peakGen ? peakGen.toLocaleString() : '—'}
            </span>
            <span className="stat-unit">MW</span>
          </div>
          <div className="stat-subtext">
            {peakItem ? `SP ${peakItem.settlementPeriod} (${peakItem.localTime} London)` : 'Peak output period'}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Delivery Schedule Coverage</div>
          <div className="stat-value-group">
            <span className="stat-number tabular">
              {data.forecastCoverageCount}
            </span>
            <span className="stat-unit">/ {data.totalIntervals} periods ({data.forecastCoveragePercent}%)</span>
          </div>
          <div className="stat-subtext">Elexon WINDFOR hourly resolution stream</div>
        </div>
      </div>

      {/* Spacious Primary Chart */}
      <div className="chart-panel">
        <div className="chart-panel-header">
          <div className="chart-panel-title">
            <h2>Forecast Generation Curve</h2>
            <p>Half-hourly national wind generation across 48 delivery periods (MW)</p>
          </div>

          <div className="chart-legend">
            <span>
              <span className="legend-dot" style={{ background: '#2d6a4f' }} />
              Forecast Generation
            </span>
          </div>
        </div>

        <div style={{ width: '100%', height: 340 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.series} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="appleGreenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2d6a4f" stopOpacity={0.16} />
                  <stop offset="95%" stopColor="#2d6a4f" stopOpacity={0.0} />
                </linearGradient>
              </defs>
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
              <Tooltip content={<CustomOverviewTooltip />} />
              <Area
                type="monotone"
                dataKey="forecastGeneration"
                stroke="#2d6a4f"
                strokeWidth={2.2}
                fillOpacity={1}
                fill="url(#appleGreenGrad)"
                name="Forecast"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Half-Hourly Delivery Schedule Table */}
      <div className="table-panel">
        <div className="table-panel-header">
          <span className="table-panel-title">
            Half-Hourly Dispatch Schedule — 48 Settlement Periods
          </span>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
            Delivery Date: {data.deliveryDate}
          </span>
        </div>

        <div className="table-scroll">
          <table className="apple-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>SP</th>
                <th>London Time Window</th>
                <th>UTC Start</th>
                <th style={{ textAlign: 'right' }}>Forecast Generation</th>
                <th>Publication Run</th>
              </tr>
            </thead>
            <tbody>
              {data.series.map((row) => (
                <tr key={row.settlementPeriod}>
                  <td style={{ fontWeight: 600, color: '#2d6a4f' }}>
                    #{row.settlementPeriod}
                  </td>
                  <td>{row.localTimeDisplay}</td>
                  <td style={{ color: '#94a3b8', fontSize: '12px' }}>{row.startTime}</td>
                  <td className="tabular" style={{ textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                    {row.forecastGeneration !== null
                      ? `${row.forecastGeneration.toLocaleString()} MW`
                      : '—'}
                  </td>
                  <td style={{ color: '#64748b', fontSize: '12px' }}>
                    {row.publishTime || 'Unavailable'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
