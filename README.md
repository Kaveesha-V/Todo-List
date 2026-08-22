# ⚡ Aura — AI-Powered Personal To-Do & Focus Web App

> A clean, minimalist, modern personal to-do list web application with AI natural language parsing, Google Calendar integration, AI daily digests, slide-in task details drawer, Kanban board view, and light/dark theme support.

---

## ✨ Features

- **Natural-Language Task Entry**: Type natural phrasing like `"Schedule team sync tomorrow at 3pm #work !high"` or `"Book flights next Friday 10am #travel"`. The smart NLP engine extracts dates, times, priority levels, and category tags in real time.
- **AI Daily Digest**: Smart morning digest card summarizing today's priorities, overdue warnings, scheduled workload, and a one-click *Suggested Focus* action.
- **Task Management**: Create, edit, prioritize (Low / Medium / High), schedule due dates, assign tags, and track subtask checklist progress.
- **Interactive Views**:
  - **List View**: Grouped task cards with completion animations and celebratory confetti.
  - **Kanban Board View**: 3-column workflow (*To Do*, *In Progress*, *Done*) with easy stage transition controls.
- **Task Detail Slide-in Panel (Drawer)**:
  - Slide-in side drawer for in-depth editing.
  - **Google Calendar Synced Badge**: View calendar event times and trigger instant calendar syncs.
  - **AI Subtask Breakdown**: One-click *"Break down with AI"* button that automatically breaks complex goals into actionable checklists.
  - Editable subtasks with progress indicator.
  - Reminder notification offset configurations (*10 min*, *1 hr*, *1 day before*).
- **Settings & Reminders**:
  - Push notification controls.
  - Connected Google Calendar account card with sync timestamp.
  - Multi-user isolation security structure & JSON backup export.
- **Aesthetics & Theming**:
  - Minimal, calm, uncluttered UI with soft rounded corners and curated color palette.
  - Seamless Light and Dark mode with persistent state.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite
- **Styling**: Vanilla CSS Custom Design System (CSS custom variables, glassmorphism, responsive)
- **Icons**: Lucide React
- **Micro-Interactions**: Canvas-Confetti
- **State & Storage**: Reactive state with LocalStorage persistence & multi-tab sync listeners

---

## 🚀 Quick Start

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Kaveesha-V/To-DO-List.git
   cd To-DO-List
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Open in browser**:
   Navigate to `http://localhost:5180/`

---

## 📦 Build for Production

```bash
npm run build
```

---

## 📄 License

MIT
