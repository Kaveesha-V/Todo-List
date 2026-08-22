import React from 'react';
import { useTodo } from '../context/TodoContext';
import { formatFriendlyDate } from '../utils/dateUtils';
import {
  Check,
  Calendar,
  CheckSquare,
  Trash2,
  Tag,
  AlertCircle
} from 'lucide-react';

export const TaskCard = ({ task }) => {
  const {
    toggleTaskComplete,
    setActiveTask,
    activeTask,
    deleteTask
  } = useTodo();

  const isCompleted = task.status === 'done';
  const isSelected = activeTask?.id === task.id;
  const friendlyDue = formatFriendlyDate(task.dueDate);

  const subtasksCount = task.subtasks?.length || 0;
  const completedSubtasksCount = task.subtasks?.filter(s => s.done).length || 0;

  const handleCardClick = (e) => {
    // If clicking on checkbox or action buttons, don't open drawer
    if (e.target.closest('.custom-checkbox') || e.target.closest('.card-action-btn')) {
      return;
    }
    setActiveTask(task);
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'high': return 'badge-priority-high';
      case 'medium': return 'badge-priority-med';
      case 'low': return 'badge-priority-low';
      default: return 'badge-priority-med';
    }
  };

  return (
    <article
      className={`task-card ${isCompleted ? 'completed' : ''} ${isSelected ? 'active-selected' : ''}`}
      onClick={handleCardClick}
      aria-label={`Task: ${task.title}`}
    >
      {/* Checkbox */}
      <button
        type="button"
        className={`custom-checkbox ${isCompleted ? 'checked' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          toggleTaskComplete(task.id);
        }}
        aria-label={isCompleted ? "Mark as incomplete" : "Mark as completed"}
      >
        {isCompleted && <Check size={13} strokeWidth={3} />}
      </button>

      {/* Task Main Content */}
      <div className="task-card-main">
        <div className="task-card-header-row">
          <h3 className="task-card-title">{task.title}</h3>
        </div>

        {/* Badges & Meta Row */}
        <div className="task-card-meta-row">
          {/* Due Date & Time Badge */}
          {friendlyDue && (
            <span className={`badge-item badge-due ${friendlyDue.tag}`}>
              <Calendar size={11} />
              {friendlyDue.text}
            </span>
          )}

          {/* Priority Color Tag */}
          <span className={`badge-item ${getPriorityBadgeClass(task.priority)}`}>
            <AlertCircle size={11} />
            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
          </span>

          {/* Subtask Checklist Icon & Counter */}
          {subtasksCount > 0 && (
            <span className="badge-item badge-subtask" title={`${completedSubtasksCount} of ${subtasksCount} subtasks completed`}>
              <CheckSquare size={11} />
              <span>{completedSubtasksCount}/{subtasksCount}</span>
            </span>
          )}

          {/* Google Calendar Synced Badge */}
          {task.googleEventId && (
            <span className="badge-item badge-gcal" title="Synced to Google Calendar">
              <Calendar size={11} />
              <span>G-Cal</span>
            </span>
          )}

          {/* Tags */}
          {task.tags && task.tags.map((tag, idx) => (
            <span key={idx} className="badge-item badge-tag">
              <Tag size={10} />
              <span>{tag}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Hover Action Buttons */}
      <div className="task-card-actions">
        <button
          type="button"
          className="card-action-btn delete"
          onClick={(e) => {
            e.stopPropagation();
            deleteTask(task.id);
          }}
          title="Delete task"
          aria-label="Delete task"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </article>
  );
};
