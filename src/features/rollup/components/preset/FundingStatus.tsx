"use client";

import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFundingStatus } from "../../hooks/useFundingStatus";
import type { FundingStatus as FundingStatusType } from "../../schemas/preset";
import { toast } from "react-hot-toast";

const STATUS_LABELS: Record<FundingStatusType, string> = {
  pending: "Pending",
  funding: "Awaiting Funds",
  ready: "Ready to Deploy",
  deploying: "Deploying",
  completed: "Completed",
  failed: "Failed",
};

const ROLE_LABELS: Record<string, string> = {
  deployer: "Deployer",
  batcher: "Batcher",
  proposer: "Proposer",
  challenger: "Challenger",
};

interface FundingStatusProps {
  deploymentId?: string;
  network: "testnet" | "mainnet";
  onAllFulfilled?: () => void;
}

export function FundingStatus({
  deploymentId,
  network,
  onAllFulfilled,
}: FundingStatusProps) {
  const { accounts, allFulfilled, status, message, txHash, isLoading } =
    useFundingStatus(deploymentId);

  const fulfilledCount = accounts.filter((a) => a.fulfilled).length;
  const progressPct =
    accounts.length > 0 ? (fulfilledCount / accounts.length) * 100 : 0;

  const copyAddress = async (address: string) => {
    await navigator.clipboard.writeText(address);
    toast.success("Address copied!");
  };

  // Notify parent when all fulfilled
  useEffect(() => {
    if (allFulfilled && onAllFulfilled) {
      onAllFulfilled();
    }
  }, [allFulfilled, onAllFulfilled]);

  if (!deploymentId) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex flex-col items-center gap-3 text-gray-400">
            <Clock className="h-8 w-8" />
            <p className="text-sm">Funding status will appear after deployment is initiated.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Funding Status</CardTitle>
          <Badge
            variant={
              status === "ready" || status === "completed"
                ? "default"
                : status === "failed"
                ? "destructive"
                : "secondary"
            }
          >
            {STATUS_LABELS[status]}
          </Badge>
        </div>
        {accounts.length > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-sm text-gray-500">
              <span>{fulfilledCount} of {accounts.length} accounts funded</span>
              <span>{progressPct.toFixed(0)}%</span>
            </div>
            <Progress value={progressPct} className="h-2" />
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && accounts.length === 0 && (
          <div className="flex items-center gap-2 text-gray-400 py-4 justify-center">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Checking funding status...</span>
          </div>
        )}

        {accounts.map((account) => (
          <div
            key={account.role}
            className={cn(
              "flex items-center justify-between rounded-lg border p-3",
              account.fulfilled
                ? "border-green-200 bg-green-50"
                : "border-gray-200 bg-gray-50"
            )}
          >
            <div className="flex items-center gap-3">
              {account.fulfilled ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
              ) : (
                <Clock className="h-5 w-5 text-gray-400 flex-shrink-0" />
              )}
              <div>
                <p className="font-medium text-sm">
                  {ROLE_LABELS[account.role] ?? account.role}
                </p>
                <p className="text-xs text-gray-500 font-mono">
                  {account.address.slice(0, 10)}...{account.address.slice(-6)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-sm font-medium">
                  {account.currentEth} / {account.requiredEth} ETH
                </p>
                <Badge
                  variant={account.fulfilled ? "default" : "outline"}
                  className="text-xs"
                >
                  {account.fulfilled ? "Funded" : "Pending"}
                </Badge>
              </div>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => copyAddress(account.address)}
                  title="Copy address"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                {network === "mainnet" && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    asChild
                    title="View on Etherscan"
                  >
                    <a
                      href={`https://etherscan.io/address/${account.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}

        {network === "testnet" && !allFulfilled && accounts.length > 0 && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Testnet accounts are funded automatically via faucet. This may take a few
              minutes. Polling every 10 seconds...
            </AlertDescription>
          </Alert>
        )}

        {status === "failed" && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {message || "Deployment failed. Please check your configuration and try again."}
            </AlertDescription>
          </Alert>
        )}

        {allFulfilled && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              All accounts are funded. You can now proceed with deployment.
              {txHash && (
                <a
                  href={
                    network === "mainnet"
                      ? `https://etherscan.io/tx/${txHash}`
                      : `https://sepolia.etherscan.io/tx/${txHash}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 inline-flex items-center gap-1 text-green-700 underline"
                >
                  View tx <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
