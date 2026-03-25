// v2.1
import React, { useState } from 'react';
import {
  Compass,
  Activity,
  Bot,
  BarChart3,
  ShieldCheck,
  Network,
  ClipboardCheck,
  SlidersHorizontal
} from 'lucide-react';
import AuthGate from './components/AuthGate';
import FrameworkTab from './components/FrameworkTab';
import QueryTab from './components/QueryTab';
import AnalyticsTab from './components/AnalyticsTab';
import SecurityTab from './components/SecurityTab';
import ArchitectureTab from './components/ArchitectureTab';
import ResponsibleAITab from './components/ResponsibleAITab';
import EvalTab from './components/EvalTab';
import AdminTab from './components/AdminTab';
import './App.css';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

function AppContent({ user, profile }) {
  const [activeTab, setActiveTab] = useState('framework');

  const ADMIN_EMAIL = 'tristan.gitman@un.org';
  const isAdmin =
    user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() ||
    profile?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const handleLogout = async () => {
    const isLocal = window.location.hostname === 'localhost';
    if (isLocal) {
      try {
        await axios.post(`${API_URL}/auth/logout-dev?user_id=${user?.id}`);
      } catch {}
      sessionStorage.setItem('dev_logged_out', '1');
      window.location.reload();
    } else {
      window.location.href = '/.auth/logout';
    }
  };

  const govTabs = [
    { id: 'framework', label: 'Framework', Icon: Compass },
    { id: 'governance', label: 'Monitoring', Icon: Activity },
  ];

  const solutionTabs = [
    { id: 'agent', label: 'Agent', Icon: Bot },
    { id: 'analytics', label: 'Analytics', Icon: BarChart3 },
    { id: 'security', label: 'Security', Icon: ShieldCheck },
    { id: 'architecture', label: 'Architecture', Icon: Network },
    { id: 'evals', label: 'Evals', Icon: ClipboardCheck },
  ];

  const govColor = '#009edb';
  const solColor = '#1a73e8';

  const tabBtn = (tab, activeColor, isActive) => (
    <button
      key={tab.id}
      onClick={() => setActiveTab(tab.id)}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.35rem',
        padding: '0.55rem 0.875rem', fontSize: '0.8rem',
        fontWeight: isActive ? '600' : '400',
        color: isActive ? activeColor : 'var(--text-secondary)',
        background: 'none', border: 'none',
        borderBottom: isActive ? `2px solid ${activeColor}` : '2px solid transparent',
        cursor: 'pointer', fontFamily: 'inherit',
        transition: 'all 0.15s', whiteSpace: 'nowrap',
        marginBottom: '-1px'
      }}
    >
      <tab.Icon size={15} strokeWidth={1.75} color={isActive ? activeColor : 'var(--text-tertiary)'} />
      {tab.label}
    </button>
  );

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
                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                  background: activeTab === 'admin' ? 'var(--surface-2)' : 'none',
                  border: '1px solid var(--border)',
                  borderRadius: '6px', padding: '0.35rem 0.65rem', fontSize: '0.75rem',
                  cursor: 'pointer',
                  color: activeTab === 'admin' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontFamily: 'inherit', whiteSpace: 'nowrap'
                }}
              >
                <SlidersHorizontal size={13} strokeWidth={1.75} />
                Admin
              </button>
            )}
            <button onClick={handleLogout} style={{
              background: 'none', border: '1px solid var(--border)', borderRadius: '6px',
              padding: '0.35rem 0.75rem', fontSize: '0.75rem', cursor: 'pointer',
              color: 'var(--text-secondary)', fontFamily: 'inherit', whiteSpace: 'nowrap'
            }}>Sign out</button>
          </div>
        </div>

        {/* Bottom row — two-zone navigation */}
        <div style={{
          display: 'flex', alignItems: 'stretch',
          borderTop: '1px solid var(--border)',
          background: 'var(--surface)', minHeight: '44px'
        }}>

          {/* ZONE 1 — Governance Framework */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 1.5rem 0 2rem' }}>
            <span style={{ fontSize: '0.58rem', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', paddingBottom: '0.2rem', paddingLeft: '0.1rem' }}>
              Governance Framework
            </span>
            <div style={{ display: 'flex', gap: '0', alignItems: 'flex-end' }}>
              {govTabs.map(tab => tabBtn(tab, govColor, activeTab === tab.id))}
            </div>
          </div>

          {/* Vertical divider */}
          <div style={{ width: '1px', background: 'var(--border)', margin: '8px 0', alignSelf: 'stretch', flexShrink: 0 }} />

          {/* ZONE 2 — Live Agentic Solution */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 2rem 0 1.5rem', flex: 1 }}>
            <span style={{ fontSize: '0.58rem', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', paddingBottom: '0.2rem', paddingLeft: '0.1rem' }}>
              Live Agentic Solution
            </span>
            <div style={{ display: 'flex', gap: '0', alignItems: 'flex-end' }}>
              {solutionTabs.map(tab => tabBtn(tab, solColor, activeTab === tab.id))}
            </div>
          </div>

        </div>

      </header>

      <main className="main">
        {activeTab === 'framework' && <FrameworkTab onTabChange={setActiveTab} />}
        {activeTab === 'governance' && <ResponsibleAITab />}
        {activeTab === 'agent' && <QueryTab user={user} profile={profile} />}
        {activeTab === 'analytics' && <AnalyticsTab />}
        {activeTab === 'security' && <SecurityTab />}
        {activeTab === 'architecture' && <ArchitectureTab />}
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
