import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { OverviewPage } from './pages/OverviewPage';
import { AccuracyPage } from './pages/AccuracyPage';
import { HistoryPage } from './pages/HistoryPage';
import { VersionsPage } from './pages/VersionsPage';
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
        if (isMounted) setError(err.message || 'API request failed');
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
    <div className="terminal-layout">
      <Navbar
        decisionDate={decisionDate}
        setDecisionDate={setDecisionDate}
        cutoffTime={cutoffTime}
        setCutoffTime={setCutoffTime}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="terminal-canvas">
        {error && (
          <div
            style={{
              padding: '10px 14px',
              background: 'rgba(248, 81, 73, 0.1)',
              border: '1px solid #f85149',
              borderRadius: '3px',
              color: '#ff7b72',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
            }}
          >
            SYSTEM ERROR: {error}
          </div>
        )}

        {loading && (
          <div style={{ padding: '60px', textAlign: 'center', color: '#8b949e', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
            <span style={{ color: '#58a6ff' }}>[QUERYING ELEXON BMRS STREAM...]</span>
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

      <footer className="terminal-footer">
        <div>
          <span>WINDGRID CORE | UK NATIONAL WIND INTELLIGENCE | DECISIONS: JAN 2026 | DATA: ELEXON FUELHH & WINDFOR</span>
        </div>

        <div style={{ display: 'flex', gap: '14px' }}>
          <a
            href="https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream"
            target="_blank"
            rel="noreferrer"
            className="footer-link-subtle"
          >
            FUELHH STREAM ↗
          </a>
          <a
            href="https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream"
            target="_blank"
            rel="noreferrer"
            className="footer-link-subtle"
          >
            WINDFOR STREAM ↗
          </a>
        </div>
      </footer>
    </div>
  );
}

export default App;
