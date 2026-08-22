import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Check,
  Calendar,
  X,
  Minus,
  Square,
  Lock,
  User,
  ArrowLeft,
  ArrowRight,
  Shield,
  ChevronDown
} from 'lucide-react';

export const GoogleOAuthModal = ({ isOpen, onClose, onSignIn }) => {
  const { savedAccounts } = useAuth();

  // Screen view: 'list' | 'add' | 'loading'
  const [view, setView] = useState('list');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [error, setError] = useState('');

  // The user's exact Google accounts from their screenshot
  const defaultGoogleAccounts = [
    {
      uid: 'usr_g_kaveesha_primary',
      displayName: 'Kaveesha Vimukthi',
      email: 'kaveeshavimukthi688@gmail.com',
      avatarBg: 'linear-gradient(135deg, #0284c7, #0369a1)',
      initial: 'K'
    },
    {
      uid: 'usr_g_test1',
      displayName: 'Test1 Test1',
      email: 'assignment1test123@gmail.com',
      avatarBg: '#5f6368',
      initial: 'T'
    },
    {
      uid: 'usr_g_kaveesha_ai',
      displayName: 'Kaveesha Vimukthi',
      email: 'kaveeshavimukthiai@gmail.com',
      avatarBg: 'linear-gradient(135deg, #f59e0b, #d97706)',
      initial: 'K'
    }
  ];

  // Combine with any extra saved accounts
  const accountsToDisplay = savedAccounts && savedAccounts.length > 0
    ? [
        ...defaultGoogleAccounts,
        ...savedAccounts.filter(a =>
          a.email &&
          !defaultGoogleAccounts.some(d => d.email.toLowerCase() === a.email.toLowerCase())
        )
      ]
    : defaultGoogleAccounts;

  // Reset modal state when opened
  useEffect(() => {
    if (isOpen) {
      setView('list');
      setSelectedAccount(null);
      setError('');
      setGoogleEmail('');
      setGoogleName('');
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

  // Instant sign in on clicking account row
  const handleSelectAccount = (account) => {
    setSelectedAccount(account);
    setView('loading');
    setError('');

    setTimeout(() => {
      onSignIn({
        email: account.email,
        displayName: account.displayName || account.email.split('@')[0],
        calendarConnected: true
      });
    }, 450);
  };

  // Submit in 'add' view
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
      calendarConnected: true
    };

    setSelectedAccount(newAcc);
    setView('loading');

    setTimeout(() => {
      onSignIn(newAcc);
    }, 450);
  };

  return (
    <div className="modal-backdrop gchrome-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="gchrome-popup-window"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Window Bar (Google Chrome Native Title Bar) */}
        <div className="gchrome-titlebar">
          <div className="gchrome-title-left">
            <svg viewBox="0 0 24 24" width="14" height="14">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span className="gchrome-title-text">Sign in – Google accounts – Google Chrome</span>
          </div>

          <div className="gchrome-window-controls">
            <button type="button" className="gchrome-win-btn" onClick={onClose} aria-label="Minimize">
              <Minus size={11} />
            </button>
            <button type="button" className="gchrome-win-btn" onClick={onClose} aria-label="Maximize">
              <Square size={9} />
            </button>
            <button type="button" className="gchrome-win-btn close" onClick={onClose} aria-label="Close">
              <X size={12} />
            </button>
          </div>
        </div>

        {/* Browser URL / Address Bar */}
        <div className="gchrome-urlbar-row">
          <div className="gchrome-url-box">
            <Lock size={12} style={{ color: '#9aa0a6', marginRight: '6px' }} />
            <span className="gchrome-url-text">accounts.google.com/v3/signin/accountchooser?as=V1B6sg1Pq6FP00AHpeuxG_wnm...</span>
          </div>
        </div>

        {/* Animated Google Progress Bar when loading */}
        {view === 'loading' && (
          <div className="gchrome-loading-bar">
            <div className="gchrome-loading-inner" />
          </div>
        )}

        {/* Inner Content Area */}
        <div className="gchrome-content-area">
          
          {/* Header Brand */}
          <div className="gchrome-brand-row">
            <svg viewBox="0 0 24 24" width="22" height="22">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span className="gchrome-brand-label">Sign in with Google</span>
          </div>

          {/* VIEW 1: ACCOUNT SELECTION LIST */}
          {view === 'list' && (
            <>
              {/* Heading */}
              <div className="gchrome-heading-section">
                <h1 className="gchrome-main-title">Choose an account</h1>
                <p className="gchrome-main-sub">
                  to continue to <a href="#aura" className="gchrome-app-link" onClick={(e) => e.preventDefault()}>aura-todo.app</a>
                </p>
              </div>

              {error && (
                <div className="gchrome-error-alert">
                  <span>{error}</span>
                </div>
              )}

              {/* Exact Account List matching user's screenshot */}
              <div className="gchrome-accounts-list">
                {accountsToDisplay.map((acc, idx) => {
                  const initial = acc.initial || (acc.displayName || acc.email || 'G').charAt(0).toUpperCase();
                  const avatarBg = acc.avatarBg || '#5f6368';

                  return (
                    <div
                      key={acc.uid || acc.email || idx}
                      className="gchrome-account-row"
                      onClick={() => handleSelectAccount(acc)}
                      role="button"
                      tabIndex={0}
                    >
                      <div
                        className="gchrome-avatar"
                        style={{ background: avatarBg }}
                      >
                        {initial}
                      </div>

                      <div className="gchrome-acc-text">
                        <div className="gchrome-acc-name">{acc.displayName || acc.email.split('@')[0]}</div>
                        <div className="gchrome-acc-email">{acc.email}</div>
                      </div>
                    </div>
                  );
                })}

                {/* Use another account row */}
                <div
                  className="gchrome-account-row gchrome-another-row"
                  onClick={() => {
                    setView('add');
                    setError('');
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="gchrome-avatar gchrome-avatar-another">
                    <User size={18} />
                  </div>

                  <div className="gchrome-acc-text">
                    <div className="gchrome-acc-name gchrome-another-label">Use another account</div>
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="gchrome-disclaimer">
                Before using this app, you can review Aura's <a href="#privacy" className="gchrome-blue-link" onClick={(e) => e.preventDefault()}>Privacy Policy</a> and <a href="#terms" className="gchrome-blue-link" onClick={(e) => e.preventDefault()}>Terms of Service</a>.
              </div>
            </>
          )}

          {/* VIEW 2: USE ANOTHER ACCOUNT FORM */}
          {view === 'add' && (
            <div className="gchrome-add-view">
              <div className="gchrome-heading-section" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  className="gchrome-back-arrow"
                  onClick={() => setView('list')}
                  title="Back to accounts"
                >
                  <ArrowLeft size={16} />
                </button>
                <div>
                  <h1 className="gchrome-main-title" style={{ fontSize: '1.4rem', margin: 0 }}>Sign in</h1>
                  <p className="gchrome-main-sub" style={{ margin: '2px 0 0 0' }}>with your Google Account</p>
                </div>
              </div>

              {error && (
                <div className="gchrome-error-alert" style={{ marginTop: '12px' }}>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleAddAccountSubmit} className="gchrome-form" style={{ marginTop: '20px' }}>
                <div className="gchrome-input-box">
                  <label className="gchrome-label">Email or phone</label>
                  <input
                    type="email"
                    className="gchrome-text-field"
                    placeholder="name@gmail.com"
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    autoFocus
                    required
                  />
                </div>

                <div className="gchrome-input-box" style={{ marginTop: '12px' }}>
                  <label className="gchrome-label">Your Name (optional)</label>
                  <input
                    type="text"
                    className="gchrome-text-field"
                    placeholder="e.g. Kaveesha"
                    value={googleName}
                    onChange={(e) => setGoogleName(e.target.value)}
                  />
                </div>

                <div className="gchrome-form-footer" style={{ marginTop: '28px' }}>
                  <button
                    type="button"
                    className="gchrome-btn-secondary"
                    onClick={() => setView('list')}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="gchrome-btn-primary"
                  >
                    Next
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* VIEW 3: LOADING SIGN-IN STATE */}
          {view === 'loading' && (
            <div className="gchrome-loading-state">
              <div className="gchrome-spinner" />
              <h2 className="gchrome-loading-text">Signing in...</h2>
              <p className="gchrome-loading-user">
                {selectedAccount?.displayName || selectedAccount?.email}
              </p>
            </div>
          )}

          {/* Bottom Footer Toolbar (Exact match with screenshot) */}
          <div className="gchrome-bottom-footer">
            <div className="gchrome-lang-box">
              <span>English (United Kingdom)</span>
              <ChevronDown size={11} />
            </div>

            <div className="gchrome-footer-links">
              <span className="gchrome-footer-item">Help</span>
              <span className="gchrome-footer-item">Privacy</span>
              <span className="gchrome-footer-item">Terms</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

