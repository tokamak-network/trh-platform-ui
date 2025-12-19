"use client";

import React, { useState } from "react";
import Image from "next/image";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Integration, INTEGRATION_TYPES } from "../schemas";
import {
  Eye,
  X,
  RotateCw,
} from "lucide-react";
import { useUninstallIntegrationMutation, useCancelIntegrationMutation, useRetryIntegrationMutation } from "../api";
import { INTEGRATION_TYPES as INTEGRATION_TYPES_CONST } from "../schemas";

// Import plugin-specific components
import { BridgeCard, BridgeCompactInfo } from "./BridgeCard";
import { BinButton } from "./BinButton";
import { StatusIndicator } from "./StatusIndicator";
import { UptimeCard, UptimeCompactInfo } from "./UptimeCard";
import { BlockExplorerCard, BlockExplorerCompactInfo } from "./BlockExplorerCard";
import { MonitoringCard, MonitoringCompactInfo } from "./MonitoringCard";
import { RegisterCandidateCard, RegisterCandidateCompactInfo } from "./RegisterCandidateCard";

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
  const integrationType = INTEGRATION_TYPES[integration.type];
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
      default:
        return (
          <div className="text-sm text-gray-600">
            No additional information available
          </div>
        );
    }
  };

  const canCancel = integration.status === "InProgress" || integration.status === "Pending";
  const canRetry = integration.status === "Cancelled";
  const canRemove = integration.status === "Completed" || integration.status === "Failed" || integration.status === "Cancelled";

  return (
    <>
      <Card className="relative border border-gray-200 rounded-xl shadow-sm bg-white hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Image src={integrationType.logo} alt={integrationType.label} width={44} height={44} className="shrink-0" />
              <CardTitle className="text-base font-semibold leading-tight">{integrationType.label}</CardTitle>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <StatusIndicator status={integration.status} label={StatusText()} />
              {canCancel && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={cancelMutation.isPending}
                      onClick={() => setShowCancelConfirm(true)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Cancel</TooltipContent>
                </Tooltip>
              )}
              {canRetry && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={retryMutation.isPending}
                      onClick={() => setShowRetryConfirm(true)}
                    >
                      <RotateCw className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Retry</TooltipContent>
                </Tooltip>
              )}
              {canRemove && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <BinButton
                      onClick={() => setShowUninstallConfirm(true)}
                      disabled={uninstallMutation.isPending}
                    />
                  </TooltipTrigger>
                  <TooltipContent>Remove</TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">{integrationType.description}</p>
          {integration.status === "Cancelling" && integration.reason && (
            <p className="text-xs text-orange-600 mt-2 bg-orange-50 px-2 py-1 rounded">{integration.reason}</p>
          )}
        </CardHeader>
        <CardContent className="pt-0 pb-12">{renderCompactInfo()}</CardContent>
        <Button
          variant="ghost"
          size="sm"
          className="absolute bottom-3 right-3 text-xs text-blue-500 hover:text-blue-700"
          onClick={() => setShowModal(true)}
        >
          <Eye className="w-3.5 h-3.5 mr-1" />
          View details
        </Button>
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
            <AlertDialogDescription asChild>
              <div className="space-y-2">
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
              </div>
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
              <Image
                src={integrationType.logo}
                alt={integrationType.label}
                width={48}
                height={48}
              />
              <div>
                <div className="text-xl font-semibold">
                  {integrationType.label}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <StatusIndicator
                    status={integration.status}
                    label={integration.status}
                  />
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
    </>
  );
}
