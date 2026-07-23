/* ============================================================
   ZERO DAY HEIST — tiny WebAudio synth (no audio files needed)
   ============================================================ */

window.Sound = (() => {
  let ctx = null;
  let muted = localStorage.getItem('zdh-muted') === '1';

  function ac() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }

  function tone(freq, dur, type = 'square', vol = 0.08, when = 0) {
    if (muted) return;
    try {
      const a = ac();
      const o = a.createOscillator(), g = a.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(vol, a.currentTime + when);
      g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + when + dur);
      o.connect(g); g.connect(a.destination);
      o.start(a.currentTime + when);
      o.stop(a.currentTime + when + dur + 0.02);
    } catch (e) { /* audio unavailable — stay silent */ }
  }

  const FX = {
    click:    () => tone(660, 0.06, 'square', 0.05),
    roll:     () => { tone(220, 0.05); tone(330, 0.05, 'square', 0.06, 0.06); tone(440, 0.05, 'square', 0.06, 0.12); },
    move:     () => tone(520, 0.04, 'triangle', 0.05),
    correct:  () => { tone(523, 0.09, 'triangle', 0.1); tone(659, 0.09, 'triangle', 0.1, 0.09); tone(784, 0.14, 'triangle', 0.1, 0.18); },
    wrong:    () => { tone(311, 0.12, 'sawtooth', 0.07); tone(233, 0.2, 'sawtooth', 0.07, 0.12); },
    card:     () => { tone(880, 0.06, 'triangle', 0.07); tone(1175, 0.09, 'triangle', 0.07, 0.07); },
    fragment: () => { tone(659, 0.08, 'triangle', 0.1); tone(880, 0.08, 'triangle', 0.1, 0.08); tone(1319, 0.18, 'triangle', 0.1, 0.16); },
    glitch:   () => { tone(150, 0.08, 'sawtooth', 0.08); tone(120, 0.12, 'sawtooth', 0.08, 0.08); },
    vault:    () => { [392, 466, 587, 784].forEach((f, i) => tone(f, 0.12, 'triangle', 0.09, i * 0.1)); },
    win:      () => { [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, 0.16, 'triangle', 0.1, i * 0.13)); },
    tick:     () => tone(980, 0.03, 'square', 0.04)
  };

  return {
    play: (name) => FX[name] && FX[name](),
    toggleMute() {
      muted = !muted;
      localStorage.setItem('zdh-muted', muted ? '1' : '0');
      return muted;
    },
    get muted() { return muted; }
  };
})();
