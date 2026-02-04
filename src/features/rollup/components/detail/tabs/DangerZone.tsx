"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
    CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Trash2, PauseCircle, Loader2 } from "lucide-react";
import { ThanosStack, ThanosStackStatus } from "../../../schemas/thanos";
import { deleteRollup, stopRollup } from "../../../services/rollupService";
import { rollupKeys } from "../../../api/queries";
import toast from "react-hot-toast";

interface DangerZoneProps {
    stack: ThanosStack;
}

export function DangerZone({ stack }: DangerZoneProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [actionType, setActionType] = useState<"delete" | "stop" | null>(null);
    const [confirmName, setConfirmName] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const isMainnet = stack.network === "mainnet";
    const isOpen = actionType !== null;

    const handleClose = () => {
        setActionType(null);
        setConfirmName("");
        setIsLoading(false);
    };

    const handleConfirm = async () => {
        if (isMainnet && confirmName !== stack.name) return;

        setIsLoading(true);
        try {
            if (actionType === "delete") {
                await deleteRollup(stack.id);
                toast.success("Rollup deletion initiated");
                router.push("/rollup");
            } else if (actionType === "stop") {
                await stopRollup(stack.id);
                toast.success("Rollup stop initiated");
                handleClose();
                // Refresh the stack data
                queryClient.invalidateQueries({ queryKey: rollupKeys.thanosStack(stack.id) });
            }
        } catch (error) {
            console.error(`Failed to ${actionType} rollup:`, error);
            toast.error(`Failed to ${actionType} rollup`);
            setIsLoading(false);
        }
    };

    const isConfirmDisabled = isMainnet && confirmName !== stack.name;

    return (
        <Card className="border-red-200 bg-red-50 mt-8">
            <CardHeader>
                <CardTitle className="text-red-900 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Danger Zone
                </CardTitle>
                <CardDescription className="text-red-700">
                    Critical actions that affect the lifecycle of your rollup. Proceed with caution.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                    <h4 className="font-medium text-red-900">Stop Rollup</h4>
                    <p className="text-sm text-red-700">
                        Temporarily halt the rollup operations. Can be resumed later.
                    </p>
                </div>
                <Button
                    variant="destructive"
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => setActionType("stop")}
                    disabled={stack.status !== ThanosStackStatus.DEPLOYED}
                >
                    <PauseCircle className="mr-2 h-4 w-4" />
                    Stop Rollup
                </Button>
            </CardContent>
            <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-red-200 pt-4">
                <div className="space-y-1">
                    <h4 className="font-medium text-red-900">Delete Rollup</h4>
                    <p className="text-sm text-red-700">
                        Permanently delete this rollup and all associated data. This action cannot be undone.
                    </p>
                </div>
                <Button
                    variant="destructive"
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => setActionType("delete")}
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Rollup
                </Button>
            </CardContent>

            <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            {actionType === "delete" ? "Delete Rollup" : "Stop Rollup"}
                        </DialogTitle>
                        <DialogDescription>
                            {actionType === "delete"
                                ? "Are you absolutely sure you want to delete this rollup? This action cannot be undone."
                                : "Are you sure you want to stop this rollup? It will seemingly halt block production."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        {isMainnet ? (
                            <div className="space-y-4">
                                <div className="bg-red-50 p-3 rounded-md border border-red-200">
                                    <p className="text-sm text-red-800 font-medium">
                                        This is a Mainnet environment.
                                    </p>
                                    <p className="text-xs text-red-700 mt-1">
                                        To confirm, please type the rollup name: <span className="font-bold select-all">{stack.name}</span>
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirm-name">Rollup Name</Label>
                                    <Input
                                        id="confirm-name"
                                        value={confirmName}
                                        onChange={(e) => setConfirmName(e.target.value)}
                                        placeholder={stack.name}
                                        autoComplete="off"
                                    />
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-600">
                                Are you sure you want to proceed?
                            </p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirm}
                            disabled={isMainnet ? isConfirmDisabled : isLoading}
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {actionType === "delete" ? "Delete Rollup" : "Stop Rollup"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
