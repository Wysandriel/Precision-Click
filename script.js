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
    settingsScreen: $("#settingsScreen"),
    floatingTextLayer: $("#floatingTextLayer"),
    particleLayer: $("#particleLayer"),
    toast: $("#toast"),
    feverBanner: $("#feverBanner"),

    pauseTop: $("#pauseTop"),
    fullscreenBtn: $("#fullscreenBtn"),
    soundToggle: $("#soundToggle"),
    settingsOpen: $("#settingsOpen"),
    settingsClose: $("#settingsClose"),
    settingsDone: $("#settingsDone"),
    rulesOpenMenu: $("#rulesOpenMenu"),
    rulesClose: $("#rulesClose"),

    soundSetting: $("#soundSetting"),
    vibrationSetting: $("#vibrationSetting"),
    animationSetting: $("#animationSetting"),
    volumeSetting: $("#volumeSetting"),
    resetRecords: $("#resetRecords"),

    playerDisplay: $("#playerDisplay"),
    modeDisplay: $("#modeDisplay"),
    difficultyDisplay: $("#difficultyDisplay"),

    startGame: $("#startGame"),
    resumeGame: $("#resumeGame"),
    restartFromPause: $("#restartFromPause"),
    menuFromPause: $("#menuFromPause"),
    playAgain: $("#playAgain"),
    backToMenu: $("#backToMenu"),

    score: $("#score"),
    bestScore: $("#bestScore"),
    time: $("#time"),
    lives: $("#lives"),
    combo: $("#combo"),
    multiplier: $("#multiplier"),
    accuracy: $("#accuracy"),
    energyFill: $("#energyFill"),
    energyText: $("#energyText"),

    recordPlays: $("#recordPlays"),
    recordGlobalBest: $("#recordGlobalBest"),
    recordBestCombo: $("#recordBestCombo"),
    recordAvgAccuracy: $("#recordAvgAccuracy"),

    resultTitle: $("#resultTitle"),
    resultSummary: $("#resultSummary"),
    highScoreMessage: $("#highScoreMessage"),
    rankBadge: $("#rankBadge"),
    rankScore: $("#rankScore"),
    rankComment: $("#rankComment"),
    finalHits: $("#finalHits"),
    finalMisses: $("#finalMisses"),
    finalBestCombo: $("#finalBestCombo"),
    finalReaction: $("#finalReaction"),
    finalFever: $("#finalFever"),
    finalModeBest: $("#finalModeBest"),
    finalGlobalBest: $("#finalGlobalBest"),
    finalMissStreak: $("#finalMissStreak"),
    resultAdvice: $("#resultAdvice")
  };

  const STORAGE = {
    settings: "precision-click-upgrade-settings",
    bestScores: "precision-click-upgrade-best-scores",
    records: "precision-click-upgrade-records"
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
      spawnBase: 1080,
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

  const difficulties = {
    easy: {
      label: "Easy",
      sizeBonus: 12,
      spawnScale: 1.18,
      lifetimeScale: 1.2,
      scoreScale: 0.85,
      trapScale: 0.65,
      livesBonus: 1
    },
    normal: {
      label: "Normal",
      sizeBonus: 0,
      spawnScale: 1,
      lifetimeScale: 1,
      scoreScale: 1,
      trapScale: 1,
      livesBonus: 0
    },
    hard: {
      label: "Hard",
      sizeBonus: -7,
      spawnScale: 0.86,
      lifetimeScale: 0.88,
      scoreScale: 1.22,
      trapScale: 1.22,
      livesBonus: 0
    },
    expert: {
      label: "Expert",
      sizeBonus: -13,
      spawnScale: 0.72,
      lifetimeScale: 0.76,
      scoreScale: 1.48,
      trapScale: 1.45,
      livesBonus: -1
    }
  };

  const defaultSettings = {
    sound: true,
    vibration: true,
    animation: "medium",
    volume: 82
  };

  const defaultRecords = {
    plays: 0,
    globalBest: 0,
    bestCombo: 0,
    totalAccuracy: 0,
    accuracySamples: 0,
    lastScore: 0
  };

  let selectedMode = "classic";
  let selectedDifficulty = "normal";
  let settings = loadJson(STORAGE.settings, defaultSettings);
  let bestScores = loadJson(STORAGE.bestScores, {});
  let records = loadJson(STORAGE.records, defaultRecords);
  let audioCtx = null;
  let previousOverlayScreen = null;
  let resizeTimer = null;

  const EFFECT_POOL_SIZE = 120;
  const FLOAT_POOL_SIZE = 26;
  const FEVER_COMBO_STEP = 20;
  const FEVER_DURATION = 6000;
  const effectPools = {
    particles: [],
    floats: []
  };

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
    missStreak: 0,
    worstMissStreak: 0,
    reactions: [],
    fever: false,
    feverCount: 0,
    feverEndsAt: 0,
    nextFeverCombo: FEVER_COMBO_STEP,
    currentTarget: null,
    targetBornAt: 0,
    animationFrame: null,
    lastFrameAt: 0,
    targetTimer: null,
    achievements: new Set(),
    inputLockedUntil: 0,
    lastTargetX: null,
    lastTargetY: null
  };

  function setAppHeight() {
    const viewport = window.visualViewport;
    const height = viewport ? viewport.height : window.innerHeight;
    document.documentElement.style.setProperty("--app-height", `${Math.round(height)}px`);
  }

  function installMobileGuards() {
    setAppHeight();

    window.addEventListener("orientationchange", () => {
      window.setTimeout(setAppHeight, 120);
      window.setTimeout(setAppHeight, 420);
    }, { passive: true });

    window.addEventListener("resize", setAppHeight, { passive: true });

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", setAppHeight, { passive: true });
      window.visualViewport.addEventListener("scroll", setAppHeight, { passive: true });
    }

    document.addEventListener("touchmove", (event) => {
      if (!event.target.closest(".glass-card, .side-panel")) {
        event.preventDefault();
      }
    }, { passive: false });

    let lastTouchEnd = 0;
    document.addEventListener("touchend", (event) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    }, { passive: false });
  }

  function isMobileLayout() {
    return window.matchMedia("(max-width: 820px), (hover: none) and (pointer: coarse)").matches;
  }

  function init() {
    installMobileGuards();
    setupEffectPools();
    syncSettingsUI();
    applySettings();
    updateHud();
    updateRecordsUI();
    selectMode(selectedMode);
    selectDifficulty(selectedDifficulty);
    updateControlState();

    $$(".mode-btn").forEach((button) => {
      button.addEventListener("click", () => selectMode(button.dataset.mode));
    });

    $$(".difficulty-btn").forEach((button) => {
      button.addEventListener("click", () => selectDifficulty(button.dataset.difficulty));
    });

    onSafe(els.startGame, "click", startGame);
    onSafe(els.playAgain, "click", startGame);
    onSafe(els.resumeGame, "click", resumeGame);
    onSafe(els.restartFromPause, "click", startGame);
    onSafe(els.menuFromPause, "click", showMenu);
    onSafe(els.backToMenu, "click", showMenu);
    onSafe(els.pauseTop, "click", togglePause);
    onSafe(els.fullscreenBtn, "click", toggleFullscreen);
    onSafe(els.soundToggle, "click", toggleSound);
    onSafe(els.settingsOpen, "click", openSettings);
    onSafe(els.settingsClose, "click", closeSettings);
    onSafe(els.settingsDone, "click", closeSettings);
    onSafe(els.rulesOpenMenu, "click", openRules);
    onSafe(els.rulesClose, "click", closeRules);
    onSafe(els.resetRecords, "click", resetAllRecords);
    onSafe(els.arena, "pointerdown", handleArenaPointer);

    onSafe(els.soundSetting, "change", () => {
      settings.sound = els.soundSetting.checked;
      saveSettings();
      applySettings();
      if (settings.sound) playSound("start");
    });

    onSafe(els.vibrationSetting, "change", () => {
      settings.vibration = els.vibrationSetting.checked;
      saveSettings();
    });

    onSafe(els.animationSetting, "change", () => {
      settings.animation = els.animationSetting.value;
      saveSettings();
      applySettings();
    });

    onSafe(els.volumeSetting, "input", () => {
      settings.volume = Number(els.volumeSetting.value) || 0;
      saveSettings();
    });

    [els.menuScreen, els.pauseScreen, els.resultScreen, els.rulesScreen, els.settingsScreen].forEach((screen) => {
      onSafe(screen, "pointerdown", (event) => event.stopPropagation());
    });

    document.addEventListener("keydown", (event) => {
      if ((event.code === "Space" || event.key === "Escape") && state.running && !isScreenActive(els.rulesScreen) && !isScreenActive(els.settingsScreen)) {
        event.preventDefault();
        togglePause();
      }

      if (event.key === "Escape") {
        if (isScreenActive(els.rulesScreen)) closeRules();
        if (isScreenActive(els.settingsScreen)) closeSettings();
      }
    });

    window.addEventListener("resize", () => {
      setAppHeight();
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        if (state.running && !state.paused && !state.frozen) {
          clearTarget();
          spawnTarget();
        }
      }, 160);
    });

    document.addEventListener("fullscreenchange", updateFullscreenButton);
  }

  function onSafe(element, eventName, handler) {
    if (element) element.addEventListener(eventName, handler);
  }

  function loadJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return structuredCloneSafe(fallback);
      return { ...structuredCloneSafe(fallback), ...JSON.parse(raw) };
    } catch {
      return structuredCloneSafe(fallback);
    }
  }

  function structuredCloneSafe(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function saveSettings() {
    localStorage.setItem(STORAGE.settings, JSON.stringify(settings));
  }

  function saveBestScores() {
    localStorage.setItem(STORAGE.bestScores, JSON.stringify(bestScores));
  }

  function saveRecords() {
    localStorage.setItem(STORAGE.records, JSON.stringify(records));
  }

  function getScoreKey(mode = selectedMode, difficulty = selectedDifficulty) {
    return `${mode}:${difficulty}`;
  }

  function getCurrentBestScore() {
    return Number(bestScores[getScoreKey()]) || 0;
  }

  function selectMode(mode) {
    selectedMode = modes[mode] ? mode : "classic";
    $$(".mode-btn").forEach((button) => {
      button.classList.toggle("selected", button.dataset.mode === selectedMode);
    });
    updateHud();
  }

  function selectDifficulty(difficulty) {
    selectedDifficulty = difficulties[difficulty] ? difficulty : "normal";
    $$(".difficulty-btn").forEach((button) => {
      button.classList.toggle("selected", button.dataset.difficulty === selectedDifficulty);
    });
    updateHud();
  }

  function startGame() {
    unlockAudio();

    const mode = modes[selectedMode];
    const difficulty = difficulties[selectedDifficulty];
    state.running = true;
    state.paused = false;
    state.frozen = false;
    state.fever = false;
    state.score = 0;
    state.timeLeft = mode.totalTime;
    state.lives = Math.max(1, mode.lives + difficulty.livesBonus);
    state.combo = 0;
    state.bestCombo = 0;
    state.hits = 0;
    state.misses = 0;
    state.missStreak = 0;
    state.worstMissStreak = 0;
    state.reactions = [];
    state.feverCount = 0;
    state.feverEndsAt = 0;
    state.nextFeverCombo = FEVER_COMBO_STEP;
    state.achievements = new Set();
    state.inputLockedUntil = performance.now() + 420;
    state.lastTargetX = null;
    state.lastTargetY = null;
    state.lastTargetX = null;
    state.lastTargetY = null;

    els.playerDisplay.textContent = "ACTIVE";
    els.modeDisplay.textContent = `${mode.label} / ${mode.description}`;
    els.difficultyDisplay.textContent = difficulty.label;

    clearTimers();
    clearTarget();
    clearEffects();
    setFeverVisual(false);
    els.arena.classList.remove("frozen");
    showScreen(null);

    state.lastFrameAt = performance.now();
    state.animationFrame = window.requestAnimationFrame(gameLoop);

    playSound("start");
    vibrate(18);
    updateHud();
    updateControlState();
    spawnTarget();
  }

  function gameLoop(timestamp) {
    if (!state.running) return;

    if (!state.lastFrameAt) state.lastFrameAt = timestamp;
    const deltaSeconds = Math.min(0.08, (timestamp - state.lastFrameAt) / 1000);
    state.lastFrameAt = timestamp;

    if (!state.paused && !state.frozen) {
      state.timeLeft = Math.max(0, state.timeLeft - deltaSeconds);

      if (state.fever && timestamp >= state.feverEndsAt) {
        endFever();
      }

      if (state.timeLeft <= 0) {
        endGame();
        return;
      }
    }

    updateHud();
    state.animationFrame = window.requestAnimationFrame(gameLoop);
  }

  function endGame() {
    if (!state.running) return;

    state.running = false;
    state.paused = false;
    state.frozen = false;
    clearTimers();
    clearTarget();
    setFeverVisual(false);
    els.arena.classList.remove("frozen");

    const stats = getStats();
    const rank = getRank(stats);
    const bestResult = updateScoresAndRecords(stats);

    els.resultTitle.textContent = "任務結算";
    els.resultSummary.textContent = `分數 ${state.score}｜準確率 ${stats.accuracy}%｜模式 ${modes[selectedMode].label}｜難度 ${difficulties[selectedDifficulty].label}`;
    els.rankBadge.textContent = rank.rank;
    els.rankBadge.className = `rank-badge ${rank.className}`;
    els.rankScore.textContent = `${rank.score} / 100`;
    els.rankComment.textContent = rank.comment;
    if (els.resultAdvice) els.resultAdvice.textContent = getResultAdvice(stats, rank);
    els.finalHits.textContent = state.hits;
    els.finalMisses.textContent = state.misses;
    els.finalBestCombo.textContent = state.bestCombo;
    els.finalReaction.textContent = `${stats.avgReaction}ms`;
    els.finalFever.textContent = state.feverCount;
    els.finalModeBest.textContent = bestResult.modeBest;
    els.finalGlobalBest.textContent = records.globalBest;
    els.finalMissStreak.textContent = state.worstMissStreak;
    els.highScoreMessage.textContent = bestResult.newModeBest
      ? `新模式紀錄！${modes[selectedMode].label} / ${difficulties[selectedDifficulty].label} 最高分：${bestResult.modeBest}`
      : `目前模式最高分：${bestResult.modeBest}｜歷史最高分：${records.globalBest}`;

    showScreen(els.resultScreen);
    playSound("gameover");
    vibrate([18, 38, 18]);
    updateHud();
    updateRecordsUI();
    updateControlState();
  }

  function updateScoresAndRecords(stats) {
    const key = getScoreKey();
    const previousBest = Number(bestScores[key]) || 0;
    const newModeBest = state.score > previousBest;

    if (newModeBest) {
      bestScores[key] = state.score;
      saveBestScores();
    }

    records.plays += 1;
    records.lastScore = state.score;
    records.globalBest = Math.max(records.globalBest, state.score);
    records.bestCombo = Math.max(records.bestCombo, state.bestCombo);
    records.totalAccuracy += stats.accuracy;
    records.accuracySamples += 1;
    saveRecords();

    return {
      newModeBest,
      modeBest: Number(bestScores[key]) || previousBest
    };
  }

  function showMenu() {
    state.running = false;
    state.paused = false;
    state.frozen = false;
    clearTimers();
    clearTarget();
    setFeverVisual(false);
    els.playerDisplay.textContent = "READY";
    els.modeDisplay.textContent = "尚未開始";
    els.arena.classList.remove("frozen");
    showScreen(els.menuScreen);
    updateHud();
    updateControlState();
  }

  function togglePause() {
    if (!state.running) return;
    if (state.paused) resumeGame();
    else pauseGame();
  }

  function pauseGame() {
    if (!state.running || state.paused) return;
    state.paused = true;
    clearTarget();
    showScreen(els.pauseScreen);
    playSound("pause");
    updateControlState();
  }

  function resumeGame() {
    if (!state.running) return;
    state.paused = false;
    state.lastFrameAt = performance.now();
    showScreen(null);
    clearTarget();
    playSound("resume");
    updateControlState();
    spawnTarget();
  }

  function spawnTarget() {
    if (!state.running || state.paused || state.frozen) return;

    clearTarget();

    const rect = els.arena.getBoundingClientRect();
    const mode = modes[selectedMode];
    const difficulty = difficulties[selectedDifficulty];
    const type = chooseTargetType(mode.trapRate, difficulty.trapScale);
    const mobile = isMobileLayout();
    const baseSize = selectedMode === "rush" ? (mobile ? 58 : 52) : (mobile ? 64 : 58);
    const shrink = Math.min(mobile ? 14 : 22, Math.floor(state.hits / mode.shrinkEvery) * 2 + Math.floor(state.combo / 15));
    const size = clamp(baseSize + difficulty.sizeBonus - shrink, mobile ? 44 : 30, mobile ? 82 : 76);
    const safeArea = getTargetSafeArea(rect, size, mobile);
    const { x, y } = getFairTargetPosition(rect, safeArea, size);

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

    if (state.hits >= 10 && Math.random() < getMovingChance()) {
      button.classList.add("moving");
    }

    button.addEventListener("pointerdown", handleTargetPointer);
    els.arena.appendChild(button);

    state.currentTarget = button;
    state.lastTargetX = x;
    state.lastTargetY = y;
    state.targetBornAt = performance.now();

    const life = getTargetLifetime(mode, difficulty);
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

  function getTargetSafeArea(rect, size, mobile) {
    const edge = Math.max(size + 22, mobile ? 64 : 56);
    const bottomExtra = mobile ? Math.max(28, size * 0.45) : 0;
    const topExtra = mobile ? 6 : 0;

    const safe = {
      minX: edge,
      maxX: rect.width - edge,
      minY: edge + topExtra,
      maxY: rect.height - edge - bottomExtra
    };

    if (safe.maxX <= safe.minX) {
      safe.minX = rect.width / 2;
      safe.maxX = rect.width / 2;
    }

    if (safe.maxY <= safe.minY) {
      safe.minY = rect.height / 2;
      safe.maxY = rect.height / 2;
    }

    return safe;
  }

  function getFairTargetPosition(rect, safeArea, size) {
    const minDistance = Math.max(size * (isMobileLayout() ? 2.05 : 1.8), isMobileLayout() ? 112 : 96);
    let best = {
      x: random(safeArea.minX, safeArea.maxX),
      y: random(safeArea.minY, safeArea.maxY)
    };

    for (let attempt = 0; attempt < 24; attempt += 1) {
      const candidate = {
        x: random(safeArea.minX, safeArea.maxX),
        y: random(safeArea.minY, safeArea.maxY)
      };

      if (state.lastTargetX === null || state.lastTargetY === null) {
        return candidate;
      }

      const distance = Math.hypot(candidate.x - state.lastTargetX, candidate.y - state.lastTargetY);

      if (distance >= minDistance) {
        return candidate;
      }

      best = candidate;
    }

    return best;
  }

  function chooseTargetType(rate, trapScale) {
    const attempts = state.hits + state.misses;

    if (attempts < 3) {
      return Math.random() < 0.18 ? "gold" : "normal";
    }

    const pressure = clamp(state.hits / 65 + state.combo / 120, 0, 0.38);
    const dynamicTrapScale = trapScale * (1 + pressure);
    const safeGold = clamp(rate.gold * (1 / Math.max(0.85, dynamicTrapScale)), 0.07, 0.16);
    const bomb = clamp(rate.bomb * dynamicTrapScale, 0.07, 0.24);
    const decoy = clamp(rate.decoy * dynamicTrapScale, 0.05, 0.2);
    const freeze = clamp(rate.freeze * dynamicTrapScale, 0.03, 0.15);
    const r = Math.random();
    let cursor = safeGold;
    if (r < cursor) return "gold";
    cursor += bomb;
    if (r < cursor) return "bomb";
    cursor += decoy;
    if (r < cursor) return "decoy";
    cursor += freeze;
    if (r < cursor) return "freeze";
    return "normal";
  }

  function getMovingChance() {
    const difficultyBonus = { easy: 0.08, normal: 0.22, hard: 0.34, expert: 0.44 }[selectedDifficulty] || 0.22;
    return clamp(difficultyBonus + state.hits * 0.002, 0.08, 0.52);
  }

  function getTargetLifetime(mode, difficulty) {
    const dynamicPressure = state.hits * 12 + state.combo * 3;
    const feverPressure = state.fever ? 110 : 0;
    return Math.max(430, (mode.spawnBase * modeSpawnScale() - dynamicPressure - feverPressure) * difficulty.lifetimeScale);
  }

  function modeSpawnScale() {
    return difficulties[selectedDifficulty].spawnScale;
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

  function handleTargetPointer(event) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);

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
    state.missStreak = 0;
    state.bestCombo = Math.max(state.bestCombo, state.combo);

    const mode = modes[selectedMode];
    const difficulty = difficulties[selectedDifficulty];
    const multiplier = getMultiplier();
    const speedBonus = Math.max(0, Math.round(300 - reaction / 4));
    const comboBonus = Math.min(360, state.combo * 11);
    const goldBonus = type === "gold" ? 540 : 0;
    const feverBonus = state.fever ? 1.6 : 1;
    const gain = Math.round((135 + speedBonus + comboBonus + goldBonus) * multiplier * mode.scoreScale * difficulty.scoreScale * feverBonus);

    state.score += gain;

    if (type === "gold") {
      state.timeLeft += 2;
      floatText(`+${gain} / +2s`, x, y, state.fever ? "fever" : "gold");
      burst(x, y, "gold");
      playSound("gold");
      vibrate(16);
    } else {
      floatText(`+${gain}`, x, y, state.fever ? "fever" : "good");
      burst(x, y, state.fever ? "gold" : "normal");
      playSound("hit");
      vibrate(10);
    }

    flash("hit");

    if (state.combo >= state.nextFeverCombo) {
      triggerFever(x, y);
    } else if (state.combo > 0 && state.combo % 5 === 0) {
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
    state.missStreak += 1;
    state.worstMissStreak = Math.max(state.worstMissStreak, state.missStreak);
    state.combo = 0;
    state.nextFeverCombo = FEVER_COMBO_STEP;
    endFever();

    const streakPenalty = state.missStreak >= 3 ? Math.min(220, (state.missStreak - 2) * 70) : 0;
    state.score = Math.max(0, state.score - score - streakPenalty);
    state.lives = Math.max(0, state.lives - lives);
    state.timeLeft = Math.max(0, state.timeLeft - time);

    const finalLabel = streakPenalty ? `${label} / STREAK -${streakPenalty}` : label;
    floatText(finalLabel, x, y, freeze ? "cyan" : "bad");
    burst(x, y, freeze ? "freeze" : "bad");
    flash("miss", true);
    playSound(sound);
    vibrate(freeze ? [25, 30, 25] : 28);
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
    state.missStreak += 1;
    state.worstMissStreak = Math.max(state.worstMissStreak, state.missStreak);
    state.combo = 0;
    state.nextFeverCombo = FEVER_COMBO_STEP;
    endFever();

    const streakPenalty = state.missStreak >= 3 ? Math.min(200, (state.missStreak - 2) * 60) : 0;
    state.lives = Math.max(0, state.lives - 1);
    state.score = Math.max(0, state.score - 140 - streakPenalty);

    floatText(streakPenalty ? `MISS -140 / STREAK -${streakPenalty}` : "MISS -140", x, y, "bad");
    flash("miss", true);
    playSound("bad");
    vibrate(26);
    clearTarget();

    updateHud();

    if (state.lives <= 0) {
      endGame();
      return;
    }

    spawnTarget();
  }

  function handleArenaPointer(event) {
    if (!state.running || state.paused || state.frozen) return;
    if (performance.now() < state.inputLockedUntil) return;
    if (event.target.closest(".target")) return;
    if (event.target.closest(".screen")) return;

    event.preventDefault();
    const rect = els.arena.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    state.misses += 1;
    state.missStreak += 1;
    state.worstMissStreak = Math.max(state.worstMissStreak, state.missStreak);
    state.combo = 0;
    state.nextFeverCombo = FEVER_COMBO_STEP;
    endFever();

    const streakPenalty = state.missStreak >= 3 ? Math.min(180, (state.missStreak - 2) * 55) : 0;
    state.score = Math.max(0, state.score - 90 - streakPenalty);

    floatText(streakPenalty ? `-90 / STREAK -${streakPenalty}` : "-90", x, y, "bad");
    flash("miss", true);
    playSound("bad");
    vibrate(24);
    updateHud();
  }

  function triggerFever(x, y) {
    state.fever = true;
    state.feverCount += 1;
    state.feverEndsAt = performance.now() + FEVER_DURATION;
    state.nextFeverCombo += FEVER_COMBO_STEP;
    setFeverVisual(true);
    floatText("FEVER +60%", x, y, "fever");
    playSound("fever");
    vibrate([18, 28, 18]);
    toast("FEVER MODE！分數加成啟動");
  }

  function endFever() {
    if (!state.fever) return;
    state.fever = false;
    state.feverEndsAt = 0;
    setFeverVisual(false);
  }

  function setFeverVisual(active) {
    els.arena.classList.toggle("fever", active);
    if (active) {
      els.feverBanner.classList.remove("show");
      void els.feverBanner.offsetWidth;
      els.feverBanner.classList.add("show");
    } else {
      els.feverBanner.classList.remove("show");
    }
  }

  function freezeArena() {
    state.frozen = true;
    els.arena.classList.add("frozen");

    window.setTimeout(() => {
      state.frozen = false;
      state.lastFrameAt = performance.now();
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
    if (state.animationFrame) window.cancelAnimationFrame(state.animationFrame);
    window.clearTimeout(state.targetTimer);
    state.animationFrame = null;
    state.lastFrameAt = 0;
    state.targetTimer = null;
  }

  function clearEffects() {
    [...effectPools.particles, ...effectPools.floats].forEach((node) => {
      node.className = node.classList.contains("particle")
        ? "particle pooled-hidden"
        : "float-text pooled-hidden";
      node.textContent = "";
    });
  }

  function updateControlState() {
    if (els.pauseTop) {
      els.pauseTop.disabled = !state.running;
      els.pauseTop.textContent = state.paused ? "繼續" : "暫停";
    }
  }

  function updateHud() {
    const stats = getStats();
    const feverRemainingMs = state.fever ? Math.max(0, state.feverEndsAt - performance.now()) : 0;
    const progressToFever = state.fever
      ? clamp((feverRemainingMs / FEVER_DURATION) * 100, 0, 100)
      : clamp(((state.combo % FEVER_COMBO_STEP) / FEVER_COMBO_STEP) * 100, 0, 100);

    if (els.score.textContent !== String(state.score)) {
      els.score.textContent = String(state.score);
      els.score.classList.remove("score-pop");
      void els.score.offsetWidth;
      els.score.classList.add("score-pop");
    }

    els.bestScore.textContent = String(getCurrentBestScore());
    els.time.textContent = String(Math.ceil(Math.max(0, state.timeLeft)));
    els.lives.textContent = state.lives > 0 ? "♥".repeat(state.lives) : "0";
    els.combo.textContent = String(state.combo);
    els.multiplier.textContent = `x${getMultiplier().toFixed(2)}`;
    els.accuracy.textContent = `${stats.accuracy}%`;
    els.energyFill.style.width = `${progressToFever}%`;
    els.energyText.textContent = state.fever ? `${Math.ceil(feverRemainingMs / 1000)}s` : `${Math.round(progressToFever)}%`;
    els.difficultyDisplay.textContent = difficulties[selectedDifficulty].label;
    updateControlState();
  }

  function updateRecordsUI() {
    els.recordPlays.textContent = records.plays;
    els.recordGlobalBest.textContent = records.globalBest;
    els.recordBestCombo.textContent = records.bestCombo;
    const avgAccuracy = records.accuracySamples
      ? Math.round(records.totalAccuracy / records.accuracySamples)
      : 100;
    els.recordAvgAccuracy.textContent = `${avgAccuracy}%`;
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
    const base = 1 + Math.min(2.75, Math.floor(state.combo / 5) * 0.25);
    return state.fever ? base * 1.18 : base;
  }

  function getRank(stats) {
    const difficultyBonus = { easy: -4, normal: 0, hard: 4, expert: 8 }[selectedDifficulty] || 0;
    const scorePart = Math.min(55, state.score / 230);
    const accuracyPart = Math.min(24, stats.accuracy * 0.24);
    const speedPart = stats.avgReaction ? Math.max(0, Math.min(12, (900 - stats.avgReaction) / 48)) : 0;
    const comboPart = Math.min(10, state.bestCombo * 0.35);
    const feverPart = Math.min(5, state.feverCount * 2.2);
    const penalty = Math.min(12, state.misses * 0.65 + state.worstMissStreak * 0.8);
    const rankScore = Math.max(0, Math.round(scorePart + accuracyPart + speedPart + comboPart + feverPart + difficultyBonus - penalty));

    const table = [
      ["SSS", 96, "rank-sss", "頂級精準。速度、穩定度、連擊與 Fever 控制都很完整。"],
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

    const found = table.find((item) => rankScore >= item[1]) || table[table.length - 1];
    return {
      rank: found[0],
      score: rankScore,
      className: found[2],
      comment: found[3]
    };
  }

  function getResultAdvice(stats, rank) {
    if (stats.attempts === 0) {
      return "下一局先熟悉目標顏色，白色與金色可以點，其他顏色先避開。";
    }

    if (stats.accuracy < 70) {
      return "建議下一局先放慢一點，不要急著追分，先把準確率拉到 80% 以上。";
    }

    if (state.worstMissStreak >= 3) {
      return "連續失誤偏多，看到陷阱時先停半拍確認，穩住比亂點更容易拿高分。";
    }

    if (state.bestCombo < 12) {
      return "可以把目標放在維持連擊，連擊穩定後倍率會上來，分數會自然提高。";
    }

    if (stats.avgReaction > 720 && stats.accuracy >= 80) {
      return "準確率不錯，下一步可以挑戰更快反應，優先點金色目標延長時間。";
    }

    if (rank.score >= 84) {
      return "這局表現很穩，已經可以挑戰更高難度或 Rush 模式。";
    }

    return "整體表現不錯，下一局可以優先保持 Combo，並在 Fever 前避免冒險點陷阱。";
  }

  function checkAchievements(reaction) {
    const checks = [
      ["fast", reaction < 280, "超高速反應！"],
      ["combo10", state.combo === 10, "10 連擊達成！"],
      ["combo20", state.combo === 20, "20 連擊，Fever 準備完成！"],
      ["score8000", state.score >= 8000, "突破 8000 分！"]
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
    if (state.running) pauseGame();
    showScreen(els.rulesScreen);
  }

  function closeRules() {
    if (state.running) showScreen(els.pauseScreen);
    else showScreen(previousOverlayScreen || els.menuScreen);
    previousOverlayScreen = null;
  }

  function openSettings() {
    syncSettingsUI();
    previousOverlayScreen = getActiveScreen();
    if (state.running) pauseGame();
    showScreen(els.settingsScreen);
  }

  function closeSettings() {
    if (state.running) showScreen(els.pauseScreen);
    else showScreen(previousOverlayScreen || els.menuScreen);
    previousOverlayScreen = null;
  }

  function getActiveScreen() {
    return [els.menuScreen, els.pauseScreen, els.resultScreen, els.rulesScreen, els.settingsScreen]
      .find((item) => item && item.classList.contains("active")) || null;
  }

  function showScreen(screen) {
    [els.menuScreen, els.pauseScreen, els.resultScreen, els.rulesScreen, els.settingsScreen].forEach((item) => {
      if (!item) return;
      item.classList.toggle("active", item === screen);
    });
  }

  function isScreenActive(screen) {
    return screen && screen.classList.contains("active");
  }

  function flash(type, shake = false) {
    if (settings.animation === "low") return;
    els.arena.classList.remove("hit", "miss", "shake");
    void els.arena.offsetWidth;
    els.arena.classList.add(type);
    if (shake) els.arena.classList.add("shake");

    window.setTimeout(() => {
      els.arena.classList.remove(type, "shake");
    }, 240);
  }

  function setupEffectPools() {
    if (!els.particleLayer || !els.floatingTextLayer) return;

    for (let i = 0; i < EFFECT_POOL_SIZE; i += 1) {
      const particle = document.createElement("span");
      particle.className = "particle pooled-hidden";
      els.particleLayer.appendChild(particle);
      effectPools.particles.push(particle);
    }

    for (let i = 0; i < FLOAT_POOL_SIZE; i += 1) {
      const text = document.createElement("div");
      text.className = "float-text pooled-hidden";
      els.floatingTextLayer.appendChild(text);
      effectPools.floats.push(text);
    }
  }

  function getAvailableNode(pool, fallbackFactory) {
    const node = pool.find((item) => item.classList.contains("pooled-hidden"));
    if (node) return node;
    const fallback = fallbackFactory();
    pool.push(fallback);
    return fallback;
  }

  function replayAnimation(node) {
    node.style.animation = "none";
    void node.offsetWidth;
    node.style.animation = "";
  }

  function floatText(text, x, y, type) {
    const node = getAvailableNode(effectPools.floats, () => {
      const created = document.createElement("div");
      els.floatingTextLayer.appendChild(created);
      return created;
    });

    node.className = `float-text ${type}`;
    node.textContent = text;
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
    replayAnimation(node);

    window.setTimeout(() => {
      node.className = "float-text pooled-hidden";
      node.textContent = "";
    }, 820);
  }

  function burst(x, y, type) {
    if (settings.animation === "low") return;

    const color = {
      normal: "var(--green)",
      gold: "var(--gold)",
      bad: "var(--red)",
      freeze: "var(--cyan)"
    }[type] || "var(--green)";

    const count = settings.animation === "high" ? 18 : 12;

    for (let i = 0; i < count; i += 1) {
      const particle = getAvailableNode(effectPools.particles, () => {
        const created = document.createElement("span");
        els.particleLayer.appendChild(created);
        return created;
      });

      particle.className = "particle";
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      particle.style.color = color;

      const angle = (Math.PI * 2 * i) / count;
      const distance = random(36, settings.animation === "high" ? 104 : 82);
      particle.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
      particle.style.setProperty("--dy", `${Math.sin(angle) * distance}px`);
      replayAnimation(particle);

      window.setTimeout(() => {
        particle.className = "particle pooled-hidden";
      }, 700);
    }
  }

  function toast(message) {
    els.toast.textContent = message;
    els.toast.classList.remove("show");
    void els.toast.offsetWidth;
    els.toast.classList.add("show");
    window.setTimeout(() => els.toast.classList.remove("show"), 2200);
  }

  function syncSettingsUI() {
    els.soundSetting.checked = Boolean(settings.sound);
    els.vibrationSetting.checked = Boolean(settings.vibration);
    els.animationSetting.value = settings.animation;
    els.volumeSetting.value = String(settings.volume);
  }

  function applySettings() {
    document.body.classList.toggle("anim-low", settings.animation === "low");
    updateSoundButton();
  }

  function toggleSound() {
    settings.sound = !settings.sound;
    saveSettings();
    syncSettingsUI();
    applySettings();
    if (settings.sound) playSound("start");
  }

  function updateSoundButton() {
    els.soundToggle.textContent = settings.sound ? "音效 ON" : "音效 OFF";
  }

  function unlockAudio() {
    if (!settings.sound) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!audioCtx || audioCtx.state === "closed") audioCtx = new Ctx();
    if (audioCtx.state === "suspended") audioCtx.resume();
  }

  function playSound(type) {
    if (!settings.sound) return;
    unlockAudio();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;
    const loudness = clamp(settings.volume / 100, 0, 1);
    const master = 1.85 * loudness;
    const patterns = {
      start: [[440, 0, 0.07, "sine", 0.055], [660, 0.08, 0.08, "sine", 0.06], [880, 0.18, 0.12, "sine", 0.07]],
      hit: [[700, 0, 0.06, "sine", 0.07]],
      gold: [[740, 0, 0.08, "triangle", 0.075], [1040, 0.09, 0.11, "triangle", 0.078], [1320, 0.2, 0.1, "sine", 0.07]],
      fever: [[523, 0, 0.08, "triangle", 0.08], [784, 0.09, 0.1, "triangle", 0.088], [1046, 0.2, 0.12, "sine", 0.085], [1568, 0.34, 0.16, "sine", 0.075]],
      combo: [[523, 0, 0.06, "triangle", 0.065], [659, 0.06, 0.07, "triangle", 0.07], [784, 0.13, 0.09, "triangle", 0.078]],
      bad: [[220, 0, 0.11, "sawtooth", 0.066]],
      trap: [[190, 0, 0.11, "sawtooth", 0.078], [95, 0.08, 0.18, "sawtooth", 0.065]],
      decoy: [[410, 0, 0.06, "square", 0.05], [260, 0.05, 0.1, "square", 0.052]],
      freeze: [[900, 0, 0.1, "triangle", 0.058], [450, 0.11, 0.18, "triangle", 0.058], [225, 0.26, 0.18, "triangle", 0.048]],
      pause: [[300, 0, 0.08, "sine", 0.046]],
      resume: [[520, 0, 0.08, "sine", 0.052]],
      gameover: [[330, 0, 0.11, "sine", 0.065], [247, 0.13, 0.13, "sine", 0.06], [196, 0.28, 0.2, "sine", 0.056]]
    };

    (patterns[type] || patterns.hit).forEach(([frequency, delay, duration, wave, gainValue]) => {
      const oscillator = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      oscillator.type = wave;
      oscillator.frequency.setValueAtTime(frequency, now + delay);
      gain.gain.setValueAtTime(0.0001, now + delay);
      gain.gain.exponentialRampToValueAtTime(Math.min(0.22, gainValue * master), now + delay + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + duration);
      oscillator.connect(gain).connect(audioCtx.destination);
      oscillator.start(now + delay);
      oscillator.stop(now + delay + duration + 0.04);
    });
  }

  function vibrate(pattern) {
    if (!settings.vibration) return;
    if (navigator.vibrate) navigator.vibrate(pattern);
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }

  function updateFullscreenButton() {
    els.fullscreenBtn.textContent = document.fullscreenElement ? "離開全螢幕" : "全螢幕";
  }

  function resetAllRecords() {
    const ok = window.confirm("確定要清除所有最高分與遊玩紀錄嗎？");
    if (!ok) return;
    bestScores = {};
    records = structuredCloneSafe(defaultRecords);
    saveBestScores();
    saveRecords();
    updateHud();
    updateRecordsUI();
    toast("紀錄已清除");
  }

  function random(min, max) {
    if (max <= min) return min;
    return Math.random() * (max - min) + min;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  init();
})();
