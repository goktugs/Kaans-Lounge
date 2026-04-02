import express, { type Request, type Response } from "express";

import { loadConfig } from "./config";
import { CommentsRepository } from "./comments-repository";

const config = loadConfig();
const repository = new CommentsRepository(config.mongodbUri, config.mongodbDatabase);
const app = express();
const apiV1 = express.Router();

void start().catch((error) => {
  const message = (error as { message?: string }).message || "API service failed";
  console.error(JSON.stringify({ level: "error", message }));
  process.exitCode = 1;
});

async function start(): Promise<void> {
  await repository.connect();

  apiV1.get("/comments", async (request, response) => {
    const page = clampPositiveInteger(request.query.page, 1);
    const limit = clampPositiveInteger(request.query.limit, 20, 100);

    const result = await repository.list({
      sentiment: readSentiment(request.query.sentiment),
      status: readStatus(request.query.status),
      from: readString(request.query.from),
      to: readString(request.query.to),
      page,
      limit,
    });

    console.log(
      JSON.stringify({
        level: "info",
        message: "Comments listed",
        page,
        limit,
        total: result.total,
      }),
    );

    response.json(result);
  });

  apiV1.get("/comments/:commentId", async (request, response) => {
    const comment = await repository.findByCommentId(request.params.commentId);

    if (!comment) {
      console.log(
        JSON.stringify({
          level: "info",
          message: "Comment not found",
          commentId: request.params.commentId,
        }),
      );

      response.status(404).json({ message: "Comment not found" });
      return;
    }

    console.log(
      JSON.stringify({
        level: "info",
        message: "Comment returned",
        commentId: comment.commentId,
      }),
    );

    response.json(comment);
  });

  app.use("/api/v1", apiV1);

  const server = app.listen(config.port, () => {
    console.log(
      JSON.stringify({
        level: "info",
        message: "API service started",
        port: config.port,
        basePath: "/api/v1",
        mongodbUri: config.mongodbUri,
        mongodbDatabase: config.mongodbDatabase,
      }),
    );
  });

  const shutdown = async () => {
    server.close();
    await repository.disconnect();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

function clampPositiveInteger(
  value: Request["query"][string],
  fallback: number,
  max = Number.MAX_SAFE_INTEGER,
): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(Math.floor(parsed), max);
}

function readString(value: Request["query"][string]): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function readSentiment(value: Request["query"][string]) {
  return value === "positive" || value === "neutral" || value === "negative"
    ? value
    : undefined;
}

function readStatus(value: Request["query"][string]) {
  return value === "processed" || value === "pending" || value === "failed"
    ? value
    : undefined;
}
