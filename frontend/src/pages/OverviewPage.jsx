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
import { Wind, TrendingUp, TrendingDown, Gauge, ShieldAlert } from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import { ContextBanner } from '../components/ContextBanner';

const CustomOverviewTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="custom-tooltip">
        <div className="tooltip-time">
          SP {data.settlementPeriod} • {data.localTimeDisplay} (London Time)
        </div>
        <div className="tooltip-row">
          <span style={{ color: '#0ea5e9' }}>Forecast Generation:</span>
          <strong className="num-tabular mono">
            {data.forecastGeneration !== null ? `${data.forecastGeneration.toLocaleString()} MW` : 'N/A'}
          </strong>
        </div>
        <div className="tooltip-row" style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
          <span>Publication Run:</span>
          <span className="mono">{data.publishTime || 'N/A'}</span>
        </div>
        <div className="tooltip-row" style={{ fontSize: '0.72rem', color: '#64748b' }}>
          <span>UTC Start:</span>
          <span className="mono">{data.startTime}</span>
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

  const minGen = genValues.length > 0 ? Math.min(...genValues) : null;
  const minItem = validSeries.find((s) => s.forecastGeneration === minGen);

  const avgGen =
    genValues.length > 0
      ? Math.round(genValues.reduce((a, b) => a + b, 0) / genValues.length)
      : null;

  return (
    <div>
      <ContextBanner
        decisionDate={data.decisionDate}
        deliveryDate={data.deliveryDate}
        decisionCutoffDisplay={data.decisionCutoffDisplay}
        latestForecastPublicationDisplay={data.latestForecastPublicationDisplay}
      />

      {/* KPI Cards */}
      <div className="kpi-grid">
        <MetricCard
          title="Peak Forecast Generation"
          value={peakGen ? peakGen.toLocaleString() : null}
          unit="MW"
          icon={TrendingUp}
          caption={peakItem ? `SP ${peakItem.settlementPeriod} (${peakItem.localTime})` : undefined}
          badge="High Output"
          badgeType="neutral"
        />

        <MetricCard
          title="Trough Forecast Generation"
          value={minGen ? minGen.toLocaleString() : null}
          unit="MW"
          icon={TrendingDown}
          caption={minItem ? `SP ${minItem.settlementPeriod} (${minItem.localTime})` : undefined}
          badge="Low Output"
          badgeType="neutral"
        />

        <MetricCard
          title="Average Generation"
          value={avgGen ? avgGen.toLocaleString() : null}
          unit="MW"
          icon={Gauge}
          caption="Day-ahead expected mean"
        />

        <MetricCard
          title="Schedule Coverage"
          value={`${data.forecastCoverageCount}/${data.totalIntervals}`}
          unit={`(${data.forecastCoveragePercent}%)`}
          icon={Wind}
          caption="Eligible half-hour settlement periods"
        />

        <MetricCard
          title="Post-Cutoff Excluded"
          value={data.excludedPostCutoffForecasts}
          unit="runs"
          icon={ShieldAlert}
          caption="Forecasts published after auction cutoff"
          badge="Zero Look-Ahead Bias"
          badgeType="neutral"
        />
      </div>

      {/* Chart Section */}
      <div className="chart-card">
        <div className="chart-card-header">
          <div className="chart-title-area">
            <h2>Day-Ahead National Wind Generation Forecast Profile</h2>
            <p>
              Selected forecast available at decision cutoff for delivery date {data.deliveryDate} (48 settlement periods).
            </p>
          </div>

          <div className="chart-legend-custom">
            <div className="legend-item">
              <span className="legend-color-dot" style={{ background: '#0ea5e9' }} />
              <span>Forecast Generation (MW)</span>
            </div>
          </div>
        </div>

        <div style={{ width: '100%', height: 340 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.series} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="forecastAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" />
              <XAxis
                dataKey="localTime"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                interval={3}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomOverviewTooltip />} />
              <Area
                type="monotone"
                dataKey="forecastGeneration"
                stroke="#0ea5e9"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#forecastAreaGrad)"
                name="Forecast Generation"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="notice-box">
          <strong>Procurement Scope Note:</strong> This chart reflects national UK wind generation from Elexon BMRS datasets only. It represents the renewable supply forecast available to the trading team prior to the day-ahead auction cutoff. It does not independently compute total grid demand or net electricity supply deficits.
        </div>
      </div>

      {/* Half-Hourly Table */}
      <div className="table-card">
        <div className="table-header-bar">
          <span className="table-header-title">
            Half-Hourly Forecast Schedule — 48 Settlement Periods
          </span>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            Resolution: 30 minutes • Delivery Date: {data.deliveryDate}
          </span>
        </div>

        <div className="table-responsive">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>SP</th>
                <th>London Time Window</th>
                <th>UTC Timestamp</th>
                <th>Forecast (MW)</th>
                <th>Publication Timestamp</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.series.map((row) => (
                <tr key={row.settlementPeriod}>
                  <td className="mono" style={{ color: '#0ea5e9', fontWeight: 600 }}>
                    #{row.settlementPeriod}
                  </td>
                  <td>{row.localTimeDisplay}</td>
                  <td className="mono" style={{ fontSize: '0.75rem' }}>{row.startTime}</td>
                  <td className="num-tabular mono" style={{ fontWeight: 600, color: '#f8fafc' }}>
                    {row.forecastGeneration !== null
                      ? `${row.forecastGeneration.toLocaleString()} MW`
                      : '—'}
                  </td>
                  <td className="mono" style={{ fontSize: '0.75rem' }}>
                    {row.publishTime || 'Unavailable'}
                  </td>
                  <td>
                    {row.isAvailable ? (
                      <span className="badge badge-neutral">Eligible Cutoff</span>
                    ) : (
                      <span className="badge badge-overforecast">Missing</span>
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
