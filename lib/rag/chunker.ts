const CHUNK_SIZE = 600;
const CHUNK_OVERLAP = 100;

export function chunkText(text: string): string[] {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n");
  const sentences = normalized.split(/(?<=。|？|！|\n\n)/);

  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if ((current + sentence).length > CHUNK_SIZE && current.length > 0) {
      chunks.push(current.trim());
      // オーバーラップ: 末尾 CHUNK_OVERLAP 文字を次のチャンクの先頭に引き継ぐ
      current = current.slice(-CHUNK_OVERLAP) + sentence;
    } else {
      current += sentence;
    }
  }

  if (current.trim().length > 0) {
    chunks.push(current.trim());
  }

  return chunks.filter((c) => c.length > 0);
}
