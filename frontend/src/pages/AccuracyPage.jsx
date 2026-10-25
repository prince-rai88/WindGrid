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
import {
  Activity,
  Target,
  Compass,
  CheckCircle,
  AlertTriangle,
  Scale,
} from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import { ContextBanner } from '../components/ContextBanner';

const CustomAccuracyTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isOver = data.error !== null && data.error > 0;
    const isUnder = data.error !== null && data.error < 0;

    return (
      <div className="custom-tooltip">
        <div className="tooltip-time">
          SP {data.settlementPeriod} • {data.localTimeDisplay} (London Time)
        </div>
        <div className="tooltip-row">
          <span style={{ color: '#0ea5e9' }}>Forecast:</span>
          <strong className="num-tabular mono">
            {data.forecastGeneration !== null ? `${data.forecastGeneration.toLocaleString()} MW` : 'N/A'}
          </strong>
        </div>
        <div className="tooltip-row">
          <span style={{ color: '#10b981' }}>Actual:</span>
          <strong className="num-tabular mono">
            {data.actualGeneration !== null ? `${data.actualGeneration.toLocaleString()} MW` : 'N/A'}
          </strong>
        </div>
        {data.error !== null && (
          <div className="tooltip-row" style={{ marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '4px' }}>
            <span style={{ color: isOver ? '#fbbf24' : isUnder ? '#38bdf8' : '#94a3b8' }}>
              Signed Error:
            </span>
            <strong className="num-tabular mono" style={{ color: isOver ? '#fbbf24' : isUnder ? '#38bdf8' : '#94a3b8' }}>
              {data.error > 0 ? `+${data.error.toLocaleString()}` : data.error.toLocaleString()} MW
              {data.percentageError !== null && ` (${data.percentageError > 0 ? `+${data.percentageError}` : data.percentageError}%)`}
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
      <div>
        <ContextBanner
          decisionDate={data.decisionDate}
          deliveryDate={data.deliveryDate}
          decisionCutoffDisplay={data.decisionCutoffDisplay}
          latestForecastPublicationDisplay={data.latestForecastPublicationDisplay}
        />
        <div className="state-container table-card">
          <AlertTriangle size={42} color="#f59e0b" />
          <h3>Accuracy Data Unavailable for Selected Date</h3>
          <p style={{ color: '#94a3b8', maxWidth: '500px', fontSize: '0.85rem' }}>
            Either forecast or actual generation data from Elexon BMRS is missing for {data.deliveryDate}. In accordance with strict auditing standards, no fabricated or zero values are substituted.
          </p>
        </div>
      </div>
    );
  }

  const isOverforecastNet = data.bias !== null && data.bias > 0;
  const biasLabel = isOverforecastNet
    ? `Net Overforecast (+${data.bias} MW)`
    : `Net Underforecast (${data.bias} MW)`;
  const biasBadgeType = isOverforecastNet ? 'overforecast' : 'underforecast';

  return (
    <div>
      <ContextBanner
        decisionDate={data.decisionDate}
        deliveryDate={data.deliveryDate}
        decisionCutoffDisplay={data.decisionCutoffDisplay}
        latestForecastPublicationDisplay={data.latestForecastPublicationDisplay}
      />

      {/* KPI Metrics Grid */}
      <div className="kpi-grid">
        <MetricCard
          title="Mean Absolute Error (MAE)"
          value={data.mae !== null ? data.mae.toLocaleString() : null}
          unit="MW"
          icon={Target}
          caption="Average absolute error magnitude"
          badge="MAE Metric"
          badgeType="neutral"
        />

        <MetricCard
          title="Root Mean Squared Error (RMSE)"
          value={data.rmse !== null ? data.rmse.toLocaleString() : null}
          unit="MW"
          icon={Activity}
          caption="Penalizes large forecast excursions"
          badge="RMSE Metric"
          badgeType="neutral"
        />

        <MetricCard
          title="Forecast Bias (Mean Signed Error)"
          value={data.bias !== null ? (data.bias > 0 ? `+${data.bias}` : data.bias) : null}
          unit="MW"
          icon={Compass}
          caption="Positive = Overforecast, Negative = Underforecast"
          badge={biasLabel}
          badgeType={biasBadgeType}
        />

        <MetricCard
          title="Matched Delivery Coverage"
          value={`${data.matchedPeriods}/${data.totalPeriods}`}
          unit={`(${data.coveragePercent}%)`}
          icon={CheckCircle}
          caption="Valid matched forecast & actual pairs"
        />

        <MetricCard
          title="Forecast Balance"
          value={`${data.overforecastCount} Over / ${data.underforecastCount} Under`}
          unit=""
          icon={Scale}
          caption={`${data.exactCount} periods within 0.01 MW`}
          badge={`${data.overforecastCount > data.underforecastCount ? 'Over' : 'Under'}forecast skew`}
          badgeType="neutral"
        />
      </div>

      {/* Chart 1: Forecast vs Actual Generation Profile */}
      <div className="chart-card">
        <div className="chart-card-header">
          <div className="chart-title-area">
            <h2>Forecast vs Actual Wind Generation Profile</h2>
            <p>
              Delivery Date: {data.deliveryDate} • Matched across 48 half-hour settlement periods.
            </p>
          </div>

          <div className="chart-legend-custom">
            <div className="legend-item">
              <span className="legend-color-dot" style={{ background: '#0ea5e9' }} />
              <span>Selected Day-Ahead Forecast</span>
            </div>
            <div className="legend-item">
              <span className="legend-color-dot" style={{ background: '#10b981' }} />
              <span>Actual Wind Generation (FUELHH)</span>
            </div>
          </div>
        </div>

        <div style={{ width: '100%', height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data.records} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
              <Tooltip content={<CustomAccuracyTooltip />} />
              <Area
                type="monotone"
                dataKey="forecastGeneration"
                fill="rgba(14, 165, 233, 0.12)"
                stroke="#0ea5e9"
                strokeWidth={2}
                name="Forecast"
              />
              <Line
                type="monotone"
                dataKey="actualGeneration"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={false}
                name="Actual"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Signed Forecast Error Distribution */}
      <div className="chart-card">
        <div className="chart-card-header">
          <div className="chart-title-area">
            <h2>Half-Hourly Signed Forecast Error (error = forecast - actual)</h2>
            <p>
              Amber bars indicate overforecast (forecast &gt; actual). Cyan bars indicate underforecast (forecast &lt; actual).
            </p>
          </div>

          <div className="chart-legend-custom">
            <div className="legend-item">
              <span className="legend-color-dot" style={{ background: '#f59e0b' }} />
              <span>Overforecast (+MW)</span>
            </div>
            <div className="legend-item">
              <span className="legend-color-dot" style={{ background: '#06b6d4' }} />
              <span>Underforecast (-MW)</span>
            </div>
          </div>
        </div>

        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.records} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
                tickFormatter={(val) => `${val > 0 ? `+${val}` : val}`}
              />
              <ReferenceLine y={0} stroke="#64748b" strokeWidth={1.5} />
              <Tooltip content={<CustomAccuracyTooltip />} />
              <Bar dataKey="error">
                {data.records.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.error !== null
                        ? entry.error > 0
                          ? '#f59e0b'
                          : '#06b6d4'
                        : 'transparent'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Half-Hourly Comparison Table */}
      <div className="table-card">
        <div className="table-header-bar">
          <span className="table-header-title">
            Half-Hourly Accuracy Comparison Table (48 Periods)
          </span>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            Signed Error Formula: <code className="mono">error = forecast - actual</code>
          </span>
        </div>

        <div className="table-responsive">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>SP</th>
                <th>London Time Window</th>
                <th>Forecast (MW)</th>
                <th>Actual (MW)</th>
                <th>Signed Error (MW)</th>
                <th>Abs Error (|e|)</th>
                <th>% Error</th>
                <th>Classification</th>
              </tr>
            </thead>
            <tbody>
              {data.records.map((row) => {
                const isOver = row.error !== null && row.error > 0.01;
                const isUnder = row.error !== null && row.error < -0.01;

                return (
                  <tr key={row.settlementPeriod}>
                    <td className="mono" style={{ color: '#0ea5e9', fontWeight: 600 }}>
                      #{row.settlementPeriod}
                    </td>
                    <td>{row.localTimeDisplay}</td>
                    <td className="num-tabular mono" style={{ color: '#f8fafc' }}>
                      {row.forecastGeneration !== null ? `${row.forecastGeneration.toLocaleString()} MW` : '—'}
                    </td>
                    <td className="num-tabular mono" style={{ color: '#10b981', fontWeight: 500 }}>
                      {row.actualGeneration !== null ? `${row.actualGeneration.toLocaleString()} MW` : '—'}
                    </td>
                    <td
                      className="num-tabular mono"
                      style={{
                        fontWeight: 600,
                        color: isOver ? '#fbbf24' : isUnder ? '#38bdf8' : '#94a3b8',
                      }}
                    >
                      {row.error !== null
                        ? `${row.error > 0 ? `+${row.error.toLocaleString()}` : row.error.toLocaleString()} MW`
                        : '—'}
                    </td>
                    <td className="num-tabular mono">
                      {row.absError !== null ? `${row.absError.toLocaleString()} MW` : '—'}
                    </td>
                    <td className="num-tabular mono">
                      {row.percentageError !== null
                        ? `${row.percentageError > 0 ? `+${row.percentageError}` : row.percentageError}%`
                        : '—'}
                    </td>
                    <td>
                      {row.status === 'MATCHED' ? (
                        isOver ? (
                          <span className="badge badge-overforecast">Overforecast</span>
                        ) : isUnder ? (
                          <span className="badge badge-underforecast">Underforecast</span>
                        ) : (
                          <span className="badge badge-neutral">Exact</span>
                        )
                      ) : (
                        <span className="badge badge-neutral">{row.status}</span>
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
