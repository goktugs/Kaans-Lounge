import {
  DEFAULT_KAFKA_BROKERS,
  DEFAULT_RAW_COMMENTS_TOPIC,
} from "../../shared/constants/kafka";
import type { ProducerConfig } from "./types/config";

function readNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function loadConfig(): ProducerConfig {
  const generationMinMs = Math.max(
    100,
    readNumber(process.env.COMMENT_GENERATION_MIN_MS, 1000),
  );
  const generationMaxMs = Math.max(
    generationMinMs,
    readNumber(process.env.COMMENT_GENERATION_MAX_MS, 4000),
  );

  return {
    kafkaBrokers: (process.env.KAFKA_BROKERS || DEFAULT_KAFKA_BROKERS)
      .split(",")
      .map((broker) => broker.trim())
      .filter(Boolean),
    rawCommentsTopic: process.env.RAW_COMMENTS_TOPIC || DEFAULT_RAW_COMMENTS_TOPIC,
    generationMinMs,
    generationMaxMs,
  };
}
