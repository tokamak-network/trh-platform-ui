"use client";

import React from "react";
import { Wallet } from "lucide-react";
import { ComingSoonTab } from "../../shared/components/ComingSoonTab";

export function WalletManagement() {
  return (
    <ComingSoonTab
      icon={Wallet}
      title="Wallet Management"
      description="Secure wallet and seed phrase management features are coming soon."
    />
  );
}
