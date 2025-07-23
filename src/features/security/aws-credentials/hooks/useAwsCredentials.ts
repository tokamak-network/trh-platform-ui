"use client";

import { useState, useEffect, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { awsCredentialsService } from "../services/awsCredentialsService";
import {
  AWSCredential,
  AWSCredentialFormData,
  SecurityState,
} from "../../schemas";
import toast from "react-hot-toast";

export const useAwsCredentials = () => {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Query for AWS credentials
  const {
    data: awsCredentials = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["security", "aws-credentials"],
    queryFn: async () => {
      try {
        console.log("Fetching AWS credentials...");
        const result = await awsCredentialsService.getAwsCredentials();
        console.log("AWS credentials fetched successfully:", result);
        return result;
      } catch (error) {
        console.error("Error fetching AWS credentials:", error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      console.error(`Query failed (attempt ${failureCount + 1}):`, error);
      return failureCount < 2; // Retry up to 2 times
    },
  });

  // Create AWS credential mutation
  const createCredentialMutation = useMutation({
    mutationFn: (data: AWSCredentialFormData) => {
      console.log("Creating AWS credential:", data);
      return awsCredentialsService.createAwsCredential(data);
    },
    onSuccess: (newCredential) => {
      console.log("AWS credential created successfully:", newCredential);
      queryClient.setQueryData(
        ["security", "aws-credentials"],
        (old: AWSCredential[] = []) => [...old, newCredential]
      );
      toast.success("AWS credentials added successfully");
    },
    onError: (error: Error) => {
      console.error("Error creating AWS credential:", error);
      toast.error(error.message || "Failed to add AWS credentials");
    },
  });

  // Update AWS credential mutation
  const updateCredentialMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AWSCredentialFormData }) => {
      console.log("Updating AWS credential:", { id, data });
      return awsCredentialsService.updateAwsCredential(id, data);
    },
    onSuccess: (updatedCredential) => {
      console.log("AWS credential updated successfully:", updatedCredential);
      queryClient.setQueryData(
        ["security", "aws-credentials"],
        (old: AWSCredential[] = []) =>
          old.map((cred) =>
            cred.id === updatedCredential.id ? updatedCredential : cred
          )
      );
      toast.success("AWS credentials updated successfully");
    },
    onError: (error: Error) => {
      console.error("Error updating AWS credential:", error);
      toast.error(error.message || "Failed to update AWS credentials");
    },
  });

  // Delete AWS credential mutation
  const deleteCredentialMutation = useMutation({
    mutationFn: (id: string) => {
      console.log("Deleting AWS credential:", id);
      return awsCredentialsService.deleteAwsCredential(id);
    },
    onMutate: (id: string) => {
      setDeletingId(id);
    },
    onSuccess: (_, deletedId) => {
      console.log("AWS credential deleted successfully:", deletedId);
      queryClient.setQueryData(
        ["security", "aws-credentials"],
        (old: AWSCredential[] = []) =>
          old.filter((cred) => cred.id !== deletedId)
      );
      toast.success("AWS credentials deleted successfully");
      setDeletingId(null);
    },
    onError: (error: Error) => {
      console.error("Error deleting AWS credential:", error);
      toast.error(error.message || "Failed to delete AWS credentials");
      setDeletingId(null);
    },
  });

  // Test AWS credential mutation
  const testCredentialMutation = useMutation({
    mutationFn: (id: string) => {
      console.log("Testing AWS credential:", id);
      return awsCredentialsService.testAwsCredential(id);
    },
    onSuccess: () => {
      console.log("AWS credential test successful");
      toast.success("AWS credentials are valid");
    },
    onError: (error: Error) => {
      console.error("Error testing AWS credential:", error);
      toast.error(error.message || "AWS credentials test failed");
    },
  });

  // Handler functions
  const addCredential = useCallback(
    (data: AWSCredentialFormData) => {
      createCredentialMutation.mutate(data);
    },
    [createCredentialMutation]
  );

  const updateCredential = useCallback(
    (id: string, data: AWSCredentialFormData) => {
      updateCredentialMutation.mutate({ id, data });
    },
    [updateCredentialMutation]
  );

  const deleteCredential = useCallback(
    (id: string) => {
      deleteCredentialMutation.mutate(id);
    },
    [deleteCredentialMutation]
  );

  const testCredential = useCallback(
    (id: string) => {
      testCredentialMutation.mutate(id);
    },
    [testCredentialMutation]
  );

  const refreshCredentials = useCallback(() => {
    console.log("Refreshing credentials...");
    refetch();
  }, [refetch]);

  // Security state
  const securityState: SecurityState = {
    awsCredentials,
    isLoading,
    error: error?.message || null,
  };

  // Debug logging
  useEffect(() => {
    console.log("Security state updated:", {
      awsCredentials: awsCredentials.length,
      isLoading,
      error: error?.message,
    });
  }, [awsCredentials, isLoading, error]);

  return {
    // State
    ...securityState,

    // Loading states
    isAdding: createCredentialMutation.isPending,
    isUpdating: updateCredentialMutation.isPending,
    isDeleting: deleteCredentialMutation.isPending,
    isTesting: testCredentialMutation.isPending,
    deletingId,

    // Actions
    addCredential,
    updateCredential,
    deleteCredential,
    testCredential,
    refreshCredentials,

    // Utilities
    maskSecretKey: awsCredentialsService.maskSecretKey,
    copyToClipboard: awsCredentialsService.copyToClipboard,
  };
};
