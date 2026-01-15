"use client";

import React from "react";
import { IntegrationInfo } from "@/features/integrations/schemas/integration";

export function CrossTradeCompactInfo({ integration }: { 
  integration: { 
    info?: IntegrationInfo;
  }; 
}) {
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
