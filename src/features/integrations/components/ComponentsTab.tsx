"use client";

import React, { useState } from "react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  RefreshCw,
  AlertCircle,
  Plus,
  Package,
} from "lucide-react";
import { RollupDetailTabProps } from "../../rollup/schemas/detail-tabs";
import { ThanosStackStatus } from "../../rollup/schemas/thanos";
import { useIntegrationsQuery } from "../api";
import { IntegrationCard } from "./IntegrationCard";
import { INTEGRATION_TYPES, Integration } from "../schemas";
import {
  useInstallBridgeMutation,
  useInstallUptimeMutation,
  useInstallBlockExplorerMutation,
  useInstallMonitoringMutation,
  useRegisterDaoCandidateMutation,
} from "../api";
import InstallBridgeDialog from "./InstallBridgeDialog";
import InstallUptimeDialog from "./InstallUptimeDialog";
import InstallBlockExplorerDialog, {
  BlockExplorerFormData,
} from "./InstallBlockExplorerDialog";
import InstallMonitoringDialog, {
  MonitoringFormData,
} from "./InstallMonitoringDialog";
import InstallDaoCandidateDialog, {
  DaoCandidateFormData,
} from "./InstallDaoCandidateDialog";

export function ComponentsTab({ stack }: RollupDetailTabProps) {
  const {
    data: integrations = [],
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useIntegrationsQuery(stack?.id || "");

  const installBridgeMutation = useInstallBridgeMutation();
  const installUptimeMutation = useInstallUptimeMutation();
  const installBlockExplorerMutation = useInstallBlockExplorerMutation();
  const installMonitoringMutation = useInstallMonitoringMutation();
  const installDaoCandidateMutation = useRegisterDaoCandidateMutation();
  const isAnyInstallPending =
    installBridgeMutation.isPending ||
    installUptimeMutation.isPending ||
    installBlockExplorerMutation.isPending ||
    installMonitoringMutation.isPending ||
    installDaoCandidateMutation.isPending;
  const [installType, setInstallType] = useState<Integration["type"] | null>(
    null
  );

  const getStatusCounts = () => {
    const counts = { running: 0, inProgress: 0 };
    integrations.forEach((integration) => {
      if (integration.status === "Completed") counts.running++;
      else if (integration.status === "InProgress" || integration.status === "Pending") counts.inProgress++;
    });
    return counts;
  };

  const statusCounts = getStatusCounts();
  const isStackDeployed = stack?.status === ThanosStackStatus.DEPLOYED;

  const activeTypeKeys = new Set(
    integrations
      .filter((i) => ["Completed", "InProgress", "Pending", "Cancelling"].includes(i.status))
      .map((i) => i.type)
  );
  const availableTypeEntries = Object.entries(INTEGRATION_TYPES).filter(
    ([type]) => type !== "drb" && !activeTypeKeys.has(type as Integration["type"])
  );

  if (!stack) {
    return (
      <div className="space-y-6">
        <Card className="border-0 shadow-xl bg-gradient-to-br from-red-50 to-pink-100">
          <CardContent>
            <div className="text-center py-12">
              <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                Stack Not Found
              </h3>
              <p className="text-slate-600 font-medium">
                Unable to load stack information. Please try refreshing the
                page.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-cyan-100">
          <CardContent>
            <div className="text-center py-12">
              <RefreshCw className="w-10 h-10 text-blue-500 mx-auto mb-4 animate-spin" />
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                Loading Components
              </h3>
              <p className="text-slate-600 font-medium">
                Fetching integration components for your rollup...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <Card className="border-0 shadow-xl bg-gradient-to-br from-red-50 to-pink-100">
          <CardContent>
            <div className="text-center py-12">
              <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                Error Loading Components
              </h3>
              <p className="text-slate-600 font-medium mb-6">
                There was a problem fetching your integration components. Please
                try again.
              </p>
              <Button onClick={() => refetch()} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
                  <Package className="w-4 h-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base">Integration Components</CardTitle>
                  <p className="text-xs text-slate-500">Manage your rollup integrations</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 rounded-full border border-green-100">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-xs font-medium text-green-700">{statusCounts.running} Running</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-full border border-blue-100">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    <span className="text-xs font-medium text-blue-700">{statusCounts.inProgress} In Progress</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-200">
                    <div className="w-2 h-2 bg-slate-400 rounded-full" />
                    <span className="text-xs font-medium text-slate-600">{availableTypeEntries.length} Available</span>
                  </div>
                </div>
                <Button
                  onClick={() => refetch()}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={isFetching}
                >
                  <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {integrations.filter((i) =>
          i.status === "Completed" || i.status === "InProgress" || i.status === "Pending" || i.status === "Cancelling"
        ).length === 0 ? (
          <Card className="border-0 shadow-xl bg-gradient-to-br from-gray-50 to-slate-100">
            <CardContent>
              <div className="text-center py-12">
                <Activity className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-800 mb-2">
                  No Components Found
                </h3>
                <p className="text-slate-600 font-medium max-w-md mx-auto mb-6">
                  No integration components have been deployed for this rollup
                  yet. Components will appear here once they are configured and
                  deployed.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {Object.entries(INTEGRATION_TYPES)
                    .filter(([type]) => type !== "drb")
                    .map(([type, config]) => (
                    <Badge key={type} variant="outline" className="text-sm">
                      {config.icon} {config.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {integrations
              .filter((integration) =>
                integration.status === "Completed" ||
                integration.status === "InProgress" ||
                integration.status === "Pending" ||
                integration.status === "Cancelling"
              )
              .map((integration) => (
                <IntegrationCard key={integration.id} integration={integration} stackId={stack?.id || ""} />
              ))}
          </div>
        )}

        {availableTypeEntries.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-slate-500 shrink-0">Add:</span>
            {availableTypeEntries.map(([type, config]) => (
              <Tooltip key={type}>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2.5 text-xs gap-1.5 border-dashed hover:border-solid hover:bg-slate-50"
                      disabled={!isStackDeployed || isAnyInstallPending}
                      onClick={() => setInstallType(type as Integration["type"])}
                    >
                      <span>{config.icon}</span>
                      <span>{config.label}</span>
                      <Plus className="w-3 h-3 text-slate-400" />
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>{isStackDeployed ? `Install ${config.label}` : "Deploy the rollup first"}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        )}
      </div>

      <InstallBridgeDialog
        open={installType === "bridge"}
        onOpenChange={(open) => !open && setInstallType(null)}
        isPending={installBridgeMutation.isPending}
        onConfirm={() => {
          if (!stack) return;
          installBridgeMutation.mutate(
            { stackId: stack.id },
            { onSettled: () => setInstallType(null) }
          );
        }}
      />

      <InstallUptimeDialog
        open={installType === "system-pulse"}
        onOpenChange={(open) => !open && setInstallType(null)}
        isPending={installUptimeMutation.isPending}
        onConfirm={() => {
          if (!stack) return;
          installUptimeMutation.mutate(
            { stackId: stack.id },
            { onSettled: () => setInstallType(null) }
          );
        }}
      />

      <InstallBlockExplorerDialog
        open={installType === "block-explorer"}
        onOpenChange={(open) => !open && setInstallType(null)}
        isPending={installBlockExplorerMutation.isPending}
        onSubmit={(data: BlockExplorerFormData) => {
          if (!stack) return;
          installBlockExplorerMutation.mutate(
            {
              stackId: stack.id,
              databaseUsername: data.databaseUsername,
              databasePassword: data.databasePassword,
              coinmarketcapKey: data.coinmarketcapKey,
              walletConnectId: data.walletConnectId,
            },
            { onSettled: () => setInstallType(null) }
          );
        }}
      />

      <InstallMonitoringDialog
        open={installType === "monitoring"}
        onOpenChange={(open) => !open && setInstallType(null)}
        isPending={installMonitoringMutation.isPending}
        onSubmit={(data: MonitoringFormData) => {
          if (!stack) return;
          
          // Transform form data to match API expectations
          const apiData = {
            stackId: stack.id,
            grafanaPassword: data.grafanaPassword,
            loggingEnabled: data.loggingEnabled,
            alertManager: {
              telegram: {
                enabled: data.alertManager.telegram.enabled,
                apiToken: data.alertManager.telegram.apiToken || "",
                criticalReceivers: (data.alertManager.telegram.criticalReceivers || []).map(receiver => ({
                  chatId: receiver.chatId || ""
                }))
              },
              email: {
                enabled: data.alertManager.email.enabled,
                smtpSmarthost: "smtp.gmail.com:587",
                smtpFrom: data.alertManager.email.smtpFrom || "",
                smtpAuthPassword: data.alertManager.email.smtpAuthPassword || "",
                alertReceivers: data.alertManager.email.alertReceivers || []
              }
            }
          };
          
          installMonitoringMutation.mutate(apiData, { onSettled: () => setInstallType(null) });
        }}
      />

      <InstallDaoCandidateDialog
        open={installType === "register-candidate"}
        onOpenChange={(open) => !open && setInstallType(null)}
        isPending={installDaoCandidateMutation.isPending}
        onSubmit={(data: DaoCandidateFormData) => {
          if (!stack) return;
          installDaoCandidateMutation.mutate(
            {
              stackId: stack.id,
              amount: data.amount,
              memo: data.memo,
              nameInfo: data.nameInfo,
            },
            { onSettled: () => setInstallType(null) }
          );
        }}
      />
    </>
  );
}
