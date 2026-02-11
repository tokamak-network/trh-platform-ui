"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ethers } from "ethers";
import { THANOS_SEPOLIA_CHAIN } from "../contracts/abis";
import {
  getWalletProvider,
  disconnectWalletConnect,
  hasInjectedWallet,
  isElectron,
  type EIP1193Provider,
} from "@/lib/wallet/provider";

interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: string | null;
  chainId: number | null;
  isCorrectChain: boolean;
  signer: ethers.Signer | null;
  provider: ethers.BrowserProvider | null;
}

interface UseWalletReturn extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  switchToThanosNetwork: () => Promise<void>;
  isConnecting: boolean;
  error: string | null;
  /** "injected" (MetaMask), "walletconnect", or null if not connected */
  walletType: "injected" | "walletconnect" | null;
}

const initialState: WalletState = {
  isConnected: false,
  address: null,
  balance: null,
  chainId: null,
  isCorrectChain: false,
  signer: null,
  provider: null,
};

export function useWallet(): UseWalletReturn {
  const [state, setState] = useState<WalletState>(initialState);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<"injected" | "walletconnect" | null>(null);
  const eipProviderRef = useRef<EIP1193Provider | null>(null);

  const updateBalance = useCallback(
    async (provider: ethers.BrowserProvider, address: string) => {
      try {
        const balance = await provider.getBalance(address);
        setState((prev) => ({ ...prev, balance: ethers.formatEther(balance) }));
      } catch {
        // Ignore balance errors
      }
    },
    []
  );

  const setupConnection = useCallback(
    async (eipProvider: EIP1193Provider, type: "injected" | "walletconnect") => {
      const provider = new ethers.BrowserProvider(eipProvider as ethers.Eip1193Provider);
      const accounts = await provider.listAccounts();

      if (accounts.length > 0) {
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        const network = await provider.getNetwork();
        const chainId = Number(network.chainId);
        const isCorrectChain =
          network.chainId === BigInt(THANOS_SEPOLIA_CHAIN.chainId);

        eipProviderRef.current = eipProvider;
        setWalletType(type);
        setState({
          isConnected: true,
          address,
          balance: null,
          chainId,
          isCorrectChain,
          signer,
          provider,
        });

        await updateBalance(provider, address);
        return true;
      }
      return false;
    },
    [updateBalance]
  );

  // Check for existing injected wallet connection on mount
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

    const check = async () => {
      try {
        await setupConnection(window.ethereum!, "injected");
      } catch {
        // Not connected
      }
    };
    check();
  }, [setupConnection]);

  // Listen for account/chain changes
  useEffect(() => {
    const eipProvider = eipProviderRef.current;
    if (!eipProvider) return;

    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      if (!accounts || accounts.length === 0) {
        setState(initialState);
        setWalletType(null);
        eipProviderRef.current = null;
      } else {
        setupConnection(eipProvider, walletType || "injected");
      }
    };

    const handleChainChanged = () => {
      setupConnection(eipProvider, walletType || "injected");
    };

    const handleDisconnect = () => {
      setState(initialState);
      setWalletType(null);
      eipProviderRef.current = null;
    };

    eipProvider.on("accountsChanged", handleAccountsChanged);
    eipProvider.on("chainChanged", handleChainChanged);
    eipProvider.on("disconnect", handleDisconnect);

    return () => {
      eipProvider.removeListener("accountsChanged", handleAccountsChanged);
      eipProvider.removeListener("chainChanged", handleChainChanged);
      eipProvider.removeListener("disconnect", handleDisconnect);
    };
  }, [walletType, setupConnection]);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const { provider: eipProvider, type } = await getWalletProvider();

      // For WalletConnect, .enable() opens the QR modal
      if (type === "walletconnect") {
        await (eipProvider as { enable?: () => Promise<string[]> }).enable?.();
      } else {
        // MetaMask: request accounts
        await eipProvider.request({ method: "eth_requestAccounts", params: [] });
      }

      const connected = await setupConnection(eipProvider, type);
      if (!connected) {
        setError("No accounts found. Please try again.");
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes("User rejected")) {
        setError("Connection rejected by user");
      } else {
        setError(
          err instanceof Error ? err.message : "Failed to connect wallet"
        );
      }
    } finally {
      setIsConnecting(false);
    }
  }, [setupConnection]);

  const disconnect = useCallback(async () => {
    if (walletType === "walletconnect") {
      await disconnectWalletConnect();
    }
    setState(initialState);
    setWalletType(null);
    eipProviderRef.current = null;
  }, [walletType]);

  const switchToThanosNetwork = useCallback(async () => {
    const eipProvider = eipProviderRef.current;
    if (!eipProvider) return;

    try {
      await eipProvider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: THANOS_SEPOLIA_CHAIN.chainIdHex }],
      });
      await setupConnection(eipProvider, walletType || "injected");
    } catch (switchError: unknown) {
      const errorCode = (switchError as { code?: number })?.code;
      if (errorCode === 4902 || errorCode === -32603) {
        try {
          await eipProvider.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: THANOS_SEPOLIA_CHAIN.chainIdHex,
                chainName: THANOS_SEPOLIA_CHAIN.name,
                nativeCurrency: THANOS_SEPOLIA_CHAIN.nativeCurrency,
                rpcUrls: [THANOS_SEPOLIA_CHAIN.rpcUrl],
                blockExplorerUrls: [THANOS_SEPOLIA_CHAIN.explorerUrl],
              },
            ],
          });
          await setupConnection(eipProvider, walletType || "injected");
        } catch (addError) {
          console.error("Failed to add network:", addError);
          setError("Failed to add Thanos Sepolia network");
        }
      } else {
        console.error("Failed to switch network:", switchError);
        setError("Failed to switch network");
      }
    }
  }, [walletType, setupConnection]);

  return {
    ...state,
    connect,
    disconnect,
    switchToThanosNetwork,
    isConnecting,
    error,
    walletType,
  };
}

// Type declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: EIP1193Provider;
  }
}
