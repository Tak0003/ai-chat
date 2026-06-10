import { getDocumentsCollection } from "@/lib/mongodb";
import { embedQuery } from "./embeddings";

const TOP_K = 5;

export async function retrieveContext(query: string): Promise<string> {
  const queryEmbedding = await embedQuery(query);
  const documents = await getDocumentsCollection();

  const results = await documents
    .aggregate([
      {
        $vectorSearch: {
          index: "vector_index",
          path: "chunks.embedding",
          queryVector: queryEmbedding,
          numCandidates: TOP_K * 10,
          limit: TOP_K,
        },
      },
      {
        $project: {
          _id: 0,
          name: 1,
          "chunks.text": 1,
          score: { $meta: "vectorSearchScore" },
        },
      },
    ])
    .toArray();

  if (results.length === 0) return "";

  const contextParts = results.map((r, i) => {
    const chunkText = Array.isArray(r.chunks)
      ? r.chunks.map((c: { text: string }) => c.text).join("\n")
      : "";
    return `【参考資料 ${i + 1}: ${r.name}】\n${chunkText}`;
  });

  return contextParts.join("\n\n---\n\n");
}
