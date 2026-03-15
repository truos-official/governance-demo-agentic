import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Argentina', 'Armenia', 'Australia',
  'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Belarus', 'Belgium', 'Belize',
  'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei',
  'Bulgaria', 'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon', 'Canada', 'Chad', 'Chile',
  'China', 'Colombia', 'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic',
  'Denmark', 'Djibouti', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Estonia',
  'Ethiopia', 'Finland', 'France', 'Gabon', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Guatemala',
  'Guinea', 'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq',
  'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kuwait',
  'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Libya', 'Lithuania', 'Luxembourg', 'Madagascar',
  'Malaysia', 'Maldives', 'Mali', 'Malta', 'Mexico', 'Moldova', 'Mongolia', 'Montenegro',
  'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua',
  'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Panama',
  'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda',
  'Saudi Arabia', 'Senegal', 'Serbia', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia',
  'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan',
  'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Togo',
  'Tunisia', 'Turkey', 'Turkmenistan', 'Uganda', 'Ukraine', 'United Arab Emirates',
  'United Kingdom', 'United Nations', 'United States', 'Uruguay', 'Uzbekistan', 'Venezuela',
  'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
];

export default function AuthGate({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    title: '',
    company: '',
    country: ''
  });

  useEffect(() => {
    // Fetch Azure SWA auth identity
    fetch('/.auth/me')
      .then(res => res.json())
      .then(data => {
        const principal = data?.clientPrincipal;
        if (principal) {
          const claims = principal.claims || [];
          const emailClaim = claims.find(c => c.typ === 'emails' || c.typ === 'email' || c.typ === 'preferred_username');
          const nameClaim = claims.find(c => c.typ === 'name');
          const userData = {
            id: principal.userId,
            name: nameClaim?.val || principal.userDetails || '',
            email: emailClaim?.val || principal.userDetails || '',
            provider: principal.identityProvider
          };
          setUser(userData);
          setForm(f => ({ ...f, full_name: userData.name, email: userData.email }));
          checkProfile(userData.id);
        } else {
          // Not on Azure SWA — dev mode, bypass auth
          const devUser = { id: 'dev_user', name: 'Developer', email: 'dev@localhost', provider: 'dev' };
          setUser(devUser);
          setForm(f => ({ ...f, full_name: devUser.name, email: devUser.email }));
          checkProfile(devUser.id);
        }
      })
      .catch(() => {
        const devUser = { id: 'dev_user', name: 'Developer', email: 'dev@localhost', provider: 'dev' };
        setUser(devUser);
        setForm(f => ({ ...f, full_name: devUser.name, email: devUser.email }));
        checkProfile(devUser.id);
      });
  }, []);

  const checkProfile = async (userId) => {
    try {
      const res = await axios.get(`${API_URL}/user-profile/${userId}`);
      if (res.data?.profile) {
        setProfile(res.data.profile);
        setShowForm(false);
      } else {
        setShowForm(true);
      }
    } catch {
      setShowForm(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.full_name.trim()) { setFormError('Full name is required'); return; }
    if (!form.email.trim()) { setFormError('Email is required'); return; }
    if (!form.title.trim()) { setFormError('Professional title is required'); return; }
    if (!form.company.trim()) { setFormError('Company / Organization is required'); return; }
    if (!form.country) { setFormError('Country is required'); return; }

    setSubmitting(true);
    setFormError('');
    try {
      await axios.post(`${API_URL}/register`, {
        user_id: user.id,
        provider: user.provider,
        ...form
      });
      setProfile(form);
      setShowForm(false);
    } catch {
      setFormError('Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--surface-2)'
    }}>
      <div style={{ textAlign: 'center' }}>
        <img src="/un-emblem.png" alt="UN Emblem" style={{ height: '50px', width: 'auto', marginBottom: '0.75rem' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading...</p>
      </div>
    </div>
  );

  if (showForm) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--surface-2)', padding: '2rem'
    }}>
      <div style={{
        background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)', boxShadow: 'var(--shadow-3)',
        padding: '2.5rem', width: '100%', maxWidth: '520px'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src="/un-emblem.png" alt="UN Emblem" style={{ height: '50px', width: 'auto', marginBottom: '0.75rem' }} />
          <h2 style={{
            fontFamily: 'Syne, sans-serif', fontSize: '1.3rem', fontWeight: '700',
            color: 'var(--text-primary)', marginBottom: '0.4rem'
          }}>Complete Your Profile</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.55' }}>
            Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}. Please complete your profile to access the UN AI Governance Assistant.
          </p>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            { key: 'full_name', label: 'Full Name', placeholder: 'Your full name', type: 'text' },
            { key: 'email', label: 'Email Address', placeholder: 'your@email.com', type: 'email' },
            { key: 'title', label: 'Professional Title', placeholder: 'e.g. AI Policy Advisor', type: 'text' },
            { key: 'company', label: 'Organization / Company', placeholder: 'e.g. United Nations OICT', type: 'text' },
          ].map(field => (
            <div key={field.key}>
              <label style={{
                display: 'block', fontSize: '0.78rem', fontWeight: '600',
                color: 'var(--text-secondary)', marginBottom: '0.4rem',
                textTransform: 'uppercase', letterSpacing: '0.04em'
              }}>{field.label} <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input
                type={field.type}
                value={form[field.key]}
                onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                style={{
                  width: '100%', padding: '0.75rem 1rem', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', fontFamily: 'DM Sans, sans-serif',
                  fontSize: '0.9rem', color: 'var(--text-primary)', background: 'var(--surface)',
                  outline: 'none', boxSizing: 'border-box'
                }}
                onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
          ))}

          <div>
            <label style={{
              display: 'block', fontSize: '0.78rem', fontWeight: '600',
              color: 'var(--text-secondary)', marginBottom: '0.4rem',
              textTransform: 'uppercase', letterSpacing: '0.04em'
            }}>Country <span style={{ color: 'var(--danger)' }}>*</span></label>
            <select
              value={form.country}
              onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
              style={{
                width: '100%', padding: '0.75rem 1rem', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', fontFamily: 'DM Sans, sans-serif',
                fontSize: '0.9rem', color: form.country ? 'var(--text-primary)' : 'var(--text-tertiary)',
                background: 'var(--surface)', outline: 'none', boxSizing: 'border-box',
                cursor: 'pointer'
              }}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            >
              <option value="">Select your country</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {formError && (
            <p style={{ color: 'var(--danger)', fontSize: '0.83rem', textAlign: 'center' }}>⚠️ {formError}</p>
          )}

          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={submitting}
            style={{ width: '100%', padding: '0.875rem', marginTop: '0.5rem', fontSize: '0.95rem' }}
          >
            {submitting ? 'Saving...' : 'Access the Assistant →'}
          </button>

          <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textAlign: 'center', lineHeight: '1.55' }}>
            Your information is stored securely and used only to personalize your experience and track usage analytics.
          </p>
        </div>
      </div>
    </div>
  );

  // Inject user into children via context
  return children({ user, profile });
}