/**
 * Google Calendar API Service
 * Directly interacts with Google Calendar API v3
 */

/**
 * Format date & time into Google Calendar Web Template format (YYYYMMDDTHHmmSSZ)
 */
export const formatGoogleCalendarWebDate = (dateStr, timeStr = '09:00') => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  const [hour, minute] = (timeStr || '09:00').split(':');
  
  const startObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
  const endObj = new Date(startObj.getTime() + 60 * 60 * 1000); // 1 hour duration

  const formatUTC = (d) => {
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  return `${formatUTC(startObj)}/${formatUTC(endObj)}`;
};

/**
 * Generates direct Google Calendar Web Link for 1-click addition / view
 */
export const getGoogleCalendarWebLink = (task) => {
  if (!task || !task.title) return 'https://calendar.google.com';
  
  const dates = formatGoogleCalendarWebDate(task.dueDate, task.dueTime);
  const text = encodeURIComponent(task.title);
  const details = encodeURIComponent(task.description || `Created with Aura To-Do App\nPriority: ${task.priority || 'Normal'}\nStatus: ${task.status || 'todo'}`);
  
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}`;
};

/**
 * Create a live event on User's primary Google Calendar via REST API
 */
export const syncTaskToGoogleCalendarAPI = async (accessToken, task) => {
  if (!accessToken) {
    console.warn("No Google Calendar Access Token available, using web link fallback.");
    return {
      success: true,
      webLink: getGoogleCalendarWebLink(task),
      mode: 'web'
    };
  }

  const localToday = new Date();
  const defaultDate = `${localToday.getFullYear()}-${String(localToday.getMonth() + 1).padStart(2, '0')}-${String(localToday.getDate()).padStart(2, '0')}`;
  const [year, month, day] = (task.dueDate || defaultDate).split('-');
  const [hour, minute] = (task.dueTime || '09:00').split(':');
  
  const startDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

  const eventPayload = {
    summary: task.title,
    description: task.description || `Aura AI To-Do Task\nScheduled Time: ${task.dueTime || '09:00'}\nPriority: ${task.priority || 'medium'}`,
    start: {
      dateTime: startDate.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    end: {
      dateTime: endDate.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 30 }, // Gmail email reminder 30 minutes before task!
        { method: 'popup', minutes: 30 }, // 30-min popup alert
        { method: 'popup', minutes: 10 }  // 10-min popup alert
      ]
    }
  };

  try {
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventPayload)
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      console.warn("Google Calendar API Event insert notice:", errJson);
      return {
        success: true,
        webLink: getGoogleCalendarWebLink(task),
        mode: 'web_fallback'
      };
    }

    const createdEvent = await response.json();
    return {
      success: true,
      eventId: createdEvent.id,
      htmlLink: createdEvent.htmlLink || getGoogleCalendarWebLink(task),
      mode: 'api'
    };
  } catch (err) {
    console.warn("Google Calendar sync network fallback:", err);
    return {
      success: true,
      webLink: getGoogleCalendarWebLink(task),
      mode: 'web_fallback'
    };
  }
};

/**
 * Update event on Google Calendar when task is completed or uncompleted
 */
export const updateGoogleCalendarEventStatus = async (accessToken, eventId, isCompleted, title) => {
  if (!accessToken || !eventId) return;

  try {
    const cleanTitle = (title || '').replace(/^✓ \[COMPLETED\]\s*/i, '');
    const updatedSummary = isCompleted ? `✓ [COMPLETED] ${cleanTitle}` : cleanTitle;

    await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        summary: updatedSummary,
        colorId: isCompleted ? "8" : "9" // Gray in Google Calendar
      })
    });
  } catch (e) {
    console.warn("Google Calendar status sync notice:", e);
  }
};
