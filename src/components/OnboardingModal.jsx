import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTodo } from '../context/TodoContext';
import {
  CheckCircle2,
  User,
  Users,
  Calendar,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X
} from 'lucide-react';

export const OnboardingModal = ({ isOpen, onClose }) => {
  const { currentUser, updateCalendarConnection } = useAuth();
  const { markOnboardingComplete } = useTodo();
  const [step, setStep] = useState(1); // 1 | 2
  const [useCase, setUseCase] = useState('personal'); // 'personal' | 'team'
  const [calendarSelected, setCalendarSelected] = useState(null); // 'gcal' | 'outlook' | null
  const [isConnecting, setIsConnecting] = useState(false);

  if (!isOpen) return null;

  const handleFinish = (connectedCalendar = false) => {
    if (connectedCalendar) {
      updateCalendarConnection(true);
    }
    if (markOnboardingComplete) {
      markOnboardingComplete({
        useCase,
        calendarConnected: connectedCalendar || currentUser?.calendarConnected || false
      });
    }
    onClose();
  };

  const handleConnectGoogle = () => {
    setIsConnecting(true);
    setCalendarSelected('gcal');
    updateCalendarConnection(true);
    setTimeout(() => {
      handleFinish(true);
      setIsConnecting(false);
    }, 600);
  };

  const handleConnectOutlook = () => {
    setIsConnecting(true);
    setCalendarSelected('outlook');
    updateCalendarConnection(true);
    setTimeout(() => {
      handleFinish(true);
      setIsConnecting(false);
    }, 600);
  };

  return (
    <div className="onboard-modal-backdrop">
      <div className="onboard-modal-window">
        {/* Top Header */}
        <div className="onboard-modal-top">
          <div className="onboard-brand">
            <div className="brand-logo-small">
              <CheckCircle2 size={20} color="var(--primary)" />
            </div>
            <span className="brand-name">Aura</span>
          </div>
          <button
            type="button"
            className="onboard-close-btn"
            onClick={() => handleFinish(false)}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Main Split Content */}
        <div className="onboard-split-body">
          {/* Left Column: Interactive Choices */}
          <div className="onboard-content-left">
            {step === 1 ? (
              <div className="onboard-step-pane">
                <h1 className="onboard-title">How do you plan to use Aura?</h1>
                <p className="onboard-subtitle">Select one to get started.</p>

                <div className="onboard-cards-stack">
                  <div
                    className={`onboard-choice-card ${useCase === 'personal' ? 'selected' : ''}`}
                    onClick={() => setUseCase('personal')}
                  >
                    <div className="onboard-card-icon personal">
                      <User size={28} />
                    </div>
                    <div className="onboard-card-text">
                      <h3>For myself</h3>
                      <p>I want a personal space to organize my work and life.</p>
                    </div>
                  </div>

                  <div
                    className={`onboard-choice-card ${useCase === 'team' ? 'selected' : ''}`}
                    onClick={() => setUseCase('team')}
                  >
                    <div className="onboard-card-icon team">
                      <Users size={28} />
                    </div>
                    <div className="onboard-card-text">
                      <h3>With my team</h3>
                      <p>I want a simple yet powerful home for my team's work.</p>
                    </div>
                  </div>
                </div>

                <div className="onboard-actions-row">
                  <button
                    type="button"
                    className="onboard-primary-btn"
                    onClick={() => setStep(2)}
                  >
                    <span>Continue</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="onboard-step-pane">
                <h1 className="onboard-title">How do you manage events?</h1>
                <p className="onboard-subtitle">
                  See your tasks and events side-by-side to get the full picture.
                </p>

                <div className="onboard-cards-stack">
                  <div
                    className={`onboard-choice-card calendar-card ${calendarSelected === 'gcal' ? 'selected' : ''}`}
                    onClick={handleConnectGoogle}
                  >
                    <div className="onboard-card-icon gcal">
                      <svg viewBox="0 0 24 24" width="30" height="30">
                        <path fill="#4285F4" d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
                        <text x="12" y="16" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#4285F4">31</text>
                      </svg>
                    </div>
                    <div className="onboard-card-text">
                      <h3>{calendarSelected === 'gcal' ? 'Connecting to Google Calendar...' : 'Connect Google Calendar'}</h3>
                      <p>{calendarSelected === 'gcal' ? '✓ Connected! Syncing your schedule...' : 'Sync tasks with due dates and get smart agenda reminders.'}</p>
                    </div>
                  </div>

                  <div
                    className={`onboard-choice-card calendar-card ${calendarSelected === 'outlook' ? 'selected' : ''}`}
                    onClick={handleConnectOutlook}
                  >
                    <div className="onboard-card-icon outlook">
                      <svg viewBox="0 0 24 24" width="30" height="30">
                        <path fill="#0078D4" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                        <text x="12" y="16" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#0078D4">O</text>
                      </svg>
                    </div>
                    <div className="onboard-card-text">
                      <h3>{calendarSelected === 'outlook' ? 'Connecting to Outlook...' : 'Connect Outlook Calendar'}</h3>
                      <p>{calendarSelected === 'outlook' ? '✓ Connected to Outlook!' : 'View corporate schedules alongside your daily focus items.'}</p>
                    </div>
                  </div>
                </div>

                <div className="onboard-actions-row dual">
                  <button
                    type="button"
                    className="onboard-secondary-btn"
                    onClick={() => setStep(1)}
                  >
                    <ArrowLeft size={16} />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    className="onboard-skip-btn"
                    onClick={() => handleFinish(false)}
                  >
                    Skip
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Dynamic Interactive UI Preview */}
          <div className="onboard-content-right">
            <div className="onboard-preview-wrapper">
              <div className="preview-window-mock">
                <div className="preview-top-bar">
                  <div className="preview-circle red"></div>
                  <div className="preview-circle yellow"></div>
                  <div className="preview-circle green"></div>
                  <span className="preview-url-text">aura.app / {step === 1 ? 'workspace' : 'calendar'}</span>
                </div>

                <div className="preview-window-content">
                  {step === 1 ? (
                    <div className="preview-layout-mock">
                      <div className="preview-sidebar-mock">
                        <div className="mock-user-row">
                          <div className="mock-avatar"></div>
                          <div className="mock-line-short"></div>
                        </div>
                        <div className="mock-nav-item active">
                          <div className="mock-dot blue"></div>
                          <div className="mock-line-med"></div>
                        </div>
                        <div className="mock-nav-item">
                          <div className="mock-dot"></div>
                          <div className="mock-line-med"></div>
                        </div>
                        <div className="mock-nav-item">
                          <div className="mock-dot"></div>
                          <div className="mock-line-short"></div>
                        </div>
                      </div>
                      <div className="preview-main-mock">
                        <div className="mock-heading-lg">Project Planning</div>
                        <div className="mock-task-card">
                          <div className="mock-check"></div>
                          <div className="mock-line-long"></div>
                        </div>
                        <div className="mock-task-card">
                          <div className="mock-check"></div>
                          <div className="mock-line-long"></div>
                        </div>
                        <div className="mock-task-card">
                          <div className="mock-check"></div>
                          <div className="mock-line-med"></div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="preview-layout-mock">
                      <div className="preview-calendar-mock">
                        <div className="mock-cal-header">Upcoming Events</div>
                        <div className="mock-cal-grid">
                          <div className="mock-cal-col">
                            <span className="mock-day-num">23</span>
                            <div className="mock-event-pill blue">Team Sync 10 AM</div>
                            <div className="mock-event-pill purple">Focus Work 2 PM</div>
                          </div>
                          <div className="mock-cal-col">
                            <span className="mock-day-num">24</span>
                            <div className="mock-event-pill green">Launch Aura ✨</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
