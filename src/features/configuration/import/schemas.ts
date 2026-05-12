import * as z from 'zod';
import {
  createAwsCredentialSchema,
  createRpcUrlSchema,
  createApiKeySchema,
} from '@/features/configuration/schemas';

export const importFileSchema = z
  .object({
    version: z.literal(1),
    awsCredentials: z.array(createAwsCredentialSchema.strict()).optional().default([]),
    rpcUrls: z.array(createRpcUrlSchema.strict()).optional().default([]),
    apiKeys: z.array(createApiKeySchema.strict()).optional().default([]),
  })
  .strict();

export type ImportFile = z.infer<typeof importFileSchema>;
