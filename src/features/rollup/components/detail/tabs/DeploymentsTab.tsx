"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Eye,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Hourglass,
  FileText,
  Download,
  Pause,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RollupDetailTabProps } from "../../../schemas/detail-tabs";
import {
  useThanosDeploymentsQuery,
  usePresetDetailQuery,
} from "@/features/rollup/api/queries";
import { ThanosDeployment } from "@/features/rollup/schemas/thanos-deployments";
import { LogDialog } from "../LogDialog";
import { downloadThanosDeploymentLogs } from "@/features/rollup/services/rollupService";
import { formatDuration } from "@/features/rollup/utils/durationUtils";
import toast from "react-hot-toast";

const formatDateTime = (iso?: string) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleString();
};

const StatusBadge = ({ status }: { status: ThanosDeployment["status"] }) => {
  const config = {
    InProgress: {
      className: "bg-blue-100 text-blue-700 border-blue-200",
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
    },
    Success: {
      className: "bg-green-100 text-green-700 border-green-200",
      icon: <CheckCircle className="w-3 h-3" />,
    },
    Failed: {
      className: "bg-red-100 text-red-700 border-red-200",
      icon: <AlertCircle className="w-3 h-3" />,
    },
    Pending: {
      className: "bg-gray-100 text-yellow-700 border-yellow-200",
      icon: <Hourglass className="w-3 h-3" />,
    },
    Stopped: {
      className: "bg-gray-100 text-gray-700 border-gray-200",
      icon: <Pause className="w-3 h-3" />,
    },
    Cancelled: {
      className: "bg-orange-100 text-orange-700 border-orange-200",
      icon: <AlertCircle className="w-3 h-3" />,
    },
  } as const;
  const { className, icon } = config[status] || config.InProgress;
  return (
    <Badge variant="outline" className={`flex items-center gap-1 ${className}`}>
      {icon}
      {status}
    </Badge>
  );
};

// Non-integration step groups (L1 Contracts, Infrastructure).
// The integration group is handled separately via INTEGRATION_CARDS.
const APP_GROUPS: { id: string; label: string; steps: string[] }[] = [
  {
    id: "l1-contracts",
    label: "L1 Contracts",
    steps: ["deploy-l1-contracts"],
  },
  {
    id: "infrastructure",
    label: "Infrastructure",
    steps: [
      "deploy-aws-infra",
      "deploy-local-infra",
      "destroy-aws-infra",
      "destroy-chain",
    ],
  },
];

interface IntegrationCardDef {
  id: string;
  label: string;
  // Key in preset.modules for placeholder visibility. undefined = show only when hasHistory.
  moduleKey?: string;
  steps: string[];
}

const INTEGRATION_CARDS: IntegrationCardDef[] = [
  {
    id: "bridge",
    label: "Bridge",
    moduleKey: "bridge",
    steps: ["install-bridge", "uninstall-bridge"],
  },
  {
    id: "block-explorer",
    label: "Block Explorer",
    moduleKey: "blockExplorer",
    steps: [
      "install-block-explorer",
      "uninstall-block-explorer",
      "update-block-explorer",
    ],
  },
  {
    id: "monitoring",
    label: "Monitoring Dashboard",
    moduleKey: "monitoring",
    steps: ["install-monitoring", "uninstall-monitoring"],
  },
  {
    id: "system-pulse",
    label: "System Pulse",
    moduleKey: "uptimeService",
    steps: ["install-system-pulse", "uninstall-system-pulse"],
  },
  {
    id: "drb",
    label: "DRB Nodes",
    moduleKey: "drb",
    steps: ["install-drb", "uninstall-drb"],
  },
  {
    id: "cross-trade",
    label: "Cross-Trade",
    moduleKey: "crossTrade",
    steps: [
      "install-cross-trade-bridge",
      "uninstall-cross-trade-bridge",
      "install-cross-trade-l2-l1",
      "uninstall-cross-trade-l2-l1",
      "install-cross-trade-l2-l2",
      "uninstall-cross-trade-l2-l2",
      "register-tokens-l2-l1",
      "register-tokens-l2-l2",
      "deploy-new-l2-chain-l2-l1",
      "deploy-new-l2-chain-l2-l2",
    ],
  },
  {
    id: "register-candidate",
    label: "Staking / DAO Candidate",
    // registerCandidate lives in ChainDefaults, not Modules — show only when hasHistory
    moduleKey: undefined,
    steps: ["register-candidate"],
  },
  {
    id: "register-metadata-dao",
    label: "DAO Metadata",
    moduleKey: undefined,
    steps: ["register-metadata-dao"],
  },
];

type CardStatusPill =
  | "active"
  | "in-progress"
  | "failed"
  | "stopped"
  | "uninstalled";

function deriveCardStatus(
  sorted: ThanosDeployment[],
): CardStatusPill | null {
  if (sorted.length === 0) return null;
  const latest = sorted[0];
  if (latest.status === "InProgress" || latest.status === "Pending")
    return "in-progress";
  if (latest.status === "Success") {
    return latest.step.startsWith("uninstall-") ? "uninstalled" : "active";
  }
  if (latest.status === "Failed") return "failed";
  if (latest.status === "Stopped" || latest.status === "Cancelled")
    return "stopped";
  return null;
}

function CardStatusPillBadge({ pill }: { pill: CardStatusPill }) {
  const styles: Record<CardStatusPill, string> = {
    active: "bg-green-50 text-green-700 border-green-200",
    "in-progress": "bg-blue-50 text-blue-700 border-blue-200",
    failed: "bg-red-50 text-red-700 border-red-200",
    stopped: "bg-orange-50 text-orange-700 border-orange-200",
    uninstalled: "bg-gray-50 text-gray-600 border-gray-200",
  };
  const labels: Record<CardStatusPill, string> = {
    active: "Active",
    "in-progress": "In Progress",
    failed: "Failed",
    stopped: "Stopped",
    uninstalled: "Uninstalled",
  };
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium border ${styles[pill]}`}
    >
      {labels[pill]}
    </span>
  );
}

interface AppHistoryCardProps {
  label: string;
  deployments: ThanosDeployment[];
  now: number;
  getStepDisplayName: (d: ThanosDeployment) => string;
  onView: (d: ThanosDeployment) => void;
  onLogs: (d: ThanosDeployment) => void;
  onDownload: (d: ThanosDeployment) => void;
  showStatusPill?: boolean;
}

function AppHistoryCard({
  label,
  deployments,
  now,
  getStepDisplayName,
  onView,
  onLogs,
  onDownload,
  showStatusPill = false,
}: AppHistoryCardProps) {
  const [expanded, setExpanded] = React.useState(true);

  const sorted = React.useMemo(
    () =>
      [...deployments].sort((a, b) => {
        const aTime = new Date(a.finished_at ?? a.started_at).getTime();
        const bTime = new Date(b.finished_at ?? b.started_at).getTime();
        return bTime - aTime;
      }),
    [deployments],
  );

  const statusPill = React.useMemo(
    () => (showStatusPill ? deriveCardStatus(sorted) : null),
    [showStatusPill, sorted],
  );

  return (
    <Card className="border-0 shadow-xl bg-gradient-to-br from-slate-50 to-gray-100">
      <CardHeader
        className="flex flex-row items-center justify-between cursor-pointer select-none pb-3"
        onClick={() => setExpanded((v) => !v)}
      >
        <CardTitle className="text-slate-800 text-base flex items-center gap-2">
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-500" />
          )}
          {label}
          {statusPill && <CardStatusPillBadge pill={statusPill} />}
        </CardTitle>
        <Badge variant="outline" className="text-xs font-normal text-slate-600">
          {deployments.length}
        </Badge>
      </CardHeader>
      {expanded && (
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-600">
                  <th className="py-2 pr-4 font-medium">Name</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Started</th>
                  <th className="py-2 pr-4 font-medium">Duration</th>
                  <th className="py-2 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((d) => {
                  const duration =
                    d.status === "Success" || d.status === "Failed"
                      ? formatDuration(d.started_at, d.finished_at)
                      : formatDuration(d.started_at, undefined, now);
                  return (
                    <tr key={d.id} className="border-t border-slate-200/60">
                      <td className="py-3 pr-4 font-medium text-slate-800 capitalize">
                        {getStepDisplayName(d)}
                      </td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={d.status} />
                      </td>
                      <td className="py-3 pr-4 text-slate-700">
                        {formatDateTime(d.started_at)}
                      </td>
                      <td className="py-3 pr-4 text-slate-700">{duration}</td>
                      <td className="py-3 pr-0 space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="inline-flex items-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            onView(d);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" /> View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="inline-flex items-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            onLogs(d);
                          }}
                        >
                          <FileText className="w-4 h-4 mr-2" /> Logs
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="inline-flex items-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDownload(d);
                          }}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

interface NotInstalledCardProps {
  label: string;
  presetName?: string;
}

function NotInstalledCard({ label, presetName }: NotInstalledCardProps) {
  const [expanded, setExpanded] = React.useState(false);
  return (
    <Card className="border-0 shadow-sm bg-gradient-to-br from-slate-50 to-gray-50">
      <CardHeader
        className="flex flex-row items-center justify-between cursor-pointer select-none pb-3"
        onClick={() => setExpanded((v) => !v)}
      >
        <CardTitle className="text-slate-500 text-base flex items-center gap-2">
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          )}
          {label}
        </CardTitle>
        <Badge
          variant="outline"
          className="text-xs font-normal bg-gray-50 text-gray-500 border-gray-200"
        >
          Not Installed
        </Badge>
      </CardHeader>
      {expanded && (
        <CardContent className="pt-0 pb-4">
          <p className="text-sm text-slate-500">
            No deployment attempts yet
            {presetName
              ? ` — this integration is expected by the ${presetName} preset.`
              : "."}
          </p>
        </CardContent>
      )}
    </Card>
  );
}

export function DeploymentsTab({ stack }: RollupDetailTabProps) {
  const stackId = stack?.id;
  const {
    data: deployments = [],
    isLoading,
    isError,
    refetch,
  } = useThanosDeploymentsQuery(stackId);
  const [now, setNow] = React.useState(Date.now());

  const effectivePreset =
    stack?.config.presetId ?? stack?.config.preset ?? undefined;
  const { data: presetDetail, isLoading: isPresetLoading } =
    usePresetDetailQuery(effectivePreset);

  React.useEffect(() => {
    const hasActive = deployments.some(
      (d) => d.status === "InProgress" || d.status === "Pending",
    );
    if (!hasActive) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [deployments]);

  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<ThanosDeployment | null>(null);
  const [logsOpen, setLogsOpen] = React.useState(false);
  const [logsSelected, setLogsSelected] =
    React.useState<ThanosDeployment | null>(null);

  const StepnameMap: Record<string, string> = {
    "deploy-l1-contracts": "Deploy L1 Contracts",
    "deploy-aws-infra": "Deploy Infrastructure",
    "deploy-local-infra": "Deploy Local Infrastructure",
    "destroy-aws-infra": "Destroy Infrastructure",
    "destroy-chain": "Destroy Chain",
    "install-bridge": "Install Bridge",
    "uninstall-bridge": "Uninstall Bridge",
    "install-block-explorer": "Install Block Explorer",
    "uninstall-block-explorer": "Uninstall Block Explorer",
    "update-block-explorer": "Update Block Explorer",
    "install-monitoring": "Install Monitoring Dashboard",
    "uninstall-monitoring": "Uninstall Monitoring Dashboard",
    "install-system-pulse": "Install System Pulse",
    "uninstall-system-pulse": "Uninstall System Pulse",
    "install-drb": "Install DRB Nodes",
    "uninstall-drb": "Uninstall DRB Nodes",
    "install-cross-trade-bridge": "Install Cross Trade Bridge",
    "uninstall-cross-trade-bridge": "Uninstall Cross Trade Bridge",
    "install-cross-trade-l2-l1": "Install Cross Trade (L2 → L1)",
    "uninstall-cross-trade-l2-l1": "Uninstall Cross Trade (L2 → L1)",
    "install-cross-trade-l2-l2": "Install Cross Trade (L2 → L2)",
    "uninstall-cross-trade-l2-l2": "Uninstall Cross Trade (L2 → L2)",
    "register-tokens-l2-l1": "Register Tokens (L2 → L1)",
    "register-tokens-l2-l2": "Register Tokens (L2 → L2)",
    "deploy-new-l2-chain-l2-l1": "Deploy New L2 Chain (L2 → L1)",
    "deploy-new-l2-chain-l2-l2": "Deploy New L2 Chain (L2 → L2)",
    "register-candidate": "Staking / DAO Candidate Registration",
    "register-metadata-dao": "Register DAO Metadata",
  };

  const getStepDisplayName = (deployment: ThanosDeployment): string => {
    if (deployment.step === "deploy-aws-infra" && deployment.config) {
      const provider = deployment.config.infraProvider as string | undefined;
      if (provider === "local") return "Deploy Local Infrastructure";
      if (provider === "aws") return "Deploy AWS Infrastructure";
    }
    if (deployment.step === "destroy-aws-infra" && deployment.config) {
      const provider = deployment.config.infraProvider as string | undefined;
      if (provider === "local") return "Destroy Local Infrastructure";
      if (provider === "aws") return "Destroy AWS Infrastructure";
    }
    return StepnameMap[deployment.step] || deployment.step.replace(/-/g, " ");
  };

  // Per-integration card data: deployments + show decision per card
  const integrationCardData = React.useMemo(() => {
    return INTEGRATION_CARDS.map((card) => {
      const cardDeployments = deployments.filter((d) =>
        card.steps.includes(d.step),
      );
      const hasHistory = cardDeployments.length > 0;
      const isExpectedByPreset =
        !isPresetLoading &&
        card.moduleKey !== undefined &&
        presetDetail?.modules?.[card.moduleKey] === true;
      return { card, deployments: cardDeployments, hasHistory, isExpectedByPreset };
    });
  }, [deployments, presetDetail, isPresetLoading]);

  // Steps not in APP_GROUPS or INTEGRATION_CARDS → fallback "Other" card
  const ungroupedDeployments = React.useMemo(() => {
    const knownSteps = new Set([
      ...APP_GROUPS.flatMap((g) => g.steps),
      ...INTEGRATION_CARDS.flatMap((c) => c.steps),
    ]);
    return deployments.filter((d) => !knownSteps.has(d.step));
  }, [deployments]);

  const hasIntegrationCards = React.useMemo(
    () =>
      integrationCardData.some(
        ({ hasHistory, isExpectedByPreset }) => hasHistory || isExpectedByPreset,
      ),
    [integrationCardData],
  );

  const hasAnythingToShow = React.useMemo(() => {
    const hasGroupData = APP_GROUPS.some((g) =>
      deployments.some((d) => g.steps.includes(d.step)),
    );
    return hasGroupData || hasIntegrationCards || ungroupedDeployments.length > 0;
  }, [deployments, hasIntegrationCards, ungroupedDeployments]);

  if (!stack) return null;

  const handleView = (deployment: ThanosDeployment) => {
    setSelected(deployment);
    setOpen(true);
  };

  const handleLogs = (deployment: ThanosDeployment) => {
    setLogsSelected(deployment);
    setLogsOpen(true);
  };

  const handleDownload = async (deployment: ThanosDeployment) => {
    if (!stackId) return;
    try {
      await downloadThanosDeploymentLogs(stackId, deployment.id);
    } catch (error) {
      console.error("Failed to download logs:", error);
      toast.error("Failed to download logs");
    }
  };

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="flex items-center justify-center py-10 text-slate-600">
          <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading
          deployment history...
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center gap-3 py-10">
          <div className="text-red-600 inline-flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" /> Failed to load
            deployment history
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="inline-flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Retry
          </Button>
        </div>
      ) : !hasAnythingToShow ? (
        <div className="flex items-center justify-center py-10 text-slate-600">
          No deployments found
        </div>
      ) : (
        <>
          {/* L1 Contracts + Infrastructure */}
          {APP_GROUPS.map((group) => {
            const groupDeployments = deployments.filter((d) =>
              group.steps.includes(d.step),
            );
            if (groupDeployments.length === 0) return null;
            return (
              <AppHistoryCard
                key={group.id}
                label={group.label}
                deployments={groupDeployments}
                now={now}
                getStepDisplayName={getStepDisplayName}
                onView={handleView}
                onLogs={handleLogs}
                onDownload={handleDownload}
              />
            );
          })}

          {/* Integrations section */}
          {hasIntegrationCards && (
            <>
              <div className="flex items-center gap-2 pt-2">
                <div className="h-px bg-slate-200 flex-1" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Integrations
                </span>
                <div className="h-px bg-slate-200 flex-1" />
              </div>

              {integrationCardData.map(
                ({ card, deployments: cardDeps, hasHistory, isExpectedByPreset }) => {
                  if (hasHistory) {
                    return (
                      <AppHistoryCard
                        key={card.id}
                        label={card.label}
                        deployments={cardDeps}
                        now={now}
                        getStepDisplayName={getStepDisplayName}
                        onView={handleView}
                        onLogs={handleLogs}
                        onDownload={handleDownload}
                        showStatusPill
                      />
                    );
                  }
                  if (isExpectedByPreset) {
                    return (
                      <NotInstalledCard
                        key={card.id}
                        label={card.label}
                        presetName={presetDetail?.name}
                      />
                    );
                  }
                  return null;
                },
              )}
            </>
          )}

          {/* Fallback for unmapped steps */}
          {ungroupedDeployments.length > 0 && (
            <AppHistoryCard
              label="Other"
              deployments={ungroupedDeployments}
              now={now}
              getStepDisplayName={getStepDisplayName}
              onView={handleView}
              onLogs={handleLogs}
              onDownload={handleDownload}
            />
          )}
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Deployment details</DialogTitle>
            <DialogDescription>
              Information about this deployment run
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm overflow-y-auto flex-1 pr-2">
              <div className="grid grid-cols-3 gap-2">
                <div className="text-slate-600">Name</div>
                <div className="col-span-2 font-medium capitalize">
                  {selected.step.replace(/-/g, " ")}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-slate-600">Status</div>
                <div className="col-span-2">
                  <StatusBadge status={selected.status} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-slate-600">Created</div>
                <div className="col-span-2">
                  {formatDateTime(selected.started_at)}
                </div>
              </div>
              {selected.finished_at && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-slate-600">Finished</div>
                  <div className="col-span-2">
                    {formatDateTime(selected.finished_at)}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2">
                <div className="text-slate-600">Duration</div>
                <div className="col-span-2">
                  {formatDuration(selected.started_at, selected.finished_at)}
                </div>
              </div>
              {selected.log_path && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-slate-600">Log Path</div>
                  <div className="col-span-2 font-mono text-xs break-words">
                    {selected.log_path}
                  </div>
                </div>
              )}
              {selected.config && (
                <div className="space-y-1">
                  <div className="text-slate-600">Config</div>
                  <pre className="bg-slate-100 rounded p-3 text-xs overflow-x-auto whitespace-pre-wrap break-words">
                    {JSON.stringify(selected.config, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <LogDialog
        open={logsOpen}
        onOpenChange={setLogsOpen}
        deployment={logsSelected}
        stackId={stackId}
      />
    </div>
  );
}
