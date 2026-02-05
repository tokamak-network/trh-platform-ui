"use client";

import React, { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, CheckCircle, AlertCircle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiClient } from "@/lib/api";

interface TaskProgressProps {
    taskId: string;
    title?: string;
    onComplete?: (data: TaskStatus) => void;
    onError?: (error: string) => void;
}

interface TaskStatus {
    id: string;
    status: string;
    percentage: number;
    message: string;
    updatedAt?: string;
    startedAt?: string;
    result?: unknown;
}

export function TaskProgress({ taskId, title = "Task Progress", onComplete, onError }: TaskProgressProps) {
    const [progress, setProgress] = useState<number>(0);
    const [status, setStatus] = useState<string>("pending");
    const [message, setMessage] = useState<string>("Initializing...");
    const [error, setError] = useState<string | null>(null);
    const [startedAt, setStartedAt] = useState<string | null>(null);
    const [elapsedTime, setElapsedTime] = useState<string>("00:00");

    useEffect(() => {
        if (!startedAt) return;

        const interval = setInterval(() => {
            const start = new Date(startedAt).getTime();
            const now = new Date().getTime();
            const diff = Math.floor((now - start) / 1000);

            const safeDiff = Math.max(0, diff);
            const minutes = Math.floor(safeDiff / 60).toString().padStart(2, '0');
            const seconds = (safeDiff % 60).toString().padStart(2, '0');
            setElapsedTime(`${minutes}:${seconds}`);
        }, 1000);

        return () => clearInterval(interval);
    }, [startedAt, status]);

    useEffect(() => {
        if (!taskId) return;

        const pollInterval = setInterval(async () => {
            try {
                // Need to use appropriate API client or fetch
                // Assuming /api/v1/tasks endpoint is proxied or available
                const response = await apiClient.get<TaskStatus>(`tasks/${taskId}`);
                const data = response.data;

                setProgress(data.percentage);
                setStatus(data.status);
                setMessage(data.message);
                if (data.startedAt) {
                    setStartedAt(data.startedAt);
                }

                if (data.status === "completed" || data.status === "success" || data.percentage >= 100) {
                    clearInterval(pollInterval);
                    if (onComplete) onComplete(data);
                } else if (data.status === "failed" || data.status === "error") {
                    clearInterval(pollInterval);
                    setError(data.message || "Task failed");
                    if (onError) onError(data.message || "Task failed");
                }
            } catch (err: unknown) {
                // Handle 404 naturally as "pending/not found yet" or error depending on desired UX
                // If 404, maybe task hasn't started registering yet, or expired.
                // For now, treat errors as failures if persistent.
                console.error("Failed to poll task status:", err);
            }
        }, 2000); // Poll every 2 seconds

        return () => clearInterval(pollInterval);
    }, [taskId, onComplete, onError]);

    return (
        <Card className="w-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                    {title}
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground mr-1">{elapsedTime}</span>
                        <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
                        {status === "pending" || status === "running" ? (
                            <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />
                        ) : status === "completed" || status === "success" ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground truncate" title={message}>
                    {message}
                </p>
                <div className="flex items-start gap-2 mt-2 p-2 bg-blue-50/50 rounded-md border border-blue-100">
                    <Info className="w-3 h-3 text-blue-500 mt-0.5 shrink-0" />
                    <p className="text-[10px] text-blue-600 leading-tight">
                        Closing this window will NOT stop the process running in the background.
                    </p>
                </div>

                {error && (
                    <Alert variant="destructive" className="mt-2 py-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">{error}</AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
}
