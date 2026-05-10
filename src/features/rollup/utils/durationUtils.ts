export function formatEtaMs(ms: number): string {
  if (ms <= 0) return '< 1m';
  const totalSec = Math.round(ms / 1000);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) return `~${hours}h ${mins}m`;
  if (minutes > 0) return `~${minutes}m`;
  return `~${seconds}s`;
}

export const formatDuration = (start?: string, end?: string, now: number = Date.now()): string => {
  if (!start) return "-";
  const startMs = new Date(start).getTime();
  const endMs = end ? new Date(end).getTime() : now;
  if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs < startMs) return "-";
  const totalSeconds = Math.floor((endMs - startMs) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) return `${hours}h ${mins}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};
