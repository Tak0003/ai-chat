import { VoyageAIClient } from "voyageai";

const client = new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY! });

const BATCH_SIZE = 20;

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const res = await client.embed({
      input: batch,
      model: "voyage-3",
    });
    const batchEmbeddings = res.data?.map((d) => d.embedding ?? []) ?? [];
    embeddings.push(...batchEmbeddings);
  }

  return embeddings;
}

export async function embedQuery(text: string): Promise<number[]> {
  const res = await client.embed({
    input: [text],
    model: "voyage-3",
  });
  return res.data?.[0]?.embedding ?? [];
}
