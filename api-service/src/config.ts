function readNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export interface ApiConfig {
  port: number;
  mongodbUri: string;
  mongodbDatabase: string;
}

export function loadConfig(): ApiConfig {
  return {
    port: Math.max(1, Math.floor(readNumber(process.env.API_PORT, 3000))),
    mongodbUri: process.env.MONGODB_URI || "mongodb://localhost:27017/kaans-lounge",
    mongodbDatabase: process.env.MONGODB_DB || "kaans-lounge",
  };
}
