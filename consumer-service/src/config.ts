import { DEFAULT_KAFKA_BROKERS, DEFAULT_RAW_COMMENTS_TOPIC } from "../../shared/constants/kafka";

function readNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export interface ConsumerConfig {
  kafkaBrokers: string[];
  rawCommentsTopic: string;
  redisUrl: string;
  mongodbUri: string;
  mongodbDatabase: string;
  grpcSentimentHost: string;
  maxRetries: number;
  retryBackoffMs: number;
}

export function loadConfig(): ConsumerConfig {
  return {
    kafkaBrokers: (process.env.KAFKA_BROKERS || DEFAULT_KAFKA_BROKERS)
      .split(",")
      .map((broker) => broker.trim())
      .filter(Boolean),
    rawCommentsTopic: process.env.RAW_COMMENTS_TOPIC || DEFAULT_RAW_COMMENTS_TOPIC,
    redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
    mongodbUri: process.env.MONGODB_URI || "mongodb://localhost:27017/kaans-lounge",
    mongodbDatabase: process.env.MONGODB_DB || "kaans-lounge",
    grpcSentimentHost: process.env.GRPC_SENTIMENT_HOST || "localhost:50051",
    maxRetries: Math.max(0, Math.floor(readNumber(process.env.CONSUMER_MAX_RETRIES, 3))),
    retryBackoffMs: Math.max(
      100,
      Math.floor(readNumber(process.env.CONSUMER_RETRY_BACKOFF_MS, 500)),
    ),
  };
}
