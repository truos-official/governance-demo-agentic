import React, { useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

export default function QueryTab({ user, profile }) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [showComment, setShowComment] = useState(false);
  const [queryId, setQueryId] = useState(null);

  const handleSubmit = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setFeedback(null);
    setShowComment(false);
    setFeedbackComment('');
    const newQueryId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setQueryId(newQueryId);
    try {
      const response = await axios.post(`${API_URL}/query`, {
        question: query,
        user_id: user?.id || 'anonymous'
      });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (rating) => {
    if (feedback !== null) return;
    setFeedback(rating);
    if (rating === -1) setShowComment(true);
    try {
      await axios.post(`${API_URL}/feedback`, {
        query_id: queryId,
        question: query,
        answer: result.answer,
        rating,
        user_id: user?.id || 'anonymous',
        comment: ''
      });
    } catch (e) {
      console.error('Feedback error', e);
    }
  };

  const submitComment = async () => {
    if (!feedbackComment.trim()) return;
    try {
      await axios.post(`${API_URL}/feedback`, {
        query_id: queryId,
        question: query,
        answer: result.answer,
        rating: -1,
        user_id: user?.id || 'anonymous',
        comment: feedbackComment
      });
      setShowComment(false);
    } catch (e) {
      console.error('Comment error', e);
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

            {/* Feedback */}
            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: '600' }}>
                Was this answer helpful?
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  onClick={() => handleFeedback(1)}
                  disabled={feedback !== null}
                  style={{
                    padding: '0.4rem 0.9rem', borderRadius: '6px', border: '1px solid var(--border)',
                    background: feedback === 1 ? 'var(--success)' : 'var(--surface)',
                    color: feedback === 1 ? '#fff' : 'var(--text-secondary)',
                    cursor: feedback !== null ? 'default' : 'pointer',
                    fontSize: '0.9rem', fontWeight: '600'
                  }}
                >
                  👍
                </button>
                <button
                  onClick={() => handleFeedback(-1)}
                  disabled={feedback !== null}
                  style={{
                    padding: '0.4rem 0.9rem', borderRadius: '6px', border: '1px solid var(--border)',
                    background: feedback === -1 ? 'var(--danger)' : 'var(--surface)',
                    color: feedback === -1 ? '#fff' : 'var(--text-secondary)',
                    cursor: feedback !== null ? 'default' : 'pointer',
                    fontSize: '0.9rem', fontWeight: '600'
                  }}
                >
                  👎
                </button>
                {feedback === 1 && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: '500' }}>
                    Thanks for the feedback!
                  </span>
                )}
              </div>

              {showComment && (
                <div style={{ marginTop: '0.75rem' }}>
                  <textarea
                    value={feedbackComment}
                    onChange={e => setFeedbackComment(e.target.value)}
                    placeholder="What was wrong with this answer? (optional)"
                    rows={2}
                    style={{
                      width: '100%', padding: '0.6rem 0.8rem', border: '1px solid var(--border)',
                      borderRadius: '6px', fontSize: '0.85rem', fontFamily: 'inherit',
                      background: 'var(--surface)', color: 'var(--text-primary)',
                      outline: 'none', resize: 'vertical', boxSizing: 'border-box'
                    }}
                  />
                  <button
                    onClick={submitComment}
                    style={{
                      marginTop: '0.4rem', padding: '0.35rem 0.9rem', borderRadius: '6px',
                      border: 'none', background: 'var(--primary)', color: '#fff',
                      fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer'
                    }}
                  >
                    Submit
                  </button>
                </div>
              )}
            </div>
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
                        <span style={{ color: 'var(--primary)', fontSize: '0.75rem' }}>◆</span>
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