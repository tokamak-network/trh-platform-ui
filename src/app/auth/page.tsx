"use client";

import { AuthForm } from "@/components/organisms";

export default function AuthPage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">
            Welcome to TRH Platform
          </h1>
          <p className="text-neutral-600">Sign in to access your account</p>
        </div>

        <AuthForm
          onSubmit={(data) => {
            console.log("Auth form submitted:", data);
            // Here you would typically handle authentication
            // For now, we'll redirect to dashboard after a brief delay
            setTimeout(() => {
              window.location.href = "/dashboard";
            }, 1000);
          }}
        />

        <div className="mt-6 text-center">
          <p className="text-sm text-neutral-500">
            Don&apos;t have an account?{" "}
            <button className="text-primary-500 hover:text-primary-600 hover:underline">
              Sign up
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}
