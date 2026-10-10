/**
 * Web Audio API Sound Synthesizer for Gate Scanner
 * Zero-dependency procedural sound effects for real-time validation feedback.
 */

let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }

  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }

  return audioCtx;
}

/**
 * Plays an ascending success melody (523Hz -> 659Hz -> 784Hz)
 */
export function playSuccessSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
    const noteDuration = 0.08;

    frequencies.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + index * noteDuration);

      gain.gain.setValueAtTime(0.2, now + index * noteDuration);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (index + 1) * noteDuration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + index * noteDuration);
      osc.stop(now + (index + 1) * noteDuration);
    });
  } catch (err) {
    console.warn('Audio feedback failed:', err);
  }
}

/**
 * Plays a low dual buzz for already used / duplicate tickets (220Hz -> 180Hz)
 */
export function playDuplicateSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const frequencies = [220, 180];
    const noteDuration = 0.14;

    frequencies.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + index * (noteDuration + 0.04));

      gain.gain.setValueAtTime(0.25, now + index * (noteDuration + 0.04));
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * (noteDuration + 0.04) + noteDuration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + index * (noteDuration + 0.04));
      osc.stop(now + index * (noteDuration + 0.04) + noteDuration);
    });
  } catch (err) {
    console.warn('Audio feedback failed:', err);
  }
}

/**
 * Plays a sharp alarm buzz for invalid or tampered tickets (150Hz)
 */
export function playInvalidSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(150, now);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  } catch (err) {
    console.warn('Audio feedback failed:', err);
  }
}
