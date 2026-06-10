import * as cheerio from "cheerio";
import type { ChunkMetadata } from "@/types/document";

export interface ParsedChunk {
  text: string;
  metadata: ChunkMetadata;
}

export async function parseUrl(url: string): Promise<ParsedChunk[]> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; AI-Chat-Bot/1.0)" },
  });

  if (!res.ok) {
    throw new Error(`URL の取得に失敗しました: ${res.status} ${res.statusText}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  // 不要タグを除去
  $("script, style, nav, footer, header, aside, iframe, noscript").remove();

  const title = $("title").text().trim();
  const body = $("body").text().replace(/\s+/g, " ").trim();

  return [
    {
      text: title ? `${title}\n\n${body}` : body,
      metadata: { section: title || url },
    },
  ];
}
