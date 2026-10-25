import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { OverviewPage } from './pages/OverviewPage';
import { AccuracyPage } from './pages/AccuracyPage';
import { HistoryPage } from './pages/HistoryPage';
import { VersionsPage } from './pages/VersionsPage';
import { api } from './services/api';
import { AlertCircle, ExternalLink, ShieldCheck } from 'lucide-react';

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

  // Fetch data when date or cutoff changes
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
        if (isMounted) setError(err.message || 'Failed to fetch data');
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
    <div className="app-layout">
      <Navbar
        decisionDate={decisionDate}
        setDecisionDate={setDecisionDate}
        cutoffTime={cutoffTime}
        setCutoffTime={setCutoffTime}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="main-content">
        {error && (
          <div className="error-banner">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {loading && (
          <div className="state-container">
            <div className="spinner" />
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
              Querying Elexon BMRS Wind Intelligence API...
            </p>
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

      <footer className="app-footer">
        <div className="footer-left">
          <span style={{ fontWeight: 600, color: '#f8fafc' }}>WindGrid v1.0</span>
          <span>•</span>
          <span>Scope: GB National Wind Power Forecasts (January 2026 Decisions)</span>
          <span>•</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ShieldCheck size={13} color="#10b981" />
            Strict Day-Ahead Gate Closure Enforcement (Zero Look-Ahead Bias)
          </span>
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <a
            href="https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream"
            target="_blank"
            rel="noreferrer"
            className="footer-link"
          >
            Elexon FUELHH <ExternalLink size={11} style={{ display: 'inline' }} />
          </a>
          <a
            href="https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream"
            target="_blank"
            rel="noreferrer"
            className="footer-link"
          >
            Elexon WINDFOR <ExternalLink size={11} style={{ display: 'inline' }} />
          </a>
        </div>
      </footer>
    </div>
  );
}

export default App;
