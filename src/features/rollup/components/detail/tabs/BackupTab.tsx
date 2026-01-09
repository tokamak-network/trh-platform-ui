"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { RollupDetailTabProps } from "../../../schemas/detail-tabs";

export function BackupTab({ stack }: RollupDetailTabProps) {
  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-cyan-100">
        <CardContent>
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">
              Backup Coming Soon
            </h3>
            <p className="text-slate-600 font-medium max-w-md mx-auto">
              The rollup backup functionality is currently under development.
              Soon you&apos;ll be able to backup your rollup data and restore it if needed.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
