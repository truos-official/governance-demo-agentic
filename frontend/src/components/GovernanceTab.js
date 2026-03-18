import React, { useState } from 'react';

const stageColors = {
  'Data Layer':            '#f9ab00',
  'Auth & User Layer':     '#009edb',
  'Security Layer':        '#d93025',
  'AI / RAG Pipeline':     '#1e8e3e',
  'API Layer':             '#7b61ff',
  'MLOps / Observability': '#5f6368',
};

const stageIcons = {
  'Data Layer':            '🗄',
  'Auth & User Layer':     '👤',
  'Security Layer':        '🔒',
  'AI / RAG Pipeline':     '🤖',
  'API Layer':             '⚡',
  'MLOps / Observability': '📊',
};

// Pipeline phase ordering mirrors Architecture tab flow
const STAGE_ORDER = [
  'Data Layer',
  'Auth & User Layer',
  'Security Layer',
  'AI / RAG Pipeline',
  'API Layer',
  'MLOps / Observability',
];

const checklist = [
  // ── Data Layer ──────────────────────────────────────────────────────────
  {
    stage: 'Data Layer',
    phase: 'Data Sourcing & Pre-processing',
    category: 'Data Provenance',
    control: '9 verified UN governance documents ingested — A/80/78, A/RES/78/265, E/C.16/2025/4, A/79/L.94, A/79/966, CEB/2020/6/Add.1, GE.25-06864, GE.25-07365, IPBES/12/INF/12',
    raiRisk: 'Domain Drift',
    kri: 'Indexed Documents',
    metricSource: 'Elasticsearch — Analytics tab',
  },
  {
    stage: 'Data Layer',
    phase: 'Data Sourcing & Pre-processing',
    category: 'Embedding Integrity',
    control: 'Full re-indexing required on embedding model change — 2,059 chunks at 1,536 dims with text-embedding-3-small',
    raiRisk: 'Stale Embeddings',
    kri: 'Index Freshness / Indexed Documents',
    metricSource: 'Elasticsearch — Analytics tab',
  },
  {
    stage: 'Data Layer',
    phase: 'Data Sourcing & Pre-processing',
    category: 'Semantic Caching',
    control: 'Redis semantic cache — cosine similarity ≥ 0.95 threshold, 1hr TTL, keyed by query + style + topic',
    raiRisk: 'Cost Overrun',
    kri: 'Cache Hit Rate + Cost Per Query',
    metricSource: 'Redis — Analytics tab',
  },

  // ── Auth & User Layer ────────────────────────────────────────────────────
  {
    stage: 'Auth & User Layer',
    phase: 'Identity & Access',
    category: 'Authentication',
    control: 'Azure Static Web Apps auth — Microsoft AAD + GitHub OAuth; all routes blocked for unauthenticated users',
    raiRisk: 'Unauthorized Access',
    kri: 'Authentication Coverage / Registered Users',
    metricSource: 'Redis — Analytics tab',
  },
  {
    stage: 'Auth & User Layer',
    phase: 'Identity & Access',
    category: 'User Accountability',
    control: 'Mandatory registration gate on first login — full name, email, title, organization, country stored in Redis',
    raiRisk: 'Anonymous Usage',
    kri: 'User Registration Rate',
    metricSource: 'Redis — Analytics tab (User Activity)',
  },
  {
    stage: 'Auth & User Layer',
    phase: 'Identity & Access',
    category: 'Access Lifecycle Governance',
    control: 'Admin-controlled approval lifecycle — pending → approved → revoked with full audit trail in Admin tab',
    raiRisk: 'Unauthorized Access',
    kri: 'Active vs Pending vs Revoked Users',
    metricSource: 'Redis — Admin tab',
  },
  {
    stage: 'Auth & User Layer',
    phase: 'Identity & Access',
    category: 'Per-User Audit Trail',
    control: 'Per-user metrics retained permanently in Redis — query count, hallucination rate, avg latency, style distribution, last active timestamp',
    raiRisk: 'No User Audit Trail',
    kri: 'Per-user Activity Log',
    metricSource: 'Redis — Analytics tab (User Activity)',
  },

  // ── Security Layer ───────────────────────────────────────────────────────
  {
    stage: 'Security Layer',
    phase: 'Input Security',
    category: 'Injection Prevention',
    control: 'LLM-based injection detector — GPT-4o-mini evaluates full query context with confidence scoring; no brittle regex pattern lists',
    raiRisk: 'Prompt Injection',
    kri: 'Security Block Rate',
    metricSource: 'Redis — Analytics tab',
  },
  {
    stage: 'Security Layer',
    phase: 'Input Security',
    category: 'Data Privacy (PII)',
    control: 'Azure Language Services — automatic PII detection + redaction before query reaches any LLM or log; entity types tracked per session',
    raiRisk: 'PII Exposure',
    kri: 'PII Detection Rate',
    metricSource: 'Azure Language — Analytics tab',
  },
  {
    stage: 'Security Layer',
    phase: 'Input Security',
    category: 'Rate & Abuse Control',
    control: 'Per-user rate limiting — 10 requests/minute tracked in Redis, independent per authenticated user ID',
    raiRisk: 'Rate Abuse',
    kri: 'Rate Limit Hit Rate',
    metricSource: 'Redis — Security tab',
  },
  {
    stage: 'Security Layer',
    phase: 'Input Security',
    category: 'Resource Governance',
    control: 'Token length validation — max 1,000 tokens per query enforced server-side before any downstream processing',
    raiRisk: 'Token Flooding',
    kri: 'Token Length Violations',
    metricSource: 'LangSmith — query length distribution',
  },

  // ── AI / RAG Pipeline ────────────────────────────────────────────────────
  {
    stage: 'AI / RAG Pipeline',
    phase: 'Query Processing',
    category: 'Query Classification',
    control: 'Single unified GPT-4o-mini call classifies meta / injection / style simultaneously — replaces 3 separate LLM calls, reduces latency ~60%',
    raiRisk: 'Query Misclassification',
    kri: 'Style Detection Accuracy / Style Distribution',
    metricSource: 'Redis — Analytics tab',
  },
  {
    stage: 'AI / RAG Pipeline',
    phase: 'Retrieval',
    category: 'Retrieval Quality',
    control: 'Hybrid BM25 keyword + kNN vector search over 2,059 chunks — OpenAI text-embedding-3-small (1,536 dims) for semantic recall',
    raiRisk: 'Poor Retrieval Quality',
    kri: 'Source Citation Rate / Top Cited Documents',
    metricSource: 'Redis + Elasticsearch — Analytics tab',
  },
  {
    stage: 'AI / RAG Pipeline',
    phase: 'Retrieval',
    category: 'Out-of-Corpus Handling',
    control: 'All 5 prompt templates explicitly supplement with verified general knowledge and label source distinction to prevent fabrication',
    raiRisk: 'Out-of-corpus Queries',
    kri: 'Hallucination Rate',
    metricSource: 'Redis — Analytics tab',
  },
  {
    stage: 'AI / RAG Pipeline',
    phase: 'Generation',
    category: 'Domain Adaptation',
    control: 'Fine-tuned GPT-4o-mini on 100 UN governance QA pairs — ft:gpt-4o-mini-2024-07-18:truos::DHxtzUS8',
    raiRisk: 'Domain Drift',
    kri: 'Source Citation Rate',
    metricSource: 'Redis + LangSmith — Analytics tab',
  },
  {
    stage: 'AI / RAG Pipeline',
    phase: 'Generation',
    category: 'Response Style Control',
    control: '5 auto-selected prompt styles — factual, analytical, summary, safety, adversarial; selected from query classifier output',
    raiRisk: 'Query Misclassification',
    kri: 'Style Distribution',
    metricSource: 'Redis — Analytics tab',
  },
  {
    stage: 'AI / RAG Pipeline',
    phase: 'Generation',
    category: 'Output Integrity / Hallucination Detection',
    control: 'GPT-4o-mini judge validates every answer against retrieved context — confidence-scored, general knowledge supplement aware',
    raiRisk: 'Hallucination',
    kri: 'Hallucination Rate',
    metricSource: 'Redis — Analytics tab',
  },
  {
    stage: 'AI / RAG Pipeline',
    phase: 'Generation',
    category: 'User Feedback Loop',
    control: 'Thumbs up/down feedback per response with optional comment — stored for fine-tune dataset export in Admin tab',
    raiRisk: 'Eval Blindness',
    kri: 'Feedback Sentiment Ratio',
    metricSource: 'Redis — Admin tab (Feedback)',
  },

  // ── API Layer ─────────────────────────────────────────────────────────────
  {
    stage: 'API Layer',
    phase: 'API Governance',
    category: 'Schema & Input Validation',
    control: 'Pydantic request/response schema validation — all inputs enforced before any downstream processing',
    raiRisk: 'Input Validation',
    kri: 'Error Rate',
    metricSource: 'LangSmith — Analytics tab',
  },
  {
    stage: 'API Layer',
    phase: 'API Governance',
    category: 'CORS & Security Headers',
    control: 'CORS_ORIGINS environment-controlled — only explicitly allowed origins can call the API',
    raiRisk: 'Unauthorized API Access',
    kri: 'Security Block Rate',
    metricSource: 'Redis — Analytics tab',
  },

  // ── MLOps / Observability ─────────────────────────────────────────────────
  {
    stage: 'MLOps / Observability',
    phase: 'Monitoring',
    category: 'LLM Call Tracing',
    control: 'LangSmith traces every LLM call — latency percentiles, token usage, cost per query, model distribution, error rate',
    raiRisk: 'Lack of Observability',
    kri: 'Avg Latency / P95 Latency / Total LLM Runs',
    metricSource: 'LangSmith — Analytics tab',
  },
  {
    stage: 'MLOps / Observability',
    phase: 'Monitoring',
    category: 'Real-time KPI Tracking',
    control: 'Redis metrics tracker — cache hits, hallucinations, PII events, security blocks, style distribution, user activity, latency percentiles',
    raiRisk: 'No Compliance Audit Trail',
    kri: 'All KPIs — Analytics tab',
    metricSource: 'Redis — Analytics tab',
  },
  {
    stage: 'MLOps / Observability',
    phase: 'Monitoring',
    category: 'Cost Governance',
    control: 'Per-query cost tracked via LangSmith — total cost, cost per query, prompt vs completion token breakdown',
    raiRisk: 'Cost Overrun',
    kri: 'Total Cost / Cost Per Query',
    metricSource: 'LangSmith — Analytics tab',
  },
  {
    stage: 'MLOps / Observability',
    phase: 'Monitoring',
    category: 'Experiment & Model Tracking',
    control: 'Weights & Biases tracks fine-tuning evaluation — before/after model comparison, training run artifacts',
    raiRisk: 'Domain Drift (Eval)',
    kri: 'Model Performance Delta',
    metricSource: 'Weights & Biases',
  },
  {
    stage: 'MLOps / Observability',
    phase: 'Continuous Evaluation',
    category: 'Bulk Evaluation',
    control: 'Built-in Eval Runner — upload CSV/Excel prompt list, auto-evaluates hallucination, security, response quality with KPI summary',
    raiRisk: 'Eval Blindness',
    kri: 'Eval Coverage / Hallucination Score',
    metricSource: 'Redis — Evals tab',
  },
  {
    stage: 'MLOps / Observability',
    phase: 'Continuous Evaluation',
    category: 'Fine-tune Data Collection',
    control: 'Admin can export collected user feedback as JSONL fine-tune dataset — closes the human feedback loop',
    raiRisk: 'Eval Blindness / Domain Drift',
    kri: 'Feedback Volume',
    metricSource: 'Redis — Admin tab',
  },
];

const PHASES = [...new Set(checklist.map(c => c.phase))];

export default function GovernanceTab() {
  const [activeStage, setActiveStage] = useState(null);
  const [activePhase, setActivePhase] = useState(null);

  const filtered = checklist.filter(item => {
    if (activeStage && item.stage !== activeStage) return false;
    if (activePhase && item.phase !== activePhase) return false;
    return true;
  });

  const totalControls = checklist.length;
  const stageCount = STAGE_ORDER.length;

  // Group filtered rows by stage for rendering
  const grouped = STAGE_ORDER
    .map(stage => ({ stage, items: filtered.filter(i => i.stage === stage) }))
    .filter(g => g.items.length > 0);

  return (
    <div>
      {/* Summary header */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-title">AI Governance Checklist</div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1.25rem' }}>
          End-to-end governance controls mapped across the full pipeline — from data sourcing and pre-processing
          through retrieval, generation, and monitoring. Each control is cross-referenced to its Responsible AI
          risk category and the KRI visible in the Analytics tab.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          {[
            { label: 'Pipeline Stages', value: stageCount, color: '#1a73e8' },
            { label: 'Total Controls', value: totalControls, color: '#1e8e3e' },
            { label: 'Controls Implemented', value: totalControls, color: '#1e8e3e' },
            { label: 'KRIs Monitored', value: totalControls, color: '#7b61ff' },
          ].map(stat => (
            <div key={stat.label} style={{
              padding: '0.875rem 1rem', borderRadius: '8px',
              background: 'var(--surface-2)', border: '1px solid var(--border)', textAlign: 'center'
            }}>
              <p style={{ fontSize: '1.75rem', fontFamily: 'Syne, sans-serif', fontWeight: '700', color: stat.color }}>{stat.value}</p>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '0.2rem' }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pipeline Stage filter */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
        <button
          onClick={() => { setActiveStage(null); setActivePhase(null); }}
          style={{
            padding: '0.3rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem',
            fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit',
            border: !activeStage && !activePhase ? '2px solid var(--primary)' : '1px solid var(--border)',
            background: !activeStage && !activePhase ? 'var(--primary-light)' : 'var(--surface)',
            color: !activeStage && !activePhase ? 'var(--primary)' : 'var(--text-secondary)'
          }}>All Stages</button>
        {STAGE_ORDER.map(stage => {
          const color = stageColors[stage];
          const active = activeStage === stage;
          return (
            <button key={stage}
              onClick={() => { setActiveStage(active ? null : stage); setActivePhase(null); }}
              style={{
                padding: '0.3rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem',
                fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit',
                border: active ? `2px solid ${color}` : '1px solid var(--border)',
                background: active ? `${color}18` : 'var(--surface)',
                color: active ? color : 'var(--text-secondary)'
              }}>{stageIcons[stage]} {stage}</button>
          );
        })}
      </div>

      {/* Phase filter */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {PHASES.map(phase => {
          const active = activePhase === phase;
          return (
            <button key={phase}
              onClick={() => { setActivePhase(active ? null : phase); setActiveStage(null); }}
              style={{
                padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.7rem',
                fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit',
                border: active ? '2px solid var(--primary)' : '1px solid var(--border)',
                background: active ? 'var(--primary-light)' : 'transparent',
                color: active ? 'var(--primary)' : 'var(--text-tertiary)'
              }}>{phase}</button>
          );
        })}
      </div>

      {/* Checklist table — grouped by stage */}
      {grouped.map(({ stage, items }) => {
        const color = stageColors[stage];
        const icon = stageIcons[stage];
        return (
          <div key={stage} style={{ marginBottom: '1.75rem' }}>
            {/* Stage header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '1rem' }}>{icon}</span>
              <p style={{
                fontWeight: '700', color, fontSize: '0.78rem',
                textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0
              }}>{stage}</p>
              <span style={{
                fontSize: '0.68rem', padding: '0.15rem 0.5rem', borderRadius: '20px',
                background: `${color}18`, color, border: `1px solid ${color}40`, fontWeight: '600'
              }}>{items.length} controls</span>
            </div>

            {/* Table */}
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', overflow: 'hidden',
              borderLeft: `4px solid ${color}`
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--surface-2)', borderBottom: `2px solid var(--border)` }}>
                      {[
                        { label: 'Governance Category', tip: 'Aligned to Architecture tab layers', width: '14%' },
                        { label: 'Control in Place', tip: 'Technical implementation', width: '30%' },
                        { label: 'RAI Risk Addressed', tip: 'From Responsible AI tab', width: '14%' },
                        { label: 'KRI / Metric', tip: 'What is tracked', width: '20%' },
                        { label: 'Where to Monitor', tip: 'Aligned to Analytics tab', width: '16%' },
                        { label: 'Status', tip: '', width: '6%' },
                      ].map(col => (
                        <th key={col.label} title={col.tip} style={{
                          padding: '0.7rem 1rem', textAlign: 'left', fontWeight: '700',
                          fontSize: '0.68rem', color: 'var(--text-secondary)',
                          textTransform: 'uppercase', letterSpacing: '0.05em',
                          whiteSpace: 'nowrap', width: col.width
                        }}>{col.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => (
                      <tr key={i} style={{
                        borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none',
                        background: i % 2 === 0 ? 'white' : 'var(--surface-2)',
                        verticalAlign: 'top'
                      }}>
                        {/* Governance Category */}
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{
                            display: 'inline-block', padding: '0.2rem 0.55rem',
                            borderRadius: '6px', fontSize: '0.73rem', fontWeight: '600',
                            background: `${color}14`, color,
                            border: `1px solid ${color}30`
                          }}>{item.category}</span>
                        </td>

                        {/* Control in Place */}
                        <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', lineHeight: '1.55', fontSize: '0.8rem' }}>
                          {item.control}
                        </td>

                        {/* RAI Risk Addressed */}
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{
                            display: 'inline-block', padding: '0.2rem 0.55rem',
                            borderRadius: '6px', fontSize: '0.72rem', fontWeight: '500',
                            background: '#d9302512', color: '#d93025',
                            border: '1px solid #d9302530'
                          }}>{item.raiRisk}</span>
                        </td>

                        {/* KRI */}
                        <td style={{ padding: '0.85rem 1rem', color: 'var(--text-primary)', fontSize: '0.78rem', fontWeight: '500', lineHeight: '1.5' }}>
                          {item.kri}
                        </td>

                        {/* Where to Monitor */}
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{
                            display: 'inline-block', padding: '0.2rem 0.55rem',
                            borderRadius: '6px', fontSize: '0.72rem', fontWeight: '500',
                            background: 'var(--success-light)', color: 'var(--success)',
                            border: '1px solid #a8d5b5'
                          }}>{item.metricSource}</span>
                        </td>

                        {/* Status */}
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: '22px', height: '22px', borderRadius: '50%',
                            background: 'var(--success)', color: '#fff',
                            fontSize: '0.75rem', fontWeight: '700'
                          }}>✓</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })}

      {filtered.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>No controls match the selected filter.</p>
        </div>
      )}
    </div>
  );
}
