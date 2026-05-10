const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");
const streakEl = document.getElementById("streak");
const multiplierEl = document.getElementById("multiplier");
const livesEl = document.getElementById("lives");
const bestScoreEl = document.getElementById("bestScore");
const hitsEl = document.getElementById("hits");
const missesEl = document.getElementById("misses");
const avgReactionEl = document.getElementById("avgReaction");
const bestStreakEl = document.getElementById("bestStreak");
const comboFill = document.getElementById("comboFill");

const gameBoard = document.getElementById("gameBoard");
const startScreen = document.getElementById("startScreen");
const pauseScreen = document.getElementById("pauseScreen");
const endScreen = document.getElementById("endScreen");
const leaderboardScreen = document.getElementById("leaderboardScreen");
const toast = document.getElementById("toast");

const resultText = document.getElementById("resultText");
const rankTitle = document.getElementById("rankTitle");
const rankScoreEl = document.getElementById("rankScore");
const rankCommentEl = document.getElementById("rankComment");
const finalHits = document.getElementById("finalHits");
const finalMisses = document.getElementById("finalMisses");
const finalBestStreak = document.getElementById("finalBestStreak");
const finalAvgReaction = document.getElementById("finalAvgReaction");
const currentModeEl = document.getElementById("currentMode");

const playerNameInput = document.getElementById("playerName");
const leaderboardMiniList = document.getElementById("leaderboardMiniList");
const leaderboardFullList = document.getElementById("leaderboardFullList");

const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const backMenuBtn = document.getElementById("backMenuBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resumeBtn = document.getElementById("resumeBtn");
const soundBtn = document.getElementById("soundBtn");
const openLeaderboardBtn = document.getElementById("openLeaderboardBtn");
const closeLeaderboardBtn = document.getElementById("closeLeaderboardBtn");
const clearLeaderboardBtn = document.getElementById("clearLeaderboardBtn");
const clearLeaderboardBtn2 = document.getElementById("clearLeaderboardBtn2");
const modeButtons = document.querySelectorAll(".mode-card");
const tabButtons = document.querySelectorAll(".tab-btn");

const BEST_SCORE_KEY = "precision-click-v3-best-score";
const BEST_STREAK_KEY = "precision-click-v3-best-streak";
const LEADERBOARD_KEY = "precision-click-v3-leaderboard";
const PLAYER_NAME_KEY = "precision-click-v3-player-name";
const WRONG_CLICK_PENALTY = 80;

const modes = {
  classic: {
    label: "Classic / 標準模式",
    shortLabel: "Classic",
    time: 30,
    lives: 3,
    scoreScale: 1,
    goldChance: 0.14,
    dangerChance: 0.12,
    decoyChance: 0.10,
    freezeChance: 0.07,
    movingAfterHits: 12
  },
  rush: {
    label: "Rush / 速攻模式",
    shortLabel: "Rush",
    time: 45,
    lives: 3,
    scoreScale: 1.25,
    goldChance: 0.12,
    dangerChance: 0.16,
    decoyChance: 0.13,
    freezeChance: 0.09,
    movingAfterHits: 6
  },
  survival: {
    label: "Survival / 生存模式",
    shortLabel: "Survival",
    time: 60,
    lives: 5,
    scoreScale: 1.08,
    goldChance: 0.10,
    dangerChance: 0.16,
    decoyChance: 0.12,
    freezeChance: 0.10,
    movingAfterHits: 10
  }
};

let selectedMode = "classic";
let gameActive = false;
let paused = false;
let soundOn = true;
let currentLeaderboardFilter = "all";

let score = 0;
let timeLeft = modes[selectedMode].time;
let streak = 0;
let bestStreakRound = 0;
let lives = modes[selectedMode].lives;
let hits = 0;
let misses = 0;
let reactionTimes = [];
let timerId = null;
let targetShownAt = 0;
let currentTarget = null;
let achievements = new Set();
let currentPlayerName = "Player";
let frozen = false;
let audioContext = null;

function getStoredNumber(key) {
  return Number(localStorage.getItem(key)) || 0;
}

function setStoredNumber(key, value) {
  localStorage.setItem(key, String(value));
}

function getLeaderboard() {
  try {
    const data = JSON.parse(localStorage.getItem(LEADERBOARD_KEY)) || [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveLeaderboard(list) {
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(list));
}

function sanitizeName(name) {
  const cleaned = String(name || "Player").trim().replace(/[<>]/g, "");
  return cleaned ? cleaned.slice(0, 14) : "Player";
}

function formatMultiplier() {
  return 1 + Math.min(2.5, Math.floor(streak / 5) * 0.25);
}

function averageReaction() {
  if (!reactionTimes.length) return 0;
  return Math.round(reactionTimes.reduce((sum, value) => sum + value, 0) / reactionTimes.length);
}

function getAccuracy() {
  const total = hits + misses;
  return total > 0 ? Math.round((hits / total) * 100) : 0;
}

function calculateRankData(finalScore, accuracy, avg, maxStreak, finalHits, finalMisses) {
  const scorePart = Math.min(55, finalScore / 210);
  const accuracyPart = Math.min(25, accuracy * 0.25);
  const speedPart = avg > 0 ? Math.max(0, Math.min(12, (900 - avg) / 50)) : 0;
  const streakPart = Math.min(8, maxStreak * 0.35);
  const penalty = Math.min(10, finalMisses * 0.65);
  const gradeScore = Math.max(0, Math.round(scorePart + accuracyPart + speedPart + streakPart - penalty));

  const ranks = [
    { min: 96, rank: "SSS", className: "rank-sss", comment: "神級精準，速度和穩定度都非常強。" },
    { min: 90, rank: "SS", className: "rank-ss", comment: "頂尖反應，幾乎沒有明顯弱點。" },
    { min: 84, rank: "S", className: "rank-s", comment: "高水準表現，節奏掌握很穩。" },
    { min: 78, rank: "A+", className: "rank-ap", comment: "很強，連擊與準確率都不錯。" },
    { min: 72, rank: "A", className: "rank-a", comment: "穩定成熟，已經能控制遊戲節奏。" },
    { min: 66, rank: "A-", className: "rank-am", comment: "表現良好，再減少失誤會更高。" },
    { min: 60, rank: "B+", className: "rank-bp", comment: "有明顯實力，但反應或準確率還能提升。" },
    { min: 54, rank: "B", className: "rank-b", comment: "基礎穩定，適合繼續練連擊。" },
    { min: 48, rank: "B-", className: "rank-bm", comment: "有抓到玩法，但失誤影響分數。" },
    { min: 40, rank: "C+", className: "rank-cp", comment: "普通偏上，先追求穩定命中。" },
    { min: 32, rank: "C", className: "rank-c", comment: "還在熱身，準確率比速度更重要。" },
    { min: 22, rank: "D", className: "rank-d", comment: "需要降低亂點，多觀察目標。" },
    { min: 0, rank: "E", className: "rank-e", comment: "先熟悉規則，慢慢練就會進步。" }
  ];

  return {
    gradeScore,
    ...ranks.find((item) => gradeScore >= item.min)
  };
}

function updateUI() {
  scoreEl.textContent = score;
  timeEl.textContent = timeLeft;
  streakEl.textContent = streak;
  multiplierEl.textContent = `x${formatMultiplier().toFixed(2)}`;
  livesEl.textContent = "♥".repeat(Math.max(0, lives)) || "0";
  bestScoreEl.textContent = getStoredNumber(BEST_SCORE_KEY);
  hitsEl.textContent = hits;
  missesEl.textContent = misses;
  avgReactionEl.textContent = `${averageReaction()}ms`;
  bestStreakEl.textContent = Math.max(bestStreakRound, getStoredNumber(BEST_STREAK_KEY));

  const comboPercent = Math.min(100, (streak % 20) * 5);
  comboFill.style.width = `${comboPercent}%`;
}

function selectMode(mode) {
  selectedMode = mode;
  modeButtons.forEach((button) => {
    button.classList.toggle("selected", button.dataset.mode === mode);
  });
}

function startGame() {
  const mode = modes[selectedMode];
  currentPlayerName = sanitizeName(playerNameInput.value);
  playerNameInput.value = currentPlayerName;
  localStorage.setItem(PLAYER_NAME_KEY, currentPlayerName);

  gameActive = true;
  paused = false;
  score = 0;
  timeLeft = mode.time;
  streak = 0;
  bestStreakRound = 0;
  lives = mode.lives;
  hits = 0;
  misses = 0;
  reactionTimes = [];
  achievements = new Set();

  currentModeEl.textContent = mode.label;
  startScreen.classList.add("hidden");
  endScreen.classList.add("hidden");
  leaderboardScreen.classList.add("hidden");
  pauseScreen.classList.add("hidden");
  pauseBtn.disabled = false;
  pauseBtn.textContent = "暫停";

  clearInterval(timerId);
  timerId = setInterval(() => {
    if (!gameActive || paused || frozen) return;
    timeLeft -= 1;
    updateUI();

    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);

  updateUI();
  playSound("start");
  spawnTarget();
}

function endGame() {
  gameActive = false;
  paused = false;
  clearInterval(timerId);
  pauseBtn.disabled = true;
  removeCurrentTarget();

  if (score > getStoredNumber(BEST_SCORE_KEY)) {
    setStoredNumber(BEST_SCORE_KEY, score);
  }

  if (bestStreakRound > getStoredNumber(BEST_STREAK_KEY)) {
    setStoredNumber(BEST_STREAK_KEY, bestStreakRound);
  }

  const avg = averageReaction();
  const accuracy = getAccuracy();
  const rankData = calculateRankData(score, accuracy, avg, bestStreakRound, hits, misses);

  saveScoreToLeaderboard({
    name: currentPlayerName,
    mode: selectedMode,
    modeLabel: modes[selectedMode].shortLabel,
    score,
    rank: rankData.rank,
    rankClass: rankData.className,
    gradeScore: rankData.gradeScore,
    accuracy,
    avgReaction: avg,
    hits,
    misses,
    bestStreak: bestStreakRound,
    date: new Date().toLocaleDateString("zh-TW")
  });

  rankTitle.innerHTML = `遊戲結束 <span class="rank-badge ${rankData.className}">${rankData.rank}</span>`;
  resultText.textContent = `分數 ${score}｜準確率 ${accuracy}%｜模式：${modes[selectedMode].label}`;
  rankScoreEl.textContent = `${rankData.gradeScore}/100`;
  rankCommentEl.textContent = rankData.comment;
  finalHits.textContent = hits;
  finalMisses.textContent = misses;
  finalBestStreak.textContent = bestStreakRound;
  finalAvgReaction.textContent = `${avg}ms`;

  renderLeaderboard("mini");
  endScreen.classList.remove("hidden");
  playSound("gameover");
  updateUI();
}

function saveScoreToLeaderboard(entry) {
  const list = getLeaderboard();
  list.push(entry);

  list.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.gradeScore !== a.gradeScore) return b.gradeScore - a.gradeScore;
    return a.avgReaction - b.avgReaction;
  });

  saveLeaderboard(list.slice(0, 30));
}

function renderLeaderboard(type = "full") {
  const target = type === "mini" ? leaderboardMiniList : leaderboardFullList;
  const limit = type === "mini" ? 5 : 10;
  let list = getLeaderboard();

  if (type === "full" && currentLeaderboardFilter !== "all") {
    list = list.filter((entry) => entry.mode === currentLeaderboardFilter);
  }

  list = list.slice(0, limit);

  if (!list.length) {
    target.innerHTML = `<div class="leaderboard-empty">目前還沒有紀錄，先玩一場建立第一筆成績。</div>`;
    return;
  }

  target.innerHTML = list.map((entry, index) => {
    const topClass = index < 3 ? `top-${index + 1}` : "";
    const rankClass = entry.rankClass || getRankClass(entry.rank);
    return `
      <div class="leaderboard-row ${topClass}">
        <div class="leader-rank">#${index + 1}</div>
        <div>
          <div class="leader-name">${escapeHtml(entry.name)}</div>
          <div class="leader-meta">${entry.modeLabel || entry.mode}</div>
        </div>
        <div>
          <span class="rank-badge ${rankClass}">${entry.rank}</span>
        </div>
        <div class="leader-score">${entry.score}</div>
        <div class="leader-meta hide-mobile">${entry.accuracy}%｜${entry.avgReaction}ms</div>
        <div class="leader-date hide-small hide-mobile">${entry.date}</div>
      </div>
    `;
  }).join("");
}

function getRankClass(rank) {
  const map = {
    SSS: "rank-sss",
    SS: "rank-ss",
    S: "rank-s",
    "A+": "rank-ap",
    A: "rank-a",
    "A-": "rank-am",
    "B+": "rank-bp",
    B: "rank-b",
    "B-": "rank-bm",
    "C+": "rank-cp",
    C: "rank-c",
    D: "rank-d",
    E: "rank-e"
  };

  return map[rank] || "rank-c";
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };
    return map[char];
  });
}

function clearLeaderboard() {
  const confirmed = confirm("確定要清除排行榜嗎？這會刪除目前瀏覽器中的所有分數紀錄。");
  if (!confirmed) return;

  localStorage.removeItem(LEADERBOARD_KEY);
  renderLeaderboard("mini");
  renderLeaderboard("full");
  showToast("排行榜已清除");
}

function openLeaderboard() {
  startScreen.classList.add("hidden");
  endScreen.classList.add("hidden");
  pauseScreen.classList.add("hidden");
  leaderboardScreen.classList.remove("hidden");
  renderLeaderboard("full");
}

function closeLeaderboard() {
  leaderboardScreen.classList.add("hidden");
  if (!gameActive) {
    startScreen.classList.remove("hidden");
  }
}

function backToMenu() {
  endScreen.classList.add("hidden");
  startScreen.classList.remove("hidden");
  currentModeEl.textContent = "尚未開始";
}

function pauseGame() {
  if (!gameActive) return;
  paused = !paused;

  if (paused) {
    pauseScreen.classList.remove("hidden");
    pauseBtn.textContent = "繼續";
  } else {
    pauseScreen.classList.add("hidden");
    pauseBtn.textContent = "暫停";
    if (currentTarget) {
      targetShownAt = performance.now();
    }
  }
}

function spawnTarget() {
  if (!gameActive || paused) return;

  removeCurrentTarget();

  const boardRect = gameBoard.getBoundingClientRect();
  const mode = modes[selectedMode];
  const baseSize = selectedMode === "rush" ? 52 : 58;
  const shrink = Math.min(20, Math.floor(hits / 6) * 2);
  const size = Math.max(34, baseSize - shrink);
  const padding = size + 14;

  const x = randomNumber(padding, Math.max(padding, boardRect.width - padding));
  const y = randomNumber(padding, Math.max(padding, boardRect.height - padding));

  const targetType = pickTargetType(mode);
  const target = document.createElement("button");
  target.className = `target ${targetType}`;
  target.type = "button";
  const labelMap = {
    danger: "紅色炸彈陷阱",
    decoy: "紫色假目標陷阱",
    freeze: "藍色冰凍陷阱",
    gold: "金色獎勵目標",
    normal: "一般點擊目標"
  };
  target.setAttribute("aria-label", labelMap[targetType] || "點擊目標");
  target.style.width = `${size}px`;
  target.style.height = `${size}px`;
  target.style.left = `${x}px`;
  target.style.top = `${y}px`;

  if (hits >= mode.movingAfterHits && Math.random() < 0.34) {
    target.classList.add("moving");
  }

  target.addEventListener("click", (event) => {
    event.stopPropagation();
    handleTargetClick(targetType, x, y);
  });

  gameBoard.appendChild(target);
  currentTarget = target;
  targetShownAt = performance.now();

  const lifeTime = Math.max(650, 1400 - hits * 16);
  setTimeout(() => {
    if (!gameActive || paused || currentTarget !== target) return;
    if (targetType === "normal" || targetType === "gold") {
      handleMissedTarget(x, y);
    } else {
      removeCurrentTarget();
      spawnTarget();
    }
  }, lifeTime);
}

function pickTargetType(mode) {
  const roll = Math.random();
  const goldEnd = mode.goldChance;
  const dangerEnd = goldEnd + mode.dangerChance;
  const decoyEnd = dangerEnd + mode.decoyChance;
  const freezeEnd = decoyEnd + mode.freezeChance;

  if (roll < goldEnd) return "gold";
  if (roll < dangerEnd) return "danger";
  if (roll < decoyEnd) return "decoy";
  if (roll < freezeEnd) return "freeze";
  return "normal";
}

function handleTargetClick(targetType, x, y) {
  if (!gameActive || paused || frozen) return;

  if (targetType === "danger") {
    misses += 1;
    lives -= 1;
    streak = 0;
    score = Math.max(0, score - 260);
    showPop("BOMB -260", x, y, "bad");
    flashBoard("flash-miss", true);
    playSound("trap");
    removeCurrentTarget();

    if (lives <= 0) {
      endGame();
      return;
    }

    updateUI();
    spawnTarget();
    return;
  }

  if (targetType === "decoy") {
    misses += 1;
    streak = 0;
    score = Math.max(0, score - 160);
    showPop("FAKE -160", x, y, "bad");
    flashBoard("flash-miss", true);
    playSound("decoy");
    removeCurrentTarget();
    updateUI();
    spawnTarget();
    return;
  }

  if (targetType === "freeze") {
    misses += 1;
    lives = Math.max(0, lives - 1);
    streak = 0;
    timeLeft = Math.max(0, timeLeft - 2);
    score = Math.max(0, score - 120);
    showPop("FREEZE -2s", x, y, "bad");
    flashBoard("flash-miss", true);
    playSound("freeze");
    removeCurrentTarget();
    freezeBoard();

    if (lives <= 0 || timeLeft <= 0) {
      endGame();
      return;
    }

    updateUI();
    return;
  }

  const reactionTime = Math.round(performance.now() - targetShownAt);
  reactionTimes.push(reactionTime);

  hits += 1;
  streak += 1;
  bestStreakRound = Math.max(bestStreakRound, streak);

  const mode = modes[selectedMode];
  const multiplier = formatMultiplier();
  const speedBonus = Math.max(0, Math.round(260 - reactionTime / 4));
  const streakBonus = Math.min(250, streak * 9);
  const goldBonus = targetType === "gold" ? 450 : 0;
  const pointGain = Math.round((120 + speedBonus + streakBonus + goldBonus) * multiplier * mode.scoreScale);

  score += pointGain;

  if (targetType === "gold") {
    timeLeft += 2;
    showPop(`+${pointGain} / +2s`, x, y, "gold");
    playSound("gold");
  } else {
    showPop(`+${pointGain}`, x, y, "good");
    playSound("hit");
  }

  createParticles(x, y, targetType);
  flashBoard("flash-hit", false);
  if (streak > 0 && streak % 10 === 0) {
    playSound("combo");
  }
  checkAchievements();

  removeCurrentTarget();
  updateUI();
  spawnTarget();
}

function handleMissedTarget(x, y) {
  if (!gameActive || paused) return;

  misses += 1;
  lives -= 1;
  streak = 0;
  score = Math.max(0, score - 120);

  showPop("MISS", x, y, "bad");
  flashBoard("flash-miss", true);
  playSound("bad");
  removeCurrentTarget();

  if (lives <= 0) {
    endGame();
    return;
  }

  updateUI();
  spawnTarget();
}

function handleWrongClick(event) {
  if (!gameActive || paused || frozen) return;

  const rect = gameBoard.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  misses += 1;
  streak = 0;
  score = Math.max(0, score - WRONG_CLICK_PENALTY);

  showPop(`-${WRONG_CLICK_PENALTY}`, x, y, "bad");
  flashBoard("flash-miss", true);
  playSound("bad");
  updateUI();
}

function freezeBoard() {
  frozen = true;
  gameBoard.classList.add("frozen");

  setTimeout(() => {
    frozen = false;
    gameBoard.classList.remove("frozen");
    if (gameActive && !paused) {
      spawnTarget();
    }
  }, 1300);
}

function removeCurrentTarget() {
  if (currentTarget && currentTarget.parentNode) {
    currentTarget.parentNode.removeChild(currentTarget);
  }
  currentTarget = null;
}

function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function flashBoard(className, shouldShake) {
  gameBoard.classList.remove("flash-hit", "flash-miss", "shake");
  void gameBoard.offsetWidth;
  gameBoard.classList.add(className);
  if (shouldShake) gameBoard.classList.add("shake");

  setTimeout(() => {
    gameBoard.classList.remove(className, "shake");
  }, 230);
}

function showPop(text, x, y, type) {
  const pop = document.createElement("div");
  pop.className = `pop ${type}`;
  pop.textContent = text;
  pop.style.left = `${x}px`;
  pop.style.top = `${y}px`;
  gameBoard.appendChild(pop);

  setTimeout(() => pop.remove(), 760);
}

function createParticles(x, y, targetType) {
  const color = targetType === "gold" ? "var(--gold)" : "var(--success)";

  for (let i = 0; i < 12; i += 1) {
    const particle = document.createElement("span");
    particle.className = "particle";
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    particle.style.background = color;

    const angle = (Math.PI * 2 * i) / 12;
    const distance = randomNumber(34, 82);
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance;

    particle.style.setProperty("--dx", `${dx}px`);
    particle.style.setProperty("--dy", `${dy}px`);

    gameBoard.appendChild(particle);
    setTimeout(() => particle.remove(), 620);
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove("hidden");
  void toast.offsetWidth;
  toast.classList.add("toast");

  setTimeout(() => {
    toast.classList.add("hidden");
  }, 2200);
}

function checkAchievements() {
  const list = [
    { key: "combo10", condition: streak === 10, text: "成就：10 連擊！" },
    { key: "combo20", condition: streak === 20, text: "成就：20 連擊！" },
    { key: "score5000", condition: score >= 5000, text: "成就：突破 5000 分！" },
    { key: "fast", condition: reactionTimes.at(-1) && reactionTimes.at(-1) < 320, text: "成就：超高速反應！" }
  ];

  list.forEach((item) => {
    if (item.condition && !achievements.has(item.key)) {
      achievements.add(item.key);
      showToast(item.text);
    }
  });
}

function getAudioContext() {
  if (!soundOn) return null;

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;

  if (!audioContext || audioContext.state === "closed") {
    audioContext = new AudioContext();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  return audioContext;
}

function playTone(ctx, frequency, startTime, duration, type = "sine", volume = 0.045) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.02);
}

function playSound(type) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  const patterns = {
    start: [
      [440, 0, 0.08, "sine", 0.035],
      [660, 0.09, 0.10, "sine", 0.04],
      [880, 0.20, 0.12, "sine", 0.045]
    ],
    hit: [
      [620, 0, 0.07, "sine", 0.04]
    ],
    gold: [
      [740, 0, 0.08, "sine", 0.045],
      [980, 0.08, 0.10, "sine", 0.05],
      [1240, 0.17, 0.11, "sine", 0.045]
    ],
    combo: [
      [523, 0, 0.06, "triangle", 0.04],
      [659, 0.06, 0.07, "triangle", 0.045],
      [784, 0.13, 0.08, "triangle", 0.05],
      [1046, 0.22, 0.10, "triangle", 0.05]
    ],
    bad: [
      [220, 0, 0.12, "sawtooth", 0.04]
    ],
    trap: [
      [180, 0, 0.11, "sawtooth", 0.05],
      [110, 0.08, 0.18, "sawtooth", 0.045]
    ],
    decoy: [
      [420, 0, 0.06, "square", 0.025],
      [260, 0.05, 0.12, "square", 0.03]
    ],
    freeze: [
      [900, 0, 0.12, "triangle", 0.035],
      [450, 0.10, 0.18, "triangle", 0.035],
      [225, 0.25, 0.20, "triangle", 0.03]
    ],
    gameover: [
      [330, 0, 0.12, "sine", 0.04],
      [247, 0.14, 0.14, "sine", 0.04],
      [196, 0.30, 0.20, "sine", 0.04]
    ]
  };

  (patterns[type] || patterns.hit).forEach(([frequency, offset, duration, wave, volume]) => {
    playTone(ctx, frequency, now + offset, duration, wave, volume);
  });
}

modeButtons.forEach((button) => {
  button.addEventListener("click", () => selectMode(button.dataset.mode));
});

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentLeaderboardFilter = button.dataset.filter;
    tabButtons.forEach((tab) => tab.classList.toggle("selected", tab === button));
    renderLeaderboard("full");
  });
});

startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);
backMenuBtn.addEventListener("click", backToMenu);
pauseBtn.addEventListener("click", pauseGame);
resumeBtn.addEventListener("click", pauseGame);
gameBoard.addEventListener("click", handleWrongClick);
openLeaderboardBtn.addEventListener("click", openLeaderboard);
closeLeaderboardBtn.addEventListener("click", closeLeaderboard);
clearLeaderboardBtn.addEventListener("click", clearLeaderboard);
clearLeaderboardBtn2.addEventListener("click", clearLeaderboard);

soundBtn.addEventListener("click", () => {
  soundOn = !soundOn;
  soundBtn.textContent = soundOn ? "音效：開" : "音效：關";
});

document.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    if (gameActive) pauseGame();
  }
});

const savedPlayerName = localStorage.getItem(PLAYER_NAME_KEY);
if (savedPlayerName) {
  playerNameInput.value = savedPlayerName;
}

selectMode(selectedMode);
renderLeaderboard("mini");
updateUI();
