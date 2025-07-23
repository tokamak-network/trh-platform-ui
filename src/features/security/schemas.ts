import * as z from "zod";

// AWS Credential schemas
export const awsCredentialSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  accessKeyId: z.string().min(1, "Access Key ID is required"),
  secretAccessKey: z.string().min(1, "Secret Access Key is required"),
  region: z.string().optional(),
  createdAt: z.string(),
  lastUsed: z.string().optional(),
  status: z.enum(["active", "inactive"]),
});

export const createAwsCredentialSchema = z.object({
  name: z.string().min(1, "Name is required"),
  accessKeyId: z.string().min(1, "Access Key ID is required"),
  secretAccessKey: z.string().min(1, "Secret Access Key is required"),
  region: z.string().optional(),
});

export const updateAwsCredentialSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  accessKeyId: z.string().min(1, "Access Key ID is required").optional(),
  secretAccessKey: z
    .string()
    .min(1, "Secret Access Key is required")
    .optional(),
  region: z.string().optional(),
});

// API Response schemas
export const awsCredentialsListResponseSchema = z.object({
  credentials: z.array(awsCredentialSchema),
  total: z.number(),
});

export const awsCredentialResponseSchema = z.object({
  credential: awsCredentialSchema,
});

// Form schemas
export const awsCredentialFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  accessKeyId: z.string().min(1, "Access Key ID is required"),
  secretAccessKey: z.string().min(1, "Secret Access Key is required"),
  region: z.string().optional(),
});

// Infer types from schemas
export type AWSCredential = z.infer<typeof awsCredentialSchema>;
export type CreateAWSCredentialRequest = z.infer<
  typeof createAwsCredentialSchema
>;
export type UpdateAWSCredentialRequest = z.infer<
  typeof updateAwsCredentialSchema
>;
export type AWSCredentialsListResponse = z.infer<
  typeof awsCredentialsListResponseSchema
>;
export type AWSCredentialResponse = z.infer<typeof awsCredentialResponseSchema>;
export type AWSCredentialFormData = z.infer<typeof awsCredentialFormSchema>;

// Security tab types
export type SecurityTab = "aws" | "wallets" | "encryption" | "monitoring";

// UI state types
export type SecretVisibilityState = { [key: string]: boolean };

export interface SecurityState {
  awsCredentials: AWSCredential[];
  isLoading: boolean;
  error: string | null;
}
