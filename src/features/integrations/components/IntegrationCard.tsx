"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Integration, INTEGRATION_TYPES } from "../schemas";
import {
  Eye,
  Trash2,
  X,
  RotateCw,
  Plus,
  Coins,
} from "lucide-react";
import { useUninstallIntegrationMutation, useCancelIntegrationMutation, useRetryIntegrationMutation } from "../api";
import { INTEGRATION_TYPES as INTEGRATION_TYPES_CONST } from "../schemas";

// Import plugin-specific components
import { BridgeCard, BridgeCompactInfo } from "./BridgeCard";
import { UptimeCard, UptimeCompactInfo } from "./UptimeCard";
import { BlockExplorerCard, BlockExplorerCompactInfo } from "./BlockExplorerCard";
import { MonitoringCard, MonitoringCompactInfo } from "./MonitoringCard";
import { RegisterCandidateCard, RegisterCandidateCompactInfo } from "./RegisterCandidateCard";
import { CrossTradeCard } from "./CrossTrade";
import { CrossTradeCompactInfo } from "./CrossTradeCard";
import { DRBCard, DRBCompactInfo } from "./DRBCard";
import AddChainDialog from "./AddChainDialog";
import RegisterTokensDialog from "./RegisterTokensDialog";
import { useRegisterTokensMutation, useDeployNewL2ChainMutation } from "../api";
import { DeployNewL2ChainRequest } from "../services/integrationService";

interface IntegrationCardProps {
  integration: Integration;
  stackId: string;
}

export function IntegrationCard({ integration, stackId }: IntegrationCardProps) {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showUninstallConfirm, setShowUninstallConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showRetryConfirm, setShowRetryConfirm] = useState(false);
  const [showAddChainDialog, setShowAddChainDialog] = useState(false);
  const [showRegisterTokensDialog, setShowRegisterTokensDialog] = useState(false);
  
  // Normalize integration type - handle old "cross-trade" type from API
  const normalizedType: Exclude<Integration["type"], "cross-trade"> = (() => {
    if ((integration.type as string) === "cross-trade") {
      // If it's the old "cross-trade" type, determine the mode from contracts
      const mode = integration.info?.contracts?.mode;
      if (mode === "l2_to_l1") {
        return "cross-trade-l2-to-l1";
      } else if (mode === "l2_to_l2") {
        return "cross-trade-l2-to-l2";
      }
      // Default to l2_to_l1 if mode is not available
      return "cross-trade-l2-to-l1";
    }
    return integration.type as Exclude<Integration["type"], "cross-trade">;
  })();
  
  const integrationType = INTEGRATION_TYPES[normalizedType] || {
    label: integration.type,
    description: "Unknown integration type",
    icon: "❓",
    color: "from-gray-500 to-gray-400",
  };
  const uninstallMutation = useUninstallIntegrationMutation({
    onSuccess: () => setShowUninstallConfirm(false),
    onError: () => setShowUninstallConfirm(false),
  });
  const cancelMutation = useCancelIntegrationMutation({
    onSuccess: () => setShowCancelConfirm(false),
    onError: () => setShowCancelConfirm(false),
  });
  const retryMutation = useRetryIntegrationMutation({
    onSuccess: () => setShowRetryConfirm(false),
    onError: () => setShowRetryConfirm(false),
  });

  // Determine mode from integration
  const mode = integration.info?.contracts?.mode || "l2_to_l1";
  const isCrossTrade = normalizedType === "cross-trade-l2-to-l1" || normalizedType === "cross-trade-l2-to-l2";
  const isCompleted = integration.status === "Completed";


  const deployL2ChainMutation = useDeployNewL2ChainMutation({
    onSuccess: () => {
      setShowAddChainDialog(false);
    },
  });

  const registerTokensMutation = useRegisterTokensMutation({
    onSuccess: () => {
      setShowRegisterTokensDialog(false);
    },
  });

  const handleAddChain = (data: DeployNewL2ChainRequest) => {
    deployL2ChainMutation.mutate({
      stackId,
      mode: data.mode,
      l2ChainConfig: data.l2ChainConfig,
    });
  };

  const handleRegisterTokens = (data: { mode: "l2_to_l1" | "l2_to_l2"; tokens: Array<{ tokenName: string; l1TokenAddress: string; l2TokenInputs: Array<{ chainId: number; tokenAddress: string }> }> }) => {
    registerTokensMutation.mutate({
      stackId,
      mode: data.mode,
      tokens: data.tokens,
    });
  };

  const getStatusIcon = () => {
    switch (integration.status) {
      case "Completed":
        return <div className="w-4 h-4 bg-green-500 rounded-full" />;
      case "InProgress":
        return <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse" />;
      case "Pending":
        return <div className="w-4 h-4 bg-yellow-500 rounded-full" />;
      case "Failed":
        return <div className="w-4 h-4 bg-red-500 rounded-full" />;
      case "Stopped":
        return <div className="w-4 h-4 bg-gray-500 rounded-full" />;
      case "Terminating":
        return <div className="w-4 h-4 bg-orange-500 rounded-full animate-pulse" />;
      case "Terminated":
        return <div className="w-4 h-4 bg-red-900 rounded-full" />;
      case "Cancelling":
        return <div className="w-4 h-4 bg-orange-500 rounded-full animate-pulse" />;
      case "Cancelled":
        return <div className="w-4 h-4 bg-gray-600 rounded-full" />;
      case "Unknown":
        return <div className="w-4 h-4 bg-gray-500 rounded-full" />;
      default:
        return <div className="w-4 h-4 bg-gray-500 rounded-full" />;
    }
  };

  const StatusText = () => {
    switch (integration.status) {
      case "Completed":
        return "Installed";
      case "InProgress":
        return "Installing";
      case "Pending":
        return "Pending";
      case "Failed":
        return "Failed";
      case "Stopped":
        return "Stopped";
      case "Terminating":
        return "Uninstalling";
      case "Terminated":
        return "Uninstalled";
      case "Cancelling":
        return "Cancelling...";
      case "Cancelled":
        return "Cancelled";
      case "Unknown":
        return "Unknown";
      default:
        return "Unknown";
    }
  };

  const getStatusColor = () => {
    switch (integration.status) {
      case "Completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "InProgress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Failed":
        return "bg-red-100 text-red-800 border-red-200";
      case "Cancelling":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "Cancelled":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const copyToClipboard = async (text: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(itemId);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const renderIntegrationInfo = () => {
    const commonProps = {
      integration,
      copiedItem,
      copyToClipboard,
    };

    switch (integration.type) {
      case "bridge":
        return <BridgeCard {...commonProps} />;
      case "system-pulse":
        return <UptimeCard {...commonProps} />;
      case "block-explorer":
        return <BlockExplorerCard {...commonProps} />;
      case "monitoring":
        return <MonitoringCard {...commonProps} stackId={stackId} />;
      case "register-candidate":
        return <RegisterCandidateCard {...commonProps} />;
      case "cross-trade-l2-to-l1":
        return <CrossTradeCard {...commonProps} />;
      case "cross-trade-l2-to-l2":
        return <CrossTradeCard {...commonProps} />;
      case "drb":
        return <DRBCard {...commonProps} />;
      default:
        return (
          <div className="text-sm text-gray-600">
            No additional information available
          </div>
        );
    }
  };

  const renderCompactInfo = () => {
    const commonProps = { integration };

    switch (integration.type) {
      case "bridge":
        return <BridgeCompactInfo {...commonProps} />;
      case "system-pulse":
        return <UptimeCompactInfo {...commonProps} />;
      case "block-explorer":
        return <BlockExplorerCompactInfo {...commonProps} />;
      case "monitoring":
        return <MonitoringCompactInfo {...commonProps} />;
      case "register-candidate":
        return <RegisterCandidateCompactInfo {...commonProps} />;
      case "cross-trade-l2-to-l1":
        return <CrossTradeCompactInfo {...commonProps} />;
      case "cross-trade-l2-to-l2":
        return <CrossTradeCompactInfo {...commonProps} />;
      case "drb":
        return <DRBCompactInfo {...commonProps} />;
      default:
        return (
          <div className="text-sm text-gray-600">
            No additional information available
          </div>
        );
    }
  };

  return (
    <>
      <Card className="relative border-0 shadow-xl bg-white/60 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 overflow-visible">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div
                className={`w-10 h-10 shrink-0 bg-gradient-to-r ${integrationType.color} rounded-lg flex items-center justify-center text-white text-lg`}
              >
                {integrationType.icon}
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base font-semibold">
                  {integrationType.label}
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {integrationType.description}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <div className="flex items-center gap-1.5">
                <Badge className={`${getStatusColor()} flex items-center gap-1 text-xs px-2.5 py-1`}>
                  <span className="scale-90">{getStatusIcon()}</span>
                  <span className="font-medium">{StatusText()}</span>
                </Badge>
                {/* Removed register candidate exclusion now cancel should work for all integration types */}
                {/* {integration.type !== "register-candidate" && ( */}
                <>
                {(integration.status === "InProgress" || integration.status === "Pending") && (
                    <Button
                      aria-label="Cancel"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 group relative"
                      disabled={cancelMutation.isPending}
                      onClick={() => setShowCancelConfirm(true)}
                    >
                      <X className="w-4 h-4" />
                      <span className="absolute -bottom-9 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-lg">
                        Cancel
                      </span>
                    </Button>
                  )}
                  {/* {(integration.status === "Failed" || integration.status === "Cancelled") && ( */}
                  {integration.status === "Cancelled" && (
                    <Button
                      aria-label="Retry"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 group relative"
                      disabled={retryMutation.isPending}
                      onClick={() => setShowRetryConfirm(true)}
                    >
                      <RotateCw className="w-4 h-4" />
                      <span className="absolute -bottom-9 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-lg">
                        Retry
                      </span>
                    </Button>
                  )}
                  {(integration.status === "Completed" || integration.status === "Failed" || integration.status === "Cancelled") && (
                    <Button
                      aria-label="Remove"
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8 group relative"
                      disabled={uninstallMutation.isPending}
                      onClick={() => setShowUninstallConfirm(true)}
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="absolute -bottom-9 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-lg">
                        Remove
                      </span>
                    </Button>
                  )}
                </>
              </div>
              {integration.status === "Cancelling" && integration.reason && (
                <p className="text-xs text-orange-700 text-right max-w-md mt-0.5">
                  {integration.reason}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-10">{renderCompactInfo()}</CardContent>
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          {isCrossTrade && isCompleted && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddChainDialog(true)}
                className="h-8 px-3 text-xs font-medium border-gray-300 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                aria-label="Add Chain"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Add Chain
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRegisterTokensDialog(true)}
                className="h-8 px-3 text-xs font-medium border-gray-300 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                aria-label="Register Tokens"
              >
                <Coins className="w-3.5 h-3.5 mr-1.5" />
                Register Tokens
              </Button>
            </>
          )}
        </div>
        <div className="absolute bottom-3 right-3 flex items-center gap-2 h-8">
          <Button
            variant="link"
            size="sm"
            onClick={() => setShowModal(true)}
            className="h-8 p-0 text-xs hover:underline underline-offset-2 text-gray-600 hover:text-gray-900 transition-colors flex items-center"
            aria-label="View details"
          >
            <Eye className="w-3.5 h-3.5 mr-1.5" />
            View details
          </Button>
        </div>
      </Card>

      <AlertDialog
        open={showUninstallConfirm}
        onOpenChange={(open) => !open && setShowUninstallConfirm(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Uninstall Component</AlertDialogTitle>
            <AlertDialogDescription>
              {`Are you sure you want to uninstall ${
                INTEGRATION_TYPES_CONST[
                  integration.type as keyof typeof INTEGRATION_TYPES_CONST
                ].label
              }? This will initiate the uninstall process.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={uninstallMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={uninstallMutation.isPending}
              onClick={() =>
                uninstallMutation.mutate({
                  stackId: integration.stack_id,
                  type: integration.type,
                })
              }
            >
              Uninstall
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={showCancelConfirm}
        onOpenChange={(open) => !open && setShowCancelConfirm(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Installation</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                {`Are you sure you want to cancel the installation of ${
                  INTEGRATION_TYPES_CONST[
                    integration.type as keyof typeof INTEGRATION_TYPES_CONST
                  ].label
                }?`}
              </p>
              <p className="text-sm text-orange-600 font-medium">
                This will stop the installation and clean up any AWS resources that were created. This may take several minutes to complete safely.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelMutation.isPending}>
              No
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-orange-600 hover:bg-orange-700 text-white"
              disabled={cancelMutation.isPending}
              onClick={() =>
                cancelMutation.mutate({
                  stackId: integration.stack_id,
                  integrationId: integration.id,
                })
              }
            >
              Yes, Cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={showRetryConfirm}
        onOpenChange={(open) => !open && setShowRetryConfirm(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retry Installation</AlertDialogTitle>
            <AlertDialogDescription>
              {`Are you sure you want to retry the installation of ${
                INTEGRATION_TYPES_CONST[
                  integration.type as keyof typeof INTEGRATION_TYPES_CONST
                ].label
              }? This will start a new installation attempt.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={retryMutation.isPending}>
              No
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={retryMutation.isPending}
              onClick={() =>
                retryMutation.mutate({
                  stackId: integration.stack_id,
                  integrationId: integration.id,
                })
              }
            >
              Yes, Retry
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="w-auto min-w-[600px] max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div
                className={`w-10 h-10 bg-gradient-to-r ${integrationType.color} rounded-lg flex items-center justify-center text-white text-lg`}
              >
                {integrationType.icon}
              </div>
              <div>
                <div className="text-xl font-semibold">
                  {integrationType.label}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    className={`${getStatusColor()} flex items-center gap-1`}
                  >
                    {getStatusIcon()}
                    {integration.status}
                  </Badge>
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {renderIntegrationInfo()}

            {integration.reason && (
              <div className="pt-3 border-t">
                <span className="font-medium text-gray-600 text-sm">
                  Reason:
                </span>
                <p className="text-sm text-gray-900 mt-1">
                  {integration.reason}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {isCrossTrade && isCompleted && (
        <>
          <AddChainDialog
            open={showAddChainDialog}
            onOpenChange={setShowAddChainDialog}
            onSubmit={handleAddChain}
            isPending={deployL2ChainMutation.isPending}
            mode={mode}
            stackId={stackId}
          />
          <RegisterTokensDialog
            open={showRegisterTokensDialog}
            onOpenChange={setShowRegisterTokensDialog}
            onSubmit={handleRegisterTokens}
            isPending={registerTokensMutation.isPending}
            mode={mode}
            integration={integration}
          />
        </>
      )}
    </>
  );
}