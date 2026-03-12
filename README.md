# 兩姐妹的領養故事

靜態領養 landing page，領養申請改為站內表單並寫入 Cloudflare D1（`catsd1_db`）。

## 版本

- 基線版本：**v1.0.0**（改版前標記）
- 目前版本：**v1.2.0**（GitHub Actions 自動部署 + D1）

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

### 4. 自動部署至 Cloudflare（GitHub Actions）

本專案採用 **GitHub Actions** 部署，Cloudflare 專案請使用 **直接上傳（Direct Upload）**，勿再連結 Git，以避免 wrangler.jsonc 與 CF 建置衝突，並讓 D1 migration 與部署在同一條流水線完成。

push 到 `main` 分支時，由 **GitHub Actions** 自動執行 D1 migration（可選）並部署至 Cloudflare Pages（專案名稱 `cats`）。

- 工作流程：[`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml)
- 需在 GitHub repo **Settings → Secrets and variables → Actions** 設定：
  - `CLOUDFLARE_API_TOKEN`（權限：Account > Cloudflare Pages > Edit、D1 > Edit、Workers Scripts > Edit）
  - `CLOUDFLARE_ACCOUNT_ID`
- Cloudflare Dashboard 專案 **Settings → Bindings** 需新增 `DB` 對應至 `catsd1_db`；Production 與 Preview 都要設。
- 首次部署前請確認已執行上述 D1 migration（或讓 workflow 的 D1 migration 步驟執行一次）。

**首次部署檢查**：請確認 GitHub Secrets `CLOUDFLARE_API_TOKEN` 與 `CLOUDFLARE_ACCOUNT_ID` 已設定，否則 workflow 會失敗。

**若出現 "Project not found [8000007]"**：請先在 Cloudflare Dashboard 建立 Pages 專案。  
**Workers & Pages** → **Create application** → **Pages** → **直接上傳（Direct Upload）**，專案名稱填 **`cats`**，建立後無需連接 Git（由 GitHub Actions 部署）。再於該專案 **Settings → Bindings** 新增 D1 綁定 `DB` → `catsd1_db`。

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
