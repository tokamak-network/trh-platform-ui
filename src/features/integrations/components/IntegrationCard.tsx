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
} from "lucide-react";
import { useUninstallIntegrationMutation } from "../api";
import { INTEGRATION_TYPES as INTEGRATION_TYPES_CONST } from "../schemas";

// Import plugin-specific components
import { BridgeCard, BridgeCompactInfo } from "./BridgeCard";
import { BlockExplorerCard, BlockExplorerCompactInfo } from "./BlockExplorerCard";
import { MonitoringCard, MonitoringCompactInfo } from "./MonitoringCard";
import { RegisterCandidateCard, RegisterCandidateCompactInfo } from "./RegisterCandidateCard";
import { CrossTradeCard } from "./CrossTrade";
import { CrossTradeCompactInfo } from "./CrossTradeCard";

interface IntegrationCardProps {
  integration: Integration;
  stackId: string;
}

export function IntegrationCard({ integration, stackId }: IntegrationCardProps) {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showUninstallConfirm, setShowUninstallConfirm] = useState(false);
  
  // Normalize integration type - handle old "cross-trade" type from API
  const normalizedType: Exclude<Integration["type"], "cross-trade"> = (() => {
    if (integration.type === "cross-trade") {
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

    switch (normalizedType) {
      case "bridge":
        return <BridgeCard {...commonProps} />;
      case "block-explorer":
        return <BlockExplorerCard {...commonProps} />;
      case "monitoring":
        return <MonitoringCard {...commonProps} stackId={stackId} />;
      case "register-candidate":
        return <RegisterCandidateCard {...commonProps} />;
      case "cross-trade-l2-to-l1":
      case "cross-trade-l2-to-l2":
        return <CrossTradeCard {...commonProps} />;
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

    switch (normalizedType) {
      case "bridge":
        return <BridgeCompactInfo {...commonProps} />;
      case "block-explorer":
        return <BlockExplorerCompactInfo {...commonProps} />;
      case "monitoring":
        return <MonitoringCompactInfo {...commonProps} />;
      case "register-candidate":
        return <RegisterCandidateCompactInfo {...commonProps} />;
      case "cross-trade-l2-to-l1":
      case "cross-trade-l2-to-l2":
        return <CrossTradeCompactInfo {...commonProps} />;
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
      <Card className="relative border-0 shadow-xl bg-white/60 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 bg-gradient-to-r ${integrationType.color} rounded-lg flex items-center justify-center text-white text-lg`}
              >
                {integrationType.icon}
              </div>
              <div>
                <CardTitle className="text-lg">
                  {integrationType.label}
                </CardTitle>
                <p className="text-sm text-gray-600">
                  {integrationType.description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`${getStatusColor()} flex items-center gap-1`}>
                {getStatusIcon()}
                {StatusText()}
              </Badge>
              {normalizedType !== "register-candidate" && (
                <Button
                  aria-label="Uninstall"
                  variant="destructive"
                  size="icon"
                  className="h-7 w-7"
                  disabled={
                    uninstallMutation.isPending ||
                    (integration.status !== "Completed" &&
                      integration.status !== "Failed")
                  }
                  onClick={() => setShowUninstallConfirm(true)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-10">{renderCompactInfo()}</CardContent>
        <Button
          variant="link"
          size="sm"
          onClick={() => setShowModal(true)}
          className="absolute bottom-3 right-3 h-auto p-0 text-xs hover:underline underline-offset-2"
          aria-label="View details"
        >
          <Eye className="w-3 h-3 mr-1" />
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
                  normalizedType as keyof typeof INTEGRATION_TYPES_CONST
                ]?.label || integrationType.label
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
              onClick={() => {
                uninstallMutation.mutate({
                  stackId: integration.stack_id,
                  type: normalizedType,
                  id: integration.id,
                });
              }}
            >
              Uninstall
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
    </>
  );
}
