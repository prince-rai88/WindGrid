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
import { Calendar, Target, Activity, Compass, ArrowRight, BarChart3 } from 'lucide-react';
import { MetricCard } from '../components/MetricCard';

export const HistoryPage = ({ data, onSelectDate }) => {
  if (!data) return null;

  const agg = data.aggregateMetrics || {};
  const isNetOver = agg.bias !== null && agg.bias > 0;

  return (
    <div>
      {/* Scope Banner */}
      <div className="context-banner">
        <div className="context-banner-left">
          <div className="context-banner-icon">
            <Calendar size={20} />
          </div>
          <div className="context-banner-text">
            <h3>January 2026 Month-Wide Historical Evaluation</h3>
            <p>
              Aggregate evaluation of all 31 purchasing decision dates made in January 2026 (delivering 2 Jan 2026 – 1 Feb 2026).
            </p>
          </div>
        </div>

        <div className="context-pills">
          <div className="pill">
            <span>Evaluated Decisions:</span>
            <strong className="mono">{data.daysEvaluated} Days</strong>
          </div>
          <div className="pill">
            <span>Total Matched Half-Hours:</span>
            <strong className="mono">{agg.totalMatchedHalfHours} Periods</strong>
          </div>
          <div className="pill">
            <span>Gate Closure Cutoff:</span>
            <strong>{data.decisionCutoff}</strong>
          </div>
        </div>
      </div>

      {/* Aggregate KPI Cards */}
      <div className="kpi-grid">
        <MetricCard
          title="January Mean Absolute Error (MAE)"
          value={agg.mae !== null ? agg.mae.toLocaleString() : null}
          unit="MW"
          icon={Target}
          caption="Month-wide average forecast error"
          badge="Jan 2026 Aggregate"
          badgeType="neutral"
        />

        <MetricCard
          title="January Root Mean Squared Error"
          value={agg.rmse !== null ? agg.rmse.toLocaleString() : null}
          unit="MW"
          icon={Activity}
          caption="Month-wide RMSE magnitude"
          badge="RMSE Metric"
          badgeType="neutral"
        />

        <MetricCard
          title="January Systemic Forecast Bias"
          value={agg.bias !== null ? (agg.bias > 0 ? `+${agg.bias}` : agg.bias) : null}
          unit="MW"
          icon={Compass}
          caption={agg.biasInterpretation}
          badge={isNetOver ? `+${agg.bias} MW Net Over` : `${agg.bias} MW Net Under`}
          badgeType={isNetOver ? 'overforecast' : 'underforecast'}
        />

        <MetricCard
          title="Total Matched Periods"
          value={agg.totalMatchedHalfHours ? agg.totalMatchedHalfHours.toLocaleString() : null}
          unit="SP"
          icon={BarChart3}
          caption="30-min resolution periods verified"
        />

        <MetricCard
          title="Overall Balance"
          value={`${agg.overallOverforecastPeriods} / ${agg.overallUnderforecastPeriods}`}
          unit="Over / Under"
          caption="Total periods over vs underforecast"
          badge={
            agg.overallOverforecastPeriods > agg.overallUnderforecastPeriods
              ? 'Overforecast Predominant'
              : 'Underforecast Predominant'
          }
          badgeType="neutral"
        />
      </div>

      {/* Daily Error Trends */}
      <div className="chart-card">
        <div className="chart-card-header">
          <div className="chart-title-area">
            <h2>Daily Forecast Error Magnitudes (MAE & RMSE) across January 2026</h2>
            <p>Tracking forecast uncertainty day-by-day across all decisions made in January 2026.</p>
          </div>

          <div className="chart-legend-custom">
            <div className="legend-item">
              <span className="legend-color-dot" style={{ background: '#0ea5e9' }} />
              <span>Daily MAE (MW)</span>
            </div>
            <div className="legend-item">
              <span className="legend-color-dot" style={{ background: '#f43f5e' }} />
              <span>Daily RMSE (MW)</span>
            </div>
          </div>
        </div>

        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data.dailyResults} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" />
              <XAxis
                dataKey="decisionDate"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickFormatter={(val) => val.slice(8)} // show day
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickFormatter={(val) => `${val}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="custom-tooltip">
                        <div className="tooltip-time">
                          Decision: {d.decisionDate} • Delivery: {d.deliveryDate}
                        </div>
                        <div className="tooltip-row">
                          <span style={{ color: '#0ea5e9' }}>MAE:</span>
                          <strong className="mono">{d.mae} MW</strong>
                        </div>
                        <div className="tooltip-row">
                          <span style={{ color: '#f43f5e' }}>RMSE:</span>
                          <strong className="mono">{d.rmse} MW</strong>
                        </div>
                        <div className="tooltip-row">
                          <span>Mean Actual:</span>
                          <strong className="mono">{d.meanActual} MW</strong>
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
                stroke="#0ea5e9"
                strokeWidth={2}
                dot={{ r: 3, fill: '#0ea5e9' }}
                name="MAE"
              />
              <Line
                type="monotone"
                dataKey="rmse"
                stroke="#f43f5e"
                strokeWidth={2}
                dot={{ r: 3, fill: '#f43f5e' }}
                name="RMSE"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daily Signed Bias */}
      <div className="chart-card">
        <div className="chart-card-header">
          <div className="chart-title-area">
            <h2>Daily Signed Forecast Bias across January 2026 (error = forecast - actual)</h2>
            <p>Amber bars = overforecast day (wind came in lower than expected). Cyan bars = underforecast day.</p>
          </div>

          <div className="chart-legend-custom">
            <div className="legend-item">
              <span className="legend-color-dot" style={{ background: '#f59e0b' }} />
              <span>Overforecast Bias (+MW)</span>
            </div>
            <div className="legend-item">
              <span className="legend-color-dot" style={{ background: '#06b6d4' }} />
              <span>Underforecast Bias (-MW)</span>
            </div>
          </div>
        </div>

        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.dailyResults} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" />
              <XAxis
                dataKey="decisionDate"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickFormatter={(val) => val.slice(8)}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickFormatter={(val) => `${val > 0 ? `+${val}` : val}`}
              />
              <ReferenceLine y={0} stroke="#64748b" strokeWidth={1.5} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="custom-tooltip">
                        <div className="tooltip-time">
                          Decision: {d.decisionDate} • Delivery: {d.deliveryDate}
                        </div>
                        <div className="tooltip-row">
                          <span>Signed Bias:</span>
                          <strong className="mono" style={{ color: d.bias > 0 ? '#fbbf24' : '#38bdf8' }}>
                            {d.bias > 0 ? `+${d.bias}` : d.bias} MW
                          </strong>
                        </div>
                        <div className="tooltip-row">
                          <span>Periods:</span>
                          <span>{d.overforecastCount} Over / {d.underforecastCount} Under</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="bias">
                {data.dailyResults.map((entry, index) => (
                  <Cell
                    key={`bar-bias-${index}`}
                    fill={
                      entry.bias !== null
                        ? entry.bias > 0
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

      {/* Daily Breakdown Table */}
      <div className="table-card">
        <div className="table-header-bar">
          <span className="table-header-title">
            January 2026 Daily Evaluation Breakdown (31 Decision Days)
          </span>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            Click "Inspect Day" to analyze half-hourly profile for that date
          </span>
        </div>

        <div className="table-responsive">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Decision Date</th>
                <th>Delivery Date</th>
                <th>MAE (MW)</th>
                <th>RMSE (MW)</th>
                <th>Signed Bias (MW)</th>
                <th>Mean Forecast</th>
                <th>Mean Actual</th>
                <th>Periods</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.dailyResults.map((row) => {
                const isOver = row.bias !== null && row.bias > 0;
                return (
                  <tr key={row.decisionDate}>
                    <td className="mono" style={{ color: '#0ea5e9', fontWeight: 600 }}>
                      {row.decisionDate}
                    </td>
                    <td className="mono">{row.deliveryDate}</td>
                    <td className="num-tabular mono">{row.mae !== null ? `${row.mae} MW` : '—'}</td>
                    <td className="num-tabular mono">{row.rmse !== null ? `${row.rmse} MW` : '—'}</td>
                    <td
                      className="num-tabular mono"
                      style={{
                        fontWeight: 600,
                        color: isOver ? '#fbbf24' : '#38bdf8',
                      }}
                    >
                      {row.bias !== null ? `${row.bias > 0 ? `+${row.bias}` : row.bias} MW` : '—'}
                    </td>
                    <td className="num-tabular mono">
                      {row.meanForecast !== null ? `${row.meanForecast} MW` : '—'}
                    </td>
                    <td className="num-tabular mono" style={{ color: '#10b981' }}>
                      {row.meanActual !== null ? `${row.meanActual} MW` : '—'}
                    </td>
                    <td className="num-tabular mono">{row.matchedPeriods}/48</td>
                    <td>
                      <button
                        className="quick-date-btn"
                        onClick={() => onSelectDate(row.decisionDate)}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        Inspect <ArrowRight size={12} />
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
