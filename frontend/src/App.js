import React, { useState } from 'react';
import AuthGate from './components/AuthGate';
import FrameworkTab from './components/FrameworkTab';
import QueryTab from './components/QueryTab';
import AnalyticsTab from './components/AnalyticsTab';
import SecurityTab from './components/SecurityTab';
import ArchitectureTab from './components/ArchitectureTab';
import ResponsibleAITab from './components/ResponsibleAITab';
import EvalTab from './components/EvalTab';
import AdminTab from './components/AdminTab';
import GovernanceTab from './components/GovernanceTab';
import './App.css';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

function AppContent({ user, profile }) {
  const [activeTab, setActiveTab] = useState('framework');

  const ADMIN_EMAIL = 'tristan.gitman@un.org';
  const isAdmin =
    user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() ||
    profile?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const tabs = [
    { id: 'framework', label: '🗺️ Framework' },
    { id: 'query', label: '🔍 Query' },
    { id: 'analytics', label: '📊 Analytics' },
    { id: 'security', label: '🔒 Security' },
    { id: 'architecture', label: '🏗️ Architecture' },
    { id: 'governance', label: '⚖️ Governance' },
    { id: 'evals', label: '🧪 Evals' },
  ];

  const handleLogout = async () => {
    const isLocal = window.location.hostname === 'localhost';
    if (isLocal) {
      try {
        await axios.post(`${API_URL}/auth/logout-dev?user_id=${user?.id}`);
      } catch {}
      window.location.reload();
    } else {
      window.location.href = '/.auth/logout';
    }
  };

  return (
    <div className="app">
      <header className="header" style={{ padding: 0 }}>
        {/* Top row — branding + user */}
        <div style={{
          padding: '0 2rem',
          borderBottom: '1px solid var(--surface-3)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', height: '52px',
          maxWidth: '100%'
        }}>
          <div className="header-title">
            <img src="/un-emblem.png" alt="UN Emblem" style={{ height: '34px', width: 'auto' }} />
            <div>
              <h1>Responsible AI</h1>
              <p>Demo</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.78rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                {profile?.full_name || user?.name || 'User'}
              </p>
              <p style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>
                {profile?.title || user?.email || ''}
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={() => setActiveTab('admin')}
                style={{
                  background: activeTab === 'admin' ? 'var(--primary-light)' : 'none',
                  border: activeTab === 'admin' ? '1px solid var(--primary)' : '1px solid var(--border)',
                  borderRadius: '6px', padding: '0.35rem 0.65rem', fontSize: '0.82rem',
                  cursor: 'pointer', color: activeTab === 'admin' ? 'var(--primary)' : 'var(--text-secondary)',
                  fontFamily: 'inherit', whiteSpace: 'nowrap'
                }}
                title="Admin panel"
              >⚙️ Admin</button>
            )}
            <button onClick={handleLogout} style={{
              background: 'none', border: '1px solid var(--border)', borderRadius: '6px',
              padding: '0.35rem 0.75rem', fontSize: '0.75rem', cursor: 'pointer',
              color: 'var(--text-secondary)', fontFamily: 'inherit', whiteSpace: 'nowrap'
            }}>Sign out</button>
          </div>
        </div>

        {/* Bottom row — tabs */}
        <div style={{ padding: '0 2rem' }}>
          <nav className="tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="main">
        {activeTab === 'framework' && <FrameworkTab onTabChange={setActiveTab} />}
        {activeTab === 'query' && <QueryTab user={user} profile={profile} />}
        {activeTab === 'analytics' && <AnalyticsTab />}
        {activeTab === 'security' && <SecurityTab />}
        {activeTab === 'architecture' && <ArchitectureTab />}
        {activeTab === 'responsible-ai' && <ResponsibleAITab />}
        {activeTab === 'governance' && <GovernanceTab />}
        {activeTab === 'evals' && <EvalTab />}
        {activeTab === 'admin' && isAdmin && <AdminTab currentUserId={user?.id} />}
      </main>

      <footer style={{
        borderTop: '1px solid var(--border)',
        background: 'var(--surface)',
        padding: '1rem 2rem',
        textAlign: 'center'
      }}>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
          Built by <a href="https://www.linkedin.com/in/tristangitman" target="_blank" rel="noreferrer"
            style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '500' }}>Tristan Gitman</a>
          {' '}UN Secretariat OICT &nbsp;·&nbsp;
          <a href="https://github.com/truos-official/governance-demo-agentic" target="_blank" rel="noreferrer"
            style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '500' }}>View on GitHub</a>
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthGate>
      {({ user, profile }) => <AppContent user={user} profile={profile} />}
    </AuthGate>
  );
}
