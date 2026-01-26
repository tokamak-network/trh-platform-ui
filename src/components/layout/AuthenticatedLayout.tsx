"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/molecules";
import { useAuthContext } from "@/providers";
import { isElectron } from "@/lib/utils";

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const { isAuthenticated, isLoading } = useAuthContext();
  const router = useRouter();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    setIsDesktop(isElectron());
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Electron drag region */}
      {isDesktop && (
        <div
          className="fixed top-0 left-0 right-0 h-7 z-50"
          style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
        />
      )}

      {/* Sidebar */}
      <Sidebar className={`fixed left-0 top-0 z-40 ${isDesktop ? "pt-7" : ""}`} />

      {/* Main content - uses ml-16 for collapsed sidebar width */}
      <main className={`ml-16 min-h-screen transition-all ${isDesktop ? "pt-7" : ""}`}>
        {children}
      </main>
    </div>
  );
}
