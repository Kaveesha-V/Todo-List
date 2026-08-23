import React, { useState } from 'react';
import { useTodo } from '../context/TodoContext';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Circle,
  Calendar,
  Sparkles,
  ChevronRight,
  X,
  Minus,
  Plus
} from 'lucide-react';

export const SetupChecklistWidget = () => {
  const { tasks, setIsSettingsOpen, setActiveNavTab, addToast, toggleTaskComplete } = useTodo();
  const { currentUser, loginWithGoogle } = useAuth();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMinimized, setIsMinimized] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);

  if (isDismissed) return null;

  // Step 1: Check if user has at least 1 task with a due date or time
  const hasTaskWithDate = tasks.some(t => t.dueDate || t.dueTime);

  // Step 2: Check if Google Calendar is connected
  const hasCalendarConnected = Boolean(currentUser?.calendarConnected);

  // Step 3: Check if user has completed at least 3 tasks (or at least 1 task in active workflow)
  const completedCount = tasks.filter(t => t.status === 'done').length;
  const hasCompleted3 = completedCount >= 3 || (completedCount >= 1 && tasks.length > 0);

  const completedSteps = [hasTaskWithDate, hasCalendarConnected, hasCompleted3].filter(Boolean).length;
  const progressPercent = (completedSteps / 3) * 100;

  const handleStep3Click = () => {
    if (!hasCompleted3) {
      // Find first uncompleted task and complete it, or switch to inbox
      const uncompletedTask = tasks.find(t => t.status !== 'done');
      if (uncompletedTask) {
        toggleTaskComplete(uncompletedTask.id);
        addToast(`Completed "${uncompletedTask.title}"! Finish your setup progress: ${Math.min(completedCount + 1, 3)}/3`, 'success');
      } else {
        setActiveNavTab('inbox');
        addToast("Add and complete a task to finish setup!", "info");
      }
    }
  };

  if (isMinimized) {
    return (
      <div
        className="setup-checklist-minimized-pill animate-fade-in"
        onClick={() => setIsMinimized(false)}
        title="Expand Finish your setup checklist"
      >
        <span className="minimized-sparkle">✨</span>
        <span className="minimized-title">Setup: {completedSteps}/3</span>
        <div className="minimized-bar-track">
          <div className="minimized-bar-fill" style={{ width: `${progressPercent}%` }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="setup-checklist-card animate-fade-in">
      {/* Top action buttons (Minimize / Dismiss) */}
      <div className="setup-widget-top-actions">
        <button
          type="button"
          className="setup-widget-action-btn setup-widget-min-btn"
          onClick={() => setIsMinimized(true)}
          title="Minimize setup guide"
          aria-label="Minimize"
        >
          <Minus size={14} />
        </button>
        <button
          type="button"
          className="setup-widget-action-btn setup-widget-close-btn"
          onClick={() => setIsDismissed(true)}
          title="Dismiss setup guide"
          aria-label="Dismiss setup guide"
        >
          <X size={14} />
        </button>
      </div>

      {/* Decorative Icon */}
      <div className="setup-illustration-banner">
        <div className="setup-calendar-icon-glow">
          <Calendar size={32} className="setup-calendar-icon" />
          <span className="setup-sparkle-badge">✨</span>
        </div>
      </div>

      {/* Title & Subtitle */}
      <h3 className="setup-card-title">
        {completedSteps === 3 ? "🎉 Setup Complete!" : "Finish your setup"}
      </h3>
      <p className="setup-card-subtitle">
        {completedSteps === 3
          ? "All three onboarding steps are completed. You're ready to master your productivity!"
          : "Three quick steps to get the most out of Aura:"}
      </p>

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
            const inputEl = document.querySelector('.nlp-text-input') || document.querySelector('input[type="text"]');
            if (inputEl) {
              inputEl.focus();
              inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
        <div
          className={`setup-step-item ${hasCompleted3 ? 'done' : ''}`}
          onClick={handleStep3Click}
          style={{ cursor: 'pointer' }}
        >
          <div className="setup-step-check">
            {hasCompleted3 ? (
              <CheckCircle2 size={18} color="#10B981" />
            ) : (
              <Circle size={18} color="var(--text-muted)" />
            )}
          </div>
          <div className="setup-step-info">
            <span className="setup-step-title">Complete 3 tasks</span>
            <span className="setup-step-desc">
              {hasCompleted3 ? 'Completed & Verified ✓' : `${completedCount} of 3 completed (click to complete)`}
            </span>
          </div>
          <ChevronRight size={14} className="setup-step-chevron" />
        </div>
      </div>

      {/* Footer Action */}
      <div className="setup-card-footer">
        <button
          type="button"
          className="setup-check-later-btn"
          onClick={() => {
            if (completedSteps === 3) {
              try {
                confetti({
                  particleCount: 50,
                  spread: 70,
                  origin: { y: 0.7 }
                });
              } catch {}
            }
            setIsDismissed(true);
          }}
        >
          {completedSteps === 3 ? "Got it, close setup" : "I'll check later"}
        </button>
      </div>
    </div>
  );
};
