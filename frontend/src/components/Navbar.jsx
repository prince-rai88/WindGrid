import React from 'react';

export const Navbar = ({
  decisionDate,
  setDecisionDate,
  cutoffTime,
  setCutoffTime,
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className="command-bar">
      <div className="command-bar-left">
        <div className="terminal-brand">
          <span className="terminal-status-dot" title="Elexon BMRS Live Feed Connected" />
          <span className="terminal-brand-title">WINDGRID</span>
          <span className="terminal-tag">UK POWER DESK</span>
        </div>

        {/* Dense View Switcher */}
        <nav className="terminal-tabs">
          <button
            className={`terminal-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`terminal-tab-btn ${activeTab === 'accuracy' ? 'active' : ''}`}
            onClick={() => setActiveTab('accuracy')}
          >
            Forecast Accuracy
          </button>
          <button
            className={`terminal-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Jan 2026 Retrospective
          </button>
          <button
            className={`terminal-tab-btn ${activeTab === 'versions' ? 'active' : ''}`}
            onClick={() => setActiveTab('versions')}
          >
            Intraday Runs
          </button>
        </nav>
      </div>

      <div className="command-bar-right">
        {/* Quick Date Shortcuts */}
        <div style={{ display: 'flex', gap: '3px' }}>
          {['2026-01-01', '2026-01-15', '2026-01-31'].map((dt) => (
            <button
              key={dt}
              className={`quick-btn ${decisionDate === dt ? 'active' : ''}`}
              onClick={() => setDecisionDate(dt)}
              title={`Switch to ${dt}`}
            >
              {dt === '2026-01-01' ? 'Jan 1' : dt === '2026-01-15' ? 'Jan 15' : 'Jan 31'}
            </button>
          ))}
        </div>

        {/* Date Selector */}
        <div className="terminal-control-chip">
          <span className="control-caption">DECISION:</span>
          <input
            type="date"
            className="terminal-input"
            value={decisionDate}
            min="2026-01-01"
            max="2026-01-31"
            onChange={(e) => {
              if (e.target.value) setDecisionDate(e.target.value);
            }}
          />
        </div>

        {/* Cutoff Selector */}
        <div className="terminal-control-chip">
          <span className="control-caption">CUTOFF:</span>
          <select
            className="terminal-select"
            value={cutoffTime}
            onChange={(e) => setCutoffTime(e.target.value)}
          >
            <option value="11:00">11:00 London (GB Auction Gate Closure)</option>
            <option value="12:00">12:00 London (BSC Indicative Stage)</option>
            <option value="09:30">09:30 London (Morning Run)</option>
          </select>
        </div>
      </div>
    </header>
  );
};
