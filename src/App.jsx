import React from 'react';
import { TodoProvider, useTodo } from './context/TodoContext';
import { Header } from './components/Header';
import { AIDailyDigest } from './components/AIDailyDigest';
import { NaturalLanguageInput } from './components/NaturalLanguageInput';
import { TaskFilterBar } from './components/TaskFilterBar';
import { TaskListView } from './components/TaskListView';
import { KanbanBoardView } from './components/KanbanBoardView';
import { TaskDetailPanel } from './components/TaskDetailPanel';
import { SettingsModal } from './components/SettingsModal';
import { ToastContainer } from './components/Toast';

const MainDashboard = () => {
  const { viewMode } = useTodo();

  return (
    <div className="app-container">
      {/* App Header */}
      <Header />

      {/* Main Content Area */}
      <main className="main-content">
        {/* AI Daily Digest Card */}
        <AIDailyDigest />

        {/* Natural Language Task Input Bar */}
        <NaturalLanguageInput />

        {/* Filters, Search & View Mode Switcher */}
        <TaskFilterBar />

        {/* Task View: List or Kanban Board */}
        {viewMode === 'list' ? (
          <TaskListView />
        ) : (
          <KanbanBoardView />
        )}
      </main>

      {/* Slide-In Task Detail Panel */}
      <TaskDetailPanel />

      {/* Settings / Reminders Modal */}
      <SettingsModal />

      {/* Toast Feedback Stack */}
      <ToastContainer />
    </div>
  );
};

export function App() {
  return (
    <TodoProvider>
      <MainDashboard />
    </TodoProvider>
  );
}

export default App;
