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

/* ── Game Modes ── */
const GAME_MODES = {
  classic: { label: 'Cổ điển', icon: '📝' },
  lesson: { label: 'Bài học', icon: '📚' },
  timeAttack: { label: 'Đua tốc độ', icon: '⏱️' },
  challenge: { label: 'Thử thách', icon: '💀' },
};

const LESSONS = [
  { name: 'Home Row', chars: 'asdfghjkl' },
  { name: 'Top Row', chars: 'qwertyuiop' },
  { name: 'Bottom Row', chars: 'zxcvbnm' },
  { name: 'Home + Top', chars: 'asdfghjklqwertyuiop' },
  { name: 'Tất cả', chars: 'abcdefghijklmnopqrstuvwxyz' },
];

const TIME_ATTACK_DURATIONS = [30, 60, 120];

const CHALLENGE_LIVES = 3;
const CHALLENGE_MISTAKES_PER_LIFE = 3;

/* ── Generate words from allowed characters ── */
function generateLessonWords(chars, count) {
  const charArr = chars.split('');
  const allWords = [...WORDS.easy, ...WORDS.medium, ...WORDS.hard];
  const matching = allWords.filter(w =>
    [...w].every(ch => charArr.includes(ch))
  );
  const picked = [];
  const used = new Set();
  const pool = matching.length >= count ? matching : matching.length > 0 ? matching : allWords;
  while (picked.length < count && used.size < pool.length) {
    const idx = Math.floor(Math.random() * pool.length);
    if (!used.has(idx)) {
      used.add(idx);
      picked.push(pool[idx]);
    }
  }
  // If not enough real words, generate random pseudo-words
  while (picked.length < count) {
    const len = 3 + Math.floor(Math.random() * 4);
    let word = '';
    for (let i = 0; i < len; i++) {
      word += charArr[Math.floor(Math.random() * charArr.length)];
    }
    picked.push(word);
  }
  return picked;
}

/* ── Generate progressively harder words for challenge mode ── */
function generateChallengeWords(count) {
  const all = [...WORDS.easy, ...WORDS.medium, ...WORDS.hard];
  const sorted = [...all].sort((a, b) => a.length - b.length);
  const picked = [];
  for (let i = 0; i < count; i++) {
    // Progress through sorted list: start short, get longer
    const progress = i / count;
    const rangeStart = Math.floor(progress * sorted.length * 0.5);
    const rangeEnd = Math.min(rangeStart + Math.ceil(sorted.length * 0.3), sorted.length);
    const idx = rangeStart + Math.floor(Math.random() * (rangeEnd - rangeStart));
    picked.push(sorted[Math.min(idx, sorted.length - 1)]);
  }
  return picked;
}

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

/* ── Achievements ── */
const ACHIEVEMENTS = [
  { id: 'first_game', icon: '🌟', name: 'Lần đầu chơi', desc: 'Hoàn thành lượt chơi đầu tiên', check: (r) => r.totalGames >= 1 },
  { id: 'games_10', icon: '📚', name: '10 lượt chơi', desc: 'Hoàn thành 10 lượt chơi', check: (r) => r.totalGames >= 10 },
  { id: 'games_50', icon: '📖', name: '50 lượt chơi', desc: 'Hoàn thành 50 lượt chơi', check: (r) => r.totalGames >= 50 },
  { id: 'games_100', icon: '🏅', name: '100 lượt chơi', desc: 'Hoàn thành 100 lượt chơi', check: (r) => r.totalGames >= 100 },
  { id: 'streak_3', icon: '🔥', name: '3 ngày liên tiếp', desc: 'Chơi 3 ngày liên tiếp', check: (r) => r.dayStreak >= 3 },
  { id: 'streak_7', icon: '🔥', name: '7 ngày liên tiếp', desc: 'Chơi 7 ngày liên tiếp', check: (r) => r.dayStreak >= 7 },
  { id: 'streak_30', icon: '🌋', name: '30 ngày liên tiếp', desc: 'Chơi 30 ngày liên tiếp', check: (r) => r.dayStreak >= 30 },
  { id: 'wpm_20', icon: '💨', name: 'WPM 20', desc: 'Đạt 20 WPM', check: (r) => Math.max(r.bestWpm.easy || 0, r.bestWpm.medium || 0, r.bestWpm.hard || 0) >= 20 },
  { id: 'wpm_40', icon: '💨', name: 'WPM 40', desc: 'Đạt 40 WPM', check: (r) => Math.max(r.bestWpm.easy || 0, r.bestWpm.medium || 0, r.bestWpm.hard || 0) >= 40 },
  { id: 'wpm_60', icon: '🚀', name: 'WPM 60', desc: 'Đạt 60 WPM', check: (r) => Math.max(r.bestWpm.easy || 0, r.bestWpm.medium || 0, r.bestWpm.hard || 0) >= 60 },
  { id: 'wpm_80', icon: '🚀', name: 'WPM 80', desc: 'Đạt 80 WPM', check: (r) => Math.max(r.bestWpm.easy || 0, r.bestWpm.medium || 0, r.bestWpm.hard || 0) >= 80 },
  { id: 'wpm_100', icon: '⚡', name: 'WPM 100', desc: 'Đạt 100 WPM', check: (r) => Math.max(r.bestWpm.easy || 0, r.bestWpm.medium || 0, r.bestWpm.hard || 0) >= 100 },
  { id: 'perfect', icon: '🎯', name: 'Hoàn hảo!', desc: 'Accuracy 100% trong 1 lượt', check: (r, h) => h.some(g => g.accuracy === 100) },
  { id: 'three_star_all', icon: '🏆', name: 'Ba sao tất cả', desc: '3 sao ở cả Easy, Medium, Hard', check: (r, h) => {
    const levels = ['easy', 'medium', 'hard'];
    return levels.every(l => h.some(g => g.level === l && g.stars === 3));
  }},
  { id: 'combo_50', icon: '🦸', name: 'Combo 50', desc: 'Đạt combo streak 50', check: (r, h) => h.some(g => (g.maxCombo || 0) >= 50) },
  { id: 'cps_5', icon: '⚡', name: 'CPS 5', desc: 'Đạt tốc độ 5 ký tự/giây', check: (r, h) => h.some(g => Number(g.cps) >= 5) },
];

/* ── Storage (localStorage wrapper) ── */
const STORAGE_KEYS = {
  settings: 'typingAdventure_settings',
  history: 'typingAdventure_history',
  records: 'typingAdventure_records',
  achievements: 'typingAdventure_achievements',
  profile: 'typingAdventure_profile',
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

  // ── Achievements ──
  loadAchievements() {
    return this._get(STORAGE_KEYS.achievements) || [];
  },

  saveAchievements(list) {
    this._set(STORAGE_KEYS.achievements, list);
  },

  // ── Profile ──
  loadProfile() {
    return this._get(STORAGE_KEYS.profile) || { name: '', avatar: '🧒' };
  },

  saveProfile(profile) {
    this._set(STORAGE_KEYS.profile, profile);
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

  setRate(preset) {
    const rates = { slow: 0.6, normal: 0.85, fast: 1.1 };
    this.rate = rates[preset] || 0.85;
  }
}

/* ── Settings (loaded from localStorage) ── */
const DEFAULT_SETTINGS = {
  keyboardCase: 'lower',
  level: 'easy',
  soundMode: 'default',
  soundEnabled: true,
  speechRate: 'normal',
  wordCount: 10,
  fingerGuide: true,
  theme: 'dark',
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
  mistakeMap: {},
  gameMode: 'classic',
  lives: CHALLENGE_LIVES,
  challengeMistakes: 0,
  timeAttackDuration: 60,
  timeRemaining: 0,
  lessonIndex: 0,
  wordsCompleted: 0,
};

const sound = new SoundEngine();
const speech = new SpeechEngine();
speech.setRate(settings.speechRate);

/* ── DOM References ── */
const $wordDisplay = document.getElementById('wordDisplay');
const $progressFill = document.getElementById('progressFill');
const $timer = document.getElementById('timer');
const $cps = document.getElementById('cps');
const $wpm = document.getElementById('wpm');
const $accuracy = document.getElementById('accuracy');
const $keyboard = document.getElementById('keyboard');
const $btnRestart = document.getElementById('btnRestart');
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
const $speechRateSelect = document.getElementById('speechRateSelect');
const $wordCountSelect = document.getElementById('wordCountSelect');
const $fingerGuideToggle = document.getElementById('fingerGuideToggle');
const $fingerGuideLabel = document.getElementById('fingerGuideLabel');
const $themeSelect = document.getElementById('themeSelect');
const $gameModeSelect = document.getElementById('gameModeSelect');
const $lessonSelect = document.getElementById('lessonSelect');
const $timeAttackSelect = document.getElementById('timeAttackSelect');

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
  const count = settings.wordCount || WORD_COUNT;
  while (picked.length < count) {
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

  // Time Attack: countdown
  if (state.gameMode === 'timeAttack') {
    state.timeRemaining = Math.max(0, state.timeAttackDuration - elapsed);
    $timer.textContent = formatTime(state.timeRemaining);
    if (state.timeRemaining <= 0 && !state.isFinished) {
      finishGame();
      return;
    }
  } else {
    $timer.textContent = formatTime(elapsed);
  }

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

function updateLivesDisplay() {
  const $lives = document.getElementById('livesDisplay');
  if (!$lives) return;
  if (state.gameMode === 'challenge') {
    $lives.innerHTML = '❤️'.repeat(state.lives) + '🖤'.repeat(CHALLENGE_LIVES - state.lives);
    $lives.classList.add('lives--visible');
  } else {
    $lives.classList.remove('lives--visible');
  }
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

    // Track word completion
    const justCompleted = getCompletedWord(state.currentIndex - 1);
    if (justCompleted) {
      state.wordsCompleted++;
    }

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
    // Wrong — reset combo + track mistake
    state.combo = 0;
    updateComboDisplay();
    if (expected !== ' ') {
      state.mistakeMap[expected] = (state.mistakeMap[expected] || 0) + 1;
    }

    currentEl.classList.add('char--wrong');
    flashKey(keyName, false);
    sound.play('wrong');

    // Challenge mode: lose a life after N mistakes
    if (state.gameMode === 'challenge') {
      state.challengeMistakes++;
      if (state.challengeMistakes >= CHALLENGE_MISTAKES_PER_LIFE) {
        state.challengeMistakes = 0;
        state.lives--;
        updateLivesDisplay();
        if (state.lives <= 0) {
          finishGame();
          return;
        }
      }
    }

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

  // Dynamic title based on game mode outcome
  const $cEmoji = document.querySelector('.celebration-emoji');
  const $cTitle = document.querySelector('.celebration-content h2');
  if (state.gameMode === 'challenge' && state.lives <= 0) {
    $cEmoji.textContent = '💔';
    $cTitle.textContent = 'Hết mạng!';
  } else if (state.gameMode === 'timeAttack') {
    $cEmoji.textContent = '⏱️';
    $cTitle.textContent = 'Hết giờ!';
  } else {
    $cEmoji.textContent = '🎉';
    $cTitle.textContent = 'Tuyệt vời!';
  }

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
  const starCount = calculateStars(Number(wpm), acc, state.level);
  const starDisplay = '★'.repeat(starCount) + '☆'.repeat(3 - starCount);

  // Load previous best BEFORE saving (for comparison)
  const prevRecords = Storage.loadRecords();
  const prevBestWpm = prevRecords.bestWpm[state.level] || 0;

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
    stars: starCount,
    maxCombo: state.maxCombo,
  });

  // Update records
  const { records, isNewBestWpm, isNewBestAcc, isNewBestScore } = Storage.updateRecords(
    state.level, Number(wpm), acc, wordCount, finalScore
  );

  // ── Stars ──
  document.getElementById('celebrationStars').innerHTML = starDisplay;

  // ── Score ──
  document.getElementById('celebrationScore').textContent = `${finalScore.toLocaleString()} điểm`;

  // ── Record comparison ──
  let recordHtml = '';
  if (isNewBestWpm || isNewBestAcc || isNewBestScore) {
    recordHtml = '<span class="new-record">🏆 Kỷ lục mới!</span>';
  } else if (prevBestWpm > 0) {
    const diff = prevBestWpm - Number(wpm);
    if (diff <= 5 && diff > 0) {
      recordHtml = `<span class="record-close">Còn ${diff} WPM nữa là phá kỷ lục!</span>`;
    } else if (diff > 5) {
      recordHtml = `<span class="record-info">Kỷ lục: ${prevBestWpm} WPM</span>`;
    }
  }
  recordHtml += `<span class="record-info">🎮 ${records.totalGames} lần chơi | 🔥 ${records.dayStreak} ngày liên tiếp</span>`;
  document.getElementById('celebrationRecord').innerHTML = recordHtml;

  // ── Stats grid ──
  let modeStatHtml = '';
  if (state.gameMode === 'timeAttack') {
    modeStatHtml = `<div class="cstat"><span class="cstat-val">${state.wordsCompleted}</span><span class="cstat-lbl">Từ hoàn thành</span></div>`;
  } else if (state.gameMode === 'challenge') {
    modeStatHtml = `<div class="cstat"><span class="cstat-val">${'❤️'.repeat(state.lives)}</span><span class="cstat-lbl">Mạng còn</span></div>`;
  } else if (state.gameMode === 'lesson') {
    const lessonName = (LESSONS[state.lessonIndex] || LESSONS[0]).name;
    modeStatHtml = `<div class="cstat"><span class="cstat-val">${lessonName}</span><span class="cstat-lbl">Bài học</span></div>`;
  }
  document.getElementById('celebrationStats').innerHTML = `
    <div class="cstat"><span class="cstat-val">${formatTime(elapsed)}</span><span class="cstat-lbl">Thời gian</span></div>
    <div class="cstat"><span class="cstat-val">${cps}</span><span class="cstat-lbl">CPS</span></div>
    <div class="cstat"><span class="cstat-val">${wpm}</span><span class="cstat-lbl">WPM</span></div>
    <div class="cstat"><span class="cstat-val">${acc}%</span><span class="cstat-lbl">Chính xác</span></div>
    <div class="cstat"><span class="cstat-val">x${state.maxCombo}</span><span class="cstat-lbl">Max Combo</span></div>
    <div class="cstat"><span class="cstat-val">${finalScore.toLocaleString()}</span><span class="cstat-lbl">Điểm</span></div>
    ${modeStatHtml}
  `;

  // ── Mistake analysis ──
  const mistakes = Object.entries(state.mistakeMap).sort((a, b) => b[1] - a[1]);
  const $mistakes = document.getElementById('celebrationMistakes');
  if (mistakes.length > 0) {
    const top3 = mistakes.slice(0, 3);
    const chars = top3.map(([ch, count]) =>
      `<span class="mistake-char">${ch.toUpperCase()} <small>(${count}x)</small></span>`
    ).join(' ');
    $mistakes.innerHTML = `
      <div class="mistakes-title">Chữ cái hay sai nhất</div>
      <div class="mistakes-list">${chars}</div>
      <div class="mistakes-tip">Hãy luyện thêm chữ ${top3.map(([ch]) => ch.toUpperCase()).join(', ')}!</div>
    `;
  } else {
    $mistakes.innerHTML = '<div class="mistakes-title perfect">Hoàn hảo! Không sai chữ nào!</div>';
  }

  // ── Action buttons ──
  const $actions = document.getElementById('celebrationActions');
  let actionsHtml = '<button class="btn btn-restart" id="btnPlayAgain">🔄 Chơi lại</button>';

  // "Thử level khó hơn" if 3 stars
  const nextLevel = { easy: 'medium', medium: 'hard' };
  if (starCount === 3 && nextLevel[state.level]) {
    const nlKey = nextLevel[state.level];
    const nlLabel = { medium: 'Trung bình', hard: 'Khó' };
    actionsHtml += `<button class="btn btn-level-up" data-level="${nlKey}">🚀 Thử ${nlLabel[nlKey]}</button>`;
  }

  // "Luyện chữ yếu" if there are mistakes
  if (mistakes.length > 0) {
    const weakChars = mistakes.slice(0, 5).map(([ch]) => ch).join(',');
    actionsHtml += `<button class="btn btn-practice" data-chars="${weakChars}">🎯 Luyện chữ yếu</button>`;
  }

  $actions.innerHTML = actionsHtml;

  // Bind action buttons
  $actions.querySelector('#btnPlayAgain')?.addEventListener('click', resetGame);
  $actions.querySelector('.btn-level-up')?.addEventListener('click', (e) => {
    const newLevel = e.target.dataset.level;
    state.level = newLevel;
    settings.level = newLevel;
    persistSettings();
    $levelSelect.value = newLevel;
    resetGame();
  });
  $actions.querySelector('.btn-practice')?.addEventListener('click', (e) => {
    const chars = e.target.dataset.chars.split(',');
    startPracticeMode(chars);
  });

  refreshRecordsDisplay();
  $celebration.classList.add('celebration--visible');
  launchConfetti();

  // Clear highlight
  for (const [, el] of keyElements) {
    el.classList.remove('key--highlight');
  }

  // Post-game checks
  checkAchievements();
  setTimeout(checkAdaptiveDifficulty, 1500);
}

/* ── Practice Mode: generate words focusing on weak characters ── */
function startPracticeMode(weakChars) {
  const allWords = [...WORDS.easy, ...WORDS.medium, ...WORDS.hard];
  const matching = allWords.filter(w =>
    weakChars.some(ch => w.includes(ch))
  );
  // Pick up to WORD_COUNT words that contain weak chars, fill rest randomly
  const picked = [];
  const used = new Set();
  const pool = matching.length > 0 ? matching : allWords;
  while (picked.length < WORD_COUNT && used.size < pool.length) {
    const idx = Math.floor(Math.random() * pool.length);
    if (!used.has(idx)) {
      used.add(idx);
      picked.push(pool[idx]);
    }
  }

  $celebration.classList.remove('celebration--visible');

  state.currentIndex = 0;
  state.startTime = null;
  state.totalKeystrokes = 0;
  state.correctKeystrokes = 0;
  state.isFinished = false;
  state.combo = 0;
  state.maxCombo = 0;
  state.score = 0;
  state.mistakeMap = {};
  stopTimer();

  state.text = picked.join(' ');

  // Precompute word boundaries
  state.wordBoundaries = [];
  let pos = 0;
  for (const word of state.text.split(' ')) {
    state.wordBoundaries.push({ word, startIndex: pos, endIndex: pos + word.length });
    pos += word.length + 1;
  }

  $timer.textContent = '0:00';
  $cps.textContent = '0.00';
  $wpm.textContent = '0';
  $accuracy.textContent = '100%';
  updateComboDisplay();
  const $score = document.getElementById('score');
  if ($score) $score.textContent = '0';

  refreshRecordsDisplay();
  renderText();
  focusInput();
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
  state.mistakeMap = {};
  state.wordsCompleted = 0;
  state.lives = CHALLENGE_LIVES;
  state.challengeMistakes = 0;
  stopTimer();

  // Generate text based on game mode
  const count = settings.wordCount || WORD_COUNT;
  if (state.gameMode === 'lesson') {
    const lesson = LESSONS[state.lessonIndex] || LESSONS[0];
    const words = generateLessonWords(lesson.chars, count);
    state.text = words.join(' ');
  } else if (state.gameMode === 'timeAttack') {
    // Generate more words for time attack (3x normal)
    const words = pickWords(state.level);
    const extra1 = pickWords(state.level);
    const extra2 = pickWords(state.level);
    state.text = words + ' ' + extra1 + ' ' + extra2;
    state.timeRemaining = state.timeAttackDuration;
  } else if (state.gameMode === 'challenge') {
    const words = generateChallengeWords(count + 10);
    state.text = words.join(' ');
  } else {
    state.text = pickWords(state.level);
  }

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

  // Update timer display based on mode
  if (state.gameMode === 'timeAttack') {
    $timer.textContent = formatTime(state.timeAttackDuration);
  } else {
    $timer.textContent = '0:00';
  }

  $cps.textContent = '0.00';
  $wpm.textContent = '0';
  $accuracy.textContent = '100%';
  $celebration.classList.remove('celebration--visible');
  updateComboDisplay();
  updateLivesDisplay();
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

/* ── Profile Display ── */
function refreshProfileDisplay() {
  const profile = Storage.loadProfile();
  const $greeting = document.getElementById('profileGreeting');
  if ($greeting && profile.name) {
    $greeting.textContent = `${profile.avatar} Chào, ${profile.name}!`;
    $greeting.classList.remove('hidden');
  } else if ($greeting) {
    $greeting.classList.add('hidden');
  }
}

/* ── Achievements ── */
function checkAchievements() {
  const records = Storage.loadRecords();
  const history = Storage.loadHistory();
  const unlocked = Storage.loadAchievements();
  const newUnlocks = [];

  for (const ach of ACHIEVEMENTS) {
    if (unlocked.includes(ach.id)) continue;
    if (ach.check(records, history)) {
      unlocked.push(ach.id);
      newUnlocks.push(ach);
    }
  }

  if (newUnlocks.length > 0) {
    Storage.saveAchievements(unlocked);
    newUnlocks.forEach((ach, i) => {
      setTimeout(() => showAchievementPopup(ach), i * 1200);
    });
  }
}

function showAchievementPopup(ach) {
  const popup = document.createElement('div');
  popup.classList.add('achievement-popup');
  popup.innerHTML = `<span class="ach-icon">${ach.icon}</span><div class="ach-info"><strong>${ach.name}</strong><span>${ach.desc}</span></div>`;
  document.body.appendChild(popup);
  popup.addEventListener('animationend', () => popup.remove());
}

/* ── Adaptive Difficulty ── */
function checkAdaptiveDifficulty() {
  const history = Storage.loadHistory();
  const recent = history.slice(0, 5).filter(h => h.level === state.level);
  if (recent.length < 3) return;

  const avgWpm = recent.reduce((s, h) => s + h.wpm, 0) / recent.length;
  const avgAcc = recent.reduce((s, h) => s + h.accuracy, 0) / recent.length;
  const threshold = STAR_THRESHOLDS[state.level] || STAR_THRESHOLDS.easy;

  const nextLevel = { easy: 'medium', medium: 'hard' };
  const prevLevel = { medium: 'easy', hard: 'medium' };
  const levelLabels = { easy: 'Dễ', medium: 'Trung bình', hard: 'Khó' };

  if (avgAcc >= 95 && avgWpm >= threshold.wpm && nextLevel[state.level]) {
    showAdaptivePopup(`Bạn giỏi lắm! Thử level ${levelLabels[nextLevel[state.level]]} nhé?`, nextLevel[state.level]);
  } else if (avgAcc < 70 && prevLevel[state.level]) {
    showAdaptivePopup(`Hãy thử level ${levelLabels[prevLevel[state.level]]} để luyện thêm nhé!`, prevLevel[state.level]);
  }
}

function showAdaptivePopup(message, suggestedLevel) {
  const existing = document.querySelector('.adaptive-popup');
  if (existing) existing.remove();

  const popup = document.createElement('div');
  popup.classList.add('adaptive-popup');
  popup.innerHTML = `
    <p>${message}</p>
    <div class="adaptive-actions">
      <button class="btn adaptive-yes">Đồng ý</button>
      <button class="btn adaptive-no">Để sau</button>
    </div>
  `;
  document.body.appendChild(popup);

  popup.querySelector('.adaptive-yes').addEventListener('click', () => {
    state.level = suggestedLevel;
    settings.level = suggestedLevel;
    persistSettings();
    $levelSelect.value = suggestedLevel;
    popup.remove();
    resetGame();
  });

  popup.querySelector('.adaptive-no').addEventListener('click', () => {
    popup.remove();
  });

  setTimeout(() => { if (popup.parentNode) popup.remove(); }, 8000);
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
  // Vibration feedback on mobile
  if (navigator.vibrate) navigator.vibrate(10);
  focusInput();
});

// Click anywhere to focus input
document.addEventListener('click', (e) => {
  if (!e.target.closest('.btn') && !e.target.closest('select')) {
    focusInput();
  }
});

$btnRestart.addEventListener('click', resetGame);

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

$speechRateSelect.addEventListener('change', (e) => {
  settings.speechRate = e.target.value;
  speech.setRate(e.target.value);
  persistSettings();
});

$wordCountSelect.addEventListener('change', (e) => {
  settings.wordCount = Number(e.target.value);
  persistSettings();
  resetGame();
});

$fingerGuideToggle.addEventListener('change', (e) => {
  settings.fingerGuide = e.target.checked;
  persistSettings();
  $keyboard.classList.toggle('keyboard--hide-fingers', !e.target.checked);
  const $handsGuide = document.getElementById('handsGuide');
  if ($handsGuide) $handsGuide.classList.toggle('hidden', !e.target.checked);
  $fingerGuideLabel.textContent = e.target.checked ? 'Bật' : 'Tắt';
  updateFingerHint();
});

$themeSelect.addEventListener('change', (e) => {
  settings.theme = e.target.value;
  persistSettings();
  applyTheme(e.target.value);
});

function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

function updateModeSubSelectors() {
  $lessonSelect.classList.toggle('hidden', state.gameMode !== 'lesson');
  $timeAttackSelect.classList.toggle('hidden', state.gameMode !== 'timeAttack');
}

/* ── Game Mode Selectors ── */
$gameModeSelect.addEventListener('change', (e) => {
  state.gameMode = e.target.value;
  updateModeSubSelectors();
  resetGame();
});

$lessonSelect.addEventListener('change', (e) => {
  state.lessonIndex = Number(e.target.value);
  resetGame();
});

$timeAttackSelect.addEventListener('change', (e) => {
  state.timeAttackDuration = Number(e.target.value);
  resetGame();
});

/* ── History Panel ── */
const $btnHistory = document.getElementById('btnHistory');
const $historyPanel = document.getElementById('historyPanel');
const $historyClose = document.getElementById('historyClose');

$btnHistory.addEventListener('click', () => {
  renderHistoryPanel();
  $historyPanel.classList.add('settings--visible');
});

$historyClose.addEventListener('click', () => {
  $historyPanel.classList.remove('settings--visible');
});

$historyPanel.addEventListener('click', (e) => {
  if (e.target === $historyPanel) {
    $historyPanel.classList.remove('settings--visible');
  }
});

function renderHistoryPanel() {
  const history = Storage.loadHistory();
  const records = Storage.loadRecords();

  // ── Streak banner ──
  const $streak = document.getElementById('historyStreak');
  if (records.dayStreak > 0) {
    $streak.innerHTML = `<span class="streak-fire">🔥</span> ${records.dayStreak} ngày liên tiếp <span class="streak-sub">| ${records.totalGames} lần chơi | ${records.totalWords} từ đã gõ</span>`;
    $streak.classList.remove('hidden');
  } else {
    $streak.innerHTML = `<span class="streak-sub">🎮 ${records.totalGames} lần chơi | ${records.totalWords} từ đã gõ</span>`;
    $streak.classList.remove('hidden');
  }

  // ── Table ──
  const $tbody = document.getElementById('historyTableBody');
  const $empty = document.getElementById('historyEmpty');
  const recent = history.slice(0, 20);

  if (recent.length === 0) {
    $tbody.innerHTML = '';
    $empty.classList.remove('hidden');
  } else {
    $empty.classList.add('hidden');
    const levelLabels = { easy: '🌱', medium: '🌿', hard: '🌳' };
    $tbody.innerHTML = recent.map(h => {
      const d = new Date(h.date);
      const dateStr = `${d.getDate()}/${d.getMonth() + 1}`;
      const starsStr = '★'.repeat(h.stars || 0) + '☆'.repeat(3 - (h.stars || 0));
      return `<tr>
        <td>${dateStr}</td>
        <td>${levelLabels[h.level] || h.level}</td>
        <td>${h.wpm}</td>
        <td>${h.accuracy}%</td>
        <td class="stars-cell">${starsStr}</td>
      </tr>`;
    }).join('');
  }

  // ── SVG Chart (WPM over time) ──
  renderChart(history.slice(0, 20).reverse());

  // ── Trend ──
  renderTrend(history.slice(0, 10));
}

function renderChart(data) {
  const svg = document.getElementById('historyChart');
  if (data.length < 2) {
    svg.innerHTML = '<text x="190" y="85" text-anchor="middle" fill="var(--color-text-dim)" font-size="12">Cần ít nhất 2 lần chơi</text>';
    return;
  }

  const W = 380, H = 160;
  const padL = 35, padR = 10, padT = 15, padB = 25;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const wpmValues = data.map(d => d.wpm || 0);
  const accValues = data.map(d => d.accuracy || 0);
  const maxWpm = Math.max(...wpmValues, 10);
  const n = data.length;

  const xStep = chartW / (n - 1);

  // Build WPM polyline points
  const wpmPoints = wpmValues.map((v, i) => {
    const x = padL + i * xStep;
    const y = padT + chartH - (v / maxWpm) * chartH;
    return `${x},${y}`;
  });

  // Build accuracy polyline points (scale 0-100)
  const accPoints = accValues.map((v, i) => {
    const x = padL + i * xStep;
    const y = padT + chartH - (v / 100) * chartH;
    return `${x},${y}`;
  });

  // Y-axis labels
  const yLabels = [0, Math.round(maxWpm / 2), maxWpm];

  let html = '';

  // Grid lines
  for (const val of yLabels) {
    const y = padT + chartH - (val / maxWpm) * chartH;
    html += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="var(--color-text-dim)" stroke-opacity="0.15" stroke-dasharray="3,3"/>`;
    html += `<text x="${padL - 4}" y="${y + 4}" text-anchor="end" fill="var(--color-text-dim)" font-size="9">${val}</text>`;
  }

  // WPM area fill
  const areaWpm = `M${padL},${padT + chartH} L${wpmPoints.join(' L')} L${padL + (n - 1) * xStep},${padT + chartH} Z`;
  html += `<path d="${areaWpm}" fill="url(#wpmGrad)" opacity="0.3"/>`;

  // Gradients
  html += `<defs>
    <linearGradient id="wpmGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#7c4dff"/>
      <stop offset="100%" stop-color="#7c4dff" stop-opacity="0"/>
    </linearGradient>
  </defs>`;

  // WPM line
  html += `<polyline points="${wpmPoints.join(' ')}" fill="none" stroke="#7c4dff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`;

  // Accuracy line (dashed, green)
  html += `<polyline points="${accPoints.join(' ')}" fill="none" stroke="#00e676" stroke-width="1.5" stroke-dasharray="4,3" stroke-linecap="round" stroke-linejoin="round" opacity="0.7"/>`;

  // Data points for WPM
  wpmValues.forEach((v, i) => {
    const x = padL + i * xStep;
    const y = padT + chartH - (v / maxWpm) * chartH;
    html += `<circle cx="${x}" cy="${y}" r="3" fill="#7c4dff" stroke="var(--color-text)" stroke-width="1"/>`;
  });

  // Legend
  html += `<rect x="${padL}" y="${H - 8}" width="10" height="3" rx="1" fill="#7c4dff"/>`;
  html += `<text x="${padL + 14}" y="${H - 5}" fill="var(--color-text-dim)" font-size="8">WPM</text>`;
  html += `<line x1="${padL + 50}" y1="${H - 6.5}" x2="${padL + 60}" y2="${H - 6.5}" stroke="#00e676" stroke-width="1.5" stroke-dasharray="3,2"/>`;
  html += `<text x="${padL + 64}" y="${H - 5}" fill="var(--color-text-dim)" font-size="8">Accuracy</text>`;

  svg.innerHTML = html;
}

function renderTrend(recentHistory) {
  const $trend = document.getElementById('historyTrend');
  if (recentHistory.length < 3) {
    $trend.innerHTML = '';
    return;
  }

  const wpms = recentHistory.map(h => h.wpm || 0);
  const firstHalf = wpms.slice(Math.floor(wpms.length / 2));
  const secondHalf = wpms.slice(0, Math.floor(wpms.length / 2));
  const avgRecent = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  const avgOlder = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const diff = avgRecent - avgOlder;

  let icon, text, cls;
  if (diff > 3) {
    icon = '📈';
    text = `Đang tiến bộ! WPM tăng ${Math.round(diff)} so với trước`;
    cls = 'trend--up';
  } else if (diff < -3) {
    icon = '📉';
    text = `Cần cố gắng hơn! WPM giảm ${Math.round(Math.abs(diff))}`;
    cls = 'trend--down';
  } else {
    icon = '➡️';
    text = `Ổn định — tiếp tục luyện tập!`;
    cls = 'trend--stable';
  }

  $trend.innerHTML = `<span class="trend-icon">${icon}</span> <span class="trend-text">${text}</span>`;
  $trend.className = `history-trend ${cls}`;
}

/* ── Profile ── */
const $profileName = document.getElementById('profileName');
const $profileAvatar = document.getElementById('profileAvatar');
const savedProfile = Storage.loadProfile();

$profileName.value = savedProfile.name || '';
$profileAvatar.value = savedProfile.avatar || '🧒';

$profileName.addEventListener('input', () => {
  const profile = Storage.loadProfile();
  profile.name = $profileName.value.trim();
  Storage.saveProfile(profile);
  refreshProfileDisplay();
});

$profileAvatar.addEventListener('change', () => {
  const profile = Storage.loadProfile();
  profile.avatar = $profileAvatar.value;
  Storage.saveProfile(profile);
  refreshProfileDisplay();
});

/* ── Achievements Panel ── */
const $btnAchievements = document.getElementById('btnAchievements');
const $achievementsPanel = document.getElementById('achievementsPanel');
const $achievementsClose = document.getElementById('achievementsClose');

$btnAchievements.addEventListener('click', () => {
  renderAchievementsPanel();
  $settingsPanel.classList.remove('settings--visible');
  $achievementsPanel.classList.add('settings--visible');
});

$achievementsClose.addEventListener('click', () => {
  $achievementsPanel.classList.remove('settings--visible');
});

$achievementsPanel.addEventListener('click', (e) => {
  if (e.target === $achievementsPanel) {
    $achievementsPanel.classList.remove('settings--visible');
  }
});

function renderAchievementsPanel() {
  const unlocked = Storage.loadAchievements();
  const $grid = document.getElementById('achievementsGrid');
  $grid.innerHTML = ACHIEVEMENTS.map(ach => {
    const isUnlocked = unlocked.includes(ach.id);
    return `<div class="ach-card ${isUnlocked ? 'ach--unlocked' : 'ach--locked'}">
      <span class="ach-card-icon">${isUnlocked ? ach.icon : '🔒'}</span>
      <strong class="ach-card-name">${ach.name}</strong>
      <span class="ach-card-desc">${ach.desc}</span>
    </div>`;
  }).join('');
}

/* ── Finger Hint ── */
const FINGER_NAMES = {
  'left-pinky': 'Út trái',
  'left-ring': 'Áp út trái',
  'left-middle': 'Giữa trái',
  'left-index': 'Trỏ trái',
  'right-index': 'Trỏ phải',
  'right-middle': 'Giữa phải',
  'right-ring': 'Áp út phải',
  'right-pinky': 'Út phải',
  'thumb': 'Ngón cái',
};

const KEY_FINGER_MAP = {};
for (const row of KEYBOARD_ROWS) {
  for (const k of row) {
    if (k.finger) {
      KEY_FINGER_MAP[k.key.toLowerCase()] = k.finger;
    }
  }
}

function updateFingerHint() {
  const $label = document.getElementById('fingerLabel');

  // Clear all active fingers
  document.querySelectorAll('.finger-path.finger--active')
    .forEach(el => el.classList.remove('finger--active'));

  if (!settings.fingerGuide || state.currentIndex >= state.text.length) {
    if ($label) { $label.textContent = ''; $label.classList.remove('label--visible'); }
    return;
  }

  const expected = state.text[state.currentIndex];
  const keyName = expected === ' ' ? ' ' : expected.toLowerCase();
  const finger = KEY_FINGER_MAP[keyName];

  if (finger) {
    if (finger === 'thumb') {
      document.getElementById('finger-thumb-left')?.classList.add('finger--active');
      document.getElementById('finger-thumb-right')?.classList.add('finger--active');
    } else {
      const el = document.getElementById('finger-' + finger);
      if (el) el.classList.add('finger--active');
    }

    if ($label) {
      $label.textContent = FINGER_NAMES[finger] || finger;
      $label.classList.add('label--visible');
    }
  } else {
    if ($label) { $label.textContent = ''; $label.classList.remove('label--visible'); }
  }
}

// Patch highlightKey to also update finger hint
const _origHighlightKey = highlightKey;
highlightKey = function() {
  _origHighlightKey();
  updateFingerHint();
};

/* ── Init ── */
// Restore saved settings to UI controls
$levelSelect.value = settings.level;
$soundModeSelect.value = settings.soundMode;
$keyboardCaseSelect.value = settings.keyboardCase;
$speechRateSelect.value = settings.speechRate || 'normal';
$wordCountSelect.value = settings.wordCount || 10;
$themeSelect.value = settings.theme || 'dark';
$fingerGuideToggle.checked = settings.fingerGuide !== false;
$fingerGuideLabel.textContent = $fingerGuideToggle.checked ? 'Bật' : 'Tắt';

if (!settings.soundEnabled) {
  sound.enabled = false;
  $btnSound.textContent = '🔇';
}

applyTheme(settings.theme || 'dark');
updateModeSubSelectors();

refreshProfileDisplay();

createStars();
buildKeyboard();
if (!settings.fingerGuide && settings.fingerGuide !== undefined) {
  $keyboard.classList.add('keyboard--hide-fingers');
  const $handsGuide = document.getElementById('handsGuide');
  if ($handsGuide) $handsGuide.classList.add('hidden');
}
resetGame();
checkAchievements();
