import { ThanosDeployment } from '@/features/rollup/schemas/thanos-deployments';

export interface DeploymentSession {
  id: string;
  rows: ThanosDeployment[];
  startedAt: string;
  finishedAt: string | undefined;
}

const DEFAULT_GAP_MS = 5 * 60 * 1000;

export function groupIntoSessions(
  deployments: ThanosDeployment[],
  gapMs: number = DEFAULT_GAP_MS,
): DeploymentSession[] {
  if (deployments.length === 0) return [];

  const sorted = [...deployments].sort(
    (a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime(),
  );

  const buckets: Array<{ rows: ThanosDeployment[]; sessionEndMs: number }> = [];

  for (const row of sorted) {
    const startMs = new Date(row.started_at).getTime();
    const finishedMs = row.finished_at ? new Date(row.finished_at).getTime() : startMs;
    const last = buckets[buckets.length - 1];

    if (!last || startMs > last.sessionEndMs + gapMs) {
      buckets.push({ rows: [row], sessionEndMs: finishedMs });
    } else {
      last.rows.push(row);
      last.sessionEndMs = Math.max(last.sessionEndMs, finishedMs);
    }
  }

  return buckets
    .map((bucket, i) => {
      const startedAt = bucket.rows.reduce(
        (min, r) => (r.started_at < min ? r.started_at : min),
        bucket.rows[0].started_at,
      );

      const finishedRows = bucket.rows.filter((r) => r.finished_at);
      const finishedAt =
        finishedRows.length > 0
          ? finishedRows.reduce(
              (max, r) => (r.finished_at! > max ? r.finished_at! : max),
              finishedRows[0].finished_at!,
            )
          : undefined;

      return { id: `session-${i}`, rows: bucket.rows, startedAt, finishedAt };
    })
    .reverse();
}
