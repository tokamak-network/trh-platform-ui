"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TaskProgress } from "@/components/TaskProgress";

interface TaskProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string | null;
  title: string;
  description: string;
  onComplete: (data?: unknown) => void;
  onError: (error: string) => void;
}

export function TaskProgressDialog({
  open,
  onOpenChange,
  taskId,
  title,
  description,
  onComplete,
  onError,
}: TaskProgressDialogProps) {
  if (!taskId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <TaskProgress
          taskId={taskId}
          title={title}
          onComplete={onComplete}
          onError={onError}
        />
      </DialogContent>
    </Dialog>
  );
}

