/**
 * Live Alarm & Reminder Audio Service
 * Plays synthesized 6-8 second rhythmic musical melody using Web Audio API
 * and handles desktop/mobile browser notifications
 */

let activeAudioCtx = null;
let activeOscillators = [];

export const stopNotificationAlarm = () => {
  try {
    if (activeOscillators && activeOscillators.length > 0) {
      activeOscillators.forEach(osc => {
        try { osc.stop(); } catch (e) {}
      });
      activeOscillators = [];
    }
    if (activeAudioCtx && activeAudioCtx.state !== 'closed') {
      activeAudioCtx.close();
      activeAudioCtx = null;
    }
  } catch (e) {
    console.warn("Alarm stop notice:", e);
  }
};

/**
 * Plays a 6-8 second rhythmic musical melody
 */
export const playNotificationChime = (type = 'urgent') => {
  stopNotificationAlarm();

  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    activeAudioCtx = new AudioContext();
    const ctx = activeAudioCtx;
    const startTime = ctx.currentTime + 0.05;

    // Pleasant pentatonic melody notes (Hz)
    // C5, E5, G5, A5, C6, G5, E5, D5, C5, G5, C6
    const melodyNotes = [
      { note: 523.25, time: 0.0, dur: 0.35 },  // C5
      { note: 659.25, time: 0.4, dur: 0.35 },  // E5
      { note: 783.99, time: 0.8, dur: 0.45 },  // G5
      { note: 880.00, time: 1.3, dur: 0.35 },  // A5
      { note: 1046.5, time: 1.7, dur: 0.55 },  // C6
      { note: 783.99, time: 2.3, dur: 0.35 },  // G5
      { note: 659.25, time: 2.7, dur: 0.45 },  // E5
      { note: 587.33, time: 3.2, dur: 0.35 },  // D5
      // Second Rhythmic phrase (3.8s to 6.8s)
      { note: 523.25, time: 3.8, dur: 0.35 },  // C5
      { note: 659.25, time: 4.2, dur: 0.35 },  // E5
      { note: 783.99, time: 4.6, dur: 0.45 },  // G5
      { note: 880.00, time: 5.1, dur: 0.35 },  // A5
      { note: 1046.5, time: 5.5, dur: 0.65 },  // C6
      { note: 1318.5, time: 6.2, dur: 0.90 }   // E6 (Grand final harmonic bell)
    ];

    // Harmony bass notes
    const bassNotes = [
      { note: 130.81, time: 0.0, dur: 1.6 }, // C3
      { note: 174.61, time: 1.7, dur: 1.5 }, // F3
      { note: 196.00, time: 3.2, dur: 0.6 }, // G3
      { note: 130.81, time: 3.8, dur: 1.6 }, // C3
      { note: 174.61, time: 5.5, dur: 1.8 }  // F3
    ];

    // Schedule melody notes
    melodyNotes.forEach(({ note, time, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type === 'urgent' ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(note, startTime + time);

      gain.gain.setValueAtTime(0.001, startTime + time);
      gain.gain.exponentialRampToValueAtTime(0.28, startTime + time + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + time + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime + time);
      osc.stop(startTime + time + dur);
      activeOscillators.push(osc);
    });

    // Schedule bass warmth
    bassNotes.forEach(({ note, time, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(note, startTime + time);

      gain.gain.setValueAtTime(0.001, startTime + time);
      gain.gain.exponentialRampToValueAtTime(0.18, startTime + time + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + time + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime + time);
      osc.stop(startTime + time + dur);
      activeOscillators.push(osc);
    });

  } catch (e) {
    console.warn("Web Audio melody synthesis notice:", e);
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

/**
 * Plays a pleasant, harmonic musical sound when the user cuts/dismisses a notification
 */
export const playNotificationDismissSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const startTime = ctx.currentTime;

    // Harmonic two-tone musical sweep (F5 -> A5 -> C6)
    const notes = [
      { freq: 698.46, time: 0.0, dur: 0.12 }, // F5
      { freq: 880.00, time: 0.08, dur: 0.15 }, // A5
      { freq: 1046.50, time: 0.16, dur: 0.28 } // C6
    ];

    notes.forEach(({ freq, time, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime + time);

      gain.gain.setValueAtTime(0.001, startTime + time);
      gain.gain.exponentialRampToValueAtTime(0.2, startTime + time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + time + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime + time);
      osc.stop(startTime + time + dur);
    });

    setTimeout(() => {
      try { ctx.close(); } catch (e) {}
    }, 600);
  } catch (e) {
    console.warn("Dismiss sound notice:", e);
  }
};

