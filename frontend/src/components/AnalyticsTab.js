import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import axios from 'axios';

const API_URL = 'http://localhost:8000';
const COLORS = ['#1a73e8', '#1e8e3e', '#f9ab00', '#d93025', '#7b61ff'];

const KPICard = ({ label, value, color, source }) => (
  <div className="card" style={{ borderTop: `3px solid ${color}`, marginBottom: 0 }}>
    <p className="kpi-label">{label}</p>
    <p className="kpi-value">{value}</p>
    <p className="kpi-source">Source: {source}</p>
  </div>
);

export default function AnalyticsTab() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchMetrics = useCallback(() => {
    setLoading(true);
    axios.get(`${API_URL}/metrics`)
      .then(res => {
        setMetrics(res.data);
        setLastUpdated(new Date().toLocaleTimeString());
      })
      .catch(() => setMetrics(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchMetrics(); }, [fetchMetrics]);

  const styleData = Object.entries(metrics?.style_distribution || {}).map(([name, value]) => ({ name, value }));
  const sourceData = Object.entries(metrics?.top_sources || {}).map(([name, value]) => ({ name, value }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        {lastUpdated && <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>Last updated: {lastUpdated}</span>}
        <button className="btn-primary" onClick={fetchMetrics} disabled={loading}>
          {loading ? 'Loading...' : '↻ Refresh'}
        </button>
      </div>

      {!metrics ? (
        <div className="card">
          <p style={{ color: 'var(--text-secondary)' }}>No metrics available yet. Submit some queries first.</p>
        </div>
      ) : (
        <>
          <p className="section-label">Application Metrics — Redis</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', marginBottom: '1.25rem' }}>
            <KPICard label="Total Queries" value={metrics.total_queries ?? 0} color="#1a73e8" source="Redis" />
            <KPICard label="Cache Hit Rate" value={metrics.cache_hit_rate ?? '0%'} color="#1e8e3e" source="Redis" />
            <KPICard label="Hallucination Rate" value={metrics.hallucination_rate ?? '0%'} color="#f9ab00" source="Redis" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <KPICard label="Security Block Rate" value={metrics.security_block_rate ?? '0%'} color="#7b61ff" source="Redis" />
            <KPICard label="PII Detection Rate" value={metrics.pii_detection_rate ?? '0%'} color="#d93025" source="Redis" />
          </div>

          <p className="section-label">LLM Observability — LangSmith</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', marginBottom: '1.25rem' }}>
            <KPICard label="Avg Latency" value={metrics.avg_latency ?? '—'} color="#1a73e8" source="LangSmith" />
            <KPICard label="Total Tokens Used" value={(metrics.total_tokens ?? 0).toLocaleString()} color="#1e8e3e" source="LangSmith" />
            <KPICard label="Total Cost" value={metrics.total_cost ?? '$0.00'} color="#f9ab00" source="LangSmith" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <KPICard label="Error Rate" value={metrics.error_rate ?? '0%'} color="#d93025" source="LangSmith" />
            <KPICard label="Total LLM Runs" value={metrics.total_llm_runs ?? 0} color="#7b61ff" source="LangSmith" />
          </div>

          <div className="grid-2">
            <div className="card">
              <div className="card-title">
                Response Style Distribution
                <span className="chip">Redis</span>
              </div>
              {styleData.length === 0
                ? <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>No data yet — submit some queries first.</p>
                : <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={styleData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {styleData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
              }
            </div>

            <div className="card">
              <div className="card-title">
                Top Cited UN Documents
                <span className="chip">Redis</span>
              </div>
              {sourceData.length === 0
                ? <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>No data yet — submit some queries first.</p>
                : <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={sourceData} layout="vertical" margin={{ left: 10 }}>
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#1a73e8" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
              }
            </div>
          </div>
        </>
      )}
    </div>
  );
}