import React from 'react';

const layers = [
  {
    layer: 'Frontend',
    color: '#1a73e8',
    items: [
      { name: 'React UI', desc: 'Five-tab governance dashboard — Query, Analytics, Security, Architecture, Responsible AI' },
      { name: 'Axios', desc: 'HTTP client for FastAPI backend communication' },
      { name: 'Recharts', desc: 'KPI visualizations — style distribution, document citations, metrics' },
    ]
  },
  {
    layer: 'API Layer',
    color: '#7b61ff',
    items: [
      { name: 'FastAPI', desc: 'REST API — /query, /metrics, /security-events endpoints' },
      { name: 'Pydantic', desc: 'Request/response validation and schema enforcement' },
      { name: 'Uvicorn', desc: 'ASGI server for async request handling' },
    ]
  },
  {
    layer: 'Security Layer',
    color: '#d93025',
    items: [
      { name: 'Microsoft Presidio', desc: 'PII detection and anonymization before query reaches LLM' },
      { name: 'Injection Detector', desc: 'Pattern-based prompt injection detection — 8 adversarial patterns' },
      { name: 'Rate Limiter', desc: 'Per-user request throttling — 10 requests/minute via Redis' },
    ]
  },
  {
    layer: 'AI / RAG Pipeline',
    color: '#1e8e3e',
    items: [
      { name: 'Elasticsearch', desc: 'Hybrid search — BM25 keyword + kNN vector search over 2059 chunks' },
      { name: 'Fine-tuned GPT-4o-mini', desc: 'Domain-adapted model trained on 100 UN governance QA pairs' },
      { name: 'Prompt Library', desc: 'Five auto-selected prompt styles — factual, analytical, summary, safety, adversarial' },
      { name: 'Style Detector', desc: 'GPT-4o-mini classifies query intent and routes to appropriate prompt' },
      { name: 'Hallucination Detector', desc: 'GPT-4 judge validates answer grounding against retrieved context' },
    ]
  },
  {
    layer: 'Data Layer',
    color: '#f9ab00',
    items: [
      { name: 'UN Documents', desc: '9 UN governance documents — A/80/78, A/RES/78/265, E/C.16/2025/4 and others' },
      { name: 'Redis Semantic Cache', desc: 'Cosine similarity cache — avoids duplicate LLM calls, 0.95 threshold' },
      { name: 'Sentence Transformers', desc: 'all-MiniLM-L6-v2 — 384-dim embeddings for vector search and cache' },
    ]
  },
  {
    layer: 'MLOps / Observability',
    color: '#5f6368',
    items: [
      { name: 'LangSmith', desc: 'Full LLM call tracing — latency, tokens, cost per query' },
      { name: 'Weights & Biases', desc: 'Experiment tracking — fine-tuning evaluation, model comparison' },
      { name: 'Redis Metrics', desc: 'Real-time KPI tracking — cache hits, security events, style distribution' },
    ]
  },
];

const flowSteps = [
  'User Query', 'Security Checks', 'PII Anonymization', 'Style Detection',
  'Hybrid Search', 'Prompt Construction', 'Fine-tuned LLM',
  'Hallucination Check', 'Cache Storage', 'Response'
];

export default function ArchitectureTab() {
  return (
    <div>
      <div className="card">
        <div className="card-title">Data Flow</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          {flowSteps.map((step, i) => (
            <React.Fragment key={step}>
              <span className="flow-step">{step}</span>
              {i < flowSteps.length - 1 && <span className="flow-arrow">→</span>}
            </React.Fragment>
          ))}
        </div>
      </div>

      <p className="section-label">System Components</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {layers.map(layer => (
          <div key={layer.layer} className="card" style={{ borderLeft: `4px solid ${layer.color}`, padding: '1.25rem 1.5rem' }}>
            <p style={{
              fontWeight: '600', color: layer.color, marginBottom: '1rem',
              fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em'
            }}>
              {layer.layer}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
              {layer.items.map(item => (
                <div key={item.name} style={{
                  background: 'var(--surface-2)', borderRadius: '8px',
                  padding: '0.875rem 1rem', border: '1px solid var(--border)'
                }}>
                  <p style={{ fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.3rem', color: 'var(--text-primary)' }}>
                    {item.name}
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.55' }}>
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