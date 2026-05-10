const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");
const streakEl = document.getElementById("streak");
const bestScoreEl = document.getElementById("bestScore");
const hitsEl = document.getElementById("hits");
const missesEl = document.getElementById("misses");
const avgReactionEl = document.getElementById("avgReaction");

const gameBoard = document.getElementById("gameBoard");
const target = document.getElementById("target");
const startScreen = document.getElementById("startScreen");
const endScreen = document.getElementById("endScreen");
const resultText = document.getElementById("resultText");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");

const GAME_TIME = 30;
const WRONG_CLICK_PENALTY = 40;

let gameActive = false;
let score = 0;
let timeLeft = GAME_TIME;
let streak = 0;
let hits = 0;
let misses = 0;
let reactionTimes = [];
let timerId = null;
let targetShownAt = 0;

const bestScoreKey = "precision-click-best-score";

function getBestScore() {
  return Number(localStorage.getItem(bestScoreKey)) || 0;
}

function setBestScore(value) {
  localStorage.setItem(bestScoreKey, String(value));
}

function updateUI() {
  scoreEl.textContent = score;
  timeEl.textContent = timeLeft;
  streakEl.textContent = streak;
  bestScoreEl.textContent = getBestScore();
  hitsEl.textContent = hits;
  missesEl.textContent = misses;

  const averageReaction = reactionTimes.length
    ? Math.round(reactionTimes.reduce((sum, value) => sum + value, 0) / reactionTimes.length)
    : 0;

  avgReactionEl.textContent = `${averageReaction}ms`;
}

function startGame() {
  gameActive = true;
  score = 0;
  timeLeft = GAME_TIME;
  streak = 0;
  hits = 0;
  misses = 0;
  reactionTimes = [];

  startScreen.classList.add("hidden");
  endScreen.classList.add("hidden");

  updateUI();
  spawnTarget();

  timerId = setInterval(() => {
    timeLeft -= 1;
    updateUI();

    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

function endGame() {
  gameActive = false;
  clearInterval(timerId);
  target.classList.add("hidden");

  const bestScore = getBestScore();
  if (score > bestScore) {
    setBestScore(score);
  }

  resultText.textContent = `你的分數是 ${score}，命中 ${hits} 次，失誤 ${misses} 次。`;
  endScreen.classList.remove("hidden");
  updateUI();
}

function spawnTarget() {
  if (!gameActive) return;

  const boardRect = gameBoard.getBoundingClientRect();
  const size = Math.max(38, 58 - Math.floor(hits / 8) * 3);
  const padding = size + 12;

  const x = randomNumber(padding, boardRect.width - padding);
  const y = randomNumber(padding, boardRect.height - padding);

  target.style.width = `${size}px`;
  target.style.height = `${size}px`;
  target.style.left = `${x}px`;
  target.style.top = `${y}px`;
  target.classList.remove("hidden");

  targetShownAt = performance.now();
}

function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function handleTargetClick(event) {
  event.stopPropagation();

  if (!gameActive) return;

  const reactionTime = Math.round(performance.now() - targetShownAt);
  reactionTimes.push(reactionTime);

  hits += 1;
  streak += 1;

  const speedBonus = Math.max(0, Math.round(220 - reactionTime / 6));
  const streakBonus = Math.min(120, streak * 6);
  const pointGain = 100 + speedBonus + streakBonus;

  score += pointGain;

  flashBoard("flash-hit");
  updateUI();
  spawnTarget();
}

function handleWrongClick() {
  if (!gameActive) return;

  misses += 1;
  streak = 0;
  score = Math.max(0, score - WRONG_CLICK_PENALTY);

  flashBoard("flash-miss");
  updateUI();
}

function flashBoard(className) {
  gameBoard.classList.remove("flash-hit", "flash-miss");
  void gameBoard.offsetWidth;
  gameBoard.classList.add(className);

  setTimeout(() => {
    gameBoard.classList.remove(className);
  }, 180);
}

startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);
target.addEventListener("click", handleTargetClick);
gameBoard.addEventListener("click", handleWrongClick);

updateUI();
