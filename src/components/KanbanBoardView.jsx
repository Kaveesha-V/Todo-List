import React from 'react';
import { useTodo } from '../context/TodoContext';
import { formatFriendlyDate } from '../utils/dateUtils';
import {
  Calendar,
  CheckSquare,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Tag
} from 'lucide-react';

export const KanbanBoardView = () => {
  const {
    tasks,
    searchQuery,
    setTaskStatus,
    setActiveTask
  } = useTodo();

  const columns = [
    { id: 'todo', title: 'To Do', indicatorClass: 'todo' },
    { id: 'inprogress', title: 'In Progress', indicatorClass: 'inprogress' },
    { id: 'done', title: 'Done', indicatorClass: 'done' }
  ];

  // Filter tasks based on search
  const filteredTasks = tasks.filter(task => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      task.title.toLowerCase().includes(q) ||
      task.description?.toLowerCase().includes(q) ||
      task.tags?.some(tag => tag.toLowerCase().includes(q))
    );
  });

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'high': return 'badge-priority-high';
      case 'medium': return 'badge-priority-med';
      case 'low': return 'badge-priority-low';
      default: return 'badge-priority-med';
    }
  };

  return (
    <div className="kanban-grid" role="region" aria-label="Kanban Board View">
      {columns.map(col => {
        const colTasks = filteredTasks.filter(t => (t.status || 'todo') === col.id);

        return (
          <div key={col.id} className="kanban-column">
            {/* Column Header */}
            <div className="kanban-col-header">
              <div className="kanban-col-title-group">
                <span className={`kanban-col-indicator ${col.indicatorClass}`}></span>
                <span>{col.title}</span>
              </div>
              <span className="kanban-col-count">{colTasks.length}</span>
            </div>

            {/* Task Cards Stack */}
            <div className="kanban-card-stack">
              {colTasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
                  No tasks in {col.title}
                </div>
              ) : (
                colTasks.map(task => {
                  const friendlyDue = formatFriendlyDate(task.dueDate);
                  const subCount = task.subtasks?.length || 0;
                  const doneSubCount = task.subtasks?.filter(s => s.done).length || 0;

                  return (
                    <div
                      key={task.id}
                      className="kanban-task-card"
                      onClick={() => setActiveTask(task)}
                      role="button"
                      tabIndex={0}
                      aria-label={`Task: ${task.title}`}
                    >
                      {/* Title */}
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.3 }}>
                        {task.title}
                      </div>

                      {/* Meta Tags Row */}
                      <div className="kanban-card-tags-row">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span className={`badge-item ${getPriorityBadgeClass(task.priority)}`}>
                            <AlertCircle size={10} />
                            {task.priority}
                          </span>

                          {friendlyDue && (
                            <span className={`badge-item badge-due ${friendlyDue.tag}`}>
                              <Calendar size={10} />
                              {friendlyDue.text.split(',')[0]}
                            </span>
                          )}

                          {subCount > 0 && (
                            <span className="badge-item badge-subtask">
                              <CheckSquare size={10} />
                              {doneSubCount}/{subCount}
                            </span>
                          )}
                        </div>

                        {/* Column shift controls */}
                        <div className="kanban-move-btn-group" onClick={(e) => e.stopPropagation()}>
                          {col.id !== 'todo' && (
                            <button
                              className="kanban-move-btn"
                              onClick={() => setTaskStatus(task.id, col.id === 'done' ? 'inprogress' : 'todo')}
                              title="Move left"
                              aria-label="Move left"
                            >
                              <ArrowLeft size={11} />
                            </button>
                          )}
                          {col.id !== 'done' && (
                            <button
                              className="kanban-move-btn"
                              onClick={() => setTaskStatus(task.id, col.id === 'todo' ? 'inprogress' : 'done')}
                              title="Move right"
                              aria-label="Move right"
                            >
                              <ArrowRight size={11} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
