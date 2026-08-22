import React, { useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTodo } from '../context/TodoContext';
import {
  User,
  LogOut,
  Settings,
  Plus,
  Check,
  Calendar,
  Shield,
  Trash2
} from 'lucide-react';

export const AccountMenu = ({ isOpen, onClose }) => {
  const {
    currentUser,
    savedAccounts,
    switchAccount,
    logout,
    deleteAccount,
    setAuthModalOpen
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

  const handleSwitch = (uid) => {
    switchAccount(uid);
    onClose();
    addToast("Switched account", "info");
  };

  const handleAddAccount = () => {
    onClose();
    setAuthModalOpen(true);
  };

  const handleSignOut = () => {
    logout();
    onClose();
    addToast("Signed out", "info");
  };

  const handleDeleteAccount = (uid, e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this account and all its private tasks?")) {
      deleteAccount(uid);
      addToast("Account and data deleted", "info");
    }
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

      {/* Switch Account Section */}
      <div className="account-menu-section-label">SWITCH ACCOUNTS</div>

      <div className="saved-accounts-list">
        {savedAccounts.map((acc) => {
          const isActive = acc.uid === currentUser.uid;
          return (
            <div
              key={acc.uid}
              className={`saved-account-item ${isActive ? 'active' : ''}`}
              onClick={() => handleSwitch(acc.uid)}
            >
              <div className="user-avatar" style={{ width: '24px', height: '24px', fontSize: '0.7rem' }}>
                {acc.displayName.charAt(0)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {acc.displayName}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                  {acc.email}
                </div>
              </div>

              {isActive ? (
                <Check size={14} style={{ color: 'var(--accent)' }} />
              ) : (
                <button
                  type="button"
                  className="account-remove-mini-btn"
                  onClick={(e) => handleDeleteAccount(acc.uid, e)}
                  title="Remove account"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Another Account */}
      <button
        type="button"
        className="account-action-row-btn"
        onClick={handleAddAccount}
      >
        <Plus size={15} />
        <span>Add another account</span>
      </button>

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
        <span>Settings & Reminders</span>
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
