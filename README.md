# 兩姐妹的領養故事

靜態領養 landing page，領養申請改為站內表單並寫入 Cloudflare D1（`catsd1_db`）。

## 版本

- 基線版本：**v1.0.0**（改版前標記）
- 目前版本：**v1.1.0**（站內表單 + D1 整合與優化）

## 本地開發與部署

### 前置需求

- Node.js 18+
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/)（`npm i -g wrangler` 或 `npx wrangler`）
- Cloudflare 帳號（用於 D1 與 Pages）

### 1. 建立 D1 資料庫（若尚未建立）

```bash
npx wrangler d1 create catsd1_db
```

輸出會包含 `database_id`（UUID）。請將 [wrangler.jsonc](wrangler.jsonc) 中的 `REPLACE_WITH_YOUR_D1_DATABASE_ID` 替換為該 UUID。

### 2. 執行 D1 migration

專案使用 `d1 execute --file`（Pages 專案勿用 `d1 migrations apply`）：

```bash
# 遠端
npx wrangler d1 execute catsd1_db --remote --file=migrations/001_create_adoptions.sql

# 本地（可選）
npx wrangler d1 execute catsd1_db --local --file=migrations/001_create_adoptions.sql
```

### 3. 本地預覽（Pages + Functions）

靜態檔案在專案根目錄，無需 build：

```bash
npx wrangler pages dev . --d1=DB=catsd1_db
```

或先指定 `database_id`（在 wrangler.jsonc 已填寫時）：

```bash
npx wrangler pages dev .
```

### 4. 部署至 Cloudflare Pages

- **手動上傳**：在 [Cloudflare Dashboard → Pages](https://dash.cloudflare.com/) 建立 Pages 專案，上傳本專案根目錄（含 `index.html`、`functions/`、圖片與影片）。
- **Git 整合（Dashboard 連線 GitHub）**  
  本專案是 **Pages**（靜態站 + `functions/` + D1），**不要**在 Cloudflare 的「Deploy 指令」使用 `npx wrangler deploy`（那是 Workers 用，會出現 Missing entry-point）。  
  請在 Pages 專案設定中：
  - **Build 指令**：留空或 `echo built`（本專案無 build 步驟）
  - **Build 輸出目錄**：`.`（根目錄即為靜態檔案）
  - **Deploy 指令**：改為 **`echo deployed`**（由 Pages 自己處理部署，勿用 `npx wrangler deploy`）  
  D1 綁定需在 **Pages 專案 → Settings → Bindings** 新增 `DB` 對應至 `catsd1_db`；Production 與 Preview 都要設。
- **GitHub Actions 部署**  
  若改用 GitHub Actions 部署，可依 [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml) 在 push 到 `main` 時執行 `wrangler pages deploy`。需在 GitHub 倉庫 **Settings → Secrets and variables → Actions** 新增：
  - `CLOUDFLARE_API_TOKEN`：Cloudflare API Token（權限需含 Account → Cloudflare Pages: Edit、D1: Edit）
  - `CLOUDFLARE_ACCOUNT_ID`：帳號 ID（Dashboard 網址或右側可看到）  
  首次使用前請在 Cloudflare 建立同名 Pages 專案 `cats-adoption`，或把 workflow 裡的 `--project-name=cats-adoption` 改成你的專案名稱。
- 部署前請確認 Production/Preview 環境皆已設定 D1 綁定，並已執行上述 migration。

## 專案結構

- `index.html`：單頁內容與領養 modal、站內表單、前端驗證與送出邏輯
- `functions/api/adoptions.ts`：Pages Function，POST 表單寫入 D1
- `functions/types.ts`：Env 型別（含 `DB`）
- `migrations/001_create_adoptions.sql`：`adoption_inquiries` 表結構
- `wrangler.jsonc`：Pages 專案與 D1 綁定（需填入實際 `database_id`）

## API

- `POST /api/adoptions`  
  Body（JSON）：`{ "name", "contact", "message", "source_version" }`  
  成功：`200 { "ok": true, "success": true }`  
  失敗：`4xx/5xx { "ok": false, "error": "..." }`

## 授權與版權

© 2026 兩姐妹的領養計畫. 用愛終結流浪。
