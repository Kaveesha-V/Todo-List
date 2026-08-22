import React from 'react';
import { useTodo } from '../context/TodoContext';
import { TaskCard } from './TaskCard';
import { CheckCircle2 } from 'lucide-react';

export const TaskListView = () => {
  const {
    tasks,
    selectedFilter,
    searchQuery
  } = useTodo();

  const now = new Date();

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    // 1. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q);
      const matchTags = task.tags?.some(tag => tag.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchTags) return false;
    }

    // 2. Tab Filter
    switch (selectedFilter) {
      case 'today': {
        if (!task.dueDate) return false;
        const d = new Date(task.dueDate);
        return d.toDateString() === now.toDateString();
      }
      case 'upcoming': {
        if (!task.dueDate || task.status === 'done') return false;
        const d = new Date(task.dueDate);
        return d > now && d.toDateString() !== now.toDateString();
      }
      case 'high': {
        return task.priority === 'high' && task.status !== 'done';
      }
      case 'done': {
        return task.status === 'done';
      }
      case 'all':
      default:
        return true;
    }
  });

  // Sort tasks: Incomplete tasks first, then by priority (high > med > low) / due date
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    // Completed tasks to bottom
    if (a.status === 'done' && b.status !== 'done') return 1;
    if (a.status !== 'done' && b.status === 'done') return -1;

    // Due date priority
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;

    return 0;
  });

  if (sortedTasks.length === 0) {
    return (
      <div className="empty-state-card">
        <div className="empty-state-icon">
          <CheckCircle2 size={24} />
        </div>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
          No tasks found
        </h3>
        <p style={{ fontSize: '0.88rem' }}>
          {searchQuery ? `No results matching "${searchQuery}"` : "Add a new task above using natural language to get started."}
        </p>
      </div>
    );
  }

  return (
    <div className="task-list-container">
      {sortedTasks.map(task => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
};
