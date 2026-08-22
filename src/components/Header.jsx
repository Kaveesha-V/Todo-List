import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTodo } from '../context/TodoContext';
import { AccountMenu } from './AccountMenu';
import {
  Sparkles,
  Sun,
  Moon,
  Settings,
  CheckCircle2,
  Calendar,
  LogIn,
  ChevronDown
} from 'lucide-react';

export const Header = () => {
  const { currentUser, setAuthModalOpen } = useAuth();
  const { theme, toggleTheme, setIsSettingsOpen } = useTodo();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  return (
    <header className="app-header">
      <div className="header-inner">
        {/* Brand */}
        <div className="brand-section">
          <div className="brand-logo">
            <CheckCircle2 size={22} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="brand-title">
              Aura
              <span className="brand-badge">
                <Sparkles size={11} style={{ display: 'inline', marginRight: '3px' }} />
                AI Sync
              </span>
            </h1>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="header-actions">
          {/* Live Sync Indicator */}
          <div className="sync-status-indicator" title="Real-time multi-tab & cloud sync enabled">
            <span className="sync-pulse-dot"></span>
            <span>Live Sync</span>
          </div>

          {/* Google Calendar Link Button or Synced Chip */}
          {currentUser && (
            currentUser.calendarConnected ? (
              <div
                className="sync-status-indicator"
                style={{ cursor: 'pointer', background: 'var(--gcal-bg)', borderColor: 'var(--gcal-border)', color: 'var(--gcal-blue)' }}
                onClick={() => setIsSettingsOpen(true)}
                title="Google Calendar Synced"
              >
                <Calendar size={13} />
                <span>G-Cal Linked</span>
              </div>
            ) : (
              <button
                type="button"
                className="gcal-connect-header-btn"
                onClick={() => setGoogleModalOpen(true)}
                title="Connect your Google Calendar"
              >
                <Calendar size={13} />
                <span>Connect Google Calendar</span>
              </button>
            )
          )}

          {/* Theme Toggle Button */}
          <button
            className="header-icon-btn"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            aria-label="Toggle Theme"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {/* Settings Button */}
          <button
            className="header-icon-btn"
            onClick={() => setIsSettingsOpen(true)}
            title="Settings & Reminders"
            aria-label="Settings"
          >
            <Settings size={18} />
          </button>

          {/* User Account / Profile Button */}
          {currentUser ? (
            <div style={{ position: 'relative' }}>
              <button
                className="user-profile-btn"
                onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                title="Account Menu & Switcher"
                aria-expanded={accountMenuOpen}
              >
                <div className="user-avatar">
                  {currentUser.displayName.charAt(0)}
                </div>
                <span>{currentUser.displayName.split(' ')[0]}</span>
                <ChevronDown size={13} style={{ color: 'var(--text-tertiary)' }} />
              </button>

              <AccountMenu
                isOpen={accountMenuOpen}
                onClose={() => setAccountMenuOpen(false)}
              />
            </div>
          ) : (
            <button
              className="nlp-submit-btn"
              style={{ padding: '6px 14px', fontSize: '0.85rem' }}
              onClick={() => setAuthModalOpen(true)}
            >
              <LogIn size={15} />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
