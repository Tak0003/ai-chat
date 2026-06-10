"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Plus } from "lucide-react";
import type { Conversation } from "@/types/chat";

interface ConversationSummary {
  _id: string;
  title: string;
  updatedAt: string;
}

interface Props {
  currentConversationId: string | null;
  onSelect: (id: string, messages: Conversation["messages"]) => void;
  onNew: () => void;
  refreshTrigger: number;
}

export function ConversationSidebar({
  currentConversationId,
  onSelect,
  onNew,
  refreshTrigger,
}: Props) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/chat")
      .then((r) => r.json())
      .then((data) => setConversations(data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [refreshTrigger]);

  const handleSelect = async (id: string) => {
    if (id === currentConversationId) return;
    const res = await fetch(`/api/chat/${id}`);
    const data = await res.json();
    onSelect(id, data.messages ?? []);
  };

  return (
    <aside className="w-64 border-r flex flex-col h-full shrink-0">
      <div className="p-3">
        <Button onClick={onNew} className="w-full gap-2" variant="outline">
          <Plus className="h-4 w-4" />
          新しい会話
        </Button>
      </div>
      <Separator />
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="p-4 text-sm text-muted-foreground">読み込み中...</div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">
            まだ会話がありません
          </div>
        ) : (
          <ul className="py-2">
            {conversations.map((conv) => (
              <li key={conv._id}>
                <button
                  onClick={() => handleSelect(conv._id)}
                  className={`w-full text-left px-4 py-2.5 text-sm flex items-start gap-2 hover:bg-muted transition-colors ${
                    conv._id === currentConversationId
                      ? "bg-muted font-medium"
                      : ""
                  }`}
                >
                  <MessageSquare className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{conv.title}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>
    </aside>
  );
}
