"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ExternalLink,
  Copy,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Eye,
} from "lucide-react";
import { Integration, INTEGRATION_TYPES } from "../../../schemas/integration";
import { useState } from "react";

interface IntegrationCardProps {
  integration: Integration;
}

export function IntegrationCard({ integration }: IntegrationCardProps) {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const integrationType = INTEGRATION_TYPES[integration.type];

  const getStatusIcon = () => {
    switch (integration.status) {
      case "Completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "InProgress":
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case "Pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "Failed":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
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
    if (
      integration.type === "register-candidate" &&
      integration.info.candidate_registration
    ) {
      const reg = integration.info.candidate_registration;
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">Candidate Name:</span>
              <p className="text-gray-900">{reg.candidate_name}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Staking Amount:</span>
              <p className="text-gray-900">{reg.staking_amount} TON</p>
            </div>
            <div className="col-span-2">
              <span className="font-medium text-gray-600">Memo:</span>
              <p className="text-gray-900">{reg.candidate_memo}</p>
            </div>
            <div className="col-span-2">
              <span className="font-medium text-gray-600">
                Registration Time:
              </span>
              <p className="text-gray-900">{reg.registration_time}</p>
            </div>
            <div className="col-span-2">
              <span className="font-medium text-gray-600">
                Rollup Config Address:
              </span>
              <div className="flex items-center gap-2">
                <p className="text-gray-900 font-mono text-xs truncate flex-1">
                  {reg.rollup_config_address}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(
                      reg.rollup_config_address,
                      "rollup_config_address"
                    )
                  }
                  className="h-6 w-6 p-0"
                >
                  {copiedItem === "rollup_config_address" ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {integration.info.safe_wallet && (
            <div className="border-t pt-3">
              <h4 className="font-medium text-gray-900 mb-2">Safe Wallet</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Address:</span>
                  <div className="flex items-center gap-2">
                    <p className="text-gray-900 font-mono text-xs truncate flex-1">
                      {integration.info.safe_wallet.address}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          integration.info.safe_wallet!.address,
                          "safe_wallet_address"
                        )
                      }
                      className="h-6 w-6 p-0"
                    >
                      {copiedItem === "safe_wallet_address" ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Threshold:</span>
                  <p className="text-gray-900">
                    {integration.info.safe_wallet.threshold} of{" "}
                    {integration.info.safe_wallet.owners.length}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Owners:</span>
                  <div className="space-y-1">
                    {integration.info.safe_wallet.owners.map((owner, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <p className="text-gray-900 font-mono text-xs truncate flex-1">
                          {owner}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(owner, `safe_wallet_owner_${index}`)
                          }
                          className="h-6 w-6 p-0"
                        >
                          {copiedItem === `safe_wallet_owner_${index}` ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (integration.info.url) {
      return (
        <div className="space-y-3">
          <div>
            <span className="font-medium text-gray-600">URL:</span>
            <div className="flex items-start gap-2 mt-1">
              <p className="text-gray-900 font-mono text-sm break-all flex-1">
                {integration.info.url}
              </p>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(integration.info.url!, "url")}
                  className="h-6 w-6 p-0"
                >
                  {copiedItem === "url" ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(integration.info.url, "_blank")}
                  className="h-6 w-6 p-0"
                >
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="text-sm text-gray-600">
        No additional information available
      </div>
    );
  };

  const renderCompactInfo = () => {
    if (
      integration.type === "register-candidate" &&
      integration.info.candidate_registration
    ) {
      const reg = integration.info.candidate_registration;
      return (
        <div className="text-sm text-gray-600">
          <p>
            <span className="font-medium">Candidate:</span> {reg.candidate_name}
          </p>
          <p>
            <span className="font-medium">Stake:</span> {reg.staking_amount} TON
          </p>
        </div>
      );
    }

    if (integration.info.url) {
      return (
        <div className="text-sm text-gray-600">
          <p className="truncate">
            <span className="font-medium">URL:</span> {integration.info.url}
          </p>
        </div>
      );
    }

    return (
      <div className="text-sm text-gray-600">
        No additional information available
      </div>
    );
  };

  return (
    <>
      <Card className="border-0 shadow-xl bg-white/60 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
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
                {integration.status}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {renderCompactInfo()}

          {/* Show Details button */}
          <div className="mt-4 pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowModal(true)}
              className="w-full justify-center text-xs py-1"
            >
              <Eye className="w-3 h-3 mr-1" />
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Details Modal */}
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
