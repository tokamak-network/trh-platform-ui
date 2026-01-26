"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { AuthenticatedLayout } from "@/components/layout";
import { RollupDetail } from "@/features/rollup/components/detail";

function RollupDetailPage() {
  const { id } = useParams<{ id: string }>();

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
          <RollupDetail id={id} />
        </section>
      </AuthenticatedLayout>
    </Suspense>
  );
}

export default RollupDetailPage;
