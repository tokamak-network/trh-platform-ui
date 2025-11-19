"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Copy, Check, ExternalLink, Loader2 } from "lucide-react";
import { RollupDetailTabProps } from "../../../schemas/detail-tabs";
import { useThanosL1ContractsQuery } from "@/features/rollup/api/queries";
import { L1ContractsResponse } from "@/features/rollup/schemas/contracts";
import toast from "react-hot-toast";

export function ContractsTab({ stack }: RollupDetailTabProps) {
  const { data: contracts, isLoading, error } = useThanosL1ContractsQuery(
    stack?.id
  );
  const [copiedAddress, setCopiedAddress] = React.useState<string | null>(null);

  if (!stack) return null;

  const handleCopyAddress = (address: string, contractName: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    toast.success(`Copied ${contractName} address`);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  // Helper function to build explorer URL with contract address
  const getContractExplorerUrl = (address: string) => {
    if (!stack.metadata?.explorerUrl || !address) return "#";
    // Remove trailing slash if present and append address path
    const baseUrl = stack.metadata.explorerUrl.replace(/\/$/, "");
    return `${baseUrl}/address/${address}`;
  };

  // Convert contracts object to array of entries
  const contractEntries = contracts
    ? Object.entries(contracts as L1ContractsResponse).filter(
        ([, address]) => address && address.trim() !== ""
      )
    : [];

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-blue-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600">
              <FileText className="h-4 w-4 text-white" />
            </div>
            L1 Contract Addresses
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center justify-center py-10 text-slate-600">
              <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading
              contracts...
            </div>
          )}

          {error && (
            <div className="text-center py-10 text-red-600">
              Failed to load contract addresses. Please try again later.
            </div>
          )}

          {!isLoading && !error && contractEntries.length === 0 && (
            <div className="text-center py-10 text-slate-600">
              No contract addresses available for this rollup.
            </div>
          )}

          {!isLoading && !error && contractEntries.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-600">
                    <th className="py-2 pr-4 font-medium">Name</th>
                    <th className="py-2 pr-4 font-medium">Address</th>
                    <th className="py-2 pr-0"></th>
                  </tr>
                </thead>
                <tbody>
                  {contractEntries.map(([contractName, address]) => (
                    <tr
                      key={contractName}
                      className="border-t border-slate-200/60"
                    >
                      <td className="py-3 pr-4 font-medium text-slate-800">
                        {contractName}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-700 break-all">
                            {address}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-0">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="inline-flex items-center"
                            onClick={() => handleCopyAddress(address, contractName)}
                          >
                            {copiedAddress === address ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                          {getContractExplorerUrl(address) !== "#" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="inline-flex items-center"
                              asChild
                            >
                              <a
                                href={getContractExplorerUrl(address)}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

