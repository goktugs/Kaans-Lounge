export type SentimentLabel = "positive" | "neutral" | "negative";

export interface AnalyzeSentimentInput {
  text?: string;
  textHash?: string;
}

export interface AnalyzeSentimentResult {
  textHash: string;
  sentiment: SentimentLabel;
  processingDelayMs: number;
  cacheable: boolean;
}
