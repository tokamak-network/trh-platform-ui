"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dices, Rocket, FileCode, Globe, Key, Eye, EyeOff, Database,
  HardDrive, Cloud, Check, Loader2, AlertCircle, ChevronLeft,
  ChevronDown, ChevronUp, Info, Shield, Shuffle, Users, Blocks,
} from "lucide-react";

interface NetworkConfig {
  rpcUrl: string;
  chainId: number;
  name: string;
}

interface InstallDRBDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stackId: string;
  chainName: string;
  deployedNetwork?: NetworkConfig;
}

type Step = "mode" | "network" | "config" | "database" | "deploying" | "success" | "error";
type DeployMode = "fresh" | "existing";
type NetworkMode = "deployed" | "custom";
type DatabaseType = "local" | "rds";

interface FormState {
  deployMode: DeployMode | null;
  networkMode: NetworkMode;
  customRpcUrl: string;
  customChainId: string;
  privateKey: string;
  contractAddress: string;
  databaseType: DatabaseType;
  dbUsername: string;
  dbPassword: string;
}

const initialForm: FormState = {
  deployMode: null,
  networkMode: "deployed",
  customRpcUrl: "",
  customChainId: "",
  privateKey: "",
  contractAddress: "",
  databaseType: "local",
  dbUsername: "",
  dbPassword: "",
};

const deployTasks = [
  "Validating credentials",
  "Cloning Commit-Reveal2",
  "Building contracts",
  "Deploying to chain",
  "Provisioning database",
  "Starting leader node",
  "Starting regular nodes",
  "Configuring P2P mesh",
  "Verifying deployment",
];

const demoOutput = {
  contracts: {
    contractAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    contractName: "CommitReveal2L2",
    chainId: 111551119090,
  },
  application: {
    leaderNodeUrl: "https://drb-leader.thanos-sepolia.tokamak.network",
    regularNodeUrls: [
      "https://drb-node-1.thanos-sepolia.tokamak.network",
      "https://drb-node-2.thanos-sepolia.tokamak.network",
      "https://drb-node-3.thanos-sepolia.tokamak.network",
    ],
  },
};

const isValidAddress = (addr: string) => /^0x[a-fA-F0-9]{40}$/.test(addr);
const isValidPrivateKey = (key: string) => /^[a-fA-F0-9]{64}$/.test(key.replace(/^0x/, ""));

export function InstallDRBDialog({
  open,
  onOpenChange,
  deployedNetwork,
}: InstallDRBDialogProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("mode");
  const [form, setForm] = useState<FormState>(initialForm);
  const [progress, setProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState("");
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showDbPassword, setShowDbPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateForm = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleClose = useCallback(() => {
    setStep("mode");
    setForm(initialForm);
    setProgress(0);
    setCurrentTask("");
    setShowPrivateKey(false);
    setShowDbPassword(false);
    setError(null);
    onOpenChange(false);
  }, [onOpenChange]);

  const goBack = useCallback(() => {
    const backMap: Partial<Record<Step, Step>> = {
      network: "mode",
      config: "network",
      database: "config",
    };
    const prev = backMap[step];
    if (prev) setStep(prev);
  }, [step]);

  const activeNetwork = form.networkMode === "deployed" && deployedNetwork
    ? deployedNetwork
    : form.networkMode === "custom" && form.customRpcUrl && form.customChainId
    ? { rpcUrl: form.customRpcUrl, chainId: parseInt(form.customChainId), name: `Chain ${form.customChainId}` }
    : null;

  const contractType = activeNetwork && (activeNetwork.chainId === 1 || activeNetwork.chainId === 11155111)
    ? "CommitReveal2"
    : "CommitReveal2L2";

  const canProceedNetwork = form.networkMode === "deployed"
    ? !!deployedNetwork
    : form.customRpcUrl.trim() !== "" && form.customChainId.trim() !== "";

  const canProceedConfig = isValidPrivateKey(form.privateKey) &&
    (form.deployMode === "fresh" || isValidAddress(form.contractAddress));

  const canProceedDatabase = form.databaseType === "local"
    ? form.dbPassword.trim() !== ""
    : form.dbUsername.trim() !== "" && form.dbPassword.trim() !== "";

  const startDeployment = useCallback(() => {
    setStep("deploying");
    setProgress(0);
    let i = 0;
    const interval = setInterval(() => {
      if (i < deployTasks.length) {
        setCurrentTask(deployTasks[i]);
        setProgress(((i + 1) / deployTasks.length) * 100);
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => setStep("success"), 400);
      }
    }, 700);
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md gap-0 p-0">
        <DialogHeader className="border-b border-neutral-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-900 text-white">
              <Dices className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base">Deploy DRB</DialogTitle>
              <DialogDescription className="text-xs">Distributed Randomness Beacon</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-5 py-4">
          {step === "mode" && (
            <StepMode onSelect={(mode) => { updateForm("deployMode", mode); setStep("network"); }} />
          )}

          {step === "network" && (
            <StepNetwork
              networkMode={form.networkMode}
              deployedNetwork={deployedNetwork}
              customRpcUrl={form.customRpcUrl}
              customChainId={form.customChainId}
              onNetworkModeChange={(mode) => updateForm("networkMode", mode)}
              onRpcChange={(v) => updateForm("customRpcUrl", v)}
              onChainIdChange={(v) => updateForm("customChainId", v)}
            />
          )}

          {step === "config" && (
            <StepConfig
              deployMode={form.deployMode!}
              activeNetwork={activeNetwork}
              contractType={contractType}
              privateKey={form.privateKey}
              showPrivateKey={showPrivateKey}
              contractAddress={form.contractAddress}
              onPrivateKeyChange={(v) => updateForm("privateKey", v)}
              onTogglePrivateKey={() => setShowPrivateKey(!showPrivateKey)}
              onContractAddressChange={(v) => updateForm("contractAddress", v)}
            />
          )}

          {step === "database" && (
            <StepDatabase
              databaseType={form.databaseType}
              dbUsername={form.dbUsername}
              dbPassword={form.dbPassword}
              showPassword={showDbPassword}
              onTypeChange={(t) => updateForm("databaseType", t)}
              onUsernameChange={(v) => updateForm("dbUsername", v)}
              onPasswordChange={(v) => updateForm("dbPassword", v)}
              onTogglePassword={() => setShowDbPassword(!showDbPassword)}
            />
          )}

          {step === "deploying" && (
            <StepDeploying deployMode={form.deployMode!} progress={progress} currentTask={currentTask} />
          )}

          {step === "success" && (
            <StepSuccess
              activeNetwork={activeNetwork}
              contractType={contractType}
              databaseType={form.databaseType}
              contractAddress={form.deployMode === "existing" ? form.contractAddress : undefined}
              deployMode={form.deployMode!}
            />
          )}

          {step === "error" && <StepError error={error} />}
        </div>

        {!["deploying", "success", "error"].includes(step) && (
          <footer className="flex items-center justify-between border-t border-neutral-100 px-5 py-3">
            {step === "mode" ? (
              <Button variant="ghost" size="sm" onClick={handleClose}>Cancel</Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={goBack}>
                <ChevronLeft className="mr-1 h-4 w-4" />Back
              </Button>
            )}

            {step !== "mode" && (
              <Button
                size="sm"
                disabled={
                  (step === "network" && !canProceedNetwork) ||
                  (step === "config" && !canProceedConfig) ||
                  (step === "database" && !canProceedDatabase)
                }
                onClick={() => {
                  if (step === "network") setStep("config");
                  else if (step === "config") setStep("database");
                  else if (step === "database") startDeployment();
                }}
              >
                {step === "database" ? "Deploy" : "Continue"}
              </Button>
            )}
          </footer>
        )}

        {step === "success" && (
          <footer className="flex items-center justify-end gap-2 border-t border-neutral-100 px-5 py-3">
            <Button variant="outline" size="sm" onClick={handleClose}>Close</Button>
            <Button size="sm" onClick={() => { handleClose(); router.push("/analytics"); }}>View Dashboard</Button>
          </footer>
        )}

        {step === "error" && (
          <footer className="flex items-center justify-end gap-2 border-t border-neutral-100 px-5 py-3">
            <Button variant="outline" size="sm" onClick={handleClose}>Close</Button>
            <Button size="sm" onClick={() => setStep("database")}>Retry</Button>
          </footer>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StepMode({ onSelect }: { onSelect: (mode: DeployMode) => void }) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-primary-200 bg-primary-50/50 p-3">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100">
            <Shuffle className="h-4 w-4 text-primary-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-neutral-900">Verifiable On-Chain Randomness</p>
            <p className="mt-0.5 text-xs text-neutral-600">
              DRB provides cryptographically secure random numbers using the Commit-Reveal² protocol.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowInfo(!showInfo)}
          className="mt-2 flex w-full items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
        >
          {showInfo ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {showInfo ? "Hide details" : "Learn how it works"}
        </button>

        {showInfo && (
          <div className="mt-3 space-y-3 border-t border-primary-200 pt-3">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-500">Protocol Flow</p>
              <div className="mt-2 flex items-center gap-2">
                {["Commit", "Reveal", "Verify", "Output"].map((s, i) => (
                  <div key={s} className="flex items-center gap-2">
                    <span className="rounded bg-primary-100 px-2 py-0.5 text-[10px] font-medium text-primary-700">
                      {i + 1}. {s}
                    </span>
                    {i < 3 && <span className="text-neutral-300">→</span>}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <FeatureItem icon={Shield} label="Tamper-proof" />
              <FeatureItem icon={Users} label="Multi-party" />
              <FeatureItem icon={Blocks} label="On-chain verified" />
              <FeatureItem icon={Dices} label="Unpredictable" />
            </div>

            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-500">Node Architecture</p>
              <p className="mt-1 text-xs text-neutral-600">
                1 Leader node coordinates with 3 Regular nodes. Each node commits a secret value,
                then reveals it. The final random number is computed from all revealed values.
              </p>
            </div>

            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-500">Use Cases</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {["Gaming", "NFT Minting", "Lotteries", "Fair Selection", "Governance"].map(uc => (
                  <span key={uc} className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-600">
                    {uc}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-sm text-neutral-600">Select deployment mode:</p>
        <OptionCard icon={Rocket} title="Fresh Deployment" description="Deploy new contracts and nodes" onClick={() => onSelect("fresh")} />
        <OptionCard icon={FileCode} title="Existing Contract" description="Connect to deployed contract" onClick={() => onSelect("existing")} />
      </div>
    </div>
  );
}

function FeatureItem({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-neutral-600">
      <Icon className="h-3 w-3 text-primary-500" />
      <span>{label}</span>
    </div>
  );
}

function StepNetwork({
  networkMode, deployedNetwork, customRpcUrl, customChainId,
  onNetworkModeChange, onRpcChange, onChainIdChange,
}: {
  networkMode: NetworkMode;
  deployedNetwork?: NetworkConfig;
  customRpcUrl: string;
  customChainId: string;
  onNetworkModeChange: (mode: NetworkMode) => void;
  onRpcChange: (v: string) => void;
  onChainIdChange: (v: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-neutral-500">
        <Globe className="h-4 w-4" />
        <span>Select target network</span>
      </div>

      <div className="flex items-start gap-2 rounded-md bg-neutral-50 p-2.5">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" />
        <p className="text-[11px] text-neutral-500">
          DRB deploys <span className="font-medium">CommitReveal2</span> on L1 (Ethereum) or{" "}
          <span className="font-medium">CommitReveal2L2</span> on L2 chains. The contract type is auto-detected based on chain ID.
        </p>
      </div>

      {deployedNetwork && (
        <SelectableCard selected={networkMode === "deployed"} onClick={() => onNetworkModeChange("deployed")}>
          <p className="text-sm font-medium">Use Deployed Chain</p>
          <p className="mt-1 font-mono text-xs text-neutral-500">{deployedNetwork.name} · #{deployedNetwork.chainId}</p>
        </SelectableCard>
      )}

      <SelectableCard selected={networkMode === "custom"} onClick={() => onNetworkModeChange("custom")}>
        <p className="text-sm font-medium">Custom Network</p>
        <p className="text-xs text-neutral-500">Any EVM-compatible chain</p>
      </SelectableCard>

      {networkMode === "custom" && (
        <div className="space-y-3 pt-2">
          <FormField label="RPC URL">
            <Input placeholder="https://..." value={customRpcUrl} onChange={(e) => onRpcChange(e.target.value)} className="font-mono text-sm" />
          </FormField>
          <FormField label="Chain ID">
            <Input placeholder="1, 11155111, etc." value={customChainId} onChange={(e) => onChainIdChange(e.target.value)} className="font-mono text-sm" />
          </FormField>
        </div>
      )}
    </div>
  );
}

function StepConfig({
  deployMode, activeNetwork, contractType, privateKey, showPrivateKey, contractAddress,
  onPrivateKeyChange, onTogglePrivateKey, onContractAddressChange,
}: {
  deployMode: DeployMode;
  activeNetwork: NetworkConfig | null;
  contractType: string;
  privateKey: string;
  showPrivateKey: boolean;
  contractAddress: string;
  onPrivateKeyChange: (v: string) => void;
  onTogglePrivateKey: () => void;
  onContractAddressChange: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      {activeNetwork && (
        <div className="rounded-lg bg-neutral-50 px-3 py-2">
          <span className="text-[10px] uppercase tracking-wider text-neutral-400">Network</span>
          <p className="font-mono text-sm">{activeNetwork.name} · #{activeNetwork.chainId}</p>
        </div>
      )}

      <FormField label="Deployer Private Key" icon={Key}>
        <div className="relative">
          <Input
            type={showPrivateKey ? "text" : "password"}
            placeholder="0x..."
            value={privateKey}
            onChange={(e) => onPrivateKeyChange(e.target.value)}
            className="pr-10 font-mono text-sm"
          />
          <button
            type="button"
            onClick={onTogglePrivateKey}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
          >
            {showPrivateKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="mt-1 text-[11px] text-neutral-400">Must have balance for gas fees</p>
      </FormField>

      {deployMode === "existing" && (
        <FormField label="DRB Contract Address">
          <Input placeholder="0x..." value={contractAddress} onChange={(e) => onContractAddressChange(e.target.value)} className="font-mono text-sm" />
        </FormField>
      )}

      {deployMode === "fresh" && (
        <div className="flex items-center gap-2 rounded-lg bg-success-50 px-3 py-2 text-xs text-success-600">
          <Check className="h-3.5 w-3.5" />
          <span>Will deploy {contractType} contract</span>
        </div>
      )}
    </div>
  );
}

function StepDatabase({
  databaseType, dbUsername, dbPassword, showPassword,
  onTypeChange, onUsernameChange, onPasswordChange, onTogglePassword,
}: {
  databaseType: DatabaseType;
  dbUsername: string;
  dbPassword: string;
  showPassword: boolean;
  onTypeChange: (t: DatabaseType) => void;
  onUsernameChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onTogglePassword: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-neutral-500">
        <Database className="h-4 w-4" />
        <span>Database configuration</span>
      </div>

      <div className="flex items-start gap-2 rounded-md bg-neutral-50 p-2.5">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" />
        <p className="text-[11px] text-neutral-500">
          Each DRB node requires a PostgreSQL database to store commit/reveal secrets and round state.
          Local PostgreSQL is deployed as a Helm chart in your K8s cluster.
        </p>
      </div>

      <SelectableCard selected={databaseType === "local"} onClick={() => onTypeChange("local")} badge="Recommended">
        <div className="flex items-center gap-2">
          <HardDrive className="h-4 w-4 text-neutral-600" />
          <span className="text-sm font-medium">Local PostgreSQL</span>
        </div>
        <p className="mt-0.5 text-xs text-neutral-500">Deploy via Helm in K8s</p>
      </SelectableCard>

      <SelectableCard selected={databaseType === "rds"} onClick={() => onTypeChange("rds")}>
        <div className="flex items-center gap-2">
          <Cloud className="h-4 w-4 text-neutral-600" />
          <span className="text-sm font-medium">AWS RDS</span>
        </div>
        <p className="mt-0.5 text-xs text-neutral-500">Managed PostgreSQL</p>
      </SelectableCard>

      <div className="space-y-3 pt-2">
        {databaseType === "rds" && (
          <FormField label="Username">
            <Input placeholder="drb_admin" value={dbUsername} onChange={(e) => onUsernameChange(e.target.value)} />
          </FormField>
        )}

        <FormField label="Password">
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={dbPassword}
              onChange={(e) => onPasswordChange(e.target.value)}
              className="pr-10"
            />
            <button
              type="button"
              onClick={onTogglePassword}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </FormField>
      </div>
    </div>
  );
}

function StepDeploying({ deployMode, progress, currentTask }: { deployMode: DeployMode; progress: number; currentTask: string }) {
  return (
    <div className="py-6 text-center">
      <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary-500" />
      <p className="mt-3 text-sm font-medium">{deployMode === "fresh" ? "Deploying DRB Network" : "Connecting Nodes"}</p>
      <p className="mt-1 text-xs text-neutral-500">{currentTask}</p>
      <div className="mt-4">
        <Progress value={progress} className="h-1" />
        <p className="mt-1 text-right font-mono text-[10px] text-neutral-400">{Math.round(progress)}%</p>
      </div>
    </div>
  );
}

function StepSuccess({
  activeNetwork, contractType, databaseType, contractAddress, deployMode,
}: {
  activeNetwork: NetworkConfig | null;
  contractType: string;
  databaseType: DatabaseType;
  contractAddress?: string;
  deployMode: DeployMode;
}) {
  const displayAddress = deployMode === "existing" ? contractAddress : demoOutput.contracts.contractAddress;

  return (
    <div className="py-2">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-success-50">
        <Check className="h-5 w-5 text-success-600" />
      </div>
      <p className="text-center text-sm font-medium text-neutral-900">Deployment Complete</p>
      <p className="mt-0.5 text-center text-xs text-neutral-500">DRB is active on {activeNetwork?.name || "network"}</p>

      <div className="mt-4 space-y-3">
        <section>
          <h4 className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-neutral-400">Contract</h4>
          <div className="space-y-1.5">
            <InfoRow label="Address" value={displayAddress || "-"} mono truncate />
            <InfoRow label="Type" value={contractType} />
            <InfoRow label="Chain ID" value={String(activeNetwork?.chainId || demoOutput.contracts.chainId)} />
          </div>
        </section>

        <section>
          <h4 className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-neutral-400">Nodes (4/4 Online)</h4>
          <div className="space-y-1.5">
            <InfoRow label="Leader" value={demoOutput.application.leaderNodeUrl} mono truncate />
            {demoOutput.application.regularNodeUrls.map((url, i) => (
              <InfoRow key={i} label={`Node ${i + 1}`} value={url} mono truncate />
            ))}
          </div>
        </section>

        <section>
          <h4 className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-neutral-400">Database</h4>
          <InfoRow label="Type" value={databaseType === "rds" ? "AWS RDS PostgreSQL" : "Local PostgreSQL (Helm)"} />
        </section>
      </div>
    </div>
  );
}

function StepError({ error }: { error: string | null }) {
  return (
    <div className="py-6 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-error-50">
        <AlertCircle className="h-6 w-6 text-error-600" />
      </div>
      <p className="text-sm font-medium text-neutral-900">Deployment Failed</p>
      <p className="mt-1 text-xs text-neutral-500">{error || "An error occurred"}</p>
    </div>
  );
}

function OptionCard({ icon: Icon, title, description, onClick }: { icon: React.ElementType; title: string; description: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-start gap-3 rounded-lg border border-neutral-200 bg-white p-3 text-left transition-all hover:border-primary-300 hover:bg-primary-50/50"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-neutral-100 transition-colors group-hover:bg-primary-100">
        <Icon className="h-4 w-4 text-neutral-600 group-hover:text-primary-600" />
      </div>
      <div>
        <p className="text-sm font-medium text-neutral-900">{title}</p>
        <p className="text-xs text-neutral-500">{description}</p>
      </div>
    </button>
  );
}

function SelectableCard({ selected, onClick, badge, children }: { selected: boolean; onClick: () => void; badge?: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-all",
        selected ? "border-primary-400 bg-primary-50/50" : "border-neutral-200 bg-white hover:border-neutral-300"
      )}
    >
      <div className={cn(
        "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
        selected ? "border-primary-500 bg-primary-500" : "border-neutral-300"
      )}>
        {selected && <Check className="h-2.5 w-2.5 text-white" />}
      </div>
      <div className="flex-1">{children}</div>
      {badge && <span className="rounded bg-success-50 px-1.5 py-0.5 text-[10px] font-medium text-success-600">{badge}</span>}
    </button>
  );
}

function FormField({ label, icon: Icon, children }: { label: string; icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 flex items-center gap-1.5 text-xs text-neutral-600">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </Label>
      {children}
    </div>
  );
}

function InfoRow({ label, value, mono, truncate }: { label: string; value: string; mono?: boolean; truncate?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-neutral-50 px-3 py-2">
      <span className="shrink-0 text-xs text-neutral-500">{label}</span>
      <span
        className={cn("text-sm font-medium text-right", mono && "font-mono text-[11px]", truncate && "truncate max-w-[200px]")}
        title={truncate ? value : undefined}
      >
        {value}
      </span>
    </div>
  );
}
