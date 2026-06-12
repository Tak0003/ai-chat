import { MongoClient, Collection } from "mongodb";
import type { Conversation } from "@/types/chat";
import type { Document } from "@/types/document";

const uri = process.env.MONGODB_URI!;
const mongoOptions = { serverSelectionTimeoutMS: 10000 };

declare global {
  // eslint-disable-next-line no-var
  var _mongoClient: MongoClient | undefined;
}

// connect() を明示的に呼ばず、ドライバーに遅延接続させる
// → 失敗後もハートビートで自動再接続できる
function getMongoClient(): MongoClient {
  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClient) {
      global._mongoClient = new MongoClient(uri, mongoOptions);
    }
    return global._mongoClient;
  }
  if (!global._mongoClient) {
    global._mongoClient = new MongoClient(uri, mongoOptions);
  }
  return global._mongoClient;
}

export async function getConversationsCollection(): Promise<Collection<Conversation>> {
  const client = getMongoClient();
  return client.db("ai-chat").collection<Conversation>("conversations");
}

export async function getDocumentsCollection(): Promise<Collection<Document>> {
  const client = getMongoClient();
  return client.db("ai-chat").collection<Document>("documents");
}
