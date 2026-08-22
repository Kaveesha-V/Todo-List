import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Activity } from 'lucide-react';

export const LiveClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="live-clock-badge" title="Live Ongoing Real-Time Clock">
      <div className="live-clock-pulse">
        <span className="live-clock-dot"></span>
      </div>
      <div className="live-clock-info">
        <span className="live-clock-time">{formatTime(time)}</span>
        <span className="live-clock-divider">•</span>
        <span className="live-clock-date">{formatDate(time)}</span>
      </div>
    </div>
  );
};
