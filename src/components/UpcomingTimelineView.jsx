import React, { useState } from 'react';
import { useTodo } from '../context/TodoContext';
import { TaskCard } from './TaskCard';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
  CalendarDays,
  CheckCircle2
} from 'lucide-react';

export const UpcomingTimelineView = () => {
  const { tasks, addTask } = useTodo();
  const [activeDayAdding, setActiveDayAdding] = useState(null);
  const [inlineTaskTitle, setInlineTaskTitle] = useState('');

  // Generate next 7 days timeline
  const today = new Date();
  const daysList = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(today.getDate() + i);

    const dateStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
    const dayShort = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = d.getDate();
    const monthShort = d.toLocaleDateString('en-US', { month: 'short' });

    let label = `${dayNum} ${monthShort} · ${dayName}`;
    if (i === 0) label = `${dayNum} ${monthShort} · Today · ${dayName}`;
    if (i === 1) label = `${dayNum} ${monthShort} · Tomorrow · ${dayName}`;

    // Sample calendar holidays or events for upcoming days
    let specialBadge = null;
    if (i === 3) specialBadge = "Milad-Un-Nabi";
    if (i === 4) specialBadge = "Full Moon Poya Day";

    daysList.push({
      dateStr,
      dayName,
      dayShort,
      dayNum,
      monthShort,
      label,
      specialBadge,
      isToday: i === 0,
      tasks: tasks.filter(t => t.dueDate === dateStr)
    });
  }

  const handleInlineSubmit = (e, dateStr) => {
    e.preventDefault();
    if (inlineTaskTitle.trim()) {
      addTask({
        title: inlineTaskTitle.trim(),
        dueDate: dateStr,
        priority: 'medium',
        tags: ['upcoming'],
        status: 'todo'
      });
      setInlineTaskTitle('');
      setActiveDayAdding(null);
    }
  };

  const currentMonthYear = today.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="upcoming-timeline-container">
      {/* Top Header Row */}
      <div className="upcoming-header-row">
        <div>
          <h1 className="upcoming-main-title">Upcoming</h1>
          <div className="upcoming-month-selector">
            <span>{currentMonthYear}</span>
            <ChevronRight size={14} style={{ transform: 'rotate(90deg)', opacity: 0.7 }} />
          </div>
        </div>
      </div>

      {/* 7-Day Quick Strip Header */}
      <div className="upcoming-days-strip">
        {daysList.map((d) => (
          <div
            key={d.dateStr}
            className={`upcoming-strip-item ${d.isToday ? 'today-active' : ''}`}
            onClick={() => {
              const el = document.getElementById(`day-section-${d.dateStr}`);
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          >
            <span className="strip-weekday">{d.dayShort}</span>
            <span className="strip-daynum">{d.dayNum}</span>
          </div>
        ))}
      </div>

      {/* Chronological Day-by-Day Timeline List */}
      <div className="upcoming-days-sections">
        {daysList.map((day) => (
          <div
            key={day.dateStr}
            id={`day-section-${day.dateStr}`}
            className={`upcoming-day-block ${day.isToday ? 'today-block' : ''}`}
          >
            {/* Day Header */}
            <div className="upcoming-day-header">
              <h3 className="upcoming-day-heading">
                {day.label}
              </h3>
              {day.specialBadge && (
                <span className="upcoming-special-badge">
                  <span className="badge-bullet"></span>
                  {day.specialBadge}
                </span>
              )}
            </div>

            {/* Task Items for this Day */}
            <div className="upcoming-tasks-list">
              {day.tasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>

            {/* Inline Add Task Row */}
            {activeDayAdding === day.dateStr ? (
              <form
                onSubmit={(e) => handleInlineSubmit(e, day.dateStr)}
                className="upcoming-inline-add-form"
              >
                <input
                  type="text"
                  placeholder="Task name..."
                  value={inlineTaskTitle}
                  onChange={(e) => setInlineTaskTitle(e.target.value)}
                  autoFocus
                  className="upcoming-inline-input"
                />
                <div className="upcoming-inline-actions">
                  <button type="submit" className="upcoming-add-save-btn">
                    Add task
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
                <span>Add task</span>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
