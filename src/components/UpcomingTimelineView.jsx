import React, { useState, useMemo } from 'react';
import { useTodo } from '../context/TodoContext';
import { useAuth } from '../context/AuthContext';
import { TaskCard } from './TaskCard';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
  CalendarDays,
  CheckCircle2,
  Clock,
  ArrowRight,
  RotateCcw
} from 'lucide-react';

export const UpcomingTimelineView = () => {
  const { tasks, addTask } = useTodo();
  const { currentUser, connectGoogleCalendar } = useAuth();
  const [activeDayAdding, setActiveDayAdding] = useState(null);
  const [inlineTaskTitle, setInlineTaskTitle] = useState('');
  const [inlineTaskTime, setInlineTaskTime] = useState('09:00');
  const [daysCount, setDaysCount] = useState(21); // Default 3 weeks, dynamically expandable
  const [selectedMonthOffset, setSelectedMonthOffset] = useState(0);

  // Current anchor date based on month offset
  const today = new Date();
  const anchorDate = new Date(today.getFullYear(), today.getMonth() + selectedMonthOffset, 1);

  // Generate dynamic rolling timeline
  const { daysList, allFutureDatesWithTasks } = useMemo(() => {
    const list = [];
    const startDate = selectedMonthOffset === 0 ? today : anchorDate;
    
    // 1. Gather all tasks that have due dates in the future
    const taskDatesSet = new Set(
      tasks
        .filter(t => t.dueDate)
        .map(t => t.dueDate)
    );

    // 2. Generate sequential days from startDate
    for (let i = 0; i < daysCount; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);

      const dateStr = d.toISOString().split('T')[0];
      taskDatesSet.delete(dateStr); // already included in sequential list

      const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
      const dayShort = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.getDate();
      const monthShort = d.toLocaleDateString('en-US', { month: 'short' });

      const isToday = dateStr === today.toISOString().split('T')[0];
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);
      const isTomorrow = dateStr === tomorrow.toISOString().split('T')[0];

      let label = `${dayNum} ${monthShort} · ${dayName}`;
      if (isToday) label = `${dayNum} ${monthShort} · Today · ${dayName}`;
      if (isTomorrow) label = `${dayNum} ${monthShort} · Tomorrow · ${dayName}`;

      list.push({
        dateStr,
        dayName,
        dayShort,
        dayNum,
        monthShort,
        label,
        isToday,
        tasks: tasks.filter(t => t.dueDate === dateStr)
      });
    }

    // 3. Include any other distant future dates with tasks beyond current range
    const distantDates = Array.from(taskDatesSet)
      .filter(dateStr => dateStr > list[list.length - 1]?.dateStr)
      .sort();

    distantDates.forEach(dateStr => {
      const d = new Date(dateStr + 'T00:00:00');
      const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
      const dayShort = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.getDate();
      const monthShort = d.toLocaleDateString('en-US', { month: 'short' });

      list.push({
        dateStr,
        dayName,
        dayShort,
        dayNum,
        monthShort,
        label: `${dayNum} ${monthShort} · ${dayName}`,
        isToday: false,
        isDistant: true,
        tasks: tasks.filter(t => t.dueDate === dateStr)
      });
    });

    return { daysList: list, allFutureDatesWithTasks: distantDates };
  }, [tasks, daysCount, selectedMonthOffset]);

  const handleInlineSubmit = (e, dateStr) => {
    e.preventDefault();
    if (inlineTaskTitle.trim()) {
      addTask({
        title: inlineTaskTitle.trim(),
        dueDate: dateStr,
        dueTime: inlineTaskTime,
        priority: 'medium',
        tags: ['upcoming', 'gcal'],
        status: 'todo'
      });
      setInlineTaskTitle('');
      setActiveDayAdding(null);
    }
  };

  const currentHeaderMonth = anchorDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="upcoming-timeline-container">
      {/* Top Header Row with Month Navigation & G-Cal Status */}
      <div className="upcoming-header-row">
        <div>
          <h1 className="upcoming-main-title">Upcoming Schedule</h1>
          <div className="upcoming-month-controls">
            <button
              type="button"
              className="month-nav-btn"
              onClick={() => setSelectedMonthOffset(prev => prev - 1)}
              title="Previous month"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="month-display-name">{currentHeaderMonth}</span>
            <button
              type="button"
              className="month-nav-btn"
              onClick={() => setSelectedMonthOffset(prev => prev + 1)}
              title="Next month"
            >
              <ChevronRight size={16} />
            </button>
            {selectedMonthOffset !== 0 && (
              <button
                type="button"
                className="month-today-btn"
                onClick={() => setSelectedMonthOffset(0)}
              >
                Today
              </button>
            )}
          </div>
        </div>

        {/* Google Calendar Sync Indicator */}
        <div className="upcoming-gcal-status-row">
          {currentUser?.calendarConnected ? (
            <div className="upcoming-gcal-badge active" title="Google Calendar Real-Time Synced">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path fill="#4285F4" d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
                <text x="12" y="16" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#4285F4">31</text>
              </svg>
              <span>G-Cal Live Synced</span>
            </div>
          ) : (
            <button
              type="button"
              className="upcoming-connect-gcal-btn"
              onClick={() => connectGoogleCalendar && connectGoogleCalendar()}
            >
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path fill="#4285F4" d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
                <text x="12" y="16" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#4285F4">31</text>
              </svg>
              <span>Connect Google Calendar</span>
            </button>
          )}
        </div>
      </div>

      {/* Horizontal Quick Days Strip */}
      <div className="upcoming-days-strip">
        {daysList.slice(0, 14).map((d) => (
          <div
            key={d.dateStr}
            className={`upcoming-strip-item ${d.isToday ? 'today-active' : ''} ${d.tasks.length > 0 ? 'has-tasks' : ''}`}
            onClick={() => {
              const el = document.getElementById(`day-section-${d.dateStr}`);
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          >
            <span className="strip-weekday">{d.dayShort}</span>
            <span className="strip-daynum">{d.dayNum}</span>
            {d.tasks.length > 0 && <span className="strip-task-dot"></span>}
          </div>
        ))}
      </div>

      {/* Unlimited Chronological Day-by-Day Timeline List */}
      <div className="upcoming-days-sections">
        {daysList.map((day) => (
          <div
            key={day.dateStr}
            id={`day-section-${day.dateStr}`}
            className={`upcoming-day-block ${day.isToday ? 'today-block' : ''}`}
          >
            {/* Day Header */}
            <div className="upcoming-day-header">
              <div className="upcoming-day-title-group">
                <h3 className="upcoming-day-heading">
                  {day.label}
                </h3>
                {day.tasks.length > 0 && (
                  <span className="day-task-count-pill">{day.tasks.length} {day.tasks.length === 1 ? 'task' : 'tasks'}</span>
                )}
              </div>

              {currentUser?.calendarConnected && day.tasks.some(t => t.dueTime) && (
                <span className="upcoming-gcal-day-tag">
                  <Clock size={12} />
                  <span>Events Synced</span>
                </span>
              )}
            </div>

            {/* Task Items for this Day */}
            <div className="upcoming-tasks-list">
              {day.tasks.length > 0 ? (
                day.tasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))
              ) : (
                <div className="upcoming-day-empty">
                  <span>No scheduled tasks for this date</span>
                </div>
              )}
            </div>

            {/* Inline Add Task Row */}
            {activeDayAdding === day.dateStr ? (
              <form
                onSubmit={(e) => handleInlineSubmit(e, day.dateStr)}
                className="upcoming-inline-add-form animate-fade-in"
              >
                <input
                  type="text"
                  placeholder="Schedule task for this day..."
                  value={inlineTaskTitle}
                  onChange={(e) => setInlineTaskTitle(e.target.value)}
                  autoFocus
                  className="upcoming-inline-input"
                />
                <input
                  type="time"
                  value={inlineTaskTime}
                  onChange={(e) => setInlineTaskTime(e.target.value)}
                  className="upcoming-inline-time-input"
                  title="Due Time"
                />
                <div className="upcoming-inline-actions">
                  <button type="submit" className="upcoming-add-save-btn">
                    Schedule Task
                  </button>
                  <button
                    type="button"
                    className="upcoming-add-cancel-btn"
                    onClick={() => { setActiveDayAdding(null); setInlineTaskTitle(''); }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                className="upcoming-add-day-btn"
                onClick={() => setActiveDayAdding(day.dateStr)}
              >
                <Plus size={15} />
                <span>Add task to {day.dayShort} {day.dayNum}</span>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Infinite Dates / Load More Button */}
      <div className="upcoming-load-more-section">
        <button
          type="button"
          className="upcoming-load-more-btn"
          onClick={() => setDaysCount(prev => prev + 14)}
        >
          <CalendarDays size={16} />
          <span>Load Next 2 Weeks of Future Dates ({daysCount + 14} days total)</span>
        </button>
      </div>
    </div>
  );
};
