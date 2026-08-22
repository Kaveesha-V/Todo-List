/**
 * Live Alarm & Reminder Audio Service
 * Plays synthesized pleasant reminder chimes using Web Audio API
 * and handles desktop/mobile browser notifications
 */

// Synthesize a pleasant dual-tone notification chime
export const playNotificationChime = (type = 'standard') => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    if (type === 'urgent') {
      // Urgent alarm chime (880Hz -> 1046.5Hz)
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(1046.5, now + 0.15);
      osc2.frequency.setValueAtTime(440, now);
    } else {
      // Pleasant reminder chime (523.25Hz -> 659.25Hz -> 783.99Hz)
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.setValueAtTime(659.25, now + 0.12); // E5
      osc1.frequency.setValueAtTime(783.99, now + 0.24); // G5
      osc2.frequency.setValueAtTime(261.63, now);
    }

    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.5);
    osc2.stop(now + 0.5);
  } catch (e) {
    console.warn("Web Audio chime playback notice:", e);
  }
};

// Request Browser Notification Permission
export const requestBrowserNotificationPermission = async () => {
  if ('Notification' in window && Notification.permission === 'default') {
    try {
      await Notification.requestPermission();
    } catch (e) {}
  }
};

// Send Desktop / Mobile Browser Notification
export const sendBrowserNotification = (title, body, tag = 'aura-reminder') => {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag,
        requireInteraction: true
      });
    } catch (e) {
      console.warn("Browser notification notice:", e);
    }
  }
};
