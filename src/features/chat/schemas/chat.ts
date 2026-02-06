/**
 * Chat feature schemas and types
 */

import { z } from "zod";

// Message role enum
export const MessageRoleSchema = z.enum(["user", "assistant", "system"]);
export type MessageRole = z.infer<typeof MessageRoleSchema>;

// Single chat message
export const MessageSchema = z.object({
  id: z.string(),
  role: MessageRoleSchema,
  content: z.string(),
  timestamp: z.date(),
});
export type Message = z.infer<typeof MessageSchema>;

// Chat request to backend
export const ChatRequestSchema = z.object({
  message: z.string().min(1).max(10000),
  conversation_id: z.string().optional(),
  history: z.array(
    z.object({
      role: MessageRoleSchema,
      content: z.string(),
    })
  ).optional(),
});
export type ChatRequest = z.infer<typeof ChatRequestSchema>;

// Chat response from backend
export const ChatResponseSchema = z.object({
  response: z.string(),
  conversation_id: z.string(),
  sources: z.array(z.string()),
  model: z.string(),
  timestamp: z.string(),
});
export type ChatResponse = z.infer<typeof ChatResponseSchema>;

// Chat state
export interface ChatState {
  messages: Message[];
  conversationId: string | null;
  isLoading: boolean;
  error: string | null;
}

// Chat actions
export type ChatAction =
  | { type: "ADD_USER_MESSAGE"; payload: Message }
  | { type: "ADD_ASSISTANT_MESSAGE"; payload: Message }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_CONVERSATION_ID"; payload: string }
  | { type: "CLEAR_MESSAGES" };
