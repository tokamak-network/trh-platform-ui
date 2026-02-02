"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { THANOS_SEPOLIA_CHAIN } from "../contracts/abis";

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
}

export function useWallet(): UseWalletReturn {
  const [state, setState] = useState<WalletState>({
    isConnected: false,
    address: null,
    balance: null,
    chainId: null,
    isCorrectChain: false,
    signer: null,
    provider: null,
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateBalance = useCallback(async (provider: ethers.BrowserProvider, address: string) => {
    try {
      const balance = await provider.getBalance(address);
      setState((prev) => ({
        ...prev,
        balance: ethers.formatEther(balance),
      }));
    } catch {
      // Ignore balance errors
    }
  }, []);

  const checkConnection = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();

      if (accounts.length > 0) {
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        const network = await provider.getNetwork();
        const chainId = Number(network.chainId);
        // Compare using BigInt to handle large chain IDs correctly
        const isCorrectChain = network.chainId === BigInt(THANOS_SEPOLIA_CHAIN.chainId);

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
      }
    } catch {
      // Not connected
    }
  }, [updateBalance]);

  useEffect(() => {
    checkConnection();

    if (typeof window !== "undefined" && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          setState({
            isConnected: false,
            address: null,
            balance: null,
            chainId: null,
            isCorrectChain: false,
            signer: null,
            provider: null,
          });
        } else {
          checkConnection();
        }
      };

      const handleChainChanged = () => {
        checkConnection();
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum?.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, [checkConnection]);

  const connect = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      setError("MetaMask not installed. Please install MetaMask to continue.");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);

      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      // Compare using BigInt to handle large chain IDs correctly
      const isCorrectChain = network.chainId === BigInt(THANOS_SEPOLIA_CHAIN.chainId);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  }, [updateBalance]);

  const disconnect = useCallback(() => {
    setState({
      isConnected: false,
      address: null,
      balance: null,
      chainId: null,
      isCorrectChain: false,
      signer: null,
      provider: null,
    });
  }, []);

  const switchToThanosNetwork = useCallback(async () => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: THANOS_SEPOLIA_CHAIN.chainIdHex }],
      });
      // Re-check connection after switch
      await checkConnection();
    } catch (switchError: unknown) {
      const errorCode = (switchError as { code?: number })?.code;
      // Chain not added (4902) or unrecognized chain
      if (errorCode === 4902 || errorCode === -32603) {
        try {
          await window.ethereum.request({
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
          // Re-check connection after adding
          await checkConnection();
        } catch (addError) {
          console.error("Failed to add network:", addError);
          setError("Failed to add Thanos Sepolia network");
        }
      } else {
        console.error("Failed to switch network:", switchError);
        setError("Failed to switch network");
      }
    }
  }, [checkConnection]);

  return {
    ...state,
    connect,
    disconnect,
    switchToThanosNetwork,
    isConnecting,
    error,
  };
}

// Type declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
    };
  }
}
