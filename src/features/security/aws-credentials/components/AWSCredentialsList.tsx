"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  AWSCredential,
  AWSCredentialFormData,
  SecretVisibilityState,
} from "../../schemas";
import { AWSCredentialCard } from "./AWSCredentialCard";
import { AWSCredentialForm } from "./AWSCredentialForm";

interface AWSCredentialsListProps {
  credentials: AWSCredential[];
  onAdd: (data: AWSCredentialFormData) => void;
  onUpdate: (id: string, data: AWSCredentialFormData) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
  isAdding?: boolean;
  isUpdating?: boolean;
  isDeleting?: boolean;
  deletingId?: string | null;
}

export function AWSCredentialsList({
  credentials,
  onAdd,
  onUpdate,
  onDelete,
  isLoading = false,
  isAdding = false,
  isUpdating = false,
  isDeleting = false,
  deletingId,
}: AWSCredentialsListProps) {
  const [showSecrets, setShowSecrets] = useState<SecretVisibilityState>({});
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCredential, setEditingCredential] =
    useState<AWSCredential | null>(null);

  const toggleSecretVisibility = (credentialId: string) => {
    setShowSecrets((prev) => ({
      ...prev,
      [credentialId]: !prev[credentialId],
    }));
  };

  const handleAdd = (data: AWSCredentialFormData) => {
    onAdd(data);
    setIsAddDialogOpen(false);
  };

  const handleEdit = (credential: AWSCredential) => {
    setEditingCredential(credential);
  };

  const handleUpdate = (data: AWSCredentialFormData) => {
    if (editingCredential) {
      onUpdate(editingCredential.id, data);
      setEditingCredential(null);
    }
  };

  const handleDelete = (id: string) => {
    onDelete(id);
  };

  const handleCloseEditDialog = () => {
    setEditingCredential(null);
  };

  const handleCloseAddDialog = () => {
    setIsAddDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AWS Credentials</h2>
          <p className="text-muted-foreground">
            Manage AWS access keys for rollup deployments
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} disabled={isLoading}>
          <Plus className="w-4 h-4 mr-2" />
          Add AWS Credentials
        </Button>
      </div>

      {/* Credentials List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading credentials...</div>
        </div>
      ) : credentials.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="text-muted-foreground mb-2">
              No AWS credentials found
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add your first credential
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {credentials.map((credential) => (
            <AWSCredentialCard
              key={credential.id}
              credential={credential}
              showSecrets={showSecrets}
              onToggleSecret={toggleSecretVisibility}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isDeleting={isDeleting && deletingId === credential.id}
            />
          ))}
        </div>
      )}

      {/* Add Credential Dialog */}
      <AWSCredentialForm
        isOpen={isAddDialogOpen}
        onClose={handleCloseAddDialog}
        onSubmit={handleAdd}
        isLoading={isAdding}
      />

      {/* Edit Credential Dialog */}
      <AWSCredentialForm
        isOpen={!!editingCredential}
        onClose={handleCloseEditDialog}
        onSubmit={handleUpdate}
        isLoading={isUpdating}
        credential={editingCredential}
      />
    </div>
  );
}
