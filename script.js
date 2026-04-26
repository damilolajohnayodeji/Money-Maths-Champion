/* =====================================================
   STATE
===================================================== */
let currentCategory = 'mult';
let score = 0;
let questionNumber = 0;
let streak = 0;
let timerOn = false;
let timerInterval = null;
let timerSeconds = 30;
let timerStartSeconds = 0;
let currentCorrectIndex = 0;
let answered = false;

/* =====================================================
   THEME
===================================================== */
function applyTheme(dark) {
  document.body.setAttribute('data-theme', dark ? 'dark' : 'light');
  const icon = dark ? '🌙' : '☀️';
  document.getElementById('btn-theme').textContent = icon;
  document.getElementById('btn-theme-home').textContent = icon;
  localStorage.setItem('mmc-theme', dark ? 'dark' : 'light');
}
function toggleTheme() {
  const isDark = document.body.getAttribute('data-theme') === 'dark';
  applyTheme(!isDark);
}
// Load saved theme
(function() {
  const saved = localStorage.getItem('mmc-theme');
  applyTheme(saved === 'dark');
})();

/* =====================================================
   TIMER
===================================================== */
function toggleTimer() {
  timerOn = !timerOn;
  const btn = document.getElementById('btn-timer-toggle');
  const display = document.getElementById('timer-display');
  if (timerOn) {
    btn.textContent = '⏱ ON';
    btn.classList.remove('off'); btn.classList.add('on');
    display.style.display = 'flex';
  } else {
    btn.textContent = '⏱ OFF';
    btn.classList.remove('on'); btn.classList.add('off');
    display.style.display = 'none';
    clearTimerInterval();
  }
}

function startTimer() {
  clearTimerInterval();
  if (!timerOn) return;
  timerSeconds = 30;
  timerStartSeconds = Date.now();
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - timerStartSeconds) / 1000);
    timerSeconds = Math.max(0, 30 - elapsed);
    updateTimerDisplay();
    if (timerSeconds <= 0) {
      clearTimerInterval();
      handleTimeout();
    }
  }, 200);
}

function clearTimerInterval() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  const disp = document.getElementById('timer-display');
  disp.classList.remove('urgent');
}

function updateTimerDisplay() {
  const el = document.getElementById('timer-count');
  const disp = document.getElementById('timer-display');
  el.textContent = timerSeconds;
  if (timerSeconds <= 8) {
    disp.classList.add('urgent');
  } else {
    disp.classList.remove('urgent');
  }
}

function getElapsed() {
  return Math.floor((Date.now() - timerStartSeconds) / 1000);
}

/* =====================================================
   SCREENS
===================================================== */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  const topBar = document.getElementById('top-bar');
  topBar.style.display = id === 'screen-home' ? 'none' : 'flex';
}

function goHome() {
  clearTimerInterval();
  score = 0; questionNumber = 0; streak = 0;
  document.getElementById('score-display').textContent = '0';
  updateStreakBadge();
  showScreen('screen-home');
}

/* =====================================================
   CATEGORY START
===================================================== */
function startCategory(cat) {
  currentCategory = cat;
  score = 0; questionNumber = 0; streak = 0;
  document.getElementById('score-display').textContent = '0';
  updateStreakBadge();

  const header = document.getElementById('cat-header');
  const icon = document.getElementById('cat-icon');
  const title = document.getElementById('cat-title');
  header.className = 'cat-header';

  if (cat === 'mult') {
    header.classList.add('mult');
    icon.textContent = '✖️';
    title.textContent = 'Multiplication of Money';
  } else if (cat === 'div') {
    header.classList.add('div');
    icon.textContent = '➗';
    title.textContent = 'Division of Money';
  } else {
    header.classList.add('word');
    icon.textContent = '📖';
    title.textContent = 'Word Problems';
  }

  showScreen('screen-question');
  generateQuestion();
}

/* =====================================================
   QUESTION GENERATORS
===================================================== */

// Utility: round to 2 decimal places (avoids floating point errors)
function r2(n) { return Math.round(n * 100) / 100; }
function fmt(n) { return '₦' + r2(n).toFixed(2); }

// Generate wrong answers that look realistic
function generateWrongAnswers(correct, count, category) {
  const wrongs = new Set();
  const variants = [];

  // systematic variants
  variants.push(r2(correct + 0.50));
  variants.push(r2(correct - 0.50));
  variants.push(r2(correct + 1.00));
  variants.push(r2(correct - 1.00));
  variants.push(r2(correct + 2.50));
  variants.push(r2(correct * 1.1));
  variants.push(r2(correct * 0.9));
  variants.push(r2(correct + 5.00));
  variants.push(r2(correct - 5.00));
  variants.push(r2(correct + 0.25));
  variants.push(r2(correct - 0.25));
  variants.push(r2(correct + 3.75));

  for (const v of variants) {
    if (v > 0 && v !== correct) wrongs.add(v);
    if (wrongs.size >= count) break;
  }

  // fallback random
  while (wrongs.size < count) {
    const delta = (Math.floor(Math.random() * 20) + 1) * 0.25;
    const sign = Math.random() > 0.5 ? 1 : -1;
    const candidate = r2(correct + sign * delta);
    if (candidate > 0 && candidate !== correct) wrongs.add(candidate);
  }

  return Array.from(wrongs).slice(0, count);
}

// Shuffle array
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ----- MULTIPLICATION QUESTIONS ----- */
const multTemplates = [
  () => {
    const amounts = [4.50,6.75,8.25,3.50,5.75,7.50,2.25,9.50,11.25,15.50,12.50,4.75,8.40,6.25,3.75,14.50,7.25,10.50,18.25,20.50,16.75,13.50,22.25,5.50,9.75];
    const multipliers = [2,3,4,5,6,7,8,9,10];
    const a = amounts[Math.floor(Math.random()*amounts.length)];
    const m = multipliers[Math.floor(Math.random()*multipliers.length)];
    const correct = r2(a * m);
    return {
      questionText: `${fmt(a)} × ${m} = ?`,
      correct,
      wordProblem: false
    };
  },
  () => {
    const amounts = [3.25,5.50,7.80,4.60,9.25,6.40,8.15,11.50,2.75,13.25];
    const multipliers = [2,3,4,5,6];
    const a = amounts[Math.floor(Math.random()*amounts.length)];
    const m = multipliers[Math.floor(Math.random()*multipliers.length)];
    const correct = r2(a * m);
    return {
      questionText: `${fmt(a)} × ${m} = ?`,
      correct,
      wordProblem: false
    };
  }
];

/* ----- DIVISION QUESTIONS ----- */
const divTemplates = [
  () => {
    const divisors = [2,3,4,5,6,8,10];
    const quotients = [2.50,3.00,4.50,5.25,6.00,7.50,8.25,10.00,12.50,15.00,3.75,4.00,5.50,6.25,8.00,9.50,11.25,2.00,4.25,5.00];
    const d = divisors[Math.floor(Math.random()*divisors.length)];
    const q = quotients[Math.floor(Math.random()*quotients.length)];
    const dividend = r2(d * q);
    return {
      questionText: `${fmt(dividend)} ÷ ${d} = ?`,
      correct: q,
      wordProblem: false
    };
  }
];

/* ----- WORD PROBLEM QUESTIONS ----- */
const wordTemplates = [
  // Multiplication problems
  () => {
    const names = ['Ada','Emeka','Chioma','Tunde','Ngozi','Bello','Kemi','Sola','Aisha','Chidi','Fatima','Ade'];
    const items = [
      {item:'pencils',price:12.50}, {item:'oranges',price:8.75}, {item:'books',price:25.50},
      {item:'pens',price:5.25}, {item:'rulers',price:7.50}, {item:'mangoes',price:4.50},
      {item:'bananas',price:3.25}, {item:'notebooks',price:18.75}, {item:'erasers',price:2.50},
      {item:'biscuits',price:6.50}, {item:'apples',price:9.25}, {item:'bags of rice',price:35.50}
    ];
    const qtys = [2,3,4,5,6,7,8];
    const name = names[Math.floor(Math.random()*names.length)];
    const obj = items[Math.floor(Math.random()*items.length)];
    const qty = qtys[Math.floor(Math.random()*qtys.length)];
    const correct = r2(obj.price * qty);
    return {
      questionText: '',
      wordText: `${name} bought ${qty} ${obj.item} costing ${fmt(obj.price)} each. How much did ${name} pay in total?`,
      correct,
      wordProblem: true
    };
  },
  // Division problems
  () => {
    const names = ['Ada','Emeka','Chioma','Tunde','Ngozi','Bello','Kemi','Sola'];
    const divisors = [2,3,4,5,6];
    const quotients = [5.00,7.50,8.25,10.00,12.50,15.00,3.75,6.25,9.00,4.50,8.00,11.25,6.00,4.00,5.50];
    const name = names[Math.floor(Math.random()*names.length)];
    const d = divisors[Math.floor(Math.random()*divisors.length)];
    const q = quotients[Math.floor(Math.random()*quotients.length)];
    const total = r2(d * q);
    return {
      questionText: '',
      wordText: `${fmt(total)} is shared equally among ${d} children. How much does each child receive?`,
      correct: q,
      wordProblem: true
    };
  },
  // More word problems
  () => {
    const scenarios = [
      { template: (p,n) => `A market woman sells pens for ${fmt(p)} each. She sold ${n} pens. How much money did she collect?`, mult: true },
      { template: (p,n) => `A bus ticket costs ${fmt(p)}. What is the total cost of ${n} tickets?`, mult: true },
      { template: (p,n) => `A bag of groundnuts costs ${fmt(p)}. How much will ${n} bags cost?`, mult: true },
    ];
    const prices = [4.50,6.75,8.50,3.25,5.50,7.00,9.25,10.50,12.00,15.25];
    const qtys = [2,3,4,5,6,7,8];
    const sc = scenarios[Math.floor(Math.random()*scenarios.length)];
    const p = prices[Math.floor(Math.random()*prices.length)];
    const n = qtys[Math.floor(Math.random()*qtys.length)];
    const correct = r2(p * n);
    return {
      questionText: '',
      wordText: sc.template(p, n),
      correct,
      wordProblem: true
    };
  },
  () => {
    const divisors = [2,3,4,5];
    const quotients = [5.00,6.25,7.50,8.00,10.00,12.50,4.50,9.00,6.00,8.75];
    const d = divisors[Math.floor(Math.random()*divisors.length)];
    const q = quotients[Math.floor(Math.random()*quotients.length)];
    const total = r2(d * q);
    const scenarios = [
      `A teacher shares ${fmt(total)} equally among ${d} students as a reward. How much does each student get?`,
      `${fmt(total)} was collected from ${d} families equally. How much did each family pay?`,
      `A pizza costing ${fmt(total)} was shared equally by ${d} friends. How much did each friend pay?`,
    ];
    const wordText = scenarios[Math.floor(Math.random()*scenarios.length)];
    return {
      questionText: '',
      wordText,
      correct: q,
      wordProblem: true
    };
  }
];

function generateQuestion() {
  answered = false;
  questionNumber++;
  document.getElementById('q-number').textContent = `#${questionNumber}`;

  // Reset UI
  document.getElementById('stars-row').classList.remove('show');
  document.getElementById('feedback-card').className = 'feedback-card';
  document.getElementById('btn-next').className = 'btn btn-next';

  const answerBtns = document.querySelectorAll('.answer-btn');
  answerBtns.forEach(btn => {
    btn.className = 'answer-btn';
    btn.disabled = false;
  });

  // Generate question data
  let qData;
  if (currentCategory === 'mult') {
    const tpl = multTemplates[Math.floor(Math.random()*multTemplates.length)];
    qData = tpl();
  } else if (currentCategory === 'div') {
    const tpl = divTemplates[Math.floor(Math.random()*divTemplates.length)];
    qData = tpl();
  } else {
    const tpl = wordTemplates[Math.floor(Math.random()*wordTemplates.length)];
    qData = tpl();
  }

  // Show/hide word problem text
  const qTextEl = document.getElementById('q-text');
  const qWordEl = document.getElementById('q-word-text');

  if (qData.wordProblem) {
    qTextEl.style.display = 'none';
    qWordEl.style.display = 'block';
    qWordEl.textContent = qData.wordText;
  } else {
    qTextEl.style.display = 'block';
    qWordEl.style.display = 'none';
    qTextEl.textContent = qData.questionText;
  }

  // Generate 4 options
  const correct = qData.correct;
  const wrongs = generateWrongAnswers(correct, 3, currentCategory);
  const options = shuffle([correct, ...wrongs]);

  currentCorrectIndex = options.indexOf(correct);

  options.forEach((val, i) => {
    document.getElementById(`ans-${i}`).textContent = fmt(val);
    document.getElementById(`ans-${i}`).dataset.value = val;
  });

  // Animate card
  const card = document.getElementById('question-card');
  card.style.animation = 'none';
  card.offsetHeight; // reflow
  card.style.animation = '';

  // Start timer
  startTimer();
}

/* =====================================================
   ANSWER SELECTION
===================================================== */
function selectAnswer(idx) {
  if (answered) return;
  answered = true;
  clearTimerInterval();

  const elapsed = timerOn ? getElapsed() : null;
  const isCorrect = (idx === currentCorrectIndex);

  // Disable all buttons
  const answerBtns = document.querySelectorAll('.answer-btn');
  answerBtns.forEach((btn, i) => {
    btn.disabled = true;
    if (i === currentCorrectIndex) {
      btn.classList.add('correct');
    } else if (i === idx && !isCorrect) {
      btn.classList.add('incorrect');
    } else {
      btn.classList.add('dimmed');
    }
  });

  if (isCorrect) {
    score++;
    streak++;
    document.getElementById('score-display').textContent = score;
    updateStreakBadge();
    showFeedback(true, elapsed);
    showStars();
    if (streak >= 3) launchConfetti();
  } else {
    streak = 0;
    updateStreakBadge();
    showFeedback(false, elapsed);
  }

  // Show next button
  setTimeout(() => {
    document.getElementById('btn-next').className = 'btn btn-next show';
  }, 600);
}

function handleTimeout() {
  if (answered) return;
  answered = true;
  streak = 0;
  updateStreakBadge();

  const answerBtns = document.querySelectorAll('.answer-btn');
  answerBtns.forEach((btn, i) => {
    btn.disabled = true;
    if (i === currentCorrectIndex) btn.classList.add('correct');
    else btn.classList.add('dimmed');
  });

  const fb = document.getElementById('feedback-card');
  const fbIcon = document.getElementById('fb-icon');
  const fbMsg = document.getElementById('fb-msg');
  const fbDetail = document.getElementById('fb-detail');

  fb.className = 'feedback-card timeout-fb show';
  fbIcon.textContent = '⏰';
  fbMsg.textContent = "Time's up!";
  fbDetail.textContent = "The correct answer is highlighted. Try again and beat the timer next time!";

  setTimeout(() => {
    document.getElementById('btn-next').className = 'btn btn-next show';
  }, 600);
}

function nextQuestion() {
  generateQuestion();
}

/* =====================================================
   FEEDBACK
===================================================== */
const correctMessages = [
  "Excellent! You're a Money Maths Champion! 🏆",
  "Brilliant calculation! 🌟",
  "Amazing work! Keep it up! 💪",
  "You're mastering money maths! 🎉",
  "Superb! That's championship thinking! 🥇",
  "Wonderful! You're on fire! 🔥",
  "Outstanding! Naira master in the making! 💰",
  "Genius! Keep crushing those numbers! 🧠",
];

const incorrectMessages = [
  "Nice try! Let's keep practising. 💪",
  "Don't give up! You can solve it! 🌟",
  "Think carefully and try the next one! 🤔",
  "Almost there! Keep going! 🚀",
  "Good effort! Speed and accuracy will improve! 📈",
  "Never give up! Champions practise hard! 🏆",
];

const timerCorrectMessages = [
  (t) => `Fantastic! You solved it in ${t} seconds! ⚡`,
  (t) => `Brilliant! Correct and super fast in ${t}s! 🚀`,
  (t) => `Great job! You beat the timer in ${t} seconds! 🏅`,
  (t) => `Champion! Only ${t} seconds — incredible! 💥`,
  (t) => `Wow! ${t} seconds — speed AND accuracy! 🌟`,
];

const timerIncorrectMessages = [
  "Nice try! Be smart and quick next time! ⚡",
  "Good effort! Speed and accuracy will improve! 💪",
  "Keep practising — you'll get faster! 🚀",
];

function showFeedback(isCorrect, elapsed) {
  const fb = document.getElementById('feedback-card');
  const fbIcon = document.getElementById('fb-icon');
  const fbMsg = document.getElementById('fb-msg');
  const fbDetail = document.getElementById('fb-detail');

  if (isCorrect) {
    fb.className = 'feedback-card correct-fb show';
    fbIcon.textContent = '✅';
    if (timerOn && elapsed !== null) {
      const tmpl = timerCorrectMessages[Math.floor(Math.random()*timerCorrectMessages.length)];
      fbMsg.textContent = tmpl(elapsed);
      fbDetail.textContent = '+1 point added to your score!';
    } else {
      fbMsg.textContent = correctMessages[Math.floor(Math.random()*correctMessages.length)];
      fbDetail.textContent = '+1 point added to your score! 🌟';
    }
  } else {
    fb.className = 'feedback-card incorrect-fb show';
    fbIcon.textContent = '❌';
    if (timerOn && elapsed !== null) {
      fbMsg.textContent = timerIncorrectMessages[Math.floor(Math.random()*timerIncorrectMessages.length)];
      fbDetail.textContent = 'The correct answer is highlighted in green.';
    } else {
      fbMsg.textContent = incorrectMessages[Math.floor(Math.random()*incorrectMessages.length)];
      fbDetail.textContent = 'The correct answer is highlighted in green.';
    }
  }
}

/* =====================================================
   STARS & STREAK
===================================================== */
function showStars() {
  const stars = document.getElementById('stars-row');
  stars.classList.add('show');
  // Re-trigger animation
  stars.querySelectorAll('.star').forEach(s => {
    s.style.animation = 'none';
    s.offsetHeight;
    s.style.animation = '';
  });
}

function updateStreakBadge() {
  const badge = document.getElementById('streak-badge');
  if (streak >= 3) {
    badge.textContent = `🔥 ${streak} in a row!`;
    badge.classList.add('show');
  } else {
    badge.classList.remove('show');
  }
}

/* =====================================================
   CONFETTI
===================================================== */
function launchConfetti() {
  const colors = ['#FFD93D','#FF8C42','#6BCB77','#9B5DE5','#4CC9F0','#F72585','#2EC4B6','#FF6B6B'];
  const count = 28;
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'confetti-piece';
      const color = colors[Math.floor(Math.random()*colors.length)];
      const left = Math.random() * 100;
      const duration = 1.5 + Math.random() * 1.5;
      const size = 8 + Math.random() * 8;
      el.style.cssText = `
        left:${left}vw; top:-20px;
        background:${color};
        width:${size}px; height:${size}px;
        border-radius:${Math.random()>0.5?'50%':'3px'};
        animation-duration:${duration}s;
        animation-delay:${Math.random()*0.4}s;
      `;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), (duration + 0.4) * 1000 + 200);
    }, i * 30);
  }
}
