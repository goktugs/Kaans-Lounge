import {
  Collection,
  MongoClient,
  MongoServerError,
  type Document,
  type IndexDescription,
} from "mongodb";

import type { ProcessedCommentRecord } from "../../shared/types/processed-comment";

export class CommentRepository {
  private readonly client: MongoClient;
  private readonly databaseName: string;
  private collection?: Collection<ProcessedCommentDocument>;

  constructor(mongodbUri: string, databaseName: string) {
    this.client = new MongoClient(mongodbUri);
    this.databaseName = databaseName;
  }

  async connect(): Promise<void> {
    await this.client.connect();
    this.collection = this.client
      .db(this.databaseName)
      .collection<ProcessedCommentDocument>("processed_comments");

    await this.collection.createIndexes([
      { key: { commentId: 1 }, unique: true, name: "commentId_unique" },
      { key: { textHash: 1 }, name: "textHash_index" },
      { key: { createdAt: -1 }, name: "createdAt_desc" },
    ] satisfies IndexDescription[]);
  }

  async disconnect(): Promise<void> {
    await this.client.close();
  }

  async save(record: ProcessedCommentRecord): Promise<void> {
    const collection = this.getCollection();

    try {
      await collection.updateOne(
        { commentId: record.commentId },
        {
          $set: {
            text: record.text,
            textHash: record.textHash,
            sentiment: record.sentiment,
            status: record.status,
            createdAt: record.createdAt,
            analyzedAt: record.analyzedAt,
            retryCount: record.retryCount,
            source: record.source,
          },
        },
        { upsert: true },
      );
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        return;
      }

      throw error;
    }
  }

  private getCollection(): Collection<ProcessedCommentDocument> {
    if (!this.collection) {
      throw new Error("Comment repository is not connected");
    }

    return this.collection;
  }
}

interface ProcessedCommentDocument extends Document, ProcessedCommentRecord {}

function isDuplicateKeyError(error: unknown): boolean {
  return error instanceof MongoServerError && error.code === 11000;
}
