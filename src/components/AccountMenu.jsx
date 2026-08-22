import React, { useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTodo } from '../context/TodoContext';
import {
  User,
  LogOut,
  Settings,
  Calendar,
  Shield,
  Trash2
} from 'lucide-react';

export const AccountMenu = ({ isOpen, onClose }) => {
  const {
    currentUser,
    logout,
    deleteAccount
  } = useAuth();

  const { setIsSettingsOpen, addToast } = useTodo();
  const menuRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) && !e.target.closest('.user-profile-btn')) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen, onClose]);

  if (!isOpen || !currentUser) return null;

  const handleSignOut = () => {
    logout();
    onClose();
    addToast("Signed out successfully", "info");
  };

  return (
    <div className="account-dropdown-card" ref={menuRef}>
      {/* Current User Header */}
      <div className="account-menu-header">
        <div className="user-avatar" style={{ width: '38px', height: '38px', fontSize: '1rem' }}>
          {currentUser.displayName.charAt(0)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="account-name-text">{currentUser.displayName}</div>
          <div className="account-email-text">{currentUser.email}</div>
        </div>
      </div>

      {currentUser.calendarConnected && (
        <div className="account-gcal-badge-row">
          <Calendar size={12} style={{ color: 'var(--gcal-blue)' }} />
          <span>Google Calendar Synced</span>
        </div>
      )}

      <div className="account-menu-divider" />

      {/* Settings Shortcut */}
      <button
        type="button"
        className="account-action-row-btn"
        onClick={() => {
          onClose();
          setIsSettingsOpen(true);
        }}
      >
        <Settings size={15} />
        <span>Settings & Preferences</span>
      </button>

      {/* Sign Out */}
      <button
        type="button"
        className="account-action-row-btn sign-out"
        onClick={handleSignOut}
      >
        <LogOut size={15} />
        <span>Sign out</span>
      </button>
    </div>
  );
};
