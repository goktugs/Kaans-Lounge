import { Kafka, logLevel, type Consumer, type EachMessagePayload } from "kafkajs";

import type { RawCommentMessage } from "../../shared/types/comment";
import type { ConsumerConfig } from "./config";

export class RawCommentsConsumer {
  private readonly consumer: Consumer;
  private readonly topic: string;

  constructor(config: ConsumerConfig) {
    const kafka = new Kafka({
      clientId: "consumer-service",
      brokers: config.kafkaBrokers,
      logLevel: logLevel.NOTHING,
    });

    this.consumer = kafka.consumer({ groupId: "consumer-service-group" });
    this.topic = config.rawCommentsTopic;
  }

  async connect(): Promise<void> {
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: this.topic, fromBeginning: true });
  }

  async run(onMessage: (message: RawCommentMessage) => Promise<void>): Promise<void> {
    await this.consumer.run({
      eachMessage: async ({ message }: EachMessagePayload) => {
        if (!message.value) {
          return;
        }

        const payload = JSON.parse(message.value.toString()) as RawCommentMessage;
        await onMessage(payload);
      },
    });
  }

  async disconnect(): Promise<void> {
    await this.consumer.disconnect();
  }
}
