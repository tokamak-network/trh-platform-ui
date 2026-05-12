'use client';

import React, { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Upload, Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAwsCredentials } from '@/features/configuration/aws-credentials/hooks/useAwsCredentials';
import { useApiKeys } from '@/features/configuration/api-keys/hooks/useApiKeys';
import { useRpcUrls } from '@/features/configuration/rpc-management/hooks/useRpcUrls';
import { importFileSchema, type ImportFile } from './schemas';
import { useConfigurationImport, type ImportResults } from './useConfigurationImport';

type ParseIssue = { path: PropertyKey[]; message: string };

type PreFlightResult = {
  aws: { inFileDups: number; serverConflicts: number };
  rpc: { inFileDups: number; serverConflicts: number };
  apiKeys: { inFileDups: number; serverConflicts: number };
};

type DialogState =
  | { phase: 'idle' }
  | { phase: 'parsing' }
  | { phase: 'preview'; data: ImportFile; preFlight: PreFlightResult }
  | { phase: 'running' }
  | { phase: 'done'; results: ImportResults }
  | { phase: 'error'; issues: ParseIssue[] };

export function ConfigurationImportButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<DialogState>({ phase: 'idle' });
  const [showErrors, setShowErrors] = useState(false);

  const { awsCredentials } = useAwsCredentials();
  const { apiKeys } = useApiKeys();
  const { rpcUrls, refreshRpcUrls } = useRpcUrls();
  const { runImport } = useConfigurationImport({ refreshRpcUrls });

  const computePreFlight = (data: ImportFile): PreFlightResult => ({
    aws: {
      inFileDups: data.awsCredentials.length - new Set(data.awsCredentials.map((c) => c.name)).size,
      serverConflicts: data.awsCredentials.filter((c) =>
        awsCredentials.some((e) => e.name === c.name),
      ).length,
    },
    rpc: {
      inFileDups: data.rpcUrls.length - new Set(data.rpcUrls.map((r) => r.name)).size,
      serverConflicts: data.rpcUrls.filter((r) =>
        rpcUrls.some((e) => e.name === r.name),
      ).length,
    },
    apiKeys: {
      inFileDups: data.apiKeys.length - new Set(data.apiKeys.map((k) => k.type)).size,
      serverConflicts: data.apiKeys.filter((k) =>
        apiKeys.some((e) => e.type === k.type),
      ).length,
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (inputRef.current) inputRef.current.value = '';

    setState({ phase: 'parsing' });

    try {
      const text = await file.text();
      let json: unknown;
      try {
        json = JSON.parse(text);
      } catch {
        toast.error('Invalid JSON file');
        setState({ phase: 'idle' });
        return;
      }

      const result = importFileSchema.safeParse(json);
      if (!result.success) {
        setState({ phase: 'error', issues: result.error.issues });
        return;
      }

      setState({ phase: 'preview', data: result.data, preFlight: computePreFlight(result.data) });
    } catch {
      toast.error('Failed to read file');
      setState({ phase: 'idle' });
    }
  };

  const handleConfirm = async () => {
    if (state.phase !== 'preview') return;
    const data = state.data;
    setState({ phase: 'running' });

    try {
      const results = await runImport(data);
      setState({ phase: 'done', results });
    } catch {
      toast.error('Import failed');
      setState({ phase: 'idle' });
    }
  };

  const handleClose = () => {
    setState({ phase: 'idle' });
    setShowErrors(false);
  };

  const totalItems =
    state.phase === 'preview'
      ? state.data.awsCredentials.length + state.data.rpcUrls.length + state.data.apiKeys.length
      : 0;

  const allErrors =
    state.phase === 'done'
      ? [
          ...state.results.aws.errors.map((e) => ({ section: 'AWS', ...e })),
          ...state.results.rpc.errors.map((e) => ({ section: 'RPC', ...e })),
          ...state.results.apiKeys.errors.map((e) => ({ section: 'API Keys', ...e })),
        ]
      : [];

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
        <Upload className="h-4 w-4 mr-2" />
        Import from file
      </Button>

      <Dialog
        open={state.phase !== 'idle'}
        onOpenChange={(open) => {
          if (!open && state.phase !== 'running') handleClose();
        }}
      >
        <DialogContent className="sm:max-w-md">
          {(state.phase === 'parsing' || state.phase === 'running') && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {state.phase === 'parsing' ? 'Parsing file...' : 'Importing...'}
                </DialogTitle>
                <DialogDescription>Please wait.</DialogDescription>
              </DialogHeader>
              <div className="flex justify-center py-6">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            </>
          )}

          {state.phase === 'error' && (
            <>
              <DialogHeader>
                <DialogTitle>Validation Error</DialogTitle>
                <DialogDescription>
                  The selected file does not match the required format.
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-60 overflow-y-auto space-y-1">
                {state.issues.map((issue, i) => (
                  <div key={i} className="text-destructive font-mono text-xs">
                    {issue.path.length > 0 ? issue.path.map(String).join('.') + ': ' : ''}
                    {issue.message}
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button onClick={handleClose}>Close</Button>
              </DialogFooter>
            </>
          )}

          {state.phase === 'preview' && (
            <>
              <DialogHeader>
                <DialogTitle>Import Configuration</DialogTitle>
                <DialogDescription>
                  Review what will be imported. Existing items will be skipped.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-0 divide-y text-sm">
                {(
                  [
                    { label: 'AWS Credentials', items: state.data.awsCredentials.length, info: state.preFlight.aws },
                    { label: 'RPC URLs', items: state.data.rpcUrls.length, info: state.preFlight.rpc },
                    { label: 'API Keys', items: state.data.apiKeys.length, info: state.preFlight.apiKeys },
                  ] satisfies { label: string; items: number; info: PreFlightResult[keyof PreFlightResult] }[]
                ).map(({ label, items, info }) => (
                  <div key={label} className="flex items-center justify-between py-2">
                    <span className="font-medium">{label}</span>
                    <span className="text-muted-foreground text-xs">
                      {items} item{items !== 1 ? 's' : ''}
                      {info.serverConflicts > 0 && (
                        <span className="text-yellow-600"> · {info.serverConflicts} already exist</span>
                      )}
                      {info.inFileDups > 0 && (
                        <span className="text-orange-500"> · {info.inFileDups} dup</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={handleConfirm} disabled={totalItems === 0}>
                  Import
                </Button>
              </DialogFooter>
            </>
          )}

          {state.phase === 'done' && (
            <>
              <DialogHeader>
                <DialogTitle>Import Complete</DialogTitle>
                <DialogDescription>Summary of the import operation.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                {(
                  [
                    { label: 'AWS Credentials', result: state.results.aws },
                    { label: 'RPC URLs', result: state.results.rpc },
                    { label: 'API Keys', result: state.results.apiKeys },
                  ] satisfies { label: string; result: ImportResults[keyof ImportResults] }[]
                ).map(({ label, result }) => (
                  <div key={label}>
                    <div className="font-medium mb-0.5">{label}</div>
                    <div className="text-muted-foreground text-xs">
                      <span className="text-green-600">{result.created} created</span>
                      {' · '}
                      <span>{result.skipped} skipped</span>
                      {' · '}
                      <span className={result.failed > 0 ? 'text-destructive' : ''}>
                        {result.failed} failed
                      </span>
                    </div>
                  </div>
                ))}

                {allErrors.length > 0 && (
                  <div className="mt-1">
                    <button
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => setShowErrors((v) => !v)}
                    >
                      <ChevronDown
                        className={`h-3 w-3 transition-transform ${showErrors ? 'rotate-180' : ''}`}
                      />
                      {showErrors ? 'Hide' : 'Show'} errors ({allErrors.length})
                    </button>
                    {showErrors && (
                      <div className="mt-1 max-h-40 overflow-y-auto space-y-1 rounded border p-2">
                        {allErrors.map((err, i) => (
                          <div key={i} className="text-xs text-destructive font-mono">
                            [{err.section}] {err.identifier}: {err.message}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button onClick={handleClose}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
