/**
 * Chat feature exports
 */

// Components
export { ChatWidget } from "./components/ChatWidget";
export { ChatWindow } from "./components/ChatWindow";
export { ChatBubble } from "./components/ChatBubble";
export { MessageInput } from "./components/MessageInput";
export { MessageList } from "./components/MessageList";

// Hooks
export { useChat } from "./hooks/useChat";

// Services
export {
  sendChatMessage,
  checkChatbotHealth,
  getChatModels,
} from "./services/chatService";

// Types
export type {
  Message,
  MessageRole,
  ChatRequest,
  ChatResponse,
  ChatState,
} from "./schemas/chat";
