import Link from "next/link";
import { requireAuth } from "../../lib/auth";
import { getRecentRecognitions } from "../../lib/db";
import { publicImagePath } from "../../lib/storage";
import type { BillRecognitionResult } from "../../lib/types";

export default async function ResultsPage() {
  await requireAuth();
  const recognitions = getRecentRecognitions(100);

  return (
    <main className="container">
      <div className="topbar">
        <div>
          <h1>Results</h1>
          <p className="muted">Latest {recognitions.length} recognition results.</p>
        </div>
        <div className="actions">
          <a className="button secondary" href="/">New upload</a>
          <a href="/logout">Log out</a>
        </div>
      </div>

      <section className="card">
        {recognitions.length === 0 ? (
          <p className="muted">No results yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Image</th>
                  <th>Created</th>
                  <th>Model</th>
                  <th>Status</th>
                  <th>Denomination</th>
                  <th>Serial</th>
                  <th>Series/year</th>
                  <th>Validation</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recognitions.map((recognition) => {
                  const parsed = JSON.parse(recognition.parsed_result_json) as BillRecognitionResult;
                  return (
                    <tr key={recognition.id}>
                      <td>#{recognition.id}</td>
                      <td>
                        <Link href={`/results/${recognition.id}`}>
                          <img
                            className="thumb"
                            src={publicImagePath(recognition.normalized_image_path)}
                            alt={`Recognition ${recognition.id}`}
                          />
                        </Link>
                      </td>
                      <td>{formatDate(recognition.created_at)}</td>
                      <td>
                        {recognition.model_name}
                        <br />
                        <span className="muted">{recognition.prompt_version}</span>
                      </td>
                      <td><span className="pill">{recognition.status}</span></td>
                      <td>{parsed.denomination === null ? <span className="muted">Not readable</span> : `$${parsed.denomination}`}</td>
                      <td>{parsed.serial_number || <span className="muted">Not readable</span>}</td>
                      <td>{parsed.series_year || parsed.series_label || <span className="muted">Not readable</span>}</td>
                      <td>{formatValidation(recognition.status, recognition.validation_decision)}</td>
                      <td><Link href={`/results/${recognition.id}`}>View</Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatValidation(status: string, decision: "accurate" | "inaccurate" | null) {
  if (status !== "recognized") return <span className="muted">Not validatable</span>;
  if (decision === "accurate") return <span className="success">Accurate</span>;
  if (decision === "inaccurate") return "Inaccurate";
  return <span className="muted">Unreviewed</span>;
}
