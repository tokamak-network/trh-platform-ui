"use client";

/**
 * Chat bubble component for displaying individual messages
 */

import { cn } from "@/lib/utils";
import { Message } from "../schemas/chat";
import { Bot, User } from "lucide-react";

interface ChatBubbleProps {
  message: Message;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 max-w-full",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          isUser
            ? "bg-primary-600 text-white"
            : "bg-primary-500 text-white"
        )}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Message content */}
      <div
        className={cn(
          "flex flex-col max-w-[80%]",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "px-4 py-2 rounded-2xl text-sm",
            isUser
              ? "bg-primary-500 text-white rounded-tr-sm"
              : "bg-gray-100 text-gray-900 rounded-tl-sm"
          )}
        >
          {/* Render message content with basic markdown support */}
          <div className="whitespace-pre-wrap break-words">
            {message.content.split("\n").map((line, i) => {
              // Basic markdown rendering
              if (line.startsWith("# ")) {
                return (
                  <h3 key={i} className="font-bold text-base mt-2 mb-1">
                    {line.slice(2)}
                  </h3>
                );
              }
              if (line.startsWith("## ")) {
                return (
                  <h4 key={i} className="font-semibold text-sm mt-2 mb-1">
                    {line.slice(3)}
                  </h4>
                );
              }
              if (line.startsWith("- ") || line.startsWith("* ")) {
                return (
                  <li key={i} className="ml-4 list-disc">
                    {line.slice(2)}
                  </li>
                );
              }
              if (line.startsWith("**") && line.endsWith("**")) {
                return (
                  <strong key={i} className="font-semibold">
                    {line.slice(2, -2)}
                  </strong>
                );
              }
              // Handle bold text within lines
              const boldRegex = /\*\*(.*?)\*\*/g;
              const parts = line.split(boldRegex);
              if (parts.length > 1) {
                return (
                  <p key={i}>
                    {parts.map((part, j) =>
                      j % 2 === 1 ? (
                        <strong key={j} className="font-semibold">
                          {part}
                        </strong>
                      ) : (
                        part
                      )
                    )}
                  </p>
                );
              }
              return line ? <p key={i}>{line}</p> : <br key={i} />;
            })}
          </div>
        </div>

        {/* Timestamp */}
        <span className="text-xs text-gray-400 mt-1 px-1">
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}
