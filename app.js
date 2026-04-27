/* ── Word Lists ── */
const WORDS = {
  easy: [
    'cat', 'dog', 'sun', 'hat', 'big', 'run', 'fun', 'red', 'top', 'box',
    'cup', 'map', 'pen', 'bed', 'hot', 'sit', 'let', 'cut', 'hop', 'win',
    'bat', 'fog', 'jam', 'kit', 'log', 'mud', 'net', 'pig', 'rug', 'van',
    'ant', 'bus', 'dig', 'egg', 'fix', 'gum', 'hug', 'ice', 'jet', 'kid',
  ],
  medium: [
    'apple', 'happy', 'tiger', 'robot', 'music', 'dance', 'cloud', 'dream',
    'light', 'beach', 'green', 'smile', 'stone', 'world', 'train', 'space',
    'plant', 'water', 'bread', 'house', 'mouse', 'heart', 'river', 'storm',
    'flame', 'piano', 'grape', 'candy', 'brave', 'quest', 'magic', 'knight',
  ],
  hard: [
    'butterfly', 'adventure', 'elephant', 'dinosaur', 'chocolate', 'beautiful',
    'wonderful', 'astronaut', 'celebrate', 'fantastic', 'pineapple', 'strawberry',
    'education', 'discovery', 'ecosystem', 'hamburger', 'invisible', 'knowledge',
    'landscape', 'nightmare', 'operation', 'passenger', 'questions', 'rectangle',
    'sunflower', 'telephone', 'umbrella', 'vegetable', 'xylophone', 'dangerous',
  ],
};

const WORD_COUNT = 10;

/* ── Scoring Constants ── */
const SCORE_PER_CHAR = 10;
const COMBO_MILESTONES = [5, 10, 20, 50];
const STAR_THRESHOLDS = {
  easy: { wpm: 20 },
  medium: { wpm: 15 },
  hard: { wpm: 10 },
};

/* ── Keyboard Layout ── */
const KEYBOARD_ROWS = [
  [
    { key: '`', finger: 'left-pinky' },
    { key: '1', finger: 'left-pinky' },
    { key: '2', finger: 'left-ring' },
    { key: '3', finger: 'left-middle' },
    { key: '4', finger: 'left-index' },
    { key: '5', finger: 'left-index' },
    { key: '6', finger: 'right-index' },
    { key: '7', finger: 'right-index' },
    { key: '8', finger: 'right-middle' },
    { key: '9', finger: 'right-ring' },
    { key: '0', finger: 'right-pinky' },
    { key: '-', finger: 'right-pinky' },
    { key: '=', finger: 'right-pinky' },
    { key: 'Backspace', label: '⌫', finger: 'right-pinky', cls: 'backspace' },
  ],
  [
    { key: 'Tab', label: 'Tab', finger: 'left-pinky', cls: 'tab' },
    { key: 'q', finger: 'left-pinky' },
    { key: 'w', finger: 'left-ring' },
    { key: 'e', finger: 'left-middle' },
    { key: 'r', finger: 'left-index' },
    { key: 't', finger: 'left-index' },
    { key: 'y', finger: 'right-index' },
    { key: 'u', finger: 'right-index' },
    { key: 'i', finger: 'right-middle' },
    { key: 'o', finger: 'right-ring' },
    { key: 'p', finger: 'right-pinky' },
    { key: '[', finger: 'right-pinky' },
    { key: ']', finger: 'right-pinky' },
    { key: '\\', finger: 'right-pinky' },
  ],
  [
    { key: 'CapsLock', label: 'Caps', finger: 'left-pinky', cls: 'caps' },
    { key: 'a', finger: 'left-pinky' },
    { key: 's', finger: 'left-ring' },
    { key: 'd', finger: 'left-middle' },
    { key: 'f', finger: 'left-index' },
    { key: 'g', finger: 'left-index' },
    { key: 'h', finger: 'right-index' },
    { key: 'j', finger: 'right-index' },
    { key: 'k', finger: 'right-middle' },
    { key: 'l', finger: 'right-ring' },
    { key: ';', finger: 'right-pinky' },
    { key: "'", finger: 'right-pinky' },
    { key: 'Enter', label: 'Enter', finger: 'right-pinky', cls: 'enter' },
  ],
  [
    { key: 'ShiftLeft', label: 'Shift', finger: 'left-pinky', cls: 'shift' },
    { key: 'z', finger: 'left-pinky' },
    { key: 'x', finger: 'left-ring' },
    { key: 'c', finger: 'left-middle' },
    { key: 'v', finger: 'left-index' },
    { key: 'b', finger: 'left-index' },
    { key: 'n', finger: 'right-index' },
    { key: 'm', finger: 'right-index' },
    { key: ',', finger: 'right-middle' },
    { key: '.', finger: 'right-ring' },
    { key: '/', finger: 'right-pinky' },
    { key: 'ShiftRight', label: 'Shift', finger: 'right-pinky', cls: 'shift' },
  ],
  [
    { key: ' ', label: 'Space', finger: 'thumb', cls: 'space' },
  ],
];

/* ── Storage (localStorage wrapper) ── */
const STORAGE_KEYS = {
  settings: 'typingAdventure_settings',
  history: 'typingAdventure_history',
  records: 'typingAdventure_records',
};

const MAX_HISTORY = 100;

const Storage = {
  _get(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  _set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // localStorage full or unavailable
    }
  },

  // ── Settings ──
  loadSettings() {
    return this._get(STORAGE_KEYS.settings) || {};
  },

  saveSettings(settingsObj) {
    this._set(STORAGE_KEYS.settings, settingsObj);
  },

  // ── History ──
  loadHistory() {
    return this._get(STORAGE_KEYS.history) || [];
  },

  addHistory(entry) {
    const history = this.loadHistory();
    history.unshift(entry);
    if (history.length > MAX_HISTORY) {
      history.length = MAX_HISTORY;
    }
    this._set(STORAGE_KEYS.history, history);
    return history;
  },

  // ── Records ──
  loadRecords() {
    return this._get(STORAGE_KEYS.records) || {
      bestWpm: { easy: 0, medium: 0, hard: 0 },
      bestAccuracy: { easy: 0, medium: 0, hard: 0 },
      bestScore: { easy: 0, medium: 0, hard: 0 },
      totalGames: 0,
      totalWords: 0,
      dayStreak: 0,
      lastPlayDate: null,
    };
  },

  updateRecords(level, wpm, accuracy, wordCount, score) {
    const rec = this.loadRecords();
    if (!rec.bestScore) rec.bestScore = { easy: 0, medium: 0, hard: 0 };
    const isNewBestWpm = wpm > (rec.bestWpm[level] || 0);
    const isNewBestAcc = accuracy > (rec.bestAccuracy[level] || 0);
    const isNewBestScore = score > (rec.bestScore[level] || 0);

    if (isNewBestWpm) rec.bestWpm[level] = wpm;
    if (isNewBestAcc) rec.bestAccuracy[level] = accuracy;
    if (isNewBestScore) rec.bestScore[level] = score;
    rec.totalGames++;
    rec.totalWords += wordCount;

    // Streak calculation
    const today = new Date().toISOString().slice(0, 10);
    if (rec.lastPlayDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      rec.dayStreak = rec.lastPlayDate === yesterday ? rec.dayStreak + 1 : 1;
      rec.lastPlayDate = today;
    }

    this._set(STORAGE_KEYS.records, rec);
    return { records: rec, isNewBestWpm, isNewBestAcc, isNewBestScore };
  },
};

/* ── Audio Context (Web Audio API for typing sounds) ── */
class SoundEngine {
  constructor() {
    this.enabled = true;
    this.ctx = null;
  }

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
  }

  play(type) {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    if (type === 'correct') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.08);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'wrong') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.2);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'complete') {
      // Ascending arpeggio
      [523, 659, 784, 1047].forEach((freq, i) => {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.connect(g);
        g.connect(this.ctx.destination);
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, now + i * 0.1);
        g.gain.setValueAtTime(0.12, now + i * 0.1);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.3);
        o.start(now + i * 0.1);
        o.stop(now + i * 0.1 + 0.3);
      });
    } else {
      // key press click
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}

/* ── Speech Engine (Web Speech API) ── */
class SpeechEngine {
  constructor() {
    this.synth = window.speechSynthesis;
    this.rate = 0.85;
    this.voice = null;
    this._loadVoice();
  }

  _loadVoice() {
    const pickVoice = () => {
      const voices = this.synth.getVoices();
      this.voice =
        voices.find(v => v.lang.startsWith('en') && v.localService) ||
        voices.find(v => v.lang.startsWith('en')) ||
        voices[0] || null;
    };
    pickVoice();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = pickVoice;
    }
  }

  _speak(text) {
    if (!this.synth) return;
    this.synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = this.rate;
    utterance.pitch = 1.1;
    if (this.voice) utterance.voice = this.voice;
    utterance.lang = 'en-US';
    this.synth.speak(utterance);
  }

  speakLetter(char) {
    this._speak(char === ' ' ? 'space' : char);
  }

  speakWord(word) {
    this._speak(word);
  }
}

/* ── Settings (loaded from localStorage) ── */
const DEFAULT_SETTINGS = {
  keyboardCase: 'lower',
  level: 'easy',
  soundMode: 'default',
  soundEnabled: true,
};

const settings = { ...DEFAULT_SETTINGS, ...Storage.loadSettings() };

/* ── Game State ── */
const state = {
  text: '',
  currentIndex: 0,
  startTime: null,
  timerInterval: null,
  totalKeystrokes: 0,
  correctKeystrokes: 0,
  isFinished: false,
  level: settings.level,
  soundMode: settings.soundMode,
  wordBoundaries: [],
  combo: 0,
  maxCombo: 0,
  score: 0,
};

const sound = new SoundEngine();
const speech = new SpeechEngine();

/* ── DOM References ── */
const $wordDisplay = document.getElementById('wordDisplay');
const $progressFill = document.getElementById('progressFill');
const $timer = document.getElementById('timer');
const $cps = document.getElementById('cps');
const $wpm = document.getElementById('wpm');
const $accuracy = document.getElementById('accuracy');
const $keyboard = document.getElementById('keyboard');
const $btnRestart = document.getElementById('btnRestart');
const $btnPlayAgain = document.getElementById('btnPlayAgain');
const $btnSound = document.getElementById('btnSound');
const $levelSelect = document.getElementById('levelSelect');
const $soundModeSelect = document.getElementById('soundModeSelect');
const $celebration = document.getElementById('celebration');
const $celebrationStats = document.getElementById('celebrationStats');
const $hiddenInput = document.getElementById('hiddenInput');
const $stars = document.getElementById('stars');
const $bestWpm = document.getElementById('bestWpm');
const $dayStreak = document.getElementById('dayStreak');
const $btnSettings = document.getElementById('btnSettings');
const $settingsPanel = document.getElementById('settingsPanel');
const $settingsClose = document.getElementById('settingsClose');
const $keyboardCaseSelect = document.getElementById('keyboardCaseSelect');

/* ── Stars Background ── */
function createStars() {
  const count = 80;
  for (let i = 0; i < count; i++) {
    const star = document.createElement('div');
    star.classList.add('star');
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    star.style.setProperty('--duration', `${1.5 + Math.random() * 3}s`);
    star.style.setProperty('--max-opacity', `${0.3 + Math.random() * 0.7}`);
    star.style.animationDelay = `${Math.random() * 3}s`;
    $stars.appendChild(star);
  }
}

/* ── Build Keyboard ── */
const keyElements = new Map();

function buildKeyboard() {
  $keyboard.innerHTML = '';
  keyElements.clear();
  for (const row of KEYBOARD_ROWS) {
    const rowEl = document.createElement('div');
    rowEl.classList.add('keyboard-row');
    for (const k of row) {
      const keyEl = document.createElement('div');
      keyEl.classList.add('key');
      if (k.cls) keyEl.classList.add(`key--${k.cls}`);
      if (k.finger) keyEl.classList.add(`key--finger-${k.finger}`);
      const displayText = k.label || k.key;
      keyEl.textContent = settings.keyboardCase === 'upper'
        ? displayText.toUpperCase()
        : displayText;
      keyEl.dataset.key = k.key.toLowerCase();
      keyElements.set(k.key.toLowerCase(), keyEl);
      rowEl.appendChild(keyEl);
    }
    $keyboard.appendChild(rowEl);
  }
}

/* ── Generate Text ── */
function pickWords(level) {
  const pool = WORDS[level];
  const picked = [];
  const used = new Set();
  while (picked.length < WORD_COUNT) {
    const idx = Math.floor(Math.random() * pool.length);
    if (!used.has(idx)) {
      used.add(idx);
      picked.push(pool[idx]);
    }
    if (used.size >= pool.length) break;
  }
  return picked.join(' ');
}

/* ── Render Word Display ── */
function renderText() {
  $wordDisplay.innerHTML = '';
  for (let i = 0; i < state.text.length; i++) {
    const span = document.createElement('span');
    span.classList.add('char');
    const ch = state.text[i];
    if (ch === ' ') {
      span.classList.add('char--space');
      span.innerHTML = '&nbsp;';
    } else {
      span.textContent = settings.keyboardCase === 'upper' ? ch.toUpperCase() : ch;
    }
    if (i < state.currentIndex) {
      span.classList.add('char--correct');
    } else if (i === state.currentIndex) {
      span.classList.add('char--active');
    } else {
      span.classList.add('char--pending');
    }
    span.dataset.index = i;
    $wordDisplay.appendChild(span);
  }
  updateProgress();
  highlightKey();
}

/* ── Highlight Expected Key on Keyboard ── */
function highlightKey() {
  for (const [, el] of keyElements) {
    el.classList.remove('key--highlight');
  }
  if (state.currentIndex >= state.text.length) return;
  const expected = state.text[state.currentIndex];
  const keyName = expected === ' ' ? ' ' : expected.toLowerCase();
  const keyEl = keyElements.get(keyName);
  if (keyEl) keyEl.classList.add('key--highlight');
}

/* ── Timer ── */
function startTimer() {
  if (state.startTime) return;
  state.startTime = Date.now();
  state.timerInterval = setInterval(updateStats, 100);
}

function stopTimer() {
  clearInterval(state.timerInterval);
  state.timerInterval = null;
}

function getElapsedSeconds() {
  if (!state.startTime) return 0;
  return (Date.now() - state.startTime) / 1000;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function updateStats() {
  const elapsed = getElapsedSeconds();
  $timer.textContent = formatTime(elapsed);

  const cps = elapsed > 0 ? (state.correctKeystrokes / elapsed) : 0;
  $cps.textContent = cps.toFixed(2);

  const wordsTyped = state.correctKeystrokes / 5;
  const minutes = elapsed / 60;
  const wpmVal = minutes > 0 ? Math.round(wordsTyped / minutes) : 0;
  $wpm.textContent = wpmVal;

  const acc = state.totalKeystrokes > 0
    ? Math.round((state.correctKeystrokes / state.totalKeystrokes) * 100)
    : 100;
  $accuracy.textContent = `${acc}%`;
}

function updateProgress() {
  const pct = state.text.length > 0
    ? (state.currentIndex / state.text.length) * 100
    : 0;
  $progressFill.style.width = `${pct}%`;
}

/* ── Particles Effect ── */
function spawnParticles(x, y, color) {
  const count = 6;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.classList.add('particle');
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    p.style.background = color;
    const angle = (Math.PI * 2 / count) * i;
    const dist = 20 + Math.random() * 30;
    p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
    p.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
    document.body.appendChild(p);
    p.addEventListener('animationend', () => p.remove());
  }
}

/* ── Confetti ── */
function launchConfetti() {
  const colors = ['#ffeb3b', '#ff9800', '#e040fb', '#7c4dff', '#00e676', '#ff5252', '#40c4ff'];
  for (let i = 0; i < 60; i++) {
    const c = document.createElement('div');
    c.classList.add('confetti');
    c.style.left = `${Math.random() * 100}vw`;
    c.style.top = `-10px`;
    c.style.background = colors[Math.floor(Math.random() * colors.length)];
    c.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    c.style.width = `${6 + Math.random() * 8}px`;
    c.style.height = `${6 + Math.random() * 8}px`;
    c.style.setProperty('--fall-duration', `${1.5 + Math.random() * 2}s`);
    c.style.animationDelay = `${Math.random() * 0.5}s`;
    document.body.appendChild(c);
    c.addEventListener('animationend', () => c.remove());
  }
}

/* ── Key Flash on Keyboard ── */
function flashKey(keyName, isCorrect) {
  const keyEl = keyElements.get(keyName);
  if (!keyEl) return;

  keyEl.classList.add('key--pressed');
  keyEl.classList.add(isCorrect ? 'key--correct' : 'key--wrong');

  // Get position for particles
  if (isCorrect) {
    const rect = keyEl.getBoundingClientRect();
    spawnParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, '#00e676');
  }

  setTimeout(() => {
    keyEl.classList.remove('key--pressed', 'key--correct', 'key--wrong');
  }, 200);
}

/* ── Word Completion Helper ── */
function getCompletedWord(charIndex) {
  for (const b of state.wordBoundaries) {
    if (charIndex === b.endIndex) return b.word;
    if (charIndex === b.endIndex - 1 && b.endIndex === state.text.length) return b.word;
  }
  return null;
}

/* ── Combo & Score Display ── */
function updateComboDisplay() {
  const $combo = document.getElementById('comboDisplay');
  if (!$combo) return;
  if (state.combo >= 2) {
    $combo.textContent = `x${state.combo}`;
    $combo.classList.add('combo--visible');
    // Scale up on milestones
    if (COMBO_MILESTONES.includes(state.combo)) {
      $combo.classList.add('combo--milestone');
      setTimeout(() => $combo.classList.remove('combo--milestone'), 500);
    }
  } else {
    $combo.classList.remove('combo--visible');
  }
  // Update score display
  const $score = document.getElementById('score');
  if ($score) $score.textContent = state.score.toLocaleString();
}

function showComboMilestone(combo) {
  const popup = document.createElement('div');
  popup.classList.add('combo-popup');
  const labels = { 5: 'Nice!', 10: 'Great!', 20: 'Amazing!', 50: 'LEGENDARY!' };
  popup.textContent = `x${combo} ${labels[combo] || ''}`;
  document.body.appendChild(popup);
  popup.addEventListener('animationend', () => popup.remove());
}

function calculateStars(wpm, accuracy, level) {
  const threshold = STAR_THRESHOLDS[level] || STAR_THRESHOLDS.easy;
  if (accuracy >= 95 && wpm >= threshold.wpm) return 3;
  if (accuracy >= 85 || wpm >= threshold.wpm * 0.7) return 2;
  return 1;
}

/* ── Handle Keypress ── */
function handleKey(inputChar) {
  if (state.isFinished) return;

  sound.init();
  startTimer();

  const expected = state.text[state.currentIndex];
  state.totalKeystrokes++;

  const charEls = $wordDisplay.querySelectorAll('.char');
  const currentEl = charEls[state.currentIndex];
  const keyName = inputChar === ' ' ? ' ' : inputChar.toLowerCase();

  if (inputChar === expected) {
    // Correct
    state.correctKeystrokes++;
    state.combo++;
    if (state.combo > state.maxCombo) state.maxCombo = state.combo;

    // Score: base × combo multiplier
    const comboMultiplier = 1 + state.combo * 0.1;
    state.score += Math.round(SCORE_PER_CHAR * comboMultiplier);

    currentEl.classList.remove('char--active', 'char--pending');
    currentEl.classList.add('char--correct');
    flashKey(keyName, true);
    sound.play('correct');

    // Character mode: pop animation on the typed char
    if (state.soundMode === 'character') {
      currentEl.classList.add('char--pop');
    }

    // Combo milestone effects
    if (COMBO_MILESTONES.includes(state.combo)) {
      showComboMilestone(state.combo);
    }

    updateComboDisplay();
    state.currentIndex++;

    // Speech synthesis based on sound mode
    if (state.soundMode === 'character' && expected !== ' ') {
      speech.speakLetter(expected);
    } else if (state.soundMode === 'word') {
      const completedWord = getCompletedWord(state.currentIndex - 1);
      if (completedWord) {
        speech.speakWord(completedWord);
        // Word mode: wave burst across all chars of the completed word
        const wordBoundary = state.wordBoundaries.find(b =>
          b.word === completedWord &&
          (state.currentIndex - 1 === b.endIndex || state.currentIndex - 1 === b.endIndex - 1)
        );
        if (wordBoundary) {
          for (let i = wordBoundary.startIndex; i < wordBoundary.endIndex; i++) {
            const charEl = charEls[i];
            if (charEl) {
              charEl.style.animationDelay = `${(i - wordBoundary.startIndex) * 60}ms`;
              charEl.classList.add('char--word-burst');
            }
          }
        }
      }
    }

    if (state.currentIndex >= state.text.length) {
      // Finished!
      finishGame();
      return;
    }

    // Activate next char
    const nextEl = charEls[state.currentIndex];
    nextEl.classList.remove('char--pending');
    nextEl.classList.add('char--active');
    highlightKey();
  } else {
    // Wrong — reset combo
    state.combo = 0;
    updateComboDisplay();

    currentEl.classList.add('char--wrong');
    flashKey(keyName, false);
    sound.play('wrong');

    setTimeout(() => {
      currentEl.classList.remove('char--wrong');
    }, 400);
  }

  updateProgress();
  updateStats();
}

/* ── Finish Game ── */
function finishGame() {
  state.isFinished = true;
  stopTimer();
  updateStats();
  sound.play('complete');

  const elapsed = getElapsedSeconds();
  const cps = elapsed > 0 ? (state.correctKeystrokes / elapsed).toFixed(2) : 0;
  const wpm = elapsed > 0 ? Math.round((state.correctKeystrokes / 5) / (elapsed / 60)) : 0;
  const acc = state.totalKeystrokes > 0
    ? Math.round((state.correctKeystrokes / state.totalKeystrokes) * 100)
    : 100;
  const wordCount = state.wordBoundaries.length;

  // Apply accuracy bonus to final score
  let accBonus = 1;
  if (acc >= 100) accBonus = 2;
  else if (acc >= 95) accBonus = 1.5;
  else if (acc >= 90) accBonus = 1.2;
  const finalScore = Math.round(state.score * accBonus);
  state.score = finalScore;

  // Star rating
  const stars = calculateStars(Number(wpm), acc, state.level);
  const starDisplay = '★'.repeat(stars) + '☆'.repeat(3 - stars);

  // Save history
  Storage.addHistory({
    date: new Date().toISOString(),
    level: state.level,
    wpm: Number(wpm),
    cps: Number(cps),
    accuracy: acc,
    time: Number(elapsed.toFixed(1)),
    wordCount,
    score: finalScore,
    stars,
    maxCombo: state.maxCombo,
  });

  // Update records
  const { records, isNewBestWpm, isNewBestAcc, isNewBestScore } = Storage.updateRecords(
    state.level, Number(wpm), acc, wordCount, finalScore
  );

  // Build celebration message
  let statsHtml = `
    <div class="celebration-stars">${starDisplay}</div>
    <div class="celebration-score">${finalScore.toLocaleString()} điểm</div>
    ⏱️ Thời gian: <strong>${formatTime(elapsed)}</strong><br>
    ⚡ CPS: <strong>${cps}</strong><br>
    🏎️ WPM: <strong>${wpm}</strong><br>
    🎯 Chính xác: <strong>${acc}%</strong><br>
    🔥 Max Combo: <strong>x${state.maxCombo}</strong>
  `;

  if (isNewBestWpm || isNewBestAcc || isNewBestScore) {
    statsHtml += '<br><span class="new-record">🏆 Kỷ lục mới!</span>';
  }

  statsHtml += `<br><span class="record-info">🎮 Tổng: ${records.totalGames} lần | 🔥 Streak: ${records.dayStreak} ngày</span>`;

  $celebrationStats.innerHTML = statsHtml;
  refreshRecordsDisplay();

  $celebration.classList.add('celebration--visible');
  launchConfetti();

  // Clear highlight
  for (const [, el] of keyElements) {
    el.classList.remove('key--highlight');
  }
}

/* ── Reset Game ── */
function resetGame() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  state.currentIndex = 0;
  state.startTime = null;
  state.totalKeystrokes = 0;
  state.correctKeystrokes = 0;
  state.isFinished = false;
  state.combo = 0;
  state.maxCombo = 0;
  state.score = 0;
  stopTimer();

  state.text = pickWords(state.level);

  // Precompute word boundaries
  state.wordBoundaries = [];
  let pos = 0;
  for (const word of state.text.split(' ')) {
    state.wordBoundaries.push({
      word,
      startIndex: pos,
      endIndex: pos + word.length,
    });
    pos += word.length + 1;
  }

  $timer.textContent = '0:00';
  $cps.textContent = '0.00';
  $wpm.textContent = '0';
  $accuracy.textContent = '100%';
  $celebration.classList.remove('celebration--visible');
  updateComboDisplay();
  const $score = document.getElementById('score');
  if ($score) $score.textContent = '0';

  refreshRecordsDisplay();
  renderText();
  focusInput();
}

/* ── Focus Management ── */
function focusInput() {
  $hiddenInput.focus();
}

/* ── Persist Settings ── */
function persistSettings() {
  Storage.saveSettings(settings);
}

/* ── Refresh Records Display ── */
function refreshRecordsDisplay() {
  const rec = Storage.loadRecords();
  const bestWpm = rec.bestWpm[state.level] || 0;
  $bestWpm.textContent = bestWpm;
  $dayStreak.textContent = `${rec.dayStreak} ngày`;
}

/* ── Event Listeners ── */

// Hidden input captures all keystrokes
$hiddenInput.addEventListener('input', (e) => {
  const data = e.data;
  if (data && data.length === 1) {
    handleKey(data);
  }
  $hiddenInput.value = '';
});

// Keyboard events for special keys and visual feedback
document.addEventListener('keydown', (e) => {
  if (state.isFinished) return;

  // Handle space explicitly (input event might not fire for space in some cases)
  if (e.key === ' ') {
    e.preventDefault();
    handleKey(' ');
    return;
  }

  // Visual press on keyboard
  const keyName = e.key.toLowerCase();
  const keyEl = keyElements.get(keyName) || keyElements.get(e.code.toLowerCase());
  if (keyEl) {
    keyEl.classList.add('key--pressed');
    sound.init();
    sound.play('click');
  }
});

document.addEventListener('keyup', (e) => {
  const keyName = e.key.toLowerCase();
  const keyEl = keyElements.get(keyName) || keyElements.get(e.code.toLowerCase());
  if (keyEl) {
    keyEl.classList.remove('key--pressed');
  }
});

// Click on keyboard keys (for mouse/touch)
$keyboard.addEventListener('pointerdown', (e) => {
  const keyEl = e.target.closest('.key');
  if (!keyEl) return;
  const key = keyEl.dataset.key;
  if (!key || key.length !== 1) return;
  handleKey(key);
  focusInput();
});

// Click anywhere to focus input
document.addEventListener('click', (e) => {
  if (!e.target.closest('.btn') && !e.target.closest('select')) {
    focusInput();
  }
});

$btnRestart.addEventListener('click', resetGame);
$btnPlayAgain.addEventListener('click', resetGame);

$btnSound.addEventListener('click', () => {
  sound.init();
  const enabled = sound.toggle();
  settings.soundEnabled = enabled;
  persistSettings();
  $btnSound.textContent = enabled ? '🔊' : '🔇';
});

$levelSelect.addEventListener('change', (e) => {
  state.level = e.target.value;
  settings.level = e.target.value;
  persistSettings();
  resetGame();
});

$soundModeSelect.addEventListener('change', (e) => {
  state.soundMode = e.target.value;
  settings.soundMode = e.target.value;
  persistSettings();
});

/* ── Settings Panel ── */
$btnSettings.addEventListener('click', () => {
  $settingsPanel.classList.add('settings--visible');
});

$settingsClose.addEventListener('click', () => {
  $settingsPanel.classList.remove('settings--visible');
});

$settingsPanel.addEventListener('click', (e) => {
  if (e.target === $settingsPanel) {
    $settingsPanel.classList.remove('settings--visible');
  }
});

$keyboardCaseSelect.addEventListener('change', (e) => {
  settings.keyboardCase = e.target.value;
  persistSettings();
  buildKeyboard();
  renderText();
});

/* ── Init ── */
// Restore saved settings to UI controls
$levelSelect.value = settings.level;
$soundModeSelect.value = settings.soundMode;
$keyboardCaseSelect.value = settings.keyboardCase;
if (!settings.soundEnabled) {
  sound.enabled = false;
  $btnSound.textContent = '🔇';
}

createStars();
buildKeyboard();
resetGame();
