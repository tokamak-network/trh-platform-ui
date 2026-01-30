"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ethers } from "ethers";
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
  Dices, Crown, Globe, Key, Eye, EyeOff, Database,
  Cloud, Check, Loader2, AlertCircle, ChevronLeft,
  ChevronDown, ChevronUp, Info, Shield, Shuffle, Users, Blocks, Wallet, Link,
  Server, Cpu, Network,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useInstallDRBMutation } from "../api/mutations";
import { getThanosSepolia, THANOS_SEPOLIA } from "../services/drbService";
import { useAwsCredentials } from "@/features/configuration/aws-credentials/hooks/useAwsCredentials";
import { useAwsRegions } from "@/features/configuration/aws-credentials/hooks/useAwsRegions";

interface WalletInfo {
  address: string;
  balance: string;
  balanceRaw: bigint;
  isLoading: boolean;
  error: string | null;
}

interface NetworkConfig {
  rpcUrl: string;
  chainId: number;
  name: string;
  nativeToken?: string;
}

interface InstallDRBDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stackId?: string;
  chainName?: string;
  deployedNetwork?: NetworkConfig;
}

type Step = "mode" | "info" | "network" | "config" | "leaderConnection" | "ec2" | "aws" | "database" | "deploying" | "success" | "error";
type NetworkMode = "deployed" | "custom";
type NodeType = "leader" | "regular";

interface FormState {
  nodeType: NodeType;
  networkMode: NetworkMode;
  customRpcUrl: string;
  customChainId: string;
  // Leader node fields
  privateKey: string;
  // Regular node fields
  leaderIp: string;
  leaderPort: string;
  leaderPeerId: string;
  leaderEoa: string;
  contractAddress: string;
  nodePort: string;
  eoaPrivateKey: string;
  // EC2 Configuration (for regular nodes)
  ec2InstanceType: string;
  ec2KeyPairName: string;
  ec2SubnetId: string;
  ec2InstanceName: string;
  // AWS Infrastructure (from saved configuration)
  awsCredentialId: string;
  awsAccessKeyId: string;
  awsSecretAccessKey: string;
  awsRegion: string;
  // Database
  dbUsername: string;
  dbPassword: string;
}

const initialForm: FormState = {
  nodeType: "leader",
  networkMode: "deployed",
  customRpcUrl: "",
  customChainId: "",
  privateKey: "",
  leaderIp: "",
  leaderPort: "61280",
  leaderPeerId: "",
  leaderEoa: "",
  contractAddress: "",
  nodePort: "61280",
  eoaPrivateKey: "",
  // EC2 Configuration
  // ec2InstanceType: "t3.medium",
  ec2InstanceType: "t3.small", // match SDK default
  ec2KeyPairName: "",
  ec2SubnetId: "",
  ec2InstanceName: "",
  // aws
  awsCredentialId: "",
  awsAccessKeyId: "",
  awsSecretAccessKey: "",
  awsRegion: "",
  dbUsername: "postgres",
  dbPassword: "",
};

const deployTasks = [
  "Validating credentials",
  "Creating AWS resources",
  "Deploying smart contract",
  "Provisioning database",
  "Starting DRB node",
  "Configuring network",
  "Verifying deployment",
];

const isValidAddress = (addr: string) => /^0x[a-fA-F0-9]{40}$/.test(addr);
const isValidPrivateKey = (key: string) => /^[a-fA-F0-9]{64}$/.test(key.replace(/^0x/, ""));
const isValidRDSPassword = (password: string) => {
  if (password.length < 8 || password.length > 128) return false;
  const forbidden = /[/'\"@ ]/;
  return !forbidden.test(password);
};

// DRB contract requires minimum 0.01 TON deposit during deployment (activationThreshold)
// Plus gas fees for contract deployment and node setup
const MIN_DEPOSIT = 0.01; // Contract activation threshold
const MIN_BALANCE = 0.5; // Recommended: deposit (0.01) + gas fees (~0.1-0.2) + buffer

async function getWalletInfo(privateKey: string, rpcUrl: string): Promise<WalletInfo> {
  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const balance = await provider.getBalance(wallet.address);
    const balanceEth = ethers.formatEther(balance);
    return {
      address: wallet.address,
      balance: balanceEth,
      balanceRaw: balance,
      isLoading: false,
      error: null,
    };
  } catch (err) {
    return {
      address: "",
      balance: "0",
      balanceRaw: BigInt(0),
      isLoading: false,
      error: err instanceof Error ? err.message : "Failed to fetch wallet info",
    };
  }
}

export function InstallDRBDialog({
  open,
  onOpenChange,
  stackId,
  deployedNetwork,
}: InstallDRBDialogProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("mode");
  const [form, setForm] = useState<FormState>(initialForm);
  const [progress, setProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState("");
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showEoaPrivateKey, setShowEoaPrivateKey] = useState(false);
  const [showDbPassword, setShowDbPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutation = useInstallDRBMutation();

  const updateForm = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleClose = useCallback(() => {
    setStep("mode");
    setForm(initialForm);
    setProgress(0);
    setCurrentTask("");
    setShowPrivateKey(false);
    setShowEoaPrivateKey(false);
    setShowDbPassword(false);
    setError(null);
    onOpenChange(false);
  }, [onOpenChange]);

  const goBack = useCallback(() => {
    // diff back navigation based on node type
    const leaderBackMap: Partial<Record<Step, Step>> = {
      info: "mode",
      network: "info",
      config: "network",
      aws: "config",
      database: "aws",
    };
    const regularBackMap: Partial<Record<Step, Step>> = {
      info: "mode",
      network: "info",
      leaderConnection: "network",
      config: "leaderConnection",
      ec2: "config",
      aws: "ec2",
      database: "aws",
    };
    const backMap = form.nodeType === "regular" ? regularBackMap : leaderBackMap;
    const prev = backMap[step];
    if (prev) setStep(prev);
  }, [step, form.nodeType]);

  // navigation to next step
  const goNext = useCallback(() => {
    if (form.nodeType === "regular") {
      // regular node flow : mode -> info -> network -> leaderConnection -> config -> ec2 -> aws -> database
      const nextMap: Partial<Record<Step, Step>> = {
        mode: "info",
        info: "network",
        network: "leaderConnection",
        leaderConnection: "config",
        config: "ec2",
        ec2: "aws",
        aws: "database",
      };
      const next = nextMap[step];
      if (next) setStep(next);
    } else {
      // LEADER node flow : mode -> info -> network -> config -> aws -> database
      const nextMap: Partial<Record<Step, Step>> = {
        mode: "info",
        info: "network",
        network: "config",
        config: "aws",
        aws: "database",
      };
      const next = nextMap[step];
      if (next) setStep(next);
    }
  }, [step, form.nodeType]);

  // Default to Thanos Sepolia if no deployed network provided
  const defaultNetwork = deployedNetwork || {
    rpcUrl: THANOS_SEPOLIA.rpcUrl,
    chainId: THANOS_SEPOLIA.chainId,
    name: THANOS_SEPOLIA.name,
    nativeToken: THANOS_SEPOLIA.nativeToken,
  };

  // Extracts first RPC URL for display and wallet checks
  const getFirstRpcUrl = (input: string) => {
    const urls = input.split(/[\n,]/).map(u => u.trim()).filter(u => u.length > 0);
    return urls[0] || "";
  };

  const activeNetwork = form.networkMode === "deployed"
    ? defaultNetwork
    : form.networkMode === "custom" && form.customRpcUrl && form.customChainId
    ? { rpcUrl: getFirstRpcUrl(form.customRpcUrl), chainId: parseInt(form.customChainId), name: `Chain ${form.customChainId}`, nativeToken: "ETH" }
    : defaultNetwork;

  const contractType = activeNetwork && (activeNetwork.chainId === 1 || activeNetwork.chainId === 11155111)
    ? "CommitReveal2"
    : "CommitReveal2L2";

  const canProceedNetwork = form.networkMode === "deployed"
    ? true // Always valid - uses deployedNetwork or defaults to Thanos Sepolia
    : form.customRpcUrl.trim() !== "" && form.customChainId.trim() !== "";

  // For leader nodes, validate private key; for regular nodes, validate EOA private key
  const canProceedConfig = form.nodeType === "regular"
    ? isValidPrivateKey(form.eoaPrivateKey)
    : isValidPrivateKey(form.privateKey);

  // Leader connection validation (for regular nodes)
  const canProceedLeaderConnection = form.leaderIp.trim() !== "" &&
    form.leaderPort.trim() !== "" &&
    form.leaderPeerId.trim() !== "" &&
    form.leaderEoa.trim() !== "" &&
    form.contractAddress.trim() !== "" &&
    isValidAddress(form.leaderEoa) &&
    isValidAddress(form.contractAddress);

  // EC2 configuration validation (for regular nodes)
  const canProceedEc2 = form.ec2KeyPairName.trim() !== "";

  const canProceedAws = form.awsCredentialId.trim() !== "" &&
    form.awsRegion.trim() !== "";

  const canProceedDatabase = form.dbUsername.trim() !== "" && isValidRDSPassword(form.dbPassword);

  const startDeployment = useCallback(async () => {
    setStep("deploying");
    setProgress(0);
    setError(null);

    let intervalId: ReturnType<typeof setInterval> | null = null;

    try {
      // Resolve stackId - use provided or fetch Thanos Sepolia system stack
      let resolvedStackId = stackId;
      if (!resolvedStackId) {
        setCurrentTask("Getting Thanos Sepolia system stack...");
        const response = await getThanosSepolia();
        resolvedStackId = response.data?.stack?.id;
        if (!resolvedStackId) {
          throw new Error("Failed to get Thanos Sepolia system stack");
        }
      }

      // Start progress animation
      let i = 0;
      intervalId = setInterval(() => {
        if (i < deployTasks.length - 1) {
          setCurrentTask(deployTasks[i]);
          setProgress(((i + 1) / deployTasks.length) * 100);
          i++;
        }
      }, 500);

      const isRegularNode = form.nodeType === "regular";
      const useDeployedNetwork = form.networkMode === "deployed" && !isRegularNode;

      // Convert newline separated URLs to comma separated
      const formatRpcUrls = (input: string) => {
        return input
          .split(/[\n,]/)
          .map(url => url.trim())
          .filter(url => url.length > 0)
          .join(",");
      };

      const rpcUrls = !useDeployedNetwork
        ? formatRpcUrls(form.customRpcUrl || defaultNetwork.rpcUrl)
        : undefined;

      const baseRequest = {
        stackId: resolvedStackId,
        nodeType: form.nodeType,
        useCurrentChain: useDeployedNetwork,
        rpc: rpcUrls,
        chainId: !useDeployedNetwork ? (form.customChainId ? parseInt(form.customChainId) : defaultNetwork.chainId) : undefined,
        awsConfig: {
          accessKeyId: form.awsAccessKeyId,
          secretAccessKey: form.awsSecretAccessKey,
          region: form.awsRegion,
        },
        databaseConfig: {
          type: "rds" as const,
          username: form.dbUsername,
          password: form.dbPassword,
        },
      };

      if (form.nodeType === "regular") {
        // Regular node request
        await mutation.mutateAsync({
          ...baseRequest,
          // Leader connection info
          leaderIp: form.leaderIp,
          leaderPort: parseInt(form.leaderPort),
          leaderPeerId: form.leaderPeerId,
          leaderEoa: form.leaderEoa,
          contractAddress: form.contractAddress,
          // Regular node config
          nodePort: parseInt(form.nodePort),
          eoaPrivateKey: form.eoaPrivateKey,
          // EC2 config
          ec2Config: {
            instanceType: form.ec2InstanceType || undefined,
            keyPairName: form.ec2KeyPairName,
            subnetId: form.ec2SubnetId || undefined,
            instanceName: form.ec2InstanceName || undefined,
          },
        });
      } else {
        // Leader node request
        await mutation.mutateAsync({
          ...baseRequest,
          privateKey: form.privateKey,
        });
      }

      if (intervalId) clearInterval(intervalId);
      setProgress(100);
      setCurrentTask("Deployment started");
      setTimeout(() => {
        onOpenChange(false);
      }, 1500);
    } catch (err) {
      if (intervalId) clearInterval(intervalId);
      setError(err instanceof Error ? err.message : "Deployment failed");
      setStep("error");
    }
  }, [stackId, form, mutation, onOpenChange]);

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
            <StepMode
              nodeType={form.nodeType}
              onNodeTypeChange={(type) => updateForm("nodeType", type)}
            />
          )}

          {step === "info" && (
            <StepInfo nodeType={form.nodeType} />
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

          {step === "leaderConnection" && form.nodeType === "regular" && (
            <StepLeaderConnection
              leaderIp={form.leaderIp}
              leaderPort={form.leaderPort}
              leaderPeerId={form.leaderPeerId}
              leaderEoa={form.leaderEoa}
              contractAddress={form.contractAddress}
              onLeaderIpChange={(v) => updateForm("leaderIp", v)}
              onLeaderPortChange={(v) => updateForm("leaderPort", v)}
              onLeaderPeerIdChange={(v) => updateForm("leaderPeerId", v)}
              onLeaderEoaChange={(v) => updateForm("leaderEoa", v)}
              onContractAddressChange={(v) => updateForm("contractAddress", v)}
            />
          )}

          {step === "config" && form.nodeType === "leader" && (
            <StepConfig
              activeNetwork={activeNetwork}
              contractType={contractType}
              privateKey={form.privateKey}
              showPrivateKey={showPrivateKey}
              onPrivateKeyChange={(v) => updateForm("privateKey", v)}
              onTogglePrivateKey={() => setShowPrivateKey(!showPrivateKey)}
            />
          )}

          {step === "config" && form.nodeType === "regular" && (
            <StepRegularNodeConfig
              activeNetwork={activeNetwork}
              nodePort={form.nodePort}
              eoaPrivateKey={form.eoaPrivateKey}
              showPrivateKey={showEoaPrivateKey}
              onNodePortChange={(v) => updateForm("nodePort", v)}
              onEoaPrivateKeyChange={(v) => updateForm("eoaPrivateKey", v)}
              onTogglePrivateKey={() => setShowEoaPrivateKey(!showEoaPrivateKey)}
            />
          )}

          {step === "ec2" && form.nodeType === "regular" && (
            <StepEc2Config
              keyPairName={form.ec2KeyPairName}
              onKeyPairNameChange={(v) => updateForm("ec2KeyPairName", v)}
            />
          )}

          {step === "aws" && (
            <StepAws
              credentialId={form.awsCredentialId}
              awsRegion={form.awsRegion}
              onCredentialChange={(id, accessKeyId, secretAccessKey) => {
                updateForm("awsCredentialId", id);
                updateForm("awsAccessKeyId", accessKeyId);
                updateForm("awsSecretAccessKey", secretAccessKey);
              }}
              onRegionChange={(v) => updateForm("awsRegion", v)}
            />
          )}

          {step === "database" && (
            <StepDatabase
              dbUsername={form.dbUsername}
              dbPassword={form.dbPassword}
              showPassword={showDbPassword}
              onUsernameChange={(v) => updateForm("dbUsername", v)}
              onPasswordChange={(v) => updateForm("dbPassword", v)}
              onTogglePassword={() => setShowDbPassword(!showDbPassword)}
            />
          )}

          {step === "deploying" && (
            <StepDeploying progress={progress} currentTask={currentTask} />
          )}

          {step === "success" && (
            <StepSuccess
              activeNetwork={activeNetwork}
              contractType={contractType}
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

            <Button
              size="sm"
              disabled={
                (step === "network" && !canProceedNetwork) ||
                (step === "config" && !canProceedConfig) ||
                (step === "leaderConnection" && !canProceedLeaderConnection) ||
                (step === "ec2" && !canProceedEc2) ||
                (step === "aws" && !canProceedAws) ||
                (step === "database" && !canProceedDatabase)
              }
              onClick={() => {
                if (step === "database") {
                  startDeployment();
                } else {
                  goNext();
                }
              }}
            >
              {step === "database" ? "Deploy" : "Continue"}
            </Button>
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

function StepMode({
  nodeType,
  onNodeTypeChange,
}: {
  nodeType: NodeType;
  onNodeTypeChange: (type: NodeType) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-neutral-500">
        <Dices className="h-4 w-4" />
        <span>Select deployment type</span>
      </div>

      <div className="flex items-start gap-2 rounded-md bg-neutral-50 p-2.5">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" />
        <p className="text-[11px] text-neutral-500">
          Choose whether to deploy a new DRB network (leader node) or join an existing one (regular node).
        </p>
      </div>

      <SelectableCard
        selected={nodeType === "leader"}
        onClick={() => onNodeTypeChange("leader")}
      >
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-success-600" />
          <p className="text-sm font-medium">Leader Node</p>
        </div>
        <p className="mt-1 text-xs text-neutral-500">
          Deploy contracts and start a new DRB network. Requires AWS EKS infrastructure.
        </p>
      </SelectableCard>

      <SelectableCard
        selected={nodeType === "regular"}
        onClick={() => onNodeTypeChange("regular")}
      >
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-primary-600" />
          <p className="text-sm font-medium">Regular Node</p>
        </div>
        <p className="mt-1 text-xs text-neutral-500">
          Join an existing DRB network. Requires leader connection info and AWS EC2 instance.
        </p>
      </SelectableCard>
    </div>
  );
}

function StepInfo({ nodeType }: { nodeType: NodeType }) {
  const [showInfo, setShowInfo] = useState(false);
  const isLeader = nodeType === "leader";

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

      <div className={cn("rounded-lg px-3 py-2.5", isLeader ? "bg-success-50" : "bg-primary-50")}>
        <div className={cn("flex items-center gap-2 text-xs", isLeader ? "text-success-600" : "text-primary-600")}>
          {isLeader ? <Crown className="h-3.5 w-3.5" /> : <Server className="h-3.5 w-3.5" />}
          <span className="font-medium">{isLeader ? "Leader Node Deployment" : "Regular Node Deployment"}</span>
        </div>
        <p className={cn("mt-1 text-[11px]", isLeader ? "text-success-600/80" : "text-primary-600/80")}>
          {isLeader
            ? "Deploy the CommitReveal2 contract and start a leader node on dedicated AWS infrastructure."
            : "Join an existing DRB network by connecting to a leader node. Runs on AWS EC2 instance."}
        </p>
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

      <SelectableCard selected={networkMode === "custom"} onClick={() => onNetworkModeChange("custom")} disabled>
        <p className="text-sm font-medium">Custom Network</p>
        <p className="text-xs text-neutral-500">Any EVM-compatible chain</p>
      </SelectableCard>

      {networkMode === "custom" && (
        <div className="space-y-3 pt-2">
          <FormField label="RPC URL(s)">
            <textarea
              placeholder="https://rpc.example.com"
              value={customRpcUrl}
              onChange={(e) => onRpcChange(e.target.value)}
              className="flex min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <p className="mt-1 text-[11px] text-neutral-400">
              Add multiple URLs (one per line) for automatic failover if primary fails.
            </p>
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
  activeNetwork, contractType, privateKey, showPrivateKey,
  onPrivateKeyChange, onTogglePrivateKey,
}: {
  activeNetwork: NetworkConfig | null;
  contractType: string;
  privateKey: string;
  showPrivateKey: boolean;
  onPrivateKeyChange: (v: string) => void;
  onTogglePrivateKey: () => void;
}) {
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);

  // Check balance when private key changes and is valid
  useEffect(() => {
    if (!isValidPrivateKey(privateKey) || !activeNetwork?.rpcUrl) {
      setWalletInfo(null);
      return;
    }

    const checkBalance = async () => {
      setIsCheckingBalance(true);
      const normalizedKey = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
      const info = await getWalletInfo(normalizedKey, activeNetwork.rpcUrl);
      setWalletInfo(info);
      setIsCheckingBalance(false);
    };

    const timeoutId = setTimeout(checkBalance, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [privateKey, activeNetwork?.rpcUrl]);

  const tokenSymbol = activeNetwork?.nativeToken || "ETH";
  const hasInsufficientBalance = walletInfo && !walletInfo.error && parseFloat(walletInfo.balance) < MIN_BALANCE;

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
            className={cn("pr-10 font-mono text-sm", hasInsufficientBalance && "border-warning-500")}
          />
          <button
            type="button"
            onClick={onTogglePrivateKey}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
          >
            {showPrivateKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="mt-1 text-[11px] text-neutral-400">
          This wallet deploys the DRB contract and becomes the owner.
        </p>
        <p className="mt-0.5 text-[10px] text-neutral-400">
          Requires {MIN_DEPOSIT}+ {tokenSymbol} deposit + gas fees. Recommended: {MIN_BALANCE} {tokenSymbol}
        </p>
      </FormField>

      {/* Wallet Info Display */}
      {isCheckingBalance && (
        <div className="flex items-center gap-2 rounded-lg bg-neutral-50 px-3 py-2">
          <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
          <span className="text-xs text-neutral-500">Checking wallet balance...</span>
        </div>
      )}

      {walletInfo && !isCheckingBalance && !walletInfo.error && (
        <div className={cn(
          "rounded-lg border px-3 py-2",
          hasInsufficientBalance ? "border-warning-200 bg-warning-50" : "border-success-200 bg-success-50"
        )}>
          <div className="flex items-center gap-2">
            <Wallet className={cn("h-4 w-4", hasInsufficientBalance ? "text-warning-600" : "text-success-600")} />
            <span className="text-xs font-medium text-neutral-700">Wallet Detected</span>
          </div>
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-neutral-500">Address</span>
              <code className="text-[11px] text-neutral-700">
                {walletInfo.address.slice(0, 6)}...{walletInfo.address.slice(-4)}
              </code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-neutral-500">Balance</span>
              <span className={cn("text-[11px] font-medium", hasInsufficientBalance ? "text-warning-600" : "text-success-600")}>
                {parseFloat(walletInfo.balance).toFixed(4)} {tokenSymbol}
              </span>
            </div>
          </div>
          {hasInsufficientBalance && (
            <div className="mt-2">
              <p className="text-[11px] text-warning-600">
                Low balance. Minimum {MIN_BALANCE} {tokenSymbol} recommended for deployment.
              </p>
              {activeNetwork?.chainId === 111551119090 && (
                <p className="mt-1 text-[10px] text-warning-500">
                  Get testnet TON:{" "}
                  <a
                    href="https://sepolia.etherscan.io/address/0xd655762c601b9cac8f6644c4841e47e4734d0444#writeContract#F1"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-warning-700"
                  >
                    Faucet (Sepolia)
                  </a>
                  {" → "}
                  <a
                    href="https://bridge.tokamak.network"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-warning-700"
                  >
                    Bridge to Thanos
                  </a>
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {walletInfo?.error && !isCheckingBalance && (
        <div className="flex items-center gap-2 rounded-lg border border-error-200 bg-error-50 px-3 py-2">
          <AlertCircle className="h-4 w-4 text-error-500" />
          <span className="text-xs text-error-600">Failed to check balance: {walletInfo.error}</span>
        </div>
      )}

      <div className="rounded-lg bg-success-50 px-3 py-2.5">
        <div className="flex items-center gap-2 text-xs text-success-600">
          <Check className="h-3.5 w-3.5" />
          <span>Leader Node Deployment</span>
        </div>
        <ul className="mt-1.5 space-y-0.5 text-[11px] text-success-600/80">
          <li>• Deploy {contractType} contract (you become owner)</li>
          <li>• {MIN_DEPOSIT} {tokenSymbol} deposit sent with contract deployment</li>
          <li>• Start leader node on dedicated AWS infrastructure</li>
        </ul>
        <p className="mt-1.5 text-[10px] text-success-600/70">
          Deposit is withdrawable when you uninstall DRB
        </p>
      </div>
    </div>
  );
}

function StepLeaderConnection({
  leaderIp, leaderPort, leaderPeerId, leaderEoa, contractAddress,
  onLeaderIpChange, onLeaderPortChange, onLeaderPeerIdChange, onLeaderEoaChange, onContractAddressChange,
}: {
  leaderIp: string;
  leaderPort: string;
  leaderPeerId: string;
  leaderEoa: string;
  contractAddress: string;
  onLeaderIpChange: (v: string) => void;
  onLeaderPortChange: (v: string) => void;
  onLeaderPeerIdChange: (v: string) => void;
  onLeaderEoaChange: (v: string) => void;
  onContractAddressChange: (v: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-neutral-500">
        <Network className="h-4 w-4" />
        <span>Leader Node Connection</span>
      </div>

      <div className="flex items-start gap-2 rounded-md bg-neutral-50 p-2.5">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" />
        <p className="text-[11px] text-neutral-500">
          Copy the connection details from the leader node&apos;s Overview tab in the Rollup dashboard.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Leader IP / Hostname">
          <Input
            placeholder="k8s-drb-xxx.elb.amazonaws.com"
            value={leaderIp}
            onChange={(e) => onLeaderIpChange(e.target.value)}
            className="font-mono text-xs"
          />
        </FormField>
        <FormField label="Leader Port">
          <Input
            placeholder="61280"
            value={leaderPort}
            onChange={(e) => onLeaderPortChange(e.target.value)}
            className="font-mono text-sm"
          />
        </FormField>
      </div>

      <FormField label="Leader Peer ID">
        <Input
          placeholder="12D3KooWKVrw..."
          value={leaderPeerId}
          onChange={(e) => onLeaderPeerIdChange(e.target.value)}
          className="font-mono text-xs"
        />
      </FormField>

      <FormField label="Leader EOA">
        <Input
          placeholder="0x8d56E94a..."
          value={leaderEoa}
          onChange={(e) => onLeaderEoaChange(e.target.value)}
          className="font-mono text-xs"
        />
      </FormField>

      <FormField label="Contract Address">
        <Input
          placeholder="0xfe55b104..."
          value={contractAddress}
          onChange={(e) => onContractAddressChange(e.target.value)}
          className="font-mono text-xs"
        />
      </FormField>
    </div>
  );
}

function StepRegularNodeConfig({
  activeNetwork, nodePort, eoaPrivateKey, showPrivateKey,
  onNodePortChange, onEoaPrivateKeyChange, onTogglePrivateKey,
}: {
  activeNetwork: NetworkConfig | null;
  nodePort: string;
  eoaPrivateKey: string;
  showPrivateKey: boolean;
  onNodePortChange: (v: string) => void;
  onEoaPrivateKeyChange: (v: string) => void;
  onTogglePrivateKey: () => void;
}) {
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);

  useEffect(() => {
    if (!isValidPrivateKey(eoaPrivateKey) || !activeNetwork?.rpcUrl) {
      setWalletInfo(null);
      return;
    }

    const checkBalance = async () => {
      setIsCheckingBalance(true);
      const normalizedKey = eoaPrivateKey.startsWith("0x") ? eoaPrivateKey : `0x${eoaPrivateKey}`;
      const info = await getWalletInfo(normalizedKey, activeNetwork.rpcUrl);
      setWalletInfo(info);
      setIsCheckingBalance(false);
    };

    const timeoutId = setTimeout(checkBalance, 500);
    return () => clearTimeout(timeoutId);
  }, [eoaPrivateKey, activeNetwork?.rpcUrl]);

  const tokenSymbol = activeNetwork?.nativeToken || "ETH";
  const hasInsufficientBalance = walletInfo && !walletInfo.error && parseFloat(walletInfo.balance) < MIN_BALANCE;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-neutral-500">
        <Server className="h-4 w-4" />
        <span>Regular Node Configuration</span>
      </div>

      {activeNetwork && (
        <div className="rounded-lg bg-neutral-50 px-3 py-2">
          <span className="text-[10px] uppercase tracking-wider text-neutral-400">Network</span>
          <p className="font-mono text-sm">{activeNetwork.name} · #{activeNetwork.chainId}</p>
        </div>
      )}

      <FormField label="Node Port">
        <Input
          placeholder="61280"
          value={nodePort}
          onChange={(e) => onNodePortChange(e.target.value)}
          className="font-mono text-sm"
        />
        <p className="mt-1 text-[11px] text-neutral-400">
          Port for the DRB node to listen on (default: 61280)
        </p>
      </FormField>

      <FormField label="Node Private Key" icon={Key}>
        <div className="relative">
          <Input
            type={showPrivateKey ? "text" : "password"}
            placeholder="0x..."
            value={eoaPrivateKey}
            onChange={(e) => onEoaPrivateKeyChange(e.target.value)}
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
        <p className="mt-1 text-[11px] text-neutral-400">
          Private key for this node&apos;s EOA (Externally Owned Account)
        </p>
      </FormField>

      {isCheckingBalance && (
        <div className="flex items-center gap-2 rounded-lg bg-neutral-50 px-3 py-2">
          <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
          <span className="text-xs text-neutral-500">Checking wallet balance...</span>
        </div>
      )}

      {walletInfo && !isCheckingBalance && !walletInfo.error && (
        <div className={cn(
          "rounded-lg px-3 py-2",
          hasInsufficientBalance ? "bg-warning-50 border border-warning-200" : "bg-success-50 border border-success-200"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-neutral-500" />
              <div>
                <span className="text-[10px] uppercase tracking-wider text-neutral-400">Wallet</span>
                <p className="font-mono text-xs">{walletInfo.address.slice(0, 6)}...{walletInfo.address.slice(-4)}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-neutral-500">Balance</span>
              <span className={cn("text-[11px] font-medium ml-1", hasInsufficientBalance ? "text-warning-600" : "text-success-600")}>
                {parseFloat(walletInfo.balance).toFixed(4)} {tokenSymbol}
              </span>
            </div>
          </div>
          {hasInsufficientBalance && (
            <div className="mt-2">
              <p className="text-[11px] text-warning-600">
                Low balance. Minimum {MIN_BALANCE} {tokenSymbol} recommended.
              </p>
              {activeNetwork?.chainId === 111551119090 && (
                <p className="mt-1 text-[10px] text-warning-500">
                  Get testnet TON:{" "}
                  <a href="https://faucet.thanos-sepolia.tokamak.network" target="_blank" rel="noopener noreferrer" className="underline">
                    Thanos Sepolia Faucet
                  </a>
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {walletInfo && !isCheckingBalance && walletInfo.error && (
        <div className="flex items-center gap-2 rounded-lg border border-error-200 bg-error-50 px-3 py-2">
          <AlertCircle className="h-4 w-4 text-error-500" />
          <span className="text-xs text-error-600">Failed to check balance: {walletInfo.error}</span>
        </div>
      )}

      <div className="rounded-lg bg-primary-50 px-3 py-2.5">
        <div className="flex items-center gap-2 text-xs text-primary-600">
          <Server className="h-3.5 w-3.5" />
          <span className="font-medium">Regular Node Deployment</span>
        </div>
        <ul className="mt-1.5 space-y-0.5 text-[11px] text-primary-600/80">
          <li>• Join existing DRB network as a participating node</li>
          <li>• Deploy on AWS EC2 instance</li>
          <li>• Connect to leader node for coordination</li>
        </ul>
      </div>
    </div>
  );
}

function StepEc2Config({
  keyPairName,
  onKeyPairNameChange,
}: {
  keyPairName: string;
  onKeyPairNameChange: (v: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-neutral-500">
        <Cpu className="h-4 w-4" />
        <span>EC2 Configuration</span>
      </div>

      <div className="flex items-start gap-2 rounded-md bg-neutral-50 p-2.5">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" />
        <p className="text-[11px] text-neutral-500">
          Regular node will be deployed on a t3.small EC2 instance in your selected AWS region.
        </p>
      </div>

      <FormField label="SSH Key Pair Name">
        <Input
          placeholder="my-key-pair"
          value={keyPairName}
          onChange={(e) => onKeyPairNameChange(e.target.value)}
        />
        <p className="mt-1 text-[11px] text-neutral-400">
          Existing AWS EC2 key pair for SSH access to the instance
        </p>
      </FormField>
    </div>
  );
}

function StepAws({
  credentialId,
  awsRegion,
  onCredentialChange,
  onRegionChange,
}: {
  credentialId: string;
  awsRegion: string;
  onCredentialChange: (id: string, accessKeyId: string, secretAccessKey: string) => void;
  onRegionChange: (v: string) => void;
}) {
  const { awsCredentials, isLoading, refreshCredentials } = useAwsCredentials();
  const { regions, isLoading: isLoadingRegions, error: regionsError, fetchRegions, clearRegions } = useAwsRegions();
  const [lastFetchedCredentialId, setLastFetchedCredentialId] = useState("");

  // Fetch regions when credential is selected
  useEffect(() => {
    if (credentialId && awsCredentials && credentialId !== lastFetchedCredentialId) {
      const selectedCredential = awsCredentials.find((cred) => cred.id === credentialId);
      if (selectedCredential) {
        onRegionChange(""); // Clear region when credential changes
        fetchRegions(selectedCredential.accessKeyId, selectedCredential.secretAccessKey);
        setLastFetchedCredentialId(credentialId);
      }
    } else if (!credentialId && lastFetchedCredentialId) {
      clearRegions();
      onRegionChange("");
      setLastFetchedCredentialId("");
    }
  }, [credentialId, awsCredentials, lastFetchedCredentialId, fetchRegions, clearRegions, onRegionChange]);

  // Set default region when regions are loaded
  useEffect(() => {
    if (regions.length > 0 && !awsRegion && !isLoadingRegions) {
      const defaultRegion = regions.find((r) => r.value === "us-east-1") || regions[0];
      onRegionChange(defaultRegion.value);
    }
  }, [regions, awsRegion, isLoadingRegions, onRegionChange]);

  const handleCredentialSelect = (id: string) => {
    const selectedCredential = awsCredentials?.find((cred) => cred.id === id);
    if (selectedCredential) {
      onCredentialChange(id, selectedCredential.accessKeyId, selectedCredential.secretAccessKey);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-neutral-500">
        <Cloud className="h-4 w-4" />
        <span>AWS Infrastructure</span>
      </div>

      <div className="flex items-start gap-2 rounded-md bg-neutral-50 p-2.5">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" />
        <p className="text-[11px] text-neutral-500">
          DRB nodes are deployed on AWS infrastructure. Leader nodes use EKS clusters,
          while regular nodes use EC2 instances. Database uses RDS PostgreSQL.
        </p>
      </div>

      {awsCredentials && awsCredentials.length > 0 ? (
        <>
          <FormField label="AWS Credentials" icon={Key}>
            <Select value={credentialId} onValueChange={handleCredentialSelect}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={isLoading ? "Loading..." : "Select AWS credentials"} />
              </SelectTrigger>
              <SelectContent>
                {awsCredentials.map((credential) => (
                  <SelectItem key={credential.id} value={credential.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{credential.name}</span>
                      <span className="text-xs text-muted-foreground">{credential.accessKeyId}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Region" icon={Globe}>
            <Select
              value={awsRegion}
              onValueChange={onRegionChange}
              disabled={!credentialId || isLoadingRegions}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    !credentialId
                      ? "Select credentials first"
                      : isLoadingRegions
                      ? "Loading regions..."
                      : "Select a region"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {regions.map((region) => (
                  <SelectItem key={region.value} value={region.value}>
                    {region.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {regionsError && <p className="mt-1 text-xs text-error-600">{regionsError}</p>}
          </FormField>
        </>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="flex items-center gap-2">
            No AWS credentials found
            <button
              type="button"
              onClick={() => refreshCredentials()}
              className="text-neutral-400 hover:text-neutral-600"
            >
              <Loader2 className={cn("h-3 w-3", isLoading && "animate-spin")} />
            </button>
          </AlertTitle>
          <AlertDescription className="mt-2">
            <p className="text-sm text-neutral-600 mb-2">
              Please add AWS credentials in the Configuration section first.
            </p>
            <Button variant="outline" size="sm" asChild>
              <a href="/configuration" target="_blank" rel="noopener noreferrer">
                Go to Configuration
                <Link className="w-3 h-3 ml-1" />
              </a>
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function StepDatabase({
  dbUsername, dbPassword, showPassword,
  onUsernameChange, onPasswordChange, onTogglePassword,
}: {
  dbUsername: string;
  dbPassword: string;
  showPassword: boolean;
  onUsernameChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onTogglePassword: () => void;
}) {
  const passwordTouched = dbPassword.length > 0;
  const passwordValid = isValidRDSPassword(dbPassword);
  const showPasswordError = passwordTouched && !passwordValid;

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
          The database will be provisioned as AWS RDS PostgreSQL in your selected region.
        </p>
      </div>

      <div className="rounded-lg border border-primary-200 bg-primary-50/50 p-3">
        <div className="flex items-center gap-2">
          <Cloud className="h-4 w-4 text-primary-600" />
          <span className="text-sm font-medium text-primary-900">AWS RDS PostgreSQL</span>
        </div>
        <p className="mt-1 text-xs text-primary-700">Managed database in your AWS region</p>
      </div>

      <div className="space-y-3 pt-2">
        <FormField label="Username">
          <Input
            placeholder="postgres"
            value={dbUsername}
            onChange={(e) => onUsernameChange(e.target.value)}
          />
        </FormField>

        <FormField label="Password">
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={dbPassword}
              onChange={(e) => onPasswordChange(e.target.value)}
              className={cn("pr-10", showPasswordError && "border-error-500 focus-visible:ring-error-500")}
            />
            <button
              type="button"
              onClick={onTogglePassword}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className={cn("mt-1.5 text-[11px]", showPasswordError ? "text-error-600" : "text-neutral-500")}>
            8-128 characters. Cannot contain: <code className="rounded bg-neutral-100 px-1 text-[10px]">/ &apos; &quot; @ space</code>
          </p>
        </FormField>
      </div>
    </div>
  );
}

function StepDeploying({ progress, currentTask }: { progress: number; currentTask: string }) {
  return (
    <div className="py-6 text-center">
      <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary-500" />
      <p className="mt-3 text-sm font-medium">Deploying Leader Node</p>
      <p className="mt-1 text-xs text-neutral-500">{currentTask}</p>
      <div className="mt-4">
        <Progress value={progress} className="h-1" />
        <p className="mt-1 text-right font-mono text-[10px] text-neutral-400">{Math.round(progress)}%</p>
      </div>
    </div>
  );
}

function StepSuccess({
  activeNetwork, contractType,
}: {
  activeNetwork: NetworkConfig | null;
  contractType: string;
}) {
  return (
    <div className="py-2">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-success-50">
        <Check className="h-5 w-5 text-success-600" />
      </div>
      <p className="text-center text-sm font-medium text-neutral-900">Deployment Started</p>
      <p className="mt-0.5 text-center text-xs text-neutral-500">
        Leader node is being deployed on {activeNetwork?.name || "network"}
      </p>

      <div className="mt-4 space-y-3">
        <section>
          <h4 className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-neutral-400">Configuration</h4>
          <div className="space-y-1.5">
            <InfoRow label="Node Type" value="Leader Node" />
            <InfoRow label="Contract" value={contractType} />
            <InfoRow label="Network" value={activeNetwork?.name || "-"} />
            <InfoRow label="Chain ID" value={String(activeNetwork?.chainId || "-")} />
          </div>
        </section>

        <section>
          <h4 className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-neutral-400">Infrastructure</h4>
          <InfoRow label="Database" value="AWS RDS PostgreSQL" />
          <InfoRow label="Compute" value="AWS EKS Cluster" />
        </section>

        <div className="rounded-lg bg-primary-50 p-3">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-primary-500 mt-0.5" />
            <p className="text-xs text-primary-700">
              Check the Integrations tab for deployment progress and node endpoint URL once complete.
            </p>
          </div>
        </div>
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

function SelectableCard({ selected, onClick, badge, disabled, children }: { selected: boolean; onClick: () => void; badge?: string; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={cn(
        "relative flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-all",
        disabled ? "cursor-not-allowed opacity-50" : "",
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
