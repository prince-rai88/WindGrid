import React from 'react';
import { Info, Clock, Calendar, CheckCircle2 } from 'lucide-react';

export const ContextBanner = ({
  decisionDate,
  deliveryDate,
  decisionCutoffDisplay,
  latestForecastPublicationDisplay,
}) => {
  return (
    <div className="context-banner">
      <div className="context-banner-left">
        <div className="context-banner-icon">
          <Info size={20} />
        </div>
        <div className="context-banner-text">
          <h3>UK Day-Ahead Electricity Market Procurement Context</h3>
          <p>
            Zero look-ahead bias enforced: Only forecasts published on or before the auction gate closure cutoff are evaluated.
          </p>
        </div>
      </div>

      <div className="context-pills">
        <div className="pill">
          <Calendar size={13} color="#0ea5e9" />
          <span>Decision Date:</span>
          <strong className="mono">{decisionDate}</strong>
        </div>

        <div className="pill">
          <Calendar size={13} color="#14b8a6" />
          <span>Delivery Date:</span>
          <strong className="mono">{deliveryDate}</strong>
        </div>

        <div className="pill">
          <Clock size={13} color="#f59e0b" />
          <span>Decision Cutoff:</span>
          <strong>{decisionCutoffDisplay}</strong>
        </div>

        <div className="pill">
          <CheckCircle2 size={13} color="#10b981" />
          <span>Latest Eligible Run:</span>
          <strong>{latestForecastPublicationDisplay}</strong>
        </div>
      </div>
    </div>
  );
};
