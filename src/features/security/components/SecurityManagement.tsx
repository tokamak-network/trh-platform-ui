"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { SecurityTabs } from "./SecurityTabs";
import { SecurityTab } from "../schemas";

export function SecurityManagement() {
  const searchParams = useSearchParams();
  const currentTab = (searchParams.get("tab") as SecurityTab) || "aws";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Security</h1>
          <p className="text-muted-foreground">
            Manage credentials and security settings for your rollup platform
          </p>
        </div>
      </div>

      {/* Security Tabs */}
      <SecurityTabs currentTab={currentTab} />
    </div>
  );
}
