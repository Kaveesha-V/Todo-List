import React, { useState } from 'react';
import { useTodo } from '../context/TodoContext';
import { useAuth } from '../context/AuthContext';
import {
  formatCalendarEventTime,
  toInputDateTimeString,
  quickDateOffset
} from '../utils/dateUtils';
import {
  X,
  Sparkles,
  Calendar,
  Clock,
  CheckSquare,
  Plus,
  Trash2,
  ExternalLink,
  Check,
  Tag,
  Bell
} from 'lucide-react';

export const TaskDetailPanel = () => {
  const { currentUser } = useAuth();
  const {
    activeTask,
    setActiveTask,
    updateTask,
    deleteTask,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    generateAISubtasks,
    syncTaskToGoogleCalendar,
    projects
  } = useTodo();

  const [newSubtaskInput, setNewSubtaskInput] = useState('');
  const [newTagInput, setNewTagInput] = useState('');

  if (!activeTask) return null;

  const handleClose = () => {
    setActiveTask(null);
  };

  const handleAddSubtaskSubmit = (e) => {
    e.preventDefault();
    if (!newSubtaskInput.trim()) return;
    addSubtask(activeTask.id, newSubtaskInput);
    setNewSubtaskInput('');
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && newTagInput.trim()) {
      e.preventDefault();
      const cleanTag = newTagInput.trim().replace('#', '').toLowerCase();
      if (!activeTask.tags.includes(cleanTag)) {
        updateTask(activeTask.id, { tags: [...activeTask.tags, cleanTag] });
      }
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    updateTask(activeTask.id, {
      tags: activeTask.tags.filter(t => t !== tagToRemove)
    });
  };

  const subtasks = activeTask.subtasks || [];
  const completedSubtasks = subtasks.filter(s => s.done).length;
  const progressPercent = subtasks.length > 0 ? Math.round((completedSubtasks / subtasks.length) * 100) : 0;

  return (
    <div className="drawer-backdrop" onClick={handleClose} role="dialog" aria-modal="true">
      <div className="task-detail-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="panel-header">
          {/* Status selector */}
          <div className="panel-status-pills">
            <button
              className={`status-pill-opt ${activeTask.status === 'todo' ? 'active' : ''}`}
              onClick={() => updateTask(activeTask.id, { status: 'todo' })}
            >
              To Do
            </button>
            <button
              className={`status-pill-opt ${activeTask.status === 'inprogress' ? 'active' : ''}`}
              onClick={() => updateTask(activeTask.id, { status: 'inprogress' })}
            >
              In Progress
            </button>
            <button
              className={`status-pill-opt ${activeTask.status === 'done' ? 'active' : ''}`}
              onClick={() => updateTask(activeTask.id, { status: 'done' })}
            >
              Done
            </button>
          </div>

          <button
            className="header-icon-btn"
            onClick={handleClose}
            aria-label="Close task details"
          >
            <X size={18} />
          </button>
        </div>

        {/* Panel Body */}
        <div className="panel-body">
          {/* Google Calendar Sync Banner */}
          {activeTask.googleEventId ? (
            <div className="gcal-sync-banner">
              <div className="gcal-info-left">
                <div className="gcal-icon-wrap">
                  <Calendar size={18} />
                </div>
                <div>
                  <div className="gcal-banner-title">Synced to Google Calendar</div>
                  <div className="gcal-banner-time">
                    {formatCalendarEventTime(activeTask.dueDate)}
                  </div>
                </div>
              </div>
              <button
                className="gcal-sync-btn"
                onClick={() => syncTaskToGoogleCalendar(activeTask.id)}
                title="Resync event details"
              >
                Sync Now
              </button>
            </div>
          ) : currentUser?.calendarConnected && activeTask.dueDate ? (
            <div className="gcal-sync-banner" style={{ background: 'var(--bg-surface-subtle)', borderColor: 'var(--border-subtle)' }}>
              <div className="gcal-info-left">
                <div className="gcal-icon-wrap" style={{ color: 'var(--text-secondary)' }}>
                  <Calendar size={18} />
                </div>
                <div>
                  <div className="gcal-banner-title">Google Calendar Ready</div>
                  <div className="gcal-banner-time" style={{ color: 'var(--text-tertiary)' }}>
                    Add to your personal calendar
                  </div>
                </div>
              </div>
              <button
                className="gcal-sync-btn"
                onClick={() => syncTaskToGoogleCalendar(activeTask.id)}
              >
                Sync Event
              </button>
            </div>
          ) : null}

          {/* Task Title */}
          <div>
            <div className="panel-section-title">Task Title</div>
            <input
              type="text"
              className="panel-title-input"
              value={activeTask.title}
              onChange={(e) => updateTask(activeTask.id, { title: e.target.value })}
              placeholder="Task Title"
            />
          </div>

          {/* Notes / Description */}
          <div>
            <div className="panel-section-title">Notes & Description</div>
            <textarea
              className="panel-notes-textarea"
              value={activeTask.description || ''}
              onChange={(e) => updateTask(activeTask.id, { description: e.target.value })}
              placeholder="Add details, notes, links, or context..."
            />
          </div>

          {/* Priority Selector */}
          <div>
            <div className="panel-section-title">Priority Level</div>
            <div className="priority-pill-selector">
              <button
                type="button"
                className={`priority-select-btn ${activeTask.priority === 'low' ? 'selected-low' : ''}`}
                onClick={() => updateTask(activeTask.id, { priority: 'low' })}
              >
                Low
              </button>
              <button
                type="button"
                className={`priority-select-btn ${activeTask.priority === 'medium' ? 'selected-medium' : ''}`}
                onClick={() => updateTask(activeTask.id, { priority: 'medium' })}
              >
                Medium
              </button>
              <button
                type="button"
                className={`priority-select-btn ${activeTask.priority === 'high' ? 'selected-high' : ''}`}
                onClick={() => updateTask(activeTask.id, { priority: 'high' })}
              >
                High
              </button>
            </div>
          </div>

          {/* Due Date & Time */}
          <div>
            <div className="panel-section-title">Due Date & Time</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input
                type="datetime-local"
                className="add-subtask-input"
                style={{ width: '100%', borderStyle: 'solid', padding: '10px 12px' }}
                value={toInputDateTimeString(activeTask.dueDate)}
                onChange={(e) => {
                  const val = e.target.value ? new Date(e.target.value).toISOString() : null;
                  updateTask(activeTask.id, { dueDate: val });
                }}
              />

              {/* Quick Preset Buttons */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="digest-chip-btn"
                  onClick={() => updateTask(activeTask.id, { dueDate: quickDateOffset(0, 17, 0) })}
                >
                  Today 5 PM
                </button>
                <button
                  type="button"
                  className="digest-chip-btn"
                  onClick={() => updateTask(activeTask.id, { dueDate: quickDateOffset(1, 10, 0) })}
                >
                  Tomorrow 10 AM
                </button>
                <button
                  type="button"
                  className="digest-chip-btn"
                  onClick={() => updateTask(activeTask.id, { dueDate: quickDateOffset(7, 10, 0) })}
                >
                  Next Week
                </button>
                {activeTask.dueDate && (
                  <button
                    type="button"
                    className="digest-chip-btn"
                    style={{ color: 'var(--priority-high)' }}
                    onClick={() => updateTask(activeTask.id, { dueDate: null, googleEventId: null })}
                  >
                    Clear Date
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Subtasks Checklist */}
          <div>
            <div className="subtasks-header-row">
              <div className="panel-section-title" style={{ margin: 0 }}>
                Subtasks ({completedSubtasks}/{subtasks.length})
              </div>

              {/* AI Breakdown Button */}
              <button
                type="button"
                className="ai-breakdown-btn"
                onClick={() => generateAISubtasks(activeTask.id)}
                title="Use AI to automatically break this task into subtasks"
              >
                <Sparkles size={12} />
                <span>Break down with AI</span>
              </button>
            </div>

            {/* Progress bar */}
            {subtasks.length > 0 && (
              <div style={{ height: '4px', background: 'var(--border-subtle)', borderRadius: '99px', overflow: 'hidden', marginBottom: '12px' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${progressPercent}%`,
                    background: 'linear-gradient(90deg, var(--accent) 0%, #10B981 100%)',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
            )}

            {/* Subtask Items */}
            <div className="subtask-list">
              {subtasks.map((subtask) => (
                <div
                  key={subtask.id}
                  className={`subtask-item ${subtask.done ? 'done' : ''}`}
                >
                  <button
                    type="button"
                    className={`custom-checkbox ${subtask.done ? 'checked' : ''}`}
                    style={{ width: '18px', height: '18px' }}
                    onClick={() => toggleSubtask(activeTask.id, subtask.id)}
                  >
                    {subtask.done && <Check size={11} strokeWidth={3} />}
                  </button>

                  <input
                    type="text"
                    className="subtask-text-input"
                    value={subtask.title}
                    onChange={(e) => {
                      const updated = subtasks.map(s => s.id === subtask.id ? { ...s, title: e.target.value } : s);
                      updateTask(activeTask.id, { subtasks: updated });
                    }}
                  />

                  <button
                    type="button"
                    className="subtask-delete-btn"
                    onClick={() => deleteSubtask(activeTask.id, subtask.id)}
                    title="Remove subtask"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Subtask Input */}
            <form onSubmit={handleAddSubtaskSubmit} className="add-subtask-row">
              <input
                type="text"
                className="add-subtask-input"
                value={newSubtaskInput}
                onChange={(e) => setNewSubtaskInput(e.target.value)}
                placeholder="+ Add a subtask checklist item..."
              />
              <button
                type="submit"
                className="header-icon-btn"
                style={{ width: '36px', height: '36px', background: 'var(--accent)', color: '#FFF' }}
                disabled={!newSubtaskInput.trim()}
              >
                <Plus size={16} />
              </button>
            </form>
          </div>

          {/* Tags & Categories */}
          <div>
            <div className="panel-section-title">Tags & Categories</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
              {activeTask.tags && activeTask.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="badge-item badge-tag"
                  style={{ background: 'var(--bg-surface-subtle)', border: '1px solid var(--border-subtle)', padding: '4px 10px' }}
                >
                  <Tag size={11} />
                  <span>#{tag}</span>
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    style={{ marginLeft: '4px', color: 'var(--text-tertiary)' }}
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              className="add-subtask-input"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Type a tag and press Enter (e.g. work, health, travel)..."
            />
          </div>

          {/* Reminder Offsets */}
          <div>
            <div className="panel-section-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Bell size={13} />
              <span>Reminder Notifications</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { label: '10m before', val: 10 },
                { label: '1h before', val: 60 },
                { label: '1d before', val: 1440 }
              ].map(offset => {
                const isSelected = activeTask.reminderOffsetsMinutes?.includes(offset.val);
                return (
                  <button
                    key={offset.val}
                    type="button"
                    className={`offset-pill-btn ${isSelected ? 'active' : ''}`}
                    onClick={() => {
                      const current = activeTask.reminderOffsetsMinutes || [];
                      const next = isSelected
                        ? current.filter(v => v !== offset.val)
                        : [...current, offset.val];
                      updateTask(activeTask.id, { reminderOffsetsMinutes: next });
                    }}
                  >
                    {offset.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="panel-footer">
          <button
            type="button"
            className="panel-delete-btn"
            onClick={() => deleteTask(activeTask.id)}
          >
            <Trash2 size={15} />
            <span>Delete Task</span>
          </button>

          <button
            type="button"
            className="nlp-submit-btn"
            onClick={handleClose}
          >
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
};
