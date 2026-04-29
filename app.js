/* ── Internationalization (i18n) ── */
const LANG = {
  vi: {
    // Header
    subtitle: 'Luyện gõ phím siêu tốc!',
    // Side nav
    langLabel: '🌐 Ngôn ngữ',
    tipLang: 'Chọn ngôn ngữ',
    tipGameMode: 'Chọn chế độ chơi',
    modeClassic: '🎮 Cổ điển', modeLesson: '🎒 Bài học', modeTimeAttack: '⚡ Đua tốc độ', modeChallenge: '🐉 Thử thách',
    tipLesson: 'Chọn bài học luyện tập',
    lessonAll: '🌈 Tất cả',
    tipTimeAttack: 'Chọn thời gian đua',
    tipLevel: 'Chọn độ khó của từ',
    lvEasy: '🐣 Dễ', lvMedium: '🐥 Vừa', lvHard: '🦅 Khó',
    tipSoundMode: 'Chế độ phát âm tiếng Anh',
    smDefault: '🔔 Mặc định', smChar: '🗣️ Chữ cái', smWord: '💬 Từ',
    btnSettings: '🛠️ Cài đặt', tipSettings: 'Mở cài đặt tùy chỉnh',
    btnHistory: '📈 Lịch sử', tipHistory: 'Xem lịch sử & tiến bộ',
    tipRestart: 'Chơi lại từ đầu', tipSound: 'Bật/tắt âm thanh',
    // Stats bar
    tipTime: 'Thời gian đã chơi', lblTime: 'Thời gian',
    tipCps: 'Ký tự mỗi giây (Characters Per Second)',
    tipWpm: 'Từ mỗi phút (Words Per Minute)',
    tipAccuracy: 'Tỷ lệ gõ đúng', lblAccuracy: 'Chính xác',
    tipScore: 'Điểm số tích lũy (combo tăng điểm)', lblScore: 'Điểm',
    tipBest: 'Kỷ lục WPM cao nhất của level hiện tại', lblBest: 'Kỷ lục WPM',
    tipStreak: 'Số ngày chơi liên tiếp',
    dayUnit: 'ngày',
    // Custom text
    tipCustomText: 'Nhập văn bản tùy chỉnh',
    customTitle: '✏️ Nhập văn bản',
    customDesc: 'Nhập văn bản bạn muốn luyện gõ (tiếng Anh, phân cách bằng dấu cách)',
    customPlaceholder: 'Ví dụ: hello world typing is fun',
    customStart: '🚀 Bắt đầu gõ', customCancel: 'Hủy',
    // Settings
    settingsTitle: '🛠️ Cài đặt',
    profileLabel: 'Hồ sơ', profileDesc: 'Tên và avatar của bạn', profilePlaceholder: 'Nhập tên...',
    achLabel: 'Huy hiệu', achDesc: 'Xem huy hiệu đã mở khóa', achBtn: '🎖️ Xem huy hiệu',
    themeLabel: 'Giao diện', themeDesc: 'Chọn theme phù hợp',
    themeDark: '🌜 Tối', themeLight: '🌤️ Sáng', themeColorful: '🌈 Sắc màu',
    caseLabel: 'Hiển thị bàn phím', caseDesc: 'Chọn chữ hoa hoặc chữ thường trên bàn phím',
    caseLower: '🔡 Chữ thường', caseUpper: '🔠 Chữ hoa',
    speechLabel: 'Tốc độ đọc', speechDesc: 'Tốc độ phát âm trong chế độ đọc chữ cái / đọc từ',
    speechSlow: '🐢 Chậm', speechNormal: '🐇 Vừa', speechFast: '🚀 Nhanh',
    wcLabel: 'Số lượng từ', wcDesc: 'Số từ mỗi lượt chơi', wcUnit: 'từ',
    fgLabel: 'Hướng dẫn ngón tay', fgDesc: 'Hiện viền màu dưới phím gợi ý ngón tay',
    toggleOn: 'Bật', toggleOff: 'Tắt',
    // History
    historyTitle: '📈 Lịch sử & Tiến bộ',
    chartTitle: 'Biểu đồ WPM', recentTitle: 'Lần chơi gần đây',
    thDate: 'Ngày', thLevel: 'Level', thAcc: 'Chính xác', thStars: 'Sao',
    emptyHistory: 'Chưa có lịch sử chơi nào.',
    chartMin: 'Cần ít nhất 2 lần chơi',
    trendUp: 'Đang tiến bộ! WPM tăng {0} so với trước',
    trendDown: 'Cần cố gắng hơn! WPM giảm {0}',
    trendStable: 'Ổn định — tiếp tục luyện tập!',
    streakDays: '{0} ngày liên tiếp',
    gamesPlayed: '{0} lần chơi', wordsTyped: '{0} từ đã gõ',
    // Achievements
    achTitle: '🎖️ Huy hiệu',
    achFirstGame: 'Lần đầu chơi', achFirstGameDesc: 'Hoàn thành lượt chơi đầu tiên',
    ach10Games: '10 lượt chơi', ach10GamesDesc: 'Hoàn thành 10 lượt chơi',
    ach50Games: '50 lượt chơi', ach50GamesDesc: 'Hoàn thành 50 lượt chơi',
    ach100Games: '100 lượt chơi', ach100GamesDesc: 'Hoàn thành 100 lượt chơi',
    achStreak3: '3 ngày liên tiếp', achStreak3Desc: 'Chơi 3 ngày liên tiếp',
    achStreak7: '7 ngày liên tiếp', achStreak7Desc: 'Chơi 7 ngày liên tiếp',
    achStreak30: '30 ngày liên tiếp', achStreak30Desc: 'Chơi 30 ngày liên tiếp',
    achWpm20: 'WPM 20', achWpm20Desc: 'Đạt 20 WPM',
    achWpm40: 'WPM 40', achWpm40Desc: 'Đạt 40 WPM',
    achWpm60: 'WPM 60', achWpm60Desc: 'Đạt 60 WPM',
    achWpm80: 'WPM 80', achWpm80Desc: 'Đạt 80 WPM',
    achWpm100: 'WPM 100', achWpm100Desc: 'Đạt 100 WPM',
    achPerfect: 'Hoàn hảo!', achPerfectDesc: 'Accuracy 100% trong 1 lượt',
    ach3StarAll: 'Ba sao tất cả', ach3StarAllDesc: '3 sao ở cả Easy, Medium, Hard',
    achCombo50: 'Combo 50', achCombo50Desc: 'Đạt combo streak 50',
    achCps5: 'CPS 5', achCps5Desc: 'Đạt tốc độ 5 ký tự/giây',
    // Celebration
    celExcellent: 'Tuyệt vời!', celOutOfLives: 'Hết mạng!', celTimeUp: 'Hết giờ!',
    celPoints: 'điểm', celNewRecord: '🏆 Kỷ lục mới!',
    celAlmostRecord: 'Còn {0} WPM nữa là phá kỷ lục!',
    celRecord: 'Kỷ lục: {0} WPM',
    celConsecutive: 'ngày liên tiếp',
    lblWordsCompleted: 'Từ hoàn thành', lblLivesLeft: 'Mạng còn', lblLesson: 'Bài học',
    lblTimeStat: 'Thời gian', lblAccStat: 'Chính xác', lblPointsStat: 'Điểm',
    mistakeTitle: 'Chữ cái hay sai nhất',
    mistakeTip: 'Hãy luyện thêm chữ {0}!',
    mistakePerfect: 'Hoàn hảo! Không sai chữ nào!',
    btnPlayAgain: '🔄 Chơi lại', btnTryLevel: '🚀 Thử {0}', btnPracticeWeak: '🎯 Luyện chữ yếu',
    lvLabelMedium: 'Trung bình', lvLabelHard: 'Khó',
    // Adaptive
    adaptUp: 'Bạn giỏi lắm! Thử level {0} nhé?',
    adaptDown: 'Hãy thử level {0} để luyện thêm nhé!',
    adaptYes: 'Đồng ý', adaptNo: 'Để sau',
    adaptLvEasy: 'Dễ', adaptLvMedium: 'Trung bình', adaptLvHard: 'Khó',
    // Fingers
    fingerLeftPinky: 'Út trái', fingerLeftRing: 'Áp út trái', fingerLeftMiddle: 'Giữa trái', fingerLeftIndex: 'Trỏ trái',
    fingerRightIndex: 'Trỏ phải', fingerRightMiddle: 'Giữa phải', fingerRightRing: 'Áp út phải', fingerRightPinky: 'Út phải',
    fingerThumb: 'Ngón cái',
    // Profile
    greeting: '{0} Chào, {1}!',
  },
  en: {
    subtitle: 'Super fast typing practice!',
    langLabel: '🌐 Language',
    tipLang: 'Choose language',
    tipGameMode: 'Choose game mode',
    modeClassic: '🎮 Classic', modeLesson: '🎒 Lesson', modeTimeAttack: '⚡ Time Attack', modeChallenge: '🐉 Challenge',
    tipLesson: 'Choose a lesson',
    lessonAll: '🌈 All',
    tipTimeAttack: 'Choose time limit',
    tipLevel: 'Choose difficulty level',
    lvEasy: '🐣 Easy', lvMedium: '🐥 Medium', lvHard: '🦅 Hard',
    tipSoundMode: 'English pronunciation mode',
    smDefault: '🔔 Default', smChar: '🗣️ Letter', smWord: '💬 Word',
    btnSettings: '🛠️ Settings', tipSettings: 'Open settings',
    btnHistory: '📈 History', tipHistory: 'View history & progress',
    tipRestart: 'Restart game', tipSound: 'Toggle sound',
    tipTime: 'Time elapsed', lblTime: 'Time',
    tipCps: 'Characters Per Second',
    tipWpm: 'Words Per Minute',
    tipAccuracy: 'Typing accuracy', lblAccuracy: 'Accuracy',
    tipScore: 'Score (combo increases points)', lblScore: 'Score',
    tipBest: 'Best WPM for current level', lblBest: 'Best WPM',
    tipStreak: 'Consecutive days played',
    dayUnit: 'days',
    tipCustomText: 'Enter custom text',
    customTitle: '✏️ Custom Text',
    customDesc: 'Enter text you want to practice typing (English, separated by spaces)',
    customPlaceholder: 'Example: hello world typing is fun',
    customStart: '🚀 Start Typing', customCancel: 'Cancel',
    settingsTitle: '🛠️ Settings',
    profileLabel: 'Profile', profileDesc: 'Your name and avatar', profilePlaceholder: 'Enter name...',
    achLabel: 'Achievements', achDesc: 'View unlocked achievements', achBtn: '🎖️ View Achievements',
    themeLabel: 'Theme', themeDesc: 'Choose a visual theme',
    themeDark: '🌜 Dark', themeLight: '🌤️ Light', themeColorful: '🌈 Colorful',
    caseLabel: 'Keyboard Display', caseDesc: 'Show uppercase or lowercase on keyboard',
    caseLower: '🔡 Lowercase', caseUpper: '🔠 Uppercase',
    speechLabel: 'Speech Speed', speechDesc: 'Pronunciation speed for letter/word mode',
    speechSlow: '🐢 Slow', speechNormal: '🐇 Normal', speechFast: '🚀 Fast',
    wcLabel: 'Word Count', wcDesc: 'Words per game session', wcUnit: 'words',
    fgLabel: 'Finger Guide', fgDesc: 'Show colored borders hinting which finger to use',
    toggleOn: 'On', toggleOff: 'Off',
    historyTitle: '📈 History & Progress',
    chartTitle: 'WPM Chart', recentTitle: 'Recent Games',
    thDate: 'Date', thLevel: 'Level', thAcc: 'Accuracy', thStars: 'Stars',
    emptyHistory: 'No game history yet.',
    chartMin: 'Need at least 2 games',
    trendUp: 'Improving! WPM increased by {0}',
    trendDown: 'Keep trying! WPM decreased by {0}',
    trendStable: 'Stable — keep practicing!',
    streakDays: '{0} consecutive days',
    gamesPlayed: '{0} games played', wordsTyped: '{0} words typed',
    achTitle: '🎖️ Achievements',
    achFirstGame: 'First Game', achFirstGameDesc: 'Complete your first game',
    ach10Games: '10 Games', ach10GamesDesc: 'Complete 10 games',
    ach50Games: '50 Games', ach50GamesDesc: 'Complete 50 games',
    ach100Games: '100 Games', ach100GamesDesc: 'Complete 100 games',
    achStreak3: '3-Day Streak', achStreak3Desc: 'Play 3 days in a row',
    achStreak7: '7-Day Streak', achStreak7Desc: 'Play 7 days in a row',
    achStreak30: '30-Day Streak', achStreak30Desc: 'Play 30 days in a row',
    achWpm20: 'WPM 20', achWpm20Desc: 'Reach 20 WPM',
    achWpm40: 'WPM 40', achWpm40Desc: 'Reach 40 WPM',
    achWpm60: 'WPM 60', achWpm60Desc: 'Reach 60 WPM',
    achWpm80: 'WPM 80', achWpm80Desc: 'Reach 80 WPM',
    achWpm100: 'WPM 100', achWpm100Desc: 'Reach 100 WPM',
    achPerfect: 'Perfect!', achPerfectDesc: '100% accuracy in one game',
    ach3StarAll: '3 Stars All', ach3StarAllDesc: '3 stars on Easy, Medium & Hard',
    achCombo50: 'Combo 50', achCombo50Desc: 'Reach a 50 combo streak',
    achCps5: 'CPS 5', achCps5Desc: 'Reach 5 characters per second',
    celExcellent: 'Excellent!', celOutOfLives: 'Out of Lives!', celTimeUp: "Time's Up!",
    celPoints: 'points', celNewRecord: '🏆 New Record!',
    celAlmostRecord: '{0} more WPM to break your record!',
    celRecord: 'Record: {0} WPM',
    celConsecutive: 'consecutive days',
    lblWordsCompleted: 'Words Done', lblLivesLeft: 'Lives Left', lblLesson: 'Lesson',
    lblTimeStat: 'Time', lblAccStat: 'Accuracy', lblPointsStat: 'Points',
    mistakeTitle: 'Most Mistyped Letters',
    mistakeTip: 'Practice the letter {0}!',
    mistakePerfect: 'Perfect! No mistakes!',
    btnPlayAgain: '🔄 Play Again', btnTryLevel: '🚀 Try {0}', btnPracticeWeak: '🎯 Practice Weak',
    lvLabelMedium: 'Medium', lvLabelHard: 'Hard',
    adaptUp: "You're great! Try {0} level?",
    adaptDown: 'Try {0} level for more practice!',
    adaptYes: 'Yes', adaptNo: 'Later',
    adaptLvEasy: 'Easy', adaptLvMedium: 'Medium', adaptLvHard: 'Hard',
    fingerLeftPinky: 'Left Pinky', fingerLeftRing: 'Left Ring', fingerLeftMiddle: 'Left Middle', fingerLeftIndex: 'Left Index',
    fingerRightIndex: 'Right Index', fingerRightMiddle: 'Right Middle', fingerRightRing: 'Right Ring', fingerRightPinky: 'Right Pinky',
    fingerThumb: 'Thumb',
    greeting: '{0} Hi, {1}!',
  },
};

let currentLang = 'vi';

function t(key) {
  return (LANG[currentLang] && LANG[currentLang][key]) || (LANG.vi[key]) || key;
}

function tReplace(key, ...args) {
  let str = t(key);
  args.forEach((val, i) => { str = str.replace(`{${i}}`, val); });
  return str;
}

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
  { id: 'first_game', icon: '🌟', nameKey: 'achFirstGame', descKey: 'achFirstGameDesc', check: (r) => r.totalGames >= 1 },
  { id: 'games_10', icon: '📚', nameKey: 'ach10Games', descKey: 'ach10GamesDesc', check: (r) => r.totalGames >= 10 },
  { id: 'games_50', icon: '📖', nameKey: 'ach50Games', descKey: 'ach50GamesDesc', check: (r) => r.totalGames >= 50 },
  { id: 'games_100', icon: '🏅', nameKey: 'ach100Games', descKey: 'ach100GamesDesc', check: (r) => r.totalGames >= 100 },
  { id: 'streak_3', icon: '🔥', nameKey: 'achStreak3', descKey: 'achStreak3Desc', check: (r) => r.dayStreak >= 3 },
  { id: 'streak_7', icon: '🔥', nameKey: 'achStreak7', descKey: 'achStreak7Desc', check: (r) => r.dayStreak >= 7 },
  { id: 'streak_30', icon: '🌋', nameKey: 'achStreak30', descKey: 'achStreak30Desc', check: (r) => r.dayStreak >= 30 },
  { id: 'wpm_20', icon: '💨', nameKey: 'achWpm20', descKey: 'achWpm20Desc', check: (r) => Math.max(r.bestWpm.easy || 0, r.bestWpm.medium || 0, r.bestWpm.hard || 0) >= 20 },
  { id: 'wpm_40', icon: '💨', nameKey: 'achWpm40', descKey: 'achWpm40Desc', check: (r) => Math.max(r.bestWpm.easy || 0, r.bestWpm.medium || 0, r.bestWpm.hard || 0) >= 40 },
  { id: 'wpm_60', icon: '🚀', nameKey: 'achWpm60', descKey: 'achWpm60Desc', check: (r) => Math.max(r.bestWpm.easy || 0, r.bestWpm.medium || 0, r.bestWpm.hard || 0) >= 60 },
  { id: 'wpm_80', icon: '🚀', nameKey: 'achWpm80', descKey: 'achWpm80Desc', check: (r) => Math.max(r.bestWpm.easy || 0, r.bestWpm.medium || 0, r.bestWpm.hard || 0) >= 80 },
  { id: 'wpm_100', icon: '⚡', nameKey: 'achWpm100', descKey: 'achWpm100Desc', check: (r) => Math.max(r.bestWpm.easy || 0, r.bestWpm.medium || 0, r.bestWpm.hard || 0) >= 100 },
  { id: 'perfect', icon: '🎯', nameKey: 'achPerfect', descKey: 'achPerfectDesc', check: (r, h) => h.some(g => g.accuracy === 100) },
  { id: 'three_star_all', icon: '🏆', nameKey: 'ach3StarAll', descKey: 'ach3StarAllDesc', check: (r, h) => {
    const levels = ['easy', 'medium', 'hard'];
    return levels.every(l => h.some(g => g.level === l && g.stars === 3));
  }},
  { id: 'combo_50', icon: '🦸', nameKey: 'achCombo50', descKey: 'achCombo50Desc', check: (r, h) => h.some(g => (g.maxCombo || 0) >= 50) },
  { id: 'cps_5', icon: '⚡', nameKey: 'achCps5', descKey: 'achCps5Desc', check: (r, h) => h.some(g => Number(g.cps) >= 5) },
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
  lang: 'vi',
};

const settings = { ...DEFAULT_SETTINGS, ...Storage.loadSettings() };
currentLang = settings.lang || 'vi';

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

    // Pop animation on the typed char (all modes)
    currentEl.classList.add('char--pop');

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
    $cEmoji.textContent = '😵';
    $cTitle.textContent = t('celOutOfLives');
  } else if (state.gameMode === 'timeAttack') {
    $cEmoji.textContent = '⏰';
    $cTitle.textContent = t('celTimeUp');
  } else {
    $cEmoji.textContent = '🥳';
    $cTitle.textContent = t('celExcellent');
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
  document.getElementById('celebrationScore').textContent = `${finalScore.toLocaleString()} ${t('celPoints')}`;

  // ── Record comparison ──
  let recordHtml = '';
  if (isNewBestWpm || isNewBestAcc || isNewBestScore) {
    recordHtml = `<span class="new-record">${t('celNewRecord')}</span>`;
  } else if (prevBestWpm > 0) {
    const diff = prevBestWpm - Number(wpm);
    if (diff <= 5 && diff > 0) {
      recordHtml = `<span class="record-close">${tReplace('celAlmostRecord', diff)}</span>`;
    } else if (diff > 5) {
      recordHtml = `<span class="record-info">${tReplace('celRecord', prevBestWpm)}</span>`;
    }
  }
  recordHtml += `<span class="record-info">🎮 ${tReplace('gamesPlayed', records.totalGames)} | 🔥 ${records.dayStreak} ${t('celConsecutive')}</span>`;
  document.getElementById('celebrationRecord').innerHTML = recordHtml;

  // ── Stats grid ──
  let modeStatHtml = '';
  if (state.gameMode === 'timeAttack') {
    modeStatHtml = `<div class="cstat"><span class="cstat-val">${state.wordsCompleted}</span><span class="cstat-lbl">${t('lblWordsCompleted')}</span></div>`;
  } else if (state.gameMode === 'challenge') {
    modeStatHtml = `<div class="cstat"><span class="cstat-val">${'❤️'.repeat(state.lives)}</span><span class="cstat-lbl">${t('lblLivesLeft')}</span></div>`;
  } else if (state.gameMode === 'lesson') {
    const lessonName = (LESSONS[state.lessonIndex] || LESSONS[0]).name;
    modeStatHtml = `<div class="cstat"><span class="cstat-val">${lessonName}</span><span class="cstat-lbl">${t('lblLesson')}</span></div>`;
  }
  document.getElementById('celebrationStats').innerHTML = `
    <div class="cstat"><span class="cstat-val">${formatTime(elapsed)}</span><span class="cstat-lbl">${t('lblTimeStat')}</span></div>
    <div class="cstat"><span class="cstat-val">${cps}</span><span class="cstat-lbl">CPS</span></div>
    <div class="cstat"><span class="cstat-val">${wpm}</span><span class="cstat-lbl">WPM</span></div>
    <div class="cstat"><span class="cstat-val">${acc}%</span><span class="cstat-lbl">${t('lblAccStat')}</span></div>
    <div class="cstat"><span class="cstat-val">x${state.maxCombo}</span><span class="cstat-lbl">Max Combo</span></div>
    <div class="cstat"><span class="cstat-val">${finalScore.toLocaleString()}</span><span class="cstat-lbl">${t('lblPointsStat')}</span></div>
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
      <div class="mistakes-title">${t('mistakeTitle')}</div>
      <div class="mistakes-list">${chars}</div>
      <div class="mistakes-tip">${tReplace('mistakeTip', top3.map(([ch]) => ch.toUpperCase()).join(', '))}</div>
    `;
  } else {
    $mistakes.innerHTML = `<div class="mistakes-title perfect">${t('mistakePerfect')}</div>`;
  }

  // ── Action buttons ──
  const $actions = document.getElementById('celebrationActions');
  let actionsHtml = `<button class="btn btn-restart" id="btnPlayAgain">${t('btnPlayAgain')}</button>`;

  const nextLevel = { easy: 'medium', medium: 'hard' };
  if (starCount === 3 && nextLevel[state.level]) {
    const nlKey = nextLevel[state.level];
    const nlLabel = { medium: t('lvLabelMedium'), hard: t('lvLabelHard') };
    actionsHtml += `<button class="btn btn-level-up" data-level="${nlKey}">${tReplace('btnTryLevel', nlLabel[nlKey])}</button>`;
  }

  if (mistakes.length > 0) {
    const weakChars = mistakes.slice(0, 5).map(([ch]) => ch).join(',');
    actionsHtml += `<button class="btn btn-practice" data-chars="${weakChars}">${t('btnPracticeWeak')}</button>`;
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
  $dayStreak.textContent = `${rec.dayStreak} ${t('dayUnit')}`;
}

/* ── Profile Display ── */
function refreshProfileDisplay() {
  const profile = Storage.loadProfile();
  const $greeting = document.getElementById('profileGreeting');
  if ($greeting && profile.name) {
    $greeting.textContent = tReplace('greeting', profile.avatar, profile.name);
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
  popup.innerHTML = `<span class="ach-icon">${ach.icon}</span><div class="ach-info"><strong>${t(ach.nameKey)}</strong><span>${t(ach.descKey)}</span></div>`;
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
  const levelLabels = { easy: t('adaptLvEasy'), medium: t('adaptLvMedium'), hard: t('adaptLvHard') };

  if (avgAcc >= 95 && avgWpm >= threshold.wpm && nextLevel[state.level]) {
    showAdaptivePopup(tReplace('adaptUp', levelLabels[nextLevel[state.level]]), nextLevel[state.level]);
  } else if (avgAcc < 70 && prevLevel[state.level]) {
    showAdaptivePopup(tReplace('adaptDown', levelLabels[prevLevel[state.level]]), prevLevel[state.level]);
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
      <button class="btn adaptive-yes">${t('adaptYes')}</button>
      <button class="btn adaptive-no">${t('adaptNo')}</button>
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
  if (document.querySelector('.settings-overlay.settings--visible')) return;
  const data = e.data;
  if (data && data.length === 1) {
    handleKey(data);
  }
  $hiddenInput.value = '';
});

// Keyboard events for special keys and visual feedback
document.addEventListener('keydown', (e) => {
  // Skip when an overlay is open (settings, custom text, etc.)
  if (document.querySelector('.settings-overlay.settings--visible')) return;
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

// Click anywhere to focus input (skip when overlays are open)
document.addEventListener('click', (e) => {
  if (document.querySelector('.settings-overlay.settings--visible')) return;
  if (e.target.closest('.btn') || e.target.closest('select') || e.target.closest('.btn-custom-text')) return;
  focusInput();
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

function applyLanguage(lang) {
  currentLang = lang;
  document.documentElement.lang = lang === 'vi' ? 'vi' : 'en';

  // Helper to set options of a select
  const setOpts = (sel, optMap) => {
    Array.from(sel.options).forEach(opt => {
      if (optMap[opt.value]) opt.textContent = optMap[opt.value];
    });
  };

  // Subtitle
  document.querySelector('.subtitle').textContent = t('subtitle');

  // Side nav selects
  setOpts($gameModeSelect, { classic: t('modeClassic'), lesson: t('modeLesson'), timeAttack: t('modeTimeAttack'), challenge: t('modeChallenge') });
  setOpts($levelSelect, { easy: t('lvEasy'), medium: t('lvMedium'), hard: t('lvHard') });
  setOpts($soundModeSelect, { default: t('smDefault'), character: t('smChar'), word: t('smWord') });

  // Lesson select — only option 4 needs translation
  const lessonOpt4 = $lessonSelect.querySelector('option[value="4"]');
  if (lessonOpt4) lessonOpt4.textContent = t('lessonAll');

  // Side nav buttons
  document.getElementById('btnSettings').textContent = t('btnSettings');
  document.getElementById('btnHistory').textContent = t('btnHistory');

  // Tooltips
  const tips = {
    tipLang: document.getElementById('langSelect')?.closest('.nav-wrap'),
    tipGameMode: $gameModeSelect.closest('.nav-wrap'),
    tipLesson: $lessonSelect.closest('.nav-wrap'),
    tipTimeAttack: $timeAttackSelect.closest('.nav-wrap'),
    tipLevel: $levelSelect.closest('.nav-wrap'),
    tipSoundMode: $soundModeSelect.closest('.nav-wrap'),
  };
  for (const [key, el] of Object.entries(tips)) {
    if (el) el.dataset.tooltip = t(key);
  }
  document.getElementById('btnSettings').dataset.tooltip = t('tipSettings');
  document.getElementById('btnHistory').dataset.tooltip = t('tipHistory');
  document.getElementById('btnRestart').dataset.tooltip = t('tipRestart');
  document.getElementById('btnSound').dataset.tooltip = t('tipSound');

  // Stats bar labels + tooltips
  const statMap = [
    ['stat-time', 'lblTime', 'tipTime'],
    ['stat-cps', null, 'tipCps'],
    ['stat-wpm', null, 'tipWpm'],
    ['stat-accuracy', 'lblAccuracy', 'tipAccuracy'],
    ['stat-score', 'lblScore', 'tipScore'],
    ['stat-best', 'lblBest', 'tipBest'],
    ['stat-streak', null, 'tipStreak'],
  ];
  for (const [cls, lblKey, tipKey] of statMap) {
    const card = document.querySelector(`.${cls}`);
    if (!card) continue;
    if (tipKey) card.dataset.tooltip = t(tipKey);
    if (lblKey) {
      const lbl = card.querySelector('.stat-label');
      if (lbl) lbl.textContent = t(lblKey);
    }
  }

  // Custom text
  const ctBtn = document.querySelector('.btn-custom-tooltip');
  if (ctBtn) ctBtn.textContent = t('tipCustomText');
  const ctTitle = document.querySelector('#customTextPanel .settings-title');
  if (ctTitle) ctTitle.textContent = t('customTitle');
  const ctDesc = document.querySelector('#customTextPanel .setting-desc');
  if (ctDesc) ctDesc.textContent = t('customDesc');
  const ctInput = document.getElementById('customTextInput');
  if (ctInput) ctInput.placeholder = t('customPlaceholder');
  const ctApply = document.getElementById('customTextApply');
  if (ctApply) ctApply.textContent = t('customStart');
  const ctCancel = document.getElementById('customTextCancel');
  if (ctCancel) ctCancel.textContent = t('customCancel');

  // Settings panel
  const sp = document.getElementById('settingsPanel');
  if (sp) {
    sp.querySelector('.settings-title').textContent = t('settingsTitle');
    const labels = sp.querySelectorAll('.setting-label');
    const descs = sp.querySelectorAll('.setting-desc');
    const labelKeys = ['profileLabel', 'achLabel', 'themeLabel', 'caseLabel', 'speechLabel', 'wcLabel', 'fgLabel'];
    const descKeys = ['profileDesc', 'achDesc', 'themeDesc', 'caseDesc', 'speechDesc', 'wcDesc', 'fgDesc'];
    labelKeys.forEach((k, i) => { if (labels[i]) labels[i].textContent = t(k); });
    descKeys.forEach((k, i) => { if (descs[i]) descs[i].textContent = t(k); });
  }
  const profInput = document.getElementById('profileName');
  if (profInput) profInput.placeholder = t('profilePlaceholder');
  const achBtn = document.getElementById('btnAchievements');
  if (achBtn) achBtn.textContent = t('achBtn');
  const thSel = document.getElementById('themeSelect');
  if (thSel) setOpts(thSel, { dark: t('themeDark'), light: t('themeLight'), colorful: t('themeColorful') });
  const caseSel = document.getElementById('keyboardCaseSelect');
  if (caseSel) setOpts(caseSel, { lower: t('caseLower'), upper: t('caseUpper') });
  const spSel = document.getElementById('speechRateSelect');
  if (spSel) setOpts(spSel, { slow: t('speechSlow'), normal: t('speechNormal'), fast: t('speechFast') });
  const wcSel = document.getElementById('wordCountSelect');
  if (wcSel) {
    Array.from(wcSel.options).forEach(opt => { opt.textContent = `${opt.value} ${t('wcUnit')}`; });
  }
  const fgLabel = document.getElementById('fingerGuideLabel');
  if (fgLabel) fgLabel.textContent = $fingerGuideToggle.checked ? t('toggleOn') : t('toggleOff');

  // History panel
  const hp = document.getElementById('historyPanel');
  if (hp) {
    hp.querySelector('.settings-title').textContent = t('historyTitle');
    const sections = hp.querySelectorAll('.history-section-title');
    if (sections[0]) sections[0].textContent = t('chartTitle');
    if (sections[1]) sections[1].textContent = t('recentTitle');
    const ths = hp.querySelectorAll('th');
    const thKeys = ['thDate', 'thLevel', null, 'thAcc', 'thStars'];
    thKeys.forEach((k, i) => { if (k && ths[i]) ths[i].textContent = t(k); });
    const empty = document.getElementById('historyEmpty');
    if (empty) empty.textContent = t('emptyHistory');
  }

  // Achievements panel title
  const achPanel = document.getElementById('achievementsPanel');
  if (achPanel) achPanel.querySelector('.settings-title').textContent = t('achTitle');

  // Refresh records display (for day unit)
  refreshRecordsDisplay();
  refreshProfileDisplay();
}

function updateModeSubSelectors() {
  // Toggle on the wrapper .nav-wrap div (parent of the select)
  const lessonWrap = $lessonSelect.closest('.nav-wrap') || $lessonSelect;
  const timeWrap = $timeAttackSelect.closest('.nav-wrap') || $timeAttackSelect;
  lessonWrap.classList.toggle('hidden', state.gameMode !== 'lesson');
  timeWrap.classList.toggle('hidden', state.gameMode !== 'timeAttack');
}

/* ── Language Selector ── */
const $langSelect = document.getElementById('langSelect');
$langSelect.addEventListener('change', (e) => {
  settings.lang = e.target.value;
  persistSettings();
  applyLanguage(e.target.value);
});

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
    $streak.innerHTML = `<span class="streak-fire">🔥</span> ${tReplace('streakDays', records.dayStreak)} <span class="streak-sub">| ${tReplace('gamesPlayed', records.totalGames)} | ${tReplace('wordsTyped', records.totalWords)}</span>`;
    $streak.classList.remove('hidden');
  } else {
    $streak.innerHTML = `<span class="streak-sub">🎮 ${tReplace('gamesPlayed', records.totalGames)} | ${tReplace('wordsTyped', records.totalWords)}</span>`;
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
    svg.innerHTML = `<text x="190" y="85" text-anchor="middle" fill="var(--color-text-dim)" font-size="12">${t('chartMin')}</text>`;
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
    text = tReplace('trendUp', Math.round(diff));
    cls = 'trend--up';
  } else if (diff < -3) {
    icon = '📉';
    text = tReplace('trendDown', Math.round(Math.abs(diff)));
    cls = 'trend--down';
  } else {
    icon = '➡️';
    text = t('trendStable');
    cls = 'trend--stable';
  }

  $trend.innerHTML = `<span class="trend-icon">${icon}</span> <span class="trend-text">${text}</span>`;
  $trend.className = `history-trend ${cls}`;
}

/* ── Custom Text ── */
const $btnCustomText = document.getElementById('btnCustomText');
const $customTextPanel = document.getElementById('customTextPanel');
const $customTextClose = document.getElementById('customTextClose');
const $customTextInput = document.getElementById('customTextInput');
const $customTextApply = document.getElementById('customTextApply');
const $customTextCancel = document.getElementById('customTextCancel');

$btnCustomText.addEventListener('click', () => {
  $customTextPanel.classList.add('settings--visible');
  $customTextInput.focus();
});

$customTextClose.addEventListener('click', () => {
  $customTextPanel.classList.remove('settings--visible');
});

$customTextCancel.addEventListener('click', () => {
  $customTextPanel.classList.remove('settings--visible');
});

$customTextPanel.addEventListener('click', (e) => {
  if (e.target === $customTextPanel) {
    $customTextPanel.classList.remove('settings--visible');
  }
});

$customTextApply.addEventListener('click', () => {
  const raw = $customTextInput.value.trim().toLowerCase().replace(/[^a-z\s]/g, '').replace(/\s+/g, ' ');
  if (!raw) return;

  $customTextPanel.classList.remove('settings--visible');

  // Reset game with custom text
  if (window.speechSynthesis) window.speechSynthesis.cancel();
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

  state.text = raw;

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
  $celebration.classList.remove('celebration--visible');
  updateComboDisplay();
  updateLivesDisplay();
  const $score = document.getElementById('score');
  if ($score) $score.textContent = '0';

  refreshRecordsDisplay();
  renderText();
  focusInput();
});

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
      <strong class="ach-card-name">${t(ach.nameKey)}</strong>
      <span class="ach-card-desc">${t(ach.descKey)}</span>
    </div>`;
  }).join('');
}

/* ── Finger Hint ── */
function getFingerName(finger) {
  const map = {
    'left-pinky': 'fingerLeftPinky', 'left-ring': 'fingerLeftRing',
    'left-middle': 'fingerLeftMiddle', 'left-index': 'fingerLeftIndex',
    'right-index': 'fingerRightIndex', 'right-middle': 'fingerRightMiddle',
    'right-ring': 'fingerRightRing', 'right-pinky': 'fingerRightPinky',
    'thumb': 'fingerThumb',
  };
  return t(map[finger] || 'fingerThumb');
}
// Keep FINGER_NAMES as getter for backward compat
const FINGER_NAMES = new Proxy({}, { get: (_, key) => getFingerName(key) });

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
$langSelect.value = settings.lang || 'vi';
applyLanguage(settings.lang || 'vi');
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
