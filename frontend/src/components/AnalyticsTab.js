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

const SectionBlock = ({ title, badge, badgeColor, note, children }) => (
  <div style={{ marginBottom: '2rem' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: note ? '0.4rem' : '1rem' }}>
      <p className="section-label" style={{ margin: 0 }}>{title}</p>
      {badge && (
        <span style={{
          fontSize: '0.68rem', fontWeight: '600', textTransform: 'uppercase',
          letterSpacing: '0.06em', padding: '0.15rem 0.5rem', borderRadius: '20px',
          background: badgeColor === 'green' ? 'var(--success-light)' : 'var(--surface-3)',
          color: badgeColor === 'green' ? 'var(--success)' : 'var(--text-tertiary)',
          border: `1px solid ${badgeColor === 'green' ? '#a8d5b5' : 'var(--border)'}`,
        }}>{badge}</span>
      )}
    </div>
    {note && (
      <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '1rem', fontStyle: 'italic' }}>
        {note}
      </p>
    )}
    {children}
  </div>
);

const UserTable = ({ users }) => {
  const [expanded, setExpanded] = useState(false);
  const displayUsers = expanded ? users : users.slice(0, 10);
  const hasMore = users.length > 10;

  const headers = ['Name', 'Title', 'Organization', 'Country', 'Queries', 'Hallucination Rate', 'Avg Latency', 'Last Active', 'Provider'];

  return (
    <div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: 'var(--surface-2)', borderBottom: '2px solid var(--border)' }}>
                {headers.map(h => (
                  <th key={h} style={{
                    padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '600',
                    fontSize: '0.72rem', color: 'var(--text-secondary)',
                    textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap'
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayUsers.map((user, i) => (
                <tr key={i} style={{
                  borderBottom: '1px solid var(--border)',
                  background: i % 2 === 0 ? 'white' : 'var(--surface-2)'
                }}>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <p style={{ fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.1rem' }}>{user.full_name}</p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{user.email}</p>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{user.title}</td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{user.company}</td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{user.country}</td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                    <span className="badge badge-blue">{user.total_queries}</span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                    <span className={`badge ${user.hallucination_rate === '0%' ? 'badge-green' : 'badge-yellow'}`}>
                      {user.hallucination_rate}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{user.avg_latency}</td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{user.last_active}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span className="badge badge-purple">{user.provider}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {hasMore && (
        <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
          <button onClick={() => setExpanded(!expanded)} style={{
            background: 'none', border: '1px solid var(--border)', borderRadius: '6px',
            padding: '0.5rem 1.25rem', fontSize: '0.83rem', cursor: 'pointer',
            color: 'var(--text-secondary)', fontFamily: 'inherit'
          }}>
            {expanded
              ? `▲ Show top 10 only`
              : `▼ Show all ${users.length} users`}
          </button>
          {!expanded && (
            <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '0.4rem' }}>
              Showing top 10 by query volume. Full log retained in Redis.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default function AnalyticsTab() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [chartWidth, setChartWidth] = useState(500);
  const [cacheMsg, setCacheMsg] = useState('');
  const [metricsMsg, setMetricsMsg] = useState('');

  const fetchMetrics = useCallback(() => {
    setLoading(true);
    axios.get(`${API_URL}/metrics`)
      .then(res => { setMetrics(res.data); setLastUpdated(new Date().toLocaleTimeString()); })
      .catch(() => setMetrics(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchMetrics(); }, [fetchMetrics]);

  useEffect(() => {
    const updateWidth = () => setChartWidth(Math.floor((window.innerWidth - 160) / 2));
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const clearCache = () => {
    axios.post(`${API_URL}/clear-cache`)
      .then(res => { setCacheMsg(res.data.message); setTimeout(() => setCacheMsg(''), 3000); })
      .catch(() => setCacheMsg('Failed to clear cache'));
  };

  const resetMetrics = () => {
    if (!window.confirm('Reset application metrics? LangSmith, infrastructure and user profile data will not be affected.')) return;
    axios.post(`${API_URL}/reset-metrics`)
      .then(res => {
        setMetricsMsg(res.data.message);
        setTimeout(() => setMetricsMsg(''), 3000);
        fetchMetrics();
      })
      .catch(() => setMetricsMsg('Failed to reset metrics'));
  };

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
  const userActivity = metrics?.user_activity || [];

  return (
    <div>
      {/* Control Bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {cacheMsg && <span style={{ fontSize: '0.78rem', color: 'var(--success)', background: 'var(--success-light)', padding: '0.25rem 0.75rem', borderRadius: '20px' }}>✓ {cacheMsg}</span>}
          {metricsMsg && <span style={{ fontSize: '0.78rem', color: 'var(--success)', background: 'var(--success-light)', padding: '0.25rem 0.75rem', borderRadius: '20px' }}>✓ {metricsMsg}</span>}
          {lastUpdated && <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>Last updated: {lastUpdated}</span>}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button onClick={clearCache} style={{
            background: 'none', border: '1px solid var(--border)', borderRadius: '6px',
            padding: '0.5rem 1rem', fontSize: '0.83rem', cursor: 'pointer',
            color: 'var(--text-secondary)', fontFamily: 'inherit'
          }}>🗑 Clear Cache</button>
          <button onClick={resetMetrics} style={{
            background: 'none', border: '1px solid var(--danger)', borderRadius: '6px',
            padding: '0.5rem 1rem', fontSize: '0.83rem', cursor: 'pointer',
            color: 'var(--danger)', fontFamily: 'inherit'
          }}>⚠ Reset App Metrics</button>
          <button className="btn-primary" onClick={fetchMetrics} disabled={loading}>
            {loading ? 'Loading...' : '↻ Refresh'}
          </button>
        </div>
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex', gap: '1.5rem', marginBottom: '1.75rem',
        padding: '0.75rem 1rem', background: 'var(--surface-2)',
        borderRadius: '8px', border: '1px solid var(--border)', flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Resettable — cleared by Reset App Metrics</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text-tertiary)', display: 'inline-block' }} />
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Cumulative — external service data, not resettable</span>
        </div>
      </div>

      {metrics && <>

        {/* ── RESETTABLE ── */}
        <SectionBlock title="Application Metrics" badge="Resettable · Redis" badgeColor="green">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', marginBottom: '1.25rem' }}>
            <KPICard label="Total Queries" value={metrics.total_queries ?? 0} color="#1a73e8" source="Redis" />
            <KPICard label="Cache Hit Rate" value={metrics.cache_hit_rate} color="#1e8e3e" source="Redis" />
            <KPICard label="Hallucination Rate" value={metrics.hallucination_rate} color="#f9ab00" source="Redis" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
            <KPICard label="Security Block Rate" value={metrics.security_block_rate} color="#7b61ff" source="Redis" />
            <KPICard label="PII Detection Rate" value={metrics.pii_detection_rate} color="#d93025" source="Redis" />
          </div>
        </SectionBlock>

        <SectionBlock title="Latency Percentiles" badge="Resettable · Redis" badgeColor="green">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1.25rem' }}>
            <KPICard label="P50 Latency" value={metrics.latency_p50} color="#1a73e8" source="Redis" />
            <KPICard label="P95 Latency" value={metrics.latency_p95} color="#f9ab00" source="Redis" />
            <KPICard label="P99 Latency" value={metrics.latency_p99} color="#d93025" source="Redis" />
            <KPICard label="Min Latency" value={metrics.latency_min} color="#1e8e3e" source="Redis" />
            <KPICard label="Max Latency" value={metrics.latency_max} color="#7b61ff" source="Redis" />
          </div>
        </SectionBlock>

        <SectionBlock title="Query Analytics" badge="Resettable · Redis" badgeColor="green">
          <div className="grid-2">
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
          {piiEntityData.length > 0 && (
            <div className="card" style={{ marginTop: '1.25rem' }}>
              <div className="card-title">PII Entity Types Detected <span className="chip">Azure Language</span></div>
              <BarChart width={chartWidth * 2} height={200} data={piiEntityData} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#d93025" radius={[0, 6, 6, 0]} />
              </BarChart>
            </div>
          )}
        </SectionBlock>

        {/* User Activity */}
        <SectionBlock
          title="User Activity"
          badge="Persistent · Redis"
          badgeColor="green"
          note="User profiles and full activity log are retained permanently in Redis. Not affected by Reset App Metrics. Showing top 10 by query volume — expand to view all."
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem', marginBottom: '1.25rem' }}>
            <KPICard label="Registered Users" value={metrics.total_registered_users ?? 0} color="#1a73e8" source="Redis" />
            <KPICard label="Active Users" value={userActivity.filter(u => u.total_queries > 0).length} color="#1e8e3e" source="Redis" />
          </div>
          {userActivity.length === 0
            ? <div className="card">
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>No registered users yet. Users appear here after logging in and completing their profile.</p>
              </div>
            : <UserTable users={userActivity} />
          }
        </SectionBlock>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.5rem 0 2rem' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
            Cumulative data — not affected by Reset App Metrics
          </span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        {/* ── NON-RESETTABLE ── */}
        <SectionBlock
          title="LLM Observability"
          badge="Cumulative · LangSmith"
          note="Lifetime data from LangSmith. Reflects all runs since project creation — cannot be reset from this UI."
        >
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', marginBottom: '1.25rem' }}>
            <KPICard label="Total Cost" value={metrics.total_cost} color="#f9ab00" source="LangSmith" />
            <KPICard label="Cost Per Query" value={metrics.cost_per_query} color="#1e8e3e" source="LangSmith" />
            <KPICard label="Error Rate" value={metrics.error_rate} color="#d93025" source="LangSmith" />
          </div>
          <div className="grid-2">
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
        </SectionBlock>

        <SectionBlock
          title="Infrastructure"
          badge="Cumulative · Redis Server + Elasticsearch"
          note="Server-level statistics from Redis and Elasticsearch. Reflects live infrastructure state — cannot be reset."
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '1.25rem' }}>
            <KPICard label="Memory Used" value={metrics.redis_memory_used} color="#1a73e8" source="Redis" />
            <KPICard label="Memory Peak" value={metrics.redis_memory_peak} color="#f9ab00" source="Redis" />
            <KPICard label="Keyspace Hit Ratio" value={metrics.redis_keyspace_hit_ratio} color="#1e8e3e" source="Redis" />
            <KPICard label="Uptime (Days)" value={metrics.redis_uptime_days} color="#7b61ff" source="Redis" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
            <KPICard label="Connected Clients" value={metrics.redis_connected_clients} color="#d93025" source="Redis" />
            <KPICard label="Total Keys" value={metrics.redis_total_keys} color="#1a73e8" source="Redis" />
            <KPICard label="Indexed Documents" value={metrics.es_document_count ?? '—'} color="#1e8e3e" source="Elasticsearch" />
          </div>
        </SectionBlock>

      </>}
    </div>
  );
}