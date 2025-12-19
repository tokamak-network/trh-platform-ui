"use client";

import React from "react";
import type { Integration } from "../schemas";

type Status = Integration["status"];

interface StatusIndicatorProps {
  status: Status;
  label: string;
}

const statusConfig: Record<Status, { dotColor: string; bgColor: string; textColor: string; borderColor: string; pulse: boolean }> = {
  Completed: { dotColor: "bg-emerald-500", bgColor: "bg-emerald-50", textColor: "text-emerald-700", borderColor: "border-emerald-200", pulse: false },
  InProgress: { dotColor: "bg-blue-500", bgColor: "bg-blue-50", textColor: "text-blue-700", borderColor: "border-blue-200", pulse: true },
  Pending: { dotColor: "bg-amber-500", bgColor: "bg-amber-50", textColor: "text-amber-700", borderColor: "border-amber-200", pulse: true },
  Failed: { dotColor: "bg-red-500", bgColor: "bg-red-50", textColor: "text-red-700", borderColor: "border-red-200", pulse: false },
  Stopped: { dotColor: "bg-gray-500", bgColor: "bg-gray-50", textColor: "text-gray-700", borderColor: "border-gray-200", pulse: false },
  Terminating: { dotColor: "bg-orange-500", bgColor: "bg-orange-50", textColor: "text-orange-700", borderColor: "border-orange-200", pulse: true },
  Terminated: { dotColor: "bg-gray-600", bgColor: "bg-gray-50", textColor: "text-gray-700", borderColor: "border-gray-200", pulse: false },
  Cancelling: { dotColor: "bg-orange-500", bgColor: "bg-orange-50", textColor: "text-orange-700", borderColor: "border-orange-200", pulse: true },
  Cancelled: { dotColor: "bg-gray-500", bgColor: "bg-gray-50", textColor: "text-gray-700", borderColor: "border-gray-200", pulse: false },
  Unknown: { dotColor: "bg-gray-500", bgColor: "bg-gray-50", textColor: "text-gray-700", borderColor: "border-gray-200", pulse: false },
};

export function StatusIndicator({ status, label }: StatusIndicatorProps) {
  const config = statusConfig[status] || statusConfig.Unknown;

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${config.bgColor} border ${config.borderColor}`}>
      <div className="relative flex items-center justify-center w-3.5 h-3.5">
        {config.pulse && (
          <span className={`absolute inset-0 rounded-full ${config.dotColor} opacity-30 animate-ping`} />
        )}
        <span
          className={`relative w-2.5 h-2.5 rounded-full ${config.dotColor}`}
          style={{
            boxShadow: `inset 0 -2px 4px rgba(0,0,0,0.25), inset 0 1px 3px rgba(255,255,255,0.4), 0 1px 2px rgba(0,0,0,0.2)`
          }}
        />
      </div>
      <span className={`text-xs font-medium ${config.textColor}`}>{label}</span>
    </div>
  );
}
