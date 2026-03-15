import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

const controls = [
  { name: 'Prompt Injection Detection', desc: 'Pattern-based detection of adversarial inputs — 8 patterns screened per query', source: 'security.py' },
  { name: 'PII Anonymization', desc: 'Microsoft Presidio — detects and anonymizes personal data before LLM processing', source: 'security.py' },
  { name: 'Rate Limiting', desc: '10 requests per minute per user tracked in Redis', source: 'security.py' },
  { name: 'Token Length Validation', desc: 'Max 1000 tokens per query to prevent context flooding', source: 'security.py' },
  { name: 'Hallucination Detection', desc: 'GPT-4 judge validates every answer against retrieved context', source: 'hallucination_detector.py' },
  { name: 'Semantic Cache', desc: 'Redis cosine similarity cache reduces attack surface and LLM exposure', source: 'semantic_cache.py' },
];

export default function SecurityTab() {
  const [events, setEvents] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_URL}/security-events`)
      .then(res => setEvents(res.data))
      .catch(() => setEvents(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <p className="section-label">Security Events — Redis</p>
      <div className="grid-3">
        {[
          { label: 'Injection Attempts', value: events?.injection_attempts || 0, color: '#d93025' },
          { label: 'PII Detected', value: events?.pii_detected || 0, color: '#f9ab00' },
          { label: 'Rate Limit Hits', value: events?.rate_limit_hits || 0, color: '#7b61ff' },
        ].map(item => (
          <div key={item.label} className="card" style={{ borderTop: `3px solid ${item.color}` }}>
            <p className="kpi-label">{item.label}</p>
            <p className="kpi-value">{loading ? '—' : item.value}</p>
            <p className="kpi-source">Source: Redis</p>
          </div>
        ))}
      </div>

      <p className="section-label" style={{ marginTop: '1.5rem' }}>Active Security Controls</p>
      <div className="card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {controls.map(control => (
            <div key={control.name} style={{
              display: 'flex', alignItems: 'flex-start', gap: '1rem',
              padding: '0.875rem 1rem', borderRadius: '8px',
              background: 'var(--surface-2)', border: '1px solid var(--border)'
            }}>
              <span style={{ color: 'var(--success)', fontSize: '1rem', marginTop: '0.1rem', flexShrink: 0 }}>✓</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: '500', fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                  {control.name}
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  {control.desc}
                </p>
              </div>
              <code style={{
                fontSize: '0.72rem', background: 'var(--primary-light)',
                color: 'var(--primary)', padding: '0.2rem 0.5rem',
                borderRadius: '4px', flexShrink: 0, alignSelf: 'center'
              }}>
                {control.source}
              </code>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}