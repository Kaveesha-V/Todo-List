// Date utilities for human-friendly formatting and date manipulation

export const formatFriendlyDate = (isoString) => {
  if (!isoString) return null;
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return null;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  const timeString = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  if (diffDays === 0) {
    return {
      text: `Today, ${timeString}`,
      isToday: true,
      isOverdue: date < now,
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
      text: `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeString}`,
      isToday: false,
      isOverdue: true,
      tag: 'overdue'
    };
  } else {
    return {
      text: `${date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}, ${timeString}`,
      isToday: false,
      isOverdue: false,
      tag: 'upcoming'
    };
  }
};

export const formatCalendarEventTime = (isoString) => {
  if (!isoString) return "No calendar event synced";
  const date = new Date(isoString);
  const end = new Date(date.getTime() + 45 * 60 * 1000); // 45 min event
  const startTime = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const endTime = end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
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
