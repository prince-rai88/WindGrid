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
import { Wind, TrendingUp, Gauge } from 'lucide-react';

const CustomOverviewTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="glass-tooltip-rich">
        <div className="tooltip-time-rich">
          SP {data.settlementPeriod} • {data.localTimeDisplay} London
        </div>
        <div className="tooltip-val-row">
          <span style={{ color: '#0284c7', fontWeight: 600 }}>Forecast Generation:</span>
          <strong className="tabular" style={{ color: '#0284c7' }}>
            {data.forecastGeneration !== null ? `${data.forecastGeneration.toLocaleString()} MW` : 'Unavailable'}
          </strong>
        </div>
        <div className="tooltip-val-row" style={{ fontSize: '11px', color: '#64748b' }}>
          <span>Publication Run:</span>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
      {/* Page Intro Header */}
      <div className="page-intro">
        <div className="page-title-wrap">
          <h1>Day-Ahead Wind Forecast</h1>
          <p>
            National renewable forecast locked at day-ahead cutoff for delivery on{' '}
            <strong>{data.deliveryDate}</strong>.
          </p>
        </div>

        <div className="jewel-pill-row">
          <div className="jewel-pill">
            <span style={{ color: '#0284c7' }}>●</span>
            <span>Decision:</span>
            <strong>{data.decisionDate}</strong>
          </div>
          <div className="jewel-pill">
            <span style={{ color: '#059669' }}>●</span>
            <span>Cutoff:</span>
            <strong>{data.decisionCutoffDisplay || '11:00 London'}</strong>
          </div>
          <div className="jewel-pill">
            <span style={{ color: '#d97706' }}>●</span>
            <span>Latest Run:</span>
            <strong>{data.latestForecastPublicationDisplay || '—'}</strong>
          </div>
        </div>
      </div>

      {/* 3 Core Vivid Metric Cards */}
      <div className="metric-grid-rich">
        <div className="metric-card-rich">
          <div className="card-top-icon icon-cyan">
            <Gauge size={18} strokeWidth={2.4} />
          </div>
          <div className="card-label-rich">Expected Daily Mean</div>
          <div className="card-value-row">
            <span className="card-number-rich tabular" style={{ color: '#0284c7' }}>
              {avgGen ? avgGen.toLocaleString() : '—'}
            </span>
            <span className="card-unit-rich">MW</span>
          </div>
          <div className="card-sub-rich">Average generation across 48 delivery periods</div>
        </div>

        <div className="metric-card-rich">
          <div className="card-top-icon icon-emerald">
            <TrendingUp size={18} strokeWidth={2.4} />
          </div>
          <div className="card-label-rich">Peak Forecast Output</div>
          <div className="card-value-row">
            <span className="card-number-rich tabular" style={{ color: '#059669' }}>
              {peakGen ? peakGen.toLocaleString() : '—'}
            </span>
            <span className="card-unit-rich">MW</span>
          </div>
          <div className="card-sub-rich">
            {peakItem ? `SP ${peakItem.settlementPeriod} (${peakItem.localTime} London)` : 'Peak output period'}
          </div>
        </div>

        <div className="metric-card-rich">
          <div className="card-top-icon icon-indigo">
            <Wind size={18} strokeWidth={2.4} />
          </div>
          <div className="card-label-rich">Schedule Coverage</div>
          <div className="card-value-row">
            <span className="card-number-rich tabular" style={{ color: '#4f46e5' }}>
              {data.forecastCoverageCount}
            </span>
            <span className="card-unit-rich">/ {data.totalIntervals} periods ({data.forecastCoveragePercent}%)</span>
          </div>
          <div className="card-sub-rich">Elexon WINDFOR hourly resolution stream</div>
        </div>
      </div>

      {/* Vivid Primary Chart */}
      <div className="glass-panel-rich">
        <div className="glass-panel-header">
          <div className="panel-heading-rich">
            <h2>Day-Ahead National Wind Generation Curve</h2>
            <p>Half-hourly expected renewable generation across 48 delivery periods (MW)</p>
          </div>

          <div className="legend-rich-row">
            <span>
              <span className="legend-dot-rich" style={{ background: '#0284c7' }} />
              Forecast Generation (MW)
            </span>
          </div>
        </div>

        <div style={{ width: '100%', height: 350 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.series} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="richCyanGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.32} />
                  <stop offset="70%" stopColor="#10b981" stopOpacity={0.10} />
                  <stop offset="98%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
              <XAxis
                dataKey="localTime"
                stroke="#94a3b8"
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                interval={3}
                tickLine={false}
                axisLine={{ stroke: 'rgba(203, 213, 225, 0.6)' }}
              />
              <YAxis
                stroke="#94a3b8"
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                tickLine={false}
                axisLine={{ stroke: 'rgba(203, 213, 225, 0.6)' }}
              />
              <Tooltip content={<CustomOverviewTooltip />} />
              <Area
                type="monotone"
                dataKey="forecastGeneration"
                stroke="#0284c7"
                strokeWidth={2.8}
                fillOpacity={1}
                fill="url(#richCyanGrad)"
                name="Forecast"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Half-Hourly Table */}
      <div className="table-panel-rich">
        <div className="table-header-glass">
          <h3>Half-Hourly Dispatch Schedule — 48 Settlement Periods</h3>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
            Delivery Date: <strong>{data.deliveryDate}</strong>
          </span>
        </div>

        <div className="table-scroll-rich">
          <table className="rich-table">
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
                  <td style={{ fontWeight: 700, color: '#0284c7' }}>
                    #{row.settlementPeriod}
                  </td>
                  <td style={{ fontWeight: 500 }}>{row.localTimeDisplay}</td>
                  <td style={{ color: '#64748b', fontSize: '12px' }}>{row.startTime}</td>
                  <td
                    className="tabular"
                    style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}
                  >
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
