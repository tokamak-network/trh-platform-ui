"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { SecurityTabs } from "./SecurityTabs";
import { useAwsCredentials } from "../aws-credentials";
import { SecurityTab } from "../schemas";

export function SecurityManagement() {
  const searchParams = useSearchParams();
  const currentTab = (searchParams.get("tab") as SecurityTab) || "aws";

  const {
    awsCredentials,
    isLoading,
    error,
    isAdding,
    isUpdating,
    isDeleting,
    deletingId,
    addCredential,
    updateCredential,
    deleteCredential,
  } = useAwsCredentials();

  // Handle error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Security</h1>
            <p className="text-muted-foreground">
              Manage credentials and security settings for your rollup platform
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="text-destructive mb-2">
              Error loading security data
            </div>
            <div className="text-muted-foreground text-sm">{error}</div>
          </div>
        </div>
      </div>
    );
  }

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
      <SecurityTabs
        awsCredentials={awsCredentials}
        onAddCredential={addCredential}
        onUpdateCredential={updateCredential}
        onDeleteCredential={deleteCredential}
        isLoading={isLoading}
        isAdding={isAdding}
        isUpdating={isUpdating}
        isDeleting={isDeleting}
        deletingId={deletingId}
        currentTab={currentTab}
      />
    </div>
  );
}
