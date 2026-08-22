// Realistic Initial Tasks matching todo-app-build-prompt spec

const getRelativeDate = (offsetDays, hours = 10, minutes = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
};

export const INITIAL_TASKS = [
  {
    id: "task_1",
    userId: "user_alex",
    title: "Review Q3 Marketing Campaign & Design Assets",
    description: "Go over Figma prototypes for the summer campaign, verify typography and color contrast benchmarks with the lead designer.",
    dueDate: getRelativeDate(0, 14, 30), // Today 2:30 PM
    priority: "high",
    status: "inprogress",
    tags: ["work", "design"],
    subtasks: [
      { id: "sub_101", title: "Review mobile viewport hero banner", done: true },
      { id: "sub_102", title: "Audit accessibility contrast ratios", done: true },
      { id: "sub_103", title: "Leave feedback comments in Figma", done: false },
      { id: "sub_104", title: "Sign off on final deliverable", done: false }
    ],
    googleEventId: "gcal_evt_991823",
    reminderOffsetsMinutes: [10, 60],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "task_2",
    userId: "user_alex",
    title: "Call Dentist to Confirm Wisdom Tooth Checkup",
    description: "Dr. Miller's clinic on 4th Avenue. Inquire if dental insurance pre-authorization went through.",
    dueDate: getRelativeDate(0, 16, 0), // Today 4:00 PM
    priority: "medium",
    status: "todo",
    tags: ["health", "personal"],
    subtasks: [
      { id: "sub_201", title: "Locate dental insurance card number", done: false },
      { id: "sub_202", title: "Call clinic (555-0192)", done: false }
    ],
    googleEventId: "gcal_evt_448201",
    reminderOffsetsMinutes: [60],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "task_3",
    userId: "user_alex",
    title: "Prepare Client Architecture Proposal for Next.js Migration",
    description: "Draft a 4-page executive summary focusing on SSR performance gains, Edge rendering, and cost reduction metrics.",
    dueDate: getRelativeDate(1, 11, 0), // Tomorrow 11:00 AM
    priority: "high",
    status: "todo",
    tags: ["work", "engineering"],
    subtasks: [
      { id: "sub_301", title: "Benchmark current page load speeds (LCP/FID)", done: true },
      { id: "sub_302", title: "Outline infrastructure diagram", done: false },
      { id: "sub_303", title: "Draft executive summary slide deck", done: false }
    ],
    googleEventId: "gcal_evt_772183",
    reminderOffsetsMinutes: [60, 1440],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "task_4",
    userId: "user_alex",
    title: "Renew Passport & Schedule Photo Appointment",
    description: "Expires in 4 months. Download DS-82 renewal form and check passport photo requirements.",
    dueDate: getRelativeDate(4, 9, 30), // 4 days later
    priority: "low",
    status: "todo",
    tags: ["personal", "travel"],
    subtasks: [
      { id: "sub_401", title: "Print DS-82 form", done: false },
      { id: "sub_402", title: "Get 2x2 passport photos at pharmacy", done: false },
      { id: "sub_403", title: "Mail via USPS Priority Express", done: false }
    ],
    googleEventId: null,
    reminderOffsetsMinutes: [1440],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "task_5",
    userId: "user_alex",
    title: "Grocery Restock & Meal Prep for Week",
    description: "Greek yogurt, organic berries, avocados, sourdough bread, salmon fillets, and olive oil.",
    dueDate: getRelativeDate(0, 18, 30), // Today 6:30 PM
    priority: "medium",
    status: "done",
    tags: ["personal", "lifestyle"],
    subtasks: [
      { id: "sub_501", title: "Check pantry inventory", done: true },
      { id: "sub_502", title: "Farmer's market grocery run", done: true },
      { id: "sub_503", title: "Pre-chop veggies for dinner", done: true }
    ],
    googleEventId: "gcal_evt_118932",
    reminderOffsetsMinutes: [10],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const INITIAL_USER = {
  uid: "user_alex",
  displayName: "Alex Turner",
  email: "alex.turner@gmail.com",
  calendarConnected: true,
  lastCalendarSync: "2 minutes ago",
  notificationPermission: true,
  reminderOffsets: [10, 60, 1440]
};
