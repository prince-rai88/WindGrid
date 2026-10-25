import React from 'react';
import { Calendar, Clock, Compass } from 'lucide-react';

export const Navbar = ({
  decisionDate,
  setDecisionDate,
  cutoffTime,
  setCutoffTime,
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className="editorial-navbar">
      <div className="navbar-glass-panel">
        {/* Top Header Row */}
        <div className="navbar-top-row">
          {/* Brand Identity */}
          <div className="editorial-brand">
            <span className="brand-main-title">WINDGRID</span>
            <span className="brand-sub-label">// UTILITY PROCUREMENT INTELLIGENCE</span>
          </div>

          {/* Date & Market Timing Controls */}
          <div className="navbar-controls">
            {/* Quick Date Presets */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {['2026-01-01', '2026-01-15', '2026-01-31'].map((dt) => (
                <button
                  key={dt}
                  className={`date-preset-pill ${decisionDate === dt ? 'active' : ''}`}
                  onClick={() => setDecisionDate(dt)}
                >
                  {dt === '2026-01-01' ? '01 JAN' : dt === '2026-01-15' ? '15 JAN' : '31 JAN'}
                </button>
              ))}
            </div>

            {/* Date Picker Capsule */}
            <div className="glass-pill-control">
              <Calendar size={13} strokeWidth={2.2} color="#111418" />
              <input
                type="date"
                className="mono"
                value={decisionDate}
                min="2026-01-01"
                max="2026-01-31"
                onChange={(e) => {
                  if (e.target.value) setDecisionDate(e.target.value);
                }}
              />
            </div>

            {/* Cutoff Selector Capsule */}
            <div className="glass-pill-control">
              <Clock size={13} strokeWidth={2.2} color="#4b5563" />
              <select
                value={cutoffTime}
                onChange={(e) => setCutoffTime(e.target.value)}
              >
                <option value="11:00">11:00 AM (UK Day-Ahead Gate Closure)</option>
                <option value="12:00">12:00 PM (BSC Benchmark Run)</option>
                <option value="09:30">09:30 AM (Early Morning Run)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Row */}
        <div className="navbar-tabs-row">
          <button
            className={`nav-glass-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            01 // Day-Ahead Forecast
          </button>
          <button
            className={`nav-glass-tab ${activeTab === 'accuracy' ? 'active' : ''}`}
            onClick={() => setActiveTab('accuracy')}
          >
            02 // Quantitative Accuracy
          </button>
          <button
            className={`nav-glass-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            03 // January 2026 Archive
          </button>
          <button
            className={`nav-glass-tab ${activeTab === 'versions' ? 'active' : ''}`}
            onClick={() => setActiveTab('versions')}
          >
            04 // Intraday Run Evolution
          </button>
        </div>
      </div>
    </header>
  );
};
