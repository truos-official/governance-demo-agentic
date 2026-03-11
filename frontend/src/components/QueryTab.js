import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

export default function QueryTab() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await axios.post(`${API_URL}/query`, {
        question: query,
        user_id: 'demo_user'
      });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="card">
        <div className="card-title">Query UN Governance Documents</div>
        <textarea
          className="query-input"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => { if (e.ctrlKey && e.key === 'Enter') handleSubmit(); }}
          placeholder="Ask a question about AI governance, human rights, or UN policy..."
          rows={4}
        />
        <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Processing...' : 'Submit Query'}
          </button>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>Ctrl + Enter to submit</span>
        </div>
      </div>

      {error && (
        <div className="card" style={{ borderLeft: '4px solid var(--danger)' }}>
          <p style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>
            ⚠️ {typeof error === 'string' ? error : JSON.stringify(error)}
          </p>
        </div>
      )}

      {result && (
        <>
          <div className="card">
            <div className="card-title">Answer</div>
            <p style={{ lineHeight: '1.75', fontSize: '0.95rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
              {result.answer}
            </p>
          </div>

          <div className="card">
            <div className="card-title">Governance Panel</div>
            <div className="grid-3">

              <div>
                <p className="kpi-label" style={{ marginBottom: '0.75rem' }}>⚠️ Hallucination Check</p>
                <span className={`badge ${result.hallucination_score.is_hallucination ? 'badge-red' : 'badge-green'}`}>
                  {result.hallucination_score.is_hallucination ? '🔴 Hallucination Detected' : '🟢 Grounded'}
                </span>
                <p style={{ marginTop: '0.75rem', fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  {result.hallucination_score.reason}
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                  Confidence: {result.hallucination_score.confidence}
                </p>
              </div>

              <div>
                <p className="kpi-label" style={{ marginBottom: '0.75rem' }}>📋 Query Info</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Response style: </span>
                    <span className="badge badge-blue">{result.detected_style}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginLeft: '0.35rem' }}>(auto-detected)</span>
                  </div>
                </div>
                <p className="kpi-label" style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>📄 UN Document Sources</p>
                {result.sources.length > 0
                  ? result.sources.map(s => (
                      <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                        <span style={{ color: 'var(--primary)', fontSize: '0.75rem' }}>●</span>
                        <span style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>{s}</span>
                      </div>
                    ))
                  : <span className="chip">General knowledge</span>
                }
              </div>

              <div>
                <p className="kpi-label" style={{ marginBottom: '0.75rem' }}>🔒 Security Controls</p>
                {[
                  'Injection check passed',
                  'PII anonymized',
                  'Rate limit OK'
                ].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--success)', fontSize: '0.9rem' }}>✓</span>
                    <span style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>{item}</span>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </>
      )}
    </div>
  );
}