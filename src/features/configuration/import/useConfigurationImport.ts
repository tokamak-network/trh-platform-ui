'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { awsCredentialsService } from '@/features/configuration/aws-credentials/services/awsCredentialsService';
import { rpcUrlService } from '@/features/configuration/rpc-management/services/rpcUrlService';
import { apiKeysService } from '@/features/configuration/api-keys/services/apiKeysService';
import type { ImportFile } from './schemas';

type SectionResult = {
  created: number;
  skipped: number;
  failed: number;
  errors: Array<{ identifier: string; message: string }>;
};

export type ImportResults = {
  aws: SectionResult;
  rpc: SectionResult;
  apiKeys: SectionResult;
};

const emptySection = (): SectionResult => ({
  created: 0,
  skipped: 0,
  failed: 0,
  errors: [],
});

function categorize(error: unknown, identifier: string, section: SectionResult): void {
  const msg = error instanceof Error ? error.message : 'Unknown error';
  if (/already exists/i.test(msg)) {
    section.skipped++;
  } else {
    section.failed++;
    section.errors.push({ identifier, message: msg });
  }
}

export function useConfigurationImport(opts: { refreshRpcUrls: () => Promise<void> }) {
  const queryClient = useQueryClient();
  const [isRunning, setIsRunning] = useState(false);

  const runImport = async (data: ImportFile): Promise<ImportResults> => {
    setIsRunning(true);
    const results: ImportResults = {
      aws: emptySection(),
      rpc: emptySection(),
      apiKeys: emptySection(),
    };

    for (const cred of data.awsCredentials) {
      try {
        await awsCredentialsService.createAwsCredential(cred);
        results.aws.created++;
      } catch (error) {
        categorize(error, cred.name, results.aws);
      }
    }

    for (const rpc of data.rpcUrls) {
      try {
        await rpcUrlService.createRpcUrl(rpc);
        results.rpc.created++;
      } catch (error) {
        categorize(error, rpc.name, results.rpc);
      }
    }

    for (const key of data.apiKeys) {
      try {
        await apiKeysService.createApiKey(key);
        results.apiKeys.created++;
      } catch (error) {
        categorize(error, key.type, results.apiKeys);
      }
    }

    await queryClient.invalidateQueries({ queryKey: ['configuration', 'aws-credentials'] });
    await queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    await opts.refreshRpcUrls();

    setIsRunning(false);
    return results;
  };

  return { runImport, isRunning };
}
