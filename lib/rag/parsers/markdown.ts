import type { ChunkMetadata } from "@/types/document";

export interface ParsedChunk {
  text: string;
  metadata: ChunkMetadata;
}

export function parseMarkdown(content: string): ParsedChunk[] {
  const lines = content.split("\n");
  const chunks: ParsedChunk[] = [];
  let currentSection = "";
  let currentText = "";

  for (const line of lines) {
    const headingMatch = line.match(/^#{1,3}\s+(.+)/);
    if (headingMatch) {
      if (currentText.trim().length > 0) {
        chunks.push({
          text: currentText.trim(),
          metadata: { section: currentSection || undefined },
        });
      }
      currentSection = headingMatch[1];
      currentText = line + "\n";
    } else {
      currentText += line + "\n";
    }
  }

  if (currentText.trim().length > 0) {
    chunks.push({
      text: currentText.trim(),
      metadata: { section: currentSection || undefined },
    });
  }

  return chunks;
}
