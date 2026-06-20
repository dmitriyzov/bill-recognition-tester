# Bill Recognition Tester Spec

This document captures the MVP scope and Phase 2 backlog for the bill recognition testing app.

## Objective

Build a deployable internal web app for testing how well Gemini extracts U.S. currency bill details from uploaded images, with human validation and per-model/prompt success metrics.

## MVP scope

- Two expected testers.
- Fast deploy over scalable architecture.
- Single-server deployment.
- SQLite database.
- Local filesystem image storage.
- One active Gemini model.
- Provider interface ready for OpenAI or additional Gemini models later.
- Human-reviewed accuracy tracking.

## Auth

- `/login` page with one shared password.
- Password stored in `APP_PASSWORD`.
- Login sets an HTTP-only signed session cookie.
- `SESSION_SECRET` signs/verifies the session.
- No user accounts.
- Anonymous validation.
- Logout supported.

## Model selection

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

## Prompt display

Upload page includes collapsed read-only prompt details:

- provider
- model
- prompt version
- schema version
- full prompt text

Prompt editing/versioning UI is deferred.

## Upload and image handling

- One bill per uploaded image.
- Front side only for MVP.
- Max upload size: 10 MB.

Accepted:

- JPEG
- PNG
- WebP

Rejected initially:

- HEIC/HEIF
- PDF
- TIFF
- animated GIF

Storage:

- original upload is stored unchanged
- normalized copy is generated and stored
- normalized copy is used for model input and result-page display

Normalization:

- auto-orient
- resize longest side to max 2500 px
- preserve aspect ratio
- do not upscale
- output JPEG quality 92
- normalization version: `normalize-v1-max2500-jpeg92`

## Recognition flow

Synchronous request flow:

1. Upload image.
2. Store original.
3. Normalize image.
4. Call Gemini.
5. Store result.
6. Redirect to `/results/:id`.

No async jobs/queues for MVP. Upload button should disable/show loading while processing.

## Recognition statuses

Gemini should return one of:

- `recognized`
- `not_us_currency`
- `multiple_bills`
- `unreadable`
- `unsupported_side`

Validation buttons appear only for `recognized`.

Non-`recognized` results are stored but excluded from success metrics.

## Extracted fields

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

Fields should allow `null` when unreadable. Prompt must instruct the model not to guess.

## Result page

- URL: `/results/:id`
- Requires login.
- Bookmarkable/shareable after login.

Shows:

- normalized image
- parsed structured fields
- recognition status
- confidence per field
- note that confidence is model-reported and not calibrated
- collapsed raw model response
- compact success stats

If `status = recognized`, show validation controls.

If already validated, show the recorded decision.

Validation is locked after submission.

## Validation

Binary only:

- “Everything looks good”
- “Some errors”

Human reviewer decides.

For MVP, success means core fields are correct:

- denomination
- serial number
- series/year

Secondary fields do not determine MVP success.

If “Some errors,” show optional notes field.

No corrected field capture in MVP.

Validation is anonymous and optional.

## Success metrics

Calculate only from reviewed results where `status = recognized`.

Exclude:

- unreviewed recognitions
- non-`recognized` statuses

Display on upload and result pages:

- success rate for selected model across all prompt versions
- success rate for selected model + active prompt version
- reviewed count
- pending review count only if greater than zero

Example:

```text
Gemini 2.5 Flash success rate: 85% based on 20 reviewed recognitions
Prompt bill-extraction-v1: 90% based on 10 reviewed recognitions
Pending review: 2
```

## Database/storage

SQLite stores recognitions:

- id
- original image path
- normalized image path
- normalization version
- provider
- model name
- prompt version
- prompt text
- schema version
- status
- parsed result JSON
- raw response JSON/text
- latency ms
- token usage if easy
- created at

SQLite stores validations:

- id
- recognition id
- decision accurate/inaccurate
- optional notes
- created at

## Deployment

- Target: Railway Hobby.
- Expected hosting cost: roughly $5/month plus small Gemini API usage.
- Use persistent Railway volume for:
  - SQLite DB
  - original uploads
  - normalized uploads

Required env vars:

- `GEMINI_API_KEY`
- `APP_PASSWORD`
- `SESSION_SECRET`
- `DATA_DIR`

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
