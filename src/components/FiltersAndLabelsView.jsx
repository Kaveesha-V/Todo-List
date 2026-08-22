import React, { useState } from 'react';
import { useTodo } from '../context/TodoContext';
import { TaskCard } from './TaskCard';
import { getLocalDateString } from '../utils/dateUtils';
import {
  Tag,
  Filter,
  Flame,
  AlertCircle,
  Clock,
  User,
  ChevronDown,
  ChevronRight,
  Plus,
  Hash,
  CheckCircle2
} from 'lucide-react';

export const FiltersAndLabelsView = () => {
  const { tasks, setFilterPriority, setFilterTag } = useTodo();
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [selectedTag, setSelectedTag] = useState(null);

  // Extract all unique tags
  const allTags = Array.from(new Set(tasks.flatMap(t => t.tags || [])));
  if (!allTags.includes('work')) allTags.push('work');
  if (!allTags.includes('personal')) allTags.push('personal');
  if (!allTags.includes('urgent')) allTags.push('urgent');
  if (!allTags.includes('study')) allTags.push('study');

  // Filter tasks based on selection
  let displayedTasks = [];
  let viewTitle = "";

  if (selectedFilter === 'priority1') {
    displayedTasks = tasks.filter(t => t.priority === 'high');
    viewTitle = "Priority 1 (High)";
  } else if (selectedFilter === 'priority2') {
    displayedTasks = tasks.filter(t => t.priority === 'medium');
    viewTitle = "Priority 2 (Medium)";
  } else if (selectedFilter === 'priority3') {
    displayedTasks = tasks.filter(t => t.priority === 'low');
    viewTitle = "Priority 3 (Low)";
  } else if (selectedFilter === 'due_today') {
    const todayStr = getLocalDateString();
    displayedTasks = tasks.filter(t => t.dueDate === todayStr);
    viewTitle = "Due Today";
  } else if (selectedTag) {
    displayedTasks = tasks.filter(t => t.tags?.includes(selectedTag));
    viewTitle = `#${selectedTag}`;
  }

  return (
    <div className="filters-labels-container">
      <div className="filters-main-heading">
        <h1>Filters & Labels</h1>
      </div>

      <div className="filters-split-grid">
        {/* Left Side: Filter Categories List */}
        <div className="filters-nav-panel">
          {/* My Filters Section */}
          <div className="filters-category-group">
            <div className="filters-group-header">
              <ChevronDown size={14} />
              <span>My Filters</span>
            </div>
            <div className="filters-items-list">
              <button
                type="button"
                className={`filter-item-btn ${selectedFilter === 'priority1' ? 'active' : ''}`}
                onClick={() => { setSelectedFilter('priority1'); setSelectedTag(null); }}
              >
                <Flame size={15} color="#EF4444" />
                <span>Priority 1 (High)</span>
                <span className="filter-count">
                  {tasks.filter(t => !t.completed && (t.priority === 'high' || t.priority === 'urgent')).length}
                </span>
              </button>

              <button
                type="button"
                className={`filter-item-btn ${selectedFilter === 'priority2' ? 'active' : ''}`}
                onClick={() => { setSelectedFilter('priority2'); setSelectedTag(null); }}
              >
                <Flame size={15} color="#F59E0B" />
                <span>Priority 2 (Medium)</span>
                <span className="filter-count">
                  {tasks.filter(t => !t.completed && t.priority === 'medium').length}
                </span>
              </button>

              <button
                type="button"
                className={`filter-item-btn ${selectedFilter === 'priority3' ? 'active' : ''}`}
                onClick={() => { setSelectedFilter('priority3'); setSelectedTag(null); }}
              >
                <Flame size={15} color="#3B82F6" />
                <span>Priority 3 (Low)</span>
                <span className="filter-count">
                  {tasks.filter(t => !t.completed && t.priority === 'low').length}
                </span>
              </button>

              <button
                type="button"
                className={`filter-item-btn ${selectedFilter === 'due_today' ? 'active' : ''}`}
                onClick={() => { setSelectedFilter('due_today'); setSelectedTag(null); }}
              >
                <Clock size={15} color="#10B981" />
                <span>Due Today</span>
                <span className="filter-count">
                  {tasks.filter(t => !t.completed && t.dueDate === getLocalDateString()).length}
                </span>
              </button>
            </div>
          </div>

          {/* Labels Section */}
          <div className="filters-category-group">
            <div className="filters-group-header">
              <ChevronDown size={14} />
              <span>Labels</span>
            </div>
            <div className="filters-items-list">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`filter-item-btn ${selectedTag === tag ? 'active' : ''}`}
                  onClick={() => { setSelectedTag(tag); setSelectedFilter(null); }}
                >
                  <Tag size={14} color="#8B5CF6" />
                  <span>#{tag}</span>
                  <span className="filter-count">
                    {tasks.filter(t => !t.completed && t.tags?.includes(tag)).length}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Filtered Tasks Results */}
        <div className="filters-results-panel">
          {viewTitle ? (
            <div>
              <div className="filters-result-header">
                <h2>{viewTitle}</h2>
                <span className="result-count">{displayedTasks.length} tasks</span>
              </div>
              <div className="filters-task-cards">
                {displayedTasks.length > 0 ? (
                  displayedTasks.map((t) => (
                    <TaskCard key={t.id} task={t} />
                  ))
                ) : (
                  <div className="filters-empty-notice">
                    <CheckCircle2 size={32} color="#10B981" />
                    <p>No tasks match this filter right now.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="filters-default-welcome">
              <Filter size={40} className="filter-welcome-icon" />
              <h3>Select a filter or label</h3>
              <p>Choose from the list on the left to see matching tasks organized instantly.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
