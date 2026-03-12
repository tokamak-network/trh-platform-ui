"use client";

import { useFormContext } from "react-hook-form";
import { AccountSetup } from "./AccountSetup";
import { AwsConfig } from "./AwsConfig";
import type { CreateRollupFormData } from "../../schemas/create-rollup";
import { CHAIN_NETWORK } from "../../const";

interface AccountAndAwsStepProps {
  onNext?: () => void;
  onBack?: () => void;
}

export function AccountAndAwsStep({
  onNext = () => {},
  onBack = () => {},
}: AccountAndAwsStepProps) {
  const { watch } = useFormContext<CreateRollupFormData>();
  const isLocal = watch("networkAndChain.network") === CHAIN_NETWORK.LOCAL_TESTNET;

  return (
    <div className="space-y-8">
      <AccountSetup />
      {!isLocal && <AwsConfig onNext={onNext} onBack={onBack} />}
    </div>
  );
}
