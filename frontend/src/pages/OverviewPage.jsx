import React, { useState } from 'react';
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
      <div className="glass-editorial-tooltip">
        <div className="tooltip-top-label">
          SP {data.settlementPeriod} • {data.localTimeDisplay}
        </div>
        <div className="tooltip-row-item">
          <span>Forecast Wind:</span>
          <strong>
            {data.forecastGeneration !== null ? `${data.forecastGeneration.toLocaleString()} MW` : 'Unavailable'}
          </strong>
        </div>
        <div className="tooltip-row-item" style={{ fontSize: '11px', color: '#6b7280' }}>
          <span>Publication Run:</span>
          <span>{data.publishTime ? data.publishTime.slice(11, 16) + ' UTC' : '—'}</span>
        </div>
      </div>
    );
  }
  return null;
};

export const OverviewPage = ({ data }) => {
  const [showTable, setShowTable] = useState(false);

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
      {/* Editorial Section Header */}
      <div className="editorial-header-block">
        <div className="editorial-header-left">
          <span className="editorial-index-label">01 // Day-Ahead Forecast</span>
          <h2 className="editorial-title">National Wind Generation Profile</h2>
          <p className="editorial-sub">
            Day-ahead national wind output forecast published by National Grid ESO prior to gate closure, delivering on <strong>{data.deliveryDate}</strong>.
          </p>
        </div>

        <div className="editorial-meta-box">
          <span>DECISION: <strong>{data.decisionDate}</strong></span>
          <span>•</span>
          <span>CUTOFF: <strong>{data.decisionCutoffDisplay || '11:00 AM London'}</strong></span>
          <span>•</span>
          <span>RUN: <strong>{data.latestForecastPublicationDisplay || '—'}</strong></span>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="editorial-kpi-grid">
        <div className="kpi-glass-card">
          <div className="kpi-card-top">
            <span className="kpi-title" style={{ color: '#34d399' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px #34d399', display: 'inline-block' }} />
              Expected Daily Average
            </span>
            <span className="kpi-tag-code">SCHEDULED</span>
          </div>
          <div className="kpi-val-row">
            <span className="kpi-hero-number tabular">
              {avgGen ? avgGen.toLocaleString() : '—'}
            </span>
            <span className="kpi-unit-label">MW</span>
          </div>
          <div className="kpi-footer-text">Average expected power generation across the 24-hour delivery horizon</div>
        </div>

        <div className="kpi-glass-card">
          <div className="kpi-card-top">
            <span className="kpi-title" style={{ color: '#60a5fa' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#60a5fa', boxShadow: '0 0 6px #60a5fa', display: 'inline-block' }} />
              Peak Forecast Output
            </span>
            <span className="kpi-tag-code">PEAK_MAX</span>
          </div>
          <div className="kpi-val-row">
            <span className="kpi-hero-number tabular">
              {peakGen ? peakGen.toLocaleString() : '—'}
            </span>
            <span className="kpi-unit-label">MW</span>
          </div>
          <div className="kpi-footer-text">
            {peakItem ? `Settlement Period ${peakItem.settlementPeriod} (${peakItem.localTime})` : 'Peak forecast interval'}
          </div>
        </div>

        <div className="kpi-glass-card">
          <div className="kpi-card-top">
            <span className="kpi-title" style={{ color: '#9eb4c5' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#9eb4c5', boxShadow: '0 0 6px #9eb4c5', display: 'inline-block' }} />
              Forecast Coverage
            </span>
            <span className="kpi-tag-code">BMRS_STREAM</span>
          </div>
          <div className="kpi-val-row">
            <span className="kpi-hero-number tabular">
              {data.forecastCoverageCount}
            </span>
            <span className="kpi-unit-label">/ {data.totalIntervals} periods ({data.forecastCoveragePercent}%)</span>
          </div>
          <div className="kpi-footer-text">Elexon WINDFOR hourly stream resolution (no interpolated gaps)</div>
        </div>
      </div>

      {/* Primary Generation Profile Chart */}
      <div className="chart-glass-card">
        <div className="chart-card-header">
          <div>
            <h3 className="chart-heading-title">Expected Generation Curve</h3>
            <p className="chart-heading-sub">Half-hourly national wind forecast curve across 48 delivery periods (MW)</p>
          </div>

          <div className="chart-legend-editorial">
            <span>
              <span className="legend-indicator" style={{ background: '#ffffff', boxShadow: '0 0 8px rgba(255, 255, 255, 0.6)' }} />
              Forecast Generation (MW)
            </span>
          </div>
        </div>

        <div style={{ width: '100%', height: 340 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.series} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="editorialGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ffffff" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#bae6fd" stopOpacity={0.0} />
                </linearGradient>
              </defs>
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
              <Tooltip content={<CustomOverviewTooltip />} />
              <Area
                type="monotone"
                dataKey="forecastGeneration"
                stroke="#ffffff"
                strokeWidth={2.6}
                fillOpacity={1}
                fill="url(#editorialGrad)"
                name="Forecast"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Dispatch Schedule Audit Table */}
      <div className="table-glass-card">
        <div className="table-card-header">
          <div>
            <h3 className="table-card-title">Half-Hourly Dispatch Schedule (48 Settlement Periods)</h3>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>
              Delivery Date: <strong>{data.deliveryDate}</strong>
            </span>
          </div>

          <button
            className="btn-editorial-inspect"
            onClick={() => setShowTable(!showTable)}
          >
            {showTable ? 'Hide Table ▲' : 'View Full Table ▼'}
          </button>
        </div>

        {showTable && (
          <div className="table-scroll-container">
            <table className="editorial-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>SP</th>
                  <th>Delivery Window</th>
                  <th>UTC Timestamp</th>
                  <th style={{ textAlign: 'right' }}>Forecast Wind</th>
                  <th>Publication Run</th>
                </tr>
              </thead>
              <tbody>
                {data.series.map((row) => (
                  <tr key={row.settlementPeriod}>
                    <td style={{ fontWeight: 800, color: '#ffffff' }}>
                      #{row.settlementPeriod}
                    </td>
                    <td>{row.localTimeDisplay}</td>
                    <td style={{ color: '#cbd5e1', fontSize: '12px' }} className="mono">{row.startTime}</td>
                    <td
                      className="tabular"
                      style={{ textAlign: 'right', fontWeight: 800, color: '#ffffff' }}
                    >
                      {row.forecastGeneration !== null
                        ? `${row.forecastGeneration.toLocaleString()} MW`
                        : '—'}
                    </td>
                    <td style={{ color: '#cbd5e1', fontSize: '12px' }}>
                      {row.publishTime || 'Unavailable'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
