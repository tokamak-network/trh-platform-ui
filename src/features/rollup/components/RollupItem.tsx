"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  ExternalLink,
  Trash2,
  Clock,
  Globe,
  Server,
  Layers,
  RotateCcw,
  Pause,
  CheckCircle,
  Loader,
  RefreshCw,
  X,
  AlertCircle,
  HelpCircle,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { statusConfig } from "../schemas/rollup";
import { ThanosStack, ThanosStackStatus } from "../schemas/thanos";
import { getLastActivityTime, formatRelativeTime } from "../utils/dateUtils";
import {
  useDeleteRollupMutation,
  useResumeRollupMutation,
  useStopRollupMutation,
} from "../api/mutations";

// Icon mapping for status
const STATUS_ICONS: Record<string, LucideIcon> = {
  CheckCircle,
  Clock,
  Pause,
  Loader,
  RefreshCw,
  Trash2,
  X,
  AlertCircle,
  HelpCircle,
};

const STATUS_COLORS: Record<ThanosStackStatus, string> = {
  [ThanosStackStatus.PENDING]: "bg-yellow-500",
  [ThanosStackStatus.DEPLOYED]: "bg-green-500",
  [ThanosStackStatus.STOPPED]: "bg-gray-400",
  [ThanosStackStatus.DEPLOYING]: "bg-blue-500",
  [ThanosStackStatus.UPDATING]: "bg-blue-500",
  [ThanosStackStatus.TERMINATING]: "bg-orange-500",
  [ThanosStackStatus.TERMINATED]: "bg-gray-400",
  [ThanosStackStatus.FAILED_TO_DEPLOY]: "bg-red-500",
  [ThanosStackStatus.FAILED_TO_UPDATE]: "bg-red-500",
  [ThanosStackStatus.FAILED_TO_TERMINATE]: "bg-red-500",
  [ThanosStackStatus.UNKNOWN]: "bg-gray-400",
};

function formatRollupType(type: string): string {
  const typeMap: Record<string, string> = {
    "optimistic-rollup": "Optimistic",
    "zk-rollup": "ZK Rollup",
  };
  return typeMap[type.toLowerCase()] || type;
}

interface RollupItemProps {
  stack: ThanosStack;
  onClick?: (id: string) => void;
  showActions?: boolean;
  className?: string;
}

export function RollupItem({
  stack,
  onClick,
  showActions = true,
  className,
}: RollupItemProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [resumeOpen, setResumeOpen] = useState(false);
  const [stopOpen, setStopOpen] = useState(false);

  const deleteMutation = useDeleteRollupMutation();
  const resumeMutation = useResumeRollupMutation();
  const stopMutation = useStopRollupMutation();

  const status = statusConfig[stack.status];
  const StatusIcon = STATUS_ICONS[status.icon];

  const canResume = [
    ThanosStackStatus.STOPPED,
    ThanosStackStatus.TERMINATED,
    ThanosStackStatus.FAILED_TO_DEPLOY,
    ThanosStackStatus.FAILED_TO_UPDATE,
    ThanosStackStatus.FAILED_TO_TERMINATE,
  ].includes(stack.status);

  const canStop = stack.status === ThanosStackStatus.DEPLOYING;

  const canDestroy = ![
    ThanosStackStatus.DEPLOYING,
    ThanosStackStatus.UPDATING,
    ThanosStackStatus.TERMINATING,
    ThanosStackStatus.TERMINATED,
    ThanosStackStatus.PENDING,
  ].includes(stack.status) && !deleteMutation.isPending;

  const lastActivity = formatRelativeTime(
    getLastActivityTime(stack.created_at, stack.updated_at, stack.deleted_at)
  );

  const rollupType = formatRollupType(
    stack.type || stack.config?.type || "Unknown"
  );

  const externalLinks = [
    { label: "L2", url: stack.metadata?.l2_url },
    { label: "Bridge", url: stack.metadata?.bridge_url },
    { label: "Explorer", url: stack.metadata?.block_explorer_url },
  ].filter((link) => link.url);

  return (
    <>
      <Card
        className={cn(
          "transition-shadow",
          onClick && "hover:shadow-md cursor-pointer",
          className
        )}
        onClick={onClick ? () => onClick(stack.id) : undefined}
      >
        <CardContent className="p-4">
          <article className="flex items-center justify-between gap-4">
            {/* Left: Status + Info */}
            <div className="flex items-center gap-3 min-w-0">
              <span
                className={cn(
                  "w-2.5 h-2.5 rounded-full shrink-0",
                  STATUS_COLORS[stack.status]
                )}
              />
              <div className="min-w-0">
                <h3 className="font-medium truncate">{stack.config.chainName}</h3>
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  <Badge variant={status.variant} className={cn("text-xs", status.color)}>
                    {StatusIcon && <StatusIcon className="w-3 h-3 mr-1" />}
                    {status.label}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Globe className="w-3 h-3 mr-1" />
                    {stack.network}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Layers className="w-3 h-3 mr-1" />
                    {rollupType}
                  </Badge>
                  <Badge variant="outline" className="text-xs text-gray-500">
                    <Clock className="w-3 h-3 mr-1" />
                    {lastActivity}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            {showActions && (
              <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                {externalLinks.map((link) => (
                  <Button
                    key={link.label}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => window.open(link.url, "_blank")}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    {link.label}
                  </Button>
                ))}

                {canStop && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          onClick={() => setStopOpen(true)}
                        >
                          <Pause className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Stop Deployment</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                {canResume && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => setResumeOpen(true)}
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Resume</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 disabled:opacity-40"
                        disabled={!canDestroy}
                        onClick={() => setDeleteOpen(true)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Destroy</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </article>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AlertDialog open={stopOpen} onOpenChange={setStopOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Stop Deployment</AlertDialogTitle>
            <AlertDialogDescription>
              Stop deployment of {stack.config.chainName}? You can resume later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-orange-600 hover:bg-orange-700"
              onClick={() => {
                stopMutation.mutate(stack.id);
                setStopOpen(false);
              }}
            >
              Stop
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={resumeOpen} onOpenChange={setResumeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resume Rollup</AlertDialogTitle>
            <AlertDialogDescription>
              Resume deployment of {stack.config.chainName}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                resumeMutation.mutate(stack.id);
                setResumeOpen(false);
              }}
            >
              Resume
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Destroy Rollup</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently destroy {stack.config.chainName}? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={!canDestroy}
              onClick={() => {
                deleteMutation.mutate(stack.id);
                setDeleteOpen(false);
              }}
            >
              Destroy
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Re-export utilities for other components
export { formatRollupType, STATUS_ICONS as IconMap };
export const StatusIcon = ({ iconName }: { iconName: string }) => {
  const Icon = STATUS_ICONS[iconName];
  return Icon ? <Icon className="w-3 h-3" /> : null;
};
export const getStatusBadge = (status: ThanosStackStatus) => (
  <span className={cn("w-3 h-3 rounded-full", STATUS_COLORS[status])} />
);
