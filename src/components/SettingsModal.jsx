import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTodo } from '../context/TodoContext';
import { playNotificationChime, stopNotificationAlarm } from '../services/liveAlarmService';
import { sendLiveTaskEmailAlert } from '../services/emailReminderService';
import {
  X,
  Bell,
  Calendar,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  Trash2,
  Download,
  User,
  LogOut,
  Volume2,
  Plus,
  Mail,
  Send
} from 'lucide-react';

export const SettingsModal = () => {
  const {
    currentUser,
    updateCalendarConnection,
    updateReminderOffsets,
    deleteAccount,
    logout
  } = useAuth();

  const {
    isSettingsOpen,
    setIsSettingsOpen,
    resetDemoData,
    addToast,
    tasks
  } = useTodo();

  const [customOffsetInput, setCustomOffsetInput] = useState('');
  const [isPlayingTestSound, setIsPlayingTestSound] = useState(false);

  if (!isSettingsOpen) return null;

  const handleToggleNotifications = () => {
    if (!currentUser) return;
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
    addToast("Notification settings updated", "success");
  };

  const handleToggleCalendar = () => {
    if (!currentUser) return;
    const nextVal = !currentUser.calendarConnected;
    updateCalendarConnection(nextVal);
    addToast(nextVal ? "Connected to Google Calendar" : "Disconnected Google Calendar", nextVal ? "success" : "info");
  };

  const handleToggleOffset = (offsetMinutes) => {
    if (!currentUser) return;
    const current = currentUser.reminderOffsets || [30];
    const next = current.includes(offsetMinutes)
      ? current.filter(o => o !== offsetMinutes)
      : [...current, offsetMinutes];
    updateReminderOffsets(next.length > 0 ? next : [0]);
    addToast("Reminder offset updated!", "success");
  };

  const handleAddCustomOffset = (e) => {
    e.preventDefault();
    const val = parseInt(customOffsetInput, 10);
    if (!isNaN(val) && val >= 0) {
      const current = currentUser?.reminderOffsets || [];
      if (!current.includes(val)) {
        updateReminderOffsets([...current, val]);
        addToast(`Added ${val} min reminder offset`, "success");
      }
      setCustomOffsetInput('');
    }
  };

  const handleTestSound = () => {
    if (isPlayingTestSound) {
      stopNotificationAlarm();
      setIsPlayingTestSound(false);
    } else {
      setIsPlayingTestSound(true);
      playNotificationChime('urgent');
      setTimeout(() => setIsPlayingTestSound(false), 7000);
    }
  };

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tasks, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `aura_tasks_${currentUser?.uid || 'backup'}_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast("Tasks exported to JSON", "success");
  };

  const handleDeleteMyAccount = () => {
    if (!currentUser) return;
    const confirmed = window.confirm(`Are you sure you want to permanently delete your account (${currentUser.email}) and wipe all private tasks? This cannot be undone.`);
    if (confirmed) {
      deleteAccount(currentUser.uid);
      setIsSettingsOpen(false);
      addToast("Account and data permanently deleted", "info");
    }
  };

  return (
    <div className="modal-backdrop" onClick={() => setIsSettingsOpen(false)} role="dialog" aria-modal="true">
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Settings & Preferences</h2>
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
          {/* 1. Active Account Profile Card */}
          {currentUser && (
            <div className="setting-card-block">
              <div className="setting-card-title">
                <User size={16} style={{ color: 'var(--accent)' }} />
                <span>Account Profile</span>
              </div>
              <div className="gcal-account-card" style={{ marginBottom: '10px' }}>
                <div className="gcal-acc-left">
                  <div className="user-avatar" style={{ width: '34px', height: '34px' }}>
                    {currentUser.displayName.charAt(0)}
                  </div>
                  <div>
                    <div className="gcal-user-email">{currentUser.displayName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{currentUser.email}</div>
                  </div>
                </div>

                <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>
                  Provider: {currentUser.provider}
                </div>
              </div>
            </div>
          )}

          {/* 2. Google Calendar Integration Card */}
          <div className="setting-card-block">
            <div className="setting-card-title">
              <Calendar size={16} style={{ color: 'var(--gcal-blue)' }} />
              <span>Google Calendar Integration</span>
            </div>
            <p className="setting-card-desc">
              Synchronize tasks with due dates directly into your personal Google Calendar account.
            </p>

            <div className="gcal-account-card">
              <div className="gcal-acc-left">
                <div className="user-avatar" style={{ width: '32px', height: '32px', background: 'var(--gcal-bg)', color: 'var(--gcal-blue)' }}>
                  <Calendar size={16} />
                </div>
                <div>
                  <div className="gcal-user-email">
                    {currentUser ? currentUser.email : "Not signed in"}
                  </div>
                  <div className="gcal-sync-state">
                    {currentUser?.calendarConnected ? (
                      <>
                        <CheckCircle2 size={12} />
                        <span>Connected • Synced {currentUser.lastCalendarSync || 'Just now'}</span>
                      </>
                    ) : (
                      <span style={{ color: 'var(--text-tertiary)' }}>Disconnected</span>
                    )}
                  </div>
                </div>
              </div>

              {currentUser && (
                <button
                  type="button"
                  className="gcal-sync-btn"
                  onClick={handleToggleCalendar}
                >
                  {currentUser.calendarConnected ? 'Disconnect' : 'Connect'}
                </button>
              )}
            </div>
          </div>

          {/* 3. Push Notifications & Reminders */}
          <div className="setting-card-block">
            <div className="setting-card-title">
              <Bell size={16} style={{ color: 'var(--accent)' }} />
              <span>Smart Reminders & Push Notifications</span>
            </div>
            <p className="setting-card-desc">
              Receive browser notifications for tasks approaching their scheduled due time.
            </p>

            {/* Toggle Push Notifications */}
            <div className="toggle-switch-row">
              <div>
                <div className="switch-label">Enable Push Notifications</div>
                <div className="switch-subtext">Desktop notifications for upcoming deadlines</div>
              </div>
              <div
                className={`switch-control checked`}
                onClick={handleToggleNotifications}
                role="switch"
                tabIndex={0}
              >
                <div className="switch-knob"></div>
              </div>
            </div>

            {/* Reminder Offsets */}
            <div style={{ marginTop: '16px' }}>
              <div className="switch-label" style={{ marginBottom: '8px' }}>
                Default Reminder Offsets (Multi-select):
              </div>
              <div className="reminder-offsets-selector">
                {[
                  { label: '⚡ At time (0m)', val: 0 },
                  { label: '5 min before', val: 5 },
                  { label: '10 min before', val: 10 },
                  { label: '15 min before', val: 15 },
                  { label: '30 min before', val: 30 },
                  { label: '1 hour before', val: 60 },
                  { label: '1 day before', val: 1440 }
                ].map(offset => {
                  const isChecked = currentUser?.reminderOffsets?.includes(offset.val);
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

              {/* Custom Offset Form & Sound Tester */}
              <div style={{ marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <form onSubmit={handleAddCustomOffset} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    placeholder="Custom mins..."
                    value={customOffsetInput}
                    onChange={(e) => setCustomOffsetInput(e.target.value)}
                    style={{
                      width: '120px',
                      padding: '5px 10px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      fontSize: '0.8rem'
                    }}
                  />
                  <button
                    type="submit"
                    className="offset-pill-btn active"
                    style={{ padding: '5px 10px' }}
                  >
                    <Plus size={13} />
                    <span>Add</span>
                  </button>
                </form>

                {/* Alarm Melody Tester */}
                <button
                  type="button"
                  className="digest-chip-btn"
                  onClick={handleTestSound}
                  style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Volume2 size={14} style={{ color: 'var(--primary)' }} />
                  <span>{isPlayingTestSound ? '⏹ Stop Melody' : '🎵 Test 8s Alarm Melody'}</span>
                </button>
              </div>

              {/* Live Email Inbox Reminders (New) */}
              <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px dashed var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={15} style={{ color: 'var(--primary)' }} />
                    <span className="switch-label">Live Email Inbox Reminders</span>
                  </div>
                  <span style={{ fontSize: '0.74rem', background: 'rgba(16, 185, 129, 0.12)', color: '#10B981', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                    🟢 Active for {currentUser?.email || 'Logged In Account'}
                  </span>
                </div>
                <p className="setting-card-desc" style={{ marginBottom: '10px' }}>
                  Live task notifications & 30-min heads-up alerts are dispatched directly to your logged-in email inbox.
                </p>

                <button
                  type="button"
                  className="digest-chip-btn"
                  onClick={async () => {
                    if (currentUser?.email) {
                      addToast("Sending test task reminder email...", "info");
                      await sendLiveTaskEmailAlert(currentUser.email, {
                        title: "Test Task Reminder",
                        dueDate: "Today",
                        dueTime: "Now",
                        priority: "high"
                      });
                      addToast(`📧 Test reminder email dispatched to ${currentUser.email}!`, "success");
                    }
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Send size={13} />
                  <span>Send Test Reminder Email to {currentUser?.email}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 4. Security, Backups & Account Deletion */}
          <div className="setting-card-block">
            <div className="setting-card-title">
              <ShieldCheck size={16} style={{ color: '#10B981' }} />
              <span>Data Privacy & Security Isolation</span>
            </div>
            <p className="setting-card-desc" style={{ marginBottom: '12px' }}>
              Your tasks are strictly isolated to your user ID (`{currentUser?.uid || 'guest'}`). No cross-account visibility.
            </p>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
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
                <span>Load Sample Tasks</span>
              </button>
            </div>

            {currentUser && (
              <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--priority-high)' }}>
                    Delete Account
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                    Permanently delete profile and wipe all tasks
                  </div>
                </div>

                <button
                  type="button"
                  className="panel-delete-btn"
                  style={{ fontSize: '0.8rem', padding: '4px 10px' }}
                  onClick={handleDeleteMyAccount}
                >
                  <Trash2 size={13} />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
