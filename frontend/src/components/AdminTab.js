import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

const statusColor = {
  approved: 'var(--success)',
  pending: 'var(--warning)',
  revoked: 'var(--danger)',
};

const badge = (status) => (
  <span style={{
    fontSize: '0.7rem', fontWeight: '700', padding: '0.2rem 0.6rem',
    borderRadius: '999px', background: statusColor[status] + '22',
    color: statusColor[status], textTransform: 'uppercase', letterSpacing: '0.05em'
  }}>{status}</span>
);

export default function AdminTab({ currentUserId }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_URL}/users`);
      setUsers(res.data.users || []);
    } catch (e) {
      console.error('Failed to fetch users', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const approve = async (userId) => {
    setActionLoading(userId + '_approve');
    try {
      await axios.post(`${API_URL}/auth/approve?user_id=${userId}&approved_by=${currentUserId}`);
      await fetchUsers();
    } finally {
      setActionLoading(null);
    }
  };

  const revoke = async (userId) => {
    if (!window.confirm('Revoke access for this user?')) return;
    setActionLoading(userId + '_revoke');
    try {
      await axios.post(`${API_URL}/auth/revoke?user_id=${userId}&revoked_by=${currentUserId}`);
      await fetchUsers();
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = users.filter(u => filter === 'all' || u.status === filter);
  const counts = {
    all: users.length,
    pending: users.filter(u => u.status === 'pending').length,
    approved: users.filter(u => u.status === 'approved').length,
    revoked: users.filter(u => u.status === 'revoked').length,
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.3rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
          👤 User Access Management
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Approve or revoke access for registered users.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total', key: 'all', color: 'var(--primary)' },
          { label: 'Pending', key: 'pending', color: 'var(--warning)' },
          { label: 'Approved', key: 'approved', color: 'var(--success)' },
          { label: 'Revoked', key: 'revoked', color: 'var(--danger)' },
        ].map(s => (
          <div key={s.key} onClick={() => setFilter(s.key)} style={{
            background: 'var(--surface)', border: `1px solid ${filter === s.key ? s.color : 'var(--border)'}`,
            borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem', cursor: 'pointer',
            transition: 'border-color 0.15s'
          }}>
            <p style={{ fontSize: '1.6rem', fontWeight: '700', color: s.color, marginBottom: '0.2rem' }}>
              {counts[s.key]}
            </p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading users...</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No users found.</p>
      ) : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                {['Name', 'Email', 'Title', 'Organization', 'Country', 'Registered', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr key={u.user_id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: '600', color: 'var(--text-primary)' }}>{u.full_name}</td>
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>{u.title}</td>
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>{u.company}</td>
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>{u.country}</td>
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                    {u.registered_at ? u.registered_at.slice(0, 10) : '—'}
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>{badge(u.status || 'pending')}</td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {u.status !== 'approved' && (
                        <button
                          onClick={() => approve(u.user_id)}
                          disabled={actionLoading === u.user_id + '_approve'}
                          style={{
                            padding: '0.3rem 0.75rem', fontSize: '0.75rem', fontWeight: '600',
                            borderRadius: '6px', border: 'none', cursor: 'pointer',
                            background: 'var(--success)', color: '#fff'
                          }}
                        >
                          {actionLoading === u.user_id + '_approve' ? '...' : 'Approve'}
                        </button>
                      )}
                      {u.status !== 'revoked' && u.user_id !== currentUserId && (
                        <button
                          onClick={() => revoke(u.user_id)}
                          disabled={actionLoading === u.user_id + '_revoke'}
                          style={{
                            padding: '0.3rem 0.75rem', fontSize: '0.75rem', fontWeight: '600',
                            borderRadius: '6px', border: 'none', cursor: 'pointer',
                            background: 'var(--danger)', color: '#fff'
                          }}
                        >
                          {actionLoading === u.user_id + '_revoke' ? '...' : 'Revoke'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}