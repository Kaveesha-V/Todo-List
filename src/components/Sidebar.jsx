import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTodo } from '../context/TodoContext';
import { getLocalDateString } from '../utils/dateUtils';
import {
  Inbox,
  Calendar,
  CalendarDays,
  Tag,
  BarChart3,
  Search,
  Plus,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Users,
  Bell,
  PanelLeftClose,
  Sparkles,
  LayoutGrid,
  Hash,
  CheckCircle2,
  Settings,
  LogOut,
  FolderPlus,
  Trash2,
  X
} from 'lucide-react';

export const Sidebar = ({ isOpen, onToggle, onOpenSearch, onOpenAddModal }) => {
  const { currentUser, logout } = useAuth();
  const {
    activeNavTab,
    setActiveNavTab,
    tasks,
    projects,
    addProject,
    deleteProject,
    setIsSettingsOpen,
    setOnboardingOpen
  } = useTodo();

  const [projectsOpen, setProjectsOpen] = useState(true);
  const [showNewProjectInput, setShowNewProjectInput] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Calculate task counts
  const inboxCount = tasks.filter(t => !t.completed).length;
  const todayStr = getLocalDateString();
  const todayCount = tasks.filter(t => !t.completed && t.dueDate === todayStr).length;

  // Setup completion
  const hasTaskWithDate = tasks.some(t => t.dueDate || t.dueTime);
  const hasCalendarConnected = Boolean(currentUser?.calendarConnected);
  const hasCompleted3 = tasks.filter(t => t.completed).length >= 3;
  const completedSteps = [hasTaskWithDate, hasCalendarConnected, hasCompleted3].filter(Boolean).length;

  const handleAddProjectSubmit = (e) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      addProject(newProjectName.trim());
      setNewProjectName('');
      setShowNewProjectInput(false);
    }
  };

  return (
    <>
    <aside className={`todoist-sidebar ${isOpen ? 'open' : 'closed'}`}>
      {/* Top User Profile Header */}
      <div className="sidebar-user-header">
        <div
          className="sidebar-user-info"
          onClick={() => setUserDropdownOpen(!userDropdownOpen)}
        >
          <div className="sidebar-avatar">
            {currentUser?.photoURL ? (
              <img src={currentUser.photoURL} alt={currentUser.displayName} />
            ) : (
              <span>{(currentUser?.displayName || currentUser?.email || 'U')[0].toUpperCase()}</span>
            )}
          </div>
          <span className="sidebar-user-name" title={currentUser?.email}>
            {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User'}
          </span>
          <ChevronDown size={14} className="sidebar-user-chevron" />
        </div>

        <div className="sidebar-header-actions">
          <button
            type="button"
            className="sidebar-action-icon"
            onClick={() => setIsSettingsOpen(true)}
            title="Notifications & Settings"
          >
            <Bell size={16} />
          </button>
          <button
            type="button"
            className="sidebar-action-icon"
            onClick={onToggle}
            title="Toggle Sidebar"
          >
            <PanelLeftClose size={16} />
          </button>
        </div>

        {/* User Dropdown */}
        {userDropdownOpen && (
          <div className="sidebar-user-dropdown">
            <div className="dropdown-user-email">{currentUser?.email}</div>
            <button
              type="button"
              className="dropdown-item"
              onClick={() => { setOnboardingOpen(true); setUserDropdownOpen(false); }}
            >
              <Sparkles size={14} />
              <span>Restart Setup Guide</span>
            </button>
            <button
              type="button"
              className="dropdown-item"
              onClick={() => { setIsSettingsOpen(true); setUserDropdownOpen(false); }}
            >
              <HelpCircle size={14} />
              <span>Settings & Preferences</span>
            </button>
            <div className="dropdown-divider"></div>
            <button
              type="button"
              className="dropdown-item text-danger"
              onClick={() => { logout(); setUserDropdownOpen(false); }}
            >
              Log out
            </button>
          </div>
        )}
      </div>

      {/* Finish Your Setup Mini Banner (Screenshots 3, 4, 5) */}
      {completedSteps < 3 && (
        <div className="sidebar-setup-banner" onClick={() => setOnboardingOpen(true)}>
          <div className="sidebar-setup-top">
            <span>Finish your setup</span>
            <span className="setup-count">{completedSteps}/3 complete</span>
          </div>
          <div className="sidebar-setup-track">
            <div
              className="sidebar-setup-bar"
              style={{ width: `${(completedSteps / 3) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Primary Add Task Button */}
      <button
        type="button"
        className="sidebar-add-task-btn"
        onClick={() => {
          const inputEl = document.querySelector('.nlp-input-field');
          if (inputEl) {
            inputEl.focus();
            inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }}
      >
        <Plus size={18} />
        <span>Add task</span>
      </button>

      {/* Main Navigation Items */}
      <nav className="sidebar-nav-list">
        <button
          type="button"
          className={`sidebar-nav-item ${activeNavTab === 'inbox' ? 'active' : ''}`}
          onClick={() => setActiveNavTab('inbox')}
        >
          <Inbox size={18} className="nav-icon" />
          <span className="nav-label">Inbox</span>
          {inboxCount > 0 && <span className="nav-badge">{inboxCount}</span>}
        </button>

        <button
          type="button"
          className={`sidebar-nav-item ${activeNavTab === 'today' ? 'active' : ''}`}
          onClick={() => setActiveNavTab('today')}
        >
          <Calendar size={18} className="nav-icon today" />
          <span className="nav-label">Today</span>
          {todayCount > 0 && <span className="nav-badge today">{todayCount}</span>}
        </button>

        <button
          type="button"
          className={`sidebar-nav-item ${activeNavTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setActiveNavTab('upcoming')}
        >
          <CalendarDays size={18} className="nav-icon upcoming" />
          <span className="nav-label">Upcoming</span>
        </button>

        <button
          type="button"
          className={`sidebar-nav-item ${activeNavTab === 'filters' ? 'active' : ''}`}
          onClick={() => setActiveNavTab('filters')}
        >
          <Tag size={18} className="nav-icon filters" />
          <span className="nav-label">Filters & Labels</span>
        </button>

        <button
          type="button"
          className={`sidebar-nav-item ${activeNavTab === 'reporting' ? 'active' : ''}`}
          onClick={() => setActiveNavTab('reporting')}
        >
          <BarChart3 size={18} className="nav-icon reporting" />
          <span className="nav-label">Reporting & AI Digest</span>
        </button>

        <button
          type="button"
          className={`sidebar-nav-item ${activeNavTab === 'kanban' ? 'active' : ''}`}
          onClick={() => setActiveNavTab('kanban')}
        >
          <LayoutGrid size={18} className="nav-icon kanban" />
          <span className="nav-label">Kanban Board</span>
        </button>
      </nav>

      {/* My Projects Section */}
      <div className="sidebar-projects-section">
        <div
          className="sidebar-section-header"
          onClick={() => setProjectsOpen(!projectsOpen)}
        >
          <div className="section-title-group">
            {projectsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span>My Projects</span>
          </div>
          <button
            type="button"
            className="sidebar-add-project-icon"
            onClick={(e) => {
              e.stopPropagation();
              setShowNewProjectInput(true);
              setProjectsOpen(true);
            }}
            title="Add Project"
          >
            <Plus size={14} />
          </button>
        </div>

        {projectsOpen && (
          <div className="sidebar-projects-list">
            {showNewProjectInput && (
              <form onSubmit={handleAddProjectSubmit} className="new-project-inline-form">
                <input
                  type="text"
                  placeholder="Project name..."
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  autoFocus
                  className="new-project-inline-input"
                />
                <div className="new-project-inline-actions">
                  <button type="submit" className="new-proj-save-btn">Add</button>
                  <button
                    type="button"
                    className="new-proj-cancel-btn"
                    onClick={() => setShowNewProjectInput(false)}
                  >
                    ✕
                  </button>
                </div>
              </form>
            )}

            {projects.map((proj) => (
              <div
                key={proj.id}
                className={`sidebar-project-item ${activeNavTab === `project_${proj.id}` ? 'active' : ''}`}
                onClick={() => {
                  setActiveNavTab(`project_${proj.id}`);
                  if (window.innerWidth <= 768 && onToggle) onToggle();
                }}
              >
                <span className="project-color-dot" style={{ backgroundColor: proj.color || '#6366F1' }}></span>
                <span className="project-name">{proj.name}</span>
                <span className="project-count">
                  {tasks.filter(t => !t.completed && (t.projectId === proj.id || t.tags?.includes(proj.name.toLowerCase()))).length || ''}
                </span>
                <button
                  type="button"
                  className="project-remove-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteProject(proj.id);
                  }}
                  title={`Remove ${proj.name} project`}
                  aria-label={`Remove ${proj.name} project`}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Footer Actions */}
      <div className="sidebar-bottom-footer">
        <button
          type="button"
          className="sidebar-footer-btn"
          onClick={() => setOnboardingOpen(true)}
        >
          <Users size={16} />
          <span>Add a team</span>
        </button>
        <button
          type="button"
          className="sidebar-footer-btn"
          onClick={() => setIsSettingsOpen(true)}
        >
          <HelpCircle size={16} />
          <span>Help & resources</span>
        </button>
      </div>
    </aside>
    {isOpen && (
      <div className="sidebar-mobile-backdrop active" onClick={onToggle} />
    )}
    </>
  );
};
