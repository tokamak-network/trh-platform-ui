/**
 * Custom hook for managing chat state and interactions
 */

import { useCallback, useReducer, useRef, useEffect } from "react";
import {
  Message,
  ChatState,
  ChatAction,
  ChatRequest,
} from "../schemas/chat";

// Simple UUID generator (crypto.randomUUID fallback)
const generateId = (): string => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};
import { sendChatMessage } from "../services/chatService";

// Initial state
const initialState: ChatState = {
  messages: [],
  conversationId: null,
  isLoading: false,
  error: null,
};

// Reducer
function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "ADD_USER_MESSAGE":
      return {
        ...state,
        messages: [...state.messages, action.payload],
        error: null,
      };
    case "ADD_ASSISTANT_MESSAGE":
      return {
        ...state,
        messages: [...state.messages, action.payload],
        isLoading: false,
      };
    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };
    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    case "SET_CONVERSATION_ID":
      return {
        ...state,
        conversationId: action.payload,
      };
    case "CLEAR_MESSAGES":
      return {
        ...initialState,
      };
    default:
      return state;
  }
}

// Storage key for persisting chat history
const STORAGE_KEY = "tokamak-architect-chat";

export function useChat() {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load chat history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.messages && Array.isArray(parsed.messages)) {
          // Restore messages with proper date objects
          parsed.messages.forEach((msg: Message) => {
            dispatch({
              type:
                msg.role === "user"
                  ? "ADD_USER_MESSAGE"
                  : "ADD_ASSISTANT_MESSAGE",
              payload: {
                ...msg,
                timestamp: new Date(msg.timestamp),
              },
            });
          });
          if (parsed.conversationId) {
            dispatch({
              type: "SET_CONVERSATION_ID",
              payload: parsed.conversationId,
            });
          }
        }
      }
    } catch (e) {
      console.error("Failed to load chat history:", e);
    }
  }, []);

  // Save chat history to localStorage when messages change
  useEffect(() => {
    if (state.messages.length > 0) {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            messages: state.messages,
            conversationId: state.conversationId,
          })
        );
      } catch (e) {
        console.error("Failed to save chat history:", e);
      }
    }
  }, [state.messages, state.conversationId]);

  // Send a message
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || state.isLoading) return;

      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      // Add user message
      const userMessage: Message = {
        id: generateId(),
        role: "user",
        content: content.trim(),
        timestamp: new Date(),
      };
      dispatch({ type: "ADD_USER_MESSAGE", payload: userMessage });
      dispatch({ type: "SET_LOADING", payload: true });

      try {
        // Prepare request with history (last 10 messages for context)
        const historyForRequest = state.messages.slice(-10).map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        }));

        const request: ChatRequest = {
          message: content.trim(),
          conversation_id: state.conversationId || undefined,
          history: historyForRequest,
        };

        // Send to API
        const response = await sendChatMessage(request);

        // Add assistant message
        const assistantMessage: Message = {
          id: generateId(),
          role: "assistant",
          content: response.response,
          timestamp: new Date(),
        };
        dispatch({ type: "ADD_ASSISTANT_MESSAGE", payload: assistantMessage });

        // Update conversation ID
        if (response.conversation_id && !state.conversationId) {
          dispatch({
            type: "SET_CONVERSATION_ID",
            payload: response.conversation_id,
          });
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return; // Request was cancelled
        }
        dispatch({
          type: "SET_ERROR",
          payload:
            error instanceof Error ? error.message : "Failed to send message",
        });
      }
    },
    [state.isLoading, state.messages, state.conversationId]
  );

  // Clear chat history
  const clearChat = useCallback(() => {
    dispatch({ type: "CLEAR_MESSAGES" });
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Cancel pending request
  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  return {
    messages: state.messages,
    isLoading: state.isLoading,
    error: state.error,
    conversationId: state.conversationId,
    sendMessage,
    clearChat,
    cancelRequest,
  };
}
