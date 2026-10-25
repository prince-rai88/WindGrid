import React from 'react';

export const TradingTicker = ({
  decisionDate,
  deliveryDate,
  cutoffDisplay,
  pubDisplay,
  coverageCount,
  totalIntervals,
  coveragePercent,
  meanFc,
  peakFc,
  peakSp,
  mae,
  rmse,
  bias,
}) => {
  const isOver = bias !== null && bias > 0;
  const isUnder = bias !== null && bias < 0;

  return (
    <div className="trading-ticker">
      <div className="ticker-group">
        <div className="ticker-item">
          <span className="ticker-label">DECISION:</span>
          <span className="ticker-val">{decisionDate}</span>
        </div>
        <div className="ticker-item">
          <span className="ticker-label">DELIVERY:</span>
          <span className="ticker-val accent-blue">{deliveryDate}</span>
        </div>
        <div className="ticker-item">
          <span className="ticker-label">AUCTION CUTOFF:</span>
          <span className="ticker-val">{cutoffDisplay || '11:00 London'}</span>
        </div>
        <div className="ticker-item">
          <span className="ticker-label">LATEST RUN:</span>
          <span className="ticker-val accent-green">{pubDisplay || '—'}</span>
        </div>
      </div>

      <div className="ticker-group">
        {meanFc !== undefined && (
          <div className="ticker-item">
            <span className="ticker-label">MEAN FC:</span>
            <span className="ticker-val tabular">{meanFc ? `${meanFc.toLocaleString()} MW` : '—'}</span>
          </div>
        )}
        {peakFc !== undefined && (
          <div className="ticker-item">
            <span className="ticker-label">PEAK FC:</span>
            <span className="ticker-val tabular">
              {peakFc ? `${peakFc.toLocaleString()} MW` : '—'} {peakSp ? `(SP ${peakSp})` : ''}
            </span>
          </div>
        )}
        {mae !== undefined && mae !== null && (
          <div className="ticker-item">
            <span className="ticker-label">MAE:</span>
            <span className="ticker-val tabular">{`${mae.toLocaleString()} MW`}</span>
          </div>
        )}
        {rmse !== undefined && rmse !== null && (
          <div className="ticker-item">
            <span className="ticker-label">RMSE:</span>
            <span className="ticker-val tabular">{`${rmse.toLocaleString()} MW`}</span>
          </div>
        )}
        {bias !== undefined && bias !== null && (
          <div className="ticker-item">
            <span className="ticker-label">BIAS:</span>
            <span
              className={`ticker-val tabular ${isOver ? 'accent-amber' : isUnder ? 'accent-cyan' : ''}`}
            >
              {bias > 0 ? `+${bias}` : bias} MW {isOver ? '[OVER]' : isUnder ? '[UNDER]' : ''}
            </span>
          </div>
        )}
        <div className="ticker-item">
          <span className="ticker-label">MATCHED SP:</span>
          <span className="ticker-val tabular">
            {coverageCount !== undefined ? `${coverageCount}/${totalIntervals || 48} (${coveragePercent}%)` : '—'}
          </span>
        </div>
      </div>
    </div>
  );
};
