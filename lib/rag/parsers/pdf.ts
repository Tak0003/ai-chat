import type { ChunkMetadata } from "@/types/document";

export interface ParsedChunk {
  text: string;
  metadata: ChunkMetadata;
}

export async function parsePdf(buffer: Buffer): Promise<ParsedChunk[]> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;
  const data = await pdfParse(buffer);
  const chunks: ParsedChunk[] = [];

  const pageTexts = data.text.split(/\f/);

  pageTexts.forEach((pageText: string, index: number) => {
    const trimmed = pageText.trim();
    if (trimmed.length > 0) {
      chunks.push({
        text: trimmed,
        metadata: { page: index + 1 },
      });
    }
  });

  return chunks;
}
