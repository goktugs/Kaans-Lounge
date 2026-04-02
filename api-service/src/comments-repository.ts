import {
  MongoClient,
  type Document,
  type Filter,
  type Sort,
  type WithId,
} from "mongodb";

import type {
  ProcessedCommentRecord,
} from "../../shared/types/processed-comment";
import type {
  ListCommentsParams,
  ListCommentsResult,
} from "./types/comments";

export class CommentsRepository {
  private readonly client: MongoClient;
  private readonly databaseName: string;

  constructor(mongodbUri: string, databaseName: string) {
    this.client = new MongoClient(mongodbUri);
    this.databaseName = databaseName;
  }

  async connect(): Promise<void> {
    await this.client.connect();
  }

  async disconnect(): Promise<void> {
    await this.client.close();
  }

  async list(params: ListCommentsParams): Promise<ListCommentsResult> {
    const collection = this.getCollection();
    const filter = buildFilter(params);
    const skip = (params.page - 1) * params.limit;
    const sort: Sort = { createdAt: -1 };

    const [items, total] = await Promise.all([
      collection.find(filter).sort(sort).skip(skip).limit(params.limit).toArray(),
      collection.countDocuments(filter),
    ]);

    return {
      items: items.map(mapDocument),
      page: params.page,
      limit: params.limit,
      total,
    };
  }

  async findByCommentId(commentId: string): Promise<ProcessedCommentRecord | null> {
    const collection = this.getCollection();
    const document = await collection.findOne({ commentId });

    return document ? mapDocument(document) : null;
  }

  private getCollection() {
    return this.client
      .db(this.databaseName)
      .collection<ProcessedCommentDocument>("processed_comments");
  }
}

interface ProcessedCommentDocument extends Document, ProcessedCommentRecord {}

function buildFilter(params: ListCommentsParams): Filter<ProcessedCommentDocument> {
  const filter: Filter<ProcessedCommentDocument> = {};

  if (params.sentiment) {
    filter.sentiment = params.sentiment;
  }

  if (params.status) {
    filter.status = params.status;
  }

  if (params.from || params.to) {
    filter.createdAt = {};

    if (params.from) {
      filter.createdAt.$gte = params.from;
    }

    if (params.to) {
      filter.createdAt.$lte = params.to;
    }
  }

  return filter;
}

function mapDocument(document: WithId<ProcessedCommentDocument>): ProcessedCommentRecord {
  return {
    commentId: document.commentId,
    text: document.text,
    textHash: document.textHash,
    sentiment: document.sentiment,
    status: document.status,
    createdAt: document.createdAt,
    analyzedAt: document.analyzedAt,
    retryCount: document.retryCount,
    source: document.source,
  };
}
