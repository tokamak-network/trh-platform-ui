"use client";

import { Suspense } from "react";
import { AuthenticatedLayout } from "@/components/layout";
import { SecurityManagement } from "@/features/security";

function SecurityPageContent() {
  return (
    <AuthenticatedLayout>
      <main className="flex-1 p-6 px-16">
        <SecurityManagement />
      </main>
    </AuthenticatedLayout>
  );
}

function SecurityPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SecurityPageContent />
    </Suspense>
  );
}

export default SecurityPage;
