import { requireAuth } from "../lib/auth";
import { APP_NAME, PROMPT_VERSION, SCHEMA_VERSION } from "../lib/config";
import { MODEL_OPTIONS } from "../lib/models";
import { PROMPT_METADATA } from "../lib/prompt";
import { getStats, getUsageStats } from "../lib/db";
import { UploadForm } from "../components/UploadForm";
import { StatsBlock } from "../components/StatsBlock";

export default async function HomePage() {
  await requireAuth();
  const activeModel = MODEL_OPTIONS.find((model) => model.enabled)!;
  const modelStats = getStats(activeModel.model);
  const promptStats = getStats(activeModel.model, PROMPT_VERSION);
  const usageStats = getUsageStats(activeModel.model);

  return (
    <main className="container">
      <div className="topbar">
        <div>
          <h1>{APP_NAME}</h1>
          <p className="muted">Upload a front-side image of one U.S. bill and validate the extracted fields.</p>
        </div>
        <a href="/logout">Log out</a>
      </div>

      <div className="grid">
        <section className="card">
          <h2>Start recognition</h2>
          <UploadForm />
        </section>

        <aside className="card">
          <h2>Current stats</h2>
          <StatsBlock
            modelLabel={activeModel.label}
            modelStats={modelStats}
            promptVersion={PROMPT_VERSION}
            promptStats={promptStats}
            usageStats={usageStats}
          />
        </aside>
      </div>

      <section style={{ marginTop: 20 }}>
        <details>
          <summary>Prompt used for this test</summary>
          <dl className="kv" style={{ marginTop: 12 }}>
            <dt>Provider</dt><dd>{activeModel.provider}</dd>
            <dt>Model</dt><dd>{activeModel.model}</dd>
            <dt>Prompt version</dt><dd>{PROMPT_METADATA.promptVersion}</dd>
            <dt>Schema version</dt><dd>{SCHEMA_VERSION}</dd>
          </dl>
          <pre>{PROMPT_METADATA.promptText}</pre>
        </details>
      </section>
    </main>
  );
}
