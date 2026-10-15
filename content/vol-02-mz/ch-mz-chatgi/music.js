/* 8-bit background loop, synthesized with Web Audio (no audio files). */
(() => {
  const BPM = 132;
  const STEP = 60 / BPM / 2;
  const LOOKAHEAD = 0.12;
  const TICK_MS = 25;
  const VOLUME = 0.55;

  const _ = null;
  const MELODY = [
    72, _, 76, 79, 76, 74, 72, _,
    69, _, 72, 76, 74, 72, 69, _,
    65, 69, 72, _, 74, 72, 69, 67,
    67, _, 71, 74, 79, _, 77, 74,
    76, _, 79, 84, 83, 79, 76, _,
    81, _, 79, 76, 74, 76, 72, _,
    77, 76, 74, 72, 69, 72, 74, _,
    79, _, 74, 71, 72, _, _, _
  ];
  const ROOTS = [48, 45, 41, 43, 48, 45, 41, 43];

  let ctx = null;
  let master = null;
  let noise = null;
  let timer = null;
  let step = 0;
  let nextTime = 0;
  let playing = false;
  let muted = false;

  const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

  function ensureCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : VOLUME;
      master.connect(ctx.destination);

      noise = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return true;
  }

  function tone(freq, t, dur, type, gain) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  function hat(t) {
    const src = ctx.createBufferSource();
    const hp = ctx.createBiquadFilter();
    const g = ctx.createGain();
    src.buffer = noise;
    hp.type = 'highpass';
    hp.frequency.value = 7000;
    g.gain.setValueAtTime(0.025, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
    src.connect(hp);
    hp.connect(g);
    g.connect(master);
    src.start(t);
  }

  function scheduleStep(s, t) {
    const note = MELODY[s % MELODY.length];
    if (note != null) tone(hz(note), t, STEP * 0.9, 'square', 0.035);

    const beat = s % 8;
    const root = ROOTS[Math.floor(s / 8) % ROOTS.length];
    if (beat === 0 || beat === 4) tone(hz(root), t, STEP * 1.6, 'triangle', 0.09);
    else if (beat === 2 || beat === 6) tone(hz(root + 12), t, STEP * 0.9, 'triangle', 0.06);

    if (s % 2 === 1) hat(t);
  }

  function tick() {
    while (nextTime < ctx.currentTime + LOOKAHEAD) {
      scheduleStep(step, nextTime);
      step = (step + 1) % MELODY.length;
      nextTime += STEP;
    }
  }

  function start() {
    if (playing || !ensureCtx()) return;
    playing = true;
    step = 0;
    nextTime = ctx.currentTime + 0.05;
    timer = setInterval(tick, TICK_MS);
  }

  function stop() {
    if (!playing) return;
    playing = false;
    clearInterval(timer);
    timer = null;
  }

  function setMuted(value) {
    muted = value;
    if (master && ctx) master.gain.setTargetAtTime(muted ? 0 : VOLUME, ctx.currentTime, 0.05);
  }

  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend().catch(() => {});
    else ctx.resume().catch(() => {});
  });

  window.MZMusic = { start, stop, setMuted };
})();
