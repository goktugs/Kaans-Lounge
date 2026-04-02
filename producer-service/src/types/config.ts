export interface ProducerConfig {
  kafkaBrokers: string[];
  rawCommentsTopic: string;
  generationMinMs: number;
  generationMaxMs: number;
}
