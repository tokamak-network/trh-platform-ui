"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle, ExternalLink } from "lucide-react";

interface BridgeCardProps {
  integration: {
    info?: {
      url?: string;
    };
    log_path?: string;
  };
  copiedItem: string | null;
  copyToClipboard: (text: string, itemId: string) => void;
}

export function BridgeCard({ integration, copiedItem, copyToClipboard }: BridgeCardProps) {
  if (integration.info?.url) {
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
                onClick={() => copyToClipboard(integration.info?.url || "", "url")}
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
                onClick={() => window.open(integration.info?.url, "_blank")}
                className="h-6 w-6 p-0"
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>

        {integration.log_path && (
          <div>
            <span className="font-medium text-gray-600">Log Path:</span>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-gray-900 font-mono text-xs break-all flex-1">
                {integration.log_path}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(integration.log_path || "", "log")}
                className="h-6 w-6 p-0"
              >
                {copiedItem === "log" ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="text-sm text-gray-600">
      No additional information available
    </div>
  );
}

export function BridgeCompactInfo({ integration }: { integration: { info?: { url?: string } } }) {
  if (integration.info?.url) {
    return (
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xs text-gray-500 shrink-0">URL:</span>
        <span className="text-xs font-mono text-gray-700 truncate flex-1">{integration.info.url}</span>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0" onClick={() => navigator.clipboard.writeText(integration.info?.url || "")}>
          <Copy className="w-3 h-3" />
        </Button>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0" onClick={() => window.open(integration.info?.url, "_blank")}>
          <ExternalLink className="w-3 h-3" />
        </Button>
      </div>
    );
  }

  return <span className="text-xs text-gray-400">No URL available</span>;
}
