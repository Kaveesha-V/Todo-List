import React from 'react';
import { useTodo } from '../context/TodoContext';
import { Sparkles, Sun, Moon, Settings, CheckCircle2, Calendar } from 'lucide-react';

export const Header = () => {
  const { theme, toggleTheme, setIsSettingsOpen, user } = useTodo();

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

          {/* Google Calendar Connected Chip */}
          {user.calendarConnected && (
            <div
              className="sync-status-indicator"
              style={{ cursor: 'pointer', background: 'var(--gcal-bg)', borderColor: 'var(--gcal-border)', color: 'var(--gcal-blue)' }}
              onClick={() => setIsSettingsOpen(true)}
              title="Google Calendar Synced"
            >
              <Calendar size={13} />
              <span>G-Cal Linked</span>
            </div>
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

          {/* User Profile */}
          <button
            className="user-profile-btn"
            onClick={() => setIsSettingsOpen(true)}
            title="User Account"
          >
            <div className="user-avatar">
              {user.displayName.charAt(0)}
            </div>
            <span>{user.displayName.split(' ')[0]}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
