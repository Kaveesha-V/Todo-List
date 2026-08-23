import React from 'react';
import { useTodo } from '../context/TodoContext';
import { CheckCircle2, Info, AlertCircle, Sparkles, X } from 'lucide-react';
import { playNotificationDismissSound } from '../services/liveAlarmService';

export const ToastContainer = () => {
  const { toasts, removeToast } = useTodo();

  if (!toasts || toasts.length === 0) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={16} style={{ color: '#10B981' }} />;
      case 'error':
      case 'warning':
        return <AlertCircle size={16} style={{ color: '#EF4444' }} />;
      case 'ai':
        return <Sparkles size={16} style={{ color: 'var(--ai-purple)' }} />;
      case 'info':
      default:
        return <Info size={16} style={{ color: 'var(--accent)' }} />;
    }
  };

  const handleDismiss = (id) => {
    playNotificationDismissSound();
    removeToast(id);
  };

  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.slice(-2).map(toast => (
        <div
          key={toast.id}
          className={`toast-item toast-${toast.type || 'info'}`}
          onClick={() => handleDismiss(toast.id)}
          role="status"
          title="Click or press X to dismiss"
        >
          <div className="toast-icon">
            {toast.icon || getIcon(toast.type)}
          </div>
          <span className="toast-message-text">{toast.message}</span>
          <button
            type="button"
            className="toast-cut-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleDismiss(toast.id);
            }}
            title="Cut / Dismiss notification"
            aria-label="Dismiss notification"
          >
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
};
