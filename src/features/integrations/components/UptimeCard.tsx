"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle, ExternalLink } from "lucide-react";

interface UptimeCardProps {
  integration: {
    info?: {
      url?: string;
    };
    log_path?: string;
  };
  copiedItem: string | null;
  copyToClipboard: (text: string, itemId: string) => void;
}

interface UptimeCompactInfoProps {
  integration: {
    info?: {
      url?: string;
    };
  };
}

export function UptimeCard({ integration, copiedItem, copyToClipboard }: UptimeCardProps) {
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

export function UptimeCompactInfo({ integration }: UptimeCompactInfoProps) {
  if (integration.info?.url) {
    return (
      <div className="text-sm text-gray-600">
        <p className="truncate">
          <span className="font-medium">URL:</span>{" "}
          <a href={integration.info.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            {integration.info.url}
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="text-sm text-gray-600">
      No additional information available
    </div>
  );
}

