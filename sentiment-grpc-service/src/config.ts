import {
  DEFAULT_GRPC_BASE_DELAY_MS,
  DEFAULT_GRPC_FAILURE_RATE,
  DEFAULT_GRPC_PORT,
  DEFAULT_GRPC_RATE_LIMIT_PER_SEC,
} from "../../shared/constants/sentiment";

function readNumber(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export interface SentimentGrpcConfig {
  port: number;
  rateLimitPerSec: number;
  failureRate: number;
  baseDelayMs: number;
}

export function loadConfig(): SentimentGrpcConfig {
  return {
    port: readNumber(process.env.GRPC_PORT, DEFAULT_GRPC_PORT),
    rateLimitPerSec: Math.max(
      1,
      Math.floor(
        readNumber(
          process.env.GRPC_RATE_LIMIT_PER_SEC,
          DEFAULT_GRPC_RATE_LIMIT_PER_SEC,
        ),
      ),
    ),
    failureRate: Math.min(
      1,
      Math.max(
        0,
        readNumber(process.env.GRPC_FAILURE_RATE, DEFAULT_GRPC_FAILURE_RATE),
      ),
    ),
    baseDelayMs: Math.max(
      0,
      Math.floor(
        readNumber(process.env.GRPC_BASE_DELAY_MS, DEFAULT_GRPC_BASE_DELAY_MS),
      ),
    ),
  };
}
