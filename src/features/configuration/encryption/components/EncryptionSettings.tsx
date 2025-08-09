"use client";

import React from "react";
import { Lock } from "lucide-react";
import { ComingSoonTab } from "../../shared/components/ComingSoonTab";

export function EncryptionSettings() {
  return (
    <ComingSoonTab
      icon={Lock}
      title="Encryption Settings"
      description="Advanced encryption and security configuration options are coming soon."
    />
  );
}
