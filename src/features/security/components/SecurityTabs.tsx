"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AWSCredentialsTab } from "../aws-credentials";
import { WalletManagement } from "../wallet-management";
import { EncryptionSettings } from "../encryption";
import { SecurityMonitoring } from "../monitoring";
import { SecurityTab } from "../schemas";

interface SecurityTabsProps {
  currentTab: SecurityTab;
}

export function SecurityTabs({ currentTab }: SecurityTabsProps) {
  const router = useRouter();

  const handleTabChange = (value: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", value);
    router.push(url.pathname + url.search);
  };

  return (
    <Tabs
      value={currentTab}
      onValueChange={handleTabChange}
      className="space-y-6"
    >
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="aws">AWS Credentials</TabsTrigger>
        <TabsTrigger value="wallets">Wallet Management</TabsTrigger>
        <TabsTrigger value="encryption">Encryption</TabsTrigger>
        <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
      </TabsList>

      {/* AWS Credentials Tab */}
      <TabsContent value="aws" className="space-y-6">
        <AWSCredentialsTab />
      </TabsContent>

      {/* Wallet Management Tab */}
      <TabsContent value="wallets" className="space-y-6">
        <WalletManagement />
      </TabsContent>

      {/* Encryption Tab */}
      <TabsContent value="encryption" className="space-y-6">
        <EncryptionSettings />
      </TabsContent>

      {/* Monitoring Tab */}
      <TabsContent value="monitoring" className="space-y-6">
        <SecurityMonitoring />
      </TabsContent>
    </Tabs>
  );
}
