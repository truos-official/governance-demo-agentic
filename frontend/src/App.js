import React, { useState } from 'react';
import QueryTab from './components/QueryTab';
import AnalyticsTab from './components/AnalyticsTab';
import SecurityTab from './components/SecurityTab';
import ArchitectureTab from './components/ArchitectureTab';
import ResponsibleAITab from './components/ResponsibleAITab';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('query');

  const tabs = [
    { id: 'query', label: '🔍 Query' },
    { id: 'analytics', label: '📊 Analytics' },
    { id: 'security', label: '🔒 Security' },
    { id: 'architecture', label: '🏗️ Architecture' },
    { id: 'responsible-ai', label: '⚖️ Responsible AI' },
  ];

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="header-title">
            <span className="header-emblem">🇺🇳</span>
            <div>
             <h1>Agentic AI: Responsible AI Demo</h1>
             <p>Office of Information and Communications Technology</p>
            </div>
          </div>
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
        {activeTab === 'query' && <QueryTab />}
        {activeTab === 'analytics' && <AnalyticsTab />}
        {activeTab === 'security' && <SecurityTab />}
        {activeTab === 'architecture' && <ArchitectureTab />}
        {activeTab === 'responsible-ai' && <ResponsibleAITab />}
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
    {' '}— Head of AI Governance, UN Secretariat OICT &nbsp;·&nbsp; 
    <a href="https://github.com/truos-official/governance-demo-agentic" target="_blank" rel="noreferrer"
      style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '500' }}>View on GitHub</a>
  </p>
</footer>
    </div>
  );
}

export default App;