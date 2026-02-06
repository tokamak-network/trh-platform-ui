"use client";

/**
 * Floating chat widget with toggle button
 */

import { useState, useEffect } from "react";
import { MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatWindow } from "./ChatWindow";

interface ChatWidgetProps {
  /** Initial open state */
  defaultOpen?: boolean;
  /** Position of the widget */
  position?: "bottom-right" | "bottom-left";
}

export function ChatWidget({
  defaultOpen = false,
  position = "bottom-right",
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  // Handle open/close with animation
  const handleToggle = () => {
    if (isOpen) {
      setIsAnimating(true);
      setTimeout(() => {
        setIsOpen(false);
        setIsAnimating(false);
      }, 200);
    } else {
      setIsOpen(true);
      setHasUnread(false);
    }
  };

  // Position classes
  const positionClasses = {
    "bottom-right": "right-4 sm:right-6",
    "bottom-left": "left-4 sm:left-6",
  };

  return (
    <div
      className={cn(
        "fixed bottom-20 sm:bottom-24 z-[9999]",
        positionClasses[position]
      )}
    >
      {/* Chat window */}
      {isOpen && (
        <div
          className={cn(
            "absolute bottom-16 mb-2 w-[360px] h-[520px] sm:w-[400px] sm:h-[560px]",
            position === "bottom-right" ? "right-0" : "left-0",
            isAnimating
              ? "animate-out fade-out-0 zoom-out-95 slide-out-to-bottom-2"
              : "animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2",
            "duration-200"
          )}
        >
          <ChatWindow onClose={handleToggle} />
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={handleToggle}
        className={cn(
          "relative flex items-center justify-center w-14 h-14 rounded-full",
          "bg-gradient-to-r from-purple-600 to-blue-600",
          "text-white shadow-lg hover:shadow-xl",
          "transform transition-all duration-200",
          "hover:scale-105 active:scale-95",
          "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        )}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {/* Icon transition */}
        <div
          className={cn(
            "absolute transition-all duration-200",
            isOpen
              ? "rotate-0 opacity-100"
              : "rotate-90 opacity-0"
          )}
        >
          <X className="w-6 h-6" />
        </div>
        <div
          className={cn(
            "absolute transition-all duration-200",
            isOpen
              ? "-rotate-90 opacity-0"
              : "rotate-0 opacity-100"
          )}
        >
          <MessageCircle className="w-6 h-6" />
        </div>

        {/* Unread indicator */}
        {hasUnread && !isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
        )}

        {/* Ripple effect background */}
        <span className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-0 hover:opacity-100" />
      </button>

      {/* Tooltip */}
      {!isOpen && (
        <div
          className={cn(
            "absolute bottom-full mb-2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg",
            "opacity-0 group-hover:opacity-100 pointer-events-none",
            "transition-opacity duration-200",
            "whitespace-nowrap",
            position === "bottom-right" ? "right-0" : "left-0"
          )}
        >
          Chat with Tokamak Architect
          <div
            className={cn(
              "absolute top-full w-2 h-2 bg-gray-900 rotate-45 -translate-y-1",
              position === "bottom-right" ? "right-6" : "left-6"
            )}
          />
        </div>
      )}
    </div>
  );
}
