"use client";

import { Suspense } from "react";
import { AuthenticatedLayout } from "@/components/layout";
import { ConfigurationManagement } from "@/features/configuration";

function ConfigurationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
        </div>
      }
    >
      <AuthenticatedLayout>
        <section className="p-6">
          <ConfigurationManagement />
        </section>
      </AuthenticatedLayout>
    </Suspense>
  );
}

export default ConfigurationPage;
