import React from 'react';
import { useTodo } from '../context/TodoContext';
import {
  X,
  Bell,
  Calendar,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
  Download
} from 'lucide-react';

export const SettingsModal = () => {
  const {
    isSettingsOpen,
    setIsSettingsOpen,
    user,
    setUser,
    resetDemoData,
    addToast,
    tasks
  } = useTodo();

  if (!isSettingsOpen) return null;

  const handleToggleNotifications = () => {
    const nextVal = !user.notificationPermission;
    setUser(prev => ({ ...prev, notificationPermission: nextVal }));
    if (nextVal) {
      if ('Notification' in window && Notification.permission !== 'granted') {
        Notification.requestPermission();
      }
      addToast("Push notifications enabled", "success");
    } else {
      addToast("Notifications disabled", "info");
    }
  };

  const handleToggleCalendar = () => {
    const nextVal = !user.calendarConnected;
    setUser(prev => ({
      ...prev,
      calendarConnected: nextVal,
      lastCalendarSync: nextVal ? "Just now" : null
    }));
    addToast(nextVal ? "Connected to Google Calendar" : "Disconnected Google Calendar", nextVal ? "success" : "info");
  };

  const handleToggleOffset = (offsetMinutes) => {
    const current = user.reminderOffsets || [];
    const next = current.includes(offsetMinutes)
      ? current.filter(o => o !== offsetMinutes)
      : [...current, offsetMinutes];
    setUser(prev => ({ ...prev, reminderOffsets: next }));
  };

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tasks, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `aura_tasks_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast("Tasks exported to JSON", "success");
  };

  return (
    <div className="modal-backdrop" onClick={() => setIsSettingsOpen(false)} role="dialog" aria-modal="true">
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Settings & Reminders</h2>
          <button
            className="header-icon-btn"
            onClick={() => setIsSettingsOpen(false)}
            aria-label="Close Settings"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* 1. Google Calendar Integration Card */}
          <div className="setting-card-block">
            <div className="setting-card-title">
              <Calendar size={16} style={{ color: 'var(--gcal-blue)' }} />
              <span>Google Calendar Integration</span>
            </div>
            <p className="setting-card-desc">
              Synchronize tasks with due dates directly to your Google Calendar.
            </p>

            <div className="gcal-account-card">
              <div className="gcal-acc-left">
                <div className="user-avatar" style={{ width: '32px', height: '32px' }}>
                  {user.displayName.charAt(0)}
                </div>
                <div>
                  <div className="gcal-user-email">{user.email}</div>
                  <div className="gcal-sync-state">
                    {user.calendarConnected ? (
                      <>
                        <CheckCircle2 size={12} />
                        <span>Connected • Synced {user.lastCalendarSync}</span>
                      </>
                    ) : (
                      <span style={{ color: 'var(--text-tertiary)' }}>Disconnected</span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="gcal-sync-btn"
                onClick={handleToggleCalendar}
              >
                {user.calendarConnected ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          </div>

          {/* 2. Push Notifications & Reminders */}
          <div className="setting-card-block">
            <div className="setting-card-title">
              <Bell size={16} style={{ color: 'var(--accent)' }} />
              <span>Smart Reminders & Push Notifications</span>
            </div>
            <p className="setting-card-desc">
              Receive browser notifications for tasks approaching their due date/time.
            </p>

            {/* Toggle Push Notifications */}
            <div className="toggle-switch-row">
              <div>
                <div className="switch-label">Enable Push Notifications</div>
                <div className="switch-subtext">Desktop alerts for upcoming deadlines</div>
              </div>
              <div
                className={`switch-control ${user.notificationPermission ? 'checked' : ''}`}
                onClick={handleToggleNotifications}
                role="switch"
                aria-checked={user.notificationPermission}
                tabIndex={0}
              >
                <div className="switch-knob"></div>
              </div>
            </div>

            {/* Reminder Offsets */}
            <div style={{ marginTop: '16px' }}>
              <div className="switch-label" style={{ marginBottom: '4px' }}>
                Default Reminder Timing:
              </div>
              <div className="reminder-offsets-selector">
                {[
                  { label: '10 min before', val: 10 },
                  { label: '1 hour before', val: 60 },
                  { label: '1 day before', val: 1440 }
                ].map(offset => {
                  const isChecked = user.reminderOffsets?.includes(offset.val);
                  return (
                    <button
                      key={offset.val}
                      type="button"
                      className={`offset-pill-btn ${isChecked ? 'active' : ''}`}
                      onClick={() => handleToggleOffset(offset.val)}
                    >
                      {offset.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. Security & Cloud Data Isolation */}
          <div className="setting-card-block">
            <div className="setting-card-title">
              <ShieldCheck size={16} style={{ color: '#10B981' }} />
              <span>Multi-User Security & Isolation</span>
            </div>
            <p className="setting-card-desc" style={{ marginBottom: '8px' }}>
              Tasks are protected with strict Firestore user isolation rules. All data is scoped to your secure user identifier (`{user.uid}`).
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="digest-chip-btn"
                onClick={handleExportData}
              >
                <Download size={13} />
                <span>Export Backup (JSON)</span>
              </button>

              <button
                type="button"
                className="digest-chip-btn"
                style={{ color: 'var(--priority-med)' }}
                onClick={resetDemoData}
              >
                <RotateCcw size={13} />
                <span>Reset Demo Tasks</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
