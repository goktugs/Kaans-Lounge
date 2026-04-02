import { Kafka, logLevel, type Producer } from "kafkajs";

import type { ProcessedCommentRecord } from "../../shared/types/processed-comment";
import type { ConsumerConfig } from "./config";

export class ProcessedCommentsProducer {
  private readonly producer: Producer;
  private readonly topic: string;

  constructor(config: ConsumerConfig) {
    const kafka = new Kafka({
      clientId: "consumer-service-processed-producer",
      brokers: config.kafkaBrokers,
      logLevel: logLevel.NOTHING,
    });

    this.producer = kafka.producer();
    this.topic = config.processedCommentsTopic;
  }

  async connect(): Promise<void> {
    await this.producer.connect();
  }

  async publish(record: ProcessedCommentRecord): Promise<void> {
    await this.producer.send({
      topic: this.topic,
      messages: [
        {
          key: record.commentId,
          value: JSON.stringify(record),
        },
      ],
    });
  }

  async disconnect(): Promise<void> {
    await this.producer.disconnect();
  }
}
