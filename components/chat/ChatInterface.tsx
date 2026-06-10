"use client";

import { useState } from "react";
import { toast } from "sonner";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { ConversationSidebar } from "./ConversationSidebar";
import type { Message, SseEvent, Conversation } from "@/types/chat";

export function ChatInterface() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleNewConversation = () => {
    setConversationId(null);
    setMessages([]);
    setInput("");
    setStreamingText(null);
  };

  const handleSelectConversation = (
    id: string,
    msgs: Conversation["messages"]
  ) => {
    setConversationId(id);
    setMessages(msgs);
    setStreamingText(null);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isSending) return;

    const userMessage: Message = {
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsSending(true);
    setStreamingText("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, message: text, useRag: false }),
      });

      if (!res.ok || !res.body) {
        throw new Error("サーバーエラーが発生しました");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const event: SseEvent = JSON.parse(line.slice(6));

          if (event.type === "delta") {
            fullText += event.text;
            setStreamingText(fullText);
          } else if (event.type === "done") {
            const isNew = !conversationId;
            setConversationId(event.conversationId);
            setMessages((prev) => [
              ...prev,
              { role: "assistant", content: fullText, timestamp: new Date() },
            ]);
            setStreamingText(null);
            if (isNew) setRefreshTrigger((n) => n + 1);
          } else if (event.type === "error") {
            throw new Error(event.message);
          }
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "エラーが発生しました");
      setStreamingText(null);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-full">
      <ConversationSidebar
        currentConversationId={conversationId}
        onSelect={handleSelectConversation}
        onNew={handleNewConversation}
        refreshTrigger={refreshTrigger}
      />
      <div className="flex flex-col flex-1 min-w-0">
        <header className="border-b px-6 py-3 shrink-0">
          <h1 className="font-semibold text-lg">
            {process.env.NEXT_PUBLIC_APP_NAME ?? "AI学習アシスタント"}
          </h1>
        </header>
        <MessageList messages={messages} streamingText={streamingText} />
        <MessageInput
          value={input}
          onChange={setInput}
          onSend={handleSend}
          disabled={isSending}
        />
      </div>
    </div>
  );
}
