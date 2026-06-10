import { ObjectId } from "mongodb";

export type MessageRole = "user" | "assistant";

export interface TextContent {
  type: "text";
  text: string;
}

export interface ImageContent {
  type: "image";
  source: {
    type: "base64";
    media_type: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
    data: string;
  };
}

export type ContentBlock = TextContent | ImageContent;

export interface Message {
  role: MessageRole;
  content: string | ContentBlock[];
  timestamp: Date;
}

export interface Conversation {
  _id?: ObjectId;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatRequest {
  conversationId: string | null;
  message: string;
  images?: string[];
  useRag?: boolean;
}

export type SseEventType = "delta" | "done" | "error";

export interface SseDeltaEvent {
  type: "delta";
  text: string;
}

export interface SseDoneEvent {
  type: "done";
  conversationId: string;
}

export interface SseErrorEvent {
  type: "error";
  message: string;
}

export type SseEvent = SseDeltaEvent | SseDoneEvent | SseErrorEvent;
