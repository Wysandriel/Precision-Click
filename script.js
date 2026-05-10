(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  const els = {
    arena: $("#arena"),
    menuScreen: $("#menuScreen"),
    pauseScreen: $("#pauseScreen"),
    resultScreen: $("#resultScreen"),
    rulesScreen: $("#rulesScreen"),
    floatingTextLayer: $("#floatingTextLayer"),
    particleLayer: $("#particleLayer"),
    toast: $("#toast"),

    soundToggle: $("#soundToggle"),
    rulesOpenTop: $("#rulesOpenTop"),
    rulesOpenMenu: $("#rulesOpenMenu"),
    rulesClose: $("#rulesClose"),

    playerDisplay: $("#playerDisplay"),
    modeDisplay: $("#modeDisplay"),

    startGame: $("#startGame"),
    resumeGame: $("#resumeGame"),
    playAgain: $("#playAgain"),
    backToMenu: $("#backToMenu"),

    score: $("#score"),
    time: $("#time"),
    lives: $("#lives"),
    combo: $("#combo"),
    multiplier: $("#multiplier"),
    accuracy: $("#accuracy"),
    energyFill: $("#energyFill"),
    energyText: $("#energyText"),

    resultTitle: $("#resultTitle"),
    resultSummary: $("#resultSummary"),
    rankBadge: $("#rankBadge"),
    rankScore: $("#rankScore"),
    rankComment: $("#rankComment"),
    finalHits: $("#finalHits"),
    finalMisses: $("#finalMisses"),
    finalBestCombo: $("#finalBestCombo"),
    finalReaction: $("#finalReaction")
  };

  const STORAGE = {
    sound: "precision-click-pro-sound"
  };

  const modes = {
    classic: {
      label: "Classic",
      description: "標準模式",
      totalTime: 30,
      lives: 3,
      scoreScale: 1,
      spawnBase: 1350,
      shrinkEvery: 7,
      trapRate: { bomb: 0.11, decoy: 0.09, freeze: 0.06, gold: 0.14 }
    },
    rush: {
      label: "Rush",
      description: "高速模式",
      totalTime: 45,
      lives: 3,
      scoreScale: 1.22,
      spawnBase: 1120,
      shrinkEvery: 5,
      trapRate: { bomb: 0.14, decoy: 0.12, freeze: 0.08, gold: 0.13 }
    },
    survival: {
      label: "Survival",
      description: "生存模式",
      totalTime: 60,
      lives: 5,
      scoreScale: 1.05,
      spawnBase: 1260,
      shrinkEvery: 6,
      trapRate: { bomb: 0.13, decoy: 0.11, freeze: 0.09, gold: 0.11 }
    }
  };

  let selectedMode = "classic";
  let soundEnabled = localStorage.getItem(STORAGE.sound) !== "off";
  let audioCtx = null;
  let previousOverlayScreen = null;

  const state = {
    running: false,
    paused: false,
    frozen: false,
    score: 0,
    timeLeft: 30,
    lives: 3,
    combo: 0,
    bestCombo: 0,
    hits: 0,
    misses: 0,
    reactions: [],
    currentTarget: null,
    targetBornAt: 0,
    tickTimer: null,
    targetTimer: null,
    achievements: new Set(),
    player: "Player",
    inputLockedUntil: 0
  };

  function onSafe(element, eventName, handler) {
    if (element) element.addEventListener(eventName, handler);
  }

  function init() {

    updateSoundButton();
    updateHud();

    $$(".mode-btn").forEach((button) => {
      button.addEventListener("click", () => selectMode(button.dataset.mode));
    });

    onSafe(els.startGame, "click", startGame);
    onSafe(els.playAgain, "click", startGame);
    onSafe(els.resumeGame, "click", togglePause);
    onSafe(els.backToMenu, "click", showMenu);

    onSafe(els.soundToggle, "click", () => {
      soundEnabled = !soundEnabled;
      localStorage.setItem(STORAGE.sound, soundEnabled ? "on" : "off");
      updateSoundButton();
      if (soundEnabled) playSound("start");
    });

    onSafe(els.rulesOpenTop, "click", openRules);
    onSafe(els.rulesOpenMenu, "click", openRules);
    onSafe(els.rulesClose, "click", closeRules);
    onSafe(els.arena, "click", handleArenaClick);

    [els.menuScreen, els.pauseScreen, els.resultScreen, els.rulesScreen].forEach((screen) => {
      onSafe(screen, "click", (event) => event.stopPropagation());
    });

    document.addEventListener("keydown", (event) => {
      if (event.code === "Space" && state.running) {
        event.preventDefault();
        togglePause();
      }

      if (event.key === "Escape") {
        if (isScreenActive(els.rulesScreen)) closeRules();
        else if (state.running) togglePause();
      }
    });
  }

  function selectMode(mode) {
    selectedMode = modes[mode] ? mode : "classic";
    $$(".mode-btn").forEach((button) => {
      button.classList.toggle("selected", button.dataset.mode === selectedMode);
    });
  }

  function startGame() {
    unlockAudio();

    const mode = modes[selectedMode];
    state.running = true;
    state.paused = false;
    state.frozen = false;
    state.score = 0;
    state.timeLeft = mode.totalTime;
    state.lives = mode.lives;
    state.combo = 0;
    state.bestCombo = 0;
    state.hits = 0;
    state.misses = 0;
    state.reactions = [];
    state.achievements = new Set();
    state.inputLockedUntil = performance.now() + 450;
    state.player = "ACTIVE";

    els.playerDisplay.textContent = state.player;
    els.modeDisplay.textContent = `${mode.label} / ${mode.description}`;

    clearTimers();
    clearTarget();
    clearEffects();
    els.arena.classList.remove("frozen");
    showScreen(null);

    state.tickTimer = window.setInterval(() => {
      if (!state.running || state.paused || state.frozen) return;
      state.timeLeft -= 1;
      updateHud();

      if (state.timeLeft <= 0) endGame();
    }, 1000);

    playSound("start");
    updateHud();
    spawnTarget();
  }

  function endGame() {
    if (!state.running) return;

    state.running = false;
    state.paused = false;
    state.frozen = false;
    clearTimers();
    clearTarget();
    els.arena.classList.remove("frozen");

    const stats = getStats();
    const rank = getRank(stats);

    els.resultTitle.textContent = "任務結算";
    els.resultSummary.textContent = `分數 ${state.score}｜準確率 ${stats.accuracy}%｜模式 ${modes[selectedMode].label}`;
    els.rankBadge.textContent = rank.rank;
    els.rankBadge.className = `rank-badge ${rank.className}`;
    els.rankScore.textContent = `${rank.score} / 100`;
    els.rankComment.textContent = rank.comment;
    els.finalHits.textContent = state.hits;
    els.finalMisses.textContent = state.misses;
    els.finalBestCombo.textContent = state.bestCombo;
    els.finalReaction.textContent = `${stats.avgReaction}ms`;

    showScreen(els.resultScreen);
    playSound("gameover");
    updateHud();
  }

  function showMenu() {
    state.running = false;
    state.paused = false;
    state.frozen = false;
    clearTimers();
    clearTarget();
    els.playerDisplay.textContent = "READY";
    els.modeDisplay.textContent = "尚未開始";
    els.arena.classList.remove("frozen");
    showScreen(els.menuScreen);
    updateHud();
  }

  function togglePause() {
    if (!state.running) return;
    state.paused = !state.paused;

    if (state.paused) {
      clearTarget();
      showScreen(els.pauseScreen);
      playSound("pause");
    } else {
      showScreen(null);
      clearTarget();
      playSound("resume");
      spawnTarget();
    }
  }

  function spawnTarget() {
    if (!state.running || state.paused || state.frozen) return;

    clearTarget();

    const rect = els.arena.getBoundingClientRect();
    const mode = modes[selectedMode];
    const type = chooseTargetType(mode.trapRate);
    const baseSize = selectedMode === "rush" ? 52 : 58;
    const shrink = Math.min(20, Math.floor(state.hits / mode.shrinkEvery) * 2);
    const size = Math.max(34, baseSize - shrink);
    const padding = size + 18;

    const x = random(padding, Math.max(padding, rect.width - padding));
    const y = random(padding, Math.max(padding, rect.height - padding));

    const button = document.createElement("button");
    button.type = "button";
    button.className = `target ${type}`;
    button.style.width = `${size}px`;
    button.style.height = `${size}px`;
    button.style.left = `${x}px`;
    button.style.top = `${y}px`;
    button.dataset.type = type;
    button.dataset.x = String(x);
    button.dataset.y = String(y);
    button.setAttribute("aria-label", getTargetLabel(type));

    if (state.hits >= 10 && Math.random() < 0.34) {
      button.classList.add("moving");
    }

    button.addEventListener("click", handleTargetClick);
    els.arena.appendChild(button);

    state.currentTarget = button;
    state.targetBornAt = performance.now();

    const life = getTargetLifetime(mode);
    state.targetTimer = window.setTimeout(() => {
      if (!state.running || state.paused || state.frozen || state.currentTarget !== button) return;

      if (type === "normal" || type === "gold") {
        handleMissedTarget(x, y);
      } else {
        clearTarget();
        spawnTarget();
      }
    }, life);
  }

  function chooseTargetType(rate) {
    const r = Math.random();
    let cursor = rate.gold;
    if (r < cursor) return "gold";
    cursor += rate.bomb;
    if (r < cursor) return "bomb";
    cursor += rate.decoy;
    if (r < cursor) return "decoy";
    cursor += rate.freeze;
    if (r < cursor) return "freeze";
    return "normal";
  }

  function getTargetLifetime(mode) {
    return Math.max(610, mode.spawnBase - state.hits * 14);
  }

  function getTargetLabel(type) {
    return {
      normal: "一般目標",
      gold: "金色獎勵目標",
      bomb: "紅色炸彈陷阱",
      decoy: "紫色假目標陷阱",
      freeze: "藍色冰凍陷阱"
    }[type] || "目標";
  }

  function handleTargetClick(event) {
    event.stopPropagation();

    if (!state.running || state.paused || state.frozen) return;

    const target = event.currentTarget;
    const type = target.dataset.type;
    const x = Number(target.dataset.x);
    const y = Number(target.dataset.y);

    if (type === "bomb") {
      punish({ x, y, score: 280, lives: 1, time: 0, label: "BOMB -280", sound: "trap", freeze: false });
      return;
    }

    if (type === "decoy") {
      punish({ x, y, score: 160, lives: 0, time: 0, label: "FAKE -160", sound: "decoy", freeze: false });
      return;
    }

    if (type === "freeze") {
      punish({ x, y, score: 120, lives: 1, time: 2, label: "FREEZE -2s", sound: "freeze", freeze: true });
      return;
    }

    const reaction = Math.max(1, Math.round(performance.now() - state.targetBornAt));
    state.reactions.push(reaction);
    state.hits += 1;
    state.combo += 1;
    state.bestCombo = Math.max(state.bestCombo, state.combo);

    const mode = modes[selectedMode];
    const multiplier = getMultiplier();
    const speedBonus = Math.max(0, Math.round(280 - reaction / 4));
    const comboBonus = Math.min(320, state.combo * 10);
    const goldBonus = type === "gold" ? 520 : 0;
    const gain = Math.round((135 + speedBonus + comboBonus + goldBonus) * multiplier * mode.scoreScale);

    state.score += gain;

    if (type === "gold") {
      state.timeLeft += 2;
      floatText(`+${gain} / +2s`, x, y, "gold");
      burst(x, y, "gold");
      playSound("gold");
    } else {
      floatText(`+${gain}`, x, y, "good");
      burst(x, y, "normal");
      playSound("hit");
    }

    flash("hit");

    if (state.combo > 0 && state.combo % 10 === 0) {
      playSound("combo");
      toast(`${state.combo} 連擊！倍率提升`);
    }

    checkAchievements(reaction);
    clearTarget();
    updateHud();
    spawnTarget();
  }

  function punish({ x, y, score, lives, time, label, sound, freeze }) {
    state.misses += 1;
    state.combo = 0;
    state.score = Math.max(0, state.score - score);
    state.lives = Math.max(0, state.lives - lives);
    state.timeLeft = Math.max(0, state.timeLeft - time);

    floatText(label, x, y, freeze ? "cyan" : "bad");
    burst(x, y, freeze ? "freeze" : "bad");
    flash("miss", true);
    playSound(sound);
    clearTarget();

    if (state.lives <= 0 || state.timeLeft <= 0) {
      updateHud();
      endGame();
      return;
    }

    updateHud();

    if (freeze) {
      freezeArena();
    } else {
      spawnTarget();
    }
  }

  function handleMissedTarget(x, y) {
    state.misses += 1;
    state.combo = 0;
    state.lives = Math.max(0, state.lives - 1);
    state.score = Math.max(0, state.score - 140);

    floatText("MISS -140", x, y, "bad");
    flash("miss", true);
    playSound("bad");
    clearTarget();

    updateHud();

    if (state.lives <= 0) {
      endGame();
      return;
    }

    spawnTarget();
  }

  function handleArenaClick(event) {
    if (!state.running || state.paused || state.frozen) return;
    if (performance.now() < state.inputLockedUntil) return;
    if (event.target.closest(".target")) return;
    if (event.target.closest(".screen")) return;

    const rect = els.arena.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    state.misses += 1;
    state.combo = 0;
    state.score = Math.max(0, state.score - 90);

    floatText("-90", x, y, "bad");
    flash("miss", true);
    playSound("bad");
    updateHud();
  }

  function freezeArena() {
    state.frozen = true;
    els.arena.classList.add("frozen");

    window.setTimeout(() => {
      state.frozen = false;
      els.arena.classList.remove("frozen");
      if (state.running && !state.paused) spawnTarget();
    }, 1200);
  }

  function clearTarget() {
    window.clearTimeout(state.targetTimer);
    state.targetTimer = null;

    if (state.currentTarget && state.currentTarget.parentNode) {
      state.currentTarget.parentNode.removeChild(state.currentTarget);
    }

    state.currentTarget = null;
  }

  function clearTimers() {
    window.clearInterval(state.tickTimer);
    window.clearTimeout(state.targetTimer);
    state.tickTimer = null;
    state.targetTimer = null;
  }

  function clearEffects() {
    els.floatingTextLayer.innerHTML = "";
    els.particleLayer.innerHTML = "";
  }

  function updateHud() {
    const stats = getStats();
    const energy = Math.min(100, (state.combo % 20) * 5);

    els.score.textContent = String(state.score);
    els.time.textContent = String(Math.max(0, state.timeLeft));
    els.lives.textContent = state.lives > 0 ? "♥".repeat(state.lives) : "0";
    els.combo.textContent = String(state.combo);
    els.multiplier.textContent = `x${getMultiplier().toFixed(2)}`;
    els.accuracy.textContent = `${stats.accuracy}%`;
    els.energyFill.style.width = `${energy}%`;
    els.energyText.textContent = `${energy}%`;
  }

  function getStats() {
    const attempts = state.hits + state.misses;
    const accuracy = attempts ? Math.round((state.hits / attempts) * 100) : 100;
    const avgReaction = state.reactions.length
      ? Math.round(state.reactions.reduce((sum, value) => sum + value, 0) / state.reactions.length)
      : 0;

    return { attempts, accuracy, avgReaction };
  }

  function getMultiplier() {
    return 1 + Math.min(2.75, Math.floor(state.combo / 5) * 0.25);
  }

  function getRank(stats) {
    const scorePart = Math.min(55, state.score / 220);
    const accuracyPart = Math.min(24, stats.accuracy * 0.24);
    const speedPart = stats.avgReaction ? Math.max(0, Math.min(12, (900 - stats.avgReaction) / 48)) : 0;
    const comboPart = Math.min(9, state.bestCombo * 0.34);
    const penalty = Math.min(10, state.misses * 0.62);
    const rankScore = Math.max(0, Math.round(scorePart + accuracyPart + speedPart + comboPart - penalty));

    const table = [
      ["SSS", 96, "rank-sss", "頂級精準。速度、穩定度、連擊都接近完美。"],
      ["SS", 90, "rank-ss", "極強表現。你已經能控制節奏與風險。"],
      ["S", 84, "rank-s", "高水準表現。再降低失誤就能衝上頂級。"],
      ["A+", 78, "rank-ap", "非常不錯，連擊與準確率都有水準。"],
      ["A", 72, "rank-a", "穩定成熟，已經掌握核心玩法。"],
      ["A-", 66, "rank-am", "表現良好，下一步是提升反應速度。"],
      ["B+", 60, "rank-bp", "有實力，但失誤或反應時間拉低評級。"],
      ["B", 54, "rank-b", "基礎穩定，建議練習連續命中。"],
      ["B-", 48, "rank-bm", "有抓到玩法，但需要更穩。"],
      ["C+", 40, "rank-cp", "普通偏上，先減少亂點。"],
      ["C", 32, "rank-c", "還在熱身，準確率比速度更重要。"],
      ["D", 22, "rank-d", "需要多觀察陷阱，別急著點。"],
      ["E", 0, "rank-e", "先熟悉規則，慢慢練就會進步。"]
    ];

    const found = table.find((item) => rankScore >= item[1]);
    return {
      rank: found[0],
      score: rankScore,
      className: found[2],
      comment: found[3]
    };
  }

  function checkAchievements(reaction) {
    const checks = [
      ["fast", reaction < 300, "超高速反應！"],
      ["combo10", state.combo === 10, "10 連擊達成！"],
      ["combo20", state.combo === 20, "20 連擊達成！"],
      ["score6000", state.score >= 6000, "突破 6000 分！"]
    ];

    checks.forEach(([key, condition, message]) => {
      if (condition && !state.achievements.has(key)) {
        state.achievements.add(key);
        toast(message);
      }
    });
  }

  function openRules() {
    previousOverlayScreen = getActiveScreen();

    if (state.running) {
      state.paused = true;
      clearTarget();
    }

    showScreen(els.rulesScreen);
  }

  function closeRules() {
    if (state.running) {
      showScreen(els.pauseScreen);
    } else {
      showScreen(previousOverlayScreen || els.menuScreen);
    }

    previousOverlayScreen = null;
  }

  function getActiveScreen() {
    return [els.menuScreen, els.pauseScreen, els.resultScreen, els.rulesScreen]
      .find((item) => item && item.classList.contains("active")) || null;
  }

  function showScreen(screen) {
    [els.menuScreen, els.pauseScreen, els.resultScreen, els.rulesScreen].forEach((item) => {
      if (!item) return;
      item.classList.toggle("active", item === screen);
    });
  }

  function isScreenActive(screen) {
    return screen && screen.classList.contains("active");
  }

  function flash(type, shake = false) {
    els.arena.classList.remove("hit", "miss", "shake");
    void els.arena.offsetWidth;
    els.arena.classList.add(type);
    if (shake) els.arena.classList.add("shake");

    window.setTimeout(() => {
      els.arena.classList.remove(type, "shake");
    }, 240);
  }

  function floatText(text, x, y, type) {
    const node = document.createElement("div");
    node.className = `float-text ${type}`;
    node.textContent = text;
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
    els.floatingTextLayer.appendChild(node);
    window.setTimeout(() => node.remove(), 820);
  }

  function burst(x, y, type) {
    const color = {
      normal: "var(--green)",
      gold: "var(--gold)",
      bad: "var(--red)",
      freeze: "var(--cyan)"
    }[type] || "var(--green)";

    for (let i = 0; i < 14; i += 1) {
      const particle = document.createElement("span");
      particle.className = "particle";
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      particle.style.color = color;

      const angle = (Math.PI * 2 * i) / 14;
      const distance = random(36, 92);
      particle.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
      particle.style.setProperty("--dy", `${Math.sin(angle) * distance}px`);

      els.particleLayer.appendChild(particle);
      window.setTimeout(() => particle.remove(), 700);
    }
  }

  function toast(message) {
    els.toast.textContent = message;
    els.toast.classList.remove("show");
    void els.toast.offsetWidth;
    els.toast.classList.add("show");
    window.setTimeout(() => els.toast.classList.remove("show"), 2200);
  }

  function unlockAudio() {
    if (!soundEnabled) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!audioCtx || audioCtx.state === "closed") audioCtx = new Ctx();
    if (audioCtx.state === "suspended") audioCtx.resume();
  }

  function updateSoundButton() {
    els.soundToggle.textContent = soundEnabled ? "音效 ON" : "音效 OFF";
  }

  function playSound(type) {
    if (!soundEnabled) return;
    unlockAudio();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;
    const patterns = {
      start: [[440, 0, 0.07, "sine", 0.035], [660, 0.08, 0.08, "sine", 0.04], [880, 0.18, 0.12, "sine", 0.045]],
      hit: [[680, 0, 0.055, "sine", 0.04]],
      gold: [[740, 0, 0.08, "triangle", 0.045], [1040, 0.09, 0.11, "triangle", 0.05], [1320, 0.2, 0.1, "sine", 0.04]],
      combo: [[523, 0, 0.06, "triangle", 0.04], [659, 0.06, 0.07, "triangle", 0.045], [784, 0.13, 0.09, "triangle", 0.05], [1046, 0.23, 0.1, "sine", 0.048]],
      bad: [[220, 0, 0.11, "sawtooth", 0.038]],
      trap: [[190, 0, 0.11, "sawtooth", 0.05], [95, 0.08, 0.18, "sawtooth", 0.042]],
      decoy: [[410, 0, 0.06, "square", 0.025], [260, 0.05, 0.1, "square", 0.028]],
      freeze: [[900, 0, 0.1, "triangle", 0.035], [450, 0.11, 0.18, "triangle", 0.035], [225, 0.26, 0.18, "triangle", 0.03]],
      pause: [[300, 0, 0.08, "sine", 0.026]],
      resume: [[520, 0, 0.08, "sine", 0.03]],
      gameover: [[330, 0, 0.11, "sine", 0.04], [247, 0.13, 0.13, "sine", 0.038], [196, 0.28, 0.2, "sine", 0.036]]
    };

    (patterns[type] || patterns.hit).forEach(([freq, offset, duration, wave, volume]) => {
      playTone(freq, now + offset, duration, wave, volume);
    });
  }

  function playTone(freq, start, duration, wave, volume) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = wave;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.03);
  }
  function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  init();
})();
