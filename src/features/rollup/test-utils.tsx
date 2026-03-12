import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createRollupSchema } from "./schemas/create-rollup";
import type { CreateRollupFormData } from "./schemas/create-rollup";
import { CHAIN_NETWORK } from "./const";

export const defaultTestFormData: CreateRollupFormData = {
  networkAndChain: {
    network: "",
    chainName: "",
    l1RpcUrl: "",
    l1BeaconUrl: "",
    advancedConfig: false,
    l2BlockTime: "2",
    batchSubmissionFreq: "1440",
    outputRootFreq: "240",
    challengePeriod: "12",
    reuseDeployment: true,
    enableBackup: false,
  },
  accountAndAws: {
    seedPhrase: Array(12).fill(""),
    adminAccount: "",
    adminPrivateKey: "",
    proposerAccount: "",
    proposerPrivateKey: "",
    batchAccount: "",
    batchPrivateKey: "",
    sequencerAccount: "",
    sequencerPrivateKey: "",
    accountName: "",
    credentialId: "",
    awsAccessKey: "",
    awsSecretKey: "",
    awsRegion: "",
  },
  daoCandidate: undefined,
  confirmation: {
    agreedToMainnetRisks: false,
  },
};

export function testnetFormData(): CreateRollupFormData {
  return {
    ...defaultTestFormData,
    networkAndChain: {
      ...defaultTestFormData.networkAndChain,
      network: CHAIN_NETWORK.TESTNET,
      chainName: "TestChain",
      l1RpcUrl: "https://rpc.example.com",
      l1BeaconUrl: "https://beacon.example.com",
    },
  };
}

export function localTestnetFormData(): CreateRollupFormData {
  return {
    ...defaultTestFormData,
    networkAndChain: {
      ...defaultTestFormData.networkAndChain,
      network: CHAIN_NETWORK.LOCAL_TESTNET,
      chainName: "LocalChain",
      l1RpcUrl: "https://rpc.example.com",
      l1BeaconUrl: "https://beacon.example.com",
      kubeconfigPath: "/home/user/.kube/config",
    },
  };
}

export function mainnetFormData(): CreateRollupFormData {
  return {
    ...defaultTestFormData,
    networkAndChain: {
      ...defaultTestFormData.networkAndChain,
      network: CHAIN_NETWORK.MAINNET,
      chainName: "MainChain",
      l1RpcUrl: "https://mainnet-rpc.example.com",
      l1BeaconUrl: "https://mainnet-beacon.example.com",
    },
  };
}

interface FormWrapperProps {
  defaultValues?: CreateRollupFormData;
  children: React.ReactNode;
}

function FormWrapperInner({ defaultValues, children }: FormWrapperProps) {
  const methods = useForm<CreateRollupFormData>({
    resolver: zodResolver(createRollupSchema),
    defaultValues: defaultValues ?? defaultTestFormData,
  });

  return <FormProvider {...methods}>{children}</FormProvider>;
}

export function createFormWrapper(defaultValues?: CreateRollupFormData) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <FormWrapperInner defaultValues={defaultValues}>
        {children}
      </FormWrapperInner>
    );
  };
}
