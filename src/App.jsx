import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TodoProvider, useTodo } from './context/TodoContext';
import { Header } from './components/Header';
import { AIDailyDigest } from './components/AIDailyDigest';
import { NaturalLanguageInput } from './components/NaturalLanguageInput';
import { TaskFilterBar } from './components/TaskFilterBar';
import { TaskListView } from './components/TaskListView';
import { KanbanBoardView } from './components/KanbanBoardView';
import { TaskDetailPanel } from './components/TaskDetailPanel';
import { SettingsModal } from './components/SettingsModal';
import { AuthScreen } from './components/AuthScreen';
import { GoogleOAuthModal } from './components/GoogleOAuthModal';
import { ToastContainer } from './components/Toast';
import { Sparkles, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';

const DashboardContent = () => {
  const {
    currentUser,
    googleModalOpen,
    setGoogleModalOpen,
    signInWithGoogleAccount
  } = useAuth();
  const { viewMode } = useTodo();
  const [showAdvanced, setShowAdvanced] = useState(false);

  // If no user is logged in, show the secure Auth Screen
  if (!currentUser) {
    return (
      <div className="app-container">
        <AuthScreen />
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* App Header */}
      <Header />

      {/* Main Content Area */}
      <main className="main-content">
        {/* Core Simple Experience: Add Task Bar First */}
        <NaturalLanguageInput />

        {/* Simple vs Advanced Expandable Toggle */}
        <div className="advanced-toggle-row">
          <button
            type="button"
            className={`advanced-toggle-btn ${showAdvanced ? 'active' : ''}`}
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <Sparkles size={14} style={{ color: 'var(--ai-purple)' }} />
            <span>{showAdvanced ? 'Hide Advanced Tools (AI Digest & Kanban)' : '✨ Advanced Tools (AI Digest, Kanban & Filters)'}</span>
            {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {/* Advanced Features Section: AI Daily Digest & Filter / View Switcher */}
        {showAdvanced && (
          <div className="advanced-features-container animate-fade-in">
            {/* AI Daily Digest Card */}
            <AIDailyDigest />

            {/* Filters, Search & View Mode Switcher */}
            <TaskFilterBar />
          </div>
        )}

        {/* Task View: List or Kanban Board */}
        {viewMode === 'list' || !showAdvanced ? (
          <TaskListView />
        ) : (
          <KanbanBoardView />
        )}
      </main>

      {/* Slide-In Task Detail Panel */}
      <TaskDetailPanel />

      {/* Settings / Reminders Modal */}
      <SettingsModal />

      {/* Google OAuth Modal for connecting Google Calendar */}
      <GoogleOAuthModal
        isOpen={googleModalOpen}
        onClose={() => setGoogleModalOpen(false)}
        onSignIn={(userData) => signInWithGoogleAccount(userData)}
      />

      {/* Toast Feedback Stack */}
      <ToastContainer />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <TodoProvider>
        <DashboardContent />
      </TodoProvider>
    </AuthProvider>
  );
}

export default App;
