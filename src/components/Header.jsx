import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTodo } from '../context/TodoContext';
import { AccountMenu } from './AccountMenu';
import { LiveClock } from './LiveClock';
import {
  Sparkles,
  Sun,
  Moon,
  Settings,
  CheckCircle2,
  Calendar,
  LogIn,
  ChevronDown,
  Menu
} from 'lucide-react';

export const Header = ({ onToggleSidebar }) => {
  const { currentUser, connectGoogleCalendar } = useAuth();
  const { theme, toggleTheme, setIsSettingsOpen } = useTodo();

  return (
    <header className="app-header">
      <div className="header-inner">
        {/* Extreme Left: Sidebar Toggle & Brand */}
        <div className="brand-section">
          {onToggleSidebar && (
            <button
              type="button"
              className="header-sidebar-toggle-btn far-left-edge"
              onClick={onToggleSidebar}
              title="Toggle Sidebar Navigation"
              aria-label="Toggle Sidebar"
            >
              <Menu size={20} />
            </button>
          )}
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
          {/* Live Ongoing Clock Widget */}
          <LiveClock />

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
                title="Google Calendar Live Synced"
              >
                <Calendar size={13} />
                <span>G-Cal Linked</span>
              </div>
            ) : (
              <button
                type="button"
                className="gcal-connect-header-btn"
                onClick={() => connectGoogleCalendar && connectGoogleCalendar()}
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
        </div>
      </div>
    </header>
  );
};
