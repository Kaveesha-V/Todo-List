import React, { useState } from 'react';
import { Check, Shield, Calendar, X, AlertCircle } from 'lucide-react';

export const GoogleOAuthModal = ({ isOpen, onClose, onSignIn }) => {
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [allowCalendar, setAllowCalendar] = useState(true);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const emailTrimmed = googleEmail.trim().toLowerCase();
    if (!emailTrimmed) {
      setError('Please enter your Google account email.');
      return;
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      setError('Please enter a valid email address.');
      return;
    }

    const nameToUse = googleName.trim() || emailTrimmed.split('@')[0];
    const formattedName = nameToUse.charAt(0).toUpperCase() + nameToUse.slice(1);

    onSignIn({
      email: emailTrimmed,
      displayName: formattedName,
      calendarConnected: allowCalendar
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" style={{ zIndex: 110 }}>
      <div
        className="google-oauth-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Google OAuth Header */}
        <div className="google-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg viewBox="0 0 24 24" width="22" height="22">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Sign in with Google</span>
          </div>
          <button
            type="button"
            className="header-icon-btn"
            style={{ width: '28px', height: '28px' }}
            onClick={onClose}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* App Info */}
        <div className="google-modal-sub">
          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
            Choose an account
          </div>
          <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
            to continue to <strong style={{ color: 'var(--accent)' }}>Aura To-Do</strong>
          </div>
        </div>

        {error && (
          <div className="auth-error-banner" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="auth-input-group">
            <label className="auth-label">Your Google Email</label>
            <div className="auth-input-wrapper">
              <input
                type="email"
                className="auth-input"
                placeholder="e.g. kaveesha@gmail.com"
                value={googleEmail}
                onChange={(e) => setGoogleEmail(e.target.value)}
                autoFocus
                required
              />
            </div>
          </div>

          <div className="auth-input-group">
            <label className="auth-label">Your Name (optional)</label>
            <div className="auth-input-wrapper">
              <input
                type="text"
                className="auth-input"
                placeholder="e.g. Kaveesha"
                value={googleName}
                onChange={(e) => setGoogleName(e.target.value)}
              />
            </div>
          </div>

          {/* Calendar Scope Consent */}
          <div
            className="google-scope-box"
            onClick={() => setAllowCalendar(!allowCalendar)}
          >
            <div
              className={`custom-checkbox ${allowCalendar ? 'checked' : ''}`}
              style={{ width: '18px', height: '18px', marginTop: '2px' }}
            >
              {allowCalendar && <Check size={11} strokeWidth={3} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Calendar size={13} style={{ color: 'var(--gcal-blue)' }} />
                <span>Google Calendar Permission</span>
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)' }}>
                Allow Aura to create and synchronize tasks with due dates in your Google Calendar events.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <button
              type="button"
              className="digest-chip-btn"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="nlp-submit-btn"
              style={{ padding: '8px 18px' }}
            >
              Continue
            </button>
          </div>
        </form>

        {/* Security footnote */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '16px' }}>
          <Shield size={12} style={{ color: '#10B981' }} />
          <span>Google OAuth 2.0 Secure Authentication</span>
        </div>
      </div>
    </div>
  );
};
