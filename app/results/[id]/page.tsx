import { notFound } from "next/navigation";
import React from "react";
import { requireAuth } from "../../../lib/auth";
import { getRecognition, getStats, getUsageStats, getValidation } from "../../../lib/db";
import { estimateCostUsd, formatUsd } from "../../../lib/cost";
import { PROMPT_VERSION } from "../../../lib/config";
import { MODEL_OPTIONS } from "../../../lib/models";
import { publicImagePath } from "../../../lib/storage";
import type { BillRecognitionResult } from "../../../lib/types";
import { StatsBlock } from "../../../components/StatsBlock";
import { ValidationForm } from "../../../components/ValidationForm";

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const { id } = await params;
  const recognition = getRecognition(Number(id));
  if (!recognition) notFound();
  const validation = getValidation(recognition.id);
  const parsed = JSON.parse(recognition.parsed_result_json) as BillRecognitionResult;
  const modelOption = MODEL_OPTIONS.find((model) => model.model === recognition.model_name);
  const modelLabel = modelOption?.label || recognition.model_name;
  const modelStats = getStats(recognition.model_name);
  const promptStats = getStats(recognition.model_name, recognition.prompt_version);
  const usageStats = getUsageStats(recognition.model_name);
  const requestCost = estimateCostUsd(recognition.model_name, recognition.input_tokens, recognition.output_tokens);

  return (
    <main className="container">
      <div className="topbar">
        <div>
          <h1>Recognition result #{recognition.id}</h1>
          <p className="muted">{recognition.model_name} · {recognition.prompt_version}</p>
        </div>
        <div className="actions">
          <a className="button secondary" href="/results">Results</a>
          <a className="button secondary" href="/">New upload</a>
          <a href="/logout">Log out</a>
        </div>
      </div>

      <div className="grid">
        <section>
          <img className="bill-image" src={publicImagePath(recognition.normalized_image_path)} alt="Uploaded bill" />
        </section>

        <aside className="card">
          <p><span className="pill">{parsed.status}</span></p>
          <Fields parsed={parsed} />
          <UsageDetails
            inputTokens={recognition.input_tokens}
            outputTokens={recognition.output_tokens}
            totalTokens={recognition.total_tokens}
            latencyMs={recognition.latency_ms}
            estimatedCostUsd={requestCost}
          />
          <ModelConfidence parsed={parsed} />
          <p className="muted">Confidence is model-reported and not calibrated. Human validation determines success rate.</p>
        </aside>
      </div>

      <section className="card" style={{ marginTop: 20 }}>
        <h2>Validation</h2>
        {recognition.status !== "recognized" && (
          <p className="muted">This result is not validatable because status is <strong>{recognition.status}</strong>.</p>
        )}
        {recognition.status === "recognized" && validation && (
          <p>
            Recorded decision:{" "}
            <strong className={validation.decision === "accurate" ? "success" : ""}>
              {validation.decision === "accurate" ? "Everything looks good" : "Some errors"}
            </strong>
            {validation.notes ? <><br /><span className="muted">Notes: {validation.notes}</span></> : null}
          </p>
        )}
        {recognition.status === "recognized" && !validation && <ValidationForm recognitionId={recognition.id} />}
      </section>

      <section style={{ marginTop: 20 }}>
        <details>
          <summary>Raw model response</summary>
          <pre>{JSON.stringify(JSON.parse(recognition.raw_response_json), null, 2)}</pre>
        </details>
      </section>

      <section className="card" style={{ marginTop: 20 }}>
        <h2>Current stats</h2>
        <StatsBlock
          modelLabel={modelLabel}
          modelStats={modelStats}
          promptVersion={PROMPT_VERSION}
          promptStats={promptStats}
          usageStats={usageStats}
          compact
        />
      </section>
    </main>
  );
}

function Fields({ parsed }: { parsed: BillRecognitionResult }) {
  const confidence = parsed.confidence_by_field || {};
  const rows: [string, unknown, string?][] = [
    ["Denomination", parsed.denomination === null ? null : `$${parsed.denomination}`, confidence.denomination?.toString()],
    ["Serial number", parsed.serial_number, confidence.serial_number?.toString()],
    ["Left serial", parsed.left_serial_number, confidence.left_serial_number?.toString()],
    ["Right serial", parsed.right_serial_number, confidence.right_serial_number?.toString()],
    ["Serials match", formatBool(parsed.serial_numbers_match), confidence.serial_numbers_match?.toString()],
    ["Series year", parsed.series_year, confidence.series_year?.toString()],
    ["Series label", parsed.series_label, confidence.series_label?.toString()],
    ["Star note", formatBool(parsed.star_note), confidence.star_note?.toString()],
    ["Side", parsed.side, confidence.side?.toString()],
    ["Federal Reserve district", parsed.federal_reserve_district, confidence.federal_reserve_district?.toString()],
    ["Note type", parsed.note_type, confidence.note_type?.toString()],
    ["Uncertain fields", parsed.uncertain_fields.length ? parsed.uncertain_fields.join(", ") : "None"],
    ["Model notes", parsed.notes]
  ];
  return (
    <dl className="kv">
      {rows.map(([label, value, conf]) => (
        <React.Fragment key={label}>
          <dt>{label}</dt>
          <dd>
            {formatValue(value)}
            {conf ? <span className="muted"> · confidence {conf}</span> : null}
          </dd>
        </React.Fragment>
      ))}
    </dl>
  );
}

function UsageDetails({
  inputTokens,
  outputTokens,
  totalTokens,
  latencyMs,
  estimatedCostUsd
}: {
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  latencyMs: number | null;
  estimatedCostUsd: number | null;
}) {
  return (
    <section style={{ marginTop: 20 }}>
      <h3>Request usage</h3>
      <dl className="kv">
        <dt>Estimated cost</dt><dd>{formatUsd(estimatedCostUsd)}</dd>
        <dt>Input tokens</dt><dd>{formatNumber(inputTokens)}</dd>
        <dt>Output tokens</dt><dd>{formatNumber(outputTokens)}</dd>
        <dt>Total tokens</dt><dd>{formatNumber(totalTokens)}</dd>
        <dt>Latency</dt><dd>{latencyMs === null ? <span className="muted">Not available</span> : `${(latencyMs / 1000).toFixed(2)}s`}</dd>
      </dl>
      <p className="muted">Cost is estimated from stored token usage and configured model pricing. Actual billing may differ.</p>
    </section>
  );
}

function ModelConfidence({ parsed }: { parsed: BillRecognitionResult }) {
  const confidence = parsed.confidence_by_field || {};
  const rows: [string, number | null | undefined][] = [
    ["Denomination", confidence.denomination],
    ["Serial number", confidence.serial_number],
    ["Left serial", confidence.left_serial_number],
    ["Right serial", confidence.right_serial_number],
    ["Serials match", confidence.serial_numbers_match],
    ["Series year", confidence.series_year],
    ["Series label", confidence.series_label],
    ["Star note", confidence.star_note],
    ["Side", confidence.side],
    ["Federal Reserve district", confidence.federal_reserve_district],
    ["Note type", confidence.note_type]
  ];

  return (
    <section style={{ marginTop: 20 }}>
      <h3>Model confidence</h3>
      <dl className="kv">
        {rows.map(([label, value]) => (
          <React.Fragment key={label}>
            <dt>{label}</dt>
            <dd>{value === null || value === undefined ? <span className="muted">Not provided</span> : value.toFixed(2)}</dd>
          </React.Fragment>
        ))}
      </dl>
    </section>
  );
}

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") return <span className="muted">Not readable</span>;
  return String(value);
}

function formatBool(value: boolean | null) {
  if (value === null) return null;
  return value ? "Yes" : "No";
}

function formatNumber(value: number | null) {
  if (value === null) return <span className="muted">Not available</span>;
  return new Intl.NumberFormat("en-US").format(value);
}
