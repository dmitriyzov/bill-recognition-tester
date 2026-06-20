import Link from "next/link";
import { requireAuth } from "../../lib/auth";
import { getRecentRecognitions } from "../../lib/db";
import { publicImagePath } from "../../lib/storage";

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
          <a className="button subtle" href="/logout">Log out</a>
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
                  <th>Validation</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recognitions.map((recognition) => {
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
                      <td>{formatValidation(recognition.status, recognition.validation_decision)}</td>
                      <td><Link className="button secondary" href={`/results/${recognition.id}`}>View</Link></td>
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
  if (status !== "recognized") return <span className="pill muted-pill">Not validatable</span>;
  if (decision === "accurate") return <span className="pill success-pill">Accurate</span>;
  if (decision === "inaccurate") return <span className="pill danger-pill">Inaccurate</span>;
  return <span className="pill muted-pill">Unreviewed</span>;
}
