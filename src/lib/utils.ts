import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Detect if running in Electron
export function isElectron(): boolean {
  if (typeof window === "undefined") return false;
  return (
    typeof window !== "undefined" &&
    typeof window.process === "object" &&
    (window.process as any)?.type === "renderer"
  ) || (
    typeof navigator === "object" &&
    typeof navigator.userAgent === "string" &&
    navigator.userAgent.indexOf("Electron") >= 0
  );
}
