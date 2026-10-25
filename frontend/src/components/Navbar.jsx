import React from 'react';
import { Wind, Calendar, Clock, Database, ShieldCheck, History } from 'lucide-react';

export const Navbar = ({
  decisionDate,
  setDecisionDate,
  cutoffTime,
  setCutoffTime,
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className="app-header">
      <div className="header-top">
        <div className="brand-section">
          <div className="brand-icon-box">
            <Wind size={22} />
          </div>
          <div className="brand-title-wrap">
            <h1>
              WindGrid
              <span className="brand-badge">UK Power Market</span>
            </h1>
            <div className="brand-subtitle">
              Wind Forecasting & Day-Ahead Procurement Intelligence
            </div>
          </div>
        </div>

        <div className="header-controls">
          {/* Quick Date Chips */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {['2026-01-01', '2026-01-15', '2026-01-31'].map((dt) => (
              <button
                key={dt}
                className={`quick-date-btn ${decisionDate === dt ? 'active' : ''}`}
                onClick={() => setDecisionDate(dt)}
                title={`Select ${dt}`}
              >
                {dt === '2026-01-01' ? 'Jan 1' : dt === '2026-01-15' ? 'Jan 15' : 'Jan 31'}
              </button>
            ))}
          </div>

          {/* Decision Date Picker */}
          <div className="control-group">
            <Calendar size={14} color="#0ea5e9" />
            <span className="control-label">Decision Date:</span>
            <input
              type="date"
              className="control-input mono"
              value={decisionDate}
              min="2026-01-01"
              max="2026-01-31"
              onChange={(e) => {
                if (e.target.value) setDecisionDate(e.target.value);
              }}
            />
          </div>

          {/* Cutoff Selector */}
          <div className="control-group">
            <Clock size={14} color="#14b8a6" />
            <span className="control-label">Auction Cutoff:</span>
            <select
              className="control-select"
              value={cutoffTime}
              onChange={(e) => setCutoffTime(e.target.value)}
            >
              <option value="11:00">11:00 London (GB Day-Ahead Auction Gate Closure)</option>
              <option value="12:00">12:00 London (BSC Indicative Stage)</option>
              <option value="09:30">09:30 London (Morning Run Cutoff)</option>
            </select>
          </div>

          {/* Data Feed Verified Badge */}
          <div className="control-group" style={{ opacity: 0.9 }}>
            <Database size={13} color="#10b981" />
            <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 500 }}>
              Elexon BMRS Verified
            </span>
          </div>
        </div>
      </div>

      <nav className="header-nav">
        <button
          className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Wind size={15} />
          Procurement Overview
        </button>
        <button
          className={`nav-tab ${activeTab === 'accuracy' ? 'active' : ''}`}
          onClick={() => setActiveTab('accuracy')}
        >
          <ShieldCheck size={15} />
          Forecast Accuracy
        </button>
        <button
          className={`nav-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <Calendar size={15} />
          January 2026 Retrospective
        </button>
        <button
          className={`nav-tab ${activeTab === 'versions' ? 'active' : ''}`}
          onClick={() => setActiveTab('versions')}
        >
          <History size={15} />
          Intraday Forecast Runs
        </button>
      </nav>
    </header>
  );
};
