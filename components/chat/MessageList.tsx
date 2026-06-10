"use client";

import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "./MessageBubble";
import type { Message } from "@/types/chat";

interface Props {
  messages: Message[];
  streamingText: string | null;
}

export function MessageList({ messages, streamingText }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  if (messages.length === 0 && streamingText === null) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        メッセージを入力して会話を始めましょう
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 px-4">
      <div className="py-4">
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}
        {streamingText !== null && (
          <MessageBubble
            message={{ role: "assistant", content: streamingText, timestamp: new Date() }}
            isStreaming
          />
        )}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
