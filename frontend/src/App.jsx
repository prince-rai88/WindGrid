import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { OverviewPage } from './pages/OverviewPage';
import { AccuracyPage } from './pages/AccuracyPage';
import { HistoryPage } from './pages/HistoryPage';
import { VersionsPage } from './pages/VersionsPage';
import { WindDotFlowBackground } from './components/WindDotFlowBackground';
import { api } from './services/api';

export function App() {
  const [decisionDate, setDecisionDate] = useState('2026-01-15');
  const [cutoffTime, setCutoffTime] = useState('11:00');
  const [activeTab, setActiveTab] = useState('overview');

  const [overviewData, setOverviewData] = useState(null);
  const [accuracyData, setAccuracyData] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [versionsData, setVersionsData] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        if (activeTab === 'overview') {
          const res = await api.getOverview(decisionDate, cutoffTime);
          if (isMounted) setOverviewData(res);
        } else if (activeTab === 'accuracy') {
          const res = await api.getAccuracy(decisionDate, cutoffTime);
          if (isMounted) setAccuracyData(res);
        } else if (activeTab === 'history') {
          const res = await api.getHistory('2026-01-01', '2026-01-31', cutoffTime);
          if (isMounted) setHistoryData(res);
        } else if (activeTab === 'versions') {
          const [versRes, accRes] = await Promise.all([
            api.getForecastVersions(decisionDate),
            api.getAccuracy(decisionDate, cutoffTime),
          ]);
          if (isMounted) {
            setVersionsData(versRes);
            setAccuracyData(accRes);
          }
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Unable to retrieve forecast data');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [decisionDate, cutoffTime, activeTab]);

  const handleSelectDateFromHistory = (newDate) => {
    setDecisionDate(newDate);
    setActiveTab('accuracy');
  };

  return (
    <div className="editorial-app">
      {/* Three.js Continuous Low-Opacity Wind Dot Wave Background */}
      <WindDotFlowBackground />

      {/* Top Subtle Editorial Ambient Bar */}
      <div className="top-ambient-bar">
        <div className="ambient-tag">
          <span className="ambient-cross">+</span>
          <span>UK National Grid ESO // Elexon BMRS Stream</span>
        </div>
        <div className="ambient-tag">
          <span>Sys: v1.26 // Production Release</span>
          <span className="ambient-cross">+</span>
        </div>
      </div>

      {/* Floating Low-Blur Glass Navbar */}
      <Navbar
        decisionDate={decisionDate}
        setDecisionDate={setDecisionDate}
        cutoffTime={cutoffTime}
        setCutoffTime={setCutoffTime}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="editorial-container">
        {error && (
          <div
            className="glass-panel"
            style={{
              padding: '16px 20px',
              border: '1px solid rgba(220, 38, 38, 0.3)',
              background: 'rgba(254, 242, 242, 0.65)',
              color: '#991b1b',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        )}

        {loading && (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '64px 20px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#111418' }}>
              Updating Elexon BMRS Forecast Intelligence...
            </span>
          </div>
        )}

        {!loading && (
          <>
            {activeTab === 'overview' && <OverviewPage data={overviewData} />}
            {activeTab === 'accuracy' && <AccuracyPage data={accuracyData} />}
            {activeTab === 'history' && (
              <HistoryPage
                data={historyData}
                onSelectDate={handleSelectDateFromHistory}
              />
            )}
            {activeTab === 'versions' && (
              <VersionsPage
                data={versionsData}
                actualRecords={accuracyData?.records || []}
              />
            )}
          </>
        )}
      </main>

      {/* Editorial Footer */}
      <footer className="editorial-footer">
        <div>
          <span>WINDGRID • UK National Renewable Generation & Power Procurement Intelligence</span>
        </div>

        <div style={{ display: 'flex', gap: '20px' }}>
          <a
            href="https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream"
            target="_blank"
            rel="noreferrer"
            className="footer-link"
          >
            BMRS FUELHH Actuals ↗
          </a>
          <a
            href="https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream"
            target="_blank"
            rel="noreferrer"
            className="footer-link"
          >
            BMRS WINDFOR Forecast ↗
          </a>
        </div>
      </footer>
    </div>
  );
}

export default App;
