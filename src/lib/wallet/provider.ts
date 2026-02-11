import EthereumProvider from "@walletconnect/ethereum-provider";
import { THANOS_SEPOLIA_CHAIN } from "@/features/drb/contracts/abis";

// WalletConnect Project ID — get one at https://cloud.walletconnect.com
const WALLETCONNECT_PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID";

let wcProvider: Awaited<ReturnType<typeof EthereumProvider.init>> | null = null;

export function isElectron(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return ua.includes("electron");
}

export function hasInjectedWallet(): boolean {
  return typeof window !== "undefined" && !!window.ethereum;
}

/**
 * Returns an EIP-1193 provider:
 * - In browser with MetaMask: returns window.ethereum
 * - In Electron or no extension: returns WalletConnect provider (shows QR modal)
 */
export async function getWalletProvider(): Promise<{
  provider: EIP1193Provider;
  type: "injected" | "walletconnect";
}> {
  // Prefer injected wallet (MetaMask etc.) when available
  if (hasInjectedWallet()) {
    return { provider: window.ethereum!, type: "injected" };
  }

  // Fallback to WalletConnect
  if (!wcProvider) {
    wcProvider = await EthereumProvider.init({
      projectId: WALLETCONNECT_PROJECT_ID,
      chains: [THANOS_SEPOLIA_CHAIN.chainId],
      rpcMap: {
        [THANOS_SEPOLIA_CHAIN.chainId]: THANOS_SEPOLIA_CHAIN.rpcUrl,
      },
      showQrModal: true,
      metadata: {
        name: "TRH Platform",
        description: "Tokamak Rollup Hub",
        url: typeof window !== "undefined" ? window.location.origin : "https://rollup.tokamak.network",
        icons: [],
      },
    });
  }

  return { provider: wcProvider as unknown as EIP1193Provider, type: "walletconnect" };
}

export function getWalletConnectProvider() {
  return wcProvider;
}

export async function disconnectWalletConnect() {
  if (wcProvider) {
    try {
      await wcProvider.disconnect();
    } catch {
      // ignore
    }
    wcProvider = null;
  }
}

// Re-export the EIP-1193 type used by the rest of the app
export type EIP1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  removeListener: (
    event: string,
    callback: (...args: unknown[]) => void
  ) => void;
};
