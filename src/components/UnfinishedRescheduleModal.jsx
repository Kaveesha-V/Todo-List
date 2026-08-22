import React, { useState } from 'react';
import { useTodo } from '../context/TodoContext';
import { getLocalDateString } from '../utils/dateUtils';
import {
  Calendar,
  Clock,
  ArrowRight,
  RotateCcw,
  X,
  CheckCircle2,
  CalendarDays,
  AlertCircle
} from 'lucide-react';

export const UnfinishedRescheduleModal = ({ task, isOpen, onClose }) => {
  const { updateTask, addToast } = useTodo();

  const todayStr = getLocalDateString();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = getLocalDateString(tomorrow);

  const dayAfterTomorrow = new Date();
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  const dayAfterTomorrowStr = getLocalDateString(dayAfterTomorrow);

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekStr = getLocalDateString(nextWeek);

  const [selectedDate, setSelectedDate] = useState(tomorrowStr);
  const [selectedTime, setSelectedTime] = useState(task?.dueTime || '09:00');
  const [rescheduleReason, setRescheduleReason] = useState('Needs more time');

  if (!isOpen || !task) return null;

  const handleConfirmReschedule = (e) => {
    e.preventDefault();
    if (!selectedDate) return;

    updateTask(task.id, {
      dueDate: selectedDate,
      dueTime: selectedTime,
      status: 'todo', // Reset to active for future date
      rescheduledFrom: task.dueDate || todayStr,
      rescheduledReason: rescheduleReason,
      updatedAt: new Date().toISOString()
    });

    addToast(`Moved "${task.title}" to ${selectedDate} (${selectedTime}) 📅`, 'success');
    onClose();
  };

  const quickPresets = [
    { label: '🌅 Tomorrow', date: tomorrowStr, desc: 'Next working day' },
    { label: '☀️ In 2 Days', date: dayAfterTomorrowStr, desc: 'Mid-week follow-up' },
    { label: '📅 Next Week', date: nextWeekStr, desc: '7 days from now' }
  ];

  return (
    <div className="reschedule-modal-backdrop animate-fade-in" onClick={onClose}>
      <div className="reschedule-modal-card animate-scale-in" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="reschedule-modal-header">
          <div className="reschedule-header-icon">
            <RotateCcw size={18} />
          </div>
          <div>
            <h2 className="reschedule-modal-title">Mark as Unfinished & Move to Future Date</h2>
            <p className="reschedule-modal-sub">
              Task: <strong>{task.title}</strong>
            </p>
          </div>
          <button type="button" className="reschedule-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleConfirmReschedule} className="reschedule-form-body">
          {/* Quick Date Presets */}
          <div className="reschedule-section">
            <label className="reschedule-section-label">Select Future Date:</label>
            <div className="reschedule-presets-grid">
              {quickPresets.map((preset) => (
                <button
                  key={preset.date}
                  type="button"
                  className={`reschedule-preset-btn ${selectedDate === preset.date ? 'active' : ''}`}
                  onClick={() => setSelectedDate(preset.date)}
                >
                  <span className="preset-name">{preset.label}</span>
                  <span className="preset-desc">{preset.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date & Time Inputs */}
          <div className="reschedule-custom-row">
            <div className="reschedule-input-group">
              <label className="reschedule-input-label">Custom Date:</label>
              <input
                type="date"
                min={tomorrowStr}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="reschedule-date-input"
                required
              />
            </div>

            <div className="reschedule-input-group">
              <label className="reschedule-input-label">Schedule Time:</label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="reschedule-date-input"
                required
              />
            </div>
          </div>

          {/* Reason Note (Optional) */}
          <div className="reschedule-section" style={{ marginTop: '10px' }}>
            <label className="reschedule-input-label">Reschedule Note / Reason:</label>
            <select
              value={rescheduleReason}
              onChange={(e) => setRescheduleReason(e.target.value)}
              className="reschedule-date-input"
              style={{ width: '100%' }}
            >
              <option value="Needs more time">⏳ Needs more focus & time</option>
              <option value="Waiting on external input / dependencies">🤝 Waiting on external input / team</option>
              <option value="Priority shifted to other urgent tasks">🔥 Priority shifted to higher impact item</option>
              <option value="Postponed to upcoming sprint">🗓️ Postponed to upcoming schedule</option>
            </select>
          </div>

          {/* Actions */}
          <div className="reschedule-actions-row">
            <button type="button" className="reschedule-cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="reschedule-confirm-btn">
              <ArrowRight size={15} />
              <span>Reschedule Task to {selectedDate}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
