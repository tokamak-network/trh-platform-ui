"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { useThanosDeploymentLogsQuery } from "@/features/rollup/api/queries";
import {
  ThanosDeployment,
  ThanosDeploymentLog,
} from "@/features/rollup/schemas/thanos-deployments";
import { extractStepProgress } from "@/features/rollup/utils/deploymentSubtask";
import { extractCurrentSubtask } from "@/features/rollup/utils/deploymentSubtask";
import { classifyLogLevel, LogLevel } from "@/features/rollup/utils/logLevel";
import { cn } from "@/lib/utils";

const ANSI_RE_LOG = /\x1b\[[0-9;]*[A-Za-z]/g;

function parseMessageText(log: ThanosDeploymentLog): { timestamp: string; text: string } {
  const fallback = log.created_at;
  let text = log.message;
  try {
    const parsed = JSON.parse(log.message);
    const raw = parsed.msg ?? parsed.message ?? log.message;
    text = typeof raw === 'string' ? raw : String(raw);
    const ts = parsed.timestamp ?? fallback;
    return {
      timestamp: ts,
      text: text.replace(ANSI_RE_LOG, '').replaceAll('\r', ''),
    };
  } catch {
    return {
      timestamp: fallback,
      text: text.replace(ANSI_RE_LOG, '').replaceAll('\r', ''),
    };
  }
}

interface LogDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Function to handle dialog open/close state */
  onOpenChange: (open: boolean) => void;
  /** The deployment to show logs for */
  deployment: ThanosDeployment | null;
  /** The stack ID for the deployment */
  stackId?: string;
  /** Optional log query options */
  queryOptions?: {
    limit?: number;
    refetchIntervalMs?: number;
  };
}

export function LogDialog({
  open,
  onOpenChange,
  deployment,
  stackId,
  queryOptions = {
    limit: 200,
    refetchIntervalMs: 5000,
  },
}: LogDialogProps) {
  const deploymentId = open && deployment?.id ? deployment.id : undefined;

  // State for realtime logging and line limit
  const [isRealtimeEnabled, setIsRealtimeEnabled] = React.useState(true);
  const [lineLimit, setLineLimit] = React.useState<number>(200);
  const [levelFilter, setLevelFilter] = React.useState<LogLevel | 'all'>('all');
  const logContainerRef = React.useRef<HTMLDivElement>(null);

  // Available line limit options
  const lineLimitOptions = [
    { value: 10, label: "10 lines" },
    { value: 50, label: "50 lines" },
    { value: 100, label: "100 lines" },
    { value: 200, label: "200 lines" },
    { value: 500, label: "500 lines" },
  ];

  const {
    data: logs = [],
    isLoading: isLogsLoading,
    isError: isLogsError,
    refetch: refetchLogs,
  } = useThanosDeploymentLogsQuery(stackId, deploymentId, {
    limit: lineLimit,
    refetchIntervalMs: isRealtimeEnabled
      ? queryOptions.refetchIntervalMs
      : false,
  });

  const leveledLogs = React.useMemo(
    () =>
      logs.map((log) => ({
        id: log.id,
        ...parseMessageText(log),
        level: classifyLogLevel(log.message),
      })),
    [logs]
  );

  const stepProgress = React.useMemo(() => extractStepProgress(logs), [logs]);
  const subtask = React.useMemo(() => extractCurrentSubtask(logs), [logs]);
  const firstError = React.useMemo(
    () => leveledLogs.find((l) => l.level === 'error'),
    [leveledLogs]
  );
  const filteredLogs = React.useMemo(
    () =>
      levelFilter === 'all'
        ? leveledLogs
        : leveledLogs.filter((l) => l.level === levelFilter),
    [leveledLogs, levelFilter]
  );

  // Auto-scroll to bottom when in realtime mode and new logs arrive
  React.useEffect(() => {
    if (!isRealtimeEnabled) return;
    const el = logContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [filteredLogs, isRealtimeEnabled]);

  // On open with Failed status, scroll to first error line
  React.useEffect(() => {
    if (!open || deployment?.status !== 'Failed') return;
    const timer = setTimeout(() => {
      const el = logContainerRef.current;
      const errorEl = el?.querySelector('[data-level="error"]') as HTMLElement | null;
      if (errorEl) errorEl.scrollIntoView({ block: 'center' });
    }, 150);
    return () => clearTimeout(timer);
  }, [open, deployment?.status]);

  const levelFilterColors: Record<string, string> = {
    all: 'bg-slate-200 text-slate-700',
    error: 'bg-red-100 text-red-700',
    warn: 'bg-yellow-100 text-yellow-700',
    info: 'bg-blue-100 text-blue-700',
  };

  const lineColors: Record<string, string> = {
    error: 'text-red-400',
    warn: 'text-yellow-300',
    info: 'text-slate-300',
    default: 'text-slate-500',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-auto min-w-[700px] max-w-4xl max-h-[80vh] min-h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Deployment logs</DialogTitle>
          <DialogDescription>
            {deployment && (
              <span>
                Showing recent logs for{' '}
                <span className="font-medium">
                  {deployment.step.replace(/-/g, ' ')}
                </span>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Controls */}
        <div className="flex items-center justify-between gap-4 py-3 border-b flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="realtime-switch" className="text-sm font-medium">
                Realtime
              </Label>
              <Switch
                id="realtime-switch"
                checked={isRealtimeEnabled}
                onCheckedChange={setIsRealtimeEnabled}
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="line-limit" className="text-sm font-medium">
                Lines
              </Label>
              <Select
                value={lineLimit.toString()}
                onValueChange={(value) => setLineLimit(parseInt(value))}
              >
                <SelectTrigger id="line-limit" className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {lineLimitOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchLogs()}
            className="inline-flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>

        <div className="flex flex-col flex-1 min-h-0 gap-3">
          {isLogsLoading ? (
            <div className="flex items-center text-slate-600">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading logs...
            </div>
          ) : isLogsError ? (
            <div className="flex items-center text-red-600">
              <AlertCircle className="w-4 h-4 mr-2" /> Failed to load logs
            </div>
          ) : logs.length === 0 ? (
            <div className="text-slate-600">No logs available.</div>
          ) : (
            <>
              {/* Progress Panel */}
              {(stepProgress || subtask || firstError) && (
                <div className="rounded-md border bg-slate-50 p-3 space-y-2 flex-shrink-0">
                  {stepProgress && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>Step {stepProgress.current} / {stepProgress.total}</span>
                        <span>
                          {Math.round((stepProgress.current / stepProgress.total) * 100)}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${(stepProgress.current / stepProgress.total) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                  {subtask && (
                    <p className="text-xs text-slate-600 italic">↳ {subtask.label}</p>
                  )}
                  {firstError && (
                    <div className="flex items-start gap-2 rounded border border-red-200 bg-red-50 px-2.5 py-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                      <span className="text-xs text-red-700 break-all">{firstError.text}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Level Filter */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {(['all', 'error', 'warn', 'info'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setLevelFilter(lvl)}
                    className={cn(
                      'px-2 py-0.5 rounded text-xs font-medium transition-colors',
                      levelFilter === lvl
                        ? levelFilterColors[lvl]
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    )}
                  >
                    {lvl.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Log Stream */}
              <div
                ref={logContainerRef}
                className="rounded-md border bg-slate-950 flex-1 min-h-0 overflow-y-auto"
              >
                <div className="p-3 space-y-0.5">
                  {filteredLogs.map((log) => {
                    const dt = new Date(log.timestamp);
                    const ts = isNaN(dt.getTime())
                      ? log.timestamp
                      : dt.toLocaleTimeString();
                    return (
                      <div
                        key={log.id}
                        data-level={log.level}
                        className={cn(
                          'text-xs font-mono whitespace-pre-wrap break-words leading-relaxed',
                          lineColors[log.level] ?? lineColors.default
                        )}
                      >
                        <span className="text-slate-600 select-none mr-2">{ts}</span>
                        {log.text}
                      </div>
                    );
                  })}
                  {filteredLogs.length === 0 && (
                    <div className="text-xs text-slate-600 italic">
                      No {levelFilter !== 'all' ? levelFilter : ''} logs.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
