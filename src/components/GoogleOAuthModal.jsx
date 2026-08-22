import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Check,
  Calendar,
  X,
  UserPlus,
  ArrowLeft,
  ArrowRight,
  Shield,
  Trash2,
  ChevronDown
} from 'lucide-react';

export const GoogleOAuthModal = ({ isOpen, onClose, onSignIn }) => {
  const { savedAccounts, deleteAccount } = useAuth();

  // Screen view: 'list' | 'add' | 'loading'
  const [view, setView] = useState('list');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [allowCalendar, setAllowCalendar] = useState(true);
  const [error, setError] = useState('');
  const [isManaging, setIsManaging] = useState(false);

  // Available Google accounts from saved accounts, or default sample accounts
  const googleAccounts = savedAccounts && savedAccounts.length > 0
    ? savedAccounts.filter(a => a.provider === 'google' || (a.email && a.email.includes('@')))
    : [
        {
          uid: 'usr_g_kaveesha_1',
          displayName: 'Kaveesha Viraj',
          email: 'kaveeshaviraj@gmail.com',
          provider: 'google',
          calendarConnected: true
        },
        {
          uid: 'usr_g_kaveesha_2',
          displayName: 'Kaveesha (Work)',
          email: 'kaveesha.work@gmail.com',
          provider: 'google',
          calendarConnected: true
        }
      ];

  const accountsToDisplay = googleAccounts.length > 0 ? googleAccounts : [
    {
      uid: 'usr_g_kaveesha_1',
      displayName: 'Kaveesha Viraj',
      email: 'kaveeshaviraj@gmail.com',
      provider: 'google',
      calendarConnected: true
    }
  ];

  // Reset modal state when opened
  useEffect(() => {
    if (isOpen) {
      setView('list');
      setSelectedAccount(null);
      setError('');
      setGoogleEmail('');
      setGoogleName('');
      setIsManaging(false);
    }
  }, [isOpen]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Handle instant sign in with an existing account from the list
  const handleSelectAccount = (account) => {
    setSelectedAccount(account);
    setView('loading');
    setError('');

    // Simulate realistic Google OAuth roundtrip verification (450ms)
    setTimeout(() => {
      onSignIn({
        email: account.email,
        displayName: account.displayName || account.email.split('@')[0],
        calendarConnected: allowCalendar
      });
    }, 450);
  };

  // Handle manual email submission in 'add' view
  const handleAddAccountSubmit = (e) => {
    e.preventDefault();
    setError('');

    const emailTrimmed = googleEmail.trim().toLowerCase();
    if (!emailTrimmed) {
      setError('Please enter your Google account email.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      setError('Enter a valid email address (e.g. name@gmail.com)');
      return;
    }

    const nameToUse = googleName.trim() || emailTrimmed.split('@')[0];
    const formattedName = nameToUse.charAt(0).toUpperCase() + nameToUse.slice(1);

    const newAcc = {
      email: emailTrimmed,
      displayName: formattedName,
      calendarConnected: allowCalendar
    };

    setSelectedAccount(newAcc);
    setView('loading');

    setTimeout(() => {
      onSignIn(newAcc);
    }, 450);
  };

  // Avatar background colors based on email string hash
  const getAvatarColor = (str = '') => {
    const colors = [
      'linear-gradient(135deg, #4285F4, #1a73e8)', // Google Blue
      'linear-gradient(135deg, #34A853, #188038)', // Google Green
      'linear-gradient(135deg, #FBBC05, #e37400)', // Google Yellow
      'linear-gradient(135deg, #EA4335, #c5221f)', // Google Red
      'linear-gradient(135deg, #8B5CF6, #6366F1)'  // Violet
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="modal-backdrop google-oauth-backdrop" onClick={onClose} role="dialog" aria-modal="true" style={{ zIndex: 120 }}>
      <div
        className="google-oauth-window-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated Google Progress Bar when loading */}
        {view === 'loading' && (
          <div className="google-auth-loading-bar">
            <div className="google-auth-loading-bar-inner" />
          </div>
        )}

        {/* Modal Top Bar */}
        <div className="google-chooser-topbar">
          <div className="google-brand-badge">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-label="Google">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span className="google-brand-title">Sign in with Google</span>
          </div>

          <button
            type="button"
            className="google-close-btn"
            onClick={onClose}
            aria-label="Close"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* VIEW 1: ACCOUNT SELECTION LIST */}
        {view === 'list' && (
          <div className="google-chooser-body">
            {/* Header Titles */}
            <div className="google-chooser-heading">
              <h2 className="google-main-title">Choose an account</h2>
              <p className="google-main-subtitle">
                to continue to <strong className="app-brand-accent">Aura To-Do</strong>
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="google-error-box">
                <span>{error}</span>
              </div>
            )}

            {/* List of Google Accounts */}
            <div className="google-account-list" role="listbox">
              {accountsToDisplay.map((acc, index) => {
                const initial = (acc.displayName || acc.email || 'G').charAt(0).toUpperCase();
                const avatarBg = getAvatarColor(acc.email);

                return (
                  <div
                    key={acc.uid || acc.email || index}
                    className="google-account-item"
                    onClick={() => !isManaging && handleSelectAccount(acc)}
                    role="option"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && !isManaging && handleSelectAccount(acc)}
                  >
                    <div
                      className="google-avatar-circle"
                      style={{ background: avatarBg }}
                    >
                      {initial}
                    </div>

                    <div className="google-account-details">
                      <div className="google-account-name">{acc.displayName || acc.email.split('@')[0]}</div>
                      <div className="google-account-email">{acc.email}</div>
                    </div>

                    {isManaging ? (
                      <button
                        type="button"
                        className="google-remove-acc-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (acc.uid) deleteAccount(acc.uid);
                        }}
                        title="Remove from this device"
                      >
                        <Trash2 size={15} />
                      </button>
                    ) : (
                      <div className="google-account-arrow">
                        <ArrowRight size={15} />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Use Another Account Button */}
              <button
                type="button"
                className="google-account-item google-use-another-btn"
                onClick={() => {
                  setView('add');
                  setError('');
                }}
              >
                <div className="google-avatar-circle google-avatar-another">
                  <UserPlus size={16} />
                </div>
                <div className="google-account-details">
                  <div className="google-account-name google-another-text">Use another account</div>
                </div>
              </button>
            </div>

            {/* Calendar Consent Checkbox */}
            <div
              className="google-scope-card"
              onClick={() => setAllowCalendar(!allowCalendar)}
            >
              <div className={`custom-checkbox ${allowCalendar ? 'checked' : ''}`}>
                {allowCalendar && <Check size={11} strokeWidth={3} />}
              </div>
              <div className="google-scope-text">
                <div className="google-scope-title">
                  <Calendar size={13} style={{ color: 'var(--gcal-blue)' }} />
                  <span>Google Calendar Sync</span>
                </div>
                <div className="google-scope-desc">
                  Allow Aura to automatically sync and schedule tasks with due dates in your Google Calendar.
                </div>
              </div>
            </div>

            {/* Manage Accounts Toggle */}
            {accountsToDisplay.length > 1 && (
              <div className="google-manage-bar">
                <button
                  type="button"
                  className="google-manage-toggle-btn"
                  onClick={() => setIsManaging(!isManaging)}
                >
                  {isManaging ? 'Done managing accounts' : 'Manage accounts on this device'}
                </button>
              </div>
            )}

            {/* Disclaimer & Privacy Text */}
            <div className="google-oauth-disclaimer">
              To continue, Google will share your name, email address, language preference, and profile picture with Aura. Before using this app, review Aura's <span className="google-link">Privacy Policy</span> and <span className="google-link">Terms of Service</span>.
            </div>
          </div>
        )}

        {/* VIEW 2: USE ANOTHER ACCOUNT FORM */}
        {view === 'add' && (
          <div className="google-chooser-body">
            <div className="google-chooser-heading">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <button
                  type="button"
                  className="google-back-btn"
                  onClick={() => setView('list')}
                  title="Back to accounts list"
                >
                  <ArrowLeft size={16} />
                </button>
                <h2 className="google-main-title" style={{ margin: 0 }}>Sign in</h2>
              </div>
              <p className="google-main-subtitle" style={{ marginLeft: '28px' }}>
                with your Google Account to continue to <strong className="app-brand-accent">Aura</strong>
              </p>
            </div>

            {error && (
              <div className="google-error-box">
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleAddAccountSubmit} className="google-add-form">
              <div className="google-floating-group">
                <label className="google-input-label">Email or phone</label>
                <input
                  type="email"
                  className="google-text-input"
                  placeholder="name@gmail.com"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="google-floating-group">
                <label className="google-input-label">Your Name (optional)</label>
                <input
                  type="text"
                  className="google-text-input"
                  placeholder="e.g. Kaveesha"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                />
              </div>

              {/* Calendar Scope */}
              <div
                className="google-scope-card"
                onClick={() => setAllowCalendar(!allowCalendar)}
              >
                <div className={`custom-checkbox ${allowCalendar ? 'checked' : ''}`}>
                  {allowCalendar && <Check size={11} strokeWidth={3} />}
                </div>
                <div className="google-scope-text">
                  <div className="google-scope-title">
                    <Calendar size={13} style={{ color: 'var(--gcal-blue)' }} />
                    <span>Sync with Google Calendar</span>
                  </div>
                  <div className="google-scope-desc">
                    Grant permission to automatically add scheduled tasks to your Google Calendar.
                  </div>
                </div>
              </div>

              <div className="google-form-actions">
                <button
                  type="button"
                  className="google-secondary-btn"
                  onClick={() => setView('list')}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="google-primary-btn"
                >
                  <span>Next</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </form>

            <div className="google-oauth-disclaimer" style={{ marginTop: '16px' }}>
              By continuing, Google will share your name and email with Aura. Protected by Google Security.
            </div>
          </div>
        )}

        {/* VIEW 3: LOADING SIGN-IN STATE */}
        {view === 'loading' && (
          <div className="google-loading-state">
            <div className="google-spinner-wrap">
              <div className="google-spinner" />
            </div>
            <h3 className="google-loading-title">Connecting to Google...</h3>
            <p className="google-loading-sub">
              Signing in as <strong>{selectedAccount?.displayName || selectedAccount?.email}</strong>
            </p>
            <div className="google-loading-badge">
              <Shield size={14} style={{ color: '#34A853' }} />
              <span>Verifying OAuth 2.0 Credentials</span>
            </div>
          </div>
        )}

        {/* Google Chooser Footer Bar */}
        <div className="google-chooser-footer">
          <div className="google-lang-selector">
            <span>English (United States)</span>
            <ChevronDown size={12} />
          </div>
          <div className="google-footer-links">
            <span className="google-footer-link">Help</span>
            <span className="google-footer-link">Privacy</span>
            <span className="google-footer-link">Terms</span>
          </div>
        </div>
      </div>
    </div>
  );
};
