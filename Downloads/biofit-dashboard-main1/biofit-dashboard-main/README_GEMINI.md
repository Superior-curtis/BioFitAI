Gemini 前端測試說明
=====================

此範例在前端直接呼叫 Gemini API（僅供測試）。請注意：把 API 金鑰放在前端會曝光金鑰，請勿在正式環境使用。

設定方式
-------

1. 在專案根目錄建立 `.env.local`（Vite）並加入：

```
VITE_GEMINI_API_KEY=你的_api_key_here
VITE_GEMINI_URL=https://your.gemini.endpoint/...
# 可選："bearer" or "x-api-key"
VITE_GEMINI_AUTH_TYPE=bearer
```

2. 啟動開發伺服器：

```powershell
npm install
npm run dev
```

使用方式
--------

- 開啟應用並到「登入」頁面（`/auth`），頁面底部會有「Gemini 測試工具」。
- 在輸入欄填入 prompt，按「傳送」即可向 `VITE_GEMINI_URL` 發出請求，結果會顯示在頁面上。

注意事項與常見問題
-------------------
- CORS：如果 Gemini endpoint 未開放給你的前端來源，瀏覽器會被阻擋。若碰到 CORS 問題，需改成使用後端代理（需要有能運行後端請求的環境）。
- 金鑰安全：若需要長期或正式使用，請務必把金鑰放在後端並由後端代理呼叫，前端只呼叫你自己的安全 API。

若你希望我改成後端代理（例如使用 Node/Express 或 FastAPI），可以告訴我要放在哪個資料夾，我會幫你建立範例。

部署到 Firebase Hosting
-----------------------

下列指令說明如何把此前端應用部署到 Firebase Hosting（僅靜態前端）：

1. 安裝 Firebase CLI（若尚未安裝）：

```powershell
npm install -g firebase-tools
```

2. 登入並初始化（在專案根目錄執行）:

```powershell
cd 'c:\Users\huach\Downloads\biofit-dashboard-main1\biofit-dashboard-main'
firebase login
firebase init hosting
# 選擇現有專案或建立新專案，public directory 設為 `dist`（Vite build 輸出）
```

3. 建置並部署：

```powershell
npm run build
firebase deploy --only hosting
```

注意：
- Firebase Hosting 只是把靜態檔案上傳到 CDN；若 Gemini endpoint 不允許瀏覽器直接呼叫（CORS），用戶端仍會遇到 CORS 錯誤。這種情況你需要建立後端代理（Cloud Functions / Cloud Run / 自有伺服器）來轉發請求。
- 若你想用 Firebase Cloud Functions 作為代理，免費額度 (Spark) 有 outbound 網路的限制，可能需要升級到 Blaze 才能使用付費外部 API。

