import type { SentimentLabel } from "../types/sentiment";

export const SENTIMENT_LABELS: SentimentLabel[] = [
  "positive",
  "neutral",
  "negative",
];

export const DEFAULT_GRPC_PORT = 50051;
export const DEFAULT_GRPC_BASE_DELAY_MS = 250;
export const DEFAULT_GRPC_RATE_LIMIT_PER_SEC = 5;
export const DEFAULT_GRPC_FAILURE_RATE = 0.1;
