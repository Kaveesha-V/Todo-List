import React, { useState } from 'react';
import { useTodo } from '../context/TodoContext';
import { useAuth } from '../context/AuthContext';
import {
  CheckCircle2,
  Circle,
  Calendar,
  Sparkles,
  ChevronRight,
  X,
  Plus
} from 'lucide-react';

export const SetupChecklistWidget = () => {
  const { tasks, setIsSettingsOpen } = useTodo();
  const { currentUser, loginWithGoogle } = useAuth();
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  // Step 1: Check if user has at least 1 task with a due date
  const hasTaskWithDate = tasks.some(t => t.dueDate || t.dueTime);

  // Step 2: Check if Google Calendar is connected or user has used natural language
  const hasCalendarConnected = Boolean(currentUser?.calendarConnected);

  // Step 3: Check if user has completed at least 3 tasks
  const completedCount = tasks.filter(t => t.completed).length;
  const hasCompleted3 = completedCount >= 3;

  const completedSteps = [hasTaskWithDate, hasCalendarConnected, hasCompleted3].filter(Boolean).length;
  const progressPercent = (completedSteps / 3) * 100;

  return (
    <div className="setup-checklist-card">
      {/* Close button */}
      <button
        type="button"
        className="setup-widget-close"
        onClick={() => setIsDismissed(true)}
        aria-label="Dismiss setup guide"
      >
        <X size={15} />
      </button>

      {/* Decorative Icon */}
      <div className="setup-illustration-banner">
        <div className="setup-calendar-icon-glow">
          <Calendar size={32} className="setup-calendar-icon" />
          <span className="setup-sparkle-badge">✨</span>
        </div>
      </div>

      {/* Title & Subtitle */}
      <h3 className="setup-card-title">Finish your setup</h3>
      <p className="setup-card-subtitle">Three quick steps to get the most out of Aura:</p>

      {/* Progress Bar */}
      <div className="setup-progress-wrapper">
        <div className="setup-progress-bar">
          <div
            className="setup-progress-fill"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
        <span className="setup-progress-text">{completedSteps}/3</span>
      </div>

      {/* Steps List */}
      <div className="setup-steps-list">
        {/* Step 1 */}
        <div
          className={`setup-step-item ${hasTaskWithDate ? 'done' : ''}`}
          onClick={() => {
            const inputEl = document.querySelector('.nlp-input-field');
            if (inputEl) {
              inputEl.focus();
              inputEl.value = "Review project milestone tomorrow at 4pm #work !high";
            }
          }}
        >
          <div className="setup-step-check">
            {hasTaskWithDate ? (
              <CheckCircle2 size={18} color="#10B981" />
            ) : (
              <Circle size={18} color="var(--text-muted)" />
            )}
          </div>
          <div className="setup-step-info">
            <span className="setup-step-title">Add 1 task with a date and time</span>
            <span className="setup-step-desc">Never miss a deadline</span>
          </div>
          <ChevronRight size={14} className="setup-step-chevron" />
        </div>

        {/* Step 2 */}
        <div
          className={`setup-step-item ${hasCalendarConnected ? 'done' : ''}`}
          onClick={async () => {
            if (!hasCalendarConnected) {
              try {
                await loginWithGoogle();
              } catch (e) {
                setIsSettingsOpen(true);
              }
            }
          }}
        >
          <div className="setup-step-check">
            {hasCalendarConnected ? (
              <CheckCircle2 size={18} color="#10B981" />
            ) : (
              <Circle size={18} color="var(--text-muted)" />
            )}
          </div>
          <div className="setup-step-info">
            <span className="setup-step-title">Connect Google Calendar</span>
            <span className="setup-step-desc">{hasCalendarConnected ? 'Connected & Synced' : 'Sync tasks & events'}</span>
          </div>
          <ChevronRight size={14} className="setup-step-chevron" />
        </div>

        {/* Step 3 */}
        <div className={`setup-step-item ${hasCompleted3 ? 'done' : ''}`}>
          <div className="setup-step-check">
            {hasCompleted3 ? (
              <CheckCircle2 size={18} color="#10B981" />
            ) : (
              <Circle size={18} color="var(--text-muted)" />
            )}
          </div>
          <div className="setup-step-info">
            <span className="setup-step-title">Complete 3 tasks</span>
            <span className="setup-step-desc">{completedCount} of 3 completed</span>
          </div>
          <ChevronRight size={14} className="setup-step-chevron" />
        </div>
      </div>

      {/* Footer Action */}
      <div className="setup-card-footer">
        <button
          type="button"
          className="setup-check-later-btn"
          onClick={() => setIsDismissed(true)}
        >
          I'll check later
        </button>
      </div>
    </div>
  );
};
