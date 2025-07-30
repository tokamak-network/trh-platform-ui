"use client";

import { AccountSetup } from "./AccountSetup";
import { AwsConfig } from "./AwsConfig";

export function AccountAndAwsStep() {
  return (
    <div className="space-y-8">
      <AccountSetup />
      <AwsConfig />
    </div>
  );
}
