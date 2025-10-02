"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, Database, CheckCircle, MoreHorizontal, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import toast from "react-hot-toast";
import { useBackupCheckpointsQuery } from "../../api/queries";

interface RecentSnapshotsProps {
  stackId?: string;
}

interface Snapshot {
  id: string;
  recoveryPoint: string;
  arn: string;
  date: string;
  status: "Completed" | "In Progress" | "Failed";
}

export function RecentSnapshots({ stackId }: RecentSnapshotsProps) {
  const { data: checkpoints, isLoading, error } = useBackupCheckpointsQuery(stackId || "", 6);

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "UTC",
        timeZoneName: "short"
      });
    } catch {
      return dateString;
    }
  };

  // Convert API checkpoints to snapshot format for compatibility
  const snapshots: Snapshot[] = checkpoints?.map((checkpoint, index) => ({
    id: `checkpoint-${index + 1}`,
    recoveryPoint: `Recovery Point: ${checkpoint.Vault}`,
    arn: checkpoint.Vault,
    date: formatDate(checkpoint.Created),
    status: checkpoint.Status === "COMPLETED" ? "Completed" as const : 
             checkpoint.Status === "IN_PROGRESS" ? "In Progress" as const : 
             "Failed" as const,
  })) || [];

  const handleRestoreSnapshot = (snapshot: Snapshot) => {
    toast.success(`Restoring from ${snapshot.id}`);
    // TODO: Implement actual restore API call
  };

  const handleDeleteSnapshot = (snapshot: Snapshot) => {
    toast.success(`Deleting snapshot ${snapshot.id}`);
    // TODO: Implement actual delete API call
  };

  const getStatusColor = (status: Snapshot["status"]) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "In Progress":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "Failed":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 to-indigo-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600">
              <History className="h-4 w-4 text-white" />
            </div>
            Recent Snapshots
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-slate-600" />
          <span className="ml-2 text-slate-600">Loading snapshots...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-0 shadow-xl bg-gradient-to-br from-red-50 to-rose-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <div className="p-2 rounded-lg bg-gradient-to-r from-red-500 to-rose-600">
              <History className="h-4 w-4 text-white" />
            </div>
            Recent Snapshots
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-700">Failed to load snapshots</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 to-indigo-100">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-800">
          <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600">
            <History className="h-4 w-4 text-white" />
          </div>
          Recent Snapshots
        </CardTitle>
      </CardHeader>
      <CardContent className="h-96 overflow-y-auto space-y-3">
        {snapshots.map((snapshot) => (
          <div
            key={snapshot.id}
            className="p-4 rounded-lg bg-white/60 backdrop-blur-sm border border-white/20 hover:bg-white/80 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-slate-600" />
                <span className="font-medium text-slate-800 font-mono text-sm">
                  {snapshot.id}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant="secondary" 
                  className={getStatusColor(snapshot.status)}
                >
                  {snapshot.status}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleRestoreSnapshot(snapshot)}>
                      Restore from this snapshot
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDeleteSnapshot(snapshot)}
                      className="text-red-600"
                    >
                      Delete snapshot
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">ARN:</span>
                <span className="font-mono text-xs text-slate-800 max-w-xs truncate">
                  {snapshot.arn}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Created:</span>
                <span className="text-slate-800 font-medium">
                  {snapshot.date}
                </span>
              </div>
            </div>
          </div>
        ))}
        
        {snapshots.length === 0 && (
          <div className="text-center py-8 text-slate-600">
            <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No snapshots available</p>
            <p className="text-xs opacity-75 mt-1">
              Snapshots will appear here once backup is configured
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
