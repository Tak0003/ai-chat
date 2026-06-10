import mammoth from "mammoth";
import * as XLSX from "xlsx";
import type { ChunkMetadata } from "@/types/document";

export interface ParsedChunk {
  text: string;
  metadata: ChunkMetadata;
}

export async function parseDocx(buffer: Buffer): Promise<ParsedChunk[]> {
  const result = await mammoth.extractRawText({ buffer });
  return [{ text: result.value.trim(), metadata: {} }];
}

export function parseXlsx(buffer: Buffer): ParsedChunk[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const chunks: ParsedChunk[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });
    const text = rows
      .map((row) => row.filter(Boolean).join("\t"))
      .filter((r) => r.trim().length > 0)
      .join("\n");

    if (text.trim().length > 0) {
      chunks.push({ text, metadata: { section: sheetName } });
    }
  }

  return chunks;
}

export async function parsePptx(buffer: Buffer): Promise<ParsedChunk[]> {
  // pptx は ZIP 形式なので unzipper で各スライドの XML からテキストを抽出
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(buffer);
  const chunks: ParsedChunk[] = [];

  const slideFiles = Object.keys(zip.files)
    .filter((name) => name.match(/^ppt\/slides\/slide\d+\.xml$/))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)/)?.[1] ?? "0");
      const numB = parseInt(b.match(/slide(\d+)/)?.[1] ?? "0");
      return numA - numB;
    });

  for (let i = 0; i < slideFiles.length; i++) {
    const xml = await zip.files[slideFiles[i]].async("string");
    const text = xml
      .replace(/<a:t>/g, " ")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (text.length > 0) {
      chunks.push({ text, metadata: { page: i + 1 } });
    }
  }

  return chunks;
}
