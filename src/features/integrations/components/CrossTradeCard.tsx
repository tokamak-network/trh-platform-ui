"use client";

import React from "react";
import { IntegrationInfo } from "@/features/integrations/schemas/integration";

export function CrossTradeCompactInfo({ integration }: { 
  integration: { 
    info?: IntegrationInfo;
  }; 
}) {
  if (integration.info?.contracts) {
    const contracts = integration.info.contracts;
    return (
      <div className="text-sm text-gray-600">
        <p>
          <span className="font-medium">Mode:</span> {contracts.mode.toUpperCase()}
        </p>
        <p>
          <span className="font-medium">L1 Proxy:</span>{" "}
          <span className="font-mono text-xs">
            {contracts.l1_cross_trade_proxy_address.slice(0, 10)}...
          </span>
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
