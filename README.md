# Build Prompt: AI-Powered Real-Time To-Do App with Google Calendar Sync

Use this as a prompt for an AI coding assistant (Claude Code, Cursor, v0, etc.) or as your own project spec.

---

## Project Overview

Build a personal to-do list web app with:
1. **Real-time sync** across devices/tabs
2. **AI assistance** for task creation, prioritization, and breakdown
3. **Google Calendar integration** — tasks with due dates/times appear as calendar events
4. **Smart reminders/notifications** for upcoming or overdue tasks

Multi-user from the start, with proper auth and data isolation — every user's tasks must be private and inaccessible to others by default.

---

## ⚠️ A Note on "No Database"

You cannot have persistent user accounts (Google login OR email/password login) **without some form of database**. Even "serverless" backends like Firebase or Supabase *are* databases — they're just managed for you so you don't run your own server. What you're avoiding is the *hassle* of managing a database, not the database itself. There's no working alternative that keeps users logged in and their tasks saved across sessions without storing that data somewhere persistent.

**Recommendation:** use a managed backend (Firebase or Supabase) — you get the database, auth, security rules, and hosting bundled together, so it *feels* like "no database to manage" even though technically there is one.

---

## Multi-User Auth Options

Support **both** login methods:

1. **Google Sign-In (OAuth 2.0)** — one-click login using the user's Google account with authentic account chooser popup. This is also required anyway for Google Calendar access, so it's the easiest path for Google users.
2. **Email + Password (custom accounts)** — for users without/not wanting to use Google:
   - Password is **never stored in plain text**
   - Hash with **bcrypt** or **argon2** (both include salting automatically — you don't need to manage salt separately, the library handles it per-password)
   - Store only the resulting hash in the database, never the raw password
   - Enforce a minimum password strength on signup
   - Use HTTPS everywhere, secure HTTP-only cookies or short-lived JWTs for sessions (never store tokens in localStorage — vulnerable to XSS)
   - Add basic protections: rate-limit login attempts (prevent brute force), email verification on signup, "forgot password" flow via a time-limited reset token sent by email

If using Firebase Auth or Supabase Auth, **both of the above are built in** — you don't need to write your own hashing logic; the service handles bcrypt/salting, session tokens, and email verification for you. Only build custom auth from scratch if you have a specific reason not to use a managed provider.

---

## Keep It Simple for First-Time Users

The app should feel obvious within 10 seconds of opening it — no manual needed.

- **Core loop first**: the main screen shows only *add a task* + *task list* + *checkbox to complete*. That's it, front and center.
- **Advanced features tucked away**: AI parsing, Calendar sync, and reminders should feel like *optional enhancements*, not requirements to understand before adding your first task. Example: a small "✨ Try typing naturally" hint under the input box, not a forced tutorial.
- **One primary action per screen** — don't show Kanban view, tags, subtasks, and AI digest all at once on first load. Add a simple/advanced toggle, or reveal complexity progressively as the user explores.
- **Plain language, not jargon** — buttons say "Add task", "Remind me", "Connect Google Calendar" — not "Sync", "Provision", "OAuth".
- **Sensible defaults** — new tasks default to no priority/no reminder so the user isn't forced to fill out a form just to jot something down.

---

## Core Features

### 1. Task Management
- Create, edit, delete, complete/uncomplete tasks
- Fields per task: title, description, due date + time, priority (low/med/high), tags/category, subtasks (checklist), status (todo/in-progress/done)
- Drag-and-drop reordering and list/board (kanban) view toggle

### 2. Real-Time Sync
- Changes made on one device/tab reflect instantly on others (no manual refresh)
- Use a backend with live sync support:
  - **Firebase Firestore** (realtime listeners) — simplest for personal projects
  - or **Supabase** (Postgres + Realtime channels) — if you prefer SQL
  - or a WebSocket layer (Socket.io) on top of your own DB if self-hosting

### 3. AI Features
- **Natural language task entry**: type "remind me to call the dentist next Tuesday at 3pm" → AI parses this into a structured task (title, due date/time) automatically
- **Auto-prioritization**: AI suggests priority level based on task wording/urgency and existing workload
- **Task breakdown**: for a vague/large task ("plan trip to Japan"), AI suggests a checklist of subtasks
- **Daily/weekly digest**: AI generates a short summary each morning of what's due, overdue, and suggests what to focus on first
- **Recommended model: Google Gemini API (free tier)** — good free quota, and since you're already using Google Sign-In + Google Calendar, staying in the Google ecosystem keeps things simpler (one Google Cloud project for everything). OpenAI's free tier is very limited/trial-only, so Gemini is the more practical free option here.
- Call the Gemini API from a backend function only — **never expose the API key in client-side code**

### 4. Google Calendar Integration — APIs you need to enable
In Google Cloud Console, under **APIs & Services → Library**, enable these:
1. **Google Calendar API** — required. This lets your app create/read/update calendar events.
2. **Google Identity Services / OAuth 2.0** (not a separate "API" to enable, but you configure an **OAuth consent screen** + **OAuth Client ID** under APIs & Services → Credentials) — required for Google Sign-In and for requesting Calendar access permission.
3. **Generative Language API (Gemini API)** — enable this too if using Gemini, and generate an API key under APIs & Services → Credentials.

Then in your app:
- OAuth 2.0 connection to the user's Google account, requesting the `https://www.googleapis.com/auth/calendar.events` scope
- When a task has a due date/time, create/update a matching Calendar event
- Two-way sync (optional, more complex): editing the event in Google Calendar updates the task
- Store the Google `eventId` alongside the task record so updates/deletes stay linked

### 5. Reminders
- Browser push notifications (Web Push API) for tasks approaching their due time
- Optional: email reminders (via a scheduled backend job) for tasks due within 24 hours
- Configurable reminder offsets (e.g., 10 min / 1 hr / 1 day before due time)
- A scheduled job (cron, or Firebase Cloud Functions scheduled trigger) checks upcoming due tasks and fires notifications

### 6. Multi-User Auth & Security
- **Authentication**: support both **Google Sign-In** and **email/password** login via Firebase Auth or Supabase Auth — this also conveniently doubles as the Calendar OAuth consent step for Google users
- **Data isolation**: every task record is scoped to a `userId`; a user can only ever read/write their own tasks
  - Firestore: enforce with **Security Rules** (`request.auth.uid == resource.data.userId`), not just client-side filtering
  - Supabase: enforce with **Row Level Security (RLS)** policies on the `tasks` table
- **Never trust the client**: all reads/writes go through security rules or RLS, not just app logic — a malicious client should never be able to query another user's data even by guessing IDs
- **API keys & secrets**: Gemini API key and Google API credentials live only in backend/serverless functions (environment variables), never shipped to the browser
- **Token handling**: Google OAuth refresh tokens (needed for Calendar sync) are stored encrypted server-side, never in browser storage (no localStorage/sessionStorage for tokens)
- **Session security**: use short-lived ID tokens for API calls, verified server-side on every request (e.g. Firebase Admin SDK `verifyIdToken`)
- **Rate limiting**: throttle AI-parsing and Calendar API calls per user to avoid abuse and control cost
- **Account deletion**: provide a way for a user to delete their account and all associated tasks/tokens (basic data-privacy hygiene)

---

## Suggested Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React (Vite) |
| Styling | Vanilla CSS Design System |
| Realtime DB | Firebase Firestore (or Supabase) |
| Auth | Firebase Auth or Google OAuth 2.0 + Email/Password |
| AI | Google Gemini API (free tier) via backend/serverless function |
| Calendar | Google Calendar API v3 |
| Notifications | Web Push API + Scheduled Cloud Functions |
| Hosting | Vercel / Firebase Hosting |

---

## Data Model (example)

```json
{
  "id": "task_123",
  "userId": "user_abc",
  "title": "Call dentist",
  "description": "",
  "dueDate": "2026-08-25T15:00:00Z",
  "priority": "medium",
  "status": "todo",
  "tags": ["health"],
  "subtasks": [
    { "id": "sub_1", "title": "Find phone number", "done": false }
  ],
  "googleEventId": "abc123xyz",
  "reminderOffsetsMinutes": [60, 1440],
  "createdAt": "2026-08-22T10:00:00Z",
  "updatedAt": "2026-08-22T10:00:00Z"
}
```

---

## Quick Start

1. **Install dependencies**: `npm install`
2. **Start development server**: `npm run dev`
3. **Build for production**: `npm run build`


