"use client";

export function StreamingMessage({ text }: { text: string }) {
  return (
    <span>
      {text}
      <span className="inline-block w-2 h-4 ml-0.5 bg-current align-middle animate-pulse" />
    </span>
  );
}
