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
    <div className="apple-nav-wrapper">
      <header className="apple-nav">
        {/* Brand */}
        <div className="apple-brand">
          <div className="apple-logo-badge">
            <Wind size={15} strokeWidth={2.2} />
          </div>
          <span className="apple-brand-title">WindGrid</span>
          <span className="apple-brand-tag">UK Wind</span>
        </div>

        {/* Minimal Pill Segmented Navigation */}
        <nav className="apple-tabs">
          <button
            className={`apple-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`apple-tab-btn ${activeTab === 'accuracy' ? 'active' : ''}`}
            onClick={() => setActiveTab('accuracy')}
          >
            Accuracy
          </button>
          <button
            className={`apple-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            January 2026
          </button>
          <button
            className={`apple-tab-btn ${activeTab === 'versions' ? 'active' : ''}`}
            onClick={() => setActiveTab('versions')}
          >
            Intraday Runs
          </button>
        </nav>

        {/* Floating Controls */}
        <div className="apple-nav-controls">
          {/* Quick Date Shortcuts */}
          <div style={{ display: 'flex', gap: '2px' }}>
            {['2026-01-01', '2026-01-15', '2026-01-31'].map((dt) => (
              <button
                key={dt}
                className={`apple-quick-btn ${decisionDate === dt ? 'active' : ''}`}
                onClick={() => setDecisionDate(dt)}
                title={`Select ${dt}`}
              >
                {dt === '2026-01-01' ? 'Jan 1' : dt === '2026-01-15' ? 'Jan 15' : 'Jan 31'}
              </button>
            ))}
          </div>

          {/* Date Picker */}
          <div className="apple-pill-control">
            <Calendar size={13} color="#2d6a4f" />
            <input
              type="date"
              className="apple-input mono"
              value={decisionDate}
              min="2026-01-01"
              max="2026-01-31"
              onChange={(e) => {
                if (e.target.value) setDecisionDate(e.target.value);
              }}
            />
          </div>

          {/* Cutoff Selector */}
          <div className="apple-pill-control">
            <Clock size={13} color="#475569" />
            <select
              className="apple-select"
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
