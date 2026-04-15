"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Eye,
  EyeOff,
  Shuffle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react";
import { useFormContext, useController } from "react-hook-form";
import type { CreateRollupFormData } from "../../schemas/create-rollup";
import { useEthereumAccounts, wordList } from "../../hooks/useEthereumAccounts";
import * as bip39 from "bip39";
import { ethers } from "ethers";
import { THANOS_STACK_PREREQUISITE_GUIDE_URL } from "../../const";


interface AccountSetupProps {
  /** "preset" mode uses presetBasicInfo.* paths and hides account selection UI */
  mode?: "classic" | "preset";
}

// Desktop app account data injected via window.__TRH_DESKTOP_ACCOUNTS__
interface DesktopAccount {
  address: string;
  privateKey: string;
}
interface DesktopAccounts {
  admin: DesktopAccount;
  proposer: DesktopAccount;
  batcher: DesktopAccount;
  challenger: DesktopAccount;
  sequencer: DesktopAccount;
}

function getDesktopAccounts(): DesktopAccounts | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as Record<string, any>;
    const data: DesktopAccounts | undefined = w.__TRH_DESKTOP_ACCOUNTS__;
    if (data?.admin?.address && data?.proposer?.address && data?.batcher?.address && data?.challenger?.address && data?.sequencer?.address) {
      return data;
    }
  } catch { /* not in desktop context */ }
  return null;
}

export function AccountSetup({ mode = "classic" }: AccountSetupProps) {
  const isPreset = mode === "preset";

  const {
    setValue,
    control,
    formState: { errors },
  } = useFormContext<CreateRollupFormData>();

  const [showSeedPhrase, setShowSeedPhrase] = useState(false);
  const [seedPhraseConfirmed, setSeedPhraseConfirmed] = useState(false);
  const [desktopAccountsApplied, setDesktopAccountsApplied] = useState(false);

  const { field: seedPhraseField } = useController({
    name: "accountAndAws.seedPhrase",
    control,
    defaultValue: Array(12).fill(""),
  });

  const { field: l1RpcUrlField } = useController({
    name: "networkAndChain.l1RpcUrl",
    control,
    defaultValue: "https://rpc.sepolia.org",
  });

  const { field: adminAccountField } = useController({
    name: "accountAndAws.adminAccount",
    control,
    defaultValue: "",
  });

  const { field: proposerAccountField } = useController({
    name: "accountAndAws.proposerAccount",
    control,
    defaultValue: "",
  });

  const { field: batchAccountField } = useController({
    name: "accountAndAws.batchAccount",
    control,
    defaultValue: "",
  });

  const { field: challengerAccountField } = useController({
    name: "accountAndAws.challengerAccount",
    control,
    defaultValue: "",
  });

  const { field: sequencerAccountField } = useController({
    name: "accountAndAws.sequencerAccount",
    control,
    defaultValue: "",
  });

  const { field: networkField } = useController({
    name: "networkAndChain.network",
    control,
    defaultValue: "",
  });

  const isMainnet = networkField.value === "mainnet";

  const seedPhrase: string[] = seedPhraseField.value ?? Array(12).fill("");

  const { accounts, isLoading, error, refreshBalances } = useEthereumAccounts(
    seedPhrase,
    l1RpcUrlField.value ?? ""
  );

  // Auto-apply desktop keystore accounts if available
  useEffect(() => {
    if (desktopAccountsApplied) return;
    const desktop = getDesktopAccounts();
    if (!desktop) return;

    if (isPreset) {
      // Preset mode: fetch seed words from desktop keystore and populate form
      const w = window as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
      if (w.__TRH_DESKTOP__?.getSeedWords) {
        w.__TRH_DESKTOP__.getSeedWords().then((words: string[] | null) => {
          if (words && words.length === 12) {
            seedPhraseField.onChange(words);
            setSeedPhraseConfirmed(true);
          }
        }).catch(() => { /* ignore */ });
      }
    } else {
      // Classic mode: set accounts and private keys from desktop keystore
      adminAccountField.onChange(desktop.admin.address);
      setValue("accountAndAws.adminPrivateKey", desktop.admin.privateKey);

      proposerAccountField.onChange(desktop.proposer.address);
      setValue("accountAndAws.proposerPrivateKey", desktop.proposer.privateKey);

      batchAccountField.onChange(desktop.batcher.address);
      setValue("accountAndAws.batchPrivateKey", desktop.batcher.privateKey);

      challengerAccountField.onChange(desktop.challenger.address);
      setValue("accountAndAws.challengerPrivateKey", desktop.challenger.privateKey);

      sequencerAccountField.onChange(desktop.sequencer.address);
      setValue("accountAndAws.sequencerPrivateKey", desktop.sequencer.privateKey);

      setSeedPhraseConfirmed(true);
    }

    setDesktopAccountsApplied(true);
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const generateRandomSeedPhrase = useCallback(() => {
    // Generate a valid BIP39 mnemonic
    const mnemonic = bip39.generateMnemonic();
    const words = mnemonic.split(" ");
    seedPhraseField.onChange(words);

    // Reset all account selections since the addresses will change (classic mode only)
    if (!isPreset) {
      adminAccountField.onChange(undefined);
      proposerAccountField.onChange(undefined);
      batchAccountField.onChange(undefined);
      challengerAccountField.onChange(undefined);
      sequencerAccountField.onChange(undefined);
    }
  }, [
    seedPhraseField,
    adminAccountField,
    proposerAccountField,
    batchAccountField,
    challengerAccountField,
    sequencerAccountField,
  ]);

  const handleSeedPhraseChange = useCallback(
    (index: number, value: string) => {
      // Check if the value contains multiple words (paste operation)
      const words = value.trim().toLowerCase().split(/\s+/);

      if (words.length > 1) {
        // If we have multiple words, update all inputs
        const newSeedPhrase = [...seedPhrase];
        words.forEach((word, i) => {
          if (i < 12) {
            // Only accept valid BIP39 words for paste operations
            if (wordList.includes(word)) {
              newSeedPhrase[i] = word;
            }
          }
        });
        seedPhraseField.onChange(newSeedPhrase);

        // Reset account selections when seed phrase changes (classic mode only)
        if (!isPreset) {
          adminAccountField.onChange(undefined);
          proposerAccountField.onChange(undefined);
          batchAccountField.onChange(undefined);
          challengerAccountField.onChange(undefined);
          sequencerAccountField.onChange(undefined);
        }
      } else {
        // Single word update - allow partial words for manual typing
        const word = value.trim().toLowerCase();

        // Allow empty string (for deletion) or any input for manual typing
        // We'll validate complete words later when generating accounts
        const newSeedPhrase = [...seedPhrase];
        newSeedPhrase[index] = word;
        seedPhraseField.onChange(newSeedPhrase);

        // Reset account selections when seed phrase changes (classic mode only)
        if (!isPreset) {
          adminAccountField.onChange(undefined);
          proposerAccountField.onChange(undefined);
          batchAccountField.onChange(undefined);
          challengerAccountField.onChange(undefined);
          sequencerAccountField.onChange(undefined);
        }
      }
    },
    [
      seedPhraseField,
      adminAccountField,
      proposerAccountField,
      batchAccountField,
      challengerAccountField,
      sequencerAccountField,
    ]
  );

  // Read balances injected by Electron main process via window.__TRH_DESKTOP_BALANCES__
  const [desktopBalances, setDesktopBalances] = useState<Record<string, string>>({});
  const [balancesLoading, setBalancesLoading] = useState(true);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const desktopRoles = useMemo(() => {
    if (!desktopAccountsApplied) return [];
    const desktop = getDesktopAccounts();
    if (!desktop) return [];
    return [
      { label: "Admin", address: desktop.admin.address },
      { label: "Proposer", address: desktop.proposer.address },
      { label: "Batcher", address: desktop.batcher.address },
      { label: "Challenger", address: desktop.challenger.address },
      { label: "Sequencer", address: desktop.sequencer.address },
    ];
  }, [desktopAccountsApplied]);

  const loadInjectedBalances = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as Record<string, any>;
    const balances = w.__TRH_DESKTOP_BALANCES__ as Record<string, string> | undefined;
    if (balances && Object.keys(balances).length > 0) {
      setDesktopBalances(balances);
      setBalancesLoading(false);
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    if (!desktopAccountsApplied) return;
    // Try immediately
    if (loadInjectedBalances()) return;
    // Listen for async injection from Electron main process
    const handler = () => loadInjectedBalances();
    window.addEventListener('trh-balances-loaded', handler);
    // Timeout after 10s
    const timeout = setTimeout(() => setBalancesLoading(false), 10000);
    return () => {
      window.removeEventListener('trh-balances-loaded', handler);
      clearTimeout(timeout);
    };
  }, [desktopAccountsApplied, loadInjectedBalances]);

  // Fetch balances via desktop bridge using the L1 RPC URL from the form
  const handleCopyAddress = useCallback((address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  }, []);

  const handleRefreshBalances = useCallback(async () => {
    const rpcUrl = l1RpcUrlField.value;
    if (!rpcUrl) return;

    setBalancesLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = window as Record<string, any>;
      if (w.__TRH_DESKTOP__?.fetchBalances) {
        const balances = await w.__TRH_DESKTOP__.fetchBalances(rpcUrl);
        if (balances && Object.keys(balances).length > 0) {
          setDesktopBalances(balances);
        }
      } else {
        // Fallback: read from injected balances
        loadInjectedBalances();
      }
    } catch {
      // ignore fetch errors
    } finally {
      setBalancesLoading(false);
    }
  }, [l1RpcUrlField.value, loadInjectedBalances]);

  const hasL1Rpc = !!(l1RpcUrlField.value && l1RpcUrlField.value.trim());

  // If desktop accounts are applied, show a simplified read-only view
  if (desktopAccountsApplied) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Account Selection</h2>
          <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800 font-medium">
              Accounts provided by TRH Desktop app. Keys are stored securely in your OS keychain.
            </p>
          </div>
        </div>

        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6 space-y-4">
            {desktopRoles.map(({ label, address }) => (
              <div key={label} className="space-y-1">
                <Label className="text-sm font-medium text-slate-700">{label} Account</Label>
                <div className="flex items-center justify-between font-mono text-sm bg-slate-50 border rounded-md p-3 text-slate-700">
                  <span className="truncate">{address}</span>
                  <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-slate-400 hover:text-slate-600"
                      onClick={() => handleCopyAddress(address)}
                    >
                      {copiedAddress === address ? (
                        <Check className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </Button>
                    <span className={`text-xs ${
                      desktopBalances[address] === "—" ? "text-red-500" :
                      desktopBalances[address] ? "text-slate-500" : "text-slate-400"
                    }`}>
                      {balancesLoading ? "Loading..." : desktopBalances[address] ?? "—"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRefreshBalances}
                disabled={balancesLoading || !hasL1Rpc}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${balancesLoading ? 'animate-spin' : ''}`} />
                Refresh Balances
              </Button>
              {!hasL1Rpc && (
                <p className="text-xs text-amber-600">
                  Enter the L1 RPC URL above to check account balances.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {!isMainnet && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-slate-700">
              Each account needs Sepolia ETH for gas fees.{" "}
              <a
                href="https://www.alchemy.com/faucets/ethereum-sepolia"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-700 underline font-medium"
              >
                Get Sepolia ETH from faucet
              </a>
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Account Selection</h2>
        <p className="text-slate-600 mt-1">
          Enter your seed phrase to generate accounts. Select different accounts
          for each role.
        </p>
        <p className="text-blue-600 text-sm mt-1">
          Each account should have sufficient ETH balance for their respective
          operations.
        </p>
      </div>

      {/* Seed Phrase Section */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label className="text-lg font-semibold text-slate-800">
                Seed Phrase <span className="text-red-500">*</span>
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateRandomSeedPhrase}
                className="text-xs bg-transparent"
              >
                <Shuffle className="w-3 h-3 mr-1" />
                Generate Random
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowSeedPhrase(!showSeedPhrase)}
              >
                {showSeedPhrase ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              Enter your 12-word seed phrase. You can type manually or paste the entire phrase.
              Words highlighted in yellow are not valid BIP39 words.
            </p>
            <div className="grid grid-cols-3 gap-3">
              {seedPhrase.map((word: string, index: number) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-sm text-slate-500 w-6">{index + 1}</span>
                  <Input
                    type={showSeedPhrase ? "text" : "password"}
                    value={word}
                    onChange={(e) =>
                      handleSeedPhraseChange(index, e.target.value)
                    }
                    placeholder="•••••"
                    className={`text-sm ${word && !wordList.includes(word) && word.length > 2
                        ? "border-yellow-300 bg-yellow-50"
                        : ""
                      }`}
                    list={`wordlist-${index}`}
                  />
                  <datalist id={`wordlist-${index}`}>
                    {word && wordList
                      .filter((w) => w.startsWith(word.toLowerCase()))
                      .slice(0, 10)
                      .map((suggestion) => (
                        <option key={suggestion} value={suggestion} />
                      ))}
                  </datalist>
                </div>
              ))}
            </div>
          </div>

          {/* Confirmation Checkbox */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="seedPhraseConfirm"
                checked={seedPhraseConfirmed}
                onCheckedChange={(checked) =>
                  setSeedPhraseConfirmed(checked === true)
                }
                className="mt-1 border-2 border-gray-500"
              />
              <div className="flex-1">
                <label
                  htmlFor="seedPhraseConfirm"
                  className="flex items-start gap-2 cursor-pointer"
                >
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <span className="font-semibold text-yellow-800">
                      Important:
                    </span>
                    <span className="text-yellow-700 ml-1">
                      I have written down my seed phrase and kept it safe. This
                      seed phrase is the only way to recover my accounts. I
                      understand I should never share it with anyone.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Selection (classic mode only — preset mode derives accounts from seed phrase on the backend) */}
      <div
        className={`space-y-4 transition-opacity duration-200 ${!seedPhraseConfirmed ? "opacity-50 pointer-events-none" : ""
          } ${isPreset ? "hidden" : ""}`}
      >
        {isLoading && (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span className="ml-2 text-sm text-slate-600">
              Generating accounts...
            </span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {!isLoading && !error && (
          <>
            {/* Refresh Balance Button */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Account Selection</h3>
                <p className="text-sm text-slate-600">
                  Select different accounts for each role. Balances are fetched automatically.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={refreshBalances}
                disabled={accounts.length === 0 || isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh Balances
              </Button>
            </div>

            {/* Admin Account */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">
                Admin Account <span className="text-red-500">*</span>
              </Label>
              <Select
                value={adminAccountField.value || undefined}
                onValueChange={(value) => {
                  adminAccountField.onChange(value);
                  const account = accounts.find((acc) => acc.address === value);
                  if (account) {
                    setValue("accountAndAws.adminPrivateKey", account.privateKey);
                  }
                }}
                disabled={
                  !seedPhraseConfirmed || isLoading || accounts.length === 0
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      accounts.length === 0
                        ? "No accounts available"
                        : "Select an account"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {accounts.length > 0 ? (
                    accounts.map((account, index) => (
                      <SelectItem key={index} value={account.address}>
                        <div className="flex items-center justify-between w-full">
                          <span className="font-mono text-sm">
                            {account.address}
                          </span>
                          <span className="text-xs text-slate-500 ml-4">
                            {account.balance}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-accounts" disabled>
                      No accounts available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {errors.accountAndAws?.adminAccount && (
                <p className="text-sm text-red-500">
                  {errors.accountAndAws.adminAccount.message}
                </p>
              )}
            </div>

            {/* Proposer Account */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">
                Proposer Account <span className="text-red-500">*</span>
              </Label>
              <Select
                value={proposerAccountField.value || undefined}
                onValueChange={(value) => {
                  proposerAccountField.onChange(value);
                  const account = accounts.find((acc) => acc.address === value);
                  if (account) {
                    setValue("accountAndAws.proposerPrivateKey", account.privateKey);
                  }
                }}
                disabled={
                  !seedPhraseConfirmed || isLoading || accounts.length === 0
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      accounts.length === 0
                        ? "No accounts available"
                        : "Select an account"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {accounts.length > 0 ? (
                    accounts.map((account, index) => (
                      <SelectItem key={index} value={account.address}>
                        <div className="flex items-center justify-between w-full">
                          <span className="font-mono text-sm">
                            {account.address}
                          </span>
                          <span className="text-xs text-slate-500 ml-4">
                            {account.balance}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-accounts" disabled>
                      No accounts available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {errors.accountAndAws?.proposerAccount && (
                <p className="text-sm text-red-500">
                  {errors.accountAndAws.proposerAccount.message}
                </p>
              )}
            </div>

            {/* Batch Account */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">
                Batch Account <span className="text-red-500">*</span>
              </Label>
              <Select
                value={batchAccountField.value || undefined}
                onValueChange={(value) => {
                  batchAccountField.onChange(value);
                  const account = accounts.find((acc) => acc.address === value);
                  if (account) {
                    setValue("accountAndAws.batchPrivateKey", account.privateKey);
                  }
                }}
                disabled={
                  !seedPhraseConfirmed || isLoading || accounts.length === 0
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      accounts.length === 0
                        ? "No accounts available"
                        : "Select an account"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {accounts.length > 0 ? (
                    accounts.map((account, index) => (
                      <SelectItem key={index} value={account.address}>
                        <div className="flex items-center justify-between w-full">
                          <span className="font-mono text-sm">
                            {account.address}
                          </span>
                          <span className="text-xs text-slate-500 ml-4">
                            {account.balance}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-accounts" disabled>
                      No accounts available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {errors.accountAndAws?.batchAccount && (
                <p className="text-sm text-red-500">
                  {errors.accountAndAws.batchAccount.message}
                </p>
              )}
            </div>

            {/* Sequencer Account */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">
                Sequencer Account <span className="text-red-500">*</span>
              </Label>
              <Select
                value={sequencerAccountField.value || undefined}
                onValueChange={(value) => {
                  sequencerAccountField.onChange(value);
                  const accountIndex = accounts.findIndex(
                    (acc) => acc.address === value
                  );
                  if (accountIndex !== -1) {
                    setValue(
                      "accountAndAws.sequencerPrivateKey",
                      accounts[accountIndex].privateKey
                    );
                  }
                }}
                disabled={
                  !seedPhraseConfirmed || isLoading || accounts.length === 0
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      accounts.length === 0
                        ? "No accounts available"
                        : "Select an account"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {accounts.length > 0 ? (
                    accounts.map((account, index) => (
                      <SelectItem key={index} value={account.address}>
                        <div className="flex items-center justify-between w-full">
                          <span className="font-mono text-sm">
                            {account.address}
                          </span>
                          <span className="text-xs text-slate-500 ml-4">
                            {account.balance}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-accounts" disabled>
                      No accounts available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {errors.accountAndAws?.sequencerAccount && (
                <p className="text-sm text-red-500">
                  {errors.accountAndAws.sequencerAccount.message}
                </p>
              )}
            </div>

            {/* Challenger Account */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">
                Challenger Account <span className="text-red-500">*</span>
              </Label>
              <Select
                value={challengerAccountField.value || undefined}
                onValueChange={(value) => {
                  challengerAccountField.onChange(value);
                  const account = accounts.find((acc) => acc.address === value);
                  if (account) {
                    setValue("accountAndAws.challengerPrivateKey", account.privateKey);
                  }
                }}
                disabled={
                  !seedPhraseConfirmed || isLoading || accounts.length === 0
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      accounts.length === 0
                        ? "No accounts available"
                        : "Select an account"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {accounts.length > 0 ? (
                    accounts.map((account, index) => (
                      <SelectItem key={index} value={account.address}>
                        <div className="flex items-center justify-between w-full">
                          <span className="font-mono text-sm">
                            {account.address}
                          </span>
                          <span className="text-xs text-slate-500 ml-4">
                            {account.balance}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-accounts" disabled>
                      No accounts available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {errors.accountAndAws?.challengerAccount && (
                <p className="text-sm text-red-500">
                  {errors.accountAndAws.challengerAccount.message}
                </p>
              )}
            </div>

            {/* Info Message - Red for mainnet, Blue for testnet */}
            <div className={`rounded-lg p-4 mt-6 ${isMainnet
                ? "bg-red-50 border border-red-300"
                : "bg-blue-50 border border-blue-200"
              }`}>
              <div className="flex items-start gap-3">
                {isMainnet && (
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                )}
                <p className={`text-sm ${isMainnet ? "text-red-700" : "text-slate-700"}`}>
                  {isMainnet
                    ? "For mainnet deployment, ensure each account (Admin, Proposer, Batcher) has sufficient ETH for gas fees and operations."
                    : "Make sure each selected account has sufficient ETH balance for their operations."
                  }
                  {" "}Please refer to the{" "}
                  <a
                    href={THANOS_STACK_PREREQUISITE_GUIDE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`pointer-events-auto ${isMainnet ? "text-red-800 underline font-medium" : "text-blue-700 underline"}`}
                  >
                    Guidelines
                  </a>
                  {" "}for recommended balance requirements.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
