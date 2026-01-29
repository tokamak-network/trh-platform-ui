"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dices, ArrowUpRight, Server, Database } from "lucide-react";
import { InstallDRBDialog } from "./InstallDRBDialog";
import { useDRBDeploymentInfo, useThanosSepolia } from "../api/queries";

interface NetworkConfig {
  rpcUrl: string;
  chainId: number;
  name: string;
  explorerUrl?: string;
}

interface DRBServiceCardProps {
  stackId?: string; // Optional - will use Thanos Sepolia system stack if not provided
  chainName: string;
  deployedNetwork?: NetworkConfig;
}

const statusStyles: Record<string, { label: string; className: string }> = {
  Available: { label: "Available", className: "bg-neutral-100 text-neutral-600" },
  Installing: { label: "Installing", className: "bg-primary-100 text-primary-700 animate-pulse" },
  Terminating: { label: "Removing", className: "bg-warning-100 text-warning-700 animate-pulse" },
  Cancelling: { label: "Cancelling", className: "bg-warning-100 text-warning-700 animate-pulse" },
  Active: { label: "Active", className: "bg-success-50 text-success-600" },
  Failed: { label: "Failed", className: "bg-error-50 text-error-600" },
  Cancelled: { label: "Cancelled", className: "bg-neutral-100 text-neutral-600" },
};

export function DRBServiceCard({
  stackId: propStackId,
  chainName,
  deployedNetwork,
}: DRBServiceCardProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);

  // If no stackId provided, use Thanos Sepolia system stack
  const { data: systemStack, isLoading: isLoadingSystemStack, error: systemStackError } = useThanosSepolia();
  const resolvedStackId = propStackId || systemStack?.id;
  const isLoadingStack = !propStackId && isLoadingSystemStack;
  const hasSystemStackError = !propStackId && !!systemStackError;

  // Get real deployment status from API
  const { isCompleted, isInProgress, isFailed, isTerminating, isCancelling, isCancelled } = useDRBDeploymentInfo(resolvedStackId || "");

  const status = isCompleted
    ? "Active"
    : isInProgress
    ? "Installing"
    : isTerminating
    ? "Terminating"
    : isCancelling
    ? "Cancelling"
    : isFailed
    ? "Failed"
    : isCancelled
    ? "Cancelled"
    : "Available";
  const statusConfig = statusStyles[status];

  const handleViewDetails = () => {
    if (!resolvedStackId) return;
    router.push(`/rollup/${resolvedStackId}?tab=deployments`);
  };

  return (
    <>
      <article className="group relative w-full max-w-sm overflow-hidden rounded-xl border border-neutral-200 bg-white transition-all hover:border-neutral-300 hover:shadow-lg">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-400 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

        <div className="p-5">
          <header className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-900 text-white">
                <Dices className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">DRB</h3>
                <p className="text-xs text-neutral-500">Randomness Beacon</p>
              </div>
            </div>
            <Badge className={cn("text-xs font-medium", statusConfig.className)}>
              {statusConfig.label}
            </Badge>
          </header>

          <p className="mb-4 text-sm leading-relaxed text-neutral-600">
            Verifiable on-chain randomness via Commit-Reveal2 protocol. Deploy on any EVM chain.
          </p>

          <div className="mb-4 grid grid-cols-2 gap-2">
            <Spec icon={Server} label="Nodes" value="Leader Node" />
            <Spec icon={Database} label="Storage" value="PostgreSQL" />
          </div>

          {deployedNetwork && (
            <div className="mb-4 rounded-lg border border-primary-100 bg-primary-50/50 px-3 py-2">
              <span className="text-xs text-neutral-500">Target Chain</span>
              <p className="font-mono text-sm text-primary-700">
                {deployedNetwork.name}
                <span className="ml-2 text-neutral-400">#{deployedNetwork.chainId}</span>
              </p>
            </div>
          )}

          <footer className="flex items-center justify-between pt-2">
            <a
              href="https://github.com/tokamak-network/Commit-Reveal2"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-neutral-500 transition-colors hover:text-neutral-900"
            >
              Documentation
              <ArrowUpRight className="h-3 w-3" />
            </a>

            {isCompleted ? (
              <Button variant="outline" size="sm" onClick={handleViewDetails}>
                View Details
              </Button>
            ) : isInProgress ? (
              <Button variant="outline" size="sm" onClick={handleViewDetails}>
                View Progress
              </Button>
            ) : isTerminating || isCancelling ? (
              <Button variant="outline" size="sm" disabled>
                {isTerminating ? "Removing..." : "Cancelling..."}
              </Button>
            ) : hasSystemStackError ? (
              <Button size="sm" variant="destructive" disabled>
                Error Loading
              </Button>
            ) : (
              <Button size="sm" onClick={() => setDialogOpen(true)} disabled={isLoadingStack}>
                {isLoadingStack ? "Loading..." : "Deploy"}
              </Button>
            )}
          </footer>
        </div>
      </article>

      <InstallDRBDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        stackId={resolvedStackId}
        chainName={chainName}
        deployedNetwork={deployedNetwork}
      />
    </>
  );
}

function Spec({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md bg-neutral-50 px-2.5 py-2">
      <Icon className="h-3.5 w-3.5 text-neutral-400" />
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-neutral-900">{value}</p>
        <p className="text-[10px] text-neutral-500">{label}</p>
      </div>
    </div>
  );
}
