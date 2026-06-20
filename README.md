# Bill Recognition Tester

A small internal web app for testing how accurately vision models extract fields from U.S. currency bill images.

The MVP is intentionally simple: two testers, one shared password, one active model, SQLite, local file storage, and a Railway deploy using a persistent volume.

## What it does

1. Tester logs in with a shared password.
2. Tester uploads one front-side image of a U.S. bill.
3. The app stores the original image and creates a normalized copy.
4. The normalized image is sent to Gemini.
5. Gemini returns structured JSON.
6. The result page shows the image, parsed fields, confidence values, and raw model response.
7. Tester marks the recognition as accurate or inaccurate.
8. The app tracks success rate by model and by model + prompt version.

## MVP stack

- Next.js
- TypeScript
- SQLite via Node's built-in `node:sqlite`
- Local filesystem image storage
- `sharp` for image normalization
- Gemini API through a provider abstraction
- Shared-password login with HTTP-only signed cookie
- Railway Hobby deployment with persistent volume

## Current model setup

Active model:

- `gemini-2.5-flash`

Visible but disabled future options:

- `gemini-2.5-pro`
- `gemini-3.5-flash`

Not included in MVP:

- Gemini Flash Lite
- preview Pro models
- OpenAI provider

Every recognition stores:

- provider
- exact model name
- prompt version
- prompt text
- schema version

## Recognition fields

Core MVP success fields:

- denomination
- serial number
- series/year

Structured output includes:

- `status`
- `is_us_currency`
- `side`
- `denomination`
- `serial_number`
- `left_serial_number`
- `right_serial_number`
- `serial_numbers_match`
- `series_year`
- `series_label`
- `star_note`
- `federal_reserve_district`
- `note_type`
- `confidence_by_field`
- `uncertain_fields`
- `notes`

The prompt instructs the model to use `null` when fields are not visible/readable and not to guess.

## Recognition statuses

The model returns one of:

- `recognized`
- `not_us_currency`
- `multiple_bills`
- `unreadable`
- `unsupported_side`

Only `recognized` results can be validated. Non-`recognized` results are stored for review/debugging but excluded from success-rate metrics.

## Success-rate rules

Success rate is calculated only from reviewed records where `status = recognized`.

Excluded from denominator:

- unreviewed recognitions
- `not_us_currency`
- `multiple_bills`
- `unreadable`
- `unsupported_side`

Validation is binary:

- `accurate`: everything looks good
- `inaccurate`: some errors

For MVP, “accurate” means the reviewer believes the core fields are correct:

- denomination
- serial number
- series/year

Secondary fields are displayed and stored, but they do not determine MVP success.

## Image handling

Accepted:

- JPEG
- PNG
- WebP

Rejected initially:

- HEIC/HEIF
- PDF
- TIFF
- animated GIF

Limits:

- max upload size: 10 MB
- one bill per image
- front side only for MVP

Storage:

- original upload is stored unchanged
- normalized copy is generated and used for model input/display

Normalization:

- auto-orient
- resize longest side to max 2500 px
- preserve aspect ratio
- do not upscale
- output JPEG quality 92
- normalization version: `normalize-v1-max2500-jpeg92`

## Pages

- `/login`: shared-password login
- `/`: upload/start page
- `/results/:id`: bookmarkable result page after login
- `/uploads/...`: protected image-serving route

## Local setup

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

Local test checklist:

- Log in with `APP_PASSWORD`.
- Upload JPG, PNG, or WebP under 10 MB.
- Confirm the result page shows parsed fields.
- Expand raw response.
- Validate a `recognized` result.
- Return to upload page and confirm stats update.

## Build check

```bash
npm run build
```

Note: Node 24 emits an experimental warning for `node:sqlite`. The warning is non-fatal.

## Railway deployment

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

## Persistence and backups

SQLite and uploads live under `DATA_DIR`.

For Railway, `DATA_DIR` must point to the persistent volume mount. Back up that directory if results matter.

This app is intentionally single-instance while using SQLite + local image storage. Do not scale to multiple replicas until storage/database are moved to shared services.

## Phase 2 / deferred

- Admin/review page.
- History/list page.
- Prompt editing/versioning UI.
- Active `gemini-2.5-pro`.
- Active `gemini-3.5-flash`.
- OpenAI provider/model.
- Side-by-side model comparison.
- Run one image through multiple configured models.
- HEIC/HEIF support.
- Field-level validation.
- Corrected field values.
- Per-field accuracy metrics.
- Editing/changing validation decisions.
- Object storage / cloud blob storage.
- Postgres migration.
- Scaling/multi-instance support.
- User accounts/tester identity.
- Async jobs/status page.
- Multi-bill support.
- CSV export.
- Charts/advanced analytics.
- Better cost tracking.

