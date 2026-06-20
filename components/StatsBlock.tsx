import type { Stats } from "../lib/types";

export function StatsBlock({
  modelLabel,
  modelStats,
  promptVersion,
  promptStats,
  compact = false
}: {
  modelLabel: string;
  modelStats: Stats;
  promptVersion: string;
  promptStats: Stats;
  compact?: boolean;
}) {
  return (
    <div className="stats">
      <StatLine title={`${modelLabel} success rate`} stats={modelStats} compact={compact} />
      {!compact && <StatLine title={`Prompt ${promptVersion}`} stats={promptStats} compact={compact} />}
      {(modelStats.pending > 0 || promptStats.pending > 0) && (
        <div className="muted">Pending review: {promptStats.pending} for active prompt, {modelStats.pending} for model.</div>
      )}
    </div>
  );
}

function StatLine({ title, stats, compact }: { title: string; stats: Stats; compact: boolean }) {
  const rate = stats.successRate === null ? "No reviewed results yet" : `${Math.round(stats.successRate * 100)}%`;
  const detail = stats.reviewed === 1 ? "1 reviewed recognition" : `${stats.reviewed} reviewed recognitions`;
  return (
    <div className={compact ? "" : "stat"}>
      <div><strong>{title}</strong></div>
      <div>{rate} <span className="muted">based on {detail}</span></div>
    </div>
  );
}

