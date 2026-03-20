"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, ExternalLink, RotateCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useFormContext } from "react-hook-form";
import type { CreateRollupFormData } from "../../schemas/create-rollup";
import { useAwsCredentials } from "@/features/configuration/aws-credentials/hooks/useAwsCredentials";
import { useAwsRegions } from "@/features/configuration/aws-credentials/hooks/useAwsRegions";

// ---------------------------------------------------------------------------
// Desktop bridge detection
// ---------------------------------------------------------------------------

interface DesktopAwsCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  source: string;
}

interface DesktopBridge {
  awsSsoLoginDirect: (startUrl: string, region: string) => Promise<void>;
  awsSsoListAccounts: () => Promise<{ accountId: string; accountName: string; emailAddress: string }[]>;
  awsSsoListRoles: (accountId: string) => Promise<{ roleName: string; accountId: string }[]>;
  awsSsoAssumeRole: (accountId: string, roleName: string) => Promise<DesktopAwsCredentials>;
  awsGetCredentials: () => Promise<DesktopAwsCredentials | null>;
  awsClear: () => Promise<void>;
}

export function getDesktopBridge(): DesktopBridge | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as Record<string, any>;
    if (w.__TRH_DESKTOP__?.awsSsoLoginDirect) return w.__TRH_DESKTOP__ as DesktopBridge;
  } catch {}
  return null;
}

function getDesktopAwsCredentials(): DesktopAwsCredentials | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as Record<string, any>;
    const data: DesktopAwsCredentials | undefined = w.__TRH_AWS_CREDENTIALS__;
    if (data?.accessKeyId && data?.secretAccessKey) return data;
  } catch {}
  return null;
}

// ---------------------------------------------------------------------------
// SSO Login Flow component (Desktop only)
// ---------------------------------------------------------------------------

type SsoStep = "input" | "waiting" | "select-account" | "select-role" | "done";

interface SsoAccount { accountId: string; accountName: string; emailAddress: string; }
interface SsoRole { roleName: string; accountId: string; }

const AWS_REGIONS = [
  "us-east-1", "us-east-2", "us-west-1", "us-west-2",
  "eu-west-1", "eu-central-1",
  "ap-northeast-1", "ap-northeast-2", "ap-southeast-1",
];

export function DesktopAwsKeyInput({ onComplete }: { onComplete: (creds: DesktopAwsCredentials) => void }) {
  const [accessKeyId, setAccessKeyId] = React.useState("");
  const [secretAccessKey, setSecretAccessKey] = React.useState("");
  const [region, setRegion] = React.useState("ap-northeast-2");
  const [error, setError] = React.useState<string | null>(null);

  const isValid = accessKeyId.trim().length >= 16 && secretAccessKey.trim().length >= 16;

  const handleSubmit = () => {
    if (!isValid) return;
    setError(null);
    onComplete({
      accessKeyId: accessKeyId.trim(),
      secretAccessKey: secretAccessKey.trim(),
      source: `manual:${region}`,
    });
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle>AWS Credentials</CardTitle>
        <CardDescription>
          Enter your AWS access keys. Credentials are stored in memory only and
          never saved to disk.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Access Key ID <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="AKIA..."
              value={accessKeyId}
              onChange={(e) => setAccessKeyId(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Secret Access Key <span className="text-destructive">*</span>
            </label>
            <Input
              type="password"
              placeholder="Enter secret key"
              value={secretAccessKey}
              onChange={(e) => setSecretAccessKey(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Region <span className="text-destructive">*</span>
          </label>
          <Select value={region} onValueChange={setRegion}>
            <SelectTrigger className="w-[240px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AWS_REGIONS.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleSubmit} disabled={!isValid}>
            Continue
          </Button>
          <p className="text-xs text-muted-foreground">
            Credentials are kept in memory only. They are discarded when the app closes.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main AwsConfig component
// ---------------------------------------------------------------------------

interface AwsConfigProps {
  onNext: () => void;
  onBack: () => void;
}

function DesktopAwsConfig({ onNext }: { onNext: () => void }) {
  const { setValue } = useFormContext<CreateRollupFormData>();
  const [desktopAwsApplied, setDesktopAwsApplied] = React.useState(false);

  React.useEffect(() => {
    if (desktopAwsApplied) return;
    const desktop = getDesktopAwsCredentials();
    if (!desktop) return;
    applyCredentials(desktop);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const applyCredentials = (creds: DesktopAwsCredentials) => {
    setValue("accountAndAws.awsAccessKey", creds.accessKeyId);
    setValue("accountAndAws.awsSecretKey", creds.secretAccessKey);
    setValue("accountAndAws.credentialId", "desktop-provided");
    setValue("accountAndAws.accountName", creds.source);
    // Extract region from source (format: "manual:<region>")
    const region = creds.source.startsWith("manual:") ? creds.source.slice(7) : "us-east-1";
    setValue("accountAndAws.awsRegion", region);
    setDesktopAwsApplied(true);
    onNext();
  };

  if (desktopAwsApplied) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">AWS Configuration</h2>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800 font-medium">
              AWS credentials configured.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">AWS Configuration</h2>
        <p className="text-muted-foreground">
          Enter your AWS credentials for rollup deployment.
        </p>
      </div>
      <DesktopAwsKeyInput onComplete={applyCredentials} />
    </div>
  );
}

export function AwsConfig({ onNext }: AwsConfigProps) {
  const isDesktop = !!getDesktopBridge();

  if (isDesktop) {
    return <DesktopAwsConfig onNext={onNext} />;
  }

  return <WebAwsConfig onNext={onNext} />;
}

// eslint-disable-next-line react-hooks/rules-of-hooks -- standalone component, not conditional
function WebAwsConfig({ onNext }: { onNext: () => void }) {
  const {
    setValue,
    watch,
    register,
    formState: { errors },
  } = useFormContext<CreateRollupFormData>();

  React.useEffect(() => {
    register("accountAndAws.credentialId", {
      required: "AWS Access Key is required",
    });
    register("accountAndAws.awsRegion", { required: "AWS Region is required" });
  }, [register]);

  const { awsCredentials, isLoading, refreshCredentials } = useAwsCredentials(); // eslint-disable-line react-hooks/rules-of-hooks
  const {
    regions,
    isLoading: isLoadingRegions,
    error: regionsError,
    fetchRegions,
    clearRegions,
  } = useAwsRegions(); // eslint-disable-line react-hooks/rules-of-hooks
  const selectedCredentialId = watch("accountAndAws.credentialId") as string;

  const [lastFetchedCredentialId, setLastFetchedCredentialId] =
    React.useState<string>(""); // eslint-disable-line react-hooks/rules-of-hooks

  // Fetch regions when credentials are selected
  React.useEffect(() => { // eslint-disable-line react-hooks/rules-of-hooks
    if (
      selectedCredentialId &&
      awsCredentials &&
      selectedCredentialId !== lastFetchedCredentialId
    ) {
      const selectedCredential = awsCredentials.find(
        (cred) => cred.id === selectedCredentialId
      );

      if (selectedCredential) {
        setValue("accountAndAws.awsRegion", "");
        fetchRegions(
          selectedCredential.accessKeyId,
          selectedCredential.secretAccessKey
        );
        setLastFetchedCredentialId(selectedCredentialId);
      }
    } else if (!selectedCredentialId && lastFetchedCredentialId) {
      clearRegions();
      setValue("accountAndAws.awsRegion", "");
      setLastFetchedCredentialId("");
    }
  }, [
    selectedCredentialId,
    awsCredentials,
    lastFetchedCredentialId,
    fetchRegions,
    clearRegions,
    setValue,
  ]);

  const currentRegion = watch("accountAndAws.awsRegion");
  React.useEffect(() => { // eslint-disable-line react-hooks/rules-of-hooks
    if (regions.length > 0 && !currentRegion && !isLoadingRegions) {
      const defaultRegion =
        regions.find((r) => r.value === "us-east-1") || regions[0];
      setValue("accountAndAws.awsRegion", defaultRegion.value);
    }
  }, [regions, currentRegion, isLoadingRegions, setValue]);

  const awsRegion = watch("accountAndAws.awsRegion");

  React.useEffect(() => { // eslint-disable-line react-hooks/rules-of-hooks
    if (selectedCredentialId && awsRegion) {
      onNext();
    }
  }, [selectedCredentialId, awsRegion, onNext]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">AWS Configuration</h2>
        <p className="text-muted-foreground">
          Select AWS credentials for your rollup deployment
        </p>
      </div>

      <Card className="border-0 shadow-lg w-3/4">
        <CardHeader>
          <CardTitle>AWS Access Key</CardTitle>
          <CardDescription>
            Choose the AWS credentials to use for deploying your rollup
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {awsCredentials && awsCredentials.length > 0 ? (
            <div className="flex justify-between gap-4">
              <div className="space-y-2 w-3/4">
                <label className="text-sm font-medium">
                  Select AWS Access Key{" "}
                  <span className="text-destructive">*</span>
                </label>
                <Select
                  value={selectedCredentialId}
                  onValueChange={(value) => {
                    setValue("accountAndAws.credentialId", value);
                    const selectedCredential = awsCredentials.find(
                      (cred) => cred.id === value
                    );
                    if (selectedCredential) {
                      setValue("accountAndAws.accountName", selectedCredential.name);
                      setValue("accountAndAws.awsAccessKey", selectedCredential.accessKeyId);
                      setValue("accountAndAws.awsSecretKey", selectedCredential.secretAccessKey);
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={isLoading ? "Loading..." : "Choose an AWS access key"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {awsCredentials.map((credential) => (
                      <SelectItem key={credential.id} value={credential.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{credential.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {credential.accessKeyId}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.accountAndAws?.credentialId && (
                  <p className="text-sm text-destructive">
                    {errors.accountAndAws.credentialId.message}
                  </p>
                )}
              </div>

              <div className="space-y-2 w-3/4">
                <label className="text-sm font-medium">
                  AWS Region <span className="text-destructive">*</span>
                </label>
                <Select
                  value={watch("accountAndAws.awsRegion")}
                  onValueChange={(value) => setValue("accountAndAws.awsRegion", value)}
                  disabled={!selectedCredentialId || isLoadingRegions}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        !selectedCredentialId
                          ? "Select AWS credentials first"
                          : isLoadingRegions
                          ? "Loading regions..."
                          : "Select a region"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {regionsError && (
                  <p className="text-sm text-destructive">{regionsError}</p>
                )}
                {errors.accountAndAws?.awsRegion && (
                  <p className="text-sm text-destructive">
                    {errors.accountAndAws.awsRegion.message}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="flex items-center gap-2">
                No AWS access keys found
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 hover:bg-transparent cursor-pointer"
                  onClick={() => refreshCredentials()}
                >
                  <RotateCw className="h-3 w-3" />
                </Button>
              </AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>
                  No AWS access keys found. Please add AWS credentials in the
                  Configuration section.
                </span>
                <Button variant="outline" size="sm" asChild>
                  <a href="/configuration" target="_blank" rel="noopener noreferrer">
                    Go to Configuration <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
