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
import { TradingTicker } from '../components/TradingTicker';

const CustomOverviewTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="terminal-tooltip">
        <div className="tooltip-header">
          SP {data.settlementPeriod} • {data.localTimeDisplay} London
        </div>
        <div className="tooltip-entry">
          <span style={{ color: '#8b949e' }}>DA FORECAST:</span>
          <strong className="tabular" style={{ color: '#58a6ff' }}>
            {data.forecastGeneration !== null ? `${data.forecastGeneration.toLocaleString()} MW` : 'N/A'}
          </strong>
        </div>
        <div className="tooltip-entry" style={{ fontSize: '10px', color: '#6e7681' }}>
          <span>RUN PUBLISHED:</span>
          <span>{data.publishTime || '—'}</span>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <TradingTicker
        decisionDate={data.decisionDate}
        deliveryDate={data.deliveryDate}
        cutoffDisplay={data.decisionCutoffDisplay}
        pubDisplay={data.latestForecastPublicationDisplay}
        coverageCount={data.forecastCoverageCount}
        totalIntervals={data.totalIntervals}
        coveragePercent={data.forecastCoveragePercent}
        meanFc={avgGen}
        peakFc={peakGen}
        peakSp={peakItem?.settlementPeriod}
      />

      {/* Chart Section */}
      <div className="trading-panel">
        <div className="trading-panel-header">
          <span className="panel-title">
            NATIONAL WIND GENERATION — DAY-AHEAD FORECAST CURVE (MW)
          </span>
          <div className="panel-tools">
            <span style={{ color: '#58a6ff', fontWeight: 600 }}>● DA FORECAST</span>
            <span style={{ color: '#6e7681' }}>|</span>
            <span style={{ color: '#8b949e', fontSize: '10px' }}>ELEXON BMRS WINDFOR STREAM</span>
          </div>
        </div>

        <div className="chart-body" style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.series} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="terminalBlueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#388bfd" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#388bfd" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
              <XAxis
                dataKey="localTime"
                stroke="#484f58"
                tick={{ fill: '#8b949e', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                interval={3}
              />
              <YAxis
                stroke="#484f58"
                tick={{ fill: '#8b949e', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomOverviewTooltip />} />
              <Area
                type="monotone"
                dataKey="forecastGeneration"
                stroke="#388bfd"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#terminalBlueGrad)"
                name="Forecast"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Half-Hourly Trading Sheet Table */}
      <div className="trading-panel">
        <div className="trading-panel-header">
          <span className="panel-title">
            HALF-HOURLY PROCUREMENT DISPATCH SCHEDULE — 48 SETTLEMENT PERIODS
          </span>
          <span style={{ color: '#8b949e', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
            DELIVERY: {data.deliveryDate} (00:00 - 24:00 LONDON)
          </span>
        </div>

        <div className="table-scroll">
          <table className="terminal-table">
            <thead>
              <tr>
                <th style={{ width: '48px' }}>SP</th>
                <th>LONDON WINDOW</th>
                <th>UTC START</th>
                <th style={{ textAlign: 'right' }}>DA FORECAST (MW)</th>
                <th>PUBLICATION RUN</th>
                <th style={{ textAlign: 'center' }}>ELIGIBILITY</th>
              </tr>
            </thead>
            <tbody>
              {data.series.map((row) => (
                <tr key={row.settlementPeriod}>
                  <td style={{ color: '#58a6ff', fontWeight: 600 }}>#{row.settlementPeriod}</td>
                  <td>{row.localTimeDisplay}</td>
                  <td style={{ color: '#8b949e' }}>{row.startTime}</td>
                  <td
                    className="tabular"
                    style={{ textAlign: 'right', fontWeight: 600, color: '#f0f6fc' }}
                  >
                    {row.forecastGeneration !== null
                      ? `${row.forecastGeneration.toLocaleString()} MW`
                      : '—'}
                  </td>
                  <td style={{ color: '#8b949e' }}>{row.publishTime || 'Unavailable'}</td>
                  <td style={{ textAlign: 'center' }}>
                    {row.isAvailable ? (
                      <span className="tag-pill tag-exact">ELIGIBLE</span>
                    ) : (
                      <span className="tag-pill tag-dim">UNAVAILABLE</span>
                    )}
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
