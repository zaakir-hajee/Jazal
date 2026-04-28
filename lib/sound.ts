import { Platform } from 'react-native';

export const TAP_SOUNDS: Record<string, { name: string; freq: number; dur: number; type: OscillatorType; vol: number }> = {
  soft: { name: "Soft Click", freq: 600, dur: 0.06, type: "sine", vol: 0.1 },
  crisp: { name: "Crisp Tap", freq: 900, dur: 0.04, type: "square", vol: 0.08 },
  deep: { name: "Deep Bead", freq: 200, dur: 0.12, type: "sine", vol: 0.15 },
  water: { name: "Water Drop", freq: 1200, dur: 0.08, type: "sine", vol: 0.1 },
  gentle: { name: "Gentle Touch", freq: 440, dur: 0.1, type: "triangle", vol: 0.12 },
  none: { name: "Silent", freq: 0, dur: 0, type: "sine", vol: 0 },
};

export const COMPLETION_SOUNDS: Record<string, { name: string; notes: number[]; type: OscillatorType }> = {
  chime: { name: "Chime", notes: [523.25, 659.25, 783.99], type: "sine" },
  bell: { name: "Bell", notes: [440, 554.37, 659.25], type: "triangle" },
  gong: { name: "Gong", notes: [130.81, 164.81], type: "sine" },
  ascend: { name: "Ascending", notes: [392, 493.88, 587.33, 698.46], type: "sine" },
  none: { name: "Silent", notes: [], type: "sine" },
};

export const VOICE_OPTIONS: Record<string, { name: string; lang: string; rate: number; pitch: number }> = {
  arabic: { name: "Arabic Voice", lang: "ar-SA", rate: 0.75, pitch: 0.9 },
  slow: { name: "Arabic (Slow)", lang: "ar-SA", rate: 0.55, pitch: 0.85 },
  none: { name: "No Voice", lang: "", rate: 0, pitch: 0 },
};

type AudioContextType = typeof AudioContext;
declare const window: Window & { AudioContext?: AudioContextType; webkitAudioContext?: AudioContextType };

let sharedCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (Platform.OS !== 'web') return null;
  if (!sharedCtx) {
    try {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (Ctor) sharedCtx = new Ctor();
    } catch {}
  }
  if (sharedCtx && sharedCtx.state === 'suspended') {
    sharedCtx.resume().catch(() => {});
  }
  return sharedCtx;
}

export function playTap(tapKey: string) {
  const preset = TAP_SOUNDS[tapKey];
  if (!preset?.freq) return;
  const c = getCtx();
  if (!c) return;
  try {
    const o = c.createOscillator();
    const g = c.createGain();
    o.connect(g);
    g.connect(c.destination);
    o.type = preset.type;
    o.frequency.setValueAtTime(preset.freq, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(Math.max(preset.freq * 0.5, 20), c.currentTime + preset.dur);
    g.gain.setValueAtTime(preset.vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + preset.dur + 0.02);
    o.start(c.currentTime);
    o.stop(c.currentTime + preset.dur + 0.03);
  } catch {}
}

export function playCompletion(compKey: string) {
  const preset = COMPLETION_SOUNDS[compKey];
  if (!preset?.notes?.length) return;
  const c = getCtx();
  if (!c) return;
  preset.notes.forEach((freq, i) => {
    try {
      const o = c.createOscillator();
      const g = c.createGain();
      o.connect(g);
      g.connect(c.destination);
      o.type = preset.type;
      o.frequency.setValueAtTime(freq, c.currentTime + i * 0.15);
      g.gain.setValueAtTime(0.15, c.currentTime + i * 0.15);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.15 + 0.45);
      o.start(c.currentTime + i * 0.15);
      o.stop(c.currentTime + i * 0.15 + 0.5);
    } catch {}
  });
}

export function speakText(text: string, voiceKey: string) {
  if (Platform.OS !== 'web') return;
  const preset = VOICE_OPTIONS[voiceKey];
  if (!preset?.lang) return;
  try {
    if (!window.speechSynthesis) return;
    const voices = window.speechSynthesis.getVoices();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = preset.lang;
    u.rate = preset.rate;
    u.pitch = preset.pitch;
    // Try to find an Arabic voice
    const arabicVoice = voices.find(v => v.lang.startsWith('ar'));
    if (arabicVoice) u.voice = arabicVoice;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {}
}

export function resumeAudioContext() {
  if (Platform.OS !== 'web') return;
  // Ensure AudioContext is resumed after user gesture
  const c = getCtx();
  if (c && c.state === 'suspended') {
    c.resume().catch(() => {});
  }
}
