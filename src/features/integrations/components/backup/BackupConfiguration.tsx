"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Clock, RotateCcw, CheckCircle, Save } from "lucide-react";
import toast from "react-hot-toast";
import { useConfigureBackupMutation } from "../../api/mutations";

interface BackupConfigurationProps {
  stackId?: string;
}

export function BackupConfiguration({ stackId }: BackupConfigurationProps) {
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [dailyTime, setDailyTime] = useState("2:00");
  const [retentionDays, setRetentionDays] = useState("30");
  const [isEditing, setIsEditing] = useState(false);

  const configureBackupMutation = useConfigureBackupMutation({
    onSuccess: () => {
      setIsEditing(false);
    },
  });

  const handleToggleAutoBackup = (enabled: boolean) => {
    setAutoBackupEnabled(enabled);
    toast.success(enabled ? "Auto backup enabled" : "Auto backup disabled");
  };

  const handleUpdateConfiguration = () => {
    if (!stackId) {
      toast.error("Stack ID is required");
      return;
    }

    // Validate inputs
    if (!dailyTime || !retentionDays) {
      toast.error("Please fill in all fields");
      return;
    }

    // Validate time format (H:MM or HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(dailyTime)) {
      toast.error("Please enter time in HH:MM format (24-hour)");
      return;
    }

    // Validate retention days (positive integer)
    const days = parseInt(retentionDays);
    if (isNaN(days) || days <= 0) {
      toast.error("Retention period must be a positive number");
      return;
    }

    configureBackupMutation.mutate({
      stackId,
      daily: dailyTime,
      keep: retentionDays,
    });
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const configItems = [
    {
      label: "Auto Backup",
      value: (
        <div className="flex items-center gap-2">
          <Switch
            checked={autoBackupEnabled}
            onCheckedChange={handleToggleAutoBackup}
            disabled={configureBackupMutation.isPending}
          />
          <Badge 
            variant="secondary" 
            className={autoBackupEnabled 
              ? "bg-green-100 text-green-800 hover:bg-green-200" 
              : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }
          >
            {autoBackupEnabled ? "Enabled" : "Disabled"}
          </Badge>
        </div>
      ),
      icon: RotateCcw,
    },
    {
      label: "Backup Time (UTC)",
      value: isEditing ? (
        <div className="flex items-center gap-2">
          <Input
            type="time"
            value={dailyTime}
            onChange={(e) => setDailyTime(e.target.value)}
            className="w-32 h-8 text-sm"
            disabled={configureBackupMutation.isPending}
          />
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-slate-800">
            {dailyTime}
          </span>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </div>
      ),
      icon: Clock,
    },
    {
      label: "Retention Period (days)",
      value: isEditing ? (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={retentionDays}
            onChange={(e) => setRetentionDays(e.target.value)}
            className="w-20 h-8 text-sm"
            min="1"
            max="365"
            disabled={configureBackupMutation.isPending}
          />
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-slate-800">
            {retentionDays}
          </span>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </div>
      ),
      icon: Settings,
    },
  ];

  return (
    <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-50 to-amber-100">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-800">
          <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-600">
            <Settings className="h-4 w-4 text-white" />
          </div>
          Backup Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {configItems.map((item, index) => (
          <div
            key={index}
            className="flex justify-between items-center p-3 rounded-lg hover:bg-white/50 transition-colors duration-200"
          >
            <div className="flex items-center gap-2">
              <item.icon className="h-4 w-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">
                {item.label}:
              </span>
            </div>
            {item.value}
          </div>
        ))}
        
        <div className="pt-4 border-t border-slate-200/50 space-y-3">
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button
                  onClick={handleUpdateConfiguration}
                  disabled={configureBackupMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg hover:shadow-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {configureBackupMutation.isPending ? "Saving..." : "Save Configuration"}
                </Button>
                <Button
                  onClick={handleEditToggle}
                  disabled={configureBackupMutation.isPending}
                  variant="outline"
                  className="px-4"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                onClick={handleEditToggle}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg hover:shadow-xl hover:from-orange-600 hover:to-amber-700 transition-all duration-200"
              >
                <Settings className="w-4 h-4 mr-2" />
                Edit Configuration
              </Button>
            )}
          </div>
          
          <div className="text-xs text-slate-600 text-center space-y-1">
            <p>
              Configuration changes will take effect on the next backup cycle
            </p>
            <p className="opacity-75">
              Auto backup runs daily at the specified time (UTC)
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
