# Precision Click - Minimal Focus Redesign

學生：吳昇融  
學號：U114B207  
版本網址：https://wysandriel.github.io/Precision-Click/

## 本次重新設計方向

本版本保留原本 Precision-Click 的核心玩法，重新設計為「簡約、好看、實用」的 Minimal Focus 風格。

## 優化重點

1. 介面重新整理
   - 將狀態資訊集中在左側資訊欄。
   - 遊戲區域降低裝飾干擾，讓玩家更容易專注目標。

2. 視覺風格重做
   - 使用深色背景、低飽和線條、白色主目標與簡潔卡片。
   - 減少過多霓虹效果，改成更耐看的高質感風格。

3. 實用性改善
   - 分數、最高分、時間、生命、連擊、倍率與準確率更清楚。
   - 規則說明改成更短、更好讀的段落。

4. 手機版改善
   - 加入更好的 responsive 排版。
   - 按鈕與卡片在小螢幕更容易操作。

5. 效能與維護
   - 保留 requestAnimationFrame 計時邏輯。
   - 保留 localStorage 最高分保存。
   - 保留粒子與浮動文字物件池，降低 DOM 建立與移除壓力。

## 檔案結構

```txt
Precision-Click-minimal-redesign/
├── index.html
├── style.css
├── script.js
└── README.md
```

## 部署方式

將本資料夾內所有檔案上傳到 GitHub Repository 根目錄，並使用 GitHub Pages 部署即可。
