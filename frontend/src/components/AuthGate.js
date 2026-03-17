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

const inputStyle = {
  width: '100%', padding: '0.75rem 1rem', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)', fontFamily: 'DM Sans, sans-serif',
  fontSize: '0.9rem', color: 'var(--text-primary)', background: 'var(--surface)',
  outline: 'none', boxSizing: 'border-box'
};

const labelStyle = {
  display: 'block', fontSize: '0.78rem', fontWeight: '600',
  color: 'var(--text-secondary)', marginBottom: '0.4rem',
  textTransform: 'uppercase', letterSpacing: '0.04em'
};

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
    fetch('/.auth/me')
      .then(res => res.json())
      .then(data => {
        const principal = data?.clientPrincipal;
        if (principal) {
          const claims = principal.claims || [];
          const emailClaim = claims.find(c =>
            c.typ === 'emails' || c.typ === 'email' ||
            c.typ === 'preferred_username' ||
            c.typ === 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'
          );
          const nameClaim = claims.find(c =>
            c.typ === 'name' ||
            c.typ === 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'
          );
          const userData = {
            id: principal.userId,
            name: nameClaim?.val || '',
            email: emailClaim?.val || principal.userDetails || '',
            provider: principal.identityProvider
          };
          setUser(userData);
          // Pre-fill only from real Azure auth identity
          setForm(f => ({
            ...f,
            full_name: userData.name,
            email: userData.email
          }));
          checkProfile(userData.id);
        } else {
          // Dev mode — no pre-fill, empty form
          const devUser = { id: 'dev_user', name: '', email: '', provider: 'dev' };
          setUser(devUser);
          checkProfile(devUser.id);
        }
      })
      .catch(() => {
        const devUser = { id: 'dev_user', name: '', email: '', provider: 'dev' };
        setUser(devUser);
        checkProfile(devUser.id);
      });
  }, []);

  const checkProfile = async (userId) => {
    try {
      const res = await axios.get(`${API_URL}/auth/validate/${userId}`);
      const { status, profile } = res.data;
      if (status === 'approved') {
        setProfile(profile);
        setShowForm(false);
      } else if (status === 'pending') {
        setProfile(profile);
        setShowForm('pending');
      } else if (status === 'revoked') {
        setShowForm('revoked');
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
    if (!form.company.trim()) { setFormError('Organization is required'); return; }
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
    } catch (err) {
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
        <img src="/un-emblem.png" alt="UN Emblem" style={{ height: '50px', width: 'auto', marginBottom: '1rem' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading...</p>
      </div>
    </div>
  );

  if (showForm === 'pending') return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--surface-2)', padding: '2rem'
    }}>
      <div style={{
        background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)', boxShadow: 'var(--shadow-3)',
        padding: '2.5rem', width: '100%', maxWidth: '480px', textAlign: 'center'
      }}>
        <img src="/un-emblem.png" alt="UN Emblem" style={{ height: '50px', width: 'auto', marginBottom: '1.5rem' }} />
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.3rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
          Access Pending Approval
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
          Your registration has been received. An administrator will review your request shortly.
          You will be able to access the system once approved.
        </p>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
          Registered as: <strong>{profile?.email}</strong>
        </p>
      </div>
    </div>
  );

  if (showForm === 'revoked') return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--surface-2)', padding: '2rem'
    }}>
      <div style={{
        background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)', boxShadow: 'var(--shadow-3)',
        padding: '2.5rem', width: '100%', maxWidth: '480px', textAlign: 'center'
      }}>
        <img src="/un-emblem.png" alt="UN Emblem" style={{ height: '50px', width: 'auto', marginBottom: '1.5rem' }} />
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.3rem', fontWeight: '700', color: 'var(--danger)', marginBottom: '0.75rem' }}>
          Access Revoked
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          Your access to this system has been revoked. Please contact the administrator if you believe this is an error.
        </p>
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
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src="/un-emblem.png" alt="UN Emblem" style={{ height: '50px', width: 'auto', marginBottom: '1rem' }} />
          <h2 style={{
            fontFamily: 'Syne, sans-serif', fontSize: '1.3rem', fontWeight: '700',
            color: 'var(--text-primary)', marginBottom: '0.5rem'
          }}>Complete Your Profile</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.55' }}>
            Access to this system is by invitation only. Please complete your profile to continue.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            { key: 'full_name', label: 'Full Name', placeholder: 'Enter your full name', type: 'text' },
            { key: 'email', label: 'Work Email Address', placeholder: 'Enter your work email', type: 'email' },
            { key: 'title', label: 'Professional Title', placeholder: 'e.g. AI Policy Advisor, Director, Researcher', type: 'text' },
            { key: 'company', label: 'Organization / Company', placeholder: 'e.g. United Nations, World Bank, Government of Canada', type: 'text' },
          ].map(field => (
            <div key={field.key}>
              <label style={labelStyle}>
                {field.label} <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                type={field.type}
                value={form[field.key]}
                onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
          ))}

          <div>
            <label style={labelStyle}>
              Country <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <select
              value={form.country}
              onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
              style={{
                ...inputStyle,
                color: form.country ? 'var(--text-primary)' : 'var(--text-tertiary)',
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
            <p style={{ color: 'var(--danger)', fontSize: '0.83rem', textAlign: 'center' }}>
              ⚠️ {formError}
            </p>
          )}

          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={submitting}
            style={{ width: '100%', padding: '0.875rem', marginTop: '0.5rem', fontSize: '0.95rem' }}
          >
            {submitting ? 'Saving...' : 'Request Access →'}
          </button>

          <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textAlign: 'center', lineHeight: '1.55' }}>
            Your information is stored securely and used only to track usage and personalize your experience.
            This system is restricted to invited users only.
          </p>
        </div>
      </div>
    </div>
  );

  return children({ user, profile });
}