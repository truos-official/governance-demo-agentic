import React, { useState } from 'react';

const layers = [
  {
    layer: 'Frontend',
    color: '#1a73e8',
    icon: '🖥',
    items: [
      { name: 'React UI', desc: '6-tab governance dashboard — Query, Analytics, Security, Architecture, Responsible AI, Evals' },
      { name: 'Azure SWA Auth', desc: 'Microsoft / GitHub login via Azure Static Web Apps — mandatory registration gate on first login' },
      { name: 'Eval Runner', desc: 'Excel/CSV upload — bulk prompt evaluation with auto-generated KPIs, hallucination scores, security checks' },
      { name: 'Axios + Recharts', desc: 'HTTP client for FastAPI communication — KPI charts, style distribution, document citations, user activity' },
    ]
  },
  {
    layer: 'API Layer',
    color: '#7b61ff',
    icon: '⚡',
    items: [
      { name: 'FastAPI', desc: 'REST API — /query, /metrics, /security-events, /register, /user-profile, /users, /clear-cache, /reset-metrics' },
      { name: 'Pydantic', desc: 'Request/response validation and schema enforcement' },
      { name: 'Uvicorn', desc: 'ASGI server for async request handling' },
    ]
  },
  {
    layer: 'Auth & User Layer',
    color: '#009edb',
    icon: '👤',
    items: [
      { name: 'Azure Static Web Apps Auth', desc: 'Microsoft AAD and GitHub OAuth — all routes protected, unauthenticated users redirected to login' },
      { name: 'Registration Gate', desc: 'Mandatory profile form on first login — full name, email, title, organization, country stored in Redis' },
      { name: 'User Activity Tracking', desc: 'Per-user query count, hallucination rate, avg latency, style distribution — retained permanently in Redis' },
    ]
  },
  {
    layer: 'Security Layer',
    color: '#d93025',
    icon: '🔒',
    items: [
      { name: 'LLM Injection Detector', desc: 'GPT-4o-mini evaluates query intent with confidence scoring — context-aware, no brittle pattern lists' },
      { name: 'Azure Language Services', desc: 'Microsoft PII detection and redaction — replaces Presidio/spacy, no local model needed' },
      { name: 'Rate Limiter', desc: 'Per-user request throttling — 10 requests/minute tracked in Redis' },
      { name: 'Token Validator', desc: 'Max 1000 tokens per query to prevent context flooding and cost abuse' },
    ]
  },
  {
    layer: 'AI / RAG Pipeline',
    color: '#1e8e3e',
    icon: '🤖',
    items: [
      { name: 'Query Classifier', desc: 'Single GPT-4o-mini call classifies meta/injection/style simultaneously — replaces 3 separate LLM calls, reduces latency by ~60%' },
      { name: 'Elasticsearch Hybrid Search', desc: 'BM25 keyword + kNN vector search over 2059 chunks — OpenAI text-embedding-3-small (1536 dims)' },
      { name: 'Fine-tuned GPT-4o-mini', desc: 'Domain-adapted on 100 UN governance QA pairs — ft:gpt-4o-mini-2024-07-18:truos::DHxtzUS8' },
      { name: 'Prompt Library', desc: '5 auto-selected styles — factual, analytical, summary, safety, adversarial' },
      { name: 'Hallucination Detector', desc: 'GPT-4o-mini judge validates every answer against retrieved context — confidence-scored, general knowledge aware' },
    ]
  },
  {
    layer: 'Data Layer',
    color: '#f9ab00',
    icon: '🗄',
    items: [
      { name: 'UN Documents', desc: '9 UN governance documents — A/80/78, A/RES/78/265, E/C.16/2025/4, A/79/L.94, A/79/966, CEB/2020/6/Add.1, GE.25-06864, GE.25-07365, IPBES/12/INF/12' },
      { name: 'OpenAI Embeddings', desc: 'text-embedding-3-small — 1536-dim vectors replacing HuggingFace/PyTorch, reduces image size by ~4GB' },
      { name: 'Redis Semantic Cache', desc: 'Cosine similarity cache at 0.95 threshold — TTL 1hr, keyed by query+style+topic' },
    ]
  },
  {
    layer: 'MLOps / Observability',
    color: '#5f6368',
    icon: '📊',
    items: [
      { name: 'LangSmith', desc: 'Full LLM call tracing — latency, tokens, cost per query, model distribution' },
      { name: 'Weights & Biases', desc: 'Experiment tracking — fine-tuning evaluation, before/after model comparison' },
      { name: 'Redis Metrics', desc: 'Real-time KPI tracking — cache hits, hallucinations, PII events, style distribution, user activity, latency percentiles' },
    ]
  },
];

const flowSteps = [
  { label: 'User Login', color: '#009edb' },
  { label: 'Registration Gate', color: '#009edb' },
  { label: 'Query Input', color: '#1a73e8' },
  { label: 'Query Classifier', color: '#7b61ff' },
  { label: 'Security Checks', color: '#d93025' },
  { label: 'PII Anonymization', color: '#d93025' },
  { label: 'Hybrid Search', color: '#1e8e3e' },
  { label: 'Prompt Construction', color: '#1e8e3e' },
  { label: 'Fine-tuned LLM', color: '#1e8e3e' },
  { label: 'Hallucination Check', color: '#f9ab00' },
  { label: 'Cache + Track', color: '#5f6368' },
  { label: 'Response', color: '#1a73e8' },
];

export default function ArchitectureTab() {
  const [activeLayer, setActiveLayer] = useState(null);

  return (
    <div>
      {/* Data Flow */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-title">Request Pipeline</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
          {flowSteps.map((step, i) => (
            <React.Fragment key={step.label}>
              <span style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '0.3rem 0.7rem', borderRadius: '20px',
                fontSize: '0.75rem', fontWeight: '500',
                background: `${step.color}18`,
                color: step.color,
                border: `1px solid ${step.color}40`,
                whiteSpace: 'nowrap'
              }}>{step.label}</span>
              {i < flowSteps.length - 1 && (
                <span style={{ color: 'var(--border)', fontSize: '0.9rem', flexShrink: 0 }}>→</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {[
          { label: 'Document Chunks', value: '2,059', color: '#1a73e8' },
          { label: 'Embedding Dims', value: '1,536', color: '#1e8e3e' },
          { label: 'Fine-tune QA Pairs', value: '100', color: '#f9ab00' },
          { label: 'LLM Calls / Query', value: '2→3', color: '#7b61ff' },
        ].map(stat => (
          <div key={stat.label} className="card" style={{ borderTop: `3px solid ${stat.color}`, marginBottom: 0, padding: '1rem' }}>
            <p style={{ fontSize: '1.5rem', fontFamily: 'Syne, sans-serif', fontWeight: '700', color: stat.color }}>{stat.value}</p>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '0.25rem' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Layer filter */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <button
          onClick={() => setActiveLayer(null)}
          style={{
            padding: '0.3rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem',
            fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit',
            border: activeLayer === null ? '2px solid var(--primary)' : '1px solid var(--border)',
            background: activeLayer === null ? 'var(--primary-light)' : 'var(--surface)',
            color: activeLayer === null ? 'var(--primary)' : 'var(--text-secondary)'
          }}>All Layers</button>
        {layers.map(l => (
          <button
            key={l.layer}
            onClick={() => setActiveLayer(activeLayer === l.layer ? null : l.layer)}
            style={{
              padding: '0.3rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem',
              fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit',
              border: activeLayer === l.layer ? `2px solid ${l.color}` : '1px solid var(--border)',
              background: activeLayer === l.layer ? `${l.color}18` : 'var(--surface)',
              color: activeLayer === l.layer ? l.color : 'var(--text-secondary)'
            }}>{l.icon} {l.layer}</button>
        ))}
      </div>

      {/* Layers */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        {layers
          .filter(l => !activeLayer || l.layer === activeLayer)
          .map(layer => (
            <div key={layer.layer} className="card" style={{
              borderLeft: `4px solid ${layer.color}`, padding: '1.25rem 1.5rem',
              transition: 'box-shadow 0.2s'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '1rem' }}>{layer.icon}</span>
                <p style={{
                  fontWeight: '700', color: layer.color,
                  fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.07em'
                }}>{layer.layer}</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
                {layer.items.map(item => (
                  <div key={item.name} style={{
                    background: 'var(--surface-2)', borderRadius: '8px',
                    padding: '0.875rem 1rem', border: '1px solid var(--border)'
                  }}>
                    <p style={{ fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.3rem', color: 'var(--text-primary)' }}>
                      {item.name}
                    </p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.55' }}>
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}