"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle, ExternalLink, Trash2, Settings } from "lucide-react";
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
  useDisableEmailAlertMutation, 
  useDisableTelegramAlertMutation,
  useConfigureTelegramAlertMutation,
  useConfigureEmailAlertMutation,
} from "../api/mutations";
import ConfigureTelegramAlertDialog, { TelegramAlertFormData } from "./ConfigureTelegramAlertDialog";
import ConfigureEmailAlertDialog, { EmailAlertFormData } from "./ConfigureEmailAlertDialog";

interface MonitoringCardProps {
  integration: {
    info?: {
      url?: string;
      username?: string;
      password?: string;
      alert_manager?: {
        email?: {
          enabled: boolean;
          smtpFrom: string;
          smtpSmarthost: string;
          alertReceivers: string[];
          smtpAuthPassword: string;
        };
        telegram?: {
          enabled: boolean;
          apiToken: string;
          criticalReceivers: {
            ChatId: string;
          }[];
        };
      };
    };
    config?: {
      loggingEnabled?: boolean;
    };
    log_path?: string;
  };
  stackId: string;
  copiedItem: string | null;
  copyToClipboard: (text: string, itemId: string) => void;
}

export function MonitoringCard({ integration, stackId, copiedItem, copyToClipboard }: MonitoringCardProps) {
  const [showEmailConfirm, setShowEmailConfirm] = useState(false);
  const [showTelegramConfirm, setShowTelegramConfirm] = useState(false);
  const [showConfigureTelegram, setShowConfigureTelegram] = useState(false);
  const [showConfigureEmail, setShowConfigureEmail] = useState(false);
  
  const disableEmailMutation = useDisableEmailAlertMutation({
    onSuccess: () => setShowEmailConfirm(false),
    onError: () => setShowEmailConfirm(false),
  });
  const disableTelegramMutation = useDisableTelegramAlertMutation({
    onSuccess: () => setShowTelegramConfirm(false),
    onError: () => setShowTelegramConfirm(false),
  });
  const configureTelegramMutation = useConfigureTelegramAlertMutation({
    onSuccess: () => setShowConfigureTelegram(false),
    onError: () => setShowConfigureTelegram(false),
  });
  const configureEmailMutation = useConfigureEmailAlertMutation({
    onSuccess: () => setShowConfigureEmail(false),
    onError: () => setShowConfigureEmail(false),
  });

  const handleDisableEmail = () => {
    disableEmailMutation.mutate({ stackId });
  };

  const handleDisableTelegram = () => {
    disableTelegramMutation.mutate({ stackId });
  };

  const handleConfigureTelegram = (data: TelegramAlertFormData) => {
    configureTelegramMutation.mutate({
      stackId,
      apiToken: data.apiToken,
      criticalReceivers: data.criticalReceivers,
    });
  };

  const handleConfigureEmail = (data: EmailAlertFormData) => {
    configureEmailMutation.mutate({
      stackId,
      smtpSmarthost: data.smtpSmarthost,
      smtpFrom: data.smtpFrom,
      smtpAuthPassword: data.smtpAuthPassword,
      alertReceivers: data.alertReceivers,
    });
  };

  return (
    <div className="space-y-4">
      {integration.info?.url && (
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
                onClick={() =>
                  copyToClipboard(integration.info?.url || "", "url")
                }
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
                onClick={() => window.open(integration.info?.url || "", "_blank")}
                className="h-6 w-6 p-0"
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Summary */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="font-medium text-gray-600">Logging:</span>
          <span className="ml-2 text-gray-900">
            {integration.config?.loggingEnabled ? "Enabled" : "Disabled"}
          </span>
        </div>
        {(integration.info?.username || integration.info?.password) && (
          <>
            {integration.info.username && (
              <div>
                <span className="font-medium text-gray-600">Username:</span>
                <div className="flex items-center gap-2">
                  <p className="text-gray-900">{integration.info.username}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(
                        integration.info?.username || "",
                        "monitoring_username"
                      )
                    }
                    className="h-6 w-6 p-0"
                  >
                    {copiedItem === "monitoring_username" ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              </div>
            )}
            {integration.info?.password && (
              <div>
                <span className="font-medium text-gray-600">Password:</span>
                <div className="flex items-center gap-2">
                  <p className="text-gray-900">{integration.info.password}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(
                        integration.info?.password || "",
                        "monitoring_password"
                      )
                    }
                    className="h-6 w-6 p-0"
                  >
                    {copiedItem === "monitoring_password" ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Alert Manager Section */}
      <div className="border-t pt-3">
        <h4 className="font-medium text-gray-900 mb-2">Alert Manager</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {integration.info?.alert_manager?.email && (
              <div className="p-3 rounded-lg bg-gray-50 border">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-gray-700">Email Alerts</div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowConfigureEmail(true)}
                      disabled={configureEmailMutation.isPending}
                      className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      title="Configure email alerts"
                    >
                      <Settings className="w-3 h-3" />
                    </Button>
                    {integration.info?.alert_manager?.email?.enabled && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowEmailConfirm(true)}
                        disabled={disableEmailMutation.isPending}
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Disable email alerts"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      integration.info?.alert_manager?.email?.enabled
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {integration.info?.alert_manager?.email?.enabled
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </div>
                  {integration.info?.alert_manager?.email?.enabled && (
                    <>
                      <div>
                        <span className="text-gray-600">SMTP Server:</span>
                        <span className="ml-2 text-gray-900 font-mono text-xs">
                          {integration.info?.alert_manager?.email?.smtpSmarthost}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">From:</span>
                        <span className="ml-2 text-gray-900">
                          {integration.info?.alert_manager?.email?.smtpFrom}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Alert Receivers:</span>
                        <span className="ml-2 text-gray-900">
                          {integration.info?.alert_manager?.email
                            ?.alertReceivers &&
                          integration.info?.alert_manager?.email?.alertReceivers
                            .length > 0
                            ? integration.info?.alert_manager?.email?.alertReceivers.join(
                                ", "
                              )
                            : "None"}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
            {integration.info?.alert_manager?.telegram && (
              <div className="p-3 rounded-lg bg-gray-50 border">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-gray-700">Telegram Alerts</div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowConfigureTelegram(true)}
                      disabled={configureTelegramMutation.isPending}
                      className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      title="Configure telegram alerts"
                    >
                      <Settings className="w-3 h-3" />
                    </Button>
                    {integration.info?.alert_manager?.telegram?.enabled && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowTelegramConfirm(true)}
                        disabled={disableTelegramMutation.isPending}
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Disable telegram alerts"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      integration.info?.alert_manager?.telegram?.enabled
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {integration.info?.alert_manager?.telegram?.enabled
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </div>
                  {integration.info?.alert_manager?.telegram?.enabled && (
                    <div>
                      <span className="text-gray-600">Critical Receivers:</span>
                      <span className="ml-2 text-gray-900">
                        {integration.info?.alert_manager?.telegram
                          ?.criticalReceivers &&
                        integration.info?.alert_manager?.telegram
                          ?.criticalReceivers?.length > 0
                          ? integration.info?.alert_manager?.telegram?.criticalReceivers
                              .map((receiver) => receiver.ChatId)
                              .join(", ")
                          : "None"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

        </div>
      </div>

      {integration.log_path && (
        <div className="border-t pt-3">
          <span className="font-medium text-gray-600">Log Path:</span>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-gray-900 font-mono text-xs break-all flex-1">
              {integration.log_path}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                copyToClipboard(integration.log_path || "", "log_path")
              }
              className="h-6 w-6 p-0"
            >
              {copiedItem === "log_path" ? (
                <CheckCircle className="w-3 h-3" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Email Alert Disable Confirmation */}
      <AlertDialog open={showEmailConfirm} onOpenChange={setShowEmailConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable Email Alerts</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disable email alerts for this monitoring integration? 
              You will no longer receive email notifications for alerts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisableEmail}
              disabled={disableEmailMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {disableEmailMutation.isPending ? "Disabling..." : "Disable Email Alerts"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Telegram Alert Disable Confirmation */}
      <AlertDialog open={showTelegramConfirm} onOpenChange={setShowTelegramConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable Telegram Alerts</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disable Telegram alerts for this monitoring integration? 
              You will no longer receive Telegram notifications for critical alerts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisableTelegram}
              disabled={disableTelegramMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {disableTelegramMutation.isPending ? "Disabling..." : "Disable Telegram Alerts"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Configure Telegram Alert Dialog */}
      <ConfigureTelegramAlertDialog
        open={showConfigureTelegram}
        onOpenChange={setShowConfigureTelegram}
        onSubmit={handleConfigureTelegram}
        isPending={configureTelegramMutation.isPending}
        initialData={{
          apiToken: integration.info?.alert_manager?.telegram?.apiToken,
          criticalReceivers: integration.info?.alert_manager?.telegram?.criticalReceivers,
        }}
      />

      {/* Configure Email Alert Dialog */}
      <ConfigureEmailAlertDialog
        open={showConfigureEmail}
        onOpenChange={setShowConfigureEmail}
        onSubmit={handleConfigureEmail}
        isPending={configureEmailMutation.isPending}
        initialData={{
          smtpSmarthost: integration.info?.alert_manager?.email?.smtpSmarthost,
          smtpFrom: integration.info?.alert_manager?.email?.smtpFrom,
          smtpAuthPassword: integration.info?.alert_manager?.email?.smtpAuthPassword,
          alertReceivers: integration.info?.alert_manager?.email?.alertReceivers,
        }}
      />
    </div>
  );
}

export function MonitoringCompactInfo({ integration }: { 
  integration: { 
    info?: { 
      url?: string; 
      username?: string; 
      password?: string; 
    }; 
  }; 
}) {
  return (
    <div className="text-sm text-gray-600">
      {integration.info?.url && (
        <p className="truncate">
          <span className="font-medium">URL:</span>{" "}
          <a href={integration.info.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            {integration.info.url}
          </a>
        </p>
      )}
      {(integration.info?.username || integration.info?.password) && (
        <p className="truncate">
          <span className="font-medium">Creds:</span>{" "}
          {integration.info.username || ""}
          {integration.info?.username && integration.info?.password
            ? " / "
            : ""}
          {integration.info?.password || ""}
        </p>
      )}
    </div>
  );
}
