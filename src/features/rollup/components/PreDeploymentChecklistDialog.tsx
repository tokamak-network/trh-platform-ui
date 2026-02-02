"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

interface PreDeploymentChecklistDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    isDeploying: boolean;
    network: string;
}

export function PreDeploymentChecklistDialog({
    open,
    onOpenChange,
    onConfirm,
    isDeploying,
    network,
}: PreDeploymentChecklistDialogProps) {
    const checklistItems = [
        {
            id: "rpc-check",
            label: "RPC Connection Verified",
            description: "Confirmed connection to L1 RPC and Beacon nodes.",
        },
        {
            id: "balance-check",
            label: "Account Balances Sufficient",
            description: "Admin, Proposer, and Batcher accounts have sufficient ETH.",
        },
        {
            id: "aws-check",
            label: "AWS Credentials Validated",
            description: "AWS permissions for EFS and EC2 are confirmed.",
        },
        {
            id: "config-check",
            label: "Configuration Reviewed",
            description: "All rollup parameters including blocked time are final.",
        },
    ];

    const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

    // Reset checked items when dialog opens
    useEffect(() => {
        if (open) {
            setCheckedItems({});
        }
    }, [open]);

    const handleCheckChange = (id: string, checked: boolean) => {
        setCheckedItems((prev) => ({
            ...prev,
            [id]: checked,
        }));
    };

    const allChecked = checklistItems.every((item) => checkedItems[item.id]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-amber-600">
                        <AlertTriangle className="h-5 w-5" />
                        Pre-Deployment Checklist
                    </DialogTitle>
                    <DialogDescription>
                        You are deploying to <span className="font-bold text-foreground capitalize">{network}</span>.
                        Please verify the following critical items before proceeding.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <div className="bg-amber-50 p-4 rounded-md border border-amber-200 mb-4">
                        <p className="text-sm text-amber-800">
                            This is the final check. Once deployment starts, resources will be provisioned and costs incurred.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {checklistItems.map((item) => (
                            <div key={item.id} className="flex items-start space-x-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                                <Checkbox
                                    id={item.id}
                                    checked={checkedItems[item.id] || false}
                                    onCheckedChange={(checked) =>
                                        handleCheckChange(item.id, checked as boolean)
                                    }
                                    className="mt-1"
                                />
                                <div className="space-y-1">
                                    <Label
                                        htmlFor={item.id}
                                        className="text-sm font-medium leading-none cursor-pointer"
                                    >
                                        {item.label}
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        {item.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isDeploying}
                        className="w-full sm:w-auto"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={!allChecked || isDeploying}
                        className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700"
                    >
                        {isDeploying ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deploying...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Confirm & Deploy
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
