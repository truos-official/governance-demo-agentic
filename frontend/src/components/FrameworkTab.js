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
      { req: 'Documented business problem and scope', policy: 'ICT Project Management', url: 'https://policy.un.org/en/information-and-technology/ict-project-management', control: 'Number of distinct use case types actively served in production — each representing a documented business problem the system addresses', metric: 'active_styles', label: 'Active use case types' },
      { req: 'Measurable success criteria defined', policy: 'ICT Project Management', url: 'https://policy.un.org/en/information-and-technology/ict-project-management', control: 'Response quality measured continuously against the success thresholds defined before development commenced', metric: 'hallucination_rate', label: 'Hallucination rate' },
      { req: 'Named accountable owner and designated AI Focal Point', policy: 'Use of ICT Resources (ST/SGB/2004/15)', url: 'https://www.undocs.org/en/ST/SGB/2004/15', control: 'All users require explicit admin approval — owner identity enforced through the access registration gate', metric: 'total_registered_users', label: 'Registered users' },
    ],
  },
  {
    step: 2, name: 'Use Case Review', color: '#1a73e8',
    input: 'Approved use case brief',
    output: 'Filed AI Impact Assessment with risk tier (Low / Medium / High / Very High)',
    requirements: [
      { req: 'Formal risk classification — Low / Medium / High / Very High', policy: 'ICT Security Portal', url: 'https://policy.un.org/en/information-and-technology/ict-security', control: 'Number of distinct risk domains actively monitored — each representing a formally assessed and classified threat category', metric: 'active_risk_categories', label: 'Active risk categories' },
      { req: 'Foreseeable harms documented by multidisciplinary team', policy: 'ICT Security Portal', url: 'https://policy.un.org/en/information-and-technology/ict-security', control: 'Every response evaluated for factual grounding — confidence score evidences harm assessment is operationally enforced', metric: 'hallucination_rate', label: 'Hallucination rate' },
      { req: 'Compliance check — data protection, privacy, human rights', policy: 'Data Protection and Privacy (ST/SGB/2024/3)', url: 'https://www.undocs.org/en/ST/SGB/2024/3', control: 'Personal data detected and anonymized before reaching the model — rate evidences continuous privacy compliance enforcement', metric: 'pii_detection_rate', label: 'PII detection rate' },
      { req: 'Third-party provider risk assessed — data terms, retention, model provenance', policy: 'Internet Portal', url: 'https://policy.un.org/en/information-and-technology/internet', control: 'Number of external providers with reviewed and confirmed data handling contracts governing query processing', metric: 'reviewed_providers', label: 'Providers reviewed' },
      { req: 'Impact assessment filed and scheduled for periodic review', policy: 'ICT Project Management', url: 'https://policy.un.org/en/information-and-technology/ict-project-management', control: 'Volume of queries processed under current risk posture evidences continuous operation within documented governance boundaries', metric: 'total_queries', label: 'Total queries logged' },
    ],
  },
  {
    step: 3, name: 'Solution Assessment', color: '#7b61ff',
    input: 'Filed impact assessment with risk tier',
    output: 'Documented technology decision with model choice, hosting boundary, retrieval strategy, and cost model',
    requirements: [
      { req: 'Model strategy documented — custom / fine-tuned / base LLM with rationale', policy: 'ICT Security Portal', url: 'https://policy.un.org/en/information-and-technology/ict-security', control: 'Number of distinct AI model components deployed, each with documented provenance, licensing, and governance coverage', metric: 'model_components', label: 'Model components' },
      { req: 'Open vs. closed source decision — provenance, licensing, auditability confirmed', policy: 'Data Protection and Privacy (ST/SGB/2024/3)', url: 'https://www.undocs.org/en/ST/SGB/2024/3', control: 'Number of model components with confirmed training data terms, usage rights, and supply chain documentation', metric: 'reviewed_models', label: 'Models reviewed' },
      { req: 'Hosting boundary defined — cloud / on-premises / hybrid with data residency', policy: 'Internet Portal', url: 'https://policy.un.org/en/information-and-technology/internet', control: 'Number of infrastructure services provisioned, each representing an explicit hosting decision with documented data boundary', metric: 'azure_services', label: 'Services provisioned' },
      { req: 'Provider data terms confirmed — query retention, training, cross-border transfer', policy: 'Internet Portal', url: 'https://policy.un.org/en/information-and-technology/internet', control: 'Number of external providers with confirmed contractual protection for query content', metric: 'zdr_providers', label: 'Providers confirmed' },
      { req: 'Retrieval strategy selected and justified — keyword / semantic / hybrid', policy: 'ICT Project Management', url: 'https://policy.un.org/en/information-and-technology/ict-project-management', control: 'Scale of indexed corpus evidences the complexity that justifies the chosen retrieval strategy over simpler alternatives', metric: 'es_document_count', label: 'Corpus scale' },
      { req: 'FinOps estimate — projected cost per query with approved budget', policy: 'ICT Project Management', url: 'https://policy.un.org/en/information-and-technology/ict-project-management', control: 'Actual cost per query in production versus pre-build estimate — evidences the financial model is operating as projected', metric: 'cost_per_query', label: 'Cost per query' },
      { req: 'Acceptable hallucination threshold defined and documented', policy: 'Data Protection and Privacy (ST/SGB/2024/3)', url: 'https://www.undocs.org/en/ST/SGB/2024/3', control: 'Hallucination rate measured on every response confirming the system operates within the threshold set at assessment', metric: 'hallucination_rate', label: 'Hallucination rate' },
      { req: 'Alternatives assessment — why RAG over simpler approaches', policy: 'ICT Project Management', url: 'https://policy.un.org/en/information-and-technology/ict-project-management', control: 'Scale and complexity of indexed corpus evidences the justification for RAG over keyword search or structured query', metric: 'es_document_count', label: 'Corpus scale' },
      { req: 'Lock-in risk assessed — critical components replaceable without re-architecture', policy: 'ICT Project Management', url: 'https://policy.un.org/en/information-and-technology/ict-project-management', control: 'Number of independently swappable pipeline components — LLM, embedding model, and vector store each replaceable without code change', metric: 'swappable_components', label: 'Swappable components' },
    ],
  },
  {
    step: 4, name: 'Data Source Review', color: '#f9ab00',
    input: 'Approved technology decision and hosting boundary',
    output: 'Approved data source inventory with classification, legal basis, and connectivity map',
    requirements: [
      { req: 'Full source inventory — documents, databases, APIs, catalogues, live feeds', policy: 'Data and Information Portal', url: 'https://policy.un.org/en/information-and-technology/data-and-information', control: 'Total chunks indexed evidences complete corpus ingestion with every approved source accounted for', metric: 'es_document_count', label: 'Chunks indexed' },
      { req: 'API connectivity documented — endpoint, authentication, rate limits, versioning', policy: 'Data and Information Portal', url: 'https://policy.un.org/en/information-and-technology/data-and-information', control: 'Number of active API integrations with documented authentication method, endpoint, and rate limit governance', metric: 'documented_apis', label: 'APIs documented' },
      { req: 'Sensitivity classification applied per source — Public / Internal / Confidential / Restricted', policy: 'Information Sensitivity (ST/SGB/2007/6)', url: 'https://www.undocs.org/en/ST/SGB/2007/6', control: 'Number of source documents with confirmed sensitivity classification under applicable information handling policy', metric: 'classified_sources', label: 'Sources classified' },
      { req: 'Legal basis confirmed for processing each source in an AI system', policy: 'Data Protection and Privacy (ST/SGB/2024/3)', url: 'https://www.undocs.org/en/ST/SGB/2024/3', control: 'Number of source documents with verified legal basis — copyright, licensing, and data ownership reviewed before ingestion', metric: 'cleared_sources', label: 'Sources cleared' },
      { req: 'Privacy impact assessment completed where personal data is involved', policy: 'Data Protection and Privacy (ST/SGB/2024/3)', url: 'https://www.undocs.org/en/ST/SGB/2024/3', control: 'PII detection rate on queries evidences active monitoring — confirming personal data exposure risk is controlled', metric: 'pii_detection_rate', label: 'PII events detected' },
      { req: 'Data quality readiness assessed — completeness, currency, noise ratio', policy: 'Data and Information Portal', url: 'https://policy.un.org/en/information-and-technology/data-and-information', control: 'Number of distinct sources actively returning results in production — evidences retrieval quality across the approved corpus', metric: 'active_sources', label: 'Active sources cited' },
      { req: 'All sources registered in enterprise data catalogue', policy: 'Record-keeping and UN Archives (ST/SGB/2007/5)', url: 'https://www.undocs.org/en/ST/SGB/2007/5', control: 'Number of distinct source documents appearing in production citations — each representing a traceable catalogue entry', metric: 'active_sources', label: 'Catalogue entries' },
    ],
  },
  {
    step: 5, name: 'Data Management', color: '#1e8e3e',
    input: 'Approved source inventory and connectivity map',
    output: 'Governed data pipeline with lineage, freshness SLA, cost baseline, and residency confirmation',
    requirements: [
      { req: 'Ingestion pipeline documented, version-controlled, and reproducible', policy: 'Data and Information Portal', url: 'https://policy.un.org/en/information-and-technology/data-and-information', control: 'Total chunks in index evidences the pipeline executed completely and reproducibly across all approved source documents', metric: 'es_document_count', label: 'Chunks indexed' },
      { req: 'Embedding model governance — version locked, dimensions documented, change control defined', policy: 'ICT Project Management', url: 'https://policy.un.org/en/information-and-technology/ict-project-management', control: 'Index size is stable — any embedding model change alters chunk count and triggers mandatory re-evaluation before deployment', metric: 'es_document_count', label: 'Index size' },
      { req: 'Index freshness SLA defined — update frequency documented, staleness alerts configured', policy: 'Data and Information Portal', url: 'https://policy.un.org/en/information-and-technology/data-and-information', control: 'Document count monitored against defined baseline — deviation triggers re-indexing and re-evaluation cycle', metric: 'es_document_count', label: 'Index count live' },
      { req: 'Cache policy documented — similarity threshold, TTL, and invalidation rules defined', policy: 'ICT Security Portal', url: 'https://policy.un.org/en/information-and-technology/ict-security', control: 'Proportion of queries served from cache without a model call — evidences the cache policy is operating within defined parameters', metric: 'cache_hit_rate', label: 'Cache hit rate' },
      { req: 'Data lineage maintained — every output traceable to source document or API version', policy: 'Record-keeping and UN Archives (ST/SGB/2007/5)', url: 'https://www.undocs.org/en/ST/SGB/2007/5', control: 'Number of distinct sources cited in production responses — each citation a verified lineage link from generated output to indexed source', metric: 'active_sources', label: 'Cited sources' },
      { req: 'FinOps controls active — cost per query monitored, budget alerts configured', policy: 'ICT Project Management', url: 'https://policy.un.org/en/information-and-technology/ict-project-management', control: 'Actual cost per query in production deflected by cache — evidences FinOps controls are operating as designed', metric: 'cost_per_query', label: 'Cost per query' },
      { req: 'Data residency boundary confirmed — processing location and transit path documented', policy: 'Internet Portal', url: 'https://policy.un.org/en/information-and-technology/internet', control: 'Number of infrastructure regions processing application data — confirms data residency boundary is respected and documented', metric: 'azure_regions', label: 'Regions confirmed' },
    ],
  },
  {
    step: 6, name: 'Architecture & InfoSec Review', color: '#d93025',
    input: 'Data pipeline design and hosting boundary',
    output: 'IS-certified architecture with formal security sign-off before go-live',
    requirements: [
      { req: 'RAG-specific threat model completed — injection, poisoning, exfiltration, inversion', policy: 'ICT Security Portal', url: 'https://policy.un.org/en/information-and-technology/ict-security', control: 'Proportion of queries blocked by the automated threat detector — evidences the RAG threat model is enforced in production', metric: 'security_block_rate', label: 'Security block rate' },
      { req: 'All credentials under approved secrets management — no plaintext anywhere', policy: 'ICT Security Portal', url: 'https://policy.un.org/en/information-and-technology/ict-security', control: 'Number of application secrets under vault management — confirms zero plaintext credentials in any deployment configuration', metric: 'vault_secrets', label: 'Secrets protected' },
      { req: 'Network access restricted to approved origins and endpoints', policy: 'Internet Portal', url: 'https://policy.un.org/en/information-and-technology/internet', control: 'Number of explicitly approved origins permitted to call the API — all other network access rejected at the perimeter', metric: 'cors_origins', label: 'Approved origins' },
      { req: 'Authenticated and approved identity required on all client endpoints and devices', policy: 'Use of ICT Resources (ST/SGB/2004/15)', url: 'https://www.undocs.org/en/ST/SGB/2004/15', control: 'Number of users whose access is enforced through the identity governance layer across all endpoints before any query is permitted', metric: 'total_registered_users', label: 'Approved users' },
      { req: 'LLM provider data handling terms reviewed — retention, isolation, cross-border transfer', policy: 'Data Protection and Privacy (ST/SGB/2024/3)', url: 'https://www.undocs.org/en/ST/SGB/2024/3', control: 'Number of providers with confirmed contractual protection for query content — no unauthorised use, retention, or training', metric: 'reviewed_providers', label: 'Contracts reviewed' },
      { req: 'Formal information security certification issued before go-live', policy: 'ICT Security Portal', url: 'https://policy.un.org/en/information-and-technology/ict-security', control: 'Number of independently verified security control layers active in production — each required before user traffic is routed', metric: 'active_security_controls', label: 'Active controls' },
    ],
  },
  {
    step: 7, name: 'Infrastructure Optimization', color: '#e8710a',
    input: 'Certified architecture',
    output: 'Production-ready infrastructure with scaling policy, health monitoring, resilience plan, and business sign-off',
    requirements: [
      { req: 'Compute resources right-sized to defined SLA and cost target', policy: 'ICT Project Management', url: 'https://policy.un.org/en/information-and-technology/ict-project-management', control: 'Number of active client connections evidences real-time infrastructure load against provisioned compute allocation', metric: 'redis_connected_clients', label: 'Connected clients' },
      { req: 'Scaling policy defined — minimum availability guaranteed, no cold-start risk', policy: 'ICT Project Management', url: 'https://policy.un.org/en/information-and-technology/ict-project-management', control: 'Maximum replica count configured — minimum always-warm instance ensures availability without cold-start latency', metric: 'max_replicas', label: 'Max replicas' },
      { req: 'Health monitoring active — liveness, readiness, and startup checks configured', policy: 'ICT Security Portal', url: 'https://policy.un.org/en/information-and-technology/ict-security', control: 'Number of active health probe types configured — confirming automated failure detection is operational', metric: 'health_probe_count', label: 'Probe types active' },
      { req: 'Persistence layer resilience defined — RTO/RPO documented for cache and knowledge base', policy: 'ICT Security Portal', url: 'https://policy.un.org/en/information-and-technology/ict-security', control: 'Number of days the persistence layer has operated continuously — evidences resilience meets the documented recovery objectives', metric: 'redis_uptime_days', label: 'Uptime days' },
      { req: 'Business owner sign-off and user acceptance completed before go-live', policy: 'ICT Project Management', url: 'https://policy.un.org/en/information-and-technology/ict-project-management', control: 'Number of users who received explicit admin approval before accessing the system — evidences owner acceptance gate is enforced', metric: 'total_registered_users', label: 'Approved users' },
    ],
  },
  {
    step: 8, name: 'Solution Development', color: '#5f6368',
    input: 'Production-ready infrastructure',
    output: 'Quality-assured, adversarially-tested application with model registry, versioned prompts, and fine-tuning pipeline',
    requirements: [
      { req: 'Evaluation harness established — representative test queries with documented expected outputs', policy: 'ICT Project Management', url: 'https://policy.un.org/en/information-and-technology/ict-project-management', control: 'Number of automated quality gates that must pass before any deployment — evidences evaluation is embedded in the release process', metric: 'pipeline_stages', label: 'Pipeline stages' },
      { req: 'Hallucination measurement methodology defined and threshold enforced', policy: 'Data Protection and Privacy (ST/SGB/2024/3)', url: 'https://www.undocs.org/en/ST/SGB/2024/3', control: 'Hallucination rate on every production response tracked against the threshold documented in the impact assessment', metric: 'hallucination_rate', label: 'Hallucination rate' },
      { req: 'Adversarial testing completed — injection, data extraction, and jailbreak before go-live', policy: 'ICT Security Portal', url: 'https://policy.un.org/en/information-and-technology/ict-security', control: 'Proportion of adversarial inputs successfully detected and blocked — evidences red team controls are active in production', metric: 'security_block_rate', label: 'Block rate' },
      { req: 'Prompt versioning and change governance — all prompt changes version-controlled and approved', policy: 'ICT Project Management', url: 'https://policy.un.org/en/information-and-technology/ict-project-management', control: 'Total LLM calls traced — every inference attributable to the current approved prompt version and model configuration', metric: 'total_llm_runs', label: 'LLM runs' },
      { req: 'Model registry established — all deployed model versions catalogued with lineage', policy: 'ICT Project Management', url: 'https://policy.un.org/en/information-and-technology/ict-project-management', control: 'Number of model components with documented version, provenance, and governance coverage in the model registry', metric: 'model_components', label: 'Model versions registered' },
      { req: 'Fine-tuning governance — training data provenance and evaluation metrics documented before deployment', policy: 'Data Protection and Privacy (ST/SGB/2024/3)', url: 'https://www.undocs.org/en/ST/SGB/2024/3', control: 'Number of validated feedback items available as governed training data — evidences the fine-tuning pipeline has documented provenance', metric: 'total_feedback', label: 'Fine-tune ready items' },
      { req: 'CI/CD governance — automated quality gates enforced on every deployment to production', policy: 'ICT Project Management', url: 'https://policy.un.org/en/information-and-technology/ict-project-management', control: 'Number of mandatory pipeline stages all required to pass — test, build, and deploy gates enforced on every release', metric: 'pipeline_stages', label: 'Pipeline stages' },
    ],
  },
  {
    step: 9, name: 'Monitoring', color: '#009edb',
    input: 'Live application in production',
    output: 'Ongoing compliance evidence and annual certification package ready for audit',
    requirements: [
      { req: 'Continuous KPI monitoring — defined thresholds, deviation triggers escalation', policy: 'ICT Security Portal', url: 'https://policy.un.org/en/information-and-technology/ict-security', control: 'Total queries processed evidences continuous system operation — every query measured against governance thresholds', metric: 'total_queries', label: 'Total queries' },
      { req: 'Knowledge base currency — source expiry tracked, refresh on defined schedule', policy: 'Record-keeping and UN Archives (ST/SGB/2007/5)', url: 'https://www.undocs.org/en/ST/SGB/2007/5', control: 'Index count monitored against ingestion baseline — deviation triggers re-indexing and re-evaluation', metric: 'es_document_count', label: 'Index count' },
      { req: 'Model drift detection — performance regression against golden test set triggers review', policy: 'ICT Project Management', url: 'https://policy.un.org/en/information-and-technology/ict-project-management', control: 'Hallucination rate trend over time — sustained increase above threshold triggers model re-evaluation', metric: 'hallucination_rate', label: 'Hallucination rate' },
      { req: 'Data drift detection — input distribution shift monitored for behavioural change', policy: 'Data and Information Portal', url: 'https://policy.un.org/en/information-and-technology/data-and-information', control: 'Number of distinct query categories in active use — shift in distribution signals changed user behaviour requiring review', metric: 'active_styles', label: 'Active query styles' },
      { req: 'Retrieval quality monitored — embedding performance tracked against defined baseline', policy: 'Data and Information Portal', url: 'https://policy.un.org/en/information-and-technology/data-and-information', control: 'Indexed document count monitored against baseline — drift triggers re-embedding and retrieval quality re-evaluation', metric: 'es_document_count', label: 'Index baseline' },
      { req: 'Retraining trigger criteria defined — threshold that initiates the fine-tuning cycle', policy: 'ICT Project Management', url: 'https://policy.un.org/en/information-and-technology/ict-project-management', control: 'Number of negative feedback submissions — volume above defined threshold initiates the governed fine-tuning review process', metric: 'total_feedback', label: 'Feedback items' },
      { req: 'User feedback loop active — negative signals drive continuous model improvement', policy: 'ICT Project Management', url: 'https://policy.un.org/en/information-and-technology/ict-project-management', control: 'Total feedback submissions logged and classified — each item available for model improvement review and export', metric: 'total_feedback', label: 'Feedback logged' },
      { req: 'Access audit conducted — inactive or unauthorised accounts reviewed and revoked', policy: 'Use of ICT Resources (ST/SGB/2004/15)', url: 'https://www.undocs.org/en/ST/SGB/2004/15', control: 'Total registered users with full approve and revoke history — admin panel provides complete access audit trail', metric: 'total_registered_users', label: 'Registered users' },
      { req: 'Impact assessment reviewed periodically — interim review triggered by significant change', policy: 'Data Protection and Privacy (ST/SGB/2024/3)', url: 'https://www.undocs.org/en/ST/SGB/2024/3', control: 'Hallucination rate trend confirms system operating within the risk posture documented in the filed impact assessment', metric: 'hallucination_rate', label: 'Hallucination rate' },
      { req: 'Annual certification evidence package generated — KPIs, events, access, model changes', policy: 'ICT Project Management', url: 'https://policy.un.org/en/information-and-technology/ict-project-management', control: 'Total LLM calls fully traced — complete inference history retrievable for annual certification and external audit', metric: 'total_llm_runs', label: 'LLM runs traced' },
      { req: 'Decommissioning criteria defined — conditions under which system is retired documented', policy: 'Data and Information Portal', url: 'https://policy.un.org/en/information-and-technology/data-and-information', control: 'Number of health indicators continuously monitored — any degraded indicator triggers escalation and review process', metric: 'health_indicators', label: 'Health indicators' },
    ],
  },
];

// ─── Metric → tab navigation mapping ─────────────────────────────────────────

const METRIC_TAB = {
  hallucination_rate: 'governance',
  pii_detection_rate: 'security',
  security_block_rate: 'security',
  cache_hit_rate: 'analytics',
  cost_per_query: 'analytics',
  total_queries: 'analytics',
  total_llm_runs: 'analytics',
  es_document_count: 'architecture',
  total_registered_users: 'admin',
  redis_connected_clients: 'analytics',
  redis_uptime_days: 'analytics',
  active_styles: 'analytics',
  active_sources: 'analytics',
  total_feedback: 'admin',
  model_components: 'architecture',
  reviewed_models: 'architecture',
  azure_services: 'architecture',
  vault_secrets: 'architecture',
  cors_origins: 'security',
  active_security_controls: 'security',
  pipeline_stages: 'architecture',
  health_probe_count: 'analytics',
  health_indicators: 'analytics',
  active_risk_categories: 'architecture',
  reviewed_providers: 'architecture',
  zdr_providers: 'architecture',
  swappable_components: 'architecture',
  documented_apis: 'architecture',
  classified_sources: 'architecture',
  cleared_sources: 'architecture',
  azure_regions: 'architecture',
  max_replicas: 'architecture',
};

// ─── Why This Framework data ──────────────────────────────────────────────────

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

  // Returns the display value for a requirement's metric
  const getLiveValue = (r) => {
    if (!r.metric) return '—';
    if (!metrics) return '—';
    const v = metrics[r.metric];
    if (v === undefined || v === null) return '—';
    if (typeof v === 'number') return v.toLocaleString();
    return v; // strings like "5%", "$0.00123" returned as-is
  };

  // Returns status indicator based on whether we have a live value
  const getStatus = (r) => {
    if (!r.metric) return '⚪';
    if (!metrics) return '⚪';
    const v = metrics[r.metric];
    if (v === undefined || v === null || v === '—') return '⚪';
    return '🟢';
  };

  const handleReqClick = (key) => setExpandedReq(expandedReq === key ? null : key);

  // ── KPI tiles ──────────────────────────────────────────────────────────────

  const isHealthy = health?.status === 'healthy';
  const secEventCount = securityEvents
    ? (securityEvents.injection_attempts || 0) + (securityEvents.pii_detected || 0)
    : null;
  const userCount = users?.users ? users.users.length : (users?.length ?? null);

  const kpiTiles = [
    { label: 'System Health', value: health ? (isHealthy ? 'Healthy' : 'Degraded') : '—', color: health ? (isHealthy ? 'var(--success)' : 'var(--danger)') : 'var(--text-tertiary)', tab: 'analytics', dot: health ? (isHealthy ? '#1e8e3e' : '#d93025') : '#ccc' },
    { label: 'Hallucination Rate', value: metrics?.hallucination_rate ?? '—', color: '#f9ab00', tab: 'analytics', dot: '#f9ab00' },
    { label: 'Security Events', value: secEventCount !== null ? secEventCount.toLocaleString() : '—', color: '#d93025', tab: 'security', dot: '#d93025' },
    { label: 'Cache Hit Rate', value: metrics?.cache_hit_rate ?? '—', color: '#1e8e3e', tab: 'analytics', dot: '#1e8e3e' },
    { label: 'Cost Per Query', value: metrics?.cost_per_query ?? '—', color: '#7b61ff', tab: 'analytics', dot: '#7b61ff' },
    { label: 'Active Users', value: userCount !== null ? userCount.toLocaleString() : '—', color: '#009edb', tab: 'admin', dot: '#009edb' },
  ];

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
        <div className="card" style={{ borderTop: '4px solid var(--danger)', marginBottom: 0 }}>
          <p style={{ fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--danger)', marginBottom: '0.25rem' }}>Beyond Standard IT Governance</p>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '1.1rem' }}>Six capabilities specific to RAG GenAI that existing ICT policy does not address</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {GAPS.map((g, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <span style={{ flexShrink: 0, width: '20px', height: '20px', borderRadius: '50%', background: '#d9302518', border: '1.5px solid #d9302550', color: 'var(--danger)', fontSize: '0.65rem', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                <div>
                  <p style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>{g.title}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{g.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card" style={{ borderTop: '4px solid var(--success)', marginBottom: 0 }}>
          <p style={{ fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--success)', marginBottom: '0.25rem' }}>What Clients Gain</p>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '1.1rem' }}>Concrete outcomes from applying this framework to your custom RAG application</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {BENEFITS.map((b, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <span style={{ flexShrink: 0, width: '20px', height: '20px', borderRadius: '50%', background: '#1e8e3e18', border: '1.5px solid #1e8e3e50', color: 'var(--success)', fontSize: '0.65rem', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
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
            <a href={p.url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none' }}>{p.name}</a>
            {i < POLICY_REFS.length - 1 ? ' · ' : ''}
          </span>
        ))}
      </p>

      {/* ── Live Governance Pulse ── */}
      <p className="section-label" style={{ marginBottom: '0.875rem' }}>Live Governance Pulse</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.875rem', marginBottom: '2rem' }}>
        {kpiTiles.map(tile => (
          <div key={tile.label} onClick={() => tile.tab && onTabChange(tile.tab)} className="card"
            style={{ marginBottom: 0, padding: '1rem', cursor: tile.tab ? 'pointer' : 'default', transition: 'box-shadow 0.15s', borderTop: `3px solid ${tile.color}` }}
            onMouseEnter={e => { if (tile.tab) e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: tile.dot, display: 'inline-block', flexShrink: 0 }} />
              <p style={{ fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)' }}>{tile.label}</p>
            </div>
            <p style={{ fontSize: '1.15rem', fontFamily: 'Syne, sans-serif', fontWeight: '700', color: tile.color, lineHeight: 1.1 }}>{tile.value}</p>
            {tile.tab && <p style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginTop: '0.35rem' }}>→ {tile.tab}</p>}
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
                <button onClick={() => { setActiveStep(s.step); setExpandedReq(null); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0.875rem', borderRadius: '24px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: '600', border: active ? `2px solid ${s.color}` : '1px solid var(--border)', background: active ? `${s.color}18` : 'var(--surface)', color: active ? s.color : 'var(--text-secondary)', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                >
                  <span style={{ width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0, background: active ? s.color : 'var(--surface-2)', color: active ? '#fff' : 'var(--text-tertiary)', fontSize: '0.65rem', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', border: active ? 'none' : '1px solid var(--border)' }}>{s.step}</span>
                  {s.name}
                </button>
                {i < STEPS.length - 1 && <span style={{ color: 'var(--border)', fontSize: '0.85rem', flexShrink: 0 }}>→</span>}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ── Expanded Step Card ── */}
      {step && (
        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', borderLeft: `5px solid ${step.color}`, overflow: 'hidden', boxShadow: 'var(--shadow-1)' }}>

          {/* Level 1 — Input / Output banner */}
          <div style={{ background: `${step.color}0d`, padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '0 0 auto' }}>
              <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: step.color, color: '#fff', fontSize: '0.7rem', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{step.step}</span>
              <span style={{ fontSize: '1rem', fontFamily: 'Syne, sans-serif', fontWeight: '800', color: step.color }}>{step.name}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'stretch', flex: 1, flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ flex: 1, minWidth: '200px', padding: '0.6rem 0.875rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                <p style={{ fontSize: '0.62rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Input</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{step.input}</p>
              </div>
              <span style={{ color: step.color, fontSize: '1.1rem', alignSelf: 'center', flexShrink: 0, padding: '0 0.25rem' }}>→</span>
              <div style={{ flex: 1, minWidth: '200px', padding: '0.6rem 0.875rem', background: `${step.color}0d`, border: `1px solid ${step.color}40`, borderRadius: '8px' }}>
                <p style={{ fontSize: '0.62rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em', color: step.color, marginBottom: '0.25rem' }}>Output</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: '1.4', fontWeight: '500' }}>{step.output}</p>
              </div>
            </div>
          </div>

          {/* Level 2 — Requirements table */}
          <div style={{ background: 'var(--surface)' }}>

            {/* Two-layer legend */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '0.875rem 1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '3px', height: '16px', borderRadius: '2px', background: `${step.color}55`, flexShrink: 0 }} />
                <p style={{ fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)' }}>Governance Standard</p>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>— universal requirements for any RAG application</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '3px', height: '16px', borderRadius: '2px', background: step.color, flexShrink: 0 }} />
                <p style={{ fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: step.color }}>Live Compliance Evidence</p>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>— real-time proof from this deployment</span>
              </div>
            </div>

            <div style={{ border: '1px solid var(--border)', borderTop: 'none', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-2)', borderBottom: '2px solid var(--border)' }}>
                    <th style={{ padding: '0.65rem 1rem', textAlign: 'left', fontWeight: '700', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', width: '55%' }}>Requirement</th>
                    <th style={{ padding: '0.65rem 1rem', textAlign: 'left', fontWeight: '700', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: step.color, width: '35%' }}>Live Evidence</th>
                    <th style={{ padding: '0.65rem 1rem', width: '10%' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {step.requirements.map((r, ri) => {
                    const key = `${step.step}-${ri}`;
                    const isOpen = expandedReq === key;
                    const liveVal = getLiveValue(r);
                    const status = getStatus(r);
                    const destTab = r.metric ? METRIC_TAB[r.metric] : null;

                    return (
                      <React.Fragment key={key}>
                        {/* Collapsed row */}
                        <tr
                          onClick={() => handleReqClick(key)}
                          style={{ cursor: 'pointer', background: isOpen ? `${step.color}06` : (ri % 2 === 0 ? 'white' : 'var(--surface-2)'), transition: 'background 0.1s', borderBottom: '1px solid var(--border)' }}
                          onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = `${step.color}05`; }}
                          onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = ri % 2 === 0 ? 'white' : 'var(--surface-2)'; }}
                        >
                          {/* Col 1 — Requirement */}
                          <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle', borderLeft: `3px solid ${isOpen ? step.color : step.color + '44'}` }}>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: isOpen ? '600' : '400', lineHeight: '1.45' }}>{r.req}</p>
                          </td>

                          {/* Col 2 — Live evidence summary */}
                          <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontSize: '0.85rem', flexShrink: 0 }}>{status}</span>
                              <span style={{
                                fontSize: '0.8rem', fontWeight: '600',
                                color: liveVal !== '—' ? step.color : 'var(--text-tertiary)',
                                background: liveVal !== '—' ? `${step.color}12` : 'transparent',
                                border: liveVal !== '—' ? `1px solid ${step.color}30` : 'none',
                                padding: liveVal !== '—' ? '0.1rem 0.45rem' : '0',
                                borderRadius: '5px', display: 'inline-block'
                              }}>{liveVal}</span>
                              {liveVal !== '—' && <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>{r.label}</span>}
                            </div>
                          </td>

                          {/* Col 3 — Expand toggle */}
                          <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle', textAlign: 'center' }}>
                            <span style={{ color: isOpen ? step.color : 'var(--text-tertiary)', fontSize: '0.7rem', fontWeight: '700' }}>{isOpen ? '▲' : '▼'}</span>
                          </td>
                        </tr>

                        {/* Expanded — two sections */}
                        {isOpen && (
                          <tr style={{ borderBottom: '1px solid var(--border)' }}>
                            <td colSpan={3} style={{ padding: 0 }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>

                                {/* Section A — Governance Standard */}
                                <div style={{ padding: '1.1rem 1.25rem', background: 'var(--surface-2)', borderLeft: `3px solid ${step.color}55`, borderRight: '1px solid var(--border)' }}>
                                  <p style={{ fontSize: '0.6rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-tertiary)', marginBottom: '0.6rem' }}>Governance Standard</p>
                                  <p style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-primary)', lineHeight: '1.5', marginBottom: '0.6rem' }}>{r.req}</p>
                                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.55', marginBottom: '0.75rem' }}>{r.control}</p>
                                  <a href={r.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', fontWeight: '600', color: 'var(--text-secondary)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '5px', padding: '0.2rem 0.6rem', textDecoration: 'none' }}>
                                    📋 {r.policy} ↗
                                  </a>
                                </div>

                                {/* Section B — Live Compliance Evidence */}
                                <div style={{ padding: '1.1rem 1.25rem', background: 'white', borderLeft: `3px solid ${step.color}` }}>
                                  <p style={{ fontSize: '0.6rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: step.color, marginBottom: '0.6rem' }}>Live Compliance Evidence</p>
                                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                    <span style={{ fontSize: '1.4rem', lineHeight: 1, flexShrink: 0 }}>{status}</span>
                                    <div>
                                      <p style={{ fontSize: '1.5rem', fontFamily: 'Syne, sans-serif', fontWeight: '800', color: liveVal !== '—' ? step.color : 'var(--text-tertiary)', lineHeight: 1.1 }}>{liveVal}</p>
                                      <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{r.label}</p>
                                    </div>
                                  </div>
                                  {destTab ? (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); onTabChange(destTab); }}
                                      style={{ padding: '0.3rem 0.75rem', borderRadius: '6px', border: 'none', background: step.color, color: '#fff', fontSize: '0.72rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}
                                    >→ View in {destTab}</button>
                                  ) : (
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>No live metric instrumented</span>
                                  )}
                                </div>

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
