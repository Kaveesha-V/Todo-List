// Client-side NLP Parser for intelligent natural language task entry

export const parseNaturalLanguageTask = (rawInput) => {
  if (!rawInput || !rawInput.trim()) {
    return {
      title: "",
      dueDate: null,
      priority: "medium",
      tags: [],
      suggestedSubtasks: []
    };
  }

  let text = rawInput.trim();
  let priority = "medium";
  let tags = [];
  let dueDate = null;
  let detectedTokens = [];

  // 1. Extract Tags (e.g., #work, #health, #travel)
  const tagMatches = text.match(/#([\w-]+)/g);
  if (tagMatches) {
    tagMatches.forEach(tag => {
      const cleanTag = tag.replace('#', '').toLowerCase();
      if (!tags.includes(cleanTag)) tags.push(cleanTag);
      detectedTokens.push({ type: 'tag', value: `#${cleanTag}` });
      text = text.replace(tag, '');
    });
  }

  // 2. Extract Priority (!high, !med, !low, !urgent, asap, high priority)
  if (/\b(!high|!urgent|urgent|asap|high priority|p1)\b/i.test(text)) {
    priority = "high";
    detectedTokens.push({ type: 'priority', value: 'High Priority', level: 'high' });
    text = text.replace(/\b(!high|!urgent|urgent|asap|high priority|p1)\b/gi, '');
  } else if (/\b(!med|!medium|medium priority|p2)\b/i.test(text)) {
    priority = "medium";
    detectedTokens.push({ type: 'priority', value: 'Medium Priority', level: 'medium' });
    text = text.replace(/\b(!med|!medium|medium priority|p2)\b/gi, '');
  } else if (/\b(!low|low priority|p3)\b/i.test(text)) {
    priority = "low";
    detectedTokens.push({ type: 'priority', value: 'Low Priority', level: 'low' });
    text = text.replace(/\b(!low|low priority|p3)\b/gi, '');
  }

  // 3. Extract Time & Dates
  const now = new Date();
  let targetDate = new Date();
  let hasDate = false;
  let targetHour = 10; // Default 10 AM
  let targetMinute = 0;

  // Check specific time: e.g. "at 3pm", "3:30pm", "at 4:00 pm", "17:00"
  const timeRegex = /\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i;
  const timeMatch = text.match(timeRegex);
  if (timeMatch) {
    let hour = parseInt(timeMatch[1], 10);
    const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const meridian = timeMatch[3].toLowerCase();

    if (meridian === 'pm' && hour < 12) hour += 12;
    if (meridian === 'am' && hour === 12) hour = 0;

    targetHour = hour;
    targetMinute = minute;
    hasDate = true;
    detectedTokens.push({ type: 'time', value: timeMatch[0] });
    text = text.replace(timeMatch[0], '');
  }

  // Check relative phrases: "tomorrow", "today", "tonight", "this evening", "in 2 hours", "next monday", etc.
  if (/\b(?:today|tonight|this evening)\b/i.test(text)) {
    hasDate = true;
    if (/\btonight|this evening\b/i.test(text) && !timeMatch) {
      targetHour = 19;
    }
    const match = text.match(/\b(?:today|tonight|this evening)\b/i)[0];
    detectedTokens.push({ type: 'date', value: match });
    text = text.replace(match, '');
  } else if (/\btomorrow\b/i.test(text)) {
    hasDate = true;
    targetDate.setDate(targetDate.getDate() + 1);
    detectedTokens.push({ type: 'date', value: 'Tomorrow' });
    text = text.replace(/\btomorrow\b/gi, '');
  } else if (/\bin\s+(\d+)\s+hours?\b/i.test(text)) {
    const hours = parseInt(text.match(/\bin\s+(\d+)\s+hours?\b/i)[1], 10);
    hasDate = true;
    targetDate = new Date(now.getTime() + hours * 60 * 60 * 1000);
    targetHour = targetDate.getHours();
    targetMinute = targetDate.getMinutes();
    detectedTokens.push({ type: 'date', value: `In ${hours}h` });
    text = text.replace(/\bin\s+\d+\s+hours?\b/gi, '');
  } else if (/\bnext\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i.test(text)) {
    const dayName = text.match(/\bnext\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i)[1].toLowerCase();
    const daysMap = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
    const targetDay = daysMap[dayName];
    const currentDay = now.getDay();
    let daysToAdd = (targetDay + 7 - currentDay) % 7;
    if (daysToAdd === 0) daysToAdd = 7; // next week
    targetDate.setDate(targetDate.getDate() + daysToAdd);
    hasDate = true;
    detectedTokens.push({ type: 'date', value: `Next ${dayName.charAt(0).toUpperCase() + dayName.slice(1)}` });
    text = text.replace(/\bnext\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi, '');
  } else if (/\bthis weekend\b/i.test(text)) {
    const currentDay = now.getDay();
    const daysToSaturday = (6 + 7 - currentDay) % 7;
    targetDate.setDate(targetDate.getDate() + (daysToSaturday === 0 ? 7 : daysToSaturday));
    hasDate = true;
    detectedTokens.push({ type: 'date', value: 'This Weekend' });
    text = text.replace(/\bthis weekend\b/gi, '');
  }

  let dueTime = null;
  let formattedDueDate = null;

  if (hasDate) {
    targetDate.setHours(targetHour, targetMinute, 0, 0);
    const pad = (n) => String(n).padStart(2, '0');
    formattedDueDate = `${targetDate.getFullYear()}-${pad(targetDate.getMonth() + 1)}-${pad(targetDate.getDate())}`;
    dueTime = `${pad(targetHour)}:${pad(targetMinute)}`;
    dueDate = formattedDueDate;
  }

  // 4. Clean up Title: Remove prefix noise like "remind me to", "i need to", "don't forget to", "todo:"
  let cleanTitle = text
    .replace(/^(?:remind me to|i need to|please|don't forget to|remember to|todo:?|task:?)\s+/i, '')
    .replace(/\s+/g, ' ')
    .replace(/^[,\s-:]+|[,\s-:]+$/g, '')
    .trim();

  // Capitalize first letter
  if (cleanTitle.length > 0) {
    cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
  }

  // Suggest tags if none provided based on keywords
  if (tags.length === 0 && cleanTitle) {
    const lower = cleanTitle.toLowerCase();
    if (/doctor|dentist|health|medicine|workout|gym|run/.test(lower)) tags.push("health");
    else if (/meeting|client|report|proposal|email|presentation|code|review/.test(lower)) tags.push("work");
    else if (/flight|hotel|trip|travel|passport|pack/.test(lower)) tags.push("travel");
    else if (/buy|grocery|shop|store|order/.test(lower)) tags.push("personal");
    else tags.push("general");
  }

  return {
    title: cleanTitle || rawInput.trim(),
    dueDate: formattedDueDate,
    dueTime,
    priority,
    tags,
    detectedTokens
  };
};
