import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { isCloudDatabaseReady } from '../services/firebaseDb';
import {
  CheckCircle2,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  Sparkles,
  Calendar,
  Shield,
  ArrowRight,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export const AuthScreen = () => {
  const {
    loginWithGoogle,
    loginWithEmail,
    signupWithEmail,
    sendPasswordReset
  } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const slides = [
    {
      badge: "Aura Workspace '26",
      title: "Be in your flow",
      subtitle: "Experience AI-powered natural language task management and effortless daily focus.",
      highlight: "Real-time Google Calendar sync and intelligent morning digests built right in.",
      actionText: "Explore Features"
    },
    {
      badge: "AI Powered",
      title: "Type naturally",
      subtitle: "Just say 'Schedule client meeting tomorrow at 3pm #work !high' and watch Aura parse every detail.",
      highlight: "Zero friction task capture with smart subtask breakdowns.",
      actionText: "Try Smart NLP"
    },
    {
      badge: "Real-Time Sync",
      title: "Always connected",
      subtitle: "Instant synchronization across all your tabs, browsers, and devices powered by cloud database.",
      highlight: "Strict user data isolation and encrypted storage for total privacy.",
      actionText: "Learn Security"
    }
  ];

  const handleGoogleSignIn = async () => {
    setErrorMsg('');

    if (!isCloudDatabaseReady()) {
      setErrorMsg("⚠️ Environment variables missing on Vercel: Please add your VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID, etc. in Vercel Project Settings > Environment Variables, then redeploy.");
      return;
    }

    setIsLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error("Firebase Google sign-in error:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMsg("Sign-in cancelled: The Google popup was closed.");
      } else if (err.code === 'auth/unauthorized-domain') {
        const currentHost = window.location.hostname;
        setErrorMsg(`⚠️ Unauthorized Domain: Please add '${currentHost}' to Authorized domains in Firebase Console > Authentication > Settings > Authorized domains.`);
      } else if (err.code === 'auth/operation-not-allowed') {
        setErrorMsg("Google Sign-In is not enabled in Firebase. Go to Firebase Console > Authentication > Sign-in method > Enable Google.");
      } else if (err.code === 'auth/popup-blocked') {
        setErrorMsg("Google login popup was blocked by your browser. Please allow popups for this site.");
      } else {
        setErrorMsg(err.message || "Google Sign-In failed. Please check your credentials.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    if (!password || password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'signup') {
        if (!displayName.trim()) {
          setErrorMsg("Please enter your name.");
          setIsLoading(false);
          return;
        }
        await signupWithEmail(displayName, cleanEmail, password);
      } else {
        await loginWithEmail(cleanEmail, password);
      }
    } catch (err) {
      setErrorMsg(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setForgotError('');
    const cleanForgotEmail = forgotEmail.trim().toLowerCase();
    if (!cleanForgotEmail) {
      setForgotError("Please enter your email address.");
      return;
    }

    setForgotLoading(true);
    try {
      await sendPasswordReset(cleanForgotEmail);
      setForgotSent(true);
    } catch (err) {
      console.error("Password reset error:", err);
      if (err.code === 'auth/user-not-found') {
        setForgotError("No account found with this email address. Try creating an account or sign in with Google.");
      } else if (err.code === 'auth/invalid-email') {
        setForgotError("Please enter a valid email address.");
      } else {
        setForgotError(err.message || "Could not send reset email. Please try again.");
      }
    } finally {
      setForgotLoading(false);
    }
  };

  const nextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="auth-split-wrapper">
      <div className="auth-split-card">
        
        {/* Left Side: Brand Showcase Card */}
        <div className="auth-showcase-panel">
          <div className="showcase-top-header">
            <div className="showcase-brand-pill">
              <Sparkles size={14} />
              <span>{slides[activeSlide].badge}</span>
            </div>
            <div className="showcase-date-badge">
              <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
          </div>

          <div className="showcase-main-content">
            <h2 className="showcase-headline">{slides[activeSlide].title}</h2>
            <div className="showcase-gradient-graphic">
              <div className="graphic-sphere sphere-1"></div>
              <div className="graphic-sphere sphere-2"></div>
              <div className="graphic-overlay-text">
                <CheckCircle2 size={36} strokeWidth={2.2} />
              </div>
            </div>
          </div>

          <div className="showcase-footer">
            <div className="showcase-text-block">
              <h3 className="showcase-subhead">{slides[activeSlide].subtitle}</h3>
              <p className="showcase-desc">{slides[activeSlide].highlight}</p>
            </div>

            <div className="showcase-bottom-controls">
              <button
                type="button"
                className="showcase-cta-btn"
                onClick={nextSlide}
              >
                <span>{slides[activeSlide].actionText}</span>
                <ArrowRight size={14} />
              </button>

              <div className="showcase-nav-dots">
                <button
                  type="button"
                  className="showcase-nav-arrow"
                  onClick={prevSlide}
                  aria-label="Previous slide"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="showcase-dots-group">
                  {slides.map((_, i) => (
                    <span
                      key={i}
                      className={`showcase-dot ${activeSlide === i ? 'active' : ''}`}
                      onClick={() => setActiveSlide(i)}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  className="showcase-nav-arrow"
                  onClick={nextSlide}
                  aria-label="Next slide"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Clean Modern Form */}
        <div className="auth-form-panel">
          {/* Logo & Header */}
          <div className="auth-panel-brand">
            <div className="brand-icon-logo">
              <CheckCircle2 size={24} strokeWidth={2.5} />
            </div>
            <span className="brand-logo-text">Aura</span>
          </div>

          <div className="auth-panel-titles">
            <h1 className="auth-main-heading">
              {mode === 'signup' ? 'Create your account' : 'Log in to your account'}
            </h1>
          </div>

          {/* Google Sign-in Button */}
          <button
            type="button"
            className="webflow-google-btn"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            <svg viewBox="0 0 24 24" width="19" height="19" aria-label="Google">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="webflow-divider">
            <span>or</span>
          </div>

          {/* Error Notice */}
          {errorMsg && (
            <div className="auth-error-banner">
              <AlertCircle size={15} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="webflow-auth-form">
            {mode === 'signup' && (
              <div className="webflow-field-group">
                <input
                  type="text"
                  className="webflow-input"
                  placeholder="Full name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="webflow-field-group">
              <input
                type="email"
                className="webflow-input"
                placeholder="Email address or username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="webflow-field-group" style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                className="webflow-input"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="webflow-pwd-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Forgot Password Link in Login Mode */}
            {mode === 'login' && (
              <div className="webflow-forgot-row">
                <button
                  type="button"
                  className="webflow-forgot-link"
                  onClick={() => {
                    setForgotPasswordOpen(true);
                    setForgotEmail(email);
                    setForgotSent(false);
                  }}
                >
                  Forgot your password?
                </button>
              </div>
            )}

            {/* Continue / Submit Button */}
            <button
              type="submit"
              className="webflow-continue-btn"
              disabled={isLoading}
            >
              <span>{isLoading ? 'Processing...' : (mode === 'signup' ? 'Create Account' : 'Continue')}</span>
            </button>
          </form>

          {/* Switch Mode Prompt */}
          <div className="webflow-switch-prompt">
            {mode === 'signup' ? (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  className="webflow-switch-link"
                  onClick={() => { setMode('login'); setErrorMsg(''); }}
                >
                  Log in
                </button>
              </p>
            ) : (
              <p>
                Don't have an account?{' '}
                <button
                  type="button"
                  className="webflow-switch-link"
                  onClick={() => { setMode('signup'); setErrorMsg(''); }}
                >
                  Sign up
                </button>
              </p>
            )}
          </div>

          {/* Privacy Footnote */}
          <div className="webflow-security-note">
            <Shield size={12} style={{ color: '#10B981' }} />
            <span>Strict User Data Isolation • Cloud Synced</span>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotPasswordOpen && (
        <div className="modal-backdrop" onClick={() => { setForgotPasswordOpen(false); setForgotSent(false); setForgotError(''); }}>
          <div className="forgot-password-card" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.15rem' }}>Reset your password</h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>
              Enter your registered email address and Firebase will send you a password reset link.
            </p>

            {forgotError && (
              <div className="auth-error-banner" style={{ marginBottom: '12px' }}>
                <AlertCircle size={15} />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSent ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="forgot-success-box">
                  <CheckCircle2 size={20} style={{ color: '#10B981', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>Password reset link sent!</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      We sent a reset link to <strong>{forgotEmail}</strong>. Please check your inbox.
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                      💡 <em>Tip: If you don't see it within a minute, check your <strong>Spam / Junk</strong> or <strong>Promotions</strong> folder.</em>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="webflow-continue-btn"
                    style={{ width: 'auto', padding: '8px 20px', marginTop: 0 }}
                    onClick={() => { setForgotPasswordOpen(false); setForgotSent(false); setForgotError(''); }}
                  >
                    Back to Log In
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input
                  type="email"
                  className="webflow-input"
                  placeholder="name@example.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  autoFocus
                  required
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                  <button
                    type="button"
                    className="google-secondary-btn"
                    onClick={() => { setForgotPasswordOpen(false); setForgotError(''); }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="webflow-continue-btn"
                    style={{ width: 'auto', padding: '8px 18px', marginTop: 0 }}
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

