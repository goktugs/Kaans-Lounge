import path from "node:path";

import {
  credentials,
  loadPackageDefinition,
  status,
  type ServiceError,
} from "@grpc/grpc-js";
import { loadSync } from "@grpc/proto-loader";

import type { AnalyzeSentimentResult, SentimentLabel } from "../../shared/types/sentiment";

type ChannelCredentials = ReturnType<typeof credentials.createInsecure>;

interface AnalyzeSentimentRequest {
  text: string;
  textHash: string;
}

interface SentimentServiceClient {
  AnalyzeSentiment(
    request: AnalyzeSentimentRequest,
    callback: (error: ServiceError | null, response: AnalyzeSentimentResult) => void,
  ): void;
}

interface SentimentGrpcPackage {
  sentiment: {
    SentimentService: new (address: string, credentials: ChannelCredentials) => SentimentServiceClient;
  };
}

export class RetryableGrpcError extends Error {
  constructor(
    message: string,
    readonly code: number,
  ) {
    super(message);
    this.name = "RetryableGrpcError";
  }
}

export class NonRetryableGrpcError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NonRetryableGrpcError";
  }
}

export class SentimentGrpcClient {
  private readonly client: SentimentServiceClient;

  constructor(address: string) {
    const protoPath = path.resolve(process.cwd(), "../shared/proto/sentiment.proto");
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

    this.client = new grpcPackage.sentiment.SentimentService(
      address,
      credentials.createInsecure(),
    );
  }

  async analyze(text: string, textHash: string): Promise<SentimentLabel> {
    const response = await new Promise<AnalyzeSentimentResult>((resolve, reject) => {
      this.client.AnalyzeSentiment({ text, textHash }, (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      });
    }).catch((error: ServiceError) => {
      if (error.code === status.RESOURCE_EXHAUSTED || error.code === status.UNAVAILABLE) {
        throw new RetryableGrpcError(error.message, error.code);
      }

      throw new NonRetryableGrpcError(error.message);
    });

    return response.sentiment;
  }
}
