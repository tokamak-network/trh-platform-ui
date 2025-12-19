"use client";

import React, { forwardRef } from "react";

interface BinButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export const BinButton = forwardRef<HTMLButtonElement, BinButtonProps>(
  ({ onClick, disabled }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="group relative bg-transparent border-none p-1 disabled:cursor-not-allowed cursor-pointer"
      >
        <svg
          viewBox="0 0 24 24"
          height="22"
          width="22"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          className="transition-transform duration-200 group-hover:scale-125 group-disabled:opacity-50"
        >
          <path
            d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6"
            className="stroke-red-500 transition-colors duration-200 group-hover:stroke-red-700"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    );
  }
);

BinButton.displayName = "BinButton";
