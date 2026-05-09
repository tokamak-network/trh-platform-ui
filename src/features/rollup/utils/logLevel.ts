export type LogLevel = 'error' | 'warn' | 'info' | 'default';

const ANSI_RE = /\x1b\[[0-9;]*[A-Za-z]/g;

export function classifyLogLevel(message: string): LogLevel {
  // Try JSON format first (Go structured logs)
  try {
    const parsed = JSON.parse(message);
    const lvl = ((parsed.level ?? parsed.lvl) as string | undefined)?.toLowerCase() ?? '';
    if (lvl === 'error' || lvl === 'err' || lvl === 'fatal' || lvl === 'panic') return 'error';
    if (lvl === 'warn' || lvl === 'warning') return 'warn';
    if (lvl === 'info' || lvl === 'debug') return 'info';
  } catch {
    // not JSON — fall through to plain text scan
  }

  const text = message.replace(ANSI_RE, '').toLowerCase();
  if (/\b(error|err|failed|panic|fatal)\b/.test(text)) return 'error';
  if (/\b(warn|warning)\b/.test(text)) return 'warn';
  if (/\binfo:/.test(text) || /\[info\]/.test(text)) return 'info';
  return 'default';
}
