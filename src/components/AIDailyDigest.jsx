import React, { useState } from 'react';
import { useTodo } from '../context/TodoContext';
import {
  Sparkles,
  AlertTriangle,
  Clock,
  Flame,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Target,
  RefreshCw
} from 'lucide-react';

export const AIDailyDigest = () => {
  const { aiDigest, setActiveTask, tasks, addToast } = useTodo();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const digest = aiDigest || {
    generatedAt: 'Just now',
    summary: 'Add tasks to see AI priorities, suggestions, and daily workload analysis.',
    todayCount: 0,
    overdueCount: 0,
    highPriorityCount: 0,
    completedCount: 0,
    recommendedFocus: null
  };

  const handleFocusClick = () => {
    if (digest.focusTaskId) {
      const task = tasks?.find(t => t.id === digest.focusTaskId);
      if (task) {
        setActiveTask(task);
        addToast(`Focus mode: ${task.title}`, 'info');
      }
    }
  };

  const handleRefresh = (e) => {
    e.stopPropagation();
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      addToast("AI Daily Digest updated", "info");
    }, 600);
  };

  return (
    <section className="ai-digest-card" aria-label="AI Daily Digest">
      {/* Header */}
      <div className="ai-digest-header">
        <div className="ai-digest-title-group">
          <div className="ai-sparkle-badge">
            <Sparkles size={16} />
          </div>
          <div>
            <h2 className="ai-digest-title">
              AI Daily Digest
              <span className="ai-digest-timestamp">
                • {digest.generatedAt}
              </span>
            </h2>
          </div>
        </div>

        <div className="ai-digest-actions">
          {digest.recommendedFocus && (
            <button
              className="digest-chip-btn"
              onClick={handleFocusClick}
              title="Open suggested top priority task"
            >
              <Target size={13} style={{ color: 'var(--accent)' }} />
              <span>Suggested Focus</span>
            </button>
          )}

          <button
            className="header-icon-btn"
            style={{ width: '30px', height: '30px' }}
            onClick={handleRefresh}
            title="Refresh AI Analysis"
            aria-label="Refresh AI Digest"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
          </button>

          <button
            className="header-icon-btn"
            style={{ width: '30px', height: '30px' }}
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Expand Digest" : "Collapse Digest"}
            aria-label="Toggle Digest Collapse"
          >
            {isCollapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
          </button>
        </div>
      </div>

      {/* Body & Insights */}
      {!isCollapsed && (
        <>
          <p className="ai-digest-body">
            {digest.summary}
          </p>

          {/* Quick Metrics Breakdown */}
          <div className="ai-digest-highlights">
            {digest.overdueCount > 0 && (
              <div className="digest-stat-item" style={{ borderColor: 'var(--priority-high-border)' }}>
                <div className="digest-stat-icon" style={{ background: 'var(--priority-high-bg)', color: 'var(--priority-high)' }}>
                  <AlertTriangle size={14} />
                </div>
                <div>
                  <div className="digest-stat-text">{digest.overdueCount} Overdue</div>
                  <div className="digest-stat-sub">Needs immediate action</div>
                </div>
              </div>
            )}

            <div className="digest-stat-item">
              <div className="digest-stat-icon" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                <Clock size={14} />
              </div>
              <div>
                <div className="digest-stat-text">{digest.todayCount} Due Today</div>
                <div className="digest-stat-sub">On track schedule</div>
              </div>
            </div>

            {digest.highPriorityCount > 0 && (
              <div className="digest-stat-item">
                <div className="digest-stat-icon" style={{ background: 'var(--priority-high-bg)', color: 'var(--priority-high)' }}>
                  <Flame size={14} />
                </div>
                <div>
                  <div className="digest-stat-text">{digest.highPriorityCount} High Priority</div>
                  <div className="digest-stat-sub">Critical impact items</div>
                </div>
              </div>
            )}

            <div className="digest-stat-item">
              <div className="digest-stat-icon" style={{ background: 'var(--priority-low-bg)', color: 'var(--priority-low)' }}>
                <CheckCircle size={14} />
              </div>
              <div>
                <div className="digest-stat-text">{digest.completedCount} Completed</div>
                <div className="digest-stat-sub">Great progress</div>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
};
