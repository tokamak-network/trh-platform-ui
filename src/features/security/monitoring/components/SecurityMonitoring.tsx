"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import { ComingSoonTab } from "../../shared/components/ComingSoonTab";

export function SecurityMonitoring() {
  return (
    <ComingSoonTab
      icon={AlertTriangle}
      title="Security Monitoring"
      description="Real-time security monitoring and alerting features are coming soon."
    />
  );
}
