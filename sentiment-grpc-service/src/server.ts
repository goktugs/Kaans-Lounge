import path from "node:path";

import {
  Server,
  ServerCredentials,
  loadPackageDefinition,
  status,
  type ServerUnaryCall,
  type sendUnaryData,
  type ServiceDefinition,
  type UntypedServiceImplementation,
} from "@grpc/grpc-js";
import { loadSync } from "@grpc/proto-loader";

import { loadConfig } from "./config";
import {
  InvalidRequestError,
  RateLimitError,
  SentimentEngine,
  TransientSentimentError,
} from "./sentiment-engine";
import type { AnalyzeSentimentResult } from "../../shared/types/sentiment";

interface AnalyzeSentimentRequest {
  text?: string;
  textHash?: string;
}

interface SentimentGrpcPackage {
  sentiment: {
    SentimentService: {
      service: ServiceDefinition<UntypedServiceImplementation>;
    };
  };
}

const protoPath = path.resolve(process.cwd(), "../shared/proto/sentiment.proto");

export async function startServer(): Promise<void> {
  const config = loadConfig();
  const packageDefinition = loadSync(protoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });
  const grpcPackage = loadPackageDefinition(
    packageDefinition,
  ) as unknown as SentimentGrpcPackage;
  const sentimentEngine = new SentimentEngine(config);
  const server = new Server();

  server.addService(grpcPackage.sentiment.SentimentService.service, {
    analyzeSentiment: async (
      call: ServerUnaryCall<AnalyzeSentimentRequest, AnalyzeSentimentResult>,
      callback: sendUnaryData<AnalyzeSentimentResult>,
    ) => {
      try {
        const result = await sentimentEngine.analyze(call.request);
        console.log(
          JSON.stringify({
            level: "info",
            message: "Sentiment analyzed",
            textHash: result.textHash,
            sentiment: result.sentiment,
            processingDelayMs: result.processingDelayMs,
          }),
        );
        callback(null, result);
      } catch (error) {
        callback(mapError(error), null);
      }
    },
  });

  await new Promise<void>((resolve, reject) => {
    server.bindAsync(
      `0.0.0.0:${config.port}`,
      ServerCredentials.createInsecure(),
      (error) => {
        if (error) {
          reject(error);
          return;
        }

        server.start();
        console.log(
          JSON.stringify({
            level: "info",
            message: "Sentiment gRPC server started",
            port: config.port,
            rateLimitPerSec: config.rateLimitPerSec,
            failureRate: config.failureRate,
            baseDelayMs: config.baseDelayMs,
          }),
        );
        resolve();
      },
    );
  });
}

function mapError(error: unknown) {
  if (error instanceof InvalidRequestError) {
    console.error(
      JSON.stringify({ level: "error", message: error.message, code: "INVALID_ARGUMENT" }),
    );
    return { code: status.INVALID_ARGUMENT, message: error.message };
  }

  if (error instanceof RateLimitError) {
    console.error(
      JSON.stringify({ level: "error", message: error.message, code: "RESOURCE_EXHAUSTED" }),
    );
    return { code: status.RESOURCE_EXHAUSTED, message: error.message };
  }

  if (error instanceof TransientSentimentError) {
    console.error(
      JSON.stringify({ level: "error", message: error.message, code: "UNAVAILABLE" }),
    );
    return { code: status.UNAVAILABLE, message: error.message };
  }

  const message = error instanceof Error ? error.message : "Unknown gRPC error";
  console.error(JSON.stringify({ level: "error", message, code: "INTERNAL" }));
  return { code: status.INTERNAL, message };
}
