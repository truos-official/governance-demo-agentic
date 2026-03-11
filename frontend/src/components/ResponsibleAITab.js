import React from 'react';

const risks = [
  {
    category: 'Input Risks',
    color: '#d93025',
    risks: [
      {
        risk: 'Prompt Injection',
        description: 'Malicious instructions embedded in user queries to override system behavior',
        control: 'Pattern-based injection detector — 8 adversarial patterns screened before processing',
        component: 'security.py → detect_injection()',
      },
      {
        risk: 'PII Exposure',
        description: 'User queries may contain personal identifiable information sent to LLM',
        control: 'Microsoft Presidio anonymizes PII before query reaches the model',
        component: 'security.py → anonymize_pii()',
      },
      {
        risk: 'Token Flooding',
        description: 'Excessively long queries designed to exhaust context window or increase costs',
        control: 'Token length validation — max 1000 tokens per query',
        component: 'security.py → validate_token_length()',
      },
      {
        risk: 'Rate Abuse',
        description: 'Automated query flooding to exhaust API credits or degrade performance',
        control: 'Per-user rate limiting — 10 requests per minute tracked in Redis',
        component: 'security.py → check_rate_limit()',
      },
    ]
  },
  {
    category: 'Model Risks',
    color: '#f9ab00',
    risks: [
      {
        risk: 'Hallucination',
        description: 'Model generates plausible but factually incorrect answers not grounded in documents',
        control: 'GPT-4 judge evaluates every answer against retrieved context — flags and scores hallucinations',
        component: 'hallucination_detector.py → detect_hallucination()',
      },
      {
        risk: 'Domain Drift',
        description: 'Generic model lacks UN-specific terminology and policy knowledge',
        control: 'Fine-tuned GPT-4o-mini on 100 UN governance QA pairs — domain-adapted responses',
        component: 'fine_tuner.py → ft:gpt-4o-mini-2024-07-18:truos',
      },
      {
        risk: 'Prompt Misrouting',
        description: 'Wrong prompt style applied to query — e.g. factual prompt for risk assessment query',
        control: 'Auto style detection — GPT-4o-mini classifies intent and routes to appropriate prompt',
        component: 'topic_classifier.py → detect_style()',
      },
    ]
  },
  {
    category: 'Retrieval Risks',
    color: '#7b61ff',
    risks: [
      {
        risk: 'Poor Retrieval Quality',
        description: 'Keyword-only search misses semantically relevant documents',
        control: 'Hybrid search — BM25 keyword + kNN vector search combined for higher recall',
        component: 'elastic_retriever.py → hybrid_search()',
      },
      {
        risk: 'Out-of-corpus Queries',
        description: 'Questions outside the document corpus return empty or fabricated answers',
        control: 'Prompts supplement with general knowledge and clearly label source',
        component: 'prompt_library.py → all templates',
      },
    ]
  },
  {
    category: 'Operational Risks',
    color: '#1e8e3e',
    risks: [
      {
        risk: 'Cost Overrun',
        description: 'Repeated identical queries consuming unnecessary API credits',
        control: 'Redis semantic cache — cosine similarity threshold 0.95 serves cached responses',
        component: 'semantic_cache.py → get_cached_response()',
      },
      {
        risk: 'Lack of Observability',
        description: 'No visibility into model behavior, costs, or failures in production',
        control: 'LangSmith traces every LLM call — latency, tokens, cost. W&B tracks experiments.',
        component: 'LangSmith + Weights & Biases',
      },
      {
        risk: 'No Audit Trail',
        description: 'Unable to reconstruct what was asked, retrieved, and answered for compliance',
        control: 'Redis metrics tracker logs every query — style, sources, hallucination score, cache hit',
        component: 'metrics_tracker.py + /metrics endpoint',
      },
    ]
  },
];

export default function ResponsibleAITab() {
  return (
    <div>
      <div className="card">
        <div className="card-title">Responsible AI Framework</div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
          End-to-end risk identification and control mapping across the full AI pipeline.
          Every risk has a corresponding technical control implemented in the system.
        </p>
      </div>

      {risks.map(category => (
        <div key={category.category}>
          <p className="section-label" style={{ marginTop: '0.5rem' }}>{category.category}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
            {category.risks.map(item => (
              <div key={item.risk} style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0',
                background: 'var(--surface)', borderRadius: '10px',
                border: '1px solid var(--border)', overflow: 'hidden',
                boxShadow: 'var(--shadow-1)'
              }}>
                <div style={{
                  padding: '1rem 1.25rem',
                  borderRight: '1px solid var(--border)',
                  borderLeft: `4px solid ${category.color}`
                }}>
                  <p style={{ fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                    ⚠️ {item.risk}
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.55' }}>
                    {item.description}
                  </p>
                </div>
                <div style={{ padding: '1rem 1.25rem', background: 'var(--surface-2)' }}>
                  <p style={{ fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.35rem', color: 'var(--success)' }}>
                    ✓ Control
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.55', marginBottom: '0.5rem' }}>
                    {item.control}
                  </p>
                  <code style={{
                    fontSize: '0.72rem', background: 'var(--primary-light)',
                    color: 'var(--primary)', padding: '0.2rem 0.5rem',
                    borderRadius: '4px'
                  }}>
                    {item.component}
                  </code>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}