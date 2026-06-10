"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { StreamingMessage } from "./StreamingMessage";
import type { Message } from "@/types/chat";

interface Props {
  message: Message;
  isStreaming?: boolean;
}

function getTextContent(content: Message["content"]): string {
  if (typeof content === "string") return content;
  return content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");
}

function getImageSources(content: Message["content"]): string[] {
  if (typeof content === "string") return [];
  return content
    .filter((b) => b.type === "image")
    .map(
      (b) =>
        `data:${(b as { type: "image"; source: { type: string; media_type: string; data: string } }).source.media_type};base64,${(b as { type: "image"; source: { type: string; media_type: string; data: string } }).source.data}`
    );
}

export function MessageBubble({ message, isStreaming = false }: Props) {
  const isUser = message.role === "user";
  const text = getTextContent(message.content);
  const images = getImageSources(message.content);

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
          isUser
            ? "bg-blue-600 text-white rounded-br-sm"
            : "bg-muted text-foreground rounded-bl-sm"
        }`}
      >
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {images.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={src}
                alt={`添付画像 ${i + 1}`}
                className="max-h-48 rounded-lg object-contain"
              />
            ))}
          </div>
        )}
        {isStreaming ? (
          <StreamingMessage text={text} />
        ) : isUser ? (
          <p className="whitespace-pre-wrap">{text}</p>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ className, children, ...props }) {
                const match = /language-(\w+)/.exec(className ?? "");
                const isBlock = !!match;
                return isBlock ? (
                  <SyntaxHighlighter
                    style={oneDark}
                    language={match[1]}
                    PreTag="div"
                    className="rounded-md text-xs my-2"
                  >
                    {String(children).replace(/\n$/, "")}
                  </SyntaxHighlighter>
                ) : (
                  <code
                    className="bg-black/20 rounded px-1 py-0.5 text-xs font-mono"
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
              p({ children }) {
                return <p className="mb-2 last:mb-0">{children}</p>;
              },
              ul({ children }) {
                return <ul className="list-disc pl-4 mb-2">{children}</ul>;
              },
              ol({ children }) {
                return <ol className="list-decimal pl-4 mb-2">{children}</ol>;
              },
            }}
          >
            {text}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}
