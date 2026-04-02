import { CommentGenerator } from "./comment-generator";
import { loadConfig } from "./config";
import { RawCommentsProducer } from "./kafka-producer";

const config = loadConfig();
const commentGenerator = new CommentGenerator();
const rawCommentsProducer = new RawCommentsProducer(config);

void start().catch((error) => {
  const message = (error as { message?: string }).message || "Producer service failed";
  console.error(JSON.stringify({ level: "error", message }));
  process.exitCode = 1;
});

async function start(): Promise<void> {
  await rawCommentsProducer.connect();

  console.log(
    JSON.stringify({
      level: "info",
      message: "Producer service started",
      rawCommentsTopic: config.rawCommentsTopic,
      kafkaBrokers: config.kafkaBrokers,
      generationMinMs: config.generationMinMs,
      generationMaxMs: config.generationMaxMs,
    }),
  );

  scheduleNextPublish();

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

function scheduleNextPublish(): void {
  const delayMs = randomInt(config.generationMinMs, config.generationMaxMs);

  setTimeout(async () => {
    const comment = commentGenerator.generate();

    try {
      await rawCommentsProducer.publish(comment);
      console.log(
        JSON.stringify({
          level: "info",
          message: "Raw comment published",
          commentId: comment.commentId,
          textHash: comment.textHash,
          createdAt: comment.createdAt,
        }),
      );
    } catch (error) {
      const message = (error as { message?: string }).message || "Failed to publish comment";
      console.error(JSON.stringify({ level: "error", message }));
    }

    scheduleNextPublish();
  }, delayMs);
}

function randomInt(min: number, max: number): number {
  const range = max - min + 1;
  return min + Math.floor(Math.random() * range);
}

async function shutdown(): Promise<void> {
  await rawCommentsProducer.disconnect();
  process.exit(0);
}
