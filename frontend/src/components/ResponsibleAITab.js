import React, { useState } from 'react';

const risks = [
  {
    category: 'Input Risks',
    color: '#d93025',
    icon: '⚠️',
    risks: [
      {
        risk: 'Prompt Injection',
        kri: 'Injection Block Rate',
        description: 'Malicious instructions designed to override AI behavior, extract system prompts, or bypass safety controls',
        control: 'LLM-based injection detector — GPT-4o-mini evaluates full query context with confidence scoring, no brittle pattern lists',
        component: 'query_classifier.py → classify_query()',
        metric: 'Security Block Rate — Analytics tab',
      },
      {
        risk: 'PII Exposure',
        kri: 'PII Detection Rate',
        description: 'User queries may contain personal identifiable information transmitted to external LLM APIs',
        control: 'Azure Language Services detects and redacts PII before query reaches any LLM — entity types tracked per session',
        component: 'security.py → detect_pii() / anonymize_pii()',
        metric: 'PII Detection Rate — Analytics tab',
      },
      {
        risk: 'Token Flooding',
        kri: 'Token Length Violations',
        description: 'Excessively long queries designed to exhaust context window, increase API costs, or cause DoS',
        control: 'Token length validation — max 1000 tokens per query enforced before processing',
        component: 'security.py → validate_token_length()',
        metric: 'Query length distribution — LangSmith',
      },
      {
        risk: 'Rate Abuse',
        kri: 'Rate Limit Hit Rate',
        description: 'Automated query flooding to exhaust API credits or degrade system performance for other users',
        control: 'Per-user rate limiting — 10 requests/minute tracked in Redis, independent per authenticated user ID',
        component: 'security.py → check_rate_limit()',
        metric: 'Rate Limit Hits — Security tab',
      },
    ]
  },
  {
    category: 'Identity & Access Risks',
    color: '#009edb',
    icon: '🔐',
    risks: [
      {
        risk: 'Unauthorized Access',
        kri: 'Authentication Coverage',
        description: 'Unauthenticated users accessing the system and submitting queries without accountability',
        control: 'Azure Static Web Apps auth — all routes protected, Microsoft AAD and GitHub OAuth required before any page loads',
        component: 'staticwebapp.config.json + AuthGate.js',
        metric: 'Registered Users — Analytics tab',
      },
      {
        risk: 'Anonymous Usage',
        kri: 'User Registration Rate',
        description: 'Inability to track who is using the system, from which organization, and for what purpose',
        control: 'Mandatory registration gate on first login — full name, email, title, organization, country required before access',
        component: 'AuthGate.js → handleSubmit() + /register endpoint',
        metric: 'User Activity Table — Analytics tab',
      },
      {
        risk: 'No User Audit Trail',
        kri: 'Per-user Activity Log',
        description: 'Unable to attribute queries, hallucinations, or security events to specific users for compliance',
        control: 'Per-user metrics tracked in Redis — query count, hallucination rate, avg latency, style distribution, last active',
        component: 'metrics_tracker.py → track_user_query()',
        metric: 'User Activity Table — Analytics tab',
      },
    ]
  },
  {
    category: 'Model Risks',
    color: '#f9ab00',
    icon: '🤖',
    risks: [
      {
        risk: 'Hallucination',
        kri: 'Hallucination Rate',
        description: 'Model generates plausible but factually incorrect answers not grounded in UN documents',
        control: 'GPT-4o-mini judge evaluates every answer against retrieved context — confidence-scored, general knowledge supplement aware',
        component: 'hallucination_detector.py → detect_hallucination()',
        metric: 'Hallucination Rate — Analytics tab',
      },
      {
        risk: 'Domain Drift',
        kri: 'Source Citation Rate',
        description: 'Generic base model lacks UN-specific terminology, policy nuance, and document knowledge',
        control: 'Fine-tuned GPT-4o-mini on 100 UN governance QA pairs — domain-adapted responses with policy terminology',
        component: 'fine_tuner.py → ft:gpt-4o-mini-2024-07-18:truos',
        metric: 'Top Cited Documents — Analytics tab',
      },
      {
        risk: 'Query Misclassification',
        kri: 'Style Detection Accuracy',
        description: 'Wrong response style applied — factual prompt on a risk assessment query produces inferior output',
        control: 'Single LLM classifier call simultaneously detects meta/injection/style — context-aware, replaces 3 separate calls',
        component: 'query_classifier.py → classify_query()',
        metric: 'Style Distribution — Analytics tab',
      },
    ]
  },
  {
    category: 'Retrieval Risks',
    color: '#7b61ff',
    icon: '🔍',
    risks: [
      {
        risk: 'Poor Retrieval Quality',
        kri: 'Retrieval Relevance Score',
        description: 'Keyword-only search misses semantically relevant document chunks — wrong context passed to LLM',
        control: 'Hybrid search — BM25 keyword + kNN vector search (1536-dim OpenAI embeddings) combined for maximum recall',
        component: 'elastic_retriever.py → hybrid_search()',
        metric: 'Source citations per query — Analytics tab',
      },
      {
        risk: 'Out-of-corpus Queries',
        kri: 'General Knowledge Supplement Rate',
        description: 'Questions outside the 9 UN documents return empty context — risk of fabricated answers',
        control: 'Prompts explicitly supplement with verified general knowledge and clearly label source distinction',
        component: 'prompt_library.py → all 5 templates',
        metric: 'Hallucination Rate — Analytics tab',
      },
      {
        risk: 'Stale Embeddings',
        kri: 'Index Freshness',
        description: 'Elasticsearch index built with old embedding model — vector dimensions mismatch after model change',
        control: 'Full re-indexing required on embedding model change — 2059 chunks with text-embedding-3-small (1536 dims)',
        component: 'elastic_indexer.py → index_documents()',
        metric: 'Indexed Documents — Analytics tab',
      },
    ]
  },
  {
    category: 'Operational Risks',
    color: '#1e8e3e',
    icon: '⚙️',
    risks: [
      {
        risk: 'Cost Overrun',
        kri: 'Cache Hit Rate / Cost Per Query',
        description: 'Repeated identical queries consuming unnecessary OpenAI API credits',
        control: 'Redis semantic cache — cosine similarity at 0.95 threshold serves cached responses within 1hr TTL',
        component: 'semantic_cache.py → get_cached_response()',
        metric: 'Cache Hit Rate + Cost Per Query — Analytics tab',
      },
      {
        risk: 'Lack of Observability',
        kri: 'LLM Trace Coverage',
        description: 'No visibility into model behavior, latency distribution, costs, or failure modes in production',
        control: 'LangSmith traces every LLM call — latency percentiles, token usage, cost, model distribution, error rate',
        component: 'LangSmith + metrics_tracker.py',
        metric: 'LLM Observability — Analytics tab',
      },
      {
        risk: 'No Compliance Audit Trail',
        kri: 'Query Log Completeness',
        description: 'Unable to reconstruct what was asked, retrieved, and answered for regulatory compliance',
        control: 'Redis logs every query with style, sources, hallucination score, cache hit, latency, user ID',
        component: 'metrics_tracker.py → track_query() + track_user_query()',
        metric: 'Full metrics — Analytics tab',
      },
      {
        risk: 'Eval Blindness',
        kri: 'Eval Coverage',
        description: 'No systematic way to test system quality after changes to prompts, models, or documents',
        control: 'Built-in Eval Runner — upload prompt list, auto-evaluates hallucination, security, response quality with KPI summary',
        component: 'EvalTab.js → runEvals()',
        metric: 'Evals tab',
      },
    ]
  },
];

export default function ResponsibleAITab() {
  const [activeCategory, setActiveCategory] = useState(null);
  const [expandedRisk, setExpandedRisk] = useState(null);

  const totalRisks = risks.reduce((sum, c) => sum + c.risks.length, 0);

  return (
    <div>
      {/* Header card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-title">Responsible AI Framework</div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1rem' }}>
          End-to-end risk identification and control mapping across the full AI pipeline.
          Every risk has a corresponding technical control implemented in the system with a measurable KRI tracked in real time.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          {[
            { label: 'Risk Categories', value: risks.length, color: '#d93025' },
            { label: 'Total Risks Mapped', value: totalRisks, color: '#f9ab00' },
            { label: 'Controls Implemented', value: totalRisks, color: '#1e8e3e' },
            { label: 'KRIs Tracked', value: totalRisks, color: '#1a73e8' },
          ].map(stat => (
            <div key={stat.label} style={{
              padding: '0.875rem 1rem', borderRadius: '8px',
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '1.75rem', fontFamily: 'Syne, sans-serif', fontWeight: '700', color: stat.color }}>{stat.value}</p>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '0.2rem' }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <button
          onClick={() => setActiveCategory(null)}
          style={{
            padding: '0.3rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem',
            fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit',
            border: activeCategory === null ? '2px solid var(--primary)' : '1px solid var(--border)',
            background: activeCategory === null ? 'var(--primary-light)' : 'var(--surface)',
            color: activeCategory === null ? 'var(--primary)' : 'var(--text-secondary)'
          }}>All Categories</button>
        {risks.map(c => (
          <button
            key={c.category}
            onClick={() => setActiveCategory(activeCategory === c.category ? null : c.category)}
            style={{
              padding: '0.3rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem',
              fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit',
              border: activeCategory === c.category ? `2px solid ${c.color}` : '1px solid var(--border)',
              background: activeCategory === c.category ? `${c.color}18` : 'var(--surface)',
              color: activeCategory === c.category ? c.color : 'var(--text-secondary)'
            }}>{c.icon} {c.category}</button>
        ))}
      </div>

      {/* Risk cards */}
      {risks
        .filter(c => !activeCategory || c.category === activeCategory)
        .map(category => (
          <div key={category.category} style={{ marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.875rem' }}>
              <span style={{ fontSize: '1rem' }}>{category.icon}</span>
              <p className="section-label" style={{ margin: 0 }}>{category.category}</p>
              <span style={{
                fontSize: '0.68rem', padding: '0.15rem 0.5rem', borderRadius: '20px',
                background: `${category.color}18`, color: category.color,
                border: `1px solid ${category.color}40`, fontWeight: '600'
              }}>{category.risks.length} risks</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {category.risks.map(item => {
                const key = `${category.category}-${item.risk}`;
                const isExpanded = expandedRisk === key;
                return (
                  <div key={item.risk} style={{
                    background: 'var(--surface)', borderRadius: '10px',
                    border: '1px solid var(--border)', overflow: 'hidden',
                    boxShadow: 'var(--shadow-1)',
                    borderLeft: `4px solid ${category.color}`
                  }}>
                    {/* Collapsed row */}
                    <div
                      onClick={() => setExpandedRisk(isExpanded ? null : key)}
                      style={{
                        display: 'grid', gridTemplateColumns: '1fr 1fr auto',
                        gap: '0', cursor: 'pointer'
                      }}
                    >
                      {/* Risk */}
                      <div style={{ padding: '0.875rem 1.25rem', borderRight: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                          <span style={{ fontSize: '0.75rem' }}>⚠️</span>
                          <p style={{ fontWeight: '600', fontSize: '0.875rem', color: 'var(--text-primary)' }}>{item.risk}</p>
                        </div>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{item.description}</p>
                      </div>

                      {/* Control */}
                      <div style={{ padding: '0.875rem 1.25rem', background: 'var(--surface-2)', borderRight: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                          <span style={{ color: 'var(--success)', fontSize: '0.85rem' }}>✓</span>
                          <p style={{ fontWeight: '600', fontSize: '0.875rem', color: 'var(--success)' }}>Control</p>
                        </div>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{item.control}</p>
                      </div>

                      {/* Expand toggle */}
                      <div style={{
                        padding: '0.875rem 1rem', display: 'flex', alignItems: 'center',
                        color: 'var(--text-tertiary)', fontSize: '0.8rem', background: 'var(--surface-2)'
                      }}>
                        {isExpanded ? '▲' : '▼'}
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div style={{
                        borderTop: '1px solid var(--border)',
                        padding: '0.875rem 1.25rem',
                        background: `${category.color}08`,
                        display: 'flex', gap: '2rem', flexWrap: 'wrap'
                      }}>
                        <div>
                          <p style={{ fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: '0.3rem' }}>Implementation</p>
                          <code style={{
                            fontSize: '0.75rem', background: 'var(--primary-light)',
                            color: 'var(--primary)', padding: '0.25rem 0.6rem',
                            borderRadius: '4px', display: 'inline-block'
                          }}>{item.component}</code>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: '0.3rem' }}>KRI / Monitoring</p>
                          <span style={{
                            fontSize: '0.75rem', background: 'var(--success-light)',
                            color: 'var(--success)', padding: '0.25rem 0.6rem',
                            borderRadius: '4px', display: 'inline-block', fontWeight: '500'
                          }}>{item.metric}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
    </div>
  );
}