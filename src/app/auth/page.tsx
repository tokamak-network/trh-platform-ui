"use client";

import { DashboardLogoIcon } from "@/components/icon";
import { AuthForm } from "@/features/auth/components/AuthForm";
import { isElectron } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function AuthPage() {
  const [isDesktopApp, setIsDesktopApp] = useState(false);

  useEffect(() => {
    setIsDesktopApp(isElectron());
  }, []);

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      {/* Window drag region for Electron */}
      {isDesktopApp && (
        <div
          className="fixed top-0 left-0 right-0 h-8 z-50"
          style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
        />
      )}
      <div className="flex flex-col gap-10 items-center w-full max-w-md">
        <div className="flex flex-col items-center gap-2">
          <DashboardLogoIcon />
        </div>
        <AuthForm />
        <div className="flex flex-col items-center gap-2">
          <p className="text-neutral-600">
            Need Help?{" "}
            <Link href="/help" className="text-primary-500">
              Contract Rollup Hub team
            </Link>
          </p>
          <p className="text-neutral-600 text-sm">
            ©2025 Tokamak Rollup Hub. All rights reserved.
          </p>
        </div>
      </div>
    </main>
  );
}
