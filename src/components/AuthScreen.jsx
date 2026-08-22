import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  ShieldCheck,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  Calendar
} from 'lucide-react';

export const AuthScreen = () => {
  const { loginWithGoogle, loginWithEmail, signupWithEmail } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        if (!email.trim() || !password.trim()) {
          throw new Error("Please enter both email and password.");
        }
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters long.");
        }
        signupWithEmail(displayName, email, password);
      } else {
        loginWithEmail(email, password);
      }
    } catch (err) {
      setErrorMsg(err.message || "Authentication failed.");
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setIsLoading(true);
    setTimeout(() => {
      loginWithGoogle();
      setIsLoading(false);
    }, 400);
  };

  const handleQuickDemo = (demoEmail, demoName) => {
    setIsLoading(true);
    setTimeout(() => {
      loginWithGoogle(demoEmail);
      setIsLoading(false);
    }, 300);
  };

  return (
    <div className="auth-fullscreen-container">
      <div className="auth-card">
        {/* Brand Banner */}
        <div className="auth-brand-header">
          <div className="brand-logo" style={{ width: '44px', height: '44px', margin: '0 auto 12px auto' }}>
            <CheckCircle2 size={26} strokeWidth={2.5} />
          </div>
          <h1 className="auth-title">Aura</h1>
          <p className="auth-subtitle">
            AI-Powered Personal To-Do & Smart Calendar Sync
          </p>
        </div>

        {/* Google OAuth Button */}
        <button
          type="button"
          className="google-oauth-btn"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
        >
          <svg className="google-icon" viewBox="0 0 24 24" width="18" height="18">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="auth-gcal-notice">
          <Calendar size={12} style={{ color: 'var(--gcal-blue)' }} />
          <span>Includes Google Calendar sync permission</span>
        </div>

        {/* Divider */}
        <div className="auth-divider">
          <span>or continue with email</span>
        </div>

        {/* Error Feedback */}
        {errorMsg && (
          <div className="auth-error-banner">
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'signup' && (
            <div className="auth-input-group">
              <label className="auth-label">Full Name</label>
              <div className="auth-input-wrapper">
                <User size={16} className="auth-input-icon" />
                <input
                  type="text"
                  className="auth-input"
                  placeholder="e.g. Maya Lin"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="auth-input-group">
            <label className="auth-label">Email Address</label>
            <div className="auth-input-wrapper">
              <Mail size={16} className="auth-input-icon" />
              <input
                type="email"
                className="auth-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="auth-input-group">
            <label className="auth-label">Password</label>
            <div className="auth-input-wrapper">
              <Lock size={16} className="auth-input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                className="auth-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={isLoading}
          >
            <span>{mode === 'signup' ? 'Create Account' : 'Sign In'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Mode Toggle */}
        <div className="auth-switch-prompt">
          {mode === 'signup' ? (
            <p>
              Already have an account?{' '}
              <button type="button" className="auth-link-btn" onClick={() => { setMode('login'); setErrorMsg(''); }}>
                Sign In
              </button>
            </p>
          ) : (
            <p>
              Don't have an account?{' '}
              <button type="button" className="auth-link-btn" onClick={() => { setMode('signup'); setErrorMsg(''); }}>
                Sign Up
              </button>
            </p>
          )}
        </div>

        {/* Quick Demo Account Selector */}
        <div className="auth-demo-accounts">
          <div className="demo-accounts-label">Or test with demo profiles:</div>
          <div className="demo-chips-row">
            <button
              type="button"
              className="demo-chip"
              onClick={() => handleQuickDemo("alex.turner@gmail.com", "Alex Turner")}
            >
              Demo: Alex (Personal & Work)
            </button>
            <button
              type="button"
              className="demo-chip"
              onClick={() => handleQuickDemo("sarah.connor@gmail.com", "Sarah Connor")}
            >
              Demo: Sarah (Clean Workspace)
            </button>
          </div>
        </div>

        {/* Security & Data Isolation Footer Badge */}
        <div className="auth-security-badge">
          <ShieldCheck size={14} style={{ color: '#10B981' }} />
          <span>Strict User Isolation • Encrypted Storage</span>
        </div>
      </div>
    </div>
  );
};
