import React, { useState } from 'react';
import { useTodo } from '../context/TodoContext';
import { formatFriendlyDate } from '../utils/dateUtils';
import { getGoogleCalendarWebLink } from '../services/googleCalendar';
import { UnfinishedRescheduleModal } from './UnfinishedRescheduleModal';
import {
  Check,
  Calendar,
  CheckSquare,
  Trash2,
  Tag,
  AlertCircle,
  ExternalLink,
  RotateCcw,
  Lock
} from 'lucide-react';

export const TaskCard = React.memo(({ task }) => {
  const {
    toggleTaskComplete,
    setActiveTask,
    activeTask,
    deleteTask,
    addToast
  } = useTodo();

  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);

  const isCompleted = task.status === 'done';
  const isSelected = activeTask?.id === task.id;
  const friendlyDue = formatFriendlyDate(task.dueDate, task.dueTime);

  const subtasksCount = task.subtasks?.length || 0;
  const completedSubtasksCount = task.subtasks?.filter(s => s.done).length || 0;

  const handleCardClick = (e) => {
    // If clicking on checkbox, action buttons, or modal triggers, don't open drawer
    if (
      e.target.closest('.custom-checkbox') ||
      e.target.closest('.card-action-btn') ||
      e.target.closest('.badge-unfinished-btn') ||
      e.target.closest('a')
    ) {
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

  const gcalUrl = task.gcalLink || (task.dueDate ? getGoogleCalendarWebLink(task) : null);

  return (
    <>
      <article
        className={`task-card ${isCompleted ? 'completed locked-completed' : ''} ${isSelected ? 'active-selected' : ''}`}
        onClick={handleCardClick}
        aria-label={`Task: ${task.title}`}
      >
        {/* Checkbox (Finished tasks cannot be undone, but can be deleted) */}
        <button
          type="button"
          className={`custom-checkbox ${isCompleted ? 'checked locked' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleTaskComplete(task.id);
          }}
          title={isCompleted ? "Finished (Permanently recorded - cannot undo, but can be deleted)" : "Mark as completed"}
          aria-label={isCompleted ? "Finished task" : "Mark as completed"}
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
            {/* Status Badge */}
            {isCompleted ? (
              <span className="badge-item badge-completed-locked" title="Completed Task">
                <Check size={11} strokeWidth={2.5} />
                <span>Done</span>
              </span>
            ) : (
              /* Mark as Unfinished / Move to Future Day Trigger (Rule 6 & 9) */
              <button
                type="button"
                className="badge-item badge-unfinished-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsRescheduleOpen(true);
                }}
                title="Mark as unfinished & move to future date"
              >
                <RotateCcw size={11} />
                <span>Unfinished? Move Date</span>
              </button>
            )}

            {/* Due Date & Time Badge */}
            {friendlyDue && (
              <span className={`badge-item badge-due ${friendlyDue.tag}`}>
                <Calendar size={11} />
                {friendlyDue.text}
              </span>
            )}

            {/* Rescheduled Notice if task was previously unfinished & moved */}
            {task.rescheduledFrom && (
              <span className="badge-item badge-rescheduled" title={`Moved from ${task.rescheduledFrom}`}>
                <RotateCcw size={10} />
                <span>Moved</span>
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

            {/* Direct Clickable Google Calendar Synced Badge */}
            {gcalUrl && (
              <a
                href={gcalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="badge-item badge-gcal clickable"
                title="Open event on Google Calendar"
                onClick={(e) => e.stopPropagation()}
              >
                <Calendar size={11} />
                <span>G-Cal</span>
                <ExternalLink size={10} style={{ marginLeft: '3px', opacity: 0.8 }} />
              </a>
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

        {/* Action Buttons (Delete available for all tasks) */}
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
            <Trash2 size={15} />
          </button>
        </div>
      </article>

      {/* Unfinished Reschedule Date Modal (Rule 9) */}
      <UnfinishedRescheduleModal
        task={task}
        isOpen={isRescheduleOpen}
        onClose={() => setIsRescheduleOpen(false)}
      />
    </>
  );
});
