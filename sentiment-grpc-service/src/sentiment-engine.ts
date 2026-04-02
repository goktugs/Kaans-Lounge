import type {
  AnalyzeSentimentInput,
  AnalyzeSentimentResult,
  SentimentLabel,
} from "../../shared/types/sentiment";
import { SENTIMENT_LABELS } from "../../shared/constants/sentiment";
import { createTextHash } from "../../shared/utils/text-hash";

export class RateLimitError extends Error {
  constructor(message = "Rate limit exceeded") {
    super(message);
    this.name = "RateLimitError";
  }
}

export class InvalidRequestError extends Error {
  constructor(message = "Either text or textHash is required") {
    super(message);
    this.name = "InvalidRequestError";
  }
}

export class TransientSentimentError extends Error {
  constructor(message = "Transient sentiment processing failure") {
    super(message);
    this.name = "TransientSentimentError";
  }
}

interface SentimentEngineOptions {
  rateLimitPerSec: number;
  failureRate: number;
  baseDelayMs: number;
}

export class SentimentEngine {
  private readonly rateLimitPerSec: number;
  private readonly failureRate: number;
  private readonly baseDelayMs: number;
  private currentWindowStartedAt = 0;
  private requestsInWindow = 0;

  constructor(options: SentimentEngineOptions) {
    this.rateLimitPerSec = options.rateLimitPerSec;
    this.failureRate = options.failureRate;
    this.baseDelayMs = options.baseDelayMs;
  }

  async analyze(input: AnalyzeSentimentInput): Promise<AnalyzeSentimentResult> {
    const text = input.text?.trim();
    const textHash = input.textHash?.trim() || (text ? createTextHash(text) : "");

    if (!textHash) {
      throw new InvalidRequestError();
    }

    this.enforceRateLimit();

    const processingDelayMs = this.computeDelayMs(text);
    await sleep(processingDelayMs);

    if (this.shouldFail(textHash)) {
      throw new TransientSentimentError();
    }

    return {
      textHash,
      sentiment: this.resolveSentiment(textHash),
      processingDelayMs,
      cacheable: true,
    };
  }

  private enforceRateLimit(): void {
    const now = Date.now();

    if (now - this.currentWindowStartedAt >= 1000) {
      this.currentWindowStartedAt = now;
      this.requestsInWindow = 0;
    }

    this.requestsInWindow += 1;

    if (this.requestsInWindow > this.rateLimitPerSec) {
      throw new RateLimitError();
    }
  }

  private computeDelayMs(text: string | undefined): number {
    const textLength = text?.length ?? 12;
    const variableDelay = Math.min(2000, textLength * 15);

    return this.baseDelayMs + variableDelay;
  }

  private shouldFail(textHash: string): boolean {
    const score = this.readDeterministicScore(textHash);
    return score < this.failureRate;
  }

  private resolveSentiment(textHash: string): SentimentLabel {
    const score = this.readDeterministicScore(textHash);
    const index = Math.min(
      SENTIMENT_LABELS.length - 1,
      Math.floor(score * SENTIMENT_LABELS.length),
    );

    return SENTIMENT_LABELS[index];
  }

  private readDeterministicScore(textHash: string): number {
    const sample = textHash.slice(0, 8);
    const numeric = Number.parseInt(sample, 16);

    return numeric / 0xffffffff;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
