/* ============================================================
   PIXPLAY — Audio Engine
   Synthesized sound effects using Web Audio API
   No external audio files needed
   ============================================================ */

const PixPlayAudio = (() => {
  let ctx = null;
  let masterGain = null;
  let enabled = true;
  let volume = 0.35;
  let noiseBuffer = null;

  function _ensureContext() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.value = volume;
      masterGain.connect(ctx.destination);
      _createNoiseBuffer();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function _createNoiseBuffer() {
    const size = ctx.sampleRate * 0.5; // 0.5 seconds of noise
    noiseBuffer = ctx.createBuffer(1, size, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < size; i++) {
      output[i] = Math.random() * 2 - 1;
    }
  }

  function _playTone(freq, duration, type = 'sine', gainVal = 0.3, delay = 0) {
    if (!enabled) return;
    const c = _ensureContext();
    const now = c.currentTime + delay;

    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(gainVal, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + duration);
  }

  function _playNoise(duration, filterFreq = 2000, gainVal = 0.15) {
    if (!enabled || !noiseBuffer) return;
    const c = _ensureContext();
    const now = c.currentTime;

    const source = c.createBufferSource();
    source.buffer = noiseBuffer;
    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    filter.Q.value = 1.5;
    const gain = c.createGain();
    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    source.start(now);
    source.stop(now + duration);
  }

  return {
    init() {
      const prefs = PixPlayStorage.getPreferences();
      enabled = prefs.soundEnabled !== false;
      volume = prefs.volume || 0.35;
      // Context created on first user interaction
    },

    setEnabled(val) {
      enabled = val;
      PixPlayStorage.setPreference('soundEnabled', val);
    },

    isEnabled() { return enabled; },

    toggle() {
      enabled = !enabled;
      PixPlayStorage.setPreference('soundEnabled', enabled);
      if (enabled) this.playClick();
      return enabled;
    },

    setVolume(val) {
      volume = Math.max(0, Math.min(1, val));
      if (masterGain) masterGain.gain.value = volume;
      PixPlayStorage.setPreference('volume', volume);
    },

    // --- Sound Library ---

    /** Subtle UI click — short filtered noise burst */
    playClick() {
      _playNoise(0.06, 3500, 0.12);
    },

    /** Hover feedback — very quiet short tone */
    playHover() {
      _playTone(600, 0.04, 'sine', 0.06);
    },

    /** Score increment — bright ascending blip */
    playScore() {
      if (!enabled) return;
      const c = _ensureContext();
      const now = c.currentTime;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523, now);      // C5
      osc.frequency.linearRampToValueAtTime(784, now + 0.08); // G5
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.15);
    },

    /** Food eaten / item collected — satisfying pop */
    playCollect() {
      _playTone(880, 0.08, 'sine', 0.2);
      _playTone(1318, 0.12, 'sine', 0.15, 0.05);
    },

    /** Move / action — tiny tick */
    playMove() {
      _playNoise(0.025, 5000, 0.06);
    },

    /** Wrong answer / error — short buzz */
    playError() {
      _playTone(200, 0.15, 'square', 0.12);
      _playTone(180, 0.2, 'square', 0.08, 0.05);
    },

    /** Correct answer — bright ding */
    playCorrect() {
      _playTone(659, 0.1, 'sine', 0.2);
      _playTone(880, 0.15, 'sine', 0.18, 0.08);
    },

    /** Game over — descending sad tones */
    playGameOver() {
      _playTone(440, 0.25, 'sine', 0.2);        // A4
      _playTone(392, 0.25, 'sine', 0.18, 0.2);  // G4
      _playTone(330, 0.25, 'sine', 0.15, 0.4);  // E4
      _playTone(262, 0.5, 'sine', 0.2, 0.6);    // C4
    },

    /** Win / achievement — cheerful ascending arpeggio */
    playWin() {
      _playTone(523, 0.15, 'sine', 0.2);        // C5
      _playTone(659, 0.15, 'sine', 0.2, 0.12);  // E5
      _playTone(784, 0.15, 'sine', 0.2, 0.24);  // G5
      _playTone(1047, 0.3, 'sine', 0.25, 0.36); // C6
    },

    /** New high score — celebratory fanfare */
    playNewHighScore() {
      _playTone(523, 0.12, 'triangle', 0.2);       // C5
      _playTone(659, 0.12, 'triangle', 0.2, 0.1);  // E5
      _playTone(784, 0.12, 'triangle', 0.2, 0.2);  // G5
      _playTone(1047, 0.12, 'triangle', 0.25, 0.3); // C6
      _playTone(1319, 0.3, 'triangle', 0.25, 0.4);  // E6
      _playTone(1568, 0.5, 'sine', 0.2, 0.5);       // G6
    },

    /** Countdown tick */
    playTick() {
      _playTone(800, 0.05, 'sine', 0.1);
    },

    /** Whack / hit — punchy impact */
    playHit() {
      _playNoise(0.08, 800, 0.25);
      _playTone(150, 0.1, 'sine', 0.2);
    },

    /** Card flip */
    playFlip() {
      _playNoise(0.04, 4000, 0.1);
      _playTone(440, 0.06, 'sine', 0.08, 0.02);
    },

    /** Key press (for typing game) */
    playKeyPress() {
      _playNoise(0.03, 6000, 0.05);
    },

    /** Level up */
    playLevelUp() {
      _playTone(523, 0.1, 'square', 0.12);
      _playTone(659, 0.1, 'square', 0.12, 0.08);
      _playTone(784, 0.1, 'square', 0.12, 0.16);
      _playTone(1047, 0.2, 'square', 0.15, 0.24);
    }
  };
})();
