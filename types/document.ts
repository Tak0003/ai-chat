import { ObjectId } from "mongodb";

export type SourceType = "pdf" | "markdown" | "url" | "office";

export interface ChunkMetadata {
  page?: number;
  section?: string;
}

export interface DocumentChunk {
  text: string;
  embedding: number[];
  metadata: ChunkMetadata;
}

export interface Document {
  _id?: ObjectId;
  name: string;
  sourceType: SourceType;
  chunks: DocumentChunk[];
  createdAt: Date;
}

export interface DocumentSummary {
  _id: string;
  name: string;
  sourceType: SourceType;
  chunkCount: number;
  createdAt: Date;
}
