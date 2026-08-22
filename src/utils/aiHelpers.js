// AI Assistant Helpers: Daily Digest Generator & Subtask Breakdown

/**
 * Generates an intelligent AI Daily Digest based on user's active tasks
 */
export const generateDailyDigest = (tasks) => {
  const activeTasks = tasks.filter(t => t.status !== 'done');
  const completedToday = tasks.filter(t => t.status === 'done').length;
  
  const now = new Date();
  const overdueTasks = activeTasks.filter(t => t.dueDate && new Date(t.dueDate) < now);
  const todayTasks = activeTasks.filter(t => {
    if (!t.dueDate) return false;
    const d = new Date(t.dueDate);
    return d.toDateString() === now.toDateString() && d >= now;
  });
  const highPriorityTasks = activeTasks.filter(t => t.priority === 'high');

  let summary = "";
  let focusTask = null;

  if (activeTasks.length === 0) {
    summary = "You are all caught up! No pending tasks remaining. Great time to plan upcoming goals or take a mindful break.";
  } else if (overdueTasks.length > 0) {
    focusTask = overdueTasks[0];
    summary = `You have ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''} needing attention, alongside ${todayTasks.length} task${todayTasks.length !== 1 ? 's' : ''} scheduled for today. We recommend tackling "${focusTask.title}" first.`;
  } else if (highPriorityTasks.length > 0) {
    focusTask = highPriorityTasks[0];
    summary = `You have ${highPriorityTasks.length} high-priority item${highPriorityTasks.length > 1 ? 's' : ''} today. Recommended focus: complete "${focusTask.title}" before afternoon.`;
  } else if (todayTasks.length > 0) {
    focusTask = todayTasks[0];
    summary = `You have ${todayTasks.length} scheduled item${todayTasks.length > 1 ? 's' : ''} for today. Workload is well balanced across your categories.`;
  } else {
    focusTask = activeTasks[0];
    summary = `You have ${activeTasks.length} upcoming task${activeTasks.length > 1 ? 's' : ''}. Pace yourself and prepare for the week ahead.`;
  }

  return {
    summary,
    overdueCount: overdueTasks.length,
    todayCount: todayTasks.length,
    highPriorityCount: highPriorityTasks.length,
    completedCount: completedToday,
    totalActive: activeTasks.length,
    recommendedFocus: focusTask ? focusTask.title : null,
    focusTaskId: focusTask ? focusTask.id : null,
    generatedAt: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  };
};

/**
 * Intelligent AI Subtask Breakdown Generator
 */
export const generateSubtasksForTask = (taskTitle, currentSubtasks = []) => {
  const titleLower = taskTitle.toLowerCase();
  let suggestions = [];

  if (/trip|travel|flight|vacation|japan|paris|hotel|pack/i.test(titleLower)) {
    suggestions = [
      "Check passport validity and visa entry requirements",
      "Book flights and compare airline baggage policies",
      "Reserve accommodations & save confirmation emails",
      "Create day-by-day sightseeing itinerary",
      "Pack luggage & convert currency / check credit card travel fees"
    ];
  } else if (/proposal|presentation|deck|slide|pitch/i.test(titleLower)) {
    suggestions = [
      "Define target audience objectives & key takeaways",
      "Outline core slide sections and narrative flow",
      "Gather relevant data metrics and case study proofs",
      "Design high-fidelity visuals & slide animations",
      "Do dry-run practice timing (aim for 15-20 mins)"
    ];
  } else if (/dentist|doctor|appointment|checkup|health/i.test(titleLower)) {
    suggestions = [
      "Check medical/dental insurance pre-authorization",
      "Prepare list of symptoms or routine questions",
      "Set calendar reminder 1 hour before departure",
      "Collect past medical records or prescription info"
    ];
  } else if (/code|migration|react|app|refactor|feature|bug/i.test(titleLower)) {
    suggestions = [
      "Analyze current architecture & identify edge cases",
      "Write technical specification and API contracts",
      "Implement core logic and component hierarchy",
      "Add unit tests and verify cross-browser responsiveness",
      "Open PR and solicit code review feedback"
    ];
  } else if (/groceries|meal|prep|dinner|cook|party/i.test(titleLower)) {
    suggestions = [
      "Check pantry & refrigerator stock",
      "Write categorized shopping list",
      "Shop for fresh ingredients & pantry staples",
      "Wash, chop, and portion ingredients in containers"
    ];
  } else {
    suggestions = [
      `Research initial requirements for "${taskTitle}"`,
      "Draft first outline / actionable checklist",
      "Execute the core implementation step",
      "Review and verify final quality",
      "Mark deliverable as complete"
    ];
  }

  // Filter out any subtasks that already exist
  const existingTitles = new Set(currentSubtasks.map(s => s.title.toLowerCase()));
  const newItems = suggestions
    .filter(s => !existingTitles.has(s.toLowerCase()))
    .map((s, idx) => ({
      id: `sub_ai_${Date.now()}_${idx}`,
      title: s,
      done: false
    }));

  return newItems;
};
