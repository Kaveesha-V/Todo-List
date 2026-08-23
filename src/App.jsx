import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TodoProvider, useTodo } from './context/TodoContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ReportingAnalyticsDashboard } from './components/ReportingAnalyticsDashboard';
import { NaturalLanguageInput } from './components/NaturalLanguageInput';
import { TaskFilterBar } from './components/TaskFilterBar';
import { AIDailyDigest } from './components/AIDailyDigest';
import { TaskListView } from './components/TaskListView';
import { KanbanBoardView } from './components/KanbanBoardView';
import { UpcomingTimelineView } from './components/UpcomingTimelineView';
import { FiltersAndLabelsView } from './components/FiltersAndLabelsView';
import { TaskDetailPanel } from './components/TaskDetailPanel';
import { SettingsModal } from './components/SettingsModal';
import { AuthScreen } from './components/AuthScreen';
import { OnboardingModal } from './components/OnboardingModal';
import { SetupChecklistWidget } from './components/SetupChecklistWidget';
import { AIAssistantDrawer } from './components/AIAssistantDrawer';
import { AnimatedBackground } from './components/AnimatedBackground';
import { ToastContainer } from './components/Toast';
import { Sparkles, SlidersHorizontal, ChevronDown, ChevronUp, Megaphone } from 'lucide-react';

const DashboardContent = () => {
  const { currentUser } = useAuth();
  const {
    viewMode,
    activeNavTab,
    onboardingOpen,
    setOnboardingOpen
  } = useTodo();

  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth > 768;
    }
    return true;
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);

  // If no user is logged in, show the secure Auth Screen
  if (!currentUser) {
    return (
      <div className="app-container">
        <AnimatedBackground />
        <AuthScreen />
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="app-workspace-layout">
      {/* Animated Glowing Aurora Canvas Background */}
      <AnimatedBackground />

      {/* Todoist-Inspired Left Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Content Area with Header */}
      <div className="app-main-column">
        {/* App Header with Live Ongoing Clock & AI Assistant Button */}
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onToggleAISidebar={() => setIsAIAssistantOpen(!isAIAssistantOpen)}
        />

        {/* Dynamic Views based on Sidebar Selection */}
        <main className="main-content">
          {activeNavTab === 'upcoming' ? (
            <UpcomingTimelineView />
          ) : activeNavTab === 'filters' ? (
            <FiltersAndLabelsView />
          ) : activeNavTab === 'reporting' ? (
            <ReportingAnalyticsDashboard />
          ) : activeNavTab === 'kanban' ? (
            <div className="kanban-view-container animate-fade-in">
              <NaturalLanguageInput />
              <KanbanBoardView />
            </div>
          ) : (
            // Default: 'inbox', 'today', or project view
            <div className="standard-tasks-view animate-fade-in">
              {/* Core Natural Language Quick Task Input */}
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

              {/* Advanced Features: AI Daily Digest & Filter Switcher */}
              {showAdvanced && (
                <div className="advanced-features-container animate-fade-in">
                  <AIDailyDigest />
                  <TaskFilterBar />
                </div>
              )}

              {/* Task View: List or Kanban Board */}
              {viewMode === 'list' || !showAdvanced ? (
                <TaskListView />
              ) : (
                <KanbanBoardView />
              )}
            </div>
          )}
        </main>
      </div>

      {/* Slide-In Task Detail Panel */}
      <TaskDetailPanel />

      {/* Settings / Reminders Modal */}
      <SettingsModal />

      {/* AI Assistant Workspace Drawer (Powered by OpenAI) */}
      <AIAssistantDrawer
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
      />

      {/* Interactive Onboarding Flow (Screenshots 1 & 2) */}
      <OnboardingModal
        isOpen={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
      />

      {/* Floating "Finish your setup" Widget (Screenshots 3, 4, 5) */}
      <SetupChecklistWidget />

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
