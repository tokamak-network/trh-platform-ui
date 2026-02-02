"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  Dices,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Copy,
} from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";
import { ethers } from "ethers";
import { useWallet } from "../hooks/useWallet";
import { useDRBContract, RequestInfo } from "../hooks/useDRBContract";
import { THANOS_SEPOLIA_CHAIN } from "../contracts/abis";
import toast from "react-hot-toast";

interface InteractTabProps {
  commitReveal2Address?: string;
  consumerExampleAddress?: string;
  rpcUrl?: string;
}

export function InteractTab({
  commitReveal2Address,
  consumerExampleAddress,
  rpcUrl,
}: InteractTabProps) {
  const wallet = useWallet();
  const contract = useDRBContract({
    commitReveal2Address,
    consumerExampleAddress,
    rpcUrl,
  });

  const [estimatedFee, setEstimatedFee] = useState<bigint>(BigInt(0));
  const [isRequesting, setIsRequesting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  useEffect(() => {
    const fetchFee = async () => {
      const fee = await contract.estimateRequestPrice();
      setEstimatedFee(fee);
    };
    fetchFee();
  }, [contract.estimateRequestPrice]);

  const handleRequestRandom = async () => {
    if (!wallet.signer) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!wallet.isCorrectChain) {
      toast.error("Please switch to Thanos Sepolia network");
      return;
    }

    setIsRequesting(true);
    setTxHash(null);

    try {
      const tx = await contract.requestRandomNumber(wallet.signer);
      setTxHash(tx.hash);
      toast.success("Transaction submitted!");

      await tx.wait();
      toast.success("Random number requested successfully!");

      // Refresh contract state
      await contract.fetchContractState();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Transaction failed");
    } finally {
      setIsRequesting(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const formatAddress = (address: string) =>
    `${address.slice(0, 6)}...${address.slice(-4)}`;

  const getExplorerUrl = (hash: string, type: "tx" | "address" = "tx") => {
    const baseUrl = THANOS_SEPOLIA_CHAIN.explorerUrl;
    return `${baseUrl}/${type}/${hash}`;
  };

  return (
    <TabsContent value="interact" className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-indigo-50 to-indigo-100">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-3 text-slate-800">
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 shadow-lg">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg">Wallet Connection</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            {!wallet.isConnected ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">
                  Connect your wallet to interact with the DRB contracts.
                </p>
                <Button
                  onClick={wallet.connect}
                  disabled={wallet.isConnecting}
                  className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700"
                >
                  {wallet.isConnecting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Wallet className="h-4 w-4 mr-2" />
                      Connect MetaMask
                    </>
                  )}
                </Button>
                {wallet.error && (
                  <p className="text-xs text-red-500">{wallet.error}</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/60">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-slate-700">Connected</span>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">
                    {formatAddress(wallet.address!)}
                  </Badge>
                </div>

                {wallet.balance && (
                  <div className="flex justify-between p-3 rounded-lg bg-white/40">
                    <span className="text-sm text-slate-600">Balance</span>
                    <span className="text-sm font-mono font-medium">
                      {parseFloat(wallet.balance).toFixed(4)} TON
                    </span>
                  </div>
                )}

                {!wallet.isCorrectChain && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <div className="flex items-center gap-2 text-amber-700">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Wrong Network</span>
                    </div>
                    <p className="text-xs text-amber-600 mt-1">
                      Please switch to Thanos Sepolia to interact with DRB.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={wallet.switchToThanosNetwork}
                    >
                      Switch Network
                    </Button>
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={wallet.disconnect}
                  className="w-full"
                >
                  Disconnect
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 to-purple-100">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-3 text-slate-800">
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 shadow-lg">
                <Dices className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg">Request Random Number</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <p className="text-sm text-slate-600">
              Request a verifiable random number from the DRB network. This calls
              the ConsumerExampleV2 contract.
            </p>

            <div className="p-3 rounded-lg bg-white/60 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Estimated Fee</span>
                <span className="text-sm font-mono font-medium">
                  {ethers.formatEther(estimatedFee)} TON
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Fee with Buffer (20%)</span>
                <span className="text-sm font-mono font-medium">
                  {ethers.formatEther((estimatedFee * BigInt(120)) / BigInt(100))} TON
                </span>
              </div>
            </div>

            <Button
              onClick={handleRequestRandom}
              disabled={
                !wallet.isConnected ||
                !wallet.isCorrectChain ||
                isRequesting ||
                !consumerExampleAddress
              }
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
            >
              {isRequesting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Requesting...
                </>
              ) : (
                <>
                  <Dices className="h-4 w-4 mr-2" />
                  Request Random Number
                </>
              )}
            </Button>

            {txHash && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm font-medium">Transaction Submitted</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <code className="text-xs font-mono text-green-600 flex-1 truncate">
                    {txHash}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => copyToClipboard(txHash, "Transaction hash")}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <a
                    href={getExplorerUrl(txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:text-green-700"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            )}

            {!consumerExampleAddress && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                <div className="flex items-center gap-2 text-amber-700">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Regular Node</span>
                </div>
                <p className="text-xs text-amber-600 mt-1">
                  Regular nodes can monitor the DRB network but cannot request random numbers.
                  Use the Leader Node stack to request random numbers.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-xl bg-gradient-to-br from-cyan-50 to-cyan-100">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-slate-800">
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 shadow-lg">
                <RefreshCw className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg">Recent Requests</span>
              <Badge variant="secondary" className="ml-2">
                {contract.requestCount.toString()} total
              </Badge>
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={contract.fetchContractState}
              disabled={contract.isLoading}
            >
              {contract.isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {contract.requests.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Dices className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No random number requests yet</p>
              <p className="text-xs mt-1">
                Request a random number to see it appear here
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {contract.requests.slice(0, 10).map((request) => (
                <RequestRow
                  key={request.requestId.toString()}
                  request={request}
                  explorerUrl={THANOS_SEPOLIA_CHAIN.explorerUrl}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}

function RequestRow({
  request,
  explorerUrl,
}: {
  request: RequestInfo;
  explorerUrl: string;
}) {
  const isFulfilled = request.fulfillBlockNumber > 0;
  const randomHex = request.randomNumber.toString(16).padStart(64, "0");

  return (
    <div className="p-3 rounded-lg bg-white/60 hover:bg-white/80 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge
            variant={isFulfilled ? "default" : "secondary"}
            className={isFulfilled ? "bg-green-500" : "bg-amber-500"}
          >
            #{request.requestId.toString()}
          </Badge>
          {isFulfilled ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />
          )}
          <span className="text-sm text-slate-600">
            {isFulfilled ? "Fulfilled" : "Pending"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-500">
            Fee: {ethers.formatEther(request.requestFee)} TON
          </span>
          <a
            href={`${explorerUrl}/address/${request.requester}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-slate-600"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
      {isFulfilled && request.randomNumber > 0 && (
        <div className="mt-2 p-2 rounded bg-slate-50">
          <p className="text-xs text-slate-500 mb-1">Random Number:</p>
          <code className="text-xs font-mono text-slate-700 break-all">
            0x{randomHex}
          </code>
        </div>
      )}
    </div>
  );
}
