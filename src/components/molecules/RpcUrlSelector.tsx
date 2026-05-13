"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, Link } from "lucide-react";
import { RPCUrl } from "@/features/configuration/schemas";

interface RpcUrlSelectorProps {
  readonly id: string;
  readonly label: string;
  readonly placeholder: string;
  readonly value?: string;
  readonly onChange: (value: string) => void;
  readonly rpcUrls: RPCUrl[];
  readonly urlType: "ExecutionLayer" | "BeaconChain";
  readonly network: "Mainnet" | "Testnet" | undefined;
  readonly error?: string;
  readonly required?: boolean;
  readonly className?: string;
}

export function RpcUrlSelector({
  id,
  label,
  placeholder,
  value = "",
  onChange,
  rpcUrls,
  urlType,
  network,
  error,
  required = false,
  className = "",
}: RpcUrlSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredUrls = rpcUrls.filter(
    (r) => r.type === urlType && r.network === network
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    if (filteredUrls.length > 0) {
      setIsOpen(true);
    }
  };

  const handleSelect = (rpcUrl: RPCUrl) => {
    onChange(rpcUrl.rpcUrl);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const shouldShowDropdown = isOpen && filteredUrls.length > 0;

  return (
    <div className={`space-y-2 ${className} relative`}>
      <Label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>

      <div className="relative">
        <Input
          ref={inputRef}
          id={id}
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          className={`pr-8 ${error ? "border-red-500" : ""}`}
        />
        {filteredUrls.length > 0 && (
          <ChevronDown
            className={`absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        )}

        {shouldShowDropdown && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
          >
            {filteredUrls.map((rpcUrl) => (
              <button
                key={rpcUrl.id}
                type="button"
                className="w-full px-3 py-2 text-left cursor-pointer hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
                onClick={() => handleSelect(rpcUrl)}
              >
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{rpcUrl.name}</span>
                  <span className="text-xs text-slate-500 truncate">{rpcUrl.rpcUrl}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {filteredUrls.length > 0 && (
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <Link className="w-3 h-3" />
          <span>
            {filteredUrls.length} saved URL{filteredUrls.length !== 1 ? "s" : ""} available • Click to select or type manually
          </span>
        </div>
      )}
    </div>
  );
}
