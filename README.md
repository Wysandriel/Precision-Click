# Precision Click｜Neon Arena Edition

這是重寫後的穩定版 Precision Click 小遊戲。  
不需要安裝套件，直接用瀏覽器打開 `index.html` 就能玩，也可以直接部署到 GitHub Pages。

## 這版修正與升級

- 重新整理 JavaScript 結構，降低無法執行的機率
- 更完整的高質感遊戲介面
- 主選單、遊戲 HUD、暫停畫面、結算畫面、排行榜畫面
- 三種模式：Classic、Rush、Survival
- 本機排行榜 Top 10
- 細分評級：SSS、SS、S、A+、A、A-、B+、B、B-、C+、C、D、E
- 陷阱系統
- 音效系統
- 粒子特效
- 連擊倍率
- 準確率統計
- 平均反應時間
- 手機與電腦都能玩

## 目標與陷阱

- 白色：一般目標
- 金色：獎勵目標，加分並增加 2 秒
- 紅色：炸彈陷阱，扣分、扣生命、斷連擊
- 紫色：假目標陷阱，扣分、斷連擊
- 藍色：冰凍陷阱，扣分、扣生命、扣時間，並短暫冰凍操作

## 音效

遊戲使用 Web Audio API 製作音效，不需要額外音檔。

包含：

- 開始音效
- 命中音效
- 金色獎勵音效
- 連擊音效
- 失誤音效
- 炸彈音效
- 假目標音效
- 冰凍音效
- 暫停 / 繼續音效
- 遊戲結束音效

## 排行榜說明

目前排行榜使用 `localStorage` 儲存在玩家自己的瀏覽器中。

意思是：

- 同一台電腦、同一個瀏覽器會保留紀錄
- 換電腦或換瀏覽器不會同步
- 適合 GitHub Pages 靜態網站
- 不需要伺服器

若要做成所有玩家共用的線上排行榜，需要另外接 Firebase、Supabase 或後端資料庫。

## 專案結構

```text
precision-click-pro/
├── index.html
├── style.css
├── script.js
├── README.md
└── .nojekyll
```

## 如何部署到 GitHub Pages

1. 到 GitHub 建立 repository。
2. 把本資料夾中的檔案上傳到 repository 根目錄。
3. 確認 `index.html` 在根目錄，不要放進第二層資料夾。
4. 到 repository 的 Settings。
5. 進入 Pages。
6. Source 選 `Deploy from a branch`。
7. Branch 選 `main`，資料夾選 `/root`。
8. 儲存並等待部署完成。

## 專案描述

A premium reaction-based browser game with traps, combo multiplier, detailed ranking, sound effects, and local leaderboard.
