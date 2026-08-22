import React, { useState, useMemo, useEffect } from 'react';
import { useTodo } from '../context/TodoContext';
import { useAuth } from '../context/AuthContext';
import { syncTaskToGoogleCalendarAPI, getGoogleCalendarWebLink } from '../services/googleCalendar';
import { getOngoingTimeString, getLocalDateString } from '../utils/dateUtils';
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
  RotateCcw,
  ArrowUpDown,
  ExternalLink,
  History,
  LayoutGrid,
  List,
  AlertCircle,
  Zap,
  Sun,
  Sunset,
  Moon,
  Flame
} from 'lucide-react';

export const UpcomingTimelineView = () => {
  const { tasks, addTask, addToast } = useTodo();
  const { currentUser, connectGoogleCalendar } = useAuth();
  
  // UI & Calendar State
  const [viewLayout, setViewLayout] = useState('timeline'); // 'timeline' | 'month_grid'
  const [sortOption, setSortOption] = useState('date_asc'); // 'date_asc' | 'priority' | 'gcal_first' | 'alpha'
  const [activeDayAdding, setActiveDayAdding] = useState(null);
  const [inlineTaskTitle, setInlineTaskTitle] = useState('');
  const [inlineTaskTime, setInlineTaskTime] = useState(() => getOngoingTimeString());
  const [inlineTaskPriority, setInlineTaskPriority] = useState('medium'); // 'high' | 'medium' | 'low'
  const [daysCount, setDaysCount] = useState(30); // 30 days rolling by default (unlimited expandable)
  const [selectedMonthOffset, setSelectedMonthOffset] = useState(0);
  const [showPastHistory, setShowPastHistory] = useState(false);
  const [customJumpDate, setCustomJumpDate] = useState('');
  const [highlightedDay, setHighlightedDay] = useState(null);

  // Date Anchors (Accurate Local Timezone)
  const today = new Date();
  const todayDateStr = getLocalDateString(today);
  const anchorDate = new Date(today.getFullYear(), today.getMonth() + selectedMonthOffset, 1);

  // When opening add task, refresh to latest ongoing time
  const handleOpenAddForDay = (dateStr) => {
    setActiveDayAdding(dateStr);
    setInlineTaskTime(getOngoingTimeString());
    setInlineTaskPriority('medium');
  };

  // Convert 24h HH:mm to 12h readable string for display
  const format12Hour = (time24) => {
    if (!time24) return '09:00 AM';
    const [h, m] = time24.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    const mStr = String(m || 0).padStart(2, '0');
    return `${h12}:${mStr} ${period}`;
  };

  // Group tasks into Past and Future
  const { pastTasks, upcomingTasks } = useMemo(() => {
    const past = [];
    const upcoming = [];

    tasks.forEach(t => {
      if (t.dueDate && t.dueDate < todayDateStr) {
        past.push(t);
      } else {
        upcoming.push(t);
      }
    });

    return { pastTasks: past, upcomingTasks: upcoming };
  }, [tasks, todayDateStr]);

  // Sort helper
  const sortTasksArray = (taskList) => {
    return [...taskList].sort((a, b) => {
      if (sortOption === 'priority') {
        const pMap = { high: 3, medium: 2, low: 1 };
        return (pMap[b.priority] || 2) - (pMap[a.priority] || 2);
      }
      if (sortOption === 'gcal_first') {
        const aGcal = a.gcalSynced || a.tags?.includes('gcal') ? 1 : 0;
        const bGcal = b.gcalSynced || b.tags?.includes('gcal') ? 1 : 0;
        return bGcal - aGcal;
      }
      if (sortOption === 'alpha') {
        return (a.title || '').localeCompare(b.title || '');
      }
      // Default: date_asc
      return (a.dueTime || '00:00').localeCompare(b.dueTime || '00:00');
    });
  };

  // Generate dynamic rolling timeline (including custom jump date)
  const { daysList } = useMemo(() => {
    const list = [];
    const startDate = selectedMonthOffset === 0 ? today : anchorDate;
    
    // Gather all upcoming tasks dates
    const taskDatesSet = new Set(
      upcomingTasks
        .filter(t => t.dueDate)
        .map(t => t.dueDate)
    );

    if (customJumpDate && customJumpDate >= todayDateStr) {
      taskDatesSet.add(customJumpDate);
    }

    // 1. Generate sequential days from startDate
    for (let i = 0; i < daysCount; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);

      const dateStr = getLocalDateString(d);
      taskDatesSet.delete(dateStr);

      const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
      const dayShort = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.getDate();
      const monthShort = d.toLocaleDateString('en-US', { month: 'short' });

      const isToday = dateStr === todayDateStr;
      const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      const isTomorrow = dateStr === getLocalDateString(tomorrow);

      let label = `${dayNum} ${monthShort} · ${dayName}`;
      if (isToday) label = `${dayNum} ${monthShort} · Today · ${dayName}`;
      if (isTomorrow) label = `${dayNum} ${monthShort} · Tomorrow · ${dayName}`;

      const dayTasks = sortTasksArray(upcomingTasks.filter(t => t.dueDate === dateStr));

      list.push({
        dateStr,
        dayName,
        dayShort,
        dayNum,
        monthShort,
        label,
        isToday,
        isPast: dateStr < todayDateStr,
        tasks: dayTasks
      });
    }

    // 2. Add any other future dates (e.g. custom jump date 2030 or distant tasks)
    const distantDates = Array.from(taskDatesSet).sort();

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
        label: `${dayNum} ${monthShort} ${d.getFullYear()} · ${dayName}`,
        isToday: false,
        isPast: false,
        isDistant: true,
        tasks: sortTasksArray(upcomingTasks.filter(t => t.dueDate === dateStr))
      });
    });

    // Sort list chronologically
    return { daysList: list.sort((a, b) => a.dateStr.localeCompare(b.dateStr)) };
  }, [upcomingTasks, daysCount, selectedMonthOffset, sortOption, todayDateStr, customJumpDate]);

  // Full Month Grid Days Generator
  const monthGridDays = useMemo(() => {
    const year = anchorDate.getFullYear();
    const month = anchorDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    const grid = [];
    for (let p = 0; p < firstDayIndex; p++) {
      grid.push({ isBlank: true, id: `blank_${p}` });
    }

    for (let day = 1; day <= totalDaysInMonth; day++) {
      const d = new Date(year, month, day);
      const dateStr = getLocalDateString(d);
      const isToday = dateStr === todayDateStr;
      const isPast = dateStr < todayDateStr;
      const dayTasks = upcomingTasks.filter(t => t.dueDate === dateStr);

      grid.push({
        isBlank: false,
        dayNum: day,
        dateStr,
        isToday,
        isPast,
        tasks: dayTasks,
        id: dateStr
      });
    }

    return grid;
  }, [anchorDate, upcomingTasks, todayDateStr]);

  // Handle adding task with Google Calendar Event Creation & Priority
  const handleInlineSubmit = async (e, dateStr) => {
    e.preventDefault();
    if (!inlineTaskTitle.trim()) return;

    // Block past dates for new tasks
    if (dateStr < todayDateStr) {
      if (addToast) addToast("Cannot schedule tasks in past dates", "error");
      return;
    }

    const newTaskData = {
      title: inlineTaskTitle.trim(),
      dueDate: dateStr,
      dueTime: inlineTaskTime || getOngoingTimeString(),
      priority: inlineTaskPriority || 'medium',
      tags: ['upcoming', 'gcal'],
      status: 'todo',
      gcalSynced: true
    };

    // Live Google Calendar API Event creation
    if (currentUser?.calendarConnected) {
      try {
        const syncResult = await syncTaskToGoogleCalendarAPI(currentUser?.googleCalendarToken, newTaskData);
        newTaskData.gcalEventId = syncResult?.eventId || null;
        newTaskData.gcalLink = syncResult?.htmlLink || getGoogleCalendarWebLink(newTaskData);
      } catch (err) {
        console.warn("Google Calendar sync warning:", err);
      }
    } else {
      newTaskData.gcalLink = getGoogleCalendarWebLink(newTaskData);
    }

    addTask(newTaskData);
    if (addToast) {
      addToast(`Added "${newTaskData.title}" (${newTaskData.priority.toUpperCase()}) & synced to Google Calendar! 📅`, "success");
    }

    setInlineTaskTitle('');
    setActiveDayAdding(null);
  };

  // Smooth jump to custom date
  const handleJumpToDate = (e) => {
    const selectedDate = e.target.value;
    setCustomJumpDate(selectedDate);
    
    if (selectedDate) {
      if (selectedDate < todayDateStr) {
        if (addToast) addToast("Selected date is in the past", "info");
      }

      setHighlightedDay(selectedDate);
      setViewLayout('timeline');

      setTimeout(() => {
        const el = document.getElementById(`day-section-${selectedDate}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          handleOpenAddForDay(selectedDate);
        }
      }, 150);
    }
  };

  const currentHeaderMonth = anchorDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="upcoming-timeline-container">
      {/* Top Header Row with Month Navigation, Sort & G-Cal Status */}
      <div className="upcoming-header-row">
        <div>
          <h1 className="upcoming-main-title">Upcoming Schedule</h1>
          
          {/* Month Navigator */}
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

        {/* Header Right: Layout Toggle, Sort Selector */}
        <div className="upcoming-header-tools">
          {/* Sort Selector */}
          <div className="upcoming-sort-control">
            <ArrowUpDown size={14} className="sort-icon" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="upcoming-sort-select"
              title="Sort Upcoming Tasks"
            >
              <option value="date_asc">Sort: Nearest Date</option>
              <option value="priority">Sort: High Priority</option>
              <option value="gcal_first">Sort: Google Synced</option>
              <option value="alpha">Sort: Task Name (A-Z)</option>
            </select>
          </div>

          {/* View Layout Toggle (Timeline vs Month Grid) */}
          <div className="upcoming-layout-toggle">
            <button
              type="button"
              className={`layout-btn ${viewLayout === 'timeline' ? 'active' : ''}`}
              onClick={() => setViewLayout('timeline')}
              title="Timeline List View"
            >
              <List size={15} />
            </button>
            <button
              type="button"
              className={`layout-btn ${viewLayout === 'month_grid' ? 'active' : ''}`}
              onClick={() => setViewLayout('month_grid')}
              title="Month Grid Calendar"
            >
              <LayoutGrid size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Date Jump Picker */}
      <div className="upcoming-jump-bar">
        <span className="jump-label">Jump to any date smoothly:</span>
        <input
          type="date"
          min={todayDateStr} // Block past dates
          value={customJumpDate}
          onChange={handleJumpToDate}
          className="upcoming-date-jump-input"
          title="Jump to date"
        />
        {customJumpDate && (
          <button
            type="button"
            className="clear-jump-btn"
            onClick={() => setCustomJumpDate('')}
          >
            Clear
          </button>
        )}
      </div>

      {/* VIEW 1: MONTH GRID CALENDAR */}
      {viewLayout === 'month_grid' ? (
        <div className="upcoming-month-grid-wrapper animate-fade-in">
          <div className="month-grid-weekdays">
            <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
          </div>
          <div className="month-grid-cells">
            {monthGridDays.map((cell) => (
              cell.isBlank ? (
                <div key={cell.id} className="month-cell blank"></div>
              ) : (
                <div
                  key={cell.id}
                  className={`month-cell ${cell.isToday ? 'today-cell' : ''} ${cell.isPast ? 'past-cell' : ''} ${cell.tasks.length > 0 ? 'has-tasks' : ''}`}
                  onClick={() => {
                    if (!cell.isPast) {
                      setViewLayout('timeline');
                      setTimeout(() => {
                        const el = document.getElementById(`day-section-${cell.dateStr}`);
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          handleOpenAddForDay(cell.dateStr);
                        }
                      }, 100);
                    }
                  }}
                >
                  <div className="cell-header">
                    <span className="cell-day-num">{cell.dayNum}</span>
                    {cell.tasks.length > 0 && (
                      <span className="cell-task-badge">{cell.tasks.length}</span>
                    )}
                  </div>
                  <div className="cell-tasks-preview">
                    {cell.tasks.slice(0, 2).map(t => (
                      <div key={t.id} className="cell-task-pill" title={t.title}>
                        {t.title}
                      </div>
                    ))}
                    {cell.tasks.length > 2 && (
                      <span className="cell-more-text">+{cell.tasks.length - 2} more</span>
                    )}
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      ) : (
        /* VIEW 2: UNLIMITED TIMELINE LIST */
        <>
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

          {/* Chronological Day-by-Day Timeline List */}
          <div className="upcoming-days-sections">
            {daysList.map((day) => (
              <div
                key={day.dateStr}
                id={`day-section-${day.dateStr}`}
                className={`upcoming-day-block ${day.isToday ? 'today-block' : ''} ${highlightedDay === day.dateStr ? 'highlight-glow' : ''}`}
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

                  {currentUser?.calendarConnected && (
                    <span className="upcoming-gcal-day-tag">
                      <Clock size={12} />
                      <span>Google Calendar Synced</span>
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

                {/* Inline Add Task Row with Priority & Intuitive Ongoing Time Picker */}
                {day.isPast ? (
                  <div className="upcoming-past-date-notice">
                    <span>Past date · New task additions disabled</span>
                  </div>
                ) : activeDayAdding === day.dateStr ? (
                  <form
                    onSubmit={(e) => handleInlineSubmit(e, day.dateStr)}
                    className="upcoming-inline-add-form animate-fade-in"
                  >
                    {/* Top Row: Task Title + Priority Selector */}
                    <div className="inline-form-top-row">
                      <input
                        type="text"
                        placeholder="What do you need to do? (e.g. Linux Video, Client Meeting)..."
                        value={inlineTaskTitle}
                        onChange={(e) => setInlineTaskTitle(e.target.value)}
                        autoFocus
                        className="upcoming-inline-input"
                      />

                      <div className="inline-priority-picker-row">
                        <span className="priority-picker-label">Priority:</span>
                        <div className="priority-picker-buttons">
                          <button
                            type="button"
                            className={`p-btn p-high ${inlineTaskPriority === 'high' ? 'active' : ''}`}
                            onClick={() => setInlineTaskPriority('high')}
                          >
                            <Flame size={12} />
                            <span>High</span>
                          </button>
                          <button
                            type="button"
                            className={`p-btn p-med ${inlineTaskPriority === 'medium' ? 'active' : ''}`}
                            onClick={() => setInlineTaskPriority('medium')}
                          >
                            <span>Medium</span>
                          </button>
                          <button
                            type="button"
                            className={`p-btn p-low ${inlineTaskPriority === 'low' ? 'active' : ''}`}
                            onClick={() => setInlineTaskPriority('low')}
                          >
                            <span>Low</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Middle: Intuitive Ongoing Time Picker Controls */}
                    <div className="inline-time-picker-panel">
                      <div className="time-picker-label-row">
                        <span className="time-picker-heading">
                          <Clock size={13} />
                          <span>Schedule Time: <strong>{format12Hour(inlineTaskTime)}</strong></span>
                        </span>

                        {/* Quick 1-Click Time Presets */}
                        <div className="time-presets-chips">
                          <button
                            type="button"
                            className="time-chip-btn active-pulse"
                            onClick={() => setInlineTaskTime(getOngoingTimeString())}
                            title="Set to Current Live Time"
                          >
                            <Zap size={11} />
                            <span>Now ({format12Hour(getOngoingTimeString())})</span>
                          </button>
                          <button
                            type="button"
                            className="time-chip-btn"
                            onClick={() => setInlineTaskTime('09:00')}
                          >
                            <Sun size={11} />
                            <span>Morning (9 AM)</span>
                          </button>
                          <button
                            type="button"
                            className="time-chip-btn"
                            onClick={() => setInlineTaskTime('13:00')}
                          >
                            <span>1:00 PM</span>
                          </button>
                          <button
                            type="button"
                            className="time-chip-btn"
                            onClick={() => setInlineTaskTime('17:00')}
                          >
                            <Sunset size={11} />
                            <span>5:00 PM</span>
                          </button>
                          <button
                            type="button"
                            className="time-chip-btn"
                            onClick={() => setInlineTaskTime('20:30')}
                          >
                            <Moon size={11} />
                            <span>8:30 PM</span>
                          </button>
                        </div>
                      </div>

                      {/* Custom Time Selector Selects (Easy 12-Hour Dropdowns) */}
                      <div className="time-custom-selector-container">
                        <span className="custom-time-label">Custom:</span>
                        <div className="time-selects-custom-row">
                          <select
                            className="easy-time-select"
                            value={(() => {
                              const [h] = (inlineTaskTime || '09:00').split(':').map(Number);
                              const h12 = h % 12 || 12;
                              return String(h12).padStart(2, '0');
                            })()}
                            onChange={(e) => {
                              const newH12 = parseInt(e.target.value, 10);
                              const [curH, curM] = (inlineTaskTime || '09:00').split(':').map(Number);
                              const isPM = curH >= 12;
                              let h24 = newH12 % 12;
                              if (isPM) h24 += 12;
                              setInlineTaskTime(`${String(h24).padStart(2, '0')}:${String(curM).padStart(2, '0')}`);
                            }}
                          >
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                              <option key={h} value={String(h).padStart(2, '0')}>
                                {h}
                              </option>
                            ))}
                          </select>
                          <span className="time-colon">:</span>
                          <select
                            className="easy-time-select"
                            value={(() => {
                              const [, m] = (inlineTaskTime || '09:00').split(':').map(Number);
                              return String(m || 0).padStart(2, '0');
                            })()}
                            onChange={(e) => {
                              const [curH] = (inlineTaskTime || '09:00').split(':').map(Number);
                              setInlineTaskTime(`${String(curH).padStart(2, '0')}:${e.target.value}`);
                            }}
                          >
                            {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                          
                          {/* AM/PM Toggle */}
                          <div className="am-pm-toggle-btns">
                            <button
                              type="button"
                              className={`am-pm-btn ${(parseInt(inlineTaskTime.split(':')[0], 10) || 0) < 12 ? 'active' : ''}`}
                              onClick={() => {
                                const [curH, curM] = inlineTaskTime.split(':').map(Number);
                                const h24 = curH >= 12 ? curH - 12 : curH;
                                setInlineTaskTime(`${String(h24).padStart(2, '0')}:${String(curM).padStart(2, '0')}`);
                              }}
                            >
                              AM
                            </button>
                            <button
                              type="button"
                              className={`am-pm-btn ${(parseInt(inlineTaskTime.split(':')[0], 10) || 0) >= 12 ? 'active' : ''}`}
                              onClick={() => {
                                const [curH, curM] = inlineTaskTime.split(':').map(Number);
                                const h24 = curH < 12 ? curH + 12 : curH;
                                setInlineTaskTime(`${String(h24).padStart(2, '0')}:${String(curM).padStart(2, '0')}`);
                              }}
                            >
                              PM
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom: Action Buttons */}
                    <div className="upcoming-inline-actions">
                      <button type="submit" className="upcoming-add-save-btn">
                        <CheckCircle2 size={14} />
                        <span>Add & Auto-Sync Task</span>
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
                    onClick={() => handleOpenAddForDay(day.dateStr)}
                  >
                    <Plus size={15} />
                    <span>Add task to {day.dayShort} {day.dayNum}</span>
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Infinite Dates Load More Button */}
          <div className="upcoming-load-more-section">
            <button
              type="button"
              className="upcoming-load-more-btn"
              onClick={() => setDaysCount(prev => prev + 30)}
            >
              <CalendarDays size={16} />
              <span>Load Next 30 Days of Future Dates ({daysCount + 30} days total)</span>
            </button>
          </div>
        </>
      )}

      {/* PAST DATES & HISTORY SECTION (Keeps past tasks 100% safe & intact) */}
      {pastTasks.length > 0 && (
        <div className="upcoming-past-history-section">
          <button
            type="button"
            className="past-history-toggle-btn"
            onClick={() => setShowPastHistory(!showPastHistory)}
          >
            <History size={16} />
            <span>Past Dates & Completed Tasks ({pastTasks.length} tasks preserved)</span>
            <ChevronRight size={16} style={{ transform: showPastHistory ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          {showPastHistory && (
            <div className="past-history-tasks-list animate-fade-in">
              <p className="past-history-notice">
                <AlertCircle size={14} />
                <span>All past completed and scheduled tasks are permanently preserved in your workspace history.</span>
              </p>
              {pastTasks.map((t) => (
                <TaskCard key={t.id} task={t} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
