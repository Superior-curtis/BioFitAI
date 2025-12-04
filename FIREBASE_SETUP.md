# Firebase 設置指南

## 步驟 1: 創建 Firebase 項目

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 點擊「新增專案」
3. 輸入專案名稱（例如：biofit-ai）
4. （可選）啟用 Google Analytics
5. 點擊「建立專案」

## 步驟 2: 註冊 Web 應用

1. 在專案概覽頁面，點擊 Web 圖示 `</>`
2. 輸入應用程式暱稱（例如：BioFit Web App）
3. （可選）勾選 Firebase Hosting
4. 點擊「註冊應用程式」
5. **複製配置資訊** - 您需要將這些值添加到 .env 檔案

## 步驟 3: 設置環境變數

在專案根目錄創建 `.env` 文件，並添加您的 Firebase 配置：

\`\`\`env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
\`\`\`

⚠️ **重要**: 不要將 `.env` 文件提交到 Git！確保它在 `.gitignore` 中。

## 步驟 4: 啟用 Authentication

### Email/Password 認證
1. 在 Firebase Console 左側選單，點擊「Authentication」
2. 點擊「開始使用」
3. 選擇「登入方式」標籤
4. 啟用「電子郵件/密碼」
5. 點擊「儲存」

### Google 登入（可選）
1. 在「登入方式」標籤中
2. 啟用「Google」
3. 選擇專案支援電子郵件
4. 點擊「儲存」

## 步驟 5: 設置 Firestore Database

1. 在 Firebase Console 左側選單，點擊「Firestore Database」
2. 點擊「建立資料庫」
3. 選擇位置（建議選擇離用戶最近的位置）
4. 選擇「以測試模式開始」（開發期間）
5. 點擊「啟用」

### 設置安全規則

在 Firestore 的「規則」標籤中，替換為以下規則：

\`\`\`javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 個人資料 - 只有擁有者可以讀寫
    match /profiles/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 餐點記錄 - 只有擁有者可以讀寫
    match /meals/{mealId} {
      allow read, delete: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
      allow update: if request.auth != null && 
        request.resource.data.userId == request.auth.uid &&
        resource.data.userId == request.auth.uid;
    }
    
    // 運動記錄 - 只有擁有者可以讀寫
    match /exercises/{exerciseId} {
      allow read, delete: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
      allow update: if request.auth != null && 
        request.resource.data.userId == request.auth.uid &&
        resource.data.userId == request.auth.uid;
    }
  }
}
\`\`\`

⚠️ **注意**: 發佈到生產環境前，請確保已設置適當的安全規則！

## 步驟 6: 本地開發

1. 安裝依賴：
\`\`\`bash
npm install
\`\`\`

2. 啟動開發服務器：
\`\`\`bash
npm run dev
\`\`\`

3. 打開瀏覽器訪問 `http://localhost:5173`

## 步驟 7: 部署到 Firebase Hosting

### 首次部署

1. 安裝 Firebase CLI（如果尚未安裝）：
\`\`\`bash
npm install -g firebase-tools
\`\`\`

2. 登入 Firebase：
\`\`\`bash
firebase login
\`\`\`

3. 初始化 Firebase（如果尚未初始化）：
\`\`\`bash
firebase init
\`\`\`
   - 選擇 Hosting
   - 選擇您的 Firebase 項目
   - Public directory: `dist`
   - Configure as SPA: `Yes`
   - Set up automatic builds: `No`

4. 更新 `.firebaserc` 文件中的項目 ID：
\`\`\`json
{
  "projects": {
    "default": "your-project-id"
  }
}
\`\`\`

### 構建並部署

\`\`\`bash
# 構建生產版本
npm run build

# 部署到 Firebase Hosting
firebase deploy
\`\`\`

部署成功後，您會收到一個 URL，例如：`https://your-project.web.app`

## 常見問題

### Q: 如何查看我的 Firebase 配置？
A: 在 Firebase Console > 項目設置 > 一般 > 您的應用程式 > SDK 設定和配置

### Q: 測試模式的 Firestore 安全嗎？
A: 不安全！測試模式允許所有人讀寫。請在 30 天後或上線前更改為生產規則。

### Q: 如何添加更多認證方式？
A: 在 Authentication > 登入方式中啟用其他提供商（Facebook、Twitter 等）

### Q: 如何備份 Firestore 數據？
A: 使用 Firebase CLI 或在 Cloud Console 中設置自動備份

### Q: 部署後環境變數不生效？
A: 確保在部署前已運行 `npm run build`，並且 .env 文件中的變數名稱以 `VITE_` 開頭

## 其他資源

- [Firebase 官方文檔](https://firebase.google.com/docs)
- [Firestore 數據建模](https://firebase.google.com/docs/firestore/data-model)
- [Firebase Authentication 指南](https://firebase.google.com/docs/auth)
- [Firebase Hosting 指南](https://firebase.google.com/docs/hosting)

## 需要幫助？

如果遇到問題：
1. 檢查瀏覽器控制台的錯誤訊息
2. 確認 Firebase 配置是否正確
3. 檢查 Firestore 安全規則
4. 查看 Firebase Console 的使用量和配額
