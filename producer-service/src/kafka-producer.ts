import { Kafka, logLevel, type Producer } from "kafkajs";

import type { RawCommentMessage } from "../../shared/types/comment";
import type { ProducerConfig } from "./config";

export class RawCommentsProducer {
  private readonly producer: Producer;
  private readonly topic: string;

  constructor(config: ProducerConfig) {
    const kafka = new Kafka({
      clientId: "producer-service",
      brokers: config.kafkaBrokers,
      logLevel: logLevel.NOTHING,
    });

    this.producer = kafka.producer();
    this.topic = config.rawCommentsTopic;
  }

  async connect(): Promise<void> {
    await this.producer.connect();
  }

  async publish(comment: RawCommentMessage): Promise<void> {
    await this.producer.send({
      topic: this.topic,
      messages: [
        {
          key: comment.commentId,
          value: JSON.stringify(comment),
        },
      ],
    });
  }

  async disconnect(): Promise<void> {
    await this.producer.disconnect();
  }
}
