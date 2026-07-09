// sim/sound.js — Web Audio API sound engine for Verdant.
// All sounds synthesised — no files needed.

let ctx = null;
let windNode = null, windGain = null;
let rainNode = null, rainGain = null;
let ambiNode = null, ambiGain = null;  // ambient nature loop
let musicNodes = [];                    // opening music oscillators
let enabled = true;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// ── Noise buffer (shared) ──────────────────────────────────────────────────
function makeNoise(c, seconds = 2) {
  const buf = c.createBuffer(1, c.sampleRate * seconds, c.sampleRate);
  const d   = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

// ── Reverb (convolution) ───────────────────────────────────────────────────
function makeReverb(c, duration = 1.8, decay = 2.5) {
  const len = c.sampleRate * duration;
  const buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  const rev = c.createConvolver();
  rev.buffer = buf;
  return rev;
}

// ── Opening music ──────────────────────────────────────────────────────────
// A gentle, nature-themed ambient arpeggio that plays when the game loads.
// Uses a pentatonic scale (feels open and hopeful) with soft triangle waves.
// Fades in over 2 seconds, loops, fades out when player clicks Play.
let openingGain = null;

export function playOpeningMusic() {
  if (!enabled) return;
  try {
    const c = getCtx();
    stopOpeningMusic(); // clear any existing

    // Pentatonic major: C D E G A (frequencies × 2 octaves)
    const scale = [261.6, 293.7, 329.6, 392.0, 440.0, 523.3, 587.3, 659.3, 784.0, 880.0];
    const pattern = [0, 2, 4, 7, 9, 7, 4, 2, 0, 2, 4, 5, 7, 9, 7, 5]; // indices into scale
    const noteLen = 0.38; // seconds per note
    const loopLen = pattern.length * noteLen;

    const rev = makeReverb(c, 2.5, 2);
    openingGain = c.createGain();
    openingGain.gain.setValueAtTime(0, c.currentTime);
    openingGain.gain.linearRampToValueAtTime(0.18, c.currentTime + 2.5);

    const masterGain = c.createGain();
    masterGain.gain.value = 1;
    openingGain.connect(rev);
    rev.connect(masterGain);
    openingGain.connect(masterGain); // dry signal too
    masterGain.connect(c.destination);
    musicNodes = [openingGain, masterGain];

    function scheduleLoop(startTime) {
      pattern.forEach((idx, i) => {
        const t = startTime + i * noteLen;
        const freq = scale[idx % scale.length];

        // Main melody note
        const osc = c.createOscillator();
        const g   = c.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        osc.connect(g); g.connect(openingGain);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.6, t + 0.04);
        g.gain.exponentialRampToValueAtTime(0.001, t + noteLen * 0.85);
        osc.start(t); osc.stop(t + noteLen);

        // Soft sub-bass on every 4th note
        if (i % 4 === 0) {
          const bass = c.createOscillator();
          const bg   = c.createGain();
          bass.type = 'sine';
          bass.frequency.value = freq / 2;
          bass.connect(bg); bg.connect(openingGain);
          bg.gain.setValueAtTime(0, t);
          bg.gain.linearRampToValueAtTime(0.3, t + 0.06);
          bg.gain.exponentialRampToValueAtTime(0.001, t + noteLen * 1.5);
          bass.start(t); bass.stop(t + noteLen * 1.6);
        }
      });

      // Schedule next loop — but stop if music was killed
      const loopTimer = setTimeout(() => {
        if (openingGain) scheduleLoop(startTime + loopLen);
      }, (loopLen - 0.5) * 1000);
      musicNodes.push({ stop: () => clearTimeout(loopTimer) });
    }

    scheduleLoop(c.currentTime + 0.1);
  } catch(e) {}
}

export function stopOpeningMusic(fadeDuration = 1.5) {
  try {
    if (!openingGain) return;
    const c = getCtx();
    openingGain.gain.setTargetAtTime(0, c.currentTime, fadeDuration / 4);
    setTimeout(() => {
      musicNodes.forEach(n => { try { if (n.stop) n.stop(); } catch {} });
      musicNodes = [];
      openingGain = null;
    }, fadeDuration * 1000);
  } catch(e) {}
}

// ── Level start sting ──────────────────────────────────────────────────────
// Plays when the intro overlay is dismissed and the game begins.
export function playLevelStart() {
  if (!enabled) return;
  try {
    const c = getCtx();
    stopOpeningMusic(0.8); // cross-fade out the menu music

    // Rising 4-note sting: C → E → G → C (major chord ascent)
    const notes = [[261.6, 0], [329.6, 0.12], [392.0, 0.24], [523.3, 0.38]];
    const rev = makeReverb(c, 1.2, 3);
    const master = c.createGain();
    master.gain.value = 0.22;
    rev.connect(master); master.connect(c.destination);

    notes.forEach(([freq, t0]) => {
      const t = c.currentTime + t0;
      const osc = c.createOscillator();
      const g   = c.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      osc.connect(g); g.connect(rev); g.connect(master);
      g.gain.setValueAtTime(0.5, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      osc.start(t); osc.stop(t + 0.55);
    });

    // Shimmer chord
    [523.3, 659.3, 784.0].forEach((freq, i) => {
      const t = c.currentTime + 0.52 + i * 0.04;
      const osc = c.createOscillator();
      const g   = c.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(g); g.connect(rev);
      g.gain.setValueAtTime(0.18, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
      osc.start(t); osc.stop(t + 1.3);
    });
  } catch(e) {}
}

// ── Ambient nature loop ────────────────────────────────────────────────────
// Soft birds + leaves rustle — plays continuously while in a level.
export function startAmbience(theme = 'meadow') {
  if (!enabled) return;
  try {
    const c = getCtx();
    if (ambiNode) return;

    // Filtered noise = leaves/wind rustle
    const src = c.createBufferSource();
    src.buffer = makeNoise(c, 3);
    src.loop = true;
    const bp = c.createBiquadFilter();
    const freq = theme === 'coastal' ? 600
               : theme === 'planet'  ? 100
               : theme === 'urban'   ? 200
               : 400;
    bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = 0.6;
    ambiGain = c.createGain();
    ambiGain.gain.value = 0;
    src.connect(bp); bp.connect(ambiGain); ambiGain.connect(c.destination);
    src.start();
    ambiGain.gain.linearRampToValueAtTime(0.025, c.currentTime + 3);
    ambiNode = src;

    // Occasional bird chirps (meadow/forest only)
    if (['meadow','forest','coastal'].includes(theme)) {
      scheduleBirds(c);
    }
  } catch(e) {}
}

let birdTimer = null;
function scheduleBirds(c) {
  const delay = 4000 + Math.random() * 6000;
  birdTimer = setTimeout(() => {
    if (!ambiNode || !enabled) return;
    playBird();
    scheduleBirds(c);
  }, delay);
}

export function stopAmbience() {
  try {
    if (birdTimer) { clearTimeout(birdTimer); birdTimer = null; }
    if (ambiNode) {
      const c = getCtx();
      ambiGain.gain.setTargetAtTime(0, c.currentTime, 0.5);
      setTimeout(() => { try { ambiNode.stop(); ambiNode = null; } catch {} }, 2000);
    }
  } catch(e) {}
}

// ── Achievement unlock chime ───────────────────────────────────────────────
export function playAchievement() {
  if (!enabled) return;
  try {
    const c = getCtx();
    const rev = makeReverb(c, 1.5, 3);
    const master = c.createGain();
    master.gain.value = 0.2;
    rev.connect(master); master.connect(c.destination);

    // Upward sparkle: pentatonic run
    [523.3, 659.3, 784.0, 1046.5, 1318.5].forEach((freq, i) => {
      const t = c.currentTime + i * 0.06;
      const osc = c.createOscillator();
      const g   = c.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(g); g.connect(rev); g.connect(master);
      g.gain.setValueAtTime(0.4, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.start(t); osc.stop(t + 0.45);
    });
  } catch(e) {}
}

// ── UI click ───────────────────────────────────────────────────────────────
export function playClick() {
  if (!enabled) return;
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const g   = c.createGain();
    osc.connect(g); g.connect(c.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, c.currentTime + 0.06);
    g.gain.setValueAtTime(0.08, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08);
    osc.start(c.currentTime); osc.stop(c.currentTime + 0.09);
  } catch(e) {}
}

// ── Ambient wind ──────────────────────────────────────────────────────────
export function startWind() {
  if (!enabled) return;
  try {
    const c = getCtx();
    if (windNode) return;
    const src = c.createBufferSource();
    src.buffer = makeNoise(c);
    src.loop = true;
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 300; bp.Q.value = 0.4;
    windGain = c.createGain(); windGain.gain.value = 0.04;
    src.connect(bp); bp.connect(windGain); windGain.connect(c.destination);
    src.start();
    windNode = src;
  } catch(e) {}
}

export function stopWind() {
  try { if (windNode) { windNode.stop(); windNode = null; } } catch(e) {}
}

export function setWindIntensity(v) {
  try { if (windGain) windGain.gain.setTargetAtTime(v * 0.08, getCtx().currentTime, 0.5); } catch(e) {}
}

// ── Rain ──────────────────────────────────────────────────────────────────
export function startRain() {
  if (!enabled) return;
  try {
    const c = getCtx();
    if (rainNode) return;
    const src = c.createBufferSource();
    src.buffer = makeNoise(c);
    src.loop = true;
    const hp = c.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 2000;
    rainGain = c.createGain(); rainGain.gain.value = 0.06;
    src.connect(hp); hp.connect(rainGain); rainGain.connect(c.destination);
    src.start();
    rainNode = src;
  } catch(e) {}
}

export function stopRain() {
  try { if (rainNode) { rainNode.stop(); rainNode = null; } } catch(e) {}
}

// ── Placement click ───────────────────────────────────────────────────────
export function playPlacement(kind = 'plant') {
  if (!enabled) return;
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const g   = c.createGain();
    osc.connect(g); g.connect(c.destination);
    const freq = kind === 'plant' ? 520 : kind === 'water' ? 380 : 440;
    osc.frequency.setValueAtTime(freq, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.6, c.currentTime + 0.12);
    osc.type = 'triangle';
    g.gain.setValueAtTime(0.22, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.18);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.2);
  } catch(e) {}
}

// ── Bird tweet ────────────────────────────────────────────────────────────
export function playBird() {
  if (!enabled) return;
  try {
    const c = getCtx();
    const notes = [880, 1100, 980, 1320, 880];
    notes.forEach((freq, i) => {
      const t   = c.currentTime + i * 0.07;
      const osc = c.createOscillator();
      const g   = c.createGain();
      osc.connect(g); g.connect(c.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.2, t + 0.05);
      g.gain.setValueAtTime(0.12, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc.start(t); osc.stop(t + 0.1);
    });
  } catch(e) {}
}

// ── Event alert ───────────────────────────────────────────────────────────
export function playEventAlert() {
  if (!enabled) return;
  try {
    const c = getCtx();
    [0, 0.18, 0.36].forEach((delay, i) => {
      const t   = c.currentTime + delay;
      const osc = c.createOscillator();
      const g   = c.createGain();
      osc.connect(g); g.connect(c.destination);
      osc.type = 'sawtooth';
      osc.frequency.value = [220, 277, 330][i];
      g.gain.setValueAtTime(0.15, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      osc.start(t); osc.stop(t + 0.16);
    });
  } catch(e) {}
}

// ── Fire crackle ──────────────────────────────────────────────────────────
export function playFire() {
  if (!enabled) return;
  try {
    const c   = getCtx();
    const src = c.createBufferSource();
    src.buffer = makeNoise(c);
    const bp  = c.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 800; bp.Q.value = 0.8;
    const g   = c.createGain();
    g.gain.setValueAtTime(0.18, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 1.2);
    src.connect(bp); bp.connect(g); g.connect(c.destination);
    src.start(); src.stop(c.currentTime + 1.2);
  } catch(e) {}
}

// ── Year step whoosh ──────────────────────────────────────────────────────
export function playYearStep() {
  if (!enabled) return;
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const g   = c.createGain();
    osc.connect(g); g.connect(c.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(320, c.currentTime + 0.15);
    g.gain.setValueAtTime(0.08, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2);
    osc.start(c.currentTime); osc.stop(c.currentTime + 0.22);
  } catch(e) {}
}

// ── Win fanfare ───────────────────────────────────────────────────────────
export function playWin() {
  if (!enabled) return;
  try {
    const c = getCtx();
    stopAmbience();
    const rev = makeReverb(c, 2, 2.5);
    const master = c.createGain();
    master.gain.value = 0.22;
    rev.connect(master); master.connect(c.destination);

    // Extended fanfare — 2 bars
    const melody = [
      [523,0],[659,0.18],[784,0.36],[1047,0.54],
      [784,0.72],[880,0.90],[1047,1.08],[1175,1.26],
      [1047,1.44],[784,1.62],[1047,1.80],
    ];
    for (const [freq, t0] of melody) {
      const t   = c.currentTime + t0;
      const osc = c.createOscillator();
      const g   = c.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      osc.connect(g); g.connect(rev); g.connect(master);
      g.gain.setValueAtTime(0.5, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      osc.start(t); osc.stop(t + 0.3);
    }

    // Chord swell at the end
    [523.3, 659.3, 784.0, 1047].forEach((freq, i) => {
      const t = c.currentTime + 2.0 + i * 0.03;
      const osc = c.createOscillator();
      const g   = c.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(g); g.connect(rev);
      g.gain.setValueAtTime(0.3, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 2.0);
      osc.start(t); osc.stop(t + 2.2);
    });
  } catch(e) {}
}

// ── Global toggle ─────────────────────────────────────────────────────────
export function setSoundEnabled(v) {
  enabled = v;
  if (!v) {
    stopWind(); stopRain(); stopAmbience(); stopOpeningMusic(0.3);
  }
}
export function isSoundEnabled() { return enabled; }