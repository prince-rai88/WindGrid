import React from 'react';
import { Wind, Calendar, Clock } from 'lucide-react';

export const Navbar = ({
  decisionDate,
  setDecisionDate,
  cutoffTime,
  setCutoffTime,
  activeTab,
  setActiveTab,
}) => {
  return (
    <div className="nav-glass-container">
      <header className="nav-glass-bar">
        {/* Brand */}
        <div className="brand-wrap">
          <div className="brand-icon-jewel">
            <Wind size={16} strokeWidth={2.4} />
          </div>
          <div className="brand-title">
            <span>WindGrid</span>
            <span className="brand-tag-jewel">UK Power</span>
          </div>
        </div>

        {/* Segmented Pill Tabs */}
        <nav className="tabs-pill-wrap">
          <button
            className={`tab-pill-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`tab-pill-btn ${activeTab === 'accuracy' ? 'active' : ''}`}
            onClick={() => setActiveTab('accuracy')}
          >
            Forecast Accuracy
          </button>
          <button
            className={`tab-pill-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            January 2026
          </button>
          <button
            className={`tab-pill-btn ${activeTab === 'versions' ? 'active' : ''}`}
            onClick={() => setActiveTab('versions')}
          >
            Intraday Runs
          </button>
        </nav>

        {/* Floating Controls */}
        <div className="controls-glass-group">
          {/* Quick Date Chips */}
          <div style={{ display: 'flex', gap: '3px' }}>
            {['2026-01-01', '2026-01-15', '2026-01-31'].map((dt) => (
              <button
                key={dt}
                className={`quick-chip ${decisionDate === dt ? 'active' : ''}`}
                onClick={() => setDecisionDate(dt)}
                title={`Select ${dt}`}
              >
                {dt === '2026-01-01' ? 'Jan 1' : dt === '2026-01-15' ? 'Jan 15' : 'Jan 31'}
              </button>
            ))}
          </div>

          {/* Date Picker */}
          <div className="control-pill">
            <Calendar size={13} color="#0284c7" />
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

          {/* Cutoff Selector */}
          <div className="control-pill">
            <Clock size={13} color="#059669" />
            <select
              value={cutoffTime}
              onChange={(e) => setCutoffTime(e.target.value)}
            >
              <option value="11:00">11:00 London (GB Day-Ahead Gate Closure)</option>
              <option value="12:00">12:00 London (BSC Indicative Stage)</option>
              <option value="09:30">09:30 London (Morning Run Cutoff)</option>
            </select>
          </div>
        </div>
      </header>
    </div>
  );
};
