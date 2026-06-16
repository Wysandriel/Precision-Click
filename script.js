/*
  Reaction Arena：Rift Edition

  這個簡化版本的遊戲旨在示範如何將多階段、隨機升級與簡易養成融入反應點擊類型。
  每局包含數個階段，每個階段結束後玩家可以從三張升級卡中選擇一張。升級會改變遊戲參數，
  例如增加得分倍率、提升金色目標機率或延長時間。最後一個階段為 Boss，完成後顯示結算。
*/

(function () {
  // 取得 DOM 元件
  const screens = {
    menu: document.getElementById("menu"),
    game: document.getElementById("game"),
    upgrade: document.getElementById("upgrade"),
    result: document.getElementById("result"),
  };
  const startBtn = document.getElementById("startBtn");
  const restartBtn = document.getElementById("restartBtn");
  const backBtn = document.getElementById("backBtn");
  const arena = document.getElementById("arena");
  const upgradeChoices = document.getElementById("upgradeChoices");
  const resultText = document.getElementById("resultText");
  const lastSummary = document.getElementById("lastSummary");

  // HUD 元件
  const stageDisplay = document.getElementById("stageDisplay");
  const scoreDisplay = document.getElementById("scoreDisplay");
  const timeDisplay = document.getElementById("timeDisplay");
  const livesDisplay = document.getElementById("livesDisplay");
  const multiplierDisplay = document.getElementById("multiplierDisplay");

  /* 遊戲設定 */
  const STAGES = [
    { duration: 30, spawnInterval: 1000, trapChance: 0.15, goldChance: 0.1, size: 60 },
    { duration: 35, spawnInterval: 850, trapChance: 0.2, goldChance: 0.12, size: 55 },
    { duration: 40, spawnInterval: 750, trapChance: 0.25, goldChance: 0.15, size: 50 },
    { duration: 45, spawnInterval: 700, trapChance: 0.3, goldChance: 0.18, size: 45 }, // Boss stage
  ];

  // 升級卡定義
  const UPGRADE_POOL = [
    {
      name: "Overclock",
      desc: "提升得分倍率 0.5",
      apply: (state) => {
        state.scoreMultiplier += 0.5;
      },
    },
    {
      name: "Critical Tap",
      desc: "每次命中額外加成 20% 分數",
      apply: (state) => {
        state.scoreBonus += 0.2;
      },
    },
    {
      name: "Shield Core",
      desc: "增加 1 點生命",
      apply: (state) => {
        state.lives += 1;
      },
    },
    {
      name: "Gold Hunter",
      desc: "金色目標出現機率 +5%",
      apply: (state) => {
        state.goldChanceBonus += 0.05;
      },
    },
    {
      name: "Slow Zone",
      desc: "目標存在時間 +0.5 秒",
      apply: (state) => {
        state.lifetimeBonus += 500;
      },
    },
    {
      name: "Focus Time",
      desc: "每階段額外增加 5 秒",
      apply: (state) => {
        state.extraTime += 5;
      },
    },
    {
      name: "Precision Field",
      desc: "目標尺寸增加 8%",
      apply: (state) => {
        state.sizeBonus += 0.08;
      },
    },
    {
      name: "Trap Discipline",
      desc: "炸彈懲罰減半",
      apply: (state) => {
        state.trapPenaltyReduction += 0.5;
      },
    },
    {
      name: "Gold Reserve",
      desc: "每個金色目標額外增加 5 分",
      apply: (state) => {
        state.goldScoreBonus += 5;
      },
    },
  ];

  // 遊戲狀態物件
  let state;
  let spawnTimer = null;
  let stageTimer = null;
  let countdownTimer = null;

  /**
   * 初始化並開始遊戲
   */
  function startGame() {
    // 建立初始狀態
    state = {
      stageIndex: 0,
      score: 0,
      lives: 3,
      scoreMultiplier: 1,
      scoreBonus: 0,
      goldChanceBonus: 0,
      lifetimeBonus: 0,
      sizeBonus: 0,
      trapPenaltyReduction: 0,
      goldScoreBonus: 0,
      extraTime: 0,
    };
    hideAllScreens();
    screens.game.classList.add("active");
    nextStage();
  }

  /**
   * 開始下一個階段。
   * 若沒有下一個階段則結束遊戲。
   */
  function nextStage() {
    // 清理場上目標
    arena.innerHTML = "";
    clearTimers();
    if (state.stageIndex >= STAGES.length) {
      endGame();
      return;
    }
    const cfg = STAGES[state.stageIndex];
    // 更新 HUD
    stageDisplay.textContent = state.stageIndex + 1;
    livesDisplay.textContent = state.lives;
    multiplierDisplay.textContent = `x${state.scoreMultiplier.toFixed(1)}`;
    // 初始時間
    let timeLeft = cfg.duration + state.extraTime;
    timeDisplay.textContent = timeLeft;

    // 設定計時器
    stageTimer = setTimeout(() => {
      // 階段結束
      endStage();
    }, timeLeft * 1000);
    countdownTimer = setInterval(() => {
      timeLeft -= 1;
      if (timeLeft < 0) return;
      timeDisplay.textContent = timeLeft;
    }, 1000);

    // 設定目標生成
    spawnTargets(cfg);
  }

  /**
   * 隨機生成目標的循環
   */
  function spawnTargets(cfg) {
    const interval = Math.max(300, cfg.spawnInterval - state.lifetimeBonus);
    spawnTimer = setInterval(() => {
      // 根據配置與狀態計算當前各種目標的機率
      let goldChance = cfg.goldChance + state.goldChanceBonus;
      let trapChance = cfg.trapChance;
      const r = Math.random();
      let type = "good";
      if (r < trapChance) type = "bomb";
      else if (r < trapChance + goldChance) type = "gold";
      // 生成目標
      createTarget(type, cfg);
    }, interval);
  }

  /**
   * 建立並放置單個目標
   */
  function createTarget(type, cfg) {
    const target = document.createElement("div");
    target.classList.add("target", type);
    // 根據類型設置大小與分數
    let size = cfg.size * (1 + state.sizeBonus);
    let scoreValue = 10; // 基礎分數
    let lifetime = 1800 + state.lifetimeBonus; // ms
    if (type === "gold") {
      size *= 0.9;
      scoreValue = 30 + state.goldScoreBonus;
      lifetime += 300;
    }
    if (type === "bomb") {
      size *= 1.1;
    }
    target.style.width = `${size}px`;
    target.style.height = `${size}px`;
    // 隨機位置
    const arenaRect = arena.getBoundingClientRect();
    const x = Math.random() * (arena.clientWidth - size);
    const y = Math.random() * (arena.clientHeight - size);
    target.style.left = `${x}px`;
    target.style.top = `${y}px`;

    // 點擊處理
    target.addEventListener("click", (e) => {
      e.stopPropagation();
      // 移除目標
      if (target.parentElement) target.parentElement.removeChild(target);
      if (type === "bomb") {
        // 炸彈：扣生命
        const penalty = 1 - state.trapPenaltyReduction;
        state.lives -= Math.max(1, Math.ceil(penalty));
        if (state.lives <= 0) {
          state.lives = 0;
          updateHUD();
          endGame();
          return;
        }
        updateHUD();
        return;
      }
      // 得分
      const bonusFactor = state.scoreBonus;
      const mult = state.scoreMultiplier;
      const gained = Math.round(scoreValue * mult * (1 + bonusFactor));
      state.score += gained;
      updateHUD();
    });

    // 超時自動移除
    const timeoutId = setTimeout(() => {
      if (target.parentElement) target.parentElement.removeChild(target);
    }, lifetime);

    arena.appendChild(target);
  }

  /**
   * 更新 HUD (得分與生命)
   */
  function updateHUD() {
    scoreDisplay.textContent = state.score;
    livesDisplay.textContent = state.lives;
    multiplierDisplay.textContent = `x${state.scoreMultiplier.toFixed(1)}`;
  }

  /**
   * 階段結束時停止產生目標並出現升級選擇
   */
  function endStage() {
    clearTimers();
    // 清除場上目標
    arena.innerHTML = "";
    // 若生命已歸零則直接結算
    if (state.lives <= 0) {
      endGame();
      return;
    }
    // 顯示升級畫面
    screens.game.classList.remove("active");
    screens.upgrade.classList.add("active");
    renderUpgradeChoices();
  }

  /**
   * 渲染三個隨機升級供玩家選擇
   */
  function renderUpgradeChoices() {
    upgradeChoices.innerHTML = "";
    // 從池中隨機抽出 3 張不重複
    const pool = [...UPGRADE_POOL];
    const chosen = [];
    for (let i = 0; i < 3 && pool.length > 0; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      chosen.push(pool.splice(idx, 1)[0]);
    }
    chosen.forEach((card) => {
      const div = document.createElement("div");
      div.classList.add("upgrade-card");
      div.innerHTML = `<h3>${card.name}</h3><p>${card.desc}</p>`;
      div.addEventListener("click", () => {
        // 套用升級
        card.apply(state);
        // 隱藏升級畫面，繼續下一階段
        screens.upgrade.classList.remove("active");
        state.stageIndex += 1;
        nextStage();
      });
      upgradeChoices.appendChild(div);
    });
  }

  /**
   * 遊戲結束並顯示結果
   */
  function endGame() {
    clearTimers();
    arena.innerHTML = "";
    screens.game.classList.remove("active");
    screens.upgrade.classList.remove("active");
    screens.result.classList.add("active");
    // 結算文字
    let remark;
    if (state.lives <= 0) {
      remark = "你失去了所有生命";
    } else {
      remark = "你完成了所有階段";
    }
    // 計算總金幣（以 10 分換 1 金幣）
    const coins = Math.floor(state.score / 10);
    resultText.innerHTML = `分數：${state.score}，金幣：${coins}，${remark}。`;
    // 儲存上一場摘要到 localStorage
    const summary = {
      score: state.score,
      coins: coins,
      stages: state.stageIndex,
      lives: state.lives,
    };
    localStorage.setItem("pc_rift_last_summary", JSON.stringify(summary));
    // 更新 menu 畫面的上局摘要
    showLastSummary();
  }

  /**
   * 顯示上一局遊戲摘要
   */
  function showLastSummary() {
    const data = localStorage.getItem("pc_rift_last_summary");
    if (!data) return;
    try {
      const summary = JSON.parse(data);
      lastSummary.classList.remove("hidden");
      lastSummary.innerHTML = `上次分數：<strong>${summary.score}</strong>，獲得金幣 <strong>${summary.coins}</strong>；完成階段 <strong>${summary.stages}</strong> / ${STAGES.length}，剩餘生命 <strong>${summary.lives}</strong>`;
    } catch (err) {
      // 忽略解析錯誤
    }
  }

  /**
   * 清除計時器
   */
  function clearTimers() {
    if (spawnTimer) clearInterval(spawnTimer);
    if (stageTimer) clearTimeout(stageTimer);
    if (countdownTimer) clearInterval(countdownTimer);
    spawnTimer = null;
    stageTimer = null;
    countdownTimer = null;
  }

  /**
   * 隱藏所有畫面
   */
  function hideAllScreens() {
    Object.values(screens).forEach((el) => el.classList.remove("active"));
  }

  // 事件綁定
  startBtn.addEventListener("click", () => {
    startGame();
  });
  restartBtn.addEventListener("click", () => {
    startGame();
  });
  backBtn.addEventListener("click", () => {
    screens.result.classList.remove("active");
    screens.menu.classList.add("active");
  });

  // 起始時顯示上一局摘要
  showLastSummary();
})();
