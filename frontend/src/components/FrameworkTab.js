import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

// ─── Step data ────────────────────────────────────────────────────────────────

const STEPS = [
  {
    step: 1, name: 'Client Engagement', color: '#009edb',
    input: 'Business need identified',
    output: 'Approved use case brief with named accountable owner',
    requirements: [
      { req: 'Documented business problem — specific decision or workflow being improved', policy: 'ICT Project Management', url: 'https://policy.un.org/en/information-and-technology/ict-project-management' },
      { req: 'Measurable success criteria — outcomes, not activities', policy: 'ICT Project Management', url: 'https://policy.un.org/en/information-and-technology/ict-project-management' },
      { req: 'Named accountable owner and designated AI Focal Point', policy: 'Use of ICT Resources (ST/SGB/2004/15)', url: 'https://www.undocs.org/en/ST/SGB/2004/15' },
      { req: 'FinOps estimate — cost per query at projected volume with approved budget', policy: 'ICT Project Management', url: 'https://policy.un.org/en/information-and-technology/ict-project-management' },
      { req: 'Alternatives assessment — why RAG, not simpler search or FAQ', policy: 'Use of ICT Resources (ST/SGB/2004/15)', url: 'https://www.undocs.org/en/ST/SGB/2004/15' },
    ],
    controls: [
      { control: 'User registration with org and title captured', status: '🟢', metric: 'total_registered_users', label: 'Registered users', tab: 'admin' },
      { control: 'Named admin approval before access granted', status: '🟢', metric: null, label: 'Pending approvals', tab: 'admin' },
      { control: 'Per-user query attribution', status: '🟢', metric: 'total_queries', label: 'Total queries', tab: 'analytics' },
    ],
  },
  {
    step: 2, name: 'Use Case Review', color: '#1a73e8',
    input: 'Approved use case brief',
    output: 'Filed AI Impact Assessment with risk tier (Low / Medium / High / Very High)',
    requirements: [
      { req: 'Formal risk classification: Low / Medium / High / Very High', policy: 'Data Protection and Privacy (ST/SGB/2024/3)', url: 'https://www.undocs.org/en/ST/SGB/2024/3' },
      { req: 'Foreseeable harms documented by multidisciplinary team', policy: 'ICT Security Portal', url: 'https://policy.un.org/en/information-and-technology/ict-security' },
      { req: 'Compliance check: data protection, human rights, international law', policy: 'Data Protection and Privacy (ST/SGB/2024/3)', url: 'https://www.undocs.org/en/ST/SGB/2024/3' },
      { req: 'Third-party model risk: provider data terms, retention, cross-border transfer', policy: 'Internet Portal', url: 'https://policy.un.org/en/information-and-technology/internet' },
      { req: 'Impact assessment filed in OICT environment, reviewed every 24 months', policy: 'ICT Project Management', url: 'https://policy.un.org/en/information-and-technology/ict-project-management' },
    ],
    controls: [
      { control: 'Hallucination detection on every response with confidence scoring', status: '🟢', metric: 'hallucination_rate', label: 'Hallucination rate', tab: 'governance' },
      { control: 'PII detection before any LLM interaction', status: '🟢', metric: 'pii_detection_rate', label: 'PII detection rate', tab: 'security' },
      { control: 'Injection attempt detection and blocking', status: '🟢', metric: 'security_block_rate', label: 'Block rate', tab: 'security' },
      { control: 'Risk/control/KRI mapping documented', status: '🟢', metric: null, label: '9 steps mapped', tab: 'governance' },
    ],
  },
  {
    step: 3, name: 'Solution Assessment', color: '#7b61ff',
    input: 'Filed impact assessment with risk tier',
    output: 'Documented technology decision with model choice, hosting boundary, and cost model',
    requirements: [
      { req: 'Model strategy: custom / fine-tuned / base LLM — rationale documented', policy: 'ICT Security Portal', url: 'https://policy.un.org/en/information-and-technology/ict-security' },
      { req: 'Open vs. closed source: training data provenance, licensing, auditability', policy: 'Data Protection and Privacy (ST/SGB/2024/3)', url: 'https://www.undocs.org/en/ST/SGB/2024/3' },
      { req: 'Hosting decision: public cloud / private cloud / on-prem / hybrid — data boundary defined', policy: 'Internet Portal', url: 'https://policy.un.org/en/information-and-technology/internet' },
      { req: 'Provider terms reviewed: does provider train on queries? Retention period?', policy: 'Internet Portal', url: 'https://policy.un.org/en/information-and-technology/internet' },
      { req: 'Retrieval strategy selected and justified: keyword / semantic / hybrid', policy: 'ICT Project Management', url: 'https://policy.un.org/en/information-and-technology/ict-project-management' },
      { req: 'Cost model documented: per-token pricing vs. infrastructure cost at projected volume', policy: 'ICT Project Management', url: 'https://policy.un.org/en/information-and-technology/ict-project-management' },
      { req: 'Lock-in risk assessed: can model be replaced without re-architecting?', policy: 'ICT Project Management', url: 'https://policy.un.org/en/information-and-technology/ict-project-management' },
    ],
    controls: [
      { control: 'Fine-tuned GPT-4o-mini on domain corpus', status: '🟢', metric: null, label: 'ft:gpt-4o-mini', tab: 'architecture' },
      { control: 'Hybrid BM25 + kNN retrieval', status: '🟢', metric: 'es_document_count', label: 'Chunks indexed', tab: 'architecture' },
      { control: 'Semantic cache reducing redundant API calls', status: '🟢', metric: 'cache_hit_rate', label: 'Cache hit rate', tab: 'analytics' },
      { control: 'Cost per query tracked in real time', status: '🟢', metric: 'cost_per_query', label: 'Cost per query', tab: 'analytics' },
      { control: 'Query style auto-classification (5 styles)', status: '🟢', metric: null, label: '5 styles active', tab: 'analytics' },
    ],
  },
  {
    step: 4, name: 'Data Source Review', color: '#f9ab00',
    input: 'Approved technology decision and hosting boundary',
    output: 'Approved data source inventory with classification, legal basis, and connectivity map',
    requirements: [
      { req: 'Full source inventory: documents, databases, APIs, data catalogue entries, real-time feeds', policy: 'Data and Information Portal', url: 'https://policy.un.org/en/information-and-technology/data-and-information' },
      { req: 'API connectivity documented: endpoint, auth method, rate limits, versioning, SLA', policy: 'Data and Information Portal', url: 'https://policy.un.org/en/information-and-technology/data-and-information' },
      { req: 'Data classification per source: Public / Internal / Confidential / Restricted', policy: 'Information Sensitivity (ST/SGB/2007/6)', url: 'https://www.undocs.org/en/ST/SGB/2007/6' },
      { req: 'Legal basis for processing each source in an AI system', policy: 'Data Protection and Privacy (ST/SGB/2024/3)', url: 'https://www.undocs.org/en/ST/SGB/2024/3' },
      { req: 'Privacy impact assessment where personal data is involved', policy: 'Data Protection and Privacy (ST/SGB/2024/3)', url: 'https://www.undocs.org/en/ST/SGB/2024/3' },
      { req: 'Data quality readiness: completeness, currency, consistency, noise ratio', policy: 'Data and Information Portal', url: 'https://policy.un.org/en/information-and-technology/data-and-information' },
      { req: 'Enterprise data catalogue registration for all approved sources', policy: 'Record-keeping and UN Archives (ST/SGB/2007/5)', url: 'https://www.undocs.org/en/ST/SGB/2007/5' },
    ],
    controls: [
      { control: 'Source document inventory with provenance', status: '🟢', metric: 'es_document_count', label: 'Documents indexed', tab: 'architecture' },
      { control: 'Source cited on every response', status: '🟢', metric: null, label: 'Citations active', tab: 'analytics' },
      { control: 'PII scrubbing before LLM receives content', status: '🟢', metric: 'pii_detection_rate', label: 'PII events', tab: 'security' },
    ],
  },
  {
    step: 5, name: 'Data Management', color: '#1e8e3e',
    input: 'Approved source inventory and connectivity map',
    output: 'Governed data pipeline with lineage, freshness SLA, cost baseline, and residency confirmation',
    requirements: [
      { req: 'Ingestion pipeline documented, version-controlled, reproducible per source type', policy: 'Data and Information Portal', url: 'https://policy.un.org/en/information-and-technology/data-and-information' },
      { req: 'Embedding model governance: fixed version, documented dimensions, change control', policy: 'ICT Project Management', url: 'https://policy.un.org/en/information-and-technology/ict-project-management' },
      { req: 'Index freshness SLA: update frequency defined, staleness alerts configured', policy: 'Data and Information Portal', url: 'https://policy.un.org/en/information-and-technology/data-and-information' },
      { req: 'Cache governance: similarity threshold, TTL, and invalidation rules documented', policy: 'ICT Security Portal', url: 'https://policy.un.org/en/information-and-technology/ict-security' },
      { req: 'Data lineage: every output chunk traceable to source document or API version', policy: 'Record-keeping and UN Archives (ST/SGB/2007/5)', url: 'https://www.undocs.org/en/ST/SGB/2007/5' },
      { req: 'FinOps baseline: cost per query at load, scaling limits, budget alerts active', policy: 'ICT Project Management', url: 'https://policy.un.org/en/information-and-technology/ict-project-management' },
      { req: 'Data residency confirmed: processing location, transit path, cross-border rules', policy: 'Internet Portal', url: 'https://policy.un.org/en/information-and-technology/internet' },
    ],
    controls: [
      { control: 'Elasticsearch hybrid index (BM25 + kNN, 1536 dims)', status: '🟢', metric: 'es_document_count', label: '2,059 chunks', tab: 'architecture' },
      { control: 'Redis semantic cache (0.95 threshold, 1hr TTL)', status: '🟢', metric: 'cache_hit_rate', label: 'Cache hit rate', tab: 'analytics' },
      { control: 'Cost per query via LangSmith', status: '🟢', metric: 'cost_per_query', label: 'Live cost', tab: 'analytics' },
      { control: 'Redis memory and keyspace metrics', status: '🟢', metric: 'redis_memory_used', label: 'Memory used', tab: 'analytics' },
      { control: 'Latency percentiles p50 / p95 / p99', status: '🟢', metric: 'latency_p50', label: 'p50 latency', tab: 'analytics' },
    ],
  },
  {
    step: 6, name: 'Architecture & InfoSec Review', color: '#d93025',
    input: 'Data pipeline design and hosting boundary',
    output: 'IS-certified architecture with formal security sign-off before go-live',
    requirements: [
      { req: 'RAG threat model: prompt injection, data exfiltration, knowledge base poisoning, embedding inversion', policy: 'ICT Security Portal', url: 'https://policy.un.org/en/information-and-technology/ict-security' },
      { req: 'Secrets vault: no plaintext credentials anywhere in the system', policy: 'ICT Security Portal', url: 'https://policy.un.org/en/information-and-technology/ict-security' },
      { req: 'Network controls: egress restrictions, approved API domains, CORS policy enforced', policy: 'Internet Portal', url: 'https://policy.un.org/en/information-and-technology/internet' },
      { req: 'Authentication: verified identity required, document-level access where applicable', policy: 'Use of ICT Resources (ST/SGB/2004/15)', url: 'https://www.undocs.org/en/ST/SGB/2004/15' },
      { req: 'LLM provider contract reviewed: data retention, model isolation, cross-border transfer', policy: 'Data Protection and Privacy (ST/SGB/2024/3)', url: 'https://www.undocs.org/en/ST/SGB/2024/3' },
      { req: 'Formal IS certification issued before any user traffic is routed', policy: 'ICT Security Portal', url: 'https://policy.un.org/en/information-and-technology/ict-security' },
    ],
    controls: [
      { control: 'Azure Key Vault — all secrets vault-managed', status: '🟢', metric: null, label: '12 secrets protected', tab: 'architecture' },
      { control: 'Managed identity — zero plaintext credentials', status: '🟢', metric: null, label: 'System-assigned', tab: 'architecture' },
      { control: 'CORS restricted to approved domains only', status: '🟢', metric: null, label: '3 approved origins', tab: 'security' },
      { control: 'Injection detection on every query', status: '🟢', metric: 'security_block_rate', label: 'Block rate', tab: 'security' },
      { control: 'Azure AD authentication required', status: '🟢', metric: null, label: 'Auth active', tab: 'security' },
    ],
  },
  {
    step: 7, name: 'Infrastructure Optimization', color: '#e8710a',
    input: 'Certified architecture',
    output: 'Production-ready infrastructure with cost controls, health monitoring, and DR plan',
    requirements: [
      { req: 'Compute right-sizing: CPU, memory, replica count matched to SLA and cost target', policy: 'ICT Project Management', url: 'https://policy.un.org/en/information-and-technology/ict-project-management' },
      { req: 'Auto-scaling configured with defined minimum replicas — no uncontrolled cold starts', policy: 'ICT Project Management', url: 'https://policy.un.org/en/information-and-technology/ict-project-management' },
      { req: 'Health probes active: liveness, readiness, startup checks with alerting thresholds', policy: 'ICT Security Portal', url: 'https://policy.un.org/en/information-and-technology/ict-security' },
      { req: 'Budget alerts configured: cost threshold triggers before overspend occurs', policy: 'ICT Project Management', url: 'https://policy.un.org/en/information-and-technology/ict-project-management' },
      { req: 'Disaster recovery: RTO/RPO defined for knowledge base and inference service', policy: 'ICT Security Portal', url: 'https://policy.un.org/en/information-and-technology/ict-security' },
      { req: 'ICT devices and endpoints used by users governed and approved', policy: 'ICT Devices Portal', url: 'https://policy.un.org/en/information-and-technology/ict-devices' },
    ],
    controls: [
      { control: 'Container Apps: 0.5 CPU / 1Gi RAM / min 1 replica', status: '🟢', metric: null, label: 'Running', tab: 'architecture' },
      { control: 'Liveness + readiness + startup probes active', status: '🟢', metric: null, label: 'Health: connected', tab: 'analytics' },
      { control: 'Redis uptime and connected clients tracked', status: '🟢', metric: 'redis_uptime_days', label: 'Uptime days', tab: 'analytics' },
      { control: 'Max 3 replicas auto-scaling configured', status: '🟢', metric: null, label: 'Scale config', tab: 'architecture' },
    ],
  },
  {
    step: 8, name: 'Solution Development', color: '#5f6368',
    input: 'Production-ready infrastructure',
    output: 'Quality-assured, adversarially-tested application with user acceptance sign-off',
    requirements: [
      { req: 'Evaluation harness: representative test queries with documented expected outputs', policy: 'ICT Project Management', url: 'https://policy.un.org/en/information-and-technology/ict-project-management' },
      { req: 'Hallucination measurement: methodology documented, threshold defined in impact assessment', policy: 'Data Protection and Privacy (ST/SGB/2024/3)', url: 'https://www.undocs.org/en/ST/SGB/2024/3' },
      { req: 'Adversarial testing: injection, PII extraction, jailbreak before go-live', policy: 'ICT Security Portal', url: 'https://policy.un.org/en/information-and-technology/ict-security' },
      { req: 'User feedback loop: negative signals trigger documented review cycle', policy: 'ICT Project Management', url: 'https://policy.un.org/en/information-and-technology/ict-project-management' },
      { req: 'CI/CD governance: automated tests must pass before any production deployment', policy: 'ICT Project Management', url: 'https://policy.un.org/en/information-and-technology/ict-project-management' },
      { req: 'Model and prompt versioning: change approval required post go-live', policy: 'ICT Security Portal', url: 'https://policy.un.org/en/information-and-technology/ict-security' },
      { req: 'Business owner sign-off before user traffic routed', policy: 'ICT Project Management', url: 'https://policy.un.org/en/information-and-technology/ict-project-management' },
    ],
    controls: [
      { control: 'Bulk evaluation harness with scoring', status: '🟢', metric: null, label: 'Evals active', tab: 'evals' },
      { control: 'Hallucination detection on every response', status: '🟢', metric: 'hallucination_rate', label: 'Hallucination rate', tab: 'governance' },
      { control: 'Thumbs up/down feedback with comment capture', status: '🟢', metric: null, label: 'Feedback active', tab: 'admin' },
      { control: 'JSONL export for fine-tuning from positive feedback', status: '🟢', metric: null, label: 'Export ready', tab: 'admin' },
      { control: 'GitHub Actions CI/CD — tests before every deploy', status: '🟢', metric: null, label: 'Pipeline active', tab: 'architecture' },
      { control: 'LangSmith traces every LLM call', status: '🟢', metric: 'total_llm_runs', label: 'LLM runs', tab: 'analytics' },
    ],
  },
  {
    step: 9, name: 'Monitoring', color: '#009edb',
    input: 'Live application in production',
    output: 'Ongoing compliance evidence + annual certification package ready for audit',
    requirements: [
      { req: 'Continuous KPI monitoring against impact assessment thresholds — deviation triggers review', policy: 'ICT Security Portal', url: 'https://policy.un.org/en/information-and-technology/ict-security' },
      { req: 'Knowledge base currency: source expiry tracked, index refresh on defined schedule', policy: 'Record-keeping and UN Archives (ST/SGB/2007/5)', url: 'https://www.undocs.org/en/ST/SGB/2007/5' },
      { req: 'Feedback-driven improvement: thumbs-down volume triggers fine-tuning review cycle', policy: 'ICT Project Management', url: 'https://policy.un.org/en/information-and-technology/ict-project-management' },
      { req: 'Access audit: quarterly review, revoke inactive or unauthorized accounts', policy: 'Use of ICT Resources (ST/SGB/2004/15)', url: 'https://www.undocs.org/en/ST/SGB/2004/15' },
      { req: 'Impact assessment reviewed every 24 months — interim review on significant change', policy: 'Data Protection and Privacy (ST/SGB/2024/3)', url: 'https://www.undocs.org/en/ST/SGB/2024/3' },
      { req: 'Annual certification package: KPIs, security events, access audit, model changes', policy: 'ICT Project Management', url: 'https://policy.un.org/en/information-and-technology/ict-project-management' },
      { req: 'Decommissioning criteria defined: conditions under which system is retired', policy: 'Data and Information Portal', url: 'https://policy.un.org/en/information-and-technology/data-and-information' },
    ],
    controls: [
      { control: '15+ KPIs tracked continuously', status: '🟢', metric: 'total_queries', label: 'Full dashboard', tab: 'analytics' },
      { control: 'Security events logged in real time', status: '🟢', metric: null, label: 'Event count', tab: 'security' },
      { control: 'LangSmith p50/p95/p99 latency + token cost', status: '🟢', metric: 'avg_latency', label: 'Live metrics', tab: 'analytics' },
      { control: 'User activity audit trail per query', status: '🟢', metric: null, label: 'Per-user history', tab: 'analytics' },
      { control: 'Feedback panel with JSONL fine-tune export', status: '🟢', metric: null, label: 'Feedback log', tab: 'admin' },
      { control: '/health endpoint with Redis connectivity', status: '🟢', metric: null, label: 'healthy / degraded', tab: null },
    ],
  },
];

// ─── Why This Framework data ─────────────────────────────────────────────────

const GAPS = [
  { title: 'RAG-Specific Threat Model', desc: 'Existing ICT security policy governs traditional software. It does not cover prompt injection, knowledge base poisoning, or embedding inversion — attack surfaces unique to retrieval-augmented systems.' },
  { title: 'AI Impact Assessment as a Lifecycle Obligation', desc: 'Standard project governance requires a one-time security review. This framework mandates a formal impact assessment initiated at the first lifecycle step, updated on significant change, and reviewed every 24 months.' },
  { title: 'Data Source Governance at the Chunk Level', desc: 'ICT data policy governs documents and records. It does not govern how documents are chunked, embedded, versioned, and traced through an AI retrieval pipeline — or how API-connected live data sources are classified and monitored.' },
  { title: 'Model Selection as a Governance Gate', desc: 'No existing ICT policy distinguishes between a custom-trained model, a fine-tuned foundation model, and a base LLM with prompting — or defines what governance applies to each hosting boundary.' },
  { title: 'Attribution at the Query Level', desc: 'Standard access control logs who accessed a system. This framework requires every individual query to be attributed to a named, verified user in the audit trail — satisfying the accountability standard that AI-specific audit obligations require.' },
  { title: 'Feedback-Driven Certification Evidence', desc: 'Annual IT audits review controls documentation. This framework generates a continuous, live evidence package — KPIs, security events, user access, model changes — ready for OIOS audit at any time, not assembled retrospectively.' },
];

const BENEFITS = [
  { title: 'Accelerated IS Certification', desc: 'A pre-mapped governance posture reduces the time from architecture submission to IS certification — every required control is documented, active, and evidenced before the review begins.' },
  { title: 'Reduced Hallucination Risk', desc: 'Mandatory hallucination measurement with a defined acceptable threshold, adversarial testing before go-live, and a feedback loop that triggers fine-tuning — built into the development gate, not added after incidents.' },
  { title: 'Controlled Cost at Scale', desc: 'FinOps governance at Steps 1, 5, and 7 — cost per query estimated before build, semantic caching reducing API spend in production, budget alerts preventing uncontrolled overrun.' },
  { title: 'Audit-Ready at All Times', desc: 'Continuous KPI monitoring, attribution-level query logging, and a live evidence dashboard mean the annual certification package is generated automatically — not assembled under audit pressure.' },
  { title: 'Data Boundary Clarity', desc: 'The model selection and hosting decision gate (Step 3) forces explicit documentation of where data is processed, where it transits, and what provider terms govern it — before a single document enters the knowledge base.' },
  { title: 'Sustainable Governance', desc: 'The framework is designed to evolve with the system — impact assessment reviews every 24 months, model drift detection, regulatory change monitoring, and defined decommissioning criteria mean governance does not decay after go-live.' },
];

const POLICY_REFS = [
  { name: 'Information Sensitivity (ST/SGB/2007/6)', url: 'https://www.undocs.org/en/ST/SGB/2007/6' },
  { name: 'Data Protection (ST/SGB/2024/3)', url: 'https://www.undocs.org/en/ST/SGB/2024/3' },
  { name: 'Use of ICT Resources (ST/SGB/2004/15)', url: 'https://www.undocs.org/en/ST/SGB/2004/15' },
  { name: 'Record-keeping (ST/SGB/2007/5)', url: 'https://www.undocs.org/en/ST/SGB/2007/5' },
  { name: 'ICT Security Portal', url: 'https://policy.un.org/en/information-and-technology/ict-security' },
  { name: 'ICT Project Management Portal', url: 'https://policy.un.org/en/information-and-technology/ict-project-management' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function FrameworkTab({ onTabChange }) {
  const [activeStep, setActiveStep] = useState(1);
  const [expandedReq, setExpandedReq] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [health, setHealth] = useState(null);
  const [users, setUsers] = useState(null);
  const [securityEvents, setSecurityEvents] = useState(null);

  useEffect(() => {
    axios.get(`${API_URL}/metrics`).then(r => setMetrics(r.data)).catch(() => {});
    axios.get(`${API_URL}/health`).then(r => setHealth(r.data)).catch(() => {});
    axios.get(`${API_URL}/users`).then(r => setUsers(r.data)).catch(() => {});
    axios.get(`${API_URL}/security-events`).then(r => setSecurityEvents(r.data)).catch(() => {});
  }, []);

  const step = STEPS.find(s => s.step === activeStep);

  const getLiveValue = (ctrl) => {
    if (!ctrl.metric) return ctrl.label;
    if (!metrics) return '—';
    const v = metrics[ctrl.metric];
    if (v === undefined || v === null) return '—';
    if (typeof v === 'number') return v.toLocaleString();
    return v;
  };

  const handleReqClick = (key) => setExpandedReq(expandedReq === key ? null : key);

  // ── KPI tiles ──────────────────────────────────────────────────────────────

  const isHealthy = health?.status === 'healthy';
  const secEventCount = securityEvents
    ? (securityEvents.injection_attempts || 0) + (securityEvents.pii_detected || 0)
    : null;
  const userCount = users?.users ? users.users.length : (users?.length ?? null);

  const kpiTiles = [
    {
      label: 'System Health',
      value: health ? (isHealthy ? 'Healthy' : 'Degraded') : '—',
      color: health ? (isHealthy ? 'var(--success)' : 'var(--danger)') : 'var(--text-tertiary)',
      tab: 'analytics',
      dot: health ? (isHealthy ? '#1e8e3e' : '#d93025') : '#ccc',
    },
    {
      label: 'Hallucination Rate',
      value: metrics?.hallucination_rate ?? '—',
      color: '#f9ab00',
      tab: 'analytics',
      dot: '#f9ab00',
    },
    {
      label: 'Security Events',
      value: secEventCount !== null ? secEventCount.toLocaleString() : '—',
      color: '#d93025',
      tab: 'security',
      dot: '#d93025',
    },
    {
      label: 'Cache Hit Rate',
      value: metrics?.cache_hit_rate ?? '—',
      color: '#1e8e3e',
      tab: 'analytics',
      dot: '#1e8e3e',
    },
    {
      label: 'Cost Per Query',
      value: metrics?.cost_per_query ?? '—',
      color: '#7b61ff',
      tab: 'analytics',
      dot: '#7b61ff',
    },
    {
      label: 'Active Users',
      value: userCount !== null ? userCount.toLocaleString() : '—',
      color: '#009edb',
      tab: 'admin',
      dot: '#009edb',
    },
  ];

  // ── Shared cell style ──────────────────────────────────────────────────────

  const tdBase = { padding: '0.75rem 1rem', verticalAlign: 'top', borderBottom: '1px solid var(--border)' };

  return (
    <div>

      {/* ── Header ── */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-tertiary)', marginBottom: '0.4rem' }}>
          Reference Implementation: UN Secretariat AI Governance Assistant
        </p>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '0.4rem', lineHeight: 1.2 }}>
          Responsible AI Governance Playbook
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          Applied governance for custom RAG GenAI applications — from intake to certification
        </p>
      </div>

      {/* ── Why This Framework ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '0.75rem' }}>

        {/* Card 1 — Gaps */}
        <div className="card" style={{ borderTop: '4px solid var(--danger)', marginBottom: 0 }}>
          <p style={{ fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--danger)', marginBottom: '0.25rem' }}>Beyond Standard IT Governance</p>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '1.1rem' }}>
            Six capabilities specific to RAG GenAI that existing ICT policy does not address
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {GAPS.map((g, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <span style={{
                  flexShrink: 0, width: '20px', height: '20px', borderRadius: '50%',
                  background: '#d9302518', border: '1.5px solid #d9302550',
                  color: 'var(--danger)', fontSize: '0.65rem', fontWeight: '800',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>{i + 1}</span>
                <div>
                  <p style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>{g.title}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{g.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2 — Benefits */}
        <div className="card" style={{ borderTop: '4px solid var(--success)', marginBottom: 0 }}>
          <p style={{ fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--success)', marginBottom: '0.25rem' }}>What Clients Gain</p>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '1.1rem' }}>
            Concrete outcomes from applying this framework to your custom RAG application
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {BENEFITS.map((b, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <span style={{
                  flexShrink: 0, width: '20px', height: '20px', borderRadius: '50%',
                  background: '#1e8e3e18', border: '1.5px solid #1e8e3e50',
                  color: 'var(--success)', fontSize: '0.65rem', fontWeight: '800',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>{i + 1}</span>
                <div>
                  <p style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>{b.title}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Policy footnote */}
      <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', lineHeight: '1.6', marginBottom: '1.75rem', paddingLeft: '0.25rem' }}>
        Governance requirements reference:{' '}
        {POLICY_REFS.map((p, i) => (
          <span key={p.name}>
            <a href={p.url} target="_blank" rel="noreferrer"
              style={{ color: 'var(--primary)', textDecoration: 'none' }}>{p.name}</a>
            {i < POLICY_REFS.length - 1 ? ' · ' : ''}
          </span>
        ))}
      </p>

      {/* ── Live Governance Pulse ── */}
      <p className="section-label" style={{ marginBottom: '0.875rem' }}>Live Governance Pulse</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.875rem', marginBottom: '2rem' }}>
        {kpiTiles.map(tile => (
          <div
            key={tile.label}
            onClick={() => tile.tab && onTabChange(tile.tab)}
            className="card"
            style={{
              marginBottom: 0, padding: '1rem', cursor: tile.tab ? 'pointer' : 'default',
              transition: 'box-shadow 0.15s',
              borderTop: `3px solid ${tile.color}`,
            }}
            onMouseEnter={e => { if (tile.tab) e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: tile.dot, display: 'inline-block', flexShrink: 0 }} />
              <p style={{ fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)' }}>{tile.label}</p>
            </div>
            <p style={{ fontSize: '1.15rem', fontFamily: 'Syne, sans-serif', fontWeight: '700', color: tile.color, lineHeight: 1.1 }}>{tile.value}</p>
            {tile.tab && (
              <p style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginTop: '0.35rem' }}>
                → {tile.tab}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* ── 9-Step Pipeline Pills ── */}
      <p className="section-label" style={{ marginBottom: '0.875rem' }}>9-Step Governance Pipeline</p>
      <div style={{ overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', minWidth: 'max-content', alignItems: 'center' }}>
          {STEPS.map((s, i) => {
            const active = s.step === activeStep;
            return (
              <React.Fragment key={s.step}>
                <button
                  onClick={() => { setActiveStep(s.step); setExpandedReq(null); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.45rem 0.875rem', borderRadius: '24px', cursor: 'pointer',
                    fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: '600',
                    border: active ? `2px solid ${s.color}` : '1px solid var(--border)',
                    background: active ? `${s.color}18` : 'var(--surface)',
                    color: active ? s.color : 'var(--text-secondary)',
                    transition: 'all 0.15s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span style={{
                    width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                    background: active ? s.color : 'var(--surface-2)',
                    color: active ? '#fff' : 'var(--text-tertiary)',
                    fontSize: '0.65rem', fontWeight: '800',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: active ? 'none' : '1px solid var(--border)',
                  }}>{s.step}</span>
                  {s.name}
                </button>
                {i < STEPS.length - 1 && (
                  <span style={{ color: 'var(--border)', fontSize: '0.85rem', flexShrink: 0 }}>→</span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ── Expanded Step Card ── */}
      {step && (
        <div style={{
          border: `1px solid var(--border)`, borderRadius: 'var(--radius-md)',
          borderLeft: `5px solid ${step.color}`, overflow: 'hidden',
          boxShadow: 'var(--shadow-1)'
        }}>

          {/* Level 1 — Input / Output banner */}
          <div style={{
            background: `${step.color}0d`, padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: '0', flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '0 0 auto' }}>
              <span style={{
                width: '28px', height: '28px', borderRadius: '50%', background: step.color,
                color: '#fff', fontSize: '0.7rem', fontWeight: '800',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>{step.step}</span>
              <span style={{ fontSize: '1rem', fontFamily: 'Syne, sans-serif', fontWeight: '800', color: step.color }}>{step.name}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'stretch', flex: 1, marginLeft: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{
                flex: 1, minWidth: '200px', padding: '0.6rem 0.875rem',
                background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px'
              }}>
                <p style={{ fontSize: '0.62rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Input</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{step.input}</p>
              </div>
              <span style={{ color: step.color, fontSize: '1.1rem', alignSelf: 'center', flexShrink: 0, padding: '0 0.25rem' }}>→</span>
              <div style={{
                flex: 1, minWidth: '200px', padding: '0.6rem 0.875rem',
                background: `${step.color}0d`, border: `1px solid ${step.color}40`, borderRadius: '8px'
              }}>
                <p style={{ fontSize: '0.62rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em', color: step.color, marginBottom: '0.25rem' }}>Output</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: '1.4', fontWeight: '500' }}>{step.output}</p>
              </div>
            </div>
          </div>

          {/* Level 2 — Requirements table */}
          <div style={{ padding: '1.25rem 1.5rem', background: 'var(--surface)' }}>
            <p style={{ fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: '0.75rem' }}>
              Requirements — click any row to see live controls
            </p>
            <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-2)' }}>
                    <th style={{ ...tdBase, borderBottom: `2px solid var(--border)`, fontWeight: '700', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', width: '70%' }}>Requirement</th>
                    <th style={{ ...tdBase, borderBottom: `2px solid var(--border)`, fontWeight: '700', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', width: '30%' }}>Policy Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {step.requirements.map((r, ri) => {
                    const key = `${step.step}-${ri}`;
                    const isOpen = expandedReq === key;
                    return (
                      <React.Fragment key={key}>
                        <tr
                          onClick={() => handleReqClick(key)}
                          style={{
                            cursor: 'pointer',
                            background: isOpen ? `${step.color}08` : (ri % 2 === 0 ? 'white' : 'var(--surface-2)'),
                            transition: 'background 0.1s',
                          }}
                          onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = `${step.color}05`; }}
                          onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = ri % 2 === 0 ? 'white' : 'var(--surface-2)'; }}
                        >
                          <td style={{ ...tdBase, color: 'var(--text-primary)', fontWeight: isOpen ? '600' : '400' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                              <span style={{
                                flexShrink: 0, marginTop: '0.15rem',
                                color: isOpen ? step.color : 'var(--text-tertiary)',
                                fontSize: '0.7rem', fontWeight: '700', minWidth: '14px'
                              }}>{isOpen ? '▼' : '▶'}</span>
                              {r.req}
                            </div>
                          </td>
                          <td style={{ ...tdBase }}>
                            <a href={r.url} target="_blank" rel="noreferrer"
                              onClick={e => e.stopPropagation()}
                              style={{ fontSize: '0.75rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: '500' }}>
                              {r.policy} ↗
                            </a>
                          </td>
                        </tr>

                        {/* Level 3 — Live controls inline */}
                        {isOpen && (
                          <tr>
                            <td colSpan={2} style={{ padding: '0', borderBottom: '1px solid var(--border)' }}>
                              <div style={{ background: `${step.color}0a`, borderTop: `1px solid ${step.color}25`, padding: '1rem 1.5rem' }}>
                                <p style={{ fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: step.color, marginBottom: '0.75rem' }}>
                                  Live Controls — Step {step.step}: {step.name}
                                </p>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                  <thead>
                                    <tr style={{ background: `${step.color}10` }}>
                                      {['Control', 'Status', 'Live Value', 'Navigate'].map(h => (
                                        <th key={h} style={{
                                          padding: '0.5rem 0.875rem', textAlign: 'left',
                                          fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase',
                                          letterSpacing: '0.05em', color: 'var(--text-secondary)',
                                          borderBottom: `1px solid ${step.color}30`
                                        }}>{h}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {step.controls.map((c, ci) => (
                                      <tr key={ci} style={{ borderBottom: ci < step.controls.length - 1 ? `1px solid ${step.color}20` : 'none' }}>
                                        <td style={{ padding: '0.6rem 0.875rem', color: 'var(--text-primary)', fontSize: '0.78rem' }}>{c.control}</td>
                                        <td style={{ padding: '0.6rem 0.875rem', fontSize: '1rem', textAlign: 'center' }}>{c.status}</td>
                                        <td style={{ padding: '0.6rem 0.875rem' }}>
                                          <span style={{
                                            fontSize: '0.75rem', fontWeight: '600',
                                            color: step.color,
                                            background: `${step.color}12`,
                                            border: `1px solid ${step.color}30`,
                                            padding: '0.15rem 0.5rem', borderRadius: '5px',
                                            display: 'inline-block'
                                          }}>{getLiveValue(c)}</span>
                                        </td>
                                        <td style={{ padding: '0.6rem 0.875rem' }}>
                                          {c.tab ? (
                                            <button
                                              onClick={() => onTabChange(c.tab)}
                                              style={{
                                                padding: '0.2rem 0.6rem', borderRadius: '5px', border: 'none',
                                                background: step.color, color: '#fff',
                                                fontSize: '0.7rem', fontWeight: '600', cursor: 'pointer',
                                                fontFamily: 'inherit'
                                              }}
                                            >→ {c.tab}</button>
                                          ) : (
                                            <span style={{ color: 'var(--text-tertiary)', fontSize: '0.72rem' }}>—</span>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
