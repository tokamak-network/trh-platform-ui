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
      <TabsList className="grid w-full grid-cols-4 bg-white/60 backdrop-blur-sm border-0 shadow-lg">
        <TabsTrigger
          value="aws"
          className="cursor-pointer data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-400 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium"
        >
          AWS Credentials
        </TabsTrigger>
        <TabsTrigger
          value="wallets"
          className="cursor-pointer data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-400 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium"
        >
          Wallet Management
        </TabsTrigger>
        <TabsTrigger
          value="encryption"
          className="cursor-pointer data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-400 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium"
        >
          Encryption
        </TabsTrigger>
        <TabsTrigger
          value="monitoring"
          className="cursor-pointer data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-400 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium"
        >
          Monitoring
        </TabsTrigger>
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
