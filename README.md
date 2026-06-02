# Reaction Arena / Precision Click

姓名：吳昇融  
學號：U114B207  
專案版本網址：https://wysandriel.github.io/Precision-Click/

## 本次完整升級重點

- 保留上一個 optimized 版本的主要視覺風格，不使用極簡重設計版。
- 修正整體頁面高度，`html`、`body` 使用固定全螢幕與 `overflow: hidden`，避免右側滑動條出現。
- 將遊戲音效預設音量提高，並新增設定頁音量滑桿，可自行調整音量大小。
- 新增難度選擇：Easy、Normal、Hard、Expert。
- 新增模式與難度分開保存的最高分紀錄。
- 新增遊玩紀錄：總場次、歷史最高分、最長連擊、平均準確率。
- 新增 Fever Mode：Combo 能量滿 20 連擊後啟動短時間加成。
- 強化遊戲結束畫面：顯示 Rank、命中、失誤、最高連擊、平均反應、Fever 次數、模式最高與歷史最高。
- 新增暫停功能：可繼續、重新開始、回主選單。
- 新增全螢幕功能。
- 新增設定頁：音效、震動、動畫強度、音量、清除紀錄。
- 新增連續失誤懲罰，避免亂點。
- 強化手機操作：使用 pointer events、touch-action、震動回饋與自適應 HUD。
- 保留 requestAnimationFrame 計時與 Object Pool 粒子效果，維持效能穩定。

## 檔案結構

```txt
Precision-Click/
├── index.html
├── style.css
├── script.js
└── README.md
```

## 部署方式

將以上檔案上傳至 GitHub Repository 根目錄，開啟 GitHub Pages 即可執行。
