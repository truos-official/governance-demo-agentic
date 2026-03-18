import React, { useState } from 'react';

const STEPS = [
  {
    step: 1,
    name: 'Client Engagement',
    description: 'Identify business requirements, use case scope, and stakeholder needs for the AI application.',
    color: '#009edb',
    icon: '🤝',
    risks: [
      {
        risk: 'Unclear Requirements',
        kri: 'Use Case Rejection Rate',
        control: 'Structured intake form captures business problem, expected outcomes, and success criteria before any technical work begins.',
        component: 'AuthGate.js → Registration Form',
        metric: 'Registered Users — Analytics Tab',
      },
      {
        risk: 'Unauthorized Requestor',
        kri: 'Authentication Coverage',
        control: 'Azure AD authentication required before accessing the system. All users registered with organization and title.',
        component: 'staticwebapp.config.json + AuthGate.js',
        metric: 'User Activity Table — Analytics Tab',
      },
    ]
  },
  {
    step: 2,
    name: 'Use Case Review',
    description: 'FinOps assessment, budget approval, success criteria definition, accountable stakeholders, and role assignment.',
    color: '#1a73e8',
    icon: '📋',
    risks: [
      {
        risk: 'Cost Overrun',
        kri: 'Cost Per Query / Cache Hit Rate',
        control: 'Redis semantic cache at 0.95 cosine similarity threshold — repeated queries served from cache within 1hr TTL, reducing API spend.',
        component: 'semantic_cache.py → get_cached_response()',
        metric: 'Cost Per Query + Cache Hit Rate — Analytics Tab',
      },
      {
        risk: 'No Accountability',
        kri: 'Per-user Audit Coverage',
        control: 'Per-user metrics tracked in Redis — query count, hallucination rate, style distribution, last active timestamp.',
        component: 'metrics_tracker.py → track_user_query()',
        metric: 'User Activity Table — Analytics Tab',
      },
      {
        risk: 'Undefined Success Metrics',
        kri: 'KPI Coverage',
        control: 'Analytics tab tracks 15+ KPIs: hallucination rate, cache hit rate, PII detection rate, latency percentiles, cost per query.',
        component: 'AnalyticsTab.js + semantic_cache.py',
        metric: 'Full Metrics Dashboard — Analytics Tab',
      },
    ]
  },
  {
    step: 3,
    name: 'Solution Assessment',
    description: 'Evaluate technical architecture options including model selection, retrieval strategy, and deployment topology.',
    color: '#7b61ff',
    icon: '🏗️',
    risks: [
      {
        risk: 'Wrong Model Selection',
        kri: 'Hallucination Rate / Domain Accuracy',
        control: 'Fine-tuned GPT-4o-mini on 100 UN governance QA pairs — domain-adapted responses with policy-specific terminology.',
        component: 'fine_tuner.py → ft:gpt-4o-mini-2024-07-18:truos::DHxtzUS8',
        metric: 'Hallucination Rate — Analytics Tab',
      },
      {
        risk: 'Poor Retrieval Architecture',
        kri: 'Retrieval Relevance Score',
        control: 'Hybrid BM25 + kNN vector search (1536-dim OpenAI embeddings) over 2,059 document chunks for maximum recall.',
        component: 'elastic_retriever.py → hybrid_search()',
        metric: 'Source Citations Per Query — Analytics Tab',
      },
      {
        risk: 'Query Misclassification',
        kri: 'Style Detection Accuracy',
        control: 'Single LLM classifier simultaneously detects meta/injection/style — context-aware, replaces 3 separate calls.',
        component: 'query_classifier.py → classify_query()',
        metric: 'Style Distribution — Analytics Tab',
      },
    ]
  },
  {
    step: 4,
    name: 'Data Source Review',
    description: 'Determine data sources including UN ODS file system, document repositories, and external knowledge bases.',
    color: '#f9ab00',
    icon: '📁',
    risks: [
      {
        risk: 'Stale or Incomplete Data',
        kri: 'Index Freshness / Document Count',
        control: 'Elasticsearch index with 2,059 chunks from 9 UN governance documents — full re-indexing on document updates.',
        component: 'elastic_indexer.py → index_documents()',
        metric: 'Indexed Documents Count — Analytics Tab',
      },
      {
        risk: 'Out-of-corpus Queries',
        kri: 'General Knowledge Supplement Rate',
        control: 'Prompts explicitly supplement with verified general AI governance knowledge when UN documents lack coverage.',
        component: 'prompt_library.py → all 5 prompt templates',
        metric: 'Hallucination Rate — Analytics Tab',
      },
      {
        risk: 'Data Licensing Risk',
        kri: 'Document Source Traceability',
        control: 'All 9 source documents are official UN publications — tracked and cited per response with document ID.',
        component: 'elastic_retriever.py → source metadata',
        metric: 'Top Cited Documents — Analytics Tab',
      },
    ]
  },
  {
    step: 5,
    name: 'Data Management',
    description: 'API access configuration, data staging, embedding pipeline, and vector store management.',
    color: '#1e8e3e',
    icon: '⚙️',
    risks: [
      {
        risk: 'PII in Data Pipeline',
        kri: 'PII Detection Rate',
        control: 'Azure Language Services detects and redacts PII before query reaches any LLM — entity types tracked per session.',
        component: 'security.py → detect_pii() / anonymize_pii()',
        metric: 'PII Detection Rate — Analytics Tab',
      },
      {
        risk: 'Embedding Model Drift',
        kri: 'Vector Dimension Consistency',
        control: 'Fixed embedding model (text-embedding-3-small, 1536 dims) — version-locked to prevent index-query mismatch.',
        component: 'elastic_indexer.py + elastic_retriever.py',
        metric: 'Indexed Documents — Analytics Tab',
      },
      {
        risk: 'Cache Poisoning',
        kri: 'Cache Integrity Rate',
        control: 'Redis semantic cache keyed by query hash + prompt_type + topic — separate namespaces prevent cross-contamination.',
        component: 'semantic_cache.py → store_in_cache()',
        metric: 'Cache Hit Rate — Analytics Tab',
      },
    ]
  },
  {
    step: 6,
    name: 'Architecture & Information Security Review',
    description: 'Security assessment, information security certification, and architecture review against UN security standards.',
    color: '#d93025',
    icon: '🔐',
    risks: [
      {
        risk: 'Prompt Injection',
        kri: 'Injection Block Rate',
        control: 'LLM-based injection detector — GPT-4o-mini evaluates full query context with confidence scoring, not brittle pattern lists.',
        component: 'query_classifier.py → classify_query() → is_injection',
        metric: 'Security Block Rate — Security Tab',
      },
      {
        risk: 'Credential Exposure',
        kri: 'Secret Management Coverage',
        control: 'All secrets stored in Azure Key Vault (gov-demo-kv-truos) — Container App uses managed identity, no plaintext env vars.',
        component: 'Azure Key Vault + Container App Managed Identity',
        metric: 'Key Vault Secret Count — Azure Portal',
      },
      {
        risk: 'Unauthorized API Access',
        kri: 'CORS Policy Coverage',
        control: 'CORS restricted to approved origins only — localhost:3000, proud-smoke SWA, ai.truos.io.',
        component: 'api.py → CORSMiddleware',
        metric: 'CORS Violations — Container App Logs',
      },
      {
        risk: 'Token Flooding / DoS',
        kri: 'Rate Limit Hit Rate',
        control: 'Per-user rate limiting — 10 requests/minute tracked in Redis, independent per authenticated user ID.',
        component: 'security.py → check_rate_limit()',
        metric: 'Rate Limit Hits — Security Tab',
      },
    ]
  },
  {
    step: 7,
    name: 'Infrastructure Optimization',
    description: 'Right-sizing compute, scaling configuration, Redis performance tuning, and cost optimization.',
    color: '#e8710a',
    icon: '📡',
    risks: [
      {
        risk: 'Infrastructure Cost Overrun',
        kri: 'Redis Memory Usage / Cache Hit Rate',
        control: 'Redis semantic cache reduces LLM calls — keyspace hit ratio, memory usage, and uptime tracked in Analytics.',
        component: 'semantic_cache.py → get_redis_infrastructure_metrics()',
        metric: 'Redis Memory + Hit Ratio — Analytics Tab',
      },
      {
        risk: 'Container Downtime',
        kri: 'Health Check Status',
        control: 'Azure Container Apps health probes — liveness, readiness, and startup probes on port 80 with automatic restart.',
        component: '/health endpoint + Container App probes',
        metric: 'Health Status — /health endpoint',
      },
      {
        risk: 'Cold Start Latency',
        kri: 'P95 Latency',
        control: 'Minimum 1 replica always running — no scale-to-zero, warm instance ready for immediate response.',
        component: 'Container App scale config → minReplicas: 1',
        metric: 'P95 Latency — Analytics Tab',
      },
    ]
  },
  {
    step: 8,
    name: 'Solution Development',
    description: 'Iterative development, fine-tuning, evaluation, and user acceptance testing of the AI solution.',
    color: '#5f6368',
    icon: '💻',
    risks: [
      {
        risk: 'Model Quality Regression',
        kri: 'Eval Coverage / Hallucination Rate',
        control: 'Built-in Eval Runner — bulk test suite with hallucination scoring, security checks, and KPI summary on each run.',
        component: 'EvalTab.js + tests/bulk_test.py',
        metric: 'Evals Tab — Hallucination + Quality Scores',
      },
      {
        risk: 'User Feedback Loop Gap',
        kri: 'Feedback Volume / Thumbs Down Rate',
        control: 'Per-response thumbs up/down with optional comment — negative feedback flagged for fine-tune review and JSONL export.',
        component: 'QueryTab.js → handleFeedback() + /feedback endpoint',
        metric: 'Feedback Panel — Admin Tab',
      },
      {
        risk: 'CI/CD Deployment Risk',
        kri: 'Deployment Success Rate',
        control: 'GitHub Actions CI/CD — automated test → build → deploy pipeline on every push to main with rollback capability.',
        component: '.github/workflows/ci.yml',
        metric: 'GitHub Actions — Workflow Runs',
      },
    ]
  },
  {
    step: 9,
    name: 'Monitoring',
    description: 'Ongoing governance, annual compliance certification, audit trail maintenance, and performance monitoring.',
    color: '#009edb',
    icon: '📊',
    risks: [
      {
        risk: 'Lack of Observability',
        kri: 'LLM Trace Coverage',
        control: 'LangSmith traces every LLM call — latency percentiles, token usage, cost per query, model distribution, error rate.',
        component: 'LangSmith + LANGCHAIN_TRACING_V2=true',
        metric: 'LLM Observability — Analytics Tab',
      },
      {
        risk: 'No Compliance Audit Trail',
        kri: 'Query Log Completeness',
        control: 'Redis logs every query with style, sources, hallucination score, cache hit, latency, user ID — 1000 query rolling window.',
        component: 'metrics_tracker.py → track_query()',
        metric: 'Full Metrics Dashboard — Analytics Tab',
      },
      {
        risk: 'Access Control Drift',
        kri: 'Pending User Rate',
        control: 'Admin approval gate — all new users pending by default, admin approves/revokes from Admin tab with full audit log.',
        component: 'AdminTab.js + /auth/approve + /auth/revoke',
        metric: 'User Access Panel — Admin Tab',
      },
      {
        risk: 'Annual Certification Gap',
        kri: 'Governance KPI Completeness',
        control: 'All 9 governance steps tracked with risk, control, KRI, and metric — exportable for annual compliance reporting.',
        component: 'ResponsibleAITab.js — this view',
        metric: 'Full Governance Report — This Tab',
      },
    ]
  },
];

export default function ResponsibleAITab() {
  const [activeStep, setActiveStep] = useState(null);
  const [expandedRisk, setExpandedRisk] = useState(null);

  const totalRisks = STEPS.reduce((sum, s) => sum + s.risks.length, 0);
  const displayed = activeStep !== null ? STEPS.filter(s => s.step === activeStep) : STEPS;

  return (
    <div>
      {/* Header */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-title">OICT AI Enablement Process — Governance Framework</div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1rem' }}>
          9-step governance framework for Generative AI applications at the UN Secretariat OICT.
          Each step maps operational risks to implemented controls and measurable KPIs/KRIs tracked in real time.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          {[
            { label: 'Process Steps', value: STEPS.length, color: '#009edb' },
            { label: 'Risks Mapped', value: totalRisks, color: '#d93025' },
            { label: 'Controls Implemented', value: totalRisks, color: '#1e8e3e' },
            { label: 'KRIs Tracked', value: totalRisks, color: '#f9ab00' },
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

      {/* Step navigator */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveStep(null)}
          style={{
            padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem',
            fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
            border: activeStep === null ? '2px solid var(--primary)' : '1px solid var(--border)',
            background: activeStep === null ? 'var(--primary-light)' : 'var(--surface)',
            color: activeStep === null ? 'var(--primary)' : 'var(--text-secondary)'
          }}>All Steps</button>
        {STEPS.map(s => (
          <button
            key={s.step}
            onClick={() => setActiveStep(activeStep === s.step ? null : s.step)}
            style={{
              padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem',
              fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
              border: activeStep === s.step ? `2px solid ${s.color}` : '1px solid var(--border)',
              background: activeStep === s.step ? `${s.color}18` : 'var(--surface)',
              color: activeStep === s.step ? s.color : 'var(--text-secondary)'
            }}>{s.icon} Step {s.step}</button>
        ))}
      </div>

      {/* Steps */}
      {displayed.map(step => (
        <div key={step.step} style={{ marginBottom: '2rem' }}>
          {/* Step header */}
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: '1rem',
            marginBottom: '0.875rem', padding: '1rem 1.25rem',
            background: `${step.color}10`, borderRadius: '10px',
            border: `1px solid ${step.color}30`
          }}>
            <div style={{
              width: '2.5rem', height: '2.5rem', borderRadius: '50%',
              background: step.color, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Syne, sans-serif', fontWeight: '700', fontSize: '1rem',
              flexShrink: 0
            }}>{step.step}</div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span>{step.icon}</span>
                <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)' }}>
                  {step.name}
                </p>
                <span style={{
                  fontSize: '0.68rem', padding: '0.15rem 0.5rem', borderRadius: '20px',
                  background: `${step.color}20`, color: step.color,
                  border: `1px solid ${step.color}40`, fontWeight: '600'
                }}>{step.risks.length} risks</span>
              </div>
              <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{step.description}</p>
            </div>
          </div>

          {/* Risk cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingLeft: '0.5rem' }}>
            {step.risks.map(item => {
              const key = `${step.step}-${item.risk}`;
              const isExpanded = expandedRisk === key;
              return (
                <div key={item.risk} style={{
                  background: 'var(--surface)', borderRadius: '8px',
                  border: '1px solid var(--border)', overflow: 'hidden',
                  borderLeft: `4px solid ${step.color}`
                }}>
                  <div
                    onClick={() => setExpandedRisk(isExpanded ? null : key)}
                    style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', cursor: 'pointer' }}
                  >
                    {/* Risk */}
                    <div style={{ padding: '0.75rem 1rem', borderRight: '1px solid var(--border)' }}>
                      <p style={{ fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>⚠️ Risk</p>
                      <p style={{ fontWeight: '600', fontSize: '0.83rem', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>{item.risk}</p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: '1.45' }}>{item.kri}</p>
                    </div>

                    {/* Control */}
                    <div style={{ padding: '0.75rem 1rem', borderRight: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                      <p style={{ fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--success)', marginBottom: '0.25rem' }}>✓ Control</p>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.45' }}>{item.control}</p>
                    </div>

                    {/* KPI/KRI */}
                    <div style={{ padding: '0.75rem 1rem', borderRight: '1px solid var(--border)' }}>
                      <p style={{ fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', color: '#f9ab00', marginBottom: '0.25rem' }}>📊 KPI / KRI</p>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.45' }}>{item.metric}</p>
                    </div>

                    {/* Expand */}
                    <div style={{
                      padding: '0.75rem 0.75rem', display: 'flex', alignItems: 'center',
                      color: 'var(--text-tertiary)', fontSize: '0.75rem', background: 'var(--surface-2)'
                    }}>
                      {isExpanded ? '▲' : '▼'}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div style={{
                      borderTop: '1px solid var(--border)',
                      padding: '0.75rem 1rem',
                      background: `${step.color}08`,
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