// Date utilities for human-friendly formatting and date manipulation

export const getLocalDateString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getOngoingTimeString = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

export const formatFriendlyDate = (dateInput, timeInput = null) => {
  if (!dateInput) return null;
  
  let targetYear, targetMonth, targetDayNum;
  let hours = 9, minutes = 0;

  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateInput)) {
    // If dateInput is YYYY-MM-DD or starts with YYYY-MM-DD
    const parts = dateInput.substring(0, 10).split('-').map(Number);
    targetYear = parts[0];
    targetMonth = parts[1] - 1;
    targetDayNum = parts[2];

    if (timeInput && typeof timeInput === 'string') {
      const tParts = timeInput.split(':').map(Number);
      if (tParts.length >= 2) {
        hours = tParts[0] || 0;
        minutes = tParts[1] || 0;
      }
    } else if (dateInput.includes('T')) {
      const d = new Date(dateInput);
      if (!isNaN(d.getTime())) {
        hours = d.getHours();
        minutes = d.getMinutes();
      }
    }
  } else {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return null;
    targetYear = d.getFullYear();
    targetMonth = d.getMonth();
    targetDayNum = d.getDate();
    hours = d.getHours();
    minutes = d.getMinutes();
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDay = new Date(targetYear, targetMonth, targetDayNum);

  // Exact calendar day difference
  const diffTime = targetDay.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  // Build display date and time string
  const displayObj = new Date(targetYear, targetMonth, targetDayNum, hours, minutes);
  const timeString = displayObj.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

  if (diffDays === 0) {
    return {
      text: `Today, ${timeString}`,
      isToday: true,
      isOverdue: false,
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
      text: `${displayObj.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeString}`,
      isToday: false,
      isOverdue: true,
      tag: 'overdue'
    };
  } else {
    return {
      text: `${displayObj.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}, ${timeString}`,
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
