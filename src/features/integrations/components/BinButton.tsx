"use client";

import React from "react";

interface BinButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function BinButton({ onClick, disabled }: BinButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group relative flex flex-col items-center justify-center w-8 h-8 rounded-md bg-red-500 hover:bg-red-600 disabled:bg-red-300 disabled:cursor-not-allowed cursor-pointer transition-colors duration-200 overflow-hidden"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 39 7"
        className="w-3 origin-right transition-transform duration-200 group-hover:rotate-45"
      >
        <line strokeWidth="4" stroke="white" y2="5" x2="39" y1="5" />
        <line strokeWidth="3" stroke="white" y2="1.5" x2="26.0357" y1="1.5" x1="12" />
      </svg>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 33 39"
        className="w-2.5"
      >
        <mask fill="white" id="bin-mask">
          <path d="M0 0H33V35C33 37.2091 31.2091 39 29 39H4C1.79086 39 0 37.2091 0 35V0Z" />
        </mask>
        <path
          mask="url(#bin-mask)"
          fill="white"
          d="M0 0H33H0ZM37 35C37 39.4183 33.4183 43 29 43H4C-0.418278 43 -4 39.4183 -4 35H4H29H37ZM4 43C-0.418278 43 -4 39.4183 -4 35V0H4V35V43ZM37 0V35C37 39.4183 33.4183 43 29 43V35V0H37Z"
        />
        <path strokeWidth="4" stroke="white" d="M12 6L12 29" />
        <path strokeWidth="4" stroke="white" d="M21 6V29" />
      </svg>
    </button>
  );
}
