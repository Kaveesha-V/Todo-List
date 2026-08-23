import React, { useState } from 'react';
import { AuthProvider, useAuth, SYSTEM_ADMIN_CREDENTIALS } from './context/AuthContext';
import { TodoProvider, useTodo } from './context/TodoContext';
import { AdminPortalView } from './components/AdminPortalView';
import { ToastContainer } from './components/Toast';
import {
  Shield,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  ExternalLink,
  LogOut,
  CheckCircle2,
  Cpu,
  Radio,
  Server
} from 'lucide-react';

const AdminGatewayContent = () => {
  const { currentUser, isAdmin, loginWithEmail, logout } = useAuth();
  const { addToast } = useTodo();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const user = await loginWithEmail(email.trim().toLowerCase(), password);
      if (user.role !== 'admin') {
        logout();
        setErrorMsg("Access Denied: This account does not possess System Administrator privileges.");
      } else {
        if (addToast) addToast("Welcome back, System Administrator!", "success");
      }
    } catch (err) {
      setErrorMsg(err.message || "Invalid administrator credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handle1ClickFill = () => {
    setEmail(SYSTEM_ADMIN_CREDENTIALS.email);
    setPassword(SYSTEM_ADMIN_CREDENTIALS.password);
    setErrorMsg('');
  };

  // If not logged in as Admin, show the Admin Gateway login screen
  if (!currentUser || !isAdmin) {
    return (
      <div className="admin-gateway-wrapper">
        <div className="admin-gateway-card animate-fade-in">
          {/* Header Shield */}
          <div className="admin-gateway-header">
            <div className="admin-gateway-icon-bubble">
              <Shield size={32} className="admin-gateway-shield" />
            </div>
            <h1 className="admin-gateway-title">Aura Admin Gateway</h1>
            <p className="admin-gateway-subtitle">
              System Command Center & Member Login Oversight • Port 5181
            </p>
            <div className="admin-gateway-status-pill">
              <Radio size={12} className="pulse-icon" />
              <span>Isolated Admin Service: Active</span>
            </div>
          </div>

          {errorMsg && (
            <div className="admin-gateway-error-banner animate-fade-in">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Admin Login Form */}
          <form onSubmit={handleAdminLogin} className="admin-gateway-form">
            <div className="admin-gateway-field">
              <label className="admin-gateway-label">System Admin Email</label>
              <div className="admin-gateway-input-box">
                <Mail size={16} className="input-icon-left" />
                <input
                  type="email"
                  placeholder="admin@aura.workspace"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="admin-gateway-input"
                  required
                />
              </div>
            </div>

            <div className="admin-gateway-field">
              <label className="admin-gateway-label">Admin Master Password</label>
              <div className="admin-gateway-input-box">
                <Lock size={16} className="input-icon-left" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="admin-gateway-input"
                  required
                />
                <button
                  type="button"
                  className="input-icon-right-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="admin-gateway-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? "Authenticating Master Key..." : "Authenticate & Open Command Center"}
            </button>
          </form>

          {/* 1-Click System Credentials Auto-fill */}
          <div className="admin-gateway-shortcut-box">
            <button
              type="button"
              className="admin-gateway-autofill-btn"
              onClick={handle1ClickFill}
              title="1-Click Auto-fill System Administrator Master Credentials"
            >
              <Cpu size={14} />
              <span>1-Click Fill System Admin Credentials</span>
            </button>
          </div>

          {/* Footer note */}
          <div className="admin-gateway-footer">
            <a
              href="http://localhost:5180/"
              target="_blank"
              rel="noopener noreferrer"
              className="admin-gateway-switch-link"
            >
              <span>Open Standard User App (Port 5180)</span>
              <ExternalLink size={13} />
            </a>
          </div>
        </div>

        <ToastContainer />
      </div>
    );
  }

  // When logged in as Admin, show the Full Admin Command Center
  return (
    <div className="admin-standalone-layout">
      {/* Top Admin Topbar */}
      <header className="admin-standalone-topbar">
        <div className="admin-topbar-brand">
          <div className="admin-brand-icon">
            <Shield size={20} />
          </div>
          <div>
            <div className="admin-brand-title">AURA ADMIN COMMAND CENTER</div>
            <div className="admin-brand-sub">Standalone Administration Host • Port 5181</div>
          </div>
        </div>

        <div className="admin-topbar-actions">
          <a
            href="http://localhost:5180/"
            target="_blank"
            rel="noopener noreferrer"
            className="admin-user-app-link-btn"
            title="Open Standard User Workspace in New Tab"
          >
            <span>User App (Port 5180)</span>
            <ExternalLink size={14} />
          </a>

          <div className="admin-user-info-pill">
            <Server size={14} style={{ color: '#10B981' }} />
            <span>{currentUser.email}</span>
          </div>

          <button
            type="button"
            className="admin-logout-topbar-btn"
            onClick={logout}
            title="Log out of Admin Portal"
          >
            <LogOut size={15} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Admin Portal View */}
      <main className="admin-standalone-main">
        <AdminPortalView />
      </main>

      <ToastContainer />
    </div>
  );
};

export function AdminApp() {
  return (
    <AuthProvider>
      <TodoProvider>
        <AdminGatewayContent />
      </TodoProvider>
    </AuthProvider>
  );
}

export default AdminApp;
