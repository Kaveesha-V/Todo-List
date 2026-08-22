# ⚡ Aura — AI-Powered Personal To-Do & Focus Web App

> A clean, minimalist, modern personal to-do list web application with AI natural language parsing, Google Calendar integration, AI daily digests, slide-in task details drawer, Kanban board view, authentic Google OAuth Account Chooser, and light/dark theme support.

---

## 🌟 Key Highlights

- **🔒 Multi-User Auth & Strict Data Isolation**: Supports both **Google OAuth 2.0** (with authentic Google Account Chooser popup & 1-click login) and **Email/Password** accounts. Every user's tasks are strictly private and isolated.
- **✨ Natural-Language Task Entry**: Type naturally like `"Schedule team sync tomorrow at 3pm #work !high"` or `"Book flights next Friday 10am #travel"`. The smart NLP engine extracts dates, times, priority levels, and category tags automatically in real time.
- **📅 Google Calendar Integration**: Sync tasks with due dates/times directly to Google Calendar with linked event tracking, sync badges, and consent permissions.
- **🤖 AI Subtask Breakdown**: Break down vague or complex tasks into actionable checklists with a single click (*"Break down with AI"*).
- **☀️ AI Daily Digest**: Intelligent morning briefing summarizing today's schedule, overdue items, priority breakdown, and a one-click *Suggested Focus* action.
- **📋 Flexible Views**:
  - **List View**: Grouped task cards with completion animations and celebratory confetti.
  - **Kanban Board View**: 3-column workflow (*To Do*, *In Progress*, *Done*) with seamless stage transition controls.
- **🗂️ Slide-in Task Detail Panel**: Comprehensive task editor with subtask checklists, reminder offset configurations (10m, 1h, 1d), Google Calendar event status, and tag management.
- **🎨 Modern Glassmorphic Design**: Curated color palette, smooth micro-interactions, responsive layout, and persistent Light / Dark mode.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite |
| **Styling** | Custom Vanilla CSS Design System (Design Tokens, Glassmorphism, CSS Variables) |
| **Icons** | Lucide React |
| **Micro-Interactions** | Canvas-Confetti |
| **Auth** | Google OAuth 2.0 (Account Chooser) + Custom Secure Email/Password |
| **Storage & State** | Reactive State with Isolated LocalStorage persistence & multi-tab synchronization |

---

## 📦 Data Model

```json
{
  "id": "task_1724345678901",
  "userId": "usr_g_kaveesha_1",
  "title": "Schedule team sync",
  "description": "Weekly alignment on sprint goals and deliverables.",
  "dueDate": "2026-08-25T15:00:00.000Z",
  "priority": "high",
  "status": "todo",
  "tags": ["work"],
  "subtasks": [
    { "id": "sub_1", "title": "Prepare slide deck", "done": false },
    { "id": "sub_2", "title": "Send calendar invites", "done": true }
  ],
  "googleEventId": "gcal_evt_492019",
  "reminderOffsetsMinutes": [10, 60],
  "createdAt": "2026-08-22T10:00:00.000Z",
  "updatedAt": "2026-08-22T10:00:00.000Z"
}
```

---

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/Kaveesha-V/To-DO-List.git
cd To-DO-List
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start development server
```bash
npm run dev
```

### 4. Open in your browser
Navigate to `http://localhost:5180/` (or port indicated in your terminal).

---

## 🏗️ Production Build

```bash
npm run build
```

Preview the production build locally:
```bash
npm run preview
```

---

## 📄 License

MIT © [Kaveesha Vimukthi](https://github.com/Kaveesha-V)

