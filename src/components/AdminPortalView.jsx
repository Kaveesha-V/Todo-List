import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTodo } from '../context/TodoContext';
import {
  Shield,
  Users,
  UserPlus,
  Trash2,
  Lock,
  Unlock,
  Key,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Activity,
  Megaphone,
  Radio,
  RefreshCw,
  Eye,
  EyeOff,
  X,
  Plus,
  SlidersHorizontal,
  FileText,
  Sparkles,
  Smartphone,
  Monitor,
  UserCheck,
  UserX,
  Database
} from 'lucide-react';

export const AdminPortalView = () => {
  const {
    currentUser,
    savedAccounts,
    isAdmin,
    loginLogs,
    systemBroadcast,
    adminCreateUser,
    adminDeleteUser,
    adminToggleUserStatus,
    adminResetPassword,
    adminUpdateUserRole,
    adminPostBroadcast,
    adminClearBroadcast,
    adminClearLogs
  } = useAuth();

  const { addToast } = useTodo();

  // Active Admin Sub-Tab: 'users' | 'audit' | 'broadcast'
  const [activeTab, setActiveTab] = useState('users');

  // Search & Filter State for Users
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'admin' | 'user'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'suspended'

  // Search & Filter State for Audit Logs
  const [logSearch, setLogSearch] = useState('');
  const [logStatusFilter, setLogStatusFilter] = useState('all'); // 'all' | 'success' | 'failed' | 'blocked'

  // Modals state
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');
  const [createUserError, setCreateUserError] = useState('');

  // Password Reset Modal
  const [resetModalUser, setResetModalUser] = useState(null);
  const [newResetPassword, setNewResetPassword] = useState('');
  const [resetError, setResetError] = useState('');

  // Broadcast Form State
  const [broadcastMessage, setBroadcastMessage] = useState(systemBroadcast?.message || '');
  const [broadcastLevel, setBroadcastLevel] = useState(systemBroadcast?.level || 'info');

  // Guard: If not admin, do not render admin portal
  if (!isAdmin) {
    return (
      <div className="admin-unauthorized-card animate-fade-in">
        <Shield size={48} className="admin-lock-icon" />
        <h2>Access Denied</h2>
        <p>You do not have administrative privileges to access this portal.</p>
        <p className="admin-unauthorized-sub">Please log in using an authorized System Administrator account.</p>
      </div>
    );
  }

  // Aggregate stats across system
  const totalUsersCount = savedAccounts.length;
  const activeUsersCount = savedAccounts.filter(a => a.status !== 'suspended').length;
  const adminsCount = savedAccounts.filter(a => a.role === 'admin' || a.email === 'admin@aura.workspace').length;
  
  // Calculate users logged in today
  const todayStr = new Date().toISOString().split('T')[0];
  const loggedInTodayCount = savedAccounts.filter(a => a.lastLogin && a.lastLogin.startsWith(todayStr)).length;

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return savedAccounts.filter(user => {
      const q = userSearch.toLowerCase().trim();
      const matchesSearch = !q ||
        user.displayName?.toLowerCase().includes(q) ||
        user.email?.toLowerCase().includes(q);

      const isUserAdmin = user.role === 'admin' || user.email === 'admin@aura.workspace';
      const matchesRole = roleFilter === 'all' ||
        (roleFilter === 'admin' && isUserAdmin) ||
        (roleFilter === 'user' && !isUserAdmin);

      const userStatus = user.status || 'active';
      const matchesStatus = statusFilter === 'all' || userStatus === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [savedAccounts, userSearch, roleFilter, statusFilter]);

  // Filtered Logs List
  const filteredLogs = useMemo(() => {
    return loginLogs.filter(log => {
      const q = logSearch.toLowerCase().trim();
      const matchesSearch = !q ||
        log.email?.toLowerCase().includes(q) ||
        log.displayName?.toLowerCase().includes(q) ||
        log.action?.toLowerCase().includes(q) ||
        log.method?.toLowerCase().includes(q);

      const matchesStatus = logStatusFilter === 'all' || log.status === logStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [loginLogs, logSearch, logStatusFilter]);

  // Handler: Create User Submit
  const handleCreateUserSubmit = (e) => {
    e.preventDefault();
    setCreateUserError('');

    try {
      adminCreateUser({
        displayName: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole
      });

      addToast(`User "${newUserEmail}" created successfully (${newUserRole})! 🎉`, 'success');
      setCreateUserModalOpen(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('user');
    } catch (err) {
      setCreateUserError(err.message || "Failed to create user.");
    }
  };

  // Handler: Delete User
  const handleDeleteUser = (user) => {
    if (window.confirm(`Are you sure you want to permanently remove "${user.displayName || user.email}"? All their isolated task data will be wiped.`)) {
      try {
        adminDeleteUser(user.uid, user.email);
        addToast(`User "${user.email}" removed.`, 'info');
      } catch (err) {
        addToast(err.message, 'error');
      }
    }
  };

  // Handler: Toggle Status
  const handleToggleStatus = (user) => {
    try {
      const updated = adminToggleUserStatus(user.uid);
      addToast(`User status changed to ${updated.status}.`, 'info');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  // Handler: Reset Password
  const handleResetPasswordSubmit = (e) => {
    e.preventDefault();
    setResetError('');

    try {
      adminResetPassword(resetModalUser.uid, newResetPassword);
      addToast(`Password updated for "${resetModalUser.email}".`, 'success');
      setResetModalUser(null);
      setNewResetPassword('');
    } catch (err) {
      setResetError(err.message || "Failed to update password.");
    }
  };

  // Handler: Toggle Role
  const handleToggleRole = (user) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    try {
      adminUpdateUserRole(user.uid, newRole);
      addToast(`Role for "${user.email}" updated to ${newRole.toUpperCase()}.`, 'success');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  // Handler: Broadcast Form Submit
  const handleBroadcastSubmit = (e) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) {
      adminClearBroadcast();
      addToast("System broadcast cleared.", "info");
      return;
    }

    adminPostBroadcast(broadcastMessage.trim(), broadcastLevel);
    addToast("Global system broadcast published to all users! 📢", "success");
  };

  return (
    <div className="admin-portal-container animate-fade-in">
      {/* Top Header Banner */}
      <div className="admin-top-header">
        <div className="admin-title-group">
          <div className="admin-shield-badge">
            <Shield size={24} />
          </div>
          <div>
            <div className="admin-header-badge-row">
              <h1 className="admin-main-title">Admin Command Center</h1>
              <span className="admin-role-pill">Super Admin</span>
            </div>
            <p className="admin-subtitle">
              User lifecycle oversight, member management & real-time login audit logging
            </p>
          </div>
        </div>

        <div className="admin-top-actions">
          <button
            type="button"
            className="admin-primary-btn"
            onClick={() => setCreateUserModalOpen(true)}
            title="Create New User"
          >
            <UserPlus size={16} />
            <span>Create User</span>
          </button>
        </div>
      </div>

      {/* Top KPI Summary Metrics Grid */}
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card">
          <div className="admin-kpi-icon blue">
            <Users size={20} />
          </div>
          <div className="admin-kpi-content">
            <span className="admin-kpi-label">Registered Members</span>
            <span className="admin-kpi-value">{totalUsersCount}</span>
            <span className="admin-kpi-sub">{adminsCount} Administrators</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-icon green">
            <Activity size={20} />
          </div>
          <div className="admin-kpi-content">
            <span className="admin-kpi-label">Active Users</span>
            <span className="admin-kpi-value">{activeUsersCount}</span>
            <span className="admin-kpi-sub">{totalUsersCount - activeUsersCount} Suspended</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-icon purple">
            <Clock size={20} />
          </div>
          <div className="admin-kpi-content">
            <span className="admin-kpi-label">Active Today</span>
            <span className="admin-kpi-value">{loggedInTodayCount}</span>
            <span className="admin-kpi-sub">Login Sessions</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-icon amber">
            <Database size={20} />
          </div>
          <div className="admin-kpi-content">
            <span className="admin-kpi-label">Data Isolation</span>
            <span className="admin-kpi-value">Active</span>
            <span className="admin-kpi-sub">Encrypted & Isolated</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Sub-Tabs */}
      <div className="admin-subtabs-bar">
        <div className="admin-subtabs-group">
          <button
            type="button"
            className={`admin-subtab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={16} />
            <span>User Management</span>
            <span className="admin-tab-count">{savedAccounts.length}</span>
          </button>

          <button
            type="button"
            className={`admin-subtab-btn ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit')}
          >
            <Activity size={16} />
            <span>Login Oversight & Audit Logs</span>
            <span className="admin-tab-count">{loginLogs.length}</span>
          </button>

          <button
            type="button"
            className={`admin-subtab-btn ${activeTab === 'broadcast' ? 'active' : ''}`}
            onClick={() => setActiveTab('broadcast')}
          >
            <Megaphone size={16} />
            <span>System Broadcast</span>
            {systemBroadcast && <span className="admin-broadcast-live-dot"></span>}
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: USER MANAGEMENT
          ========================================================================= */}
      {activeTab === 'users' && (
        <div className="admin-tab-pane animate-fade-in">
          {/* Filter & Search Toolbar */}
          <div className="admin-toolbar-row">
            <div className="admin-search-wrapper">
              <Search size={15} />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="admin-search-input"
              />
              {userSearch && (
                <button type="button" onClick={() => setUserSearch('')} className="admin-clear-search">
                  ✕
                </button>
              )}
            </div>

            <div className="admin-filters-group">
              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="admin-select-filter"
                title="Filter by role"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admins Only</option>
                <option value="user">Standard Users</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="admin-select-filter"
                title="Filter by status"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="admin-table-wrapper">
            <table className="admin-users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Provider</th>
                  <th>Last Login</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '36px 12px', color: 'var(--text-tertiary)' }}>
                      No users match the search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const isRootAdmin = user.email.toLowerCase() === 'admin@aura.workspace';
                    const isUserAdmin = user.role === 'admin' || isRootAdmin;
                    const isSuspended = user.status === 'suspended';

                    return (
                      <tr key={user.uid} className={isSuspended ? 'row-suspended' : ''}>
                        {/* User Profile */}
                        <td>
                          <div className="user-cell-profile">
                            <div className="user-cell-avatar">
                              {user.photoURL ? (
                                <img src={user.photoURL} alt={user.displayName} />
                              ) : (
                                <span>{(user.displayName || user.email || 'U')[0].toUpperCase()}</span>
                              )}
                            </div>
                            <div className="user-cell-names">
                              <span className="user-cell-name">{user.displayName || 'User'}</span>
                              <span className="user-cell-email">{user.email}</span>
                            </div>
                          </div>
                        </td>

                        {/* Role Badge */}
                        <td>
                          <span className={`admin-badge-pill role ${isUserAdmin ? 'admin' : 'user'}`}>
                            {isUserAdmin ? <Shield size={11} /> : <Users size={11} />}
                            <span>{isUserAdmin ? 'Admin' : 'Member'}</span>
                          </span>
                        </td>

                        {/* Status Badge */}
                        <td>
                          <span className={`admin-badge-pill status ${isSuspended ? 'suspended' : 'active'}`}>
                            <span className="status-dot"></span>
                            <span>{isSuspended ? 'Suspended' : 'Active'}</span>
                          </span>
                        </td>

                        {/* Provider */}
                        <td>
                          <span className="admin-provider-tag">
                            {user.provider === 'google' ? 'Google' : 'Email/PW'}
                          </span>
                        </td>

                        {/* Last Login */}
                        <td>
                          <span className="admin-timestamp-cell">
                            {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'Never'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td>
                          <div className="admin-actions-cell">
                            {/* Toggle Role Button */}
                            {!isRootAdmin && (
                              <button
                                type="button"
                                className="admin-action-btn role-toggle"
                                onClick={() => handleToggleRole(user)}
                                title={isUserAdmin ? "Demote to Member" : "Promote to Admin"}
                              >
                                <Shield size={14} />
                              </button>
                            )}

                            {/* Reset Password Button */}
                            <button
                              type="button"
                              className="admin-action-btn"
                              onClick={() => {
                                setResetModalUser(user);
                                setNewResetPassword('');
                                setResetError('');
                              }}
                              title="Reset Password"
                            >
                              <Key size={14} />
                            </button>

                            {/* Suspend / Activate Button */}
                            {!isRootAdmin && (
                              <button
                                type="button"
                                className={`admin-action-btn ${isSuspended ? 'activate' : 'suspend'}`}
                                onClick={() => handleToggleStatus(user)}
                                title={isSuspended ? "Activate User Account" : "Suspend User Account"}
                              >
                                {isSuspended ? <Unlock size={14} /> : <Lock size={14} />}
                              </button>
                            )}

                            {/* Delete User Button */}
                            {!isRootAdmin && (
                              <button
                                type="button"
                                className="admin-action-btn delete"
                                onClick={() => handleDeleteUser(user)}
                                title="Permanently Delete User"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: LOGIN OVERSIGHT & SECURITY AUDIT TRAIL
          ========================================================================= */}
      {activeTab === 'audit' && (
        <div className="admin-tab-pane animate-fade-in">
          {/* Filter & Clear Controls */}
          <div className="admin-toolbar-row">
            <div className="admin-search-wrapper">
              <Search size={15} />
              <input
                type="text"
                placeholder="Search login events, user emails, or actions..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="admin-search-input"
              />
              {logSearch && (
                <button type="button" onClick={() => setLogSearch('')} className="admin-clear-search">
                  ✕
                </button>
              )}
            </div>

            <div className="admin-filters-group">
              <select
                value={logStatusFilter}
                onChange={(e) => setLogStatusFilter(e.target.value)}
                className="admin-select-filter"
                title="Filter by event status"
              >
                <option value="all">All Events</option>
                <option value="success">Successful Logins</option>
                <option value="failed">Failed Attempts</option>
                <option value="blocked">Blocked Access</option>
              </select>

              <button
                type="button"
                className="admin-clear-logs-btn"
                onClick={() => {
                  if (window.confirm("Clear all security audit logs?")) {
                    adminClearLogs();
                    addToast("Audit logs cleared.", "info");
                  }
                }}
                title="Clear audit logs"
              >
                Clear History
              </button>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="admin-table-wrapper">
            <table className="admin-audit-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Member</th>
                  <th>Event / Action</th>
                  <th>Auth Method</th>
                  <th>Client / Device</th>
                  <th>Status</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '36px 12px', color: 'var(--text-tertiary)' }}>
                      No audit events found.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id}>
                      {/* Timestamp */}
                      <td>
                        <span className="admin-timestamp-cell">
                          {new Date(log.timestamp).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </span>
                      </td>

                      {/* Member */}
                      <td>
                        <div className="admin-log-user">
                          <span className="log-user-name">{log.displayName}</span>
                          <span className="log-user-email">{log.email}</span>
                        </div>
                      </td>

                      {/* Action */}
                      <td>
                        <span className="admin-log-action">{log.action}</span>
                      </td>

                      {/* Method */}
                      <td>
                        <span className="admin-provider-tag">{log.method}</span>
                      </td>

                      {/* Device */}
                      <td>
                        <span className="admin-device-tag">
                          {log.device?.includes('Mobile') ? <Smartphone size={12} /> : <Monitor size={12} />}
                          <span>{log.device}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`admin-badge-pill status ${log.status === 'success' ? 'active' : log.status === 'failed' ? 'suspended' : 'warning'}`}>
                          {log.status === 'success' ? 'Success' : log.status === 'failed' ? 'Failed' : 'Blocked'}
                        </span>
                      </td>

                      {/* Details */}
                      <td>
                        <span className="admin-log-details" title={log.details}>
                          {log.details || '—'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: SYSTEM BROADCAST & ANNOUNCEMENTS
          ========================================================================= */}
      {activeTab === 'broadcast' && (
        <div className="admin-tab-pane animate-fade-in">
          <div className="admin-broadcast-card">
            <div className="broadcast-card-header">
              <div className="broadcast-icon-wrap">
                <Megaphone size={22} />
              </div>
              <div>
                <h3 className="broadcast-card-title">Global System Announcement</h3>
                <p className="broadcast-card-desc">
                  Post a prominent message across all user workspaces (e.g. maintenance alerts, release notes, system news).
                </p>
              </div>
            </div>

            {/* Current Active Broadcast Preview */}
            {systemBroadcast && (
              <div className={`admin-active-broadcast-preview ${systemBroadcast.level}`}>
                <div className="preview-top-row">
                  <div className="preview-status-group">
                    <span className="preview-pulse-dot"></span>
                    <strong>Currently Live Banner ({systemBroadcast.level.toUpperCase()})</strong>
                  </div>
                  <button
                    type="button"
                    className="preview-dismiss-btn"
                    onClick={() => {
                      adminClearBroadcast();
                      setBroadcastMessage('');
                      addToast("Announcement dismissed.", "info");
                    }}
                  >
                    Remove Live Banner
                  </button>
                </div>
                <p className="preview-message">{systemBroadcast.message}</p>
                <div className="preview-meta">
                  Posted by {systemBroadcast.author} • {new Date(systemBroadcast.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            )}

            {/* Form to Publish Announcement */}
            <form onSubmit={handleBroadcastSubmit} className="admin-broadcast-form">
              <div className="broadcast-form-field">
                <label className="broadcast-label">Broadcast Message:</label>
                <textarea
                  className="broadcast-textarea"
                  placeholder="Enter message to broadcast to all members (e.g. '🛠️ Scheduled system maintenance tonight at 11:00 PM UTC')..."
                  rows={4}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  required
                />
              </div>

              <div className="broadcast-controls-row">
                <div className="broadcast-level-selector">
                  <label className="broadcast-label">Banner Style:</label>
                  <div className="level-buttons-group">
                    <button
                      type="button"
                      className={`level-btn info ${broadcastLevel === 'info' ? 'active' : ''}`}
                      onClick={() => setBroadcastLevel('info')}
                    >
                      Info (Indigo)
                    </button>
                    <button
                      type="button"
                      className={`level-btn warning ${broadcastLevel === 'warning' ? 'active' : ''}`}
                      onClick={() => setBroadcastLevel('warning')}
                    >
                      Notice (Amber)
                    </button>
                    <button
                      type="button"
                      className={`level-btn critical ${broadcastLevel === 'critical' ? 'active' : ''}`}
                      onClick={() => setBroadcastLevel('critical')}
                    >
                      Urgent (Red)
                    </button>
                  </div>
                </div>

                <div className="broadcast-actions-group">
                  {systemBroadcast && (
                    <button
                      type="button"
                      className="admin-secondary-btn"
                      onClick={() => {
                        adminClearBroadcast();
                        setBroadcastMessage('');
                      }}
                    >
                      Clear
                    </button>
                  )}
                  <button type="submit" className="admin-primary-btn">
                    <Megaphone size={15} />
                    <span>Publish Announcement</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CREATE NEW USER
          ========================================================================= */}
      {createUserModalOpen && (
        <div className="modal-backdrop" onClick={() => setCreateUserModalOpen(false)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="admin-modal-title-group">
                <UserPlus size={20} className="admin-modal-icon" />
                <h3>Create New User Account</h3>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setCreateUserModalOpen(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {createUserError && (
              <div className="admin-modal-error">
                <AlertCircle size={15} />
                <span>{createUserError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUserSubmit} className="admin-modal-form">
              <div className="admin-form-group">
                <label className="admin-form-label">Full Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Sarah Connor"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="admin-form-input"
                  required
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Email Address:</label>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="admin-form-input"
                  required
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Initial Password:</label>
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="admin-form-input"
                  required
                  minLength={6}
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Account Role:</label>
                <div className="admin-role-choice-grid">
                  <div
                    className={`admin-role-box ${newUserRole === 'user' ? 'active' : ''}`}
                    onClick={() => setNewUserRole('user')}
                  >
                    <Users size={18} />
                    <div className="role-box-title">Standard Member</div>
                    <div className="role-box-desc">Standard to-do workspace & isolated tasks</div>
                  </div>

                  <div
                    className={`admin-role-box ${newUserRole === 'admin' ? 'active' : ''}`}
                    onClick={() => setNewUserRole('admin')}
                  >
                    <Shield size={18} />
                    <div className="role-box-title">Administrator</div>
                    <div className="role-box-desc">Full user management & audit access</div>
                  </div>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-secondary-btn"
                  onClick={() => setCreateUserModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="admin-primary-btn">
                  <UserPlus size={15} />
                  <span>Create Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: RESET PASSWORD
          ========================================================================= */}
      {resetModalUser && (
        <div className="modal-backdrop" onClick={() => setResetModalUser(null)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="admin-modal-title-group">
                <Key size={20} className="admin-modal-icon" />
                <h3>Reset User Password</h3>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setResetModalUser(null)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Set a new password for <strong>{resetModalUser.displayName}</strong> ({resetModalUser.email}).
            </p>

            {resetError && (
              <div className="admin-modal-error">
                <AlertCircle size={15} />
                <span>{resetError}</span>
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit} className="admin-modal-form">
              <div className="admin-form-group">
                <label className="admin-form-label">New Password:</label>
                <input
                  type="password"
                  placeholder="Enter at least 6 characters"
                  value={newResetPassword}
                  onChange={(e) => setNewResetPassword(e.target.value)}
                  className="admin-form-input"
                  required
                  minLength={6}
                  autoFocus
                />
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-secondary-btn"
                  onClick={() => setResetModalUser(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="admin-primary-btn">
                  <Key size={15} />
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
