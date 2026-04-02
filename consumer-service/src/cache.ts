import Redis from "ioredis";

import type { SentimentLabel } from "../../shared/types/sentiment";

export class SentimentCache {
  private readonly redis: Redis;

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });
  }

  async connect(): Promise<void> {
    await this.redis.connect();
  }

  async disconnect(): Promise<void> {
    await this.redis.quit();
  }

  async get(textHash: string): Promise<SentimentLabel | null> {
    const value = await this.redis.get(this.buildKey(textHash));
    return isSentimentLabel(value) ? value : null;
  }

  async set(textHash: string, sentiment: SentimentLabel): Promise<void> {
    await this.redis.set(this.buildKey(textHash), sentiment);
  }

  private buildKey(textHash: string): string {
    return `sentiment:${textHash}`;
  }
}

function isSentimentLabel(value: string | null): value is SentimentLabel {
  return value === "positive" || value === "neutral" || value === "negative";
}
