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
import { TradingTicker } from '../components/TradingTicker';

const CustomAccuracyTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isOver = data.error !== null && data.error > 0;
    const isUnder = data.error !== null && data.error < 0;

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
        <div className="tooltip-entry">
          <span style={{ color: '#8b949e' }}>OUTTURN ACTUAL:</span>
          <strong className="tabular" style={{ color: '#3fb950' }}>
            {data.actualGeneration !== null ? `${data.actualGeneration.toLocaleString()} MW` : 'N/A'}
          </strong>
        </div>
        {data.error !== null && (
          <div
            className="tooltip-entry"
            style={{
              marginTop: '4px',
              borderTop: '1px solid #21262d',
              paddingTop: '4px',
            }}
          >
            <span style={{ color: isOver ? '#d29922' : isUnder ? '#38bdf8' : '#8b949e' }}>
              SIGNED DELTA:
            </span>
            <strong
              className="tabular"
              style={{ color: isOver ? '#d29922' : isUnder ? '#38bdf8' : '#8b949e' }}
            >
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <TradingTicker
          decisionDate={data.decisionDate}
          deliveryDate={data.deliveryDate}
          cutoffDisplay={data.decisionCutoffDisplay}
          pubDisplay={data.latestForecastPublicationDisplay}
          coverageCount={0}
          totalIntervals={data.totalPeriods}
          coveragePercent={0}
        />
        <div className="trading-panel" style={{ padding: '30px', textAlign: 'center' }}>
          <span className="panel-title" style={{ color: '#d29922', justifyContent: 'center' }}>
            OUTTURN OR FORECAST RECORDS UNAVAILABLE FOR {data.deliveryDate}
          </span>
          <p style={{ color: '#8b949e', fontSize: '11px', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
            Elexon BMRS dataset stream returned no valid matched records for this delivery window.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <TradingTicker
        decisionDate={data.decisionDate}
        deliveryDate={data.deliveryDate}
        cutoffDisplay={data.decisionCutoffDisplay}
        pubDisplay={data.latestForecastPublicationDisplay}
        coverageCount={data.matchedPeriods}
        totalIntervals={data.totalPeriods}
        coveragePercent={data.coveragePercent}
        meanFc={data.meanForecastGeneration}
        mae={data.mae}
        rmse={data.rmse}
        bias={data.bias}
      />

      {/* Chart Section: 2 Columns on Desktop */}
      <div className="grid-2col">
        {/* Curve Comparison Chart */}
        <div className="trading-panel">
          <div className="trading-panel-header">
            <span className="panel-title">DA FORECAST VS OUTTURN ACTUAL CURVE (MW)</span>
            <div className="panel-tools">
              <span style={{ color: '#58a6ff', fontWeight: 600 }}>● FORECAST</span>
              <span style={{ color: '#3fb950', fontWeight: 600 }}>● ACTUAL</span>
            </div>
          </div>

          <div className="chart-body" style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.records} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
                <Tooltip content={<CustomAccuracyTooltip />} />
                <Area
                  type="monotone"
                  dataKey="forecastGeneration"
                  fill="rgba(56, 139, 253, 0.12)"
                  stroke="#388bfd"
                  strokeWidth={1.8}
                  name="Forecast"
                />
                <Line
                  type="monotone"
                  dataKey="actualGeneration"
                  stroke="#2ea043"
                  strokeWidth={2}
                  dot={false}
                  name="Actual"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Signed Error Distribution Chart */}
        <div className="trading-panel">
          <div className="trading-panel-header">
            <span className="panel-title">HALF-HOURLY IMBALANCE DELTA (FC - ACTUAL)</span>
            <div className="panel-tools">
              <span style={{ color: '#d29922', fontWeight: 600 }}>■ OVER (+MW)</span>
              <span style={{ color: '#38bdf8', fontWeight: 600 }}>■ UNDER (-MW)</span>
            </div>
          </div>

          <div className="chart-body" style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.records} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
                  tickFormatter={(val) => `${val > 0 ? `+${val}` : val}`}
                />
                <ReferenceLine y={0} stroke="#484f58" strokeWidth={1} />
                <Tooltip content={<CustomAccuracyTooltip />} />
                <Bar dataKey="error">
                  {data.records.map((entry, index) => (
                    <Cell
                      key={`cell-err-${index}`}
                      fill={
                        entry.error !== null
                          ? entry.error > 0
                            ? '#d29922'
                            : '#38bdf8'
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

      {/* Half-Hourly Financial Comparison Table */}
      <div className="trading-panel">
        <div className="trading-panel-header">
          <span className="panel-title">
            HALF-HOURLY QUANTITATIVE ACCURACY SHEET (48 PERIODS)
          </span>
          <span style={{ color: '#8b949e', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
            CONVENTION: <code style={{ color: '#58a6ff' }}>ERROR = FORECAST - ACTUAL</code>
          </span>
        </div>

        <div className="table-scroll">
          <table className="terminal-table">
            <thead>
              <tr>
                <th style={{ width: '48px' }}>SP</th>
                <th>LONDON WINDOW</th>
                <th style={{ textAlign: 'right' }}>DA FORECAST (MW)</th>
                <th style={{ textAlign: 'right' }}>OUTTURN ACTUAL (MW)</th>
                <th style={{ textAlign: 'right' }}>DELTA (MW)</th>
                <th style={{ textAlign: 'right' }}>|ERROR| (MW)</th>
                <th style={{ textAlign: 'right' }}>% ERROR</th>
                <th style={{ textAlign: 'center' }}>CLASSIFICATION</th>
              </tr>
            </thead>
            <tbody>
              {data.records.map((row) => {
                const isOver = row.error !== null && row.error > 0.01;
                const isUnder = row.error !== null && row.error < -0.01;

                return (
                  <tr key={row.settlementPeriod}>
                    <td style={{ color: '#58a6ff', fontWeight: 600 }}>#{row.settlementPeriod}</td>
                    <td>{row.localTimeDisplay}</td>
                    <td className="tabular" style={{ textAlign: 'right', color: '#c9d1d9' }}>
                      {row.forecastGeneration !== null
                        ? `${row.forecastGeneration.toLocaleString()} MW`
                        : '—'}
                    </td>
                    <td
                      className="tabular"
                      style={{ textAlign: 'right', color: '#3fb950', fontWeight: 500 }}
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
                        color: isOver ? '#d29922' : isUnder ? '#38bdf8' : '#8b949e',
                      }}
                    >
                      {row.error !== null
                        ? `${row.error > 0 ? `+${row.error.toLocaleString()}` : row.error.toLocaleString()} MW`
                        : '—'}
                    </td>
                    <td className="tabular" style={{ textAlign: 'right', color: '#8b949e' }}>
                      {row.absError !== null ? `${row.absError.toLocaleString()} MW` : '—'}
                    </td>
                    <td className="tabular" style={{ textAlign: 'right', color: '#8b949e' }}>
                      {row.percentageError !== null
                        ? `${row.percentageError > 0 ? `+${row.percentageError}` : row.percentageError}%`
                        : '—'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {row.status === 'MATCHED' ? (
                        isOver ? (
                          <span className="tag-pill tag-over">OVERFORECAST</span>
                        ) : isUnder ? (
                          <span className="tag-pill tag-under">UNDERFORECAST</span>
                        ) : (
                          <span className="tag-pill tag-exact">BALANCED</span>
                        )
                      ) : (
                        <span className="tag-pill tag-dim">{row.status}</span>
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
