# Vicky's AI Room Restyle

這是一個網頁應用程式，允許用戶拍攝或上傳房間照片，並利用 AI (OpenAI 或 Azure OpenAI) 根據預設風格或自訂描述來「重新設計」房間風格。

## 專案概覽

*   **目的**：提供快速且直觀的室內設計提案生成工具。
*   **主要技術**：
    *   **前端**：原生 HTML、CSS (使用 CSS 變數進行主題化) 和 JavaScript (Vanilla JS)。
    *   **字體**：Google Fonts (Noto Serif TC)。
    *   **AI 整合**：OpenAI DALL-E Image Editing API 或 Azure OpenAI 服務。
    *   **多媒體**：使用 `navigator.mediaDevices.getUserMedia` 存取相機。
*   **架構**：單頁應用程式 (SPA)，邏輯全部位於 `app.js` 中。

## 目錄結構

*   `index.html`：應用程式的主要入口，包含 UI 結構和 CSS 樣式。
*   `app.js`：核心邏輯，處理 DOM 操作、相機控制、文件上傳、API 請求及結果顯示。
*   `images/`：存放風格預覽圖、吉祥物 (vicky.png) 和範例原圖。
    *   各類風格圖 (例如：`工業 Loft.png`, `日式侘寂.png` 等)。
    *   `vicky.png`：應用的吉祥物。
    *   `範例原圖.png`：預設載入的房間範例照片。

## 建置與執行

*   此專案為純前端靜態頁面，不需建置流程。
*   **執行方式**：
    1.  直接在瀏覽器中開啟 `index.html`。
    2.  建議使用本地網頁伺服器（例如 VS Code 的 Live Server 擴充功能或 `python -m http.server`）以確保相機功能和 API 請求正常運作（避免 `file://` 協議的限制）。
*   **測試**：目前無自動化測試，主要透過手動操作 UI 驗證功能。

## 開發慣例

*   **無框架**：不使用 React, Vue 或其他前端框架。
*   **API 請求**：使用 `fetch` API 和 `FormData` 將圖片與 Prompt 送往 AI 模型。
*   **樣式**：使用 CSS Variables (`:root`) 管理顏色、陰影和圓角。
*   **語系**：UI介面使用繁體中文。
*   **事件處理**：所有邏輯在 `DOMContentLoaded` 事件觸發後初始化。
