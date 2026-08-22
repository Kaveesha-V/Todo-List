// Date utilities for human-friendly formatting and date manipulation

export const getOngoingTimeString = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

export const formatFriendlyDate = (dateInput, timeInput = null) => {
  if (!dateInput) return null;
  
  let targetDate;
  
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    const [year, month, day] = dateInput.split('-').map(Number);
    let hours = 9, minutes = 0;
    if (timeInput && typeof timeInput === 'string') {
      const parts = timeInput.split(':');
      if (parts.length >= 2) {
        hours = parseInt(parts[0], 10) || 0;
        minutes = parseInt(parts[1], 10) || 0;
      }
    }
    targetDate = new Date(year, month - 1, day, hours, minutes, 0);
  } else {
    targetDate = new Date(dateInput);
  }

  if (isNaN(targetDate.getTime())) return null;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());

  const diffTime = targetDay.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  const timeString = targetDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

  if (diffDays === 0) {
    return {
      text: `Today, ${timeString}`,
      isToday: true,
      isOverdue: false, // Don't mark today's tasks as overdue during the day
      tag: 'today'
    };
  } else if (diffDays === 1) {
    return {
      text: `Tomorrow, ${timeString}`,
      isToday: false,
      isOverdue: false,
      tag: 'tomorrow'
    };
  } else if (diffDays === -1) {
    return {
      text: `Yesterday, ${timeString}`,
      isToday: false,
      isOverdue: true,
      tag: 'overdue'
    };
  } else if (diffDays < -1) {
    return {
      text: `${targetDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeString}`,
      isToday: false,
      isOverdue: true,
      tag: 'overdue'
    };
  } else {
    return {
      text: `${targetDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}, ${timeString}`,
      isToday: false,
      isOverdue: false,
      tag: 'upcoming'
    };
  }
};

export const formatCalendarEventTime = (isoString) => {
  if (!isoString) return "No calendar event synced";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "Invalid date";
  const end = new Date(date.getTime() + 45 * 60 * 1000); // 45 min event
  const startTime = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  const endTime = end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} • ${startTime} - ${endTime}`;
};

export const toInputDateTimeString = (isoString) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "";
  const pad = (n) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const quickDateOffset = (offsetDays, hours = 9, minutes = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
};
