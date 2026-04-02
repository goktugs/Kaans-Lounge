import type { RawCommentMessage } from "../../shared/types/comment";
import type { ProcessedCommentRecord } from "../../shared/types/processed-comment";
import type { SentimentLabel } from "../../shared/types/sentiment";
import type { ConsumerConfig } from "./config";
import { SentimentCache } from "./cache";
import { DeduplicationStore } from "./deduplication-store";
import {
  NonRetryableGrpcError,
  RetryableGrpcError,
  SentimentGrpcClient,
} from "./grpc-client";

interface CommentProcessorDependencies {
  config: ConsumerConfig;
  cache: SentimentCache;
  deduplicationStore: DeduplicationStore;
  grpcClient: SentimentGrpcClient;
}

export class CommentProcessor {
  private readonly config: ConsumerConfig;
  private readonly cache: SentimentCache;
  private readonly deduplicationStore: DeduplicationStore;
  private readonly grpcClient: SentimentGrpcClient;

  constructor(dependencies: CommentProcessorDependencies) {
    this.config = dependencies.config;
    this.cache = dependencies.cache;
    this.deduplicationStore = dependencies.deduplicationStore;
    this.grpcClient = dependencies.grpcClient;
  }

  async process(comment: RawCommentMessage): Promise<ProcessedCommentRecord | null> {
    if (this.deduplicationStore.has(comment.commentId)) {
      console.log(
        JSON.stringify({
          level: "info",
          message: "Skipping duplicate comment",
          commentId: comment.commentId,
        }),
      );
      return null;
    }

    const cachedSentiment = await this.cache.get(comment.textHash);

    if (cachedSentiment) {
      this.deduplicationStore.mark(comment.commentId);
      return this.buildRecord(comment, {
        sentiment: cachedSentiment,
        status: "processed",
        retryCount: 0,
        analyzedAt: new Date().toISOString(),
        source: "cache",
      });
    }

    const grpcResult = await this.analyzeWithRetry(comment);
    this.deduplicationStore.mark(comment.commentId);

    if (grpcResult.sentiment) {
      await this.cache.set(comment.textHash, grpcResult.sentiment);
    }

    return this.buildRecord(comment, grpcResult);
  }

  private async analyzeWithRetry(
    comment: RawCommentMessage,
  ): Promise<Pick<ProcessedCommentRecord, "sentiment" | "status" | "retryCount" | "analyzedAt" | "source">> {
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt += 1) {
      try {
        const sentiment = await this.grpcClient.analyze(comment.text, comment.textHash);
        return {
          sentiment,
          status: "processed",
          retryCount: attempt,
          analyzedAt: new Date().toISOString(),
          source: "grpc",
        };
      } catch (error) {
        if (error instanceof NonRetryableGrpcError) {
          return {
            sentiment: null,
            status: "failed",
            retryCount: attempt,
            analyzedAt: new Date().toISOString(),
            source: "none",
          };
        }

        if (error instanceof RetryableGrpcError && attempt < this.config.maxRetries) {
          await sleep(this.config.retryBackoffMs * (attempt + 1));
          continue;
        }

        return {
          sentiment: null,
          status: error instanceof RetryableGrpcError ? "pending" : "failed",
          retryCount: attempt,
          analyzedAt: null,
          source: "none",
        };
      }
    }

    return {
      sentiment: null,
      status: "failed",
      retryCount: this.config.maxRetries,
      analyzedAt: null,
      source: "none",
    };
  }

  private buildRecord(
    comment: RawCommentMessage,
    result: {
      sentiment: SentimentLabel | null;
      status: ProcessedCommentRecord["status"];
      retryCount: number;
      analyzedAt: string | null;
      source: ProcessedCommentRecord["source"];
    },
  ): ProcessedCommentRecord {
    return {
      commentId: comment.commentId,
      text: comment.text,
      textHash: comment.textHash,
      sentiment: result.sentiment,
      status: result.status,
      createdAt: comment.createdAt,
      analyzedAt: result.analyzedAt,
      retryCount: result.retryCount,
      source: result.source,
    };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
