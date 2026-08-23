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
  Menu,
  Shield
} from 'lucide-react';

export const Header = ({ onToggleSidebar, onToggleAISidebar }) => {
  const { currentUser, connectGoogleCalendar, isAdmin } = useAuth();
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
          <div className="brand-title-wrap">
            <h1 className="brand-title">
              Aura
            </h1>
            {isAdmin && (
              <span className="header-admin-badge" title="Authenticated as System Administrator">
                <Shield size={10} />
                <span>ADMIN</span>
              </span>
            )}
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

          {/* AI Prompting Workspace Button */}
          <button
            type="button"
            className="ai-workspace-header-btn"
            onClick={() => onToggleAISidebar && onToggleAISidebar()}
            title="Open AI Prompting & Workspace Assistant"
          >
            <Sparkles size={14} />
            <span>AI Workspace</span>
          </button>

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
