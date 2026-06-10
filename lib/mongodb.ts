import { MongoClient, Collection } from "mongodb";
import type { Conversation } from "@/types/chat";
import type { Document } from "@/types/document";

const uri = process.env.MONGODB_URI!;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

// 開発時の Hot Reload で接続が重複しないようにグローバルキャッシュを使う
if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;

export async function getConversationsCollection(): Promise<Collection<Conversation>> {
  const client = await clientPromise;
  return client.db("ai-chat").collection<Conversation>("conversations");
}

export async function getDocumentsCollection(): Promise<Collection<Document>> {
  const client = await clientPromise;
  return client.db("ai-chat").collection<Document>("documents");
}
