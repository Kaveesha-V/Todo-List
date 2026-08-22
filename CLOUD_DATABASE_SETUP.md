# ☁️ Cloud Database Setup Guide (Firebase Firestore)

This guide walks you through setting up your **Firebase Cloud Database (Firestore)** in under 2 minutes for real-time task synchronization across all devices and tabs.

---

## 🚀 Step 1: Create a Free Firebase Project

1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** (or **Create a project**).
3. Name your project (e.g. `aura-todo-app`) and click **Continue**.
4. (Optional) Disable or enable Google Analytics and click **Create project**.

---

## 🗄️ Step 2: Enable Cloud Firestore Database

1. In the left sidebar under **Build**, click **Firestore Database**.
2. Click **Create database**.
3. Choose your database location (e.g. `nam5 (us-central)` or `asia-south1`).
4. Select **Start in production mode** (or test mode) and click **Create**.

---

## 🔑 Step 3: Register Web App & Get API Keys

1. In your Firebase Project Overview, click the **Web icon (`</>`)** to add an app.
2. Give your web app a nickname (e.g. `Aura Web`) and click **Register app**.
3. Copy the `firebaseConfig` keys shown on the screen.

---

## ⚙️ Step 4: Add Keys to `.env` File

Open the `.env` file in your project root (`e:\Degree\IT\To-Do\.env`) and fill in your keys:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=aura-todo-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=aura-todo-app
VITE_FIREBASE_STORAGE_BUCKET=aura-todo-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

---

## 🔒 Step 5: Deploy Security Rules

To enforce strict multi-user privacy so each user can only read/write their own tasks:

1. In Firebase Console, go to **Firestore Database** → **Rules** tab.
2. Paste the rules from [`firestore.rules`](./firestore.rules):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /tasks/{taskId} {
      allow read, update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }
  }
}
```
3. Click **Publish**.

---

## ✅ Step 6: Test Cloud Sync

1. Restart your development server:
   ```bash
   npm run dev
   ```
2. Open `http://localhost:5180` in two different browser windows or devices.
3. Sign in to your account on both.
4. Add a task on one window — it will instantly appear in real-time on the other without refreshing!
