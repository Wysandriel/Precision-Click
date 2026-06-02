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

  const MODES = {
    classic: { name: "經典模式", duration: 45, maxLives: 3, dynamicSpawn: true, desc: "時間與生命兼具的平衡挑戰" },
    rush: { name: "極速狂飆", duration: 30, maxLives: 999, dynamicSpawn: true, desc: "無生命限制，全速挑戰點擊極限" },
    survival: { name: "極限生存", duration: 999, maxLives: 1, dynamicSpawn: true, desc: "一命通關，生命有限但時間無窮" }
  };

  const TARGET_TYPES = {
    normal: { score: 100, class: "normal", label: "" },
    gold: { score: 250, class: "gold", label: "+2s", timeBonus: 2 },
    red: { score: -200, class: "red", label: "💥", dmg: 1 },
    purple: { score: -150, class: "purple", label: "✨", decoy: true },
    cyan: { score: -100, class: "cyan", label: "❄️", freeze: true, timeDmg: 3 }
  };

  const AUDIO_CONFIG = {
    hit: [[523, 0, 0.06, "triangle", 0.04], [659, 0.06, 0.07, "triangle", 0.045], [784, 0.13, 0.09, "triangle", 0.05], [1046, 0.23, 0.1, "sine", 0.048]],
    bad: [[220, 0, 0.11, "sawtooth", 0.038]],
    trap: [[190, 0, 0.11, "sawtooth", 0.05], [95, 0.08, 0.18, "sawtooth", 0.042]],
    decoy: [[410, 0, 0.06, "square", 0.025], [260, 0.05, 0.1, "square", 0.028]],
    freeze: [[900, 0, 0.1, "triangle", 0.035], [450, 0.11, 0.18, "triangle", 0.035], [225, 0.26, 0.18, "triangle", 0.03]],
    pause: [[300, 0, 0.08, "sine", 0.026]],
    resume: [[520, 0, 0.08, "sine", 0.03]],
    gameover: [[392, 0, 0.15, "sawtooth", 0.04], [349, 0.15, 0.15, "sawtooth", 0.04], [311, 0.3, 0.2, "sawtooth", 0.04], [261, 0.5, 0.4, "square", 0.05]],
    fever_start: [[440, 0, 0.05, "sine", 0.04], [554, 0.05, 0.05, "sine", 0.04], [659, 0.1, 0.05, "sine", 0.04], [880, 0.15, 0.2, "triangle", 0.06]]
  };

  let state = {
    player: "吳昇融",
    mode: null,
    isPlaying: false,
    isPaused: false,
    score: 0,
    timeRemaining: 0,
    lives: 0,
    combo: 0,
    bestCombo: 0,
    multiplier: 1,
    totalClicks: 0,
    hits: 0,
    misses: 0,
    soundEnabled: true,
    totalReactionTime: 0,
    reactionCount: 0,
    currentSpawnTime: 0,
    isFever: false,
    feverTimer: null
  };

  let loopInterval = null;
  let timeInterval = null;
  let currentTargetEl = null;
  let audioCtx = null;

  function init() {
    setupSoundConfig();
    bindEvents();
    initUI();
  }

  function setupSoundConfig() {
    const saved = localStorage.getItem(STORAGE.sound);
    state.soundEnabled = saved === null ? true : saved === "true";
    updateSoundBtn();
  }

  function updateSoundBtn() {
    els.soundToggle.textContent = `音效 ${state.soundEnabled ? "ON" : "OFF"}`;
    els.soundToggle.classList.toggle("disabled", !state.soundEnabled);
  }

  function playSynthAudio(type) {
    if (!state.soundEnabled) return;
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }
      const now = audioCtx.currentTime;
      const sequence = AUDIO_CONFIG[type];
      if (!sequence) return;

      sequence.forEach(([freq, startOffset, duration, waveType, vol]) => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        osc.type = waveType;
        osc.frequency.setValueAtTime(freq, now + startOffset);

        gainNode.gain.setValueAtTime(vol, now + startOffset);
        gainNode.gain.exponentialRampToValueAtTime(0.00001, now + startOffset + duration);

        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        osc.start(now + startOffset);
        osc.stop(now + startOffset + duration);
      });
    } catch (e) {
      console.warn("音效播放失敗:", e);
    }
  }

  function bindEvents() {
    els.soundToggle.addEventListener("click", () => {
      state.soundEnabled = !state.soundEnabled;
      localStorage.setItem(STORAGE.sound, state.soundEnabled);
      updateSoundBtn();
    });

    const openRules = () => {
      if (state.isPlaying && !state.isPaused) pauseGame();
      els.rulesScreen.classList.add("active");
    };

    els.rulesOpenTop.addEventListener("click", openRules);
    els.rulesOpenMenu.addEventListener("click", openRules);
    els.rulesClose.addEventListener("click", () => els.rulesScreen.classList.remove("active"));

    $$("input[name='mode-select']").forEach(input => {
      input.addEventListener("change", (e) => {
        const m = MODES[e.target.value];
        $("#menuDesc").textContent = m ? m.desc : "請選擇戰鬥模式";
      });
    });

    els.startGame.addEventListener("click", () => {
      const selected = $("input[name='mode-select']:checked");
      if (!selected) {
        showToast("請先選擇遊玩模式！");
        return;
      }
      startGame(selected.value);
    });

    els.resumeGame.addEventListener("click", resumeGame);
    els.playAgain.addEventListener("click", () => startGame(state.mode));
    els.backToMenu.addEventListener("click", showMenu);

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" || e.key === "p" || e.key === "P") {
        if (state.isPlaying) {
          state.isPaused ? resumeGame() : pauseGame();
        }
      }
    });

    els.arena.addEventListener("click", (e) => {
      if (!state.isPlaying || state.isPaused) return;
      if (e.target === els.arena) {
        handleMissClick(e);
      }
    });
  }

  function initUI() {
    els.playerDisplay.textContent = state.player;
    showMenu();
  }

  function showMenu() {
    state.isPlaying = false;
    state.isPaused = false;
    clearInterval(loopInterval);
    clearInterval(timeInterval);
    if (state.feverTimer) clearTimeout(state.feverTimer);
    endFeverMode();
    removeTarget();

    els.menuScreen.classList.add("active");
    els.pauseScreen.classList.remove("active");
    els.resultScreen.classList.remove("active");
    els.rulesScreen.classList.remove("active");

    els.playerDisplay.textContent = state.player;
    els.modeDisplay.textContent = "尚未開始";
    updateHUD();
  }

  function startGame(modeKey) {
    const config = MODES[modeKey];
    if (!config) return;

    state.mode = modeKey;
    state.isPlaying = true;
    state.isPaused = false;
    state.score = 0;
    state.timeRemaining = config.duration;
    state.lives = config.maxLives;
    state.combo = 0;
    state.bestCombo = 0;
    state.multiplier = 1;
    state.totalClicks = 0;
    state.hits = 0;
    state.misses = 0;
    state.totalReactionTime = 0;
    state.reactionCount = 0;
    state.isFever = false;

    els.menuScreen.classList.remove("active");
    els.pauseScreen.classList.remove("active");
    els.resultScreen.classList.remove("active");

    els.modeDisplay.textContent = config.name;
    updateHUD();

    els.particleLayer.innerHTML = "";
    els.floatingTextLayer.innerHTML = "";

    nextTargetSpawn();

    clearInterval(timeInterval);
    timeInterval = setInterval(() => {
      if (state.isPaused) return;
      if (state.mode !== "survival") {
        state.timeRemaining--;
        if (state.timeRemaining <= 0) {
          state.timeRemaining = 0;
          endGame();
        }
      } else {
        state.timeRemaining++;
      }
      updateHUD();
    }, 1000);
  }

  function pauseGame() {
    if (!state.isPlaying || state.isPaused) return;
    state.isPaused = true;
    playSynthAudio("pause");
    els.pauseScreen.classList.add("active");
    if (currentTargetEl) {
      currentTargetEl.style.animationPlayState = "paused";
    }
  }

  function resumeGame() {
    if (!state.isPlaying || !state.isPaused) return;
    state.isPaused = false;
    playSynthAudio("resume");
    els.pauseScreen.classList.remove("active");
    if (currentTargetEl) {
      currentTargetEl.style.animationPlayState = "running";
    }
  }

  function updateHUD() {
    els.score.textContent = state.score.toLocaleString();
    els.time.textContent = state.mode === "survival" ? `${state.timeRemaining}s` : `${state.timeRemaining}s`;
    els.lives.textContent = state.mode === "rush" ? "∞" : "♥".repeat(Math.max(0, state.lives));
    els.combo.textContent = state.combo;
    els.multiplier.textContent = `x${state.multiplier}`;

    const acc = state.totalClicks === 0 ? 100 : Math.round((state.hits / state.totalClicks) * 100);
    els.accuracy.textContent = `${acc}%`;

    // Fever Energy 計算（每20連擊為一輪滿格）
    const energyPercent = state.isFever ? 100 : (state.combo % 20) * 5;
    els.energyFill.style.width = `${energyPercent}%`;
    els.energyText.textContent = state.isFever ? "CRITICAL FEVER" : `COMBO ENERGY ${energyPercent}%`;
  }

  function getTargetLifetime() {
    const base = 1350;
    const speedReduction = state.hits * 14;
    return Math.max(480, base - speedReduction);
  }

  function nextTargetSpawn() {
    if (!state.isPlaying || state.isPaused) return;
    removeTarget();

    let pool = ["normal", "normal", "gold"];
    if (state.hits >= 4) pool.push("purple");
    if (state.hits >= 8) pool.push("red");
    if (state.hits >= 13) pool.push("cyan");

    const randType = pool[Math.floor(Math.random() * pool.length)];
    const typeConfig = TARGET_TYPES[randType];

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `target-node ${typeConfig.class}`;
    if (typeConfig.label) btn.setAttribute("data-label", typeConfig.label);

    const arenaWidth = els.arena.clientWidth;
    const arenaHeight = els.arena.clientHeight;
    const size = 64; 

    const x = Math.random() * (arenaWidth - size);
    const y = Math.random() * (arenaHeight - size);

    btn.style.left = `${x}px`;
    btn.style.top = `${y}px`;

    const lifetime = getTargetLifetime();
    btn.style.setProperty("--duration", `${lifetime}ms`);

    if (state.hits >= 10 && Math.random() < 0.34) {
      btn.classList.add("moving");
    }

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      handleTargetClick(typeConfig, x + size / 2, y + size / 2, btn);
    });

    els.arena.appendChild(btn);
    currentTargetEl = btn;
    state.currentSpawnTime = performance.now();

    btn.addEventListener("animationend", (e) => {
      if (e.animationName === "shrinkOut") {
        handleTargetExpire(typeConfig);
      }
    });
  }

  function removeTarget() {
    if (currentTargetEl) {
      currentTargetEl.remove();
      currentTargetEl = null;
    }
  }

  function triggerFeverTime() {
    state.isFever = true;
    playSynthAudio("fever_start");
    els.arena.classList.add("fever-active");
    showToast("🔥 FEVER TIME 狂暴加分模式！");
    updateHUD();

    if (state.feverTimer) clearTimeout(state.feverTimer);
    state.feverTimer = setTimeout(() => {
      endFeverMode();
    }, 5000);
  }

  function endFeverMode() {
    state.isFever = false;
    els.arena.classList.remove("fever-active");
    updateHUD();
  }

  function handleTargetClick(config, cx, cy, element) {
    if (!state.isPlaying || state.isPaused) return;
    state.totalClicks++;

    const clickTime = performance.now();
    const rt = clickTime - state.currentSpawnTime;
    state.totalReactionTime += rt;
    state.reactionCount++;

    // 處理 Fever 模式下的陷阱轉換邏輯
    let isPositive = !config.decoy && !config.freeze && config.dmg === undefined;
    let finalConfig = config;

    if (state.isFever && !isPositive) {
      // 陷阱全部被神聖程式碼逆轉為高額獎勵目標！
      finalConfig = { score: 150, class: "gold", label: "✨FEVER" };
      isPositive = true;
      spawnFloatingText(cx, cy, "+150 FEVER!", "fever");
      playSynthAudio("hit");
    }

    if (isPositive) {
      state.hits++;
      state.combo++;
      if (state.combo > state.bestCombo) state.bestCombo = state.combo;

      if (state.combo % 5 === 0) {
        state.multiplier = Math.min(5, 1 + Math.floor(state.combo / 5));
      }

      const addedScore = finalConfig.score * state.multiplier;
      state.score += addedScore;

      if (finalConfig.timeBonus && state.mode !== "survival") {
        state.timeRemaining += finalConfig.timeBonus;
      }

      spawnFloatingText(cx, cy, `+${addedScore}`, "good");
      spawnParticles(cx, cy, finalConfig.class);
      playSynthAudio("hit");

      // 檢查是否觸發狂暴模式
      if (state.combo % 20 === 0 && !state.isFever) {
        triggerFeverTime();
      }
    } else {
      // 正常非 Fever 狀態下的懲罰處理
      state.misses++;
      state.combo = 0;
      state.multiplier = 1;
      state.score = Math.max(0, state.score + finalConfig.score);

      if (finalConfig.dmg && state.mode !== "rush") {
        state.lives -= finalConfig.dmg;
      }
      if (finalConfig.timeDmg && state.mode !== "survival") {
        state.timeRemaining = Math.max(0, state.timeRemaining - finalConfig.timeDmg);
      }

      spawnFloatingText(cx, cy, finalConfig.freeze ? "凍結! -3s" : "陷阱!", "bad");
      spawnParticles(cx, cy, finalConfig.class);

      if (finalConfig.freeze) {
        playSynthAudio("freeze");
        triggerFreezeEffect();
      } else if (finalConfig.decoy) {
        playSynthAudio("decoy");
      } else {
        playSynthAudio("trap");
      }

      if (state.lives <= 0 && state.mode !== "rush") {
        endGame();
        return;
      }
    }

    updateHUD();
    nextTargetSpawn();
  }

  function handleMissClick(e) {
    state.totalClicks++;
    state.misses++;
    state.combo = 0;
    state.multiplier = 1;
    state.score = Math.max(0, state.score - 50);

    spawnFloatingText(e.offsetX, e.offsetY, "MISS -50", "bad");
    playSynthAudio("bad");
    updateHUD();
  }

  function handleTargetExpire(config) {
    if (!state.isPlaying || state.isPaused) return;

    const isTrap = config.decoy || config.freeze || config.dmg !== undefined;
    if (!isTrap) {
      state.combo = 0;
      state.multiplier = 1;
      if (state.mode !== "rush") {
        state.lives--;
      }
      playSynthAudio("bad");
      updateHUD();

      if (state.lives <= 0 && state.mode !== "rush") {
        endGame();
        return;
      }
    }
    nextTargetSpawn();
  }

  function triggerFreezeEffect() {
    els.arena.classList.add("frozen");
    setTimeout(() => {
      els.arena.classList.remove("frozen");
    }, 650);
  }

  function spawnFloatingText(x, y, text, type) {
    const el = document.createElement("span");
    el.className = `floating-text ${type}`;
    el.textContent = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    els.floatingTextLayer.appendChild(el);
    el.addEventListener("animationend", () => el.remove());
  }

  function spawnParticles(x, y, type) {
    const count = 14;
    for (let i = 0; i < count; i++) {
      const p = document.createElement("i");
      p.className = `particle ${type}`;
      const angle = Math.random() * Math.PI * 2;
      const velocity = 35 + Math.random() * 55;
      const dx = Math.cos(angle) * velocity;
      const dy = Math.sin(angle) * velocity;

      p.style.setProperty("--dx", `${dx}px`);
      p.style.setProperty("--dy", `${dy}px`);
      p.style.left = `${x}px`;
      p.style.top = `${y}px`;

      els.particleLayer.appendChild(p);
      p.addEventListener("animationend", () => p.remove());
    }
  }

  function showToast(msg) {
    els.toast.textContent = msg;
    els.toast.classList.add("active");
    setTimeout(() => els.toast.classList.remove("active"), 2200);
  }

  function calculateRank(score, acc, avgRt) {
    if (state.hits < 3 && score < 500) return { r: "E", c: "戰場初心者", comment: "再接再厲，抓準節奏感！" };
    if (acc >= 94 && avgRt <= 420 && score > 8000) return { r: "SSS", c: "神之領域", comment: "完美的反應力，無懈可擊！" };
    if (acc >= 88 && avgRt <= 500 && score > 5500) return { r: "SS", c: "頂尖掠奪者", comment: "反應速度驚人，電競級選手！" };
    if (acc >= 82 && avgRt <= 580 && score > 4000) return { r: "S", c: "王牌精英", comment: "身手矯健，精準度極高！" };
    if (score > 2800 || acc > 75) return { r: "A", c: "卓越戰士", comment: "表現優異，能冷靜應對陷阱。" };
    if (score > 1500 || acc > 60) return { r: "B", c: "中堅悍將", comment: "中規中矩，避開紅色炸彈是關鍵。" };
    if (score > 600) return { r: "C", c: "合格新兵", comment: "熟悉基本操作，多練習連擊。" };
    return { r: "D", c: "後勤民兵", comment: "多加練習，避免落入冰凍陷阱。" };
  }

  function endGame() {
    state.isPlaying = false;
    clearInterval(loopInterval);
    clearInterval(timeInterval);
    if (state.feverTimer) clearTimeout(state.feverTimer);
    endFeverMode();
    removeTarget();
    playSynthAudio("gameover");

    const acc = state.totalClicks === 0 ? 0 : Math.round((state.hits / state.totalClicks) * 100);
    const avgRt = state.reactionCount === 0 ? 0 : Math.round(state.totalReactionTime / state.reactionCount);

    const rankObj = calculateRank(state.score, acc, avgRt);

    els.rankBadge.textContent = rankObj.r;
    els.rankBadge.className = `rank-badge rank-${rankObj.r}`;
    els.rankScore.textContent = `${state.score.toLocaleString()} PTS`;
    els.rankComment.innerHTML = `<strong>【${rankObj.c}】</strong> ${rankObj.comment}`;

    els.finalHits.textContent = state.hits;
    els.finalMisses.textContent = state.misses;
    els.finalBestCombo.textContent = state.bestCombo;
    els.finalReaction.textContent = avgRt > 0 ? `${avgRt} ms` : "--";

    els.resultSummary.textContent = `${MODES[state.state.mode]?.name || "挑戰"}任務結算`;
    els.resultScreen.classList.add("active");
  }

  document.addEventListener("DOMContentLoaded", init);
})();
