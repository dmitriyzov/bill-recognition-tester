# 💵 Bill Recognition Tester

Internal MVP for testing how accurately Gemini extracts fields from U.S. currency bill images.

The app is intentionally small and pragmatic: shared-password login, one active model, SQLite, local image storage, and Railway deployment with a persistent volume.

## ✨ What it does

1. Tester logs in with a shared password.
2. Tester uploads one front-side image of a U.S. bill.
3. The app stores the original image and creates a normalized copy.
4. The normalized image is sent to Gemini.
5. Gemini returns structured JSON.
6. The result page shows the bill image, parsed fields, confidence values, and raw model response.
7. Tester marks the recognition as accurate or inaccurate.
8. The app tracks success rate by model and by model + prompt version.

For the detailed product/technical spec, see [SPEC.md](./SPEC.md).

## 🧱 Stack

- Next.js
- TypeScript
- SQLite via Node's built-in `node:sqlite`
- Local filesystem image storage
- `sharp` for image normalization
- Gemini API through a provider abstraction
- Shared-password login with HTTP-only signed cookie
- Railway Hobby deployment with persistent volume

## 🚀 Local setup

Install dependencies:

```bash
npm install
```

Copy env file:

```bash
cp .env.example .env.local
```

Set required env vars in `.env.local`:

```bash
GEMINI_API_KEY=your_gemini_api_key
APP_PASSWORD=some-shared-password
SESSION_SECRET=use-a-long-random-string
DATA_DIR=./data
```

Run locally:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## ✅ Local test checklist

- Log in with `APP_PASSWORD`.
- Upload JPG, PNG, or WebP under 10 MB.
- Confirm the result page shows parsed fields.
- Expand raw response.
- Validate a `recognized` result.
- Return to upload page and confirm stats update.

## 🧪 Build check

```bash
npm run build
```

Note: Node 24 emits an experimental warning for `node:sqlite`. The warning is non-fatal.

## 🚂 Railway deployment

Recommended MVP target: Railway Hobby.

1. Push this repo to GitHub.
2. Create a Railway project from the GitHub repo.
3. Add a persistent volume.
4. Mount the volume at:

   ```text
   /data
   ```

5. Set Railway env vars:

   ```text
   GEMINI_API_KEY=...
   APP_PASSWORD=...
   SESSION_SECRET=...
   DATA_DIR=/data
   ```

6. Build/start commands:

   ```bash
   npm install
   npm run build
   npm run start
   ```

7. After deploy:

   - Open the Railway URL.
   - Log in.
   - Upload a test image.
   - Validate a result.
   - Confirm stats update.

## 💾 Persistence and backups

SQLite and uploads live under `DATA_DIR`.

For Railway, `DATA_DIR` must point to the persistent volume mount. Back up that directory if results matter.

This app is intentionally single-instance while using SQLite + local image storage. Do not scale to multiple replicas until storage/database are moved to shared services.

## 🔐 Required env vars

- `GEMINI_API_KEY`: Gemini Developer API key.
- `APP_PASSWORD`: shared password for testers.
- `SESSION_SECRET`: long random string used to sign auth cookies.
- `DATA_DIR`: persistent storage directory for SQLite DB and uploads.

