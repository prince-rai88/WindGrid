import React from 'react';

export const MetricCard = ({
  title,
  value,
  unit,
  caption,
  icon: Icon,
  badge,
  badgeType = 'neutral',
}) => {
  return (
    <div className="kpi-card">
      <div className="kpi-header">
        <span className="kpi-title">{title}</span>
        {Icon && <Icon size={16} className="kpi-icon" />}
      </div>
      <div className="kpi-value-row">
        <span className="kpi-value num-tabular">
          {value !== null && value !== undefined ? value : '—'}
        </span>
        {unit && <span className="kpi-unit">{unit}</span>}
      </div>
      {badge && (
        <div style={{ marginTop: '6px' }}>
          <span className={`badge badge-${badgeType}`}>{badge}</span>
        </div>
      )}
      {caption && <div className="kpi-caption">{caption}</div>}
    </div>
  );
};
