/**
 * Chat service for communicating with the Tokamak Architect Bot API
 */

import { ChatRequest, ChatResponse } from "../schemas/chat";

// Chatbot API base URL - can be configured via environment variable
const CHATBOT_API_URL =
  process.env.NEXT_PUBLIC_CHATBOT_URL || "http://localhost:8001";

/**
 * Send a chat message to the Tokamak Architect Bot
 */
export async function sendChatMessage(
  request: ChatRequest
): Promise<ChatResponse> {
  const response = await fetch(`${CHATBOT_API_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Chat request failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Check if the chatbot service is healthy
 */
export async function checkChatbotHealth(): Promise<{
  status: string;
  version: string;
  model: string;
}> {
  const response = await fetch(`${CHATBOT_API_URL}/health`);

  if (!response.ok) {
    throw new Error("Chatbot service is unavailable");
  }

  const data = await response.json();
  return {
    status: data.status,
    version: data.version,
    model: data.chat_model,
  };
}

/**
 * Get available chat models
 */
export async function getChatModels(): Promise<
  Array<{ id: string; name: string; tier: string }>
> {
  const response = await fetch(`${CHATBOT_API_URL}/api/chat/models`);

  if (!response.ok) {
    throw new Error("Failed to fetch chat models");
  }

  const data = await response.json();
  return data.available_models;
}
