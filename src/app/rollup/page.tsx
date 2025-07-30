"use client";

import { Suspense } from "react";
import { AuthenticatedLayout } from "@/components/layout";
import { RollupManagement } from "@/features/rollup/components/RollupManagement";

function RollupPageContent() {
  return (
    <AuthenticatedLayout>
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <RollupManagement />
        </div>
      </main>
    </AuthenticatedLayout>
  );
}

function RollupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RollupPageContent />
    </Suspense>
  );
}

export default RollupPage;
