import { SentimentCache } from "./cache";
import { CommentRepository } from "./comment-repository";
import { loadConfig } from "./config";
import { DeduplicationStore } from "./deduplication-store";
import { SentimentGrpcClient } from "./grpc-client";
import { RawCommentsConsumer } from "./kafka-consumer";
import { CommentProcessor } from "./processor";
import { ProcessedCommentsProducer } from "./processed-comments-producer";

const config = loadConfig();
const cache = new SentimentCache(config.redisUrl);
const commentRepository = new CommentRepository(config.mongodbUri, config.mongodbDatabase);
const deduplicationStore = new DeduplicationStore();
const grpcClient = new SentimentGrpcClient(config.grpcSentimentHost);
const rawCommentsConsumer = new RawCommentsConsumer(config);
const processedCommentsProducer = new ProcessedCommentsProducer(config);
const processor = new CommentProcessor({
  config,
  cache,
  deduplicationStore,
  grpcClient,
});

void start().catch((error) => {
  const message = (error as { message?: string }).message || "Consumer service failed";
  console.error(JSON.stringify({ level: "error", message }));
  process.exitCode = 1;
});

async function start(): Promise<void> {
  await cache.connect();
  await commentRepository.connect();
  await rawCommentsConsumer.connect();
  await processedCommentsProducer.connect();

  console.log(
    JSON.stringify({
      level: "info",
      message: "Consumer service started",
      rawCommentsTopic: config.rawCommentsTopic,
      processedCommentsTopic: config.processedCommentsTopic,
      kafkaBrokers: config.kafkaBrokers,
      redisUrl: config.redisUrl,
      mongodbUri: config.mongodbUri,
      mongodbDatabase: config.mongodbDatabase,
      grpcSentimentHost: config.grpcSentimentHost,
      maxRetries: config.maxRetries,
      retryBackoffMs: config.retryBackoffMs,
    }),
  );

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  await rawCommentsConsumer.run(async (comment) => {
    const processedComment = await processor.process(comment);

    if (!processedComment) {
      return;
    }

    await commentRepository.save(processedComment);
    await processedCommentsProducer.publish(processedComment);

    console.log(
      JSON.stringify({
        level: "info",
        message: "Comment processed, persisted, and published",
        commentId: processedComment.commentId,
        textHash: processedComment.textHash,
        status: processedComment.status,
        retryCount: processedComment.retryCount,
        source: processedComment.source,
      }),
    );
  });
}

async function shutdown(): Promise<void> {
  await rawCommentsConsumer.disconnect();
  await processedCommentsProducer.disconnect();
  await commentRepository.disconnect();
  await cache.disconnect();
  process.exit(0);
}
