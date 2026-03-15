import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;
const COLORS = ['#1a73e8', '#1e8e3e', '#f9ab00', '#d93025', '#7b61ff'];

const KPICard = ({ label, value, color, source }) => (
  <div className="card" style={{ borderTop: `3px solid ${color}`, marginBottom: 0 }}>
    <p className="kpi-label">{label}</p>
    <p className="kpi-value" style={{ fontSize: typeof value === 'string' && value.length > 8 ? '1.5rem' : '2.25rem' }}>{value ?? '—'}</p>
    <p className="kpi-source">Source: {source}</p>
  </div>
);

const SectionHeader = ({ title }) => (
  <p className="section-label" style={{ marginTop: '1.5rem' }}>{title}</p>
);

export default function AnalyticsTab() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [chartWidth, setChartWidth] = useState(500);

  const fetchMetrics = useCallback(() => {
    setLoading(true);
    axios.get(`${API_URL}/metrics`)
      .then(res => { setMetrics(res.data); setLastUpdated(new Date().toLocaleTimeString()); })
      .catch(() => setMetrics(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchMetrics(); }, [fetchMetrics]);

  useEffect(() => {
    const updateWidth = () => {
      const w = window.innerWidth;
      setChartWidth(Math.floor((w - 160) / 2));
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  if (!metrics && !loading) return (
    <div className="card">
      <p style={{ color: 'var(--text-secondary)' }}>No metrics available yet. Submit some queries first.</p>
    </div>
  );

  const styleData = Object.entries(metrics?.style_distribution || {}).map(([name, value]) => ({ name, value }));
  const sourceData = Object.entries(metrics?.top_sources || {}).map(([name, value]) => ({ name, value }));
  const modelData = Object.entries(metrics?.model_distribution || {}).map(([name, value]) => ({
    name: name.replace('ft:gpt-4o-mini-2024-07-18:truos::', 'fine-tuned::'),
    value
  }));
  const piiEntityData = Object.entries(metrics?.pii_entity_breakdown || {}).map(([name, value]) => ({ name, value }));
  const tokenData = metrics ? [
    { name: 'Prompt', value: metrics.prompt_tokens || 0 },
    { name: 'Completion', value: metrics.completion_tokens || 0 }
  ] : [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        {lastUpdated && <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>Last updated: {lastUpdated}</span>}
        <button className="btn-primary" onClick={fetchMetrics} disabled={loading}>
          {loading ? 'Loading...' : '↻ Refresh'}
        </button>
      </div>

      {metrics && <>
        <SectionHeader title="Application Metrics — Redis" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', marginBottom: '1.25rem' }}>
          <KPICard label="Total Queries" value={metrics.total_queries ?? 0} color="#1a73e8" source="Redis" />
          <KPICard label="Cache Hit Rate" value={metrics.cache_hit_rate} color="#1e8e3e" source="Redis" />
          <KPICard label="Hallucination Rate" value={metrics.hallucination_rate} color="#f9ab00" source="Redis" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem', marginBottom: '1.5rem' }}>
          <KPICard label="Security Block Rate" value={metrics.security_block_rate} color="#7b61ff" source="Redis" />
          <KPICard label="PII Detection Rate" value={metrics.pii_detection_rate} color="#d93025" source="Redis" />
        </div>

        <SectionHeader title="Latency Percentiles — Redis" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1.25rem', marginBottom: '1.5rem' }}>
          <KPICard label="P50 Latency" value={metrics.latency_p50} color="#1a73e8" source="Redis" />
          <KPICard label="P95 Latency" value={metrics.latency_p95} color="#f9ab00" source="Redis" />
          <KPICard label="P99 Latency" value={metrics.latency_p99} color="#d93025" source="Redis" />
          <KPICard label="Min Latency" value={metrics.latency_min} color="#1e8e3e" source="Redis" />
          <KPICard label="Max Latency" value={metrics.latency_max} color="#7b61ff" source="Redis" />
        </div>

        <SectionHeader title="LLM Observability — LangSmith" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', marginBottom: '1.25rem' }}>
          <KPICard label="Avg Latency" value={metrics.avg_latency} color="#1a73e8" source="LangSmith" />
          <KPICard label="P95 Latency" value={metrics.p95_latency} color="#f9ab00" source="LangSmith" />
          <KPICard label="Total LLM Runs" value={metrics.total_llm_runs ?? 0} color="#7b61ff" source="LangSmith" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', marginBottom: '1.25rem' }}>
          <KPICard label="Total Tokens" value={(metrics.total_tokens ?? 0).toLocaleString()} color="#1e8e3e" source="LangSmith" />
          <KPICard label="Prompt Tokens" value={(metrics.prompt_tokens ?? 0).toLocaleString()} color="#1a73e8" source="LangSmith" />
          <KPICard label="Completion Tokens" value={(metrics.completion_tokens ?? 0).toLocaleString()} color="#7b61ff" source="LangSmith" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', marginBottom: '1.5rem' }}>
          <KPICard label="Total Cost" value={metrics.total_cost} color="#f9ab00" source="LangSmith" />
          <KPICard label="Cost Per Query" value={metrics.cost_per_query} color="#1e8e3e" source="LangSmith" />
          <KPICard label="Error Rate" value={metrics.error_rate} color="#d93025" source="LangSmith" />
        </div>

        <SectionHeader title="Search Infrastructure — Elasticsearch" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', marginBottom: '1.25rem' }}>
          <KPICard label="Indexed Documents" value={metrics.es_document_count ?? '—'} color="#1a73e8" source="Elasticsearch" />
          <KPICard label="Index Size" value={metrics.es_index_size} color="#1e8e3e" source="Elasticsearch" />
          <KPICard label="Avg Search Time" value={metrics.es_avg_search_time} color="#f9ab00" source="Elasticsearch" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem', marginBottom: '1.5rem' }}>
          <KPICard label="Total Searches" value={metrics.es_total_searches ?? '—'} color="#7b61ff" source="Elasticsearch" />
          <KPICard label="Total Indexing Ops" value={metrics.es_total_indexing_ops ?? '—'} color="#d93025" source="Elasticsearch" />
        </div>

        <SectionHeader title="Cache Infrastructure — Redis" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', marginBottom: '1.25rem' }}>
          <KPICard label="Memory Used" value={metrics.redis_memory_used} color="#1a73e8" source="Redis" />
          <KPICard label="Memory Peak" value={metrics.redis_memory_peak} color="#f9ab00" source="Redis" />
          <KPICard label="Keyspace Hit Ratio" value={metrics.redis_keyspace_hit_ratio} color="#1e8e3e" source="Redis" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', marginBottom: '1.5rem' }}>
          <KPICard label="Connected Clients" value={metrics.redis_connected_clients} color="#7b61ff" source="Redis" />
          <KPICard label="Total Keys" value={metrics.redis_total_keys} color="#d93025" source="Redis" />
          <KPICard label="Uptime (Days)" value={metrics.redis_uptime_days} color="#1a73e8" source="Redis" />
        </div>

        <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
          <div className="card">
            <div className="card-title">Response Style Distribution <span className="chip">Redis</span></div>
            {styleData.length === 0
              ? <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>No data yet.</p>
              : <PieChart width={chartWidth} height={220}>
                  <Pie data={styleData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {styleData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
            }
          </div>

          <div className="card">
            <div className="card-title">Top Cited UN Documents <span className="chip">Redis</span></div>
            {sourceData.length === 0
              ? <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>No data yet.</p>
              : <BarChart width={chartWidth} height={220} data={sourceData} layout="vertical" margin={{ left: 10 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#1a73e8" radius={[0, 6, 6, 0]} />
                </BarChart>
            }
          </div>
        </div>

        <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
          <div className="card">
            <div className="card-title">Token Usage Breakdown <span className="chip">LangSmith</span></div>
            {tokenData.every(d => d.value === 0)
              ? <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>No data yet.</p>
              : <PieChart width={chartWidth} height={220}>
                  <Pie data={tokenData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {tokenData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
            }
          </div>

          <div className="card">
            <div className="card-title">Model Usage Distribution <span className="chip">LangSmith</span></div>
            {modelData.length === 0
              ? <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>No data yet.</p>
              : <BarChart width={chartWidth} height={220} data={modelData} layout="vertical" margin={{ left: 10 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#7b61ff" radius={[0, 6, 6, 0]} />
                </BarChart>
            }
          </div>
        </div>

        {piiEntityData.length > 0 && (
          <div className="card">
            <div className="card-title">PII Entity Types Detected <span className="chip">Azure Language</span></div>
            <BarChart width={chartWidth * 2} height={220} data={piiEntityData} layout="vertical" margin={{ left: 10 }}>
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#d93025" radius={[0, 6, 6, 0]} />
            </BarChart>
          </div>
        )}
      </>}
    </div>
  );
}