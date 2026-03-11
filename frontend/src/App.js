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
    </div>
  );
}

export default App;