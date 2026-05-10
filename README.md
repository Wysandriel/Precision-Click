# Precision Click｜精準點擊

一款使用 HTML、CSS、JavaScript 製作的反應力網頁小遊戲。  
這個版本加入了排行榜、細分評級、模式篩選、特殊目標、陷阱、連擊倍率、音效、成就提示與完整結算畫面。

## 遊戲簡介

Precision Click 是一款測試玩家反應速度、專注力與點擊準確度的小遊戲。

玩家需要在限定時間內點擊畫面中隨機出現的目標。白色目標可以獲得一般分數，金色目標可以獲得高分與時間獎勵，紅色炸彈、紫色假目標、藍色冰凍陷阱則必須避開。玩家連續命中可以提升連擊倍率，失誤會扣分、扣生命並中斷連擊。

## 新增功能

- 本機排行榜 Top 10
- 可輸入玩家名稱
- 排行榜可依模式篩選
- 結算畫面顯示 Top 5
- 細分評級：
  - SSS
  - SS
  - S
  - A+
  - A
  - A-
  - B+
  - B
  - B-
  - C+
  - C
  - D
  - E
- 評級會參考：
  - 分數
  - 準確率
  - 平均反應時間
  - 最高連擊
  - 失誤次數

## 遊戲特色

- 三種遊戲模式：
  - Classic：標準 30 秒挑戰
  - Rush：節奏更快、分數更高
  - Survival：時間更長、考驗穩定度
- 白色一般目標
- 金色獎勵目標
- 紅色炸彈陷阱
- 紫色假目標陷阱
- 藍色冰凍陷阱
- 連擊倍率
- 生命系統
- 平均反應時間統計
- 最高分紀錄
- 最高連擊紀錄
- 成就提示
- 命中粒子特效
- 音效開關
- 多種事件音效：開始、命中、金色獎勵、連擊、陷阱、冰凍、遊戲結束
- 暫停功能
- 支援手機與電腦瀏覽器
- 可直接部署到 GitHub Pages

## 關於排行榜

目前排行榜使用瀏覽器的 `localStorage` 儲存，因此屬於「本機排行榜」。

意思是：

- 同一台電腦、同一個瀏覽器會保留紀錄
- 換裝置或換瀏覽器不會同步
- 適合 GitHub Pages 靜態網站使用
- 不需要後端伺服器

若要做成所有玩家共用的線上排行榜，需要另外接 Firebase、Supabase 或自己的後端資料庫。

## 專案結構

```text
precision-click-leaderboard/
├── index.html
├── style.css
├── script.js
├── README.md
└── .nojekyll
```

## 如何遊玩

直接用瀏覽器打開 `index.html` 即可開始遊戲。

## 操作方式

- 滑鼠或手指點擊目標
- 空白鍵：暫停 / 繼續
- 點擊「音效」按鈕可以開關音效

## 上傳到 GitHub Pages

1. 到 GitHub 建立一個新的 repository。
2. 將本專案所有檔案上傳到 repository 的根目錄。
3. 確認 `index.html` 在根目錄。
4. 進入 repository 的 Settings。
5. 找到 Pages。
6. Source 選擇 Deploy from a branch。
7. Branch 選擇 `main`，資料夾選擇 `/root`。
8. 儲存後等待 GitHub Pages 部署完成。

## 技術

- HTML
- CSS
- JavaScript
- LocalStorage
- Web Audio API
- GitHub Pages

## 專案描述

A reaction-based web game with local leaderboard, detailed ranking system, combo control, and multiple game modes.


## 新增陷阱與音效

### 陷阱類型

- 紅色炸彈：點到會大幅扣分、扣生命，並中斷連擊。
- 紫色假目標：點到會扣分，清空連擊，但不扣生命。
- 藍色冰凍陷阱：點到會扣分、扣生命、扣時間，並讓操作暫時凍結。

### 音效類型

- 開始遊戲音效
- 一般命中音效
- 金色獎勵音效
- 10 連擊音效
- 一般失誤音效
- 炸彈陷阱音效
- 假目標音效
- 冰凍陷阱音效
- 遊戲結束音效
