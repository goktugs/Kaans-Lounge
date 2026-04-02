import type { SentimentLabel } from "./sentiment";

export type ProcessingStatus = "processed" | "pending" | "failed";

export interface ProcessedCommentRecord {
  commentId: string;
  text: string;
  textHash: string;
  sentiment: SentimentLabel | null;
  status: ProcessingStatus;
  createdAt: string;
  analyzedAt: string | null;
  retryCount: number;
  source: "cache" | "grpc" | "none";
}
