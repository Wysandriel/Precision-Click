# Precision Click / Reaction Arena

學生姓名：吳昇融  
學號：U114B207  
專案版本網址：https://wysandriel.github.io/Precision-Click/

## 專案介紹

Precision Click 是一款使用 HTML、CSS、JavaScript 製作的網頁反應點擊遊戲。玩家需要在時間內快速點擊正確目標、避開陷阱、維持 Combo，並挑戰最高分。

本版本針對第 15～16 週進行優化，重點放在遊戲機制、手機操作體驗、介面穩定度與重玩性。

## 本次主要修改內容

### 1. 手機版優化
- 修正手機模式中部分介面滑動不到的問題
- 保留外層遊戲畫面不亂滑
- 規則、設定、結算畫面改為卡片內部可滑動
- 加強手機瀏覽器高度判斷，減少網址列造成的畫面跳動
- 放大手機按鈕與點擊區域
- 調整手機版目標生成安全範圍，避免太靠近邊緣

### 2. 遊戲機制優化
- 新增本局挑戰任務
- 新增 XP 與等級系統
- 新增 Near Best 提示，接近最高分時提醒玩家
- 強化 Combo 獎勵，提高玩家維持連擊的動機
- 強化 Fever Mode 的提示與回饋

### 3. 介面穩定性改善
- 移除容易破版的本局摘要區塊
- 規則說明只保留在一個地方，避免重複與混亂
- 修正內部滾動與外部鎖定的衝突
- 保持 GitHub Pages 可直接部署的單層檔案結構

### 4. 遊戲結算改善
- 結算畫面顯示任務完成狀態
- 顯示 XP 獲得結果
- 提供下一局簡短建議
- 讓玩家更清楚自己本局表現與下一步目標

## 檔案結構

```text
Precision-Click/
├── index.html
├── style.css
├── script.js
└── README.md
```

## 使用方式

1. 將以上檔案上傳到 GitHub Repository 根目錄
2. 到 Repository 的 Settings
3. 找到 Pages
4. Source 選擇 main branch / root
5. 儲存後等待 GitHub Pages 部署完成

## 技術使用

- HTML5
- CSS3
- JavaScript
- localStorage
- requestAnimationFrame
- GitHub Pages
