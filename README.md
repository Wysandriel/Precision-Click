# Reaction Arena / Precision Click

姓名：吳昇融  
學號：U114B207  
專案版本網址：https://wysandriel.github.io/Precision-Click/

## 本次優化重點

- 使用 `requestAnimationFrame` 取代原本秒級 `setInterval` 計時，讓時間扣減更平滑、暫停/冰凍狀態更穩定。
- 加入粒子與浮動文字 Object Pool，減少遊戲中大量 `createElement/remove` 造成的效能壓力。
- 新增最高分 `localStorage` 保存，讓玩家重開頁面後仍可看到最佳紀錄。
- 強化手機操作與可及性：加入 `touch-action`、`focus-visible`、`prefers-reduced-motion`、HUD `aria-live`。
- 保留原本 Classic / Rush / Survival 模式、陷阱、連擊倍率與評級系統。

## 檔案結構

```txt
Precision-Click/
├── index.html
├── style.css
├── script.js
└── README.md
```
