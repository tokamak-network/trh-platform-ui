"use client";

import { Button } from "@/design-system";
import { Card, CardContent, CardHeader, CardTitle } from "@/design-system";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8">
          <h1 className="text-6xl font-bold">TRH Platform</h1>
          <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
            Welcome to your dashboard! You have successfully signed in.
          </p>

          <div className="flex gap-4 justify-center">
            <Button variant="default" size="lg">
              Get Started
            </Button>
            <Button variant="outline" size="lg">
              View Profile
            </Button>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Welcome Back</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                You&apos;re now signed in to the TRH Platform. Start exploring
                your dashboard.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Access your most frequently used features and tools here.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p>View your recent activity and updates from the platform.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
