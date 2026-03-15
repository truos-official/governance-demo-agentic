import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

const controls = [
  {
    name: 'LLM Injection Detection',
    desc: 'GPT-4o-mini evaluates full query context with confidence scoring — detects novel attacks, role-play overrides, instruction bypasses. No brittle pattern lists.',
    source: 'query_classifier.py',
    tag: 'AI-powered',
    tagColor: '#7b61ff'
  },
  {
    name: 'Azure Language PII Detection',
    desc: 'Microsoft Azure Language Services detects and redacts PII — Person, Email, Phone, SSN, Organization and more — before query reaches any LLM.',
    source: 'security.py',
    tag: 'Azure',
    tagColor: '#009edb'
  },
  {
    name: 'Azure Static Web Apps Auth',
    desc: 'All routes protected — unauthenticated users redirected to Microsoft AAD or GitHub login. Mandatory registration gate collects full user profile on first login.',
    source: 'staticwebapp.config.json',
    tag: 'Azure',
    tagColor: '#009edb'
  },
  {
    name: 'Per-user Rate Limiting',
    desc: '10 requests per minute per authenticated user ID tracked in Redis. Prevents automated flooding and API credit exhaustion.',
    source: 'security.py',
    tag: 'Redis',
    tagColor: '#d93025'
  },
  {
    name: 'Token Length Validation',
    desc: 'Max 1000 tokens per query enforced before any processing. Prevents context window exhaustion and cost abuse.',
    source: 'security.py',
    tag: 'Validation',
    tagColor: '#f9ab00'
  },
  {
    name: 'Hallucination Detection',
    desc: 'GPT-4o-mini judge validates every answer against retrieved context — confidence-scored, general knowledge supplement aware. Only flags clear factual fabrications.',
    source: 'hallucination_detector.py',
    tag: 'AI-powered',
    tagColor: '#7b61ff'
  },
  {
    name: 'Semantic Cache',
    desc: 'Redis cosine similarity cache at 0.95 threshold — reduces LLM exposure, attack surface, and API costs. Stale entries expire after 1 hour.',
    source: 'semantic_cache.py',
    tag: 'Redis',
    tagColor: '#d93025'
  },
  {
    name: 'User Audit Trail',
    desc: 'Every query attributed to an authenticated user ID — query count, style, hallucination rate, latency tracked per user permanently in Redis.',
    source: 'metrics_tracker.py',
    tag: 'Compliance',
    tagColor: '#1e8e3e'
  },
];

export default function SecurityTab() {
  const [events, setEvents] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchEvents = useCallback(() => {
    setLoading(true);
    axios.get(`${API_URL}/security-events`)
      .then(res => { setEvents(res.data); setLastUpdated(new Date().toLocaleTimeString()); })
      .catch(() => setEvents(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  return (
    <div>
      {/* Header */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-title">
          Security Overview
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {lastUpdated && <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontWeight: '400' }}>Updated: {lastUpdated}</span>}
            <button className="btn-primary" onClick={fetchEvents} disabled={loading} style={{ padding: '0.35rem 0.875rem', fontSize: '0.78rem' }}>
              {loading ? '...' : '↻ Refresh'}
            </button>
          </div>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          Multi-layer security architecture combining Azure authentication, AI-powered threat detection, and real-time monitoring. All events tracked per authenticated user.
        </p>
      </div>

      {/* Security Events */}
      <p className="section-label">Live Security Events — Redis</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
        {[
          { label: 'Injection Attempts', value: events?.injection_attempts || 0, color: '#d93025', icon: '🚨', desc: 'Queries blocked by LLM injection detector' },
          { label: 'PII Detected', value: events?.pii_detected || 0, color: '#f9ab00', icon: '🔏', desc: 'Queries with personal data anonymized' },
          { label: 'Rate Limit Hits', value: events?.rate_limit_hits || 0, color: '#7b61ff', icon: '⏱', desc: 'Requests blocked due to rate abuse' },
        ].map(item => (
          <div key={item.label} className="card" style={{ borderTop: `3px solid ${item.color}`, marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <p className="kpi-label">{item.label}</p>
                <p className="kpi-value" style={{ color: item.value > 0 ? item.color : 'var(--text-primary)' }}>
                  {loading ? '—' : item.value}
                </p>
                <p className="kpi-source">Source: Redis</p>
              </div>
              <span style={{ fontSize: '1.5rem', opacity: 0.6 }}>{item.icon}</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.5rem', lineHeight: '1.4' }}>{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Security Architecture */}
      <p className="section-label">Security Architecture</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {controls.map(control => (
          <div key={control.name} style={{
            display: 'flex', alignItems: 'flex-start', gap: '1rem',
            padding: '1rem 1.25rem', borderRadius: '10px',
            background: 'var(--surface)', border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-1)'
          }}>
            <span style={{
              color: 'var(--success)', fontSize: '1rem',
              marginTop: '0.1rem', flexShrink: 0,
              width: '20px', height: '20px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--success-light)', borderRadius: '50%',
              fontSize: '0.7rem', fontWeight: '700'
            }}>✓</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                <p style={{ fontWeight: '600', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                  {control.name}
                </p>
                <span style={{
                  fontSize: '0.65rem', fontWeight: '600', padding: '0.1rem 0.4rem',
                  borderRadius: '4px', background: `${control.tagColor}18`,
                  color: control.tagColor, border: `1px solid ${control.tagColor}40`,
                  textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap'
                }}>{control.tag}</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.55', marginBottom: '0.5rem' }}>
                {control.desc}
              </p>
              <code style={{
                fontSize: '0.7rem', background: 'var(--primary-light)',
                color: 'var(--primary)', padding: '0.15rem 0.45rem',
                borderRadius: '4px'
              }}>{control.source}</code>
            </div>
          </div>
        ))}
      </div>

      {/* Defence layers summary */}
      <div className="card">
        <div className="card-title">Defence Layers</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          {[
            { layer: 'Layer 1', name: 'Authentication', desc: 'Azure SWA — Microsoft/GitHub login required', color: '#009edb' },
            { layer: 'Layer 2', name: 'Input Validation', desc: 'Injection detection, PII redaction, token limits', color: '#d93025' },
            { layer: 'Layer 3', name: 'Output Validation', desc: 'Hallucination detection on every response', color: '#f9ab00' },
            { layer: 'Layer 4', name: 'Audit & Monitoring', desc: 'Per-user activity log, Redis event tracking', color: '#1e8e3e' },
          ].map(l => (
            <div key={l.layer} style={{
              padding: '0.875rem', borderRadius: '8px',
              background: 'var(--surface-2)', border: `1px solid ${l.color}40`,
              borderTop: `3px solid ${l.color}`
            }}>
              <p style={{ fontSize: '0.68rem', color: l.color, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>{l.layer}</p>
              <p style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.3rem' }}>{l.name}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.45' }}>{l.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}