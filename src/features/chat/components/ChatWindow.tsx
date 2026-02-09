"use client";

/**
 * Chat window component - the main chat modal/panel
 */

import { X, Trash2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { useChat } from "../hooks/useChat";

interface ChatWindowProps {
  onClose: () => void;
  onMinimize?: () => void;
}

export function ChatWindow({ onClose, onMinimize }: ChatWindowProps) {
  const { messages, isLoading, error, sendMessage, clearChat } = useChat();

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-primary-500 text-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center">
            <span className="text-lg font-bold text-primary-500">T</span>
          </div>
          <div>
            <h2 className="font-semibold text-sm">Tokamak Architect</h2>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-white/80">Online</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearChat}
              className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20"
              title="Clear chat"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          {onMinimize && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMinimize}
              className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20"
              title="Minimize"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20"
            title="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-100 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Messages */}
      <MessageList messages={messages} isLoading={isLoading} onSendSuggestion={sendMessage} />

      {/* Input */}
      <MessageInput onSend={sendMessage} isLoading={isLoading} />

      {/* Disclaimer */}
      <div className="px-4 py-2 bg-gray-50 border-t text-center">
        <p className="text-xs text-gray-400">
          AI can make mistakes. Verify important info in the{" "}
          <a
            href="https://docs.tokamak.network"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-500 hover:underline"
          >
            docs
          </a>
          .
        </p>
      </div>
    </div>
  );
}
