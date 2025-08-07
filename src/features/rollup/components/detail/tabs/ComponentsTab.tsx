"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  RefreshCw,
  AlertCircle,
  Plus,
  Package,
  CheckCircle,
  Clock,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { RollupDetailTabProps } from "../../../schemas/detail-tabs";
import { useIntegrationsQuery } from "../../../api/queries";
import { IntegrationCard } from "./IntegrationCard";
import { INTEGRATION_TYPES } from "../../../schemas/integration";

export function ComponentsTab({ stack }: RollupDetailTabProps) {
  const {
    data: integrations = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useIntegrationsQuery(stack?.id || "");

  const getStatusCounts = () => {
    const counts = {
      completed: 0,
      inProgress: 0,
      pending: 0,
      failed: 0,
      total: integrations.length,
    };

    integrations.forEach((integration) => {
      switch (integration.status) {
        case "Completed":
          counts.completed++;
          break;
        case "InProgress":
          counts.inProgress++;
          break;
        case "Pending":
          counts.pending++;
          break;
        case "Failed":
          counts.failed++;
          break;
      }
    });

    return counts;
  };

  const statusCounts = getStatusCounts();

  if (!stack) {
    return (
      <div className="space-y-6">
        <Card className="border-0 shadow-xl bg-gradient-to-br from-red-50 to-pink-100">
          <CardContent>
            <div className="text-center py-12">
              <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                Stack Not Found
              </h3>
              <p className="text-slate-600 font-medium">
                Unable to load stack information. Please try refreshing the
                page.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-cyan-100">
          <CardContent>
            <div className="text-center py-12">
              <RefreshCw className="w-10 h-10 text-blue-500 mx-auto mb-4 animate-spin" />
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                Loading Components
              </h3>
              <p className="text-slate-600 font-medium">
                Fetching integration components for your rollup...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <Card className="border-0 shadow-xl bg-gradient-to-br from-red-50 to-pink-100">
          <CardContent>
            <div className="text-center py-12">
              <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                Error Loading Components
              </h3>
              <p className="text-slate-600 font-medium mb-6">
                There was a problem fetching your integration components. Please
                try again.
              </p>
              <Button onClick={() => refetch()} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-cyan-100">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">
                  Integration Components
                </CardTitle>
                <p className="text-sm text-slate-600">
                  Manage and monitor your rollup&apos;s integration components
                </p>
              </div>
            </div>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white/50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {statusCounts.total}
              </div>
              <div className="text-sm text-slate-600">Total</div>
            </div>
            <div className="text-center p-4 bg-white/50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {statusCounts.completed}
              </div>
              <div className="text-sm text-slate-600">Installed</div>
            </div>
            <div className="text-center p-4 bg-white/50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {statusCounts.inProgress}
              </div>
              <div className="text-sm text-slate-600">In Progress</div>
            </div>
            <div className="text-center p-4 bg-white/50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {statusCounts.failed}
              </div>
              <div className="text-sm text-slate-600">Failed</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integration Components */}
      {integrations.length === 0 ? (
        <Card className="border-0 shadow-xl bg-gradient-to-br from-gray-50 to-slate-100">
          <CardContent>
            <div className="text-center py-12">
              <Activity className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                No Components Found
              </h3>
              <p className="text-slate-600 font-medium max-w-md mx-auto mb-6">
                No integration components have been deployed for this rollup
                yet. Components will appear here once they are configured and
                deployed.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {Object.entries(INTEGRATION_TYPES).map(([type, config]) => (
                  <Badge key={type} variant="outline" className="text-sm">
                    {config.icon} {config.label}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {integrations.map((integration) => (
            <IntegrationCard key={integration.id} integration={integration} />
          ))}
        </div>
      )}

      {/* Available Components Info */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-slate-50 to-gray-100">
        <CardHeader>
          <CardTitle className="text-lg">Available Component Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(INTEGRATION_TYPES).map(([type, config]) => (
              <div
                key={type}
                className="p-4 bg-white/50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`w-8 h-8 bg-gradient-to-r ${config.color} rounded-lg flex items-center justify-center text-white text-sm`}
                  >
                    {config.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">
                      {config.label}
                    </h4>
                    <p className="text-xs text-slate-600">
                      {config.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {integrations.some((i) => i.type === type) ? (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Installed
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-slate-600">
                      <Plus className="w-3 h-3 mr-1" />
                      Available
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
