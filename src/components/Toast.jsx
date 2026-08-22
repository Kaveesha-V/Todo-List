import React from 'react';
import { useTodo } from '../context/TodoContext';
import { CheckCircle2, Info, AlertCircle, Sparkles } from 'lucide-react';

export const ToastContainer = () => {
  const { toasts, removeToast } = useTodo();

  if (!toasts || toasts.length === 0) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={16} style={{ color: '#10B981' }} />;
      case 'error':
        return <AlertCircle size={16} style={{ color: '#EF4444' }} />;
      case 'ai':
        return <Sparkles size={16} style={{ color: 'var(--ai-purple)' }} />;
      case 'info':
      default:
        return <Info size={16} style={{ color: 'var(--accent)' }} />;
    }
  };

  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="toast-item"
          onClick={() => removeToast(toast.id)}
          role="status"
        >
          <div className="toast-icon">
            {toast.icon || getIcon(toast.type)}
          </div>
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
};
