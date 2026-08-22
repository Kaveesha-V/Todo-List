import React from 'react';
import { useTodo } from '../context/TodoContext';
import { List, LayoutGrid, Search, X } from 'lucide-react';

export const TaskFilterBar = () => {
  const {
    tasks,
    selectedFilter,
    setSelectedFilter,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery
  } = useTodo();

  const now = new Date();

  // Counts for badge numbers
  const counts = {
    all: tasks.length,
    today: tasks.filter(t => {
      if (!t.dueDate) return false;
      const d = new Date(t.dueDate);
      return d.toDateString() === now.toDateString();
    }).length,
    upcoming: tasks.filter(t => {
      if (!t.dueDate || t.status === 'done') return false;
      const d = new Date(t.dueDate);
      return d > now && d.toDateString() !== now.toDateString();
    }).length,
    high: tasks.filter(t => t.priority === 'high' && t.status !== 'done').length,
    done: tasks.filter(t => t.status === 'done').length
  };

  const filters = [
    { id: 'all', label: 'All Tasks', count: counts.all },
    { id: 'today', label: 'Today', count: counts.today },
    { id: 'upcoming', label: 'Upcoming', count: counts.upcoming },
    { id: 'high', label: 'High Priority', count: counts.high },
    { id: 'done', label: 'Completed', count: counts.done }
  ];

  return (
    <div className="toolbar-section">
      {/* Filter Pills */}
      <div className="filter-pills-group" role="tablist">
        {filters.map(filter => (
          <button
            key={filter.id}
            role="tab"
            aria-selected={selectedFilter === filter.id}
            className={`filter-pill-btn ${selectedFilter === filter.id ? 'active' : ''}`}
            onClick={() => setSelectedFilter(filter.id)}
          >
            <span>{filter.label}</span>
            <span className="filter-count-badge">{filter.count}</span>
          </button>
        ))}
      </div>

      {/* Search & View Switcher */}
      <div className="toolbar-controls-right">
        {/* Search */}
        <div className="search-input-wrapper">
          <Search size={15} />
          <input
            type="text"
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            aria-label="Search tasks"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ display: 'flex', alignItems: 'center', color: 'var(--text-tertiary)' }}
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* View Toggle: List vs Kanban */}
        <div className="view-toggle-container" role="radiogroup" aria-label="View selection">
          <button
            role="radio"
            aria-checked={viewMode === 'list'}
            className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="List View"
          >
            <List size={15} />
            <span>List</span>
          </button>

          <button
            role="radio"
            aria-checked={viewMode === 'kanban'}
            className={`view-toggle-btn ${viewMode === 'kanban' ? 'active' : ''}`}
            onClick={() => setViewMode('kanban')}
            title="Kanban Board View"
          >
            <LayoutGrid size={15} />
            <span>Board</span>
          </button>
        </div>
      </div>
    </div>
  );
};
